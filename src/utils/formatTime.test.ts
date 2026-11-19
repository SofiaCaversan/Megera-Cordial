import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPlaybackTime,
  clampSeekRatio,
  calculateSeekTime,
  parseDurationLabel,
} from './formatTime';

test('formatPlaybackTime formats seconds to MM:SS cleanly', () => {
  assert.equal(formatPlaybackTime(0), '00:00');
  assert.equal(formatPlaybackTime(65), '01:05');
  assert.equal(formatPlaybackTime(636), '10:36');
  assert.equal(formatPlaybackTime(-10), '00:00');
  assert.equal(formatPlaybackTime(Number.NaN), '00:00');
});

test('clampSeekRatio bounds values between 0 and 1', () => {
  assert.equal(clampSeekRatio(-0.4), 0);
  assert.equal(clampSeekRatio(0.45), 0.45);
  assert.equal(clampSeekRatio(1.8), 1);
  assert.equal(clampSeekRatio(Number.NaN), 0);
});

test('calculateSeekTime converts pointer offset into clamped seconds', () => {
  assert.equal(calculateSeekTime(150, 100, 200, 120), 30);
  assert.equal(calculateSeekTime(50, 100, 200, 120), 0);
  assert.equal(calculateSeekTime(400, 100, 200, 120), 120);
  assert.equal(calculateSeekTime(150, 100, 0, 120), 0);
});

test('parseDurationLabel parses theatrical apostrophe notation', () => {
  assert.equal(parseDurationLabel("10'36\""), 636);
  assert.equal(parseDurationLabel("12'03\""), 723);
  assert.equal(parseDurationLabel("12'23\""), 743);
});
