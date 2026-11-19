import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, INITIAL_TRACKS } from '../data/projectData.ts';

test('All 3 audio fiction tracks use standardized ATO 1..3 titles, include Marina Meyer (Sara), and separate oneLiner from full synopsis', () => {
  assert.deepEqual(
    INITIAL_TRACKS.map((t) => [t.actLabel, t.title]),
    [
      ['ATO 1', 'ATO 1'],
      ['ATO 2', 'ATO 2'],
      ['ATO 3', 'ATO 3'],
    ]
  );

  for (const track of INITIAL_TRACKS) {
    assert.ok(
      track.castFeatured.some((entry) => entry.includes('Marina Meyer') && entry.includes('Sara')),
      `Expected Marina Meyer (Sara) in ${track.title} castFeatured`
    );
    assert.ok(track.oneLiner.length > 30 && track.oneLiner.length < 180, `Expected concise oneLiner for ${track.title}`);
    assert.ok(track.synopsis.length > track.oneLiner.length, `Expected fuller CD-back synopsis for ${track.title}`);
  }
});

test('Inês character profile reflects updated psychology text', () => {
  const ines = CHARACTERS.find((c) => c.id === 'ines');
  assert.ok(ines);
  assert.ok(ines.psychology.includes('Inês é uma mulher elegante e melancólica, mãe da Sara.'));
  assert.ok(ines.psychology.includes('alguém que ainda tenta acreditar na possibilidade do afeto.'));
});
