// content script（classic script）。chrome.scripting で動的に登録・注入される。
(async () => {
  // 拡張機能の再読み込みなどで再注入されたときは、古いインスタンスを停止させる
  const TAKEOVER_EVENT = "net-defender:takeover";
  document.dispatchEvent(new CustomEvent(TAKEOVER_EVENT));

  const [constants, domainUtils] = await Promise.all([
    import(chrome.runtime.getURL("shared/constants.js")),
    import(chrome.runtime.getURL("shared/domain.js")),
  ]);
  const {
    TIME_LIMIT_MINUTES,
    TARGET_DOMAINS,
    WHITELIST,
    WATCH_STATE,
    BREAK_RESET_MINUTES,
    loadSettings,
    loadWatchState,
    saveWatchState,
  } = constants;
  const { matchesDomain, matchesUrlPrefix } = domainUtils;

  const TICK_INTERVAL_MS = 1000;
  // 1回の計測で加算する最大時間（タブのスロットリング等で間隔が空いても過大に数えない）
  const MAX_TICK_GAP_MS = 2000;
  const BREAK_RESET_MS = BREAK_RESET_MINUTES * 60 * 1000;
  const MODAL_HOST_ID = "net-defender-modal-host";
  // YouTube の動画ページでチャンネルへのリンクを持つ要素（ホワイトリストのチャンネル判定用）
  const YOUTUBE_CHANNEL_LINK_SELECTORS = [
    "ytd-watch-metadata ytd-channel-name a[href]",
    "ytd-video-owner-renderer a[href]",
    "ytd-reel-video-renderer[is-active] ytd-channel-name a[href]",
  ].join(",");

  function isExtensionContextValid() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  class WatchGuard {
    constructor() {
      this.settings = null;
      this.timerId = null;
      this.isTicking = false;
      this.modalHost = null;
      this.isOpeningModal = false;
      this.pausedVideos = [];
      this.templateCache = null;

      this.tick = this.tick.bind(this);
      this.handleStorageChange = this.handleStorageChange.bind(this);
      this.handlePlay = this.handlePlay.bind(this);
      this.handleKeyEvent = this.handleKeyEvent.bind(this);
      this.destroy = this.destroy.bind(this);
    }

    async start() {
      this.settings = await loadSettings();

      chrome.storage.onChanged.addListener(this.handleStorageChange);
      document.addEventListener(TAKEOVER_EVENT, this.destroy, { once: true });
      // play イベントはバブリングしないためキャプチャで受け取る
      document.addEventListener("play", this.handlePlay, true);
      window.addEventListener("keydown", this.handleKeyEvent, true);
      window.addEventListener("keyup", this.handleKeyEvent, true);
      window.addEventListener("keypress", this.handleKeyEvent, true);

      this.timerId = setInterval(this.tick, TICK_INTERVAL_MS);
      this.syncModal(await loadWatchState());
    }

    destroy() {
      clearInterval(this.timerId);
      this.timerId = null;
      try {
        chrome.storage.onChanged.removeListener(this.handleStorageChange);
      } catch {
        // 拡張機能のコンテキストが無効になっている場合は無視
      }
      document.removeEventListener(TAKEOVER_EVENT, this.destroy);
      document.removeEventListener("play", this.handlePlay, true);
      window.removeEventListener("keydown", this.handleKeyEvent, true);
      window.removeEventListener("keyup", this.handleKeyEvent, true);
      window.removeEventListener("keypress", this.handleKeyEvent, true);
      this.removeModal();
    }

    get limitMs() {
      return this.settings[TIME_LIMIT_MINUTES] * 60 * 1000;
    }

    // ---- 対象ページの判定 ----

    isTargetPage() {
      if (!matchesDomain(location.hostname, this.settings[TARGET_DOMAINS])) return false;
      return !this.isWhitelisted();
    }

    isWhitelisted() {
      const whitelist = this.settings[WHITELIST];
      if (whitelist.length === 0) return false;
      const urls = [location.href, ...this.getChannelUrls()];
      return urls.some((url) => whitelist.some((entry) => matchesUrlPrefix(url, entry)));
    }

    // YouTube の動画ページでは、表示中の動画のチャンネルURLもホワイトリスト判定に使う
    getChannelUrls() {
      if (!matchesDomain(location.hostname, ["youtube.com"])) return [];
      return [...document.querySelectorAll(YOUTUBE_CHANNEL_LINK_SELECTORS)].map((a) => a.href);
    }

    hasPlayingVideo() {
      return [...document.querySelectorAll("video")].some(
        (video) => !video.paused && !video.ended && video.readyState > 2
      );
    }

    // ---- 計測 ----

    async tick() {
      if (!isExtensionContextValid()) {
        this.destroy();
        return;
      }
      if (this.isTicking) return;
      this.isTicking = true;
      try {
        // SPA の画面遷移（YouTube など）にも追従できるよう毎回判定する
        if (!this.isTargetPage()) {
          this.removeModal();
          return;
        }
        if (this.modalHost || this.isOpeningModal) return;
        // タブが表示されているか、裏で動画が再生されているときだけ数える
        if (document.visibilityState !== "visible" && !this.hasPlayingVideo()) return;

        const watchState = await this.recordTick();
        this.syncModal(watchState);
      } finally {
        this.isTicking = false;
      }
    }

    // 連続視聴時間を chrome.storage.local に加算する。
    // 前回計測（どのタブからでも）からの差分を足すので、複数タブで同時に開いていても二重に数えない。
    async recordTick() {
      const watchState = await loadWatchState();
      const now = Date.now();
      const gapMs = now - watchState.lastTickAt;

      let elapsedMs;
      if (gapMs < 0 || gapMs > BREAK_RESET_MS) {
        elapsedMs = 0; // 一定時間視聴が途切れていたら連続視聴とみなさない
      } else {
        elapsedMs = watchState.elapsedMs + Math.min(gapMs, MAX_TICK_GAP_MS);
      }

      const nextState = { elapsedMs, lastTickAt: now };
      await saveWatchState(nextState);
      return nextState;
    }

    // 視聴状態に合わせてモーダルを出し入れする（他のタブでの操作も反映される）
    syncModal(watchState) {
      if (!this.isTargetPage()) {
        this.removeModal();
        return;
      }
      const isOverLimit = watchState.elapsedMs >= this.limitMs;
      const isStale = Date.now() - watchState.lastTickAt > BREAK_RESET_MS;
      if (isOverLimit && !isStale) {
        this.showModal();
      } else {
        this.removeModal();
      }
    }

    async handleStorageChange(changes, areaName) {
      if (!isExtensionContextValid()) {
        this.destroy();
        return;
      }
      if (areaName === "sync") {
        this.settings = await loadSettings();
        this.syncModal(await loadWatchState());
      } else if (areaName === "local" && WATCH_STATE in changes) {
        this.syncModal(changes[WATCH_STATE].newValue ?? { elapsedMs: 0, lastTickAt: 0 });
      }
    }

    // ---- モーダル ----

    async loadTemplate() {
      if (!this.templateCache) {
        const [htmlText, cssText] = await Promise.all([
          fetch(chrome.runtime.getURL("content/content.html")).then((res) => res.text()),
          fetch(chrome.runtime.getURL("content/content.css")).then((res) => res.text()),
        ]);
        this.templateCache = { htmlText, cssText };
      }
      return this.templateCache;
    }

    async showModal() {
      if (this.modalHost || this.isOpeningModal) return;
      this.isOpeningModal = true;
      try {
        this.pauseVideos();
        // フルスクリーン要素はトップレイヤーに描画されモーダルが隠れるため解除する
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }

        const { htmlText, cssText } = await this.loadTemplate();

        const host = document.createElement("div");
        host.id = MODAL_HOST_ID;
        const shadowRoot = host.attachShadow({ mode: "open" });

        const styleElement = document.createElement("style");
        styleElement.textContent = cssText;
        shadowRoot.appendChild(styleElement);

        const wrapper = document.createElement("div");
        wrapper.innerHTML = htmlText.trim();
        shadowRoot.appendChild(wrapper);

        shadowRoot.getElementById("jsLimitMinutes").textContent =
          this.settings[TIME_LIMIT_MINUTES];
        const continueBtn = shadowRoot.getElementById("jsContinueBtn");
        continueBtn.addEventListener("click", () => this.continueWatching());

        document.documentElement.appendChild(host);
        this.modalHost = host;
        continueBtn.focus();
      } finally {
        this.isOpeningModal = false;
      }
    }

    removeModal() {
      this.modalHost?.remove();
      this.modalHost = null;
    }

    pauseVideos() {
      document.querySelectorAll("video").forEach((video) => {
        if (!video.paused) {
          this.pausedVideos.push(video);
          video.pause();
        }
      });
    }

    // モーダル表示中は動画の再生を許さない
    handlePlay(event) {
      if (this.modalHost && event.target instanceof HTMLVideoElement) {
        event.target.pause();
      }
    }

    // モーダル表示中はページ側のキーボードショートカット（スペースで再生など）を無効にする
    handleKeyEvent(event) {
      if (!this.modalHost) return;
      if (event.composedPath().includes(this.modalHost)) return;
      event.stopImmediatePropagation();
      event.preventDefault();
    }

    // 意識的なアクションで制限をリセットし、視聴を再開する。
    // storage の変更は他のタブにも通知され、そちらのモーダルも閉じる。
    async continueWatching() {
      const videosToResume = this.pausedVideos.filter((video) => video.isConnected);
      this.pausedVideos = [];
      this.removeModal();
      await saveWatchState({ elapsedMs: 0, lastTickAt: Date.now() });
      videosToResume.forEach((video) => video.play().catch(() => {}));
    }
  }

  const watchGuard = new WatchGuard();
  await watchGuard.start();
})();
