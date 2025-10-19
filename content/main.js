(() => {
  async function run() {
    try {
      document.getElementById("jsNetDefModal")?.remove();

      const jsonFile = chrome.runtime.getURL("content/allowedUrl.json");
      const jsonData = await fetch(jsonFile).then((res) => res.json());
      const htmlFile = chrome.runtime.getURL("content/content.html");
      const htmlText = await fetch(htmlFile).then((res) => res.text());
      const cssFile = chrome.runtime.getURL("content/content.css");
      const cssText = await fetch(cssFile).then((res) => res.text());

      const bodyTag = document.getElementsByTagName("body")[0];
      let nfCloseBtnHiddenTime = 10000;
      let defenseSiteDomainList = [
        "example.com",
        "www.youtube.com",
        "www.amazon.co.jp",
      ];

      let currentUri = new URL(window.location.href);
      let currentDomain = currentUri.hostname;
      let currentHref = currentUri.href;

      // 許可されているYouTube等のURLを修正(playListなど(YouTube APIから取得))
      let allowedTitleAndUrlList = jsonData.allowedWebPageList;

      let allowedTitleList = [];
      allowedTitleAndUrlList.forEach((value) =>
        allowedTitleList.push(value["title"] + " - YouTube")
      );

      // ブロック対象でないサイトのときは処理を終了
      // しかし、defenseSiteDomainListの中でも、allowedUrlListのものはOK
      if (!defenseSiteDomainList.includes(currentDomain)) {
        return false;
      }
      // ページのタイトルタグを取得
      let titleElement = document.getElementsByTagName("title")[0];
      let titleElementText = titleElement.textContent;
      // ブロック対象の中でも許可されているページのタイトルはモーダルに表示しない
      if (allowedTitleList.includes(titleElementText)) {
        return false;
      }

      var allowedUlElement = document.createElement("ul");
      for (let index = 0; index < allowedTitleAndUrlList.length; index++) {
        const liElement = document.createElement("li");
        const aElement = document.createElement("a");
        aElement.href = allowedTitleAndUrlList[index]["url"];
        aElement.textContent = allowedTitleAndUrlList[index]["title"];
        liElement.appendChild(aElement);
        allowedUlElement.appendChild(liElement);

        if (index === 4) {
          break;
        }
      }

      const modalWrapper = document.createElement("div");
      modalWrapper.innerHTML = htmlText.trim();
      const modalStyleElement = document.createElement("style");
      modalStyleElement.innerHTML = cssText.trim();
      modalWrapper.prepend(modalStyleElement);

      const jsAllowedAreaElement = modalWrapper.querySelector("#jsAllowedArea");
      jsAllowedAreaElement.appendChild(allowedUlElement);
      bodyTag.appendChild(modalWrapper);

      setTimeout(() => {
        // modalが表示されている場合のみに処理を限定
        const netDefModal = document.getElementById("jsNetDefModal");
        const netDefModalCloseBtn =
          document.getElementById("jsNetDefModalClose");

        netDefModalCloseBtn.style.display = "inline-block";

        if (netDefModal !== null && netDefModalCloseBtn !== null) {
          netDefModalCloseBtn.addEventListener("click", () => {
            netDefModal.style.display = "none";
          });
        }
      }, nfCloseBtnHiddenTime);
    } catch (error) {}
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "RUN_MAIN") {
      console.log("[content] RUN_MAIN <-", msg.url);
      run();
    }
  });

  // 初期表示時
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  // SPA対応
  (function patchHistory(history) {
    if (history.__patchedByExt) return;
    history.__patchedByExt = true;

    const _push = history.pushState;
    const _replace = history.replaceState;
    const notify = () => window.dispatchEvent(new Event("locationchange"));

    // 元のpushStateイベントの処理はそのままで、その処理の最中にnotify()を呼び出している
    history.pushState = function (...a) {
      const r = _push.apply(history, a); // 元の動作の処理はそのまま
      notify(); // locationchangeイベントを発火
      return r;
    };

    history.replaceState = function (...a) {
      const r = _replace.apply(history, a);
      notify();
      return r;
    };
    window.addEventListener("popstate", notify);
  })(window.history);

  let lastUrl = location.href;
  // YouTubeは遷移直後に段階的にDOMが生えます。
  // → debounce(150~300ms) を噛ませたり、必要な要素が見つかるまでループ/Observerで待つ。
  const debounce = (fn, ms = 150) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  const runDebounce = debounce(run, 150);

  window.addEventListener("locationchange", () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      runDebounce();
    }
  });
})();
