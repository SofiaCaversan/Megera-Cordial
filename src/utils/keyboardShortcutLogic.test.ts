import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isEditableEventTarget,
  shouldHandleCanvasDeleteKey,
} from './keyboardShortcutLogic.ts';

test('shouldHandleCanvasDeleteKey accepts Delete and Backspace on non-editable targets', () => {
  assert.equal(shouldHandleCanvasDeleteKey('Delete', { tagName: 'DIV' }), true);
  assert.equal(shouldHandleCanvasDeleteKey('Backspace', { tagName: 'BODY' }), true);
  assert.equal(shouldHandleCanvasDeleteKey('Delete', null), true);
  assert.equal(shouldHandleCanvasDeleteKey('Enter', { tagName: 'DIV' }), false);
  assert.equal(shouldHandleCanvasDeleteKey('a', { tagName: 'DIV' }), false);
});

test('shouldHandleCanvasDeleteKey ignores input, textarea, select, and contentEditable targets', () => {
  assert.equal(shouldHandleCanvasDeleteKey('Backspace', { tagName: 'INPUT' }), false);
  assert.equal(shouldHandleCanvasDeleteKey('Delete', { tagName: 'input' }), false);
  assert.equal(shouldHandleCanvasDeleteKey('Backspace', { tagName: 'TEXTAREA' }), false);
  assert.equal(shouldHandleCanvasDeleteKey('Delete', { tagName: 'SELECT' }), false);
  assert.equal(
    shouldHandleCanvasDeleteKey('Backspace', { tagName: 'P', isContentEditable: true }),
    false
  );
  assert.equal(
    isEditableEventTarget({
      tagName: 'SPAN',
      closest: (sel: string) => (sel === '[contenteditable="true"]' ? {} : null),
    }),
    true
  );
});
