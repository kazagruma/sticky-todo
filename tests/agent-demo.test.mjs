import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, budget, runDemo } from '../agent-demo.mjs';
test('valid evidence scores three; invented quotes and sources fail', () => {
 const sources = [{ id: 'README.md', source: 'README.md', text: 'Web版はブラウザの保存領域を使います。' }];
 const claim = { text: 'ブラウザに保存', sourceId: 'README.md', quote: sources[0].text };
 assert.equal(evaluate([claim], sources).score, 3);
 assert.throws(() => evaluate([{ ...claim, quote: '架空の根拠が書かれています' }], sources));
 assert.throws(() => evaluate([{ ...claim, sourceId: '../.env.local' }], sources));
 assert.equal(evaluate([], sources).score, 0);
});
test('tool budget stops excess calls', () => { const next = budget(2); next(); next(); assert.throws(next, /tool_call_limit/); });
test('oversized input stops before API', async () => { await assert.rejects(runDemo('x'.repeat(501)), /invalid_input/); });
