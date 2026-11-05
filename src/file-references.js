function textBoundary(text, offset) {
  if (offset === 0 || offset === text.length) return true;
  const before = text.charCodeAt(offset - 1), after = text.charCodeAt(offset);
  return !(before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff);
}

/**
 * Collect file spans from DSH's public UserText evaluator without rewriting text.
 * Ranges are half-open UTF-16 offsets. Gaps are allowed; malformed, unordered or
 * overlapping nodes (including non-file nodes) reject the whole result so the
 * caller can retain plain text instead of importing a partially valid document.
 * File metadata must be nonblank strings; their original spelling is preserved.
 */
export function collectFileReferences(text, evaluateUserText, facts = {}) {
  if (typeof text !== 'string' || typeof evaluateUserText !== 'function') return [];
  try {
    const nodes = evaluateUserText({text, facts});
    if (!Array.isArray(nodes)) return [];
    const references = [];
    let previousEnd = 0;
    for (const node of nodes) {
      if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id) return [];
      const {start, end} = node;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
        || start < previousEnd || end <= start || end > text.length
        || !textBoundary(text, start) || !textBoundary(text, end)) return [];
      previousEnd = end;
      if (node.id !== 'file') continue;
      const {path, label} = node.data ?? {};
      if (typeof path !== 'string' || !path.trim() || typeof label !== 'string' || !label.trim()) return [];
      references.push({start, end, path, label});
    }
    return references;
  } catch {
    return [];
  }
}
