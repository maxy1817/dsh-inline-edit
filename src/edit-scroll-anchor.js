const scrollableOverflow = new Set(['auto', 'scroll', 'overlay']);
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
const intentEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'beforematch'];

/** Capture before an editor layout change; restore once after its final sizing. */
export function captureEditScrollAnchor(section) {
  const document = section?.ownerDocument;
  const view = document?.defaultView;
  const noop = {restore() {}, dispose() {}};
  if (!view || !section.isConnected) return noop;

  const bottom = section.getBoundingClientRect().bottom;
  if (!Number.isFinite(bottom)) return noop;
  const scrollers = [];
  for (let parent = section.parentElement; parent; parent = parent.parentElement) {
    // Include scrollports that only begin overflowing after the editor expands.
    if (scrollableOverflow.has(view.getComputedStyle(parent).overflowY)) scrollers.push(parent);
  }
  const page = document.scrollingElement;
  if (page && !scrollers.includes(page)) {
    const overflow = view.getComputedStyle(page).overflowY;
    if (overflow !== 'hidden' && overflow !== 'clip') scrollers.push(page);
  }
  if (!scrollers.length) return noop;

  let active = true;
  function dispose() {
    if (!active) return;
    active = false;
    for (const type of intentEvents) document.removeEventListener(type, onIntent, true);
  }
  function onIntent(event) {
    if (event.type !== 'keydown' || scrollKeys.has(event.key)) dispose();
  }
  for (const type of intentEvents) document.addEventListener(type, onIntent, {capture: true, passive: true});

  return {
    dispose,
    restore() {
      if (!active) return;
      dispose();
      if (!section.isConnected) return;
      for (const scroller of scrollers) {
        if (!scroller.isConnected || !scroller.contains(section)) continue;
        // Measure the remaining displacement, including any native anchoring
        // already applied. Nested scrollports can consume the remainder.
        const displacement = section.getBoundingClientRect().bottom - bottom;
        if (!Number.isFinite(displacement) || Math.abs(displacement) < 0.5) break;
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const top = Math.max(0, Math.min(max, scroller.scrollTop + displacement));
        if (top === scroller.scrollTop) continue;
        // Explicit instant behavior also works when a host enables smooth scroll.
        if (typeof scroller.scrollTo === 'function') scroller.scrollTo({top, behavior: 'instant'});
        else scroller.scrollTop = top;
      }
    },
  };
}
