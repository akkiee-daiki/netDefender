// ---- chrome.storage.sync のキー（ユーザー設定） ----
export const TIME_LIMIT_MINUTES = "TIME_LIMIT_MINUTES";
export const TARGET_DOMAINS = "TARGET_DOMAINS";
export const WHITELIST = "WHITELIST";

// ---- chrome.storage.local のキー（視聴状態） ----
// { elapsedMs: 連続視聴時間, lastTickAt: 最後に計測した時刻(ms) }
export const WATCH_STATE = "WATCH_STATE";

export const DEFAULT_SETTINGS = {
  [TIME_LIMIT_MINUTES]: 30,
  [TARGET_DOMAINS]: ["youtube.com"],
  [WHITELIST]: [],
};

export const DEFAULT_WATCH_STATE = { elapsedMs: 0, lastTickAt: 0 };

// この時間以上どの対象タブでも視聴がなければ「連続視聴」が途切れたとみなしてリセットする
export const BREAK_RESET_MINUTES = 5;

export const MIN_TIME_LIMIT_MINUTES = 1;
export const MAX_TIME_LIMIT_MINUTES = 1440;

// chrome.scripting で動的登録する content script の ID
export const CONTENT_SCRIPT_ID = "net-defender-main";

export function loadSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

export function saveSettings(partialSettings) {
  return chrome.storage.sync.set(partialSettings);
}

export async function loadWatchState() {
  const result = await chrome.storage.local.get({ [WATCH_STATE]: DEFAULT_WATCH_STATE });
  return result[WATCH_STATE];
}

export function saveWatchState(watchState) {
  return chrome.storage.local.set({ [WATCH_STATE]: watchState });
}
