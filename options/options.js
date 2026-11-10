import {
  TIME_LIMIT_MINUTES,
  TARGET_DOMAINS,
  WHITELIST,
  loadSettings,
  saveSettings,
} from "../shared/constants.js";

const STATUS_HIDE_DELAY_MS = 2000;

const form = document.getElementById("jsSettingsForm");
const timeLimitInput = document.getElementById("jsTimeLimit");
const targetDomainsInput = document.getElementById("jsTargetDomains");
const whitelistInput = document.getElementById("jsWhitelist");
const statusElement = document.getElementById("jsStatus");

// textarea の内容を trim・空行除去・重複除去して配列にする
function parseLines(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return [...new Set(lines)];
}

async function restoreSettings() {
  const settings = await loadSettings();
  timeLimitInput.value = settings[TIME_LIMIT_MINUTES];
  targetDomainsInput.value = settings[TARGET_DOMAINS].join("\n");
  whitelistInput.value = settings[WHITELIST].join("\n");
}

let statusTimerId = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const timeLimitMinutes = Math.max(1, Math.floor(Number(timeLimitInput.value)));
  const targetDomains = parseLines(targetDomainsInput.value).map((domain) =>
    domain.toLowerCase()
  );
  const whitelist = parseLines(whitelistInput.value);

  await saveSettings({
    [TIME_LIMIT_MINUTES]: timeLimitMinutes,
    [TARGET_DOMAINS]: targetDomains,
    [WHITELIST]: whitelist,
  });

  // 正規化後の値を画面に反映
  timeLimitInput.value = timeLimitMinutes;
  targetDomainsInput.value = targetDomains.join("\n");
  whitelistInput.value = whitelist.join("\n");

  statusElement.textContent = "保存しました";
  clearTimeout(statusTimerId);
  statusTimerId = setTimeout(() => {
    statusElement.textContent = "";
  }, STATUS_HIDE_DELAY_MS);
});

restoreSettings();
