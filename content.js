(() => {
  const run = async () => {
    try {
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
        aElement.href += allowedTitleAndUrlList[index]["url"];
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
        const netDefModalCloseBtn = document.getElementById(
          "jsNetDefModalClose"
        );

        netDefModalCloseBtn.style.display = "inline-block";

        if (netDefModal !== null && netDefModalCloseBtn !== null) {
          netDefModalCloseBtn.addEventListener("click", () => {
            netDefModal.style.display = "none";
          });
        }
      }, nfCloseBtnHiddenTime);
    } catch (error) {}
  };

  // 初期表示時
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true});
  } else {
    run();
  }
})();
