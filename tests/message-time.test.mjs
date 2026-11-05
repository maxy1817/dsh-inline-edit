import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatMessageClock, formatMessageTimestamp, nextLocalMidnight} from '../src/message-time.js';

const now = new Date(2026, 10, 5, 12, 0);

test('today uses the same 24-hour clock in Chinese and English', () => {
  const time = new Date(2026, 10, 5, 23, 14).getTime();
  for (const language of ['zh-CN', 'en-US', 'en-GB']) {
    assert.equal(formatMessageClock(time, language, now), '23:14');
  }
});

test('other local dates in the same year include an unpadded month and day', () => {
  for (const [time, chinese, english] of [
    [new Date(2026, 10, 4, 23, 14), '11月4日 23:14', '11/4 23:14'],
    [new Date(2026, 0, 2, 9, 5), '1月2日 09:05', '1/2 09:05'],
    [new Date(2026, 11, 1, 9, 5), '12月1日 09:05', '12/1 09:05'],
  ]) {
    assert.equal(formatMessageClock(time.getTime(), 'zh-CN', now), chinese);
    assert.equal(formatMessageClock(time.getTime(), 'en-US', now), english);
  }
});

test('other years include the year without padding month or day', () => {
  const time = new Date(2025, 0, 2, 9, 5).getTime();
  assert.equal(formatMessageClock(time, 'zh-CN', now), '2025年1月2日 09:05');
  assert.equal(formatMessageClock(time, 'en-US', now), '2025-1-2 09:05');
  assert.equal(formatMessageClock(time, undefined, now), '2025年1月2日 09:05');
});

test('hours and minutes are always padded, including midnight', () => {
  for (const [hour, minute, expected] of [[0, 0, '00:00'], [0, 5, '00:05'], [9, 0, '09:00']]) {
    assert.equal(formatMessageClock(new Date(2026, 10, 5, hour, minute), 'zh-CN', now), expected);
  }
});

test('epoch zero is a valid timestamp', () => {
  const epoch = new Date(0);
  const expected = `${String(epoch.getHours()).padStart(2, '0')}:${String(epoch.getMinutes()).padStart(2, '0')}`;
  assert.equal(formatMessageClock(0, 'zh-CN', epoch), expected);
  assert.notEqual(formatMessageTimestamp(0), '');
});

test('full timestamps include the year and seconds in local time without changing the compact clock', () => {
  const time = new Date(2026, 10, 5, 9, 5, 7, 650);
  const original = time.getTime();
  assert.equal(formatMessageTimestamp(time), '2026年11月5日 09:05:07');
  assert.equal(formatMessageTimestamp(original, 'en-US'), '2026-11-05 09:05:07');
  assert.equal(formatMessageClock(original, 'zh-CN', now), '09:05');
  assert.equal(time.getTime(), original, 'formatting does not mutate the Date');
});

test('full timestamps pad English calendar fields and all clock fields at midnight', () => {
  const time = new Date(2025, 0, 2);
  assert.equal(formatMessageTimestamp(time, 'zh-CN'), '2025年1月2日 00:00:00');
  assert.equal(formatMessageTimestamp(time, 'en-GB'), '2025-01-02 00:00:00');
});

test('missing, non-numeric, and out-of-range timestamps render no clock or full timestamp', () => {
  for (const time of [undefined, null, '', '2026-11-05', NaN, Infinity, -Infinity, 8.64e15 + 1, {}, new Date(NaN)]) {
    assert.equal(formatMessageClock(time, 'zh-CN', now), '');
    assert.equal(formatMessageTimestamp(time), '');
  }
  assert.equal(formatMessageClock(now, 'zh-CN', new Date(NaN)), '');
});

test('the displayed date changes exactly at the next local midnight', () => {
  const time = new Date(2026, 10, 4, 23, 14).getTime();
  const before = new Date(2026, 10, 4, 23, 59, 59, 999);
  const midnight = nextLocalMidnight(before);
  assert.equal(midnight, new Date(2026, 10, 5).getTime());
  assert.equal(formatMessageClock(time, 'zh-CN', before), '23:14');
  assert.equal(formatMessageClock(time, 'zh-CN', midnight), '11月4日 23:14');
  assert.equal(before.getDate(), 4, 'the reference Date is not mutated');
});

test('local midnight scheduling rolls over months and years and advances a full date from midnight', () => {
  for (const [reference, expected] of [
    [new Date(2026, 10, 30, 18), new Date(2026, 11, 1)],
    [new Date(2026, 11, 31, 23, 59), new Date(2027, 0, 1)],
    [new Date(2026, 10, 5), new Date(2026, 10, 6)],
  ]) {
    assert.equal(nextLocalMidnight(reference), expected.getTime());
    assert.equal(nextLocalMidnight(reference.getTime()), expected.getTime());
  }
  const previousYear = new Date(2026, 11, 31, 23, 14);
  assert.equal(formatMessageClock(previousYear, 'zh-CN', new Date(2027, 0, 1)), '2026年12月31日 23:14');
});

test('invalid midnight references return NaN', () => {
  for (const reference of [null, '', NaN, Infinity, new Date(NaN)]) {
    assert.ok(Number.isNaN(nextLocalMidnight(reference)));
  }
});
