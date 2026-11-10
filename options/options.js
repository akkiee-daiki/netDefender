import {
  TIME_LIMIT_MINUTES,
  TARGET_DOMAINS,
  WHITELIST,
  MIN_TIME_LIMIT_MINUTES,
  MAX_TIME_LIMIT_MINUTES,
  loadSettings,
  saveSettings,
} from "../shared/constants.js";
import { normalizeDomain, toMatchPatterns } from "../shared/domain.js";

const STATUS_HIDE_DELAY_MS = 3000;

const form = document.getElementById("jsSettingsForm");
const timeLimitInput = document.getElementById("jsTimeLimit");
const targetDomainsInput = document.getElementById("jsTargetDomains");
const whitelistInput = document.getElementById("jsWhitelist");
const permissionList = document.getElementById("jsPermissionList");
const statusElement = document.getElementById("jsStatus");

let statusTimerId = null;

// textarea の内容を trim・空行除去・重複除去して配列にする
function parseLines(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return [...new Set(lines)];
}

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("is-error", isError);
  clearTimeout(statusTimerId);
  if (!isError) {
    statusTimerId = setTimeout(() => {
      statusElement.textContent = "";
    }, STATUS_HIDE_DELAY_MS);
  }
}

// フォームの値を検証・正規化する
function readForm() {
  const errors = [];

  const timeLimitMinutes = Math.floor(Number(timeLimitInput.value));
  if (
    !Number.isFinite(timeLimitMinutes) ||
    timeLimitMinutes < MIN_TIME_LIMIT_MINUTES ||
    timeLimitMinutes > MAX_TIME_LIMIT_MINUTES
  ) {
    errors.push(`制限時間は ${MIN_TIME_LIMIT_MINUTES}〜${MAX_TIME_LIMIT_MINUTES} 分で指定してください`);
  }

  const targetDomains = [];
  for (const line of parseLines(targetDomainsInput.value)) {
    const domain = normalizeDomain(line);
    if (domain === null) {
      errors.push(`ドメインの形式が正しくありません: ${line}`);
    } else if (!targetDomains.includes(domain)) {
      targetDomains.push(domain);
    }
  }

  const whitelist = parseLines(whitelistInput.value);

  return { errors, timeLimitMinutes, targetDomains, whitelist };
}

// 対象ドメインごとにアクセス許可の状態を表示する
async function renderPermissionStatus(domains) {
  permissionList.replaceChildren();
  for (const domain of domains) {
    const [pattern] = toMatchPatterns([domain]);
    const isGranted = await chrome.permissions.contains({ origins: [pattern] });
    const item = document.createElement("li");
    item.className = isGranted ? "is-granted" : "is-denied";
    item.textContent = `${domain}: ${isGranted ? "許可済み" : "未許可（保存すると許可を求めます）"}`;
    permissionList.appendChild(item);
  }
}

// 対象から外れたドメインのアクセス許可を返却する
async function removeStalePermissions(targetDomains) {
  const neededPatterns = toMatchPatterns(targetDomains);
  const { origins = [] } = await chrome.permissions.getAll();
  const staleOrigins = origins.filter((origin) => !neededPatterns.includes(origin));
  if (staleOrigins.length > 0) {
    await chrome.permissions.remove({ origins: staleOrigins });
  }
}

async function save(formValues, permissionRequest) {
  let isGranted = false;
  try {
    isGranted = await permissionRequest;
  } catch (error) {
    console.error(error);
  }

  await saveSettings({
    [TIME_LIMIT_MINUTES]: formValues.timeLimitMinutes,
    [TARGET_DOMAINS]: formValues.targetDomains,
    [WHITELIST]: formValues.whitelist,
  });
  await removeStalePermissions(formValues.targetDomains);

  // 正規化後の値を画面に反映
  timeLimitInput.value = formValues.timeLimitMinutes;
  targetDomainsInput.value = formValues.targetDomains.join("\n");
  whitelistInput.value = formValues.whitelist.join("\n");
  await renderPermissionStatus(formValues.targetDomains);

  if (isGranted) {
    showStatus("保存しました");
  } else {
    showStatus("保存しましたが、サイトへのアクセスが許可されなかったため未許可のドメインでは動作しません", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formValues = readForm();
  if (formValues.errors.length > 0) {
    showStatus(formValues.errors.join(" / "), true);
    return;
  }

  // permissions.request はユーザー操作の直後に呼ぶ必要があるため、await より前で呼ぶ
  const origins = toMatchPatterns(formValues.targetDomains);
  const permissionRequest =
    origins.length > 0 ? chrome.permissions.request({ origins }) : Promise.resolve(true);

  save(formValues, permissionRequest).catch((error) => {
    console.error(error);
    showStatus("保存に失敗しました", true);
  });
});

async function restoreSettings() {
  const settings = await loadSettings();
  timeLimitInput.value = settings[TIME_LIMIT_MINUTES];
  targetDomainsInput.value = settings[TARGET_DOMAINS].join("\n");
  whitelistInput.value = settings[WHITELIST].join("\n");
  await renderPermissionStatus(settings[TARGET_DOMAINS]);
}

// chrome://extensions など別の場所で権限が変わったときも表示を更新する
const refreshPermissionStatus = async () => {
  const settings = await loadSettings();
  renderPermissionStatus(settings[TARGET_DOMAINS]);
};
chrome.permissions.onAdded.addListener(refreshPermissionStatus);
chrome.permissions.onRemoved.addListener(refreshPermissionStatus);

restoreSettings();
