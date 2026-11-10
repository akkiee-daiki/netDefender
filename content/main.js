// content script は classic script のため、共通モジュールは dynamic import で読み込む
(async () => {
  const { TIME_LIMIT_MINUTES, TARGET_DOMAINS, WHITELIST, loadSettings } =
    await import(chrome.runtime.getURL("shared/constants.js"));

  const TICK_INTERVAL_MS = 1000;
  const MODAL_HOST_ID = "net-defender-modal-host";

  function normalizeDomain(domain) {
    return domain.toLowerCase().replace(/^www\./, "");
  }

  class WatchGuard {
    constructor() {
      this.settings = null;
      this.elapsedSeconds = 0;
      this.timerId = null;
      this.modalHost = null;
    }

    async init() {
      this.settings = await loadSettings();
      this.stopTimer();
      this.removeModal();
      this.elapsedSeconds = 0;

      if (!this.isTargetPage()) return;
      this.startTimer();
    }

    isTargetPage() {
      const currentDomain = normalizeDomain(location.hostname);
      const isTargetDomain = this.settings[TARGET_DOMAINS].some(
        (domain) => normalizeDomain(domain) === currentDomain
      );
      if (!isTargetDomain) return false;

      const isWhitelisted = this.settings[WHITELIST].some((prefix) =>
        location.href.startsWith(prefix)
      );
      return !isWhitelisted;
    }

    startTimer() {
      if (this.timerId !== null) return; // 多重起動しない
      const limitSeconds = this.settings[TIME_LIMIT_MINUTES] * 60;

      this.timerId = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        this.elapsedSeconds += 1;
        if (this.elapsedSeconds >= limitSeconds) {
          this.showModal();
        }
      }, TICK_INTERVAL_MS);
    }

    stopTimer() {
      if (this.timerId === null) return;
      clearInterval(this.timerId);
      this.timerId = null;
    }

    async showModal() {
      this.stopTimer();
      this.pauseVideos();
      if (this.modalHost) return;

      const [htmlText, cssText] = await Promise.all([
        fetch(chrome.runtime.getURL("content/content.html")).then((res) => res.text()),
        fetch(chrome.runtime.getURL("content/content.css")).then((res) => res.text()),
      ]);

      const host = document.createElement("div");
      host.id = MODAL_HOST_ID;
      const shadowRoot = host.attachShadow({ mode: "open" });

      const styleElement = document.createElement("style");
      styleElement.textContent = cssText;
      shadowRoot.appendChild(styleElement);

      const wrapper = document.createElement("div");
      wrapper.innerHTML = htmlText.trim();
      shadowRoot.appendChild(wrapper);

      const continueBtn = shadowRoot.getElementById("jsContinueBtn");
      continueBtn.addEventListener("click", () => this.continueWatching());

      document.documentElement.appendChild(host);
      this.modalHost = host;
      continueBtn.focus();
    }

    removeModal() {
      this.modalHost?.remove();
      this.modalHost = null;
    }

    pauseVideos() {
      document.querySelectorAll("video").forEach((video) => video.pause());
    }

    // 意識的なアクションで制限をリセットして計測を再開する
    continueWatching() {
      this.removeModal();
      this.elapsedSeconds = 0;
      this.startTimer();
    }
  }

  const watchGuard = new WatchGuard();

  // 設定画面で保存されたら即時に再評価する
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    watchGuard.init();
  });

  watchGuard.init();
})();
