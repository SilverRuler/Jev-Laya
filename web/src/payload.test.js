import test from 'node:test';
import assert from 'node:assert/strict';
import { initialEditor, editorReducer, parseDocument, renameKey } from './payload.js';

test('UI edits synchronize JSON with mixed question types and nested state', () => {
  const previous = initialEditor();
  const document = { ...previous.document, state: { measurements: { chest: 96 }, enabled: true }, custom: 'preserved' };
  const next = editorReducer(previous, { type: 'ui', document });
  assert.deepEqual(JSON.parse(next.json), document);
  assert.deepEqual(Object.values(document.questions).map(q => q.type), ['noul', 'choice', 'score']);
});
test('JSON changes update UI immediately without reformatting the draft', () => {
  const json = '{"model":"local","state":[{"value":12}],"questions":{"a":{"type":"score","criteria":["low","high"]}},"custom":true}';
  const next = editorReducer(initialEditor(), { type: 'json', text: json });
  assert.equal(next.document.state[0].value, 12);
  assert.equal(next.json, json);
  const renamed = { ...next.document, model: 'local-updated' };
  const updated = editorReducer(next, { type: 'ui', document: renamed });
  assert.equal(JSON.parse(updated.json).custom, true);
});
test('invalid JSON preserves last UI state and recovers when completed', () => {
  const previous = initialEditor();
  const invalid = editorReducer(previous, { type: 'json', text: '{' });
  assert.equal(invalid.document, previous.document);
  assert.equal(invalid.json, '{');
  assert.ok(invalid.error);
  const recovered = editorReducer(invalid, { type: 'json', text: previous.json });
  assert.equal(recovered.error, '');
  assert.deepEqual(recovered.document, previous.document);
});
test('editing allows zero questions but sending rejects incomplete data', () => {
  const raw = '{"model":"","state":null,"questions":{}}';
  assert.deepEqual(parseDocument(raw).questions, {});
  assert.throws(() => parseDocument(raw, true));
});
test('renaming preserves order, rejects collisions, and supports special JSON keys', () => {
  const renamed = renameKey({ first: 1, second: 2 }, 'first', 'new');
  assert.deepEqual(Object.keys(renamed), ['new', 'second']);
  assert.throws(() => renameKey(renamed, 'new', 'second'));
  assert.equal(Object.getPrototypeOf(renameKey(renamed, 'new', '__proto__')), Object.prototype);
});
