// ドメイン・URL の正規化と照合

const HOSTNAME_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
// プレフィックス一致の直後に来てよい文字（"/@foo" が "/@foobar" に一致しないようにする）
const URL_BOUNDARY_CHARS = ["/", "?", "#", "&"];

/**
 * ユーザー入力（"www.youtube.com" や "https://youtube.com/xxx" など）をドメインに正規化する。
 * 不正な入力なら null を返す。
 */
export function normalizeDomain(input) {
  const text = input.trim().toLowerCase();
  if (text === "") return null;

  let hostname;
  try {
    hostname = new URL(text.includes("://") ? text : `https://${text}`).hostname;
  } catch {
    return null;
  }
  hostname = hostname.replace(/^www\./, "");
  return HOSTNAME_PATTERN.test(hostname) ? hostname : null;
}

/** hostname が domains のいずれか（またはそのサブドメイン）に一致するか */
export function matchesDomain(hostname, domains) {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** ドメインからホスト権限・content script 用のマッチパターンを作る（サブドメインも含む） */
export function toMatchPatterns(domains) {
  return domains.map((domain) => `*://*.${domain}/*`);
}

// スキームと先頭の "www." を除き、ホスト部分だけ小文字にする（パスは大文字小文字を区別する）
function stripUrl(url) {
  const text = url.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^www\./i, "");
  const slashIndex = text.search(/[/?#]/);
  if (slashIndex === -1) return text.toLowerCase();
  return text.slice(0, slashIndex).toLowerCase() + text.slice(slashIndex);
}

/** url がホワイトリストのエントリ prefix で始まるか */
export function matchesUrlPrefix(url, prefix) {
  const strippedPrefix = stripUrl(prefix);
  if (strippedPrefix === "") return false;

  const strippedUrl = stripUrl(url);
  if (!strippedUrl.startsWith(strippedPrefix)) return false;
  if (strippedUrl.length === strippedPrefix.length) return true;

  const lastChar = strippedPrefix.at(-1);
  if (URL_BOUNDARY_CHARS.includes(lastChar) || lastChar === "=") return true;
  return URL_BOUNDARY_CHARS.includes(strippedUrl[strippedPrefix.length]);
}
