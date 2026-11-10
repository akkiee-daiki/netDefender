// chrome.storage.sync のキー
export const TIME_LIMIT_MINUTES = "TIME_LIMIT_MINUTES";
export const TARGET_DOMAINS = "TARGET_DOMAINS";
export const WHITELIST = "WHITELIST";

export const DEFAULT_SETTINGS = {
  [TIME_LIMIT_MINUTES]: 30,
  [TARGET_DOMAINS]: ["example.com"],
  [WHITELIST]: [],
};

export function loadSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

export function saveSettings(partialSettings) {
  return chrome.storage.sync.set(partialSettings);
}
