const test = require('node:test');
const assert = require('node:assert/strict');
const Sfma = require('../js/sfma-protocol.js');

test('SFMA defines the ten source Top Tier patterns and permits completion after all classifications', () => {
  assert.equal(Sfma.topTier.length, 10);
  const answers = Object.fromEntries(Sfma.topTier.map(item => [item.id, item.sides === 'bilateral' ? { left: 'FN', right: 'DN' } : { score: 'FN' }]));
  assert.equal(Sfma.isComplete(answers), true);
  assert.equal(Sfma.isComplete({ ...answers, cervicalRotation: { left: 'FN' } }), false);
});

test('only non-FN Top Tier patterns expose their optional breakout catalog', () => {
  const test = Sfma.topTier.find(item => item.id === 'cervicalRotation');
  assert.equal(Sfma.breakoutActive(test, { cervicalRotation: { left: 'FN', right: 'FP' } }), true);
  assert.equal(Sfma.breakoutActive(test, { cervicalRotation: { left: 'FN', right: 'FN' } }), false);
  assert.equal(Sfma.breakouts.length, 10);
  assert.deepEqual(Object.keys(Sfma.classifications), ['FN', 'FP', 'DN', 'DP']);
});
