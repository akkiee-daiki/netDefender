// 拡張機能アイコンのクリックで設定画面を開く
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
