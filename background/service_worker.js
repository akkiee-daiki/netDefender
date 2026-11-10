import { CONTENT_SCRIPT_ID, TARGET_DOMAINS, loadSettings } from "../shared/constants.js";
import { toMatchPatterns } from "../shared/domain.js";

const CONTENT_SCRIPT_FILE = "content/main.js";

// 制限対象ドメインのうち、ホスト権限が許可されているもののパターンだけを返す
async function getGrantedPatterns(domains) {
  const patterns = toMatchPatterns(domains);
  const granted = await Promise.all(
    patterns.map((pattern) => chrome.permissions.contains({ origins: [pattern] }))
  );
  return patterns.filter((_, index) => granted[index]);
}

// 既に開いているタブにも content script を注入する（main.js 側で古いインスタンスを置き換える）
async function injectIntoOpenTabs(matches) {
  const tabs = await chrome.tabs.query({ url: matches });
  await Promise.all(
    tabs.map((tab) =>
      chrome.scripting
        .executeScript({ target: { tabId: tab.id }, files: [CONTENT_SCRIPT_FILE] })
        .catch(() => {}) // chrome:// や読み込み中のタブなどは無視
    )
  );
}

// 設定と権限に合わせて content script の動的登録を更新する
async function syncContentScripts() {
  const settings = await loadSettings();
  const matches = await getGrantedPatterns(settings[TARGET_DOMAINS]);
  const registered = await chrome.scripting.getRegisteredContentScripts({
    ids: [CONTENT_SCRIPT_ID],
  });

  if (matches.length === 0) {
    if (registered.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
    }
    return;
  }

  const script = {
    id: CONTENT_SCRIPT_ID,
    js: [CONTENT_SCRIPT_FILE],
    matches,
    runAt: "document_idle",
    allFrames: false,
    persistAcrossSessions: true,
  };
  if (registered.length > 0) {
    await chrome.scripting.updateContentScripts([script]);
  } else {
    await chrome.scripting.registerContentScripts([script]);
  }
  await injectIntoOpenTabs(matches);
}

// 同期処理が並行して走らないよう直列化する
let syncQueue = Promise.resolve();
function queueSync() {
  syncQueue = syncQueue
    .then(syncContentScripts)
    .catch((error) => console.error("[Net Defender] content script の同期に失敗しました", error));
  return syncQueue;
}

chrome.runtime.onInstalled.addListener((details) => {
  queueSync();
  // 初回インストール時は対象ドメインの権限を許可してもらうため設定画面を開く
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onStartup.addListener(queueSync);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && TARGET_DOMAINS in changes) queueSync();
});

chrome.permissions.onAdded.addListener(queueSync);
chrome.permissions.onRemoved.addListener(queueSync);

// 拡張機能アイコンのクリックで設定画面を開く
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
