chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url ?? tab?.url;
  if (!url) return;
});

chrome.webNavigation.onHistoryStateUpdated.addListener(
  (d) => {
    chrome.tabs
      .sendMessage(d.tabId, { type: "RUN_MAIN", url: d.url })
      .catch(() => {});
  },
  { url: [{ hostContains: "youtube.com" }] }
);
