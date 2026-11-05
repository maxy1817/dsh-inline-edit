function localDate(value) {
  const date = new Date(value instanceof Date ? value.getTime() : typeof value === 'number' ? value : NaN);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Match DSH's local, date-aware message clock without locale-dependent AM/PM. */
export function formatMessageClock(time, language = 'zh-CN', now = new Date()) {
  const date = localDate(time), reference = localDate(now);
  if (!date || !reference) return '';
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const sameYear = year === reference.getFullYear();
  if (sameYear && date.getMonth() === reference.getMonth() && day === reference.getDate()) return clock;
  const english = /^en\b/i.test(language ?? '');
  const calendar = english
    ? sameYear ? `${month}/${day}` : `${year}-${month}-${day}`
    : `${sameYear ? '' : `${year}年`}${month}月${day}日`;
  return `${calendar} ${clock}`;
}

/** Full local timestamp for the message clock's hover and focus description. */
export function formatMessageTimestamp(time, language = 'zh-CN') {
  const date = localDate(time);
  if (!date) return '';
  const pad = value => String(value).padStart(2, '0');
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const calendar = /^en\b/i.test(language ?? '')
    ? `${year}-${pad(month)}-${pad(day)}`
    : `${year}年${month}月${day}日`;
  return `${calendar} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Unix milliseconds at the next local midnight; NaN for an invalid reference. */
export function nextLocalMidnight(now = new Date()) {
  const date = localDate(now);
  return date ? date.setHours(24, 0, 0, 0) : NaN;
}
