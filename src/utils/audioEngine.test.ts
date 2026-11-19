import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCdAcrylicSoundParams,
  computePaperSoundParams,
  generateSoftPaperNoiseSamples,
} from './audioEngine';

test('generateSoftPaperNoiseSamples produces bounded pink/brown noise smoother than raw white noise', () => {
  let seed = 1234567;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const samples = generateSoftPaperNoiseSamples(4096, seededRandom);
  assert.equal(samples.length, 4096);

  let maxAbs = 0;
  let totalDiff = 0;
  for (let i = 0; i < samples.length; i++) {
    assert.ok(samples[i] >= -1 && samples[i] <= 1, 'sample within [-1, 1]');
    maxAbs = Math.max(maxAbs, Math.abs(samples[i]));
    if (i > 0) {
      totalDiff += Math.abs(samples[i] - samples[i - 1]);
    }
  }

  assert.ok(maxAbs > 0.05, 'signal is non-silent');
  const avgStepDiff = totalDiff / (samples.length - 1);
  // Raw uniform white noise in [-1,1] has avg adjacent step difference ~0.667; pink/brown is much smoother
  assert.ok(avgStepDiff < 0.25, `expected smooth pink/brown spectrum (avgStepDiff=${avgStepDiff})`);
});

test('touch paper sound uses bandpass filter around 800-1400Hz, Q=0.7, maxGain=0.06, 0.04s attack, 0.15s decay', () => {
  const lowVar = computePaperSoundParams('touch', () => 0);
  const highVar = computePaperSoundParams('touch', () => 0.9999);

  for (const params of [lowVar, highVar]) {
    assert.equal(params.filterType, 'bandpass');
    assert.equal(params.Q, 0.7);
    assert.equal(params.maxGain, 0.06);
    assert.equal(params.attackTime, 0.04);
    assert.equal(params.decayTime, 0.15);
    assert.ok(params.baseFrequency >= 800 && params.baseFrequency <= 1400);
  }

  // ±10% variation between min and max random draws
  const ratio = highVar.baseFrequency / lowVar.baseFrequency;
  assert.ok(ratio > 1.18 && ratio < 1.24, `expected ~1.1/0.9 frequency spread, got ${ratio}`);
});

test('flip paper sound uses bandpass Q=0.7 in 800-1400Hz, maxGain in 0.08-0.12, decay in 0.45-0.55s, and ±10% variation', () => {
  const lowVar = computePaperSoundParams('flip', () => 0);
  const midVar = computePaperSoundParams('flip', () => 0.5);
  const highVar = computePaperSoundParams('flip', () => 0.9999);

  for (const params of [lowVar, midVar, highVar]) {
    assert.equal(params.filterType, 'bandpass');
    assert.equal(params.Q, 0.7);
    assert.ok(params.baseFrequency >= 800 && params.baseFrequency <= 1400);
    assert.ok(params.maxGain >= 0.08 && params.maxGain <= 0.12);
    assert.ok(params.decayTime >= 0.45 && params.decayTime <= 0.55);
  }

  assert.equal(lowVar.maxGain, 0.08);
  assert.equal(highVar.maxGain, 0.12);
  assert.equal(lowVar.decayTime, 0.45);
  assert.equal(highVar.decayTime, 0.55);
  assert.notEqual(lowVar.baseFrequency, highVar.baseFrequency);
});

test('CD acrylic open sound emits double pulse in 2200-3200Hz with 0.04s and 0.08s decay and gain <= 0.12', () => {
  const pulses = computeCdAcrylicSoundParams('open', () => 0.5);
  assert.equal(pulses.length, 2);
  assert.equal(pulses[0].filterType, 'bandpass');
  assert.equal(pulses[1].filterType, 'bandpass');
  assert.ok(pulses[0].frequency >= 2200 && pulses[0].frequency <= 3200);
  assert.ok(pulses[1].frequency >= 2200 && pulses[1].frequency <= 3200);
  assert.equal(pulses[0].decay, 0.04);
  assert.equal(pulses[1].decay, 0.08);
  assert.equal(pulses[0].gain, 0.12);
  assert.ok(pulses[1].gain <= 0.12);
  assert.ok(pulses[1].delay > pulses[0].delay);
});

test('CD acrylic close sound emits single soft snap around 1800Hz with 0.05s decay and gain 0.14', () => {
  const pulses = computeCdAcrylicSoundParams('close', () => 0.5);
  assert.equal(pulses.length, 1);
  assert.equal(pulses[0].filterType, 'bandpass');
  assert.ok(pulses[0].frequency >= 1700 && pulses[0].frequency <= 1900);
  assert.equal(pulses[0].decay, 0.05);
  assert.equal(pulses[0].gain, 0.14);
});
