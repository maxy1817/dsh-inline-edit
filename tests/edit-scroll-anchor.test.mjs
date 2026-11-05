import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {captureEditScrollAnchor} from '../src/edit-scroll-anchor.js';

// JSDOM supplies ancestry, styles and event propagation; this fixture supplies
// scrollport geometry, including actual browser-style scroll range clamping.
function fixture(t, {nested = false, overflow = 'auto', page = false} = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="outer"><div id="inner"><section></section><p>Following message</p></div></div></body></html>');
  t.after(() => dom.window.close());
  const {document} = dom.window;
  const section = document.querySelector('section');
  const inner = document.getElementById('inner');
  const outer = document.getElementById('outer');
  const metrics = new Map();
  function scrollport(element, {top = 100, height = 300, total = 1000} = {}) {
    const state = {top, height, total, writes: []};
    metrics.set(element, state);
    Object.defineProperties(element, {
      scrollTop: {get: () => state.top, set: value => {state.top = Math.max(0, Math.min(state.total - state.height, value)); state.writes.push(state.top);}},
      clientHeight: {get: () => state.height},
      scrollHeight: {get: () => state.total},
    });
    element.scrollTo = options => {
      assert.equal(options.behavior, 'instant');
      element.scrollTop = options.top;
    };
    return state;
  }
  inner.style.overflowY = overflow;
  const innerState = scrollport(inner);
  if (nested) outer.style.overflowY = 'auto';
  const outerState = nested ? scrollport(outer) : null;
  if (page) Object.defineProperty(document, 'scrollingElement', {value: document.documentElement});
  const pageState = page ? scrollport(document.documentElement) : null;
  let layoutBottom = 600;
  const viewportBottom = () => layoutBottom - [...metrics.values()].reduce((sum, state) => sum + state.top, 0);
  section.getBoundingClientRect = () => ({bottom: viewportBottom()});
  const following = section.nextElementSibling;
  following.getBoundingClientRect = () => ({top: viewportBottom() + 20});
  return {
    document, section, inner, outer, innerState, outerState, pageState, following,
    grow(amount) {layoutBottom += amount; for (const state of metrics.values()) state.total += amount;},
    intent(type, options = {}) {document.dispatchEvent(type === 'keydown' ? new dom.window.KeyboardEvent(type, options) : new dom.window.Event(type));},
  };
}

test('opening an editor grows upward while the following message keeps its position', t => {
  const f = fixture(t);
  f.inner.style.overflowAnchor = 'none';
  const before = f.following.getBoundingClientRect().top;
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(180);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 280);
  assert.equal(f.following.getBoundingClientRect().top, before);
  assert.equal(f.inner.style.overflowAnchor, 'none');
});

test('fresh anchors preserve the lower edge for textarea growth and cancellation', t => {
  const f = fixture(t);
  const before = f.following.getBoundingClientRect().top;
  for (const heightChange of [180, 48, -228]) {
    const anchor = captureEditScrollAnchor(f.section);
    f.grow(heightChange);
    anchor.restore();
    assert.equal(f.following.getBoundingClientRect().top, before);
  }
  assert.equal(f.inner.scrollTop, 100);
});

test('a newly overflowing ancestor can anchor the initial expansion', t => {
  const f = fixture(t);
  Object.assign(f.innerState, {top: 0, total: 300});
  const before = f.section.getBoundingClientRect().bottom;
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(180);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 180);
  assert.equal(f.section.getBoundingClientRect().bottom, before);
});

test('nested scrollports pass displacement beyond the inner range to the outer one', t => {
  const f = fixture(t, {nested: true});
  Object.assign(f.innerState, {top: 200, total: 550});
  const before = f.section.getBoundingClientRect().bottom;
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(180);
  f.innerState.total = 550; // A constrained inner scrollport has only 50px left.
  anchor.restore();
  assert.equal(f.inner.scrollTop, 250);
  assert.equal(f.outer.scrollTop, 230);
  assert.equal(f.section.getBoundingClientRect().bottom, before);
});

test('insufficient scroll range accepts remaining layout movement without overlapping content', t => {
  const f = fixture(t);
  Object.assign(f.innerState, {top: 20});
  const before = f.section.getBoundingClientRect().bottom;
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(-80);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 0);
  assert.equal(f.section.getBoundingClientRect().bottom, before - 60);
  assert.equal(f.following.getBoundingClientRect().top - f.section.getBoundingClientRect().bottom, 20);
  assert.equal(f.section.getAttribute('style'), null);
});

test('native scroll anchoring is not compensated twice', t => {
  const f = fixture(t);
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(180);
  f.innerState.top += 180;
  anchor.restore();
  assert.deepEqual(f.innerState.writes, []);
});

for (const type of ['wheel', 'touchstart', 'pointerdown', 'beforematch', 'keydown']) test(type + ' reading intent cancels a pending adjustment', t => {
  const f = fixture(t);
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(180);
  f.intent(type, {key: 'PageDown'});
  f.innerState.top += 30;
  anchor.restore();
  assert.equal(f.inner.scrollTop, 130);
  assert.deepEqual(f.innerState.writes, []);
});

test('ordinary typing does not cancel a pending layout adjustment', t => {
  const f = fixture(t);
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(48);
  f.intent('keydown', {key: 'a'});
  anchor.restore();
  assert.equal(f.inner.scrollTop, 148);
});

test('restore and dispose are one-shot and release all document listeners', t => {
  const f = fixture(t);
  f.document.defaultView.getComputedStyle(f.inner); // Initialize JSDOM's own selector listeners first.
  const registered = new Set();
  const add = f.document.addEventListener.bind(f.document);
  const remove = f.document.removeEventListener.bind(f.document);
  f.document.addEventListener = (type, handler, options) => {registered.add(type); add(type, handler, options);};
  f.document.removeEventListener = (type, handler, options) => {registered.delete(type); remove(type, handler, options);};
  const anchor = captureEditScrollAnchor(f.section);
  assert.equal(registered.size, 5);
  f.grow(180);
  anchor.restore();
  assert.equal(registered.size, 0);
  f.grow(50);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 280);
  const cancelled = captureEditScrollAnchor(f.section);
  cancelled.dispose();
  assert.equal(registered.size, 0);
  f.grow(50);
  cancelled.restore();
  assert.equal(f.inner.scrollTop, 280);
});

for (const overflow of ['visible', 'hidden', 'clip']) test(overflow + ' wrappers are not mistaken for the native scrollport', t => {
  const f = fixture(t, {nested: true, overflow});
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(100);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 100);
  assert.equal(f.outer.scrollTop, 200);
});

test('document scrolling works when no ancestor has an explicit scrollport', t => {
  const f = fixture(t, {overflow: 'visible', page: true});
  const before = f.section.getBoundingClientRect().bottom;
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(100);
  anchor.restore();
  assert.equal(f.inner.scrollTop, 100);
  assert.equal(f.pageState.top, 200);
  assert.equal(f.section.getBoundingClientRect().bottom, before);
});

test('missing scrollports and detached or absent sections safely do nothing', t => {
  const f = fixture(t, {overflow: 'visible'});
  const anchor = captureEditScrollAnchor(f.section);
  f.grow(100);
  anchor.restore();
  assert.deepEqual(f.innerState.writes, []);
  f.inner.style.overflowY = 'auto';
  const detached = captureEditScrollAnchor(f.section);
  f.section.remove();
  detached.restore();
  captureEditScrollAnchor(f.section).restore();
  captureEditScrollAnchor(null).dispose();
  assert.deepEqual(f.innerState.writes, []);
});
