window.__ModuleLoader__.load({ id: "dsh-inline-edit", factory: (require) => { const module = { exports: {} }; const exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  EditSettings: () => EditSettings,
  EditableMessage: () => EditableMessage,
  apply: () => apply,
  inject: () => inject,
  installHistoryView: () => installHistoryView,
  installNativeNodeBridge: () => installNativeNodeBridge,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react4 = __toESM(require("react"), 1);

// src/vendor/dsh-tooltip.js
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/tooltip-placement.js
function placeTooltip({ anchor, width, height, viewportWidth, viewportHeight, gap = 8, avoid = [], side = "bottom", align = "center" }) {
  const margin = 12;
  width = Math.min(width, Math.max(0, viewportWidth - margin * 2));
  height = Math.min(height, Math.max(0, viewportHeight - margin * 2));
  const clampX = (x) => Math.max(margin, Math.min(x, viewportWidth - margin - width));
  const clampY = (y) => Math.max(margin, Math.min(y, viewportHeight - margin - height));
  const candidates = [
    { left: anchor.right + gap, top: anchor.bottom + gap, side: "bottom" },
    { left: anchor.left - gap - width, top: anchor.bottom + gap, side: "bottom" },
    { left: anchor.right + gap, top: anchor.top - gap - height, side: "top" },
    { left: anchor.left - gap - width, top: anchor.top - gap - height, side: "top" }
  ];
  if (side === "left") {
    const top = (anchor.top + anchor.bottom - height) / 2;
    const row = avoid.filter((r) => r.bottom > top && r.top < top + height && r.right <= anchor.left && r.right > anchor.left - 180);
    const edge = Math.min(anchor.left, ...row.map((r) => r.left));
    candidates.unshift({ left: edge - gap - width, top, side: "left" });
  }
  if (side === "top") {
    const left = align === "end" ? anchor.right - width : (anchor.left + anchor.right - width) / 2;
    candidates.unshift({ left, top: anchor.top - gap - height, side: "top" });
    candidates.sort((a, b) => (a.side === "top" ? 0 : 1) - (b.side === "top" ? 0 : 1));
  }
  const overlap = (p, r) => Math.max(0, Math.min(p.left + width, r.right + 4) - Math.max(p.left, r.left - 4)) * Math.max(0, Math.min(p.top + height, r.bottom + 4) - Math.max(p.top, r.top - 4));
  const blockers = [anchor, ...avoid];
  const fits = (p) => p.left >= margin && p.top >= margin && p.left + width <= viewportWidth - margin && p.top + height <= viewportHeight - margin;
  const clear = (p) => blockers.every((r) => overlap(p, r) === 0);
  const natural = candidates.find((p) => fits(p) && clear(p));
  if (natural) return { ...natural, width, height, overflow: false };
  const bounded = candidates.map((p) => ({ ...p, left: clampX(p.left), top: clampY(p.top) }));
  const free = bounded.find(clear);
  if (free) return { ...free, width, height, overflow: false };
  const score = (p) => overlap(p, anchor) * 1e3 + avoid.reduce((sum, r) => sum + overlap(p, r), 0);
  bounded.sort((a, b) => score(a) - score(b));
  return { ...bounded[0], width, height, overflow: true };
}

// src/vendor/dsh-tooltip.js
var css$23 = { bubble: "dsh-ie-tip-bubble", label: "dsh-ie-tip-label" };
var TooltipSuppression = (0, import_react.createContext)(null);
function Tooltip({ label, shortcutKeys, side = "right", align = "center", delayMs = 0, focusDelayMs = 0, gap = 8, disabled = false, portal = false, maxWidth, openOnClick = false, children }) {
  const id = (0, import_react.useId)();
  const [pinned, setPinned] = (0, import_react.useState)(false);
  const anchor = (0, import_react.useRef)(null);
  const childRef = children.ref;
  const mergedRef = (0, import_react.useCallback)((el) => {
    anchor.current = el;
    if (typeof childRef === "function") childRef(el);
    else if (childRef != null) childRef.current = el;
  }, [childRef]);
  const [pos, setPos] = (0, import_react.useState)(null);
  const bubble = (0, import_react.useRef)(null);
  const resolvedLabel = pos === null ? null : typeof label === "function" ? label() : label;
  const showTimer = (0, import_react.useRef)(null);
  const triggers = (0, import_react.useRef)({
    hover: false,
    focus: false
  });
  const suppressAncestors = (0, import_react.useContext)(TooltipSuppression);
  const [suppressed, setSuppressed] = (0, import_react.useState)(false);
  const announce = (0, import_react.useCallback)((active) => {
    suppressAncestors?.(active);
  }, [suppressAncestors]);
  const visible = pos !== null && !disabled;
  (0, import_react.useEffect)(() => {
    const el = bubble.current;
    if (pos === null || !visible || suppressed || el === null) return;
    let size;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      return { inlineSize: rect.width, blockSize: rect.height };
    };
    let anchorRect = pos;
    const fit = () => {
      if (size === void 0) return;
      const placement = placeTooltip({
        anchor: anchorRect,
        width: size.inlineSize,
        height: size.blockSize,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        side,
        align,
        gap,
        avoid: [...document.querySelectorAll('button,input,textarea,select,[contenteditable="true"],[role="button"],.dsh-ie-time')].filter((control) => control !== anchor.current && !el.contains(control) && !control.disabled).map((control) => control.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
      });
      const horizontal = placement.side === "right" || placement.side === "left";
      const offsetX = horizontal ? 0 : align === "end" ? placement.width : placement.width / 2;
      const offsetY = horizontal ? placement.height / 2 : placement.side === "top" ? placement.height : 0;
      el.style.left = `${placement.left + offsetX}px`;
      el.style.top = `${placement.top + offsetY}px`;
      el.dataset.side = placement.side;
      el.style.visibility = placement.hidden ? "hidden" : "visible";
    };
    const onResize = () => {
      if (anchor.current !== null) anchorRect = anchor.current.getBoundingClientRect();
      fit();
    };
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.borderBoxSize;
      size = (Array.isArray(box) ? box[0] : box) ?? measure();
      fit();
    });
    observer.observe(el, { box: "border-box" });
    size = measure();
    fit();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [
    align,
    gap,
    pos,
    side,
    suppressed,
    visible
  ]);
  (0, import_react.useEffect)(() => {
    announce(visible);
    return () => {
      announce(false);
    };
  }, [announce, visible]);
  const cancelShow = (0, import_react.useCallback)(() => {
    if (showTimer.current === null) return;
    clearTimeout(showTimer.current);
    showTimer.current = null;
  }, []);
  (0, import_react.useEffect)(() => {
    if (pinned && (disabled || !openOnClick)) setPinned(false);
    if (disabled) {
      cancelShow();
      triggers.current = {
        hover: false,
        focus: false
      };
      setPos(null);
    }
    return cancelShow;
  }, [
    cancelShow,
    disabled,
    openOnClick,
    pinned
  ]);
  const show = () => {
    if (disabled) return;
    const el = anchor.current;
    if (el === null) return;
    setPos(el.getBoundingClientRect());
    announce(true);
  };
  const showAfterDelay = (delay) => {
    cancelShow();
    if (delay <= 0) {
      show();
      return;
    }
    showTimer.current = setTimeout(() => {
      showTimer.current = null;
      show();
    }, delay);
  };
  const withdraw = (0, import_react.useCallback)(() => {
    setPinned(false);
    setPos(null);
    announce(false);
  }, [announce]);
  const hide = () => {
    cancelShow();
    if (!triggers.current.hover && !triggers.current.focus && !pinned) withdraw();
  };
  const dismiss = (0, import_react.useCallback)(() => {
    cancelShow();
    triggers.current = {
      hover: false,
      focus: false
    };
    withdraw();
  }, [cancelShow, withdraw]);
  (0, import_dsh_client_ui_primitives.useDismissOnOutsidePointer)(anchor, openOnClick && visible, dismiss, bubble);
  (0, import_react.useEffect)(() => {
    if (!openOnClick || !visible) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" && event.key !== "Tab") return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
      dismiss();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [
    dismiss,
    openOnClick,
    visible
  ]);
  const content = visible && !suppressed && (0, import_jsx_runtime.jsxs)("span", {
    ref: bubble,
    id: openOnClick ? id : void 0,
    className: css$23.bubble,
    "data-side": side,
    "data-portal": portal || void 0,
    "data-pinned": pinned || void 0,
    "data-align": align,
    "data-has-shortcut": shortcutKeys?.length ? true : void 0,
    style: {
      left: pos.left,
      top: pos.top,
      visibility: "hidden",
      ...maxWidth === void 0 ? {} : { maxWidth: `min(${maxWidth}px, calc(100vw - 24px))` }
    },
    role: "tooltip",
    "aria-label": shortcutKeys?.length ? [resolvedLabel, shortcutKeys.join(" ")].filter(Boolean).join(" ") : void 0,
    children: [resolvedLabel && (0, import_jsx_runtime.jsx)("span", {
      className: css$23.label,
      children: resolvedLabel
    }), shortcutKeys !== void 0 && shortcutKeys.length > 0 && (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.ShortcutKeys, {
      keys: shortcutKeys,
      variant: "tooltip"
    })]
  });
  return (0, import_jsx_runtime.jsxs)(TooltipSuppression.Provider, {
    value: setSuppressed,
    children: [(0, import_react.cloneElement)(children, {
      ref: mergedRef,
      "aria-describedby": openOnClick && visible ? [children.props["aria-describedby"], id].filter(Boolean).join(" ") : children.props["aria-describedby"],
      onMouseEnter: (e) => {
        children.props.onMouseEnter?.(e);
        triggers.current.hover = true;
        showAfterDelay(delayMs);
      },
      onMouseLeave: (e) => {
        children.props.onMouseLeave?.(e);
        triggers.current.hover = false;
        cancelShow();
        if (!pinned) withdraw();
      },
      onClick: (e) => {
        children.props.onClick?.(e);
        triggers.current.focus = false;
        cancelShow();
        if (openOnClick && !disabled && !pinned) {
          setPinned(true);
          show();
        } else withdraw();
      },
      onFocus: (e) => {
        children.props.onFocus?.(e);
        if ((0, import_dsh_client_ui_primitives.pointerModality)()) return;
        triggers.current.focus = true;
        showAfterDelay(focusDelayMs);
      },
      onBlur: (e) => {
        children.props.onBlur?.(e);
        triggers.current.focus = false;
        hide();
      }
    }), portal ? content !== false && (0, import_react_dom.createPortal)(content, document.body) : content]
  });
}

// src/vendor/dsh-tooltip.css
var dsh_tooltip_default = "/* MIT, Copyright (c) 2026 DeepSeek; namespaced for this plugin. */\n.dsh-ie-tip-bubble {\n  display: inline-flex;\n  align-items: safe center;\n  gap: 8px;\n  position: fixed;\n  z-index: 100;\n  /* Fixed-position shrink-to-fit measures only the space from `left` to the\n     viewport edge, so anchors near the right edge would wrap early;\n     max-content sizes by the label alone, capped at half the viewport. */\n  width: max-content;\n  box-sizing: border-box;\n  max-width: min(50vw, calc(100vw - 24px));\n  max-height: calc(100vh - 24px);\n  overflow: auto;\n  padding: 3px 7px;\n  border-radius: var(--dsw-radius-sm, 8px);\n  background: var(--dsw-alias-tooltip-bg, #292a2d);\n  color: var(--dsw-static-neutral-bluish-00, #fff);\n  font-family: var(--dsw-font-family, system-ui, sans-serif);\n  font-weight: 400;\n  font-style: normal;\n  letter-spacing: normal;\n  text-align: start;\n  font-size: 13px;\n  line-height: 20px;\n  white-space: pre-line;\n  /* Unbreakable tokens (URLs, paths) must not push past max-width. */\n  overflow-wrap: break-word;\n  pointer-events: none;\n  animation: dsh-ie-tooltip-in 150ms var(--ds-ease-in-out, ease-in-out);\n}\n\n.dsh-ie-tip-bubble[data-portal] { z-index: 1100; }\n.dsh-ie-tip-bubble[data-pinned] { pointer-events: auto; }\n.dsh-ie-tip-label { min-width: 0; }\n\n/* A 16px keycap centered beside a 20px label has 5px of vertical clearance. */\n.dsh-ie-tip-bubble[data-has-shortcut] { padding-inline-end: 5px; }\n.dsh-ie-tip-bubble[data-has-shortcut]:not(:has(.dsh-ie-tip-label)) { padding: 3px; }\n\n.dsh-ie-tip-bubble[data-side='right'],\n.dsh-ie-tip-bubble[data-side='left'] {\n  transform: translateY(-50%);\n}\n\n.dsh-ie-tip-bubble[data-side='bottom'] {\n  transform: translateX(-50%);\n}\n\n.dsh-ie-tip-bubble[data-side='top'] {\n  transform: translate(-50%, -100%);\n}\n\n/* End alignment: `left` carries the anchor's right edge, so the bubble sits\n   fully left of it instead of centering. */\n.dsh-ie-tip-bubble[data-side='bottom'][data-align='end'] {\n  transform: translateX(-100%);\n}\n\n.dsh-ie-tip-bubble[data-side='top'][data-align='end'] {\n  transform: translate(-100%, -100%);\n}\n\n@keyframes dsh-ie-tooltip-in {\n  from { opacity: 0; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .dsh-ie-tip-bubble {\n    animation: none;\n  }\n}\n";

// src/core.js
var MAX_TEXT_LENGTH = 2e5;
var MAX_IMAGE_BYTES = 20 * 1024 * 1024;
var MAX_FILE_BYTES = 64 * 1024 * 1024;
var MAX_TOTAL_BYTES = 128 * 1024 * 1024;
var MAX_ATTACHMENTS = 32;
var IMAGE_TYPES = /* @__PURE__ */ new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
var EditError = class extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "EditError";
    this.code = code;
    Object.assign(this, details);
  }
};
function contentView(data) {
  const text = [], attachments = [], extraBlocks = [];
  for (const block of Array.isArray(data.content) ? data.content : []) {
    if (block?.type === "text" && typeof block.text === "string") text.push(block.text);
    else if (block?.type === "image" && block.attachment) attachments.push({ type: "image", image: { attachment: block.attachment } });
    else if (block?.type === "file" && block.attachment) attachments.push({ type: "file", file: block.attachment });
    else extraBlocks.push(block);
  }
  return { text: text.join(""), attachments, extraBlocks, ...data.referenceLabels ? { referenceLabels: data.referenceLabels } : {} };
}
function originalAttachments(data) {
  return (Array.isArray(data.content) ? data.content : []).flatMap((block, index) => ["file", "image"].includes(block?.type) && block.attachment && typeof block.attachment.attachmentId === "string" && Number.isSafeInteger(block.attachment.bytes) && block.attachment.bytes >= 0 ? [{
    key: "original:" + index,
    origin: "original",
    type: block.type,
    index,
    ref: block.attachment,
    name: block.attachment.name || "image",
    size: block.attachment.bytes
  }] : []);
}
function newAttachment(file, key) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mediaType = file.type || { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[extension];
  return { key, origin: "new", type: IMAGE_TYPES.has(mediaType) ? "image" : "file", file, mediaType, name: file.name || "attachment", size: file.size };
}
function draftChanged(data, text, attachments) {
  const original = originalAttachments(data);
  return text !== contentView(data).text || original.length !== attachments.length || attachments.some((a, i) => a.origin !== "original" || a.index !== original[i]?.index);
}
function editRestriction(node) {
  if (!["user", "steering"].includes(node?.kind) || !Number.isSafeInteger(node.data?.seq) || node.data.seq < 1) return "unsupported";
  if (!Array.isArray(node.data.content) || !node.data.content.length) return "unsupported";
  if (node.data.referenceLabels?.length || node.data.skillNames?.length) return "references";
  for (const block of node.data.content) {
    if (block?.type === "text" && typeof block.text === "string") continue;
    if (["image", "file"].includes(block?.type) && typeof block.attachment?.attachmentId === "string" && Number.isSafeInteger(block.attachment.bytes) && block.attachment.bytes >= 0) continue;
    return "unsupported";
  }
  return null;
}
function sessionRestriction(snapshot) {
  if (!snapshot || snapshot.openState !== "open" || snapshot.removed) return "notReady";
  if (snapshot.subagent) return "subagent";
  if (snapshot.running || snapshot.awaitingFirstTurn || snapshot.pendingSubmissions?.length) return "running";
  return null;
}
function validateAttachments(attachments, data) {
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) throw new EditError("attachmentCount");
  let total = 0, images = 0;
  const keys = /* @__PURE__ */ new Set();
  for (const item of attachments) {
    if (keys.has(item.key)) throw new EditError("unsupported");
    keys.add(item.key);
    if (!["image", "file"].includes(item.type) || !Number.isSafeInteger(item.size) || item.size < 0) throw new EditError("unsupported");
    if (item.origin === "original") {
      const block = data.content[item.index];
      if (block?.type !== item.type || block.attachment?.attachmentId !== item.ref?.attachmentId || block.attachment?.name !== item.ref?.name || block.attachment?.bytes !== item.size) throw new EditError("unsupported");
    } else if (item.origin !== "new" || item.file?.size !== item.size || typeof item.file.arrayBuffer !== "function") throw new EditError("unsupported");
    if (item.size > MAX_FILE_BYTES) throw new EditError("fileSize");
    total += item.size;
    if (item.type === "image") images += item.size;
  }
  if (total > MAX_TOTAL_BYTES) throw new EditError("totalSize");
  if (images > MAX_IMAGE_BYTES) throw new EditError("imageSize");
}
function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
async function prepareAttachments(items, source, api, check) {
  const prepared = [];
  for (const item of items) {
    check();
    if (item.type === "file") {
      prepared.push(item);
      continue;
    }
    const image = item.origin === "original" ? await api.readImage(source, item.ref.attachmentId) : {
      attachment: { mediaType: item.mediaType, name: item.name },
      data: new Uint8Array(await item.file.arrayBuffer())
    };
    check();
    if (!(image.data instanceof Uint8Array) || image.data.byteLength !== item.size) throw new EditError("imageRead");
    if (!IMAGE_TYPES.has(image.attachment?.mediaType)) throw new EditError("imageType");
    prepared.push({ type: "image", mediaType: image.attachment.mediaType, data: toBase64(image.data), ...image.attachment.name ? { name: image.attachment.name } : {} });
  }
  return prepared;
}
function createEditCoordinator(api) {
  const busy = /* @__PURE__ */ new Set(), lifetime = new AbortController();
  function check() {
    if (lifetime.signal.aborted) throw new EditError("disposed");
  }
  return {
    dispose() {
      lifetime.abort();
    },
    async save({ sessionId, node, text, attachments = originalAttachments(node.data), mode = "branch", requestId }) {
      check();
      const restriction = editRestriction(node);
      if (restriction) throw new EditError(restriction);
      if (typeof text !== "string" || !text.trim() && !attachments.length) throw new EditError("empty");
      if (text.length > MAX_TEXT_LENGTH) throw new EditError("tooLong");
      validateAttachments(attachments, node.data);
      if (!draftChanged(node.data, text, attachments)) throw new EditError("unchanged");
      if (busy.has(sessionId)) throw new EditError("duplicate");
      busy.add(sessionId);
      let childId, stage = "prepare";
      try {
        return await api.using(sessionId, async (source) => {
          check();
          const reason = sessionRestriction(source.getSnapshot());
          if (reason) throw new EditError(reason);
          if (mode === "current") {
            if (node.kind !== "user") throw new EditError("steeringCurrent");
            const plan = await api.planCurrent(sessionId, node.data.seq, lifetime.signal);
            const content = text ? [{ type: "text", text }] : [];
            for (const item of attachments) {
              check();
              if (item.origin === "original") content.push({ type: "original", index: item.index });
              else if (item.type === "file") {
                const receipt = await api.uploadFile(sessionId, item.file, lifetime.signal);
                content.push({ type: "file", receiptId: receipt.receiptId });
              } else {
                const [image] = await prepareAttachments([item], source, api, check);
                content.push(image);
              }
            }
            check();
            stage = "current";
            return await api.editCurrent({ sourceId: sessionId, seq: node.data.seq, tail: plan.tail, requestId, content }, lifetime.signal);
          }
          const atSeq = api.resolveBoundary ? await api.resolveBoundary(sessionId, node.data.seq, lifetime.signal) : node.data.seq - 1;
          if (!Number.isSafeInteger(atSeq) || atSeq < 0 || atSeq >= node.data.seq) throw new EditError("unsupported");
          const prepared = await prepareAttachments(attachments, source, api, check);
          check();
          const latestReason = sessionRestriction(source.getSnapshot());
          if (latestReason) throw new EditError(latestReason);
          stage = "fork";
          childId = await api.fork(sessionId, atSeq);
          check();
          stage = "open";
          return await api.using(childId, async (child) => {
            check();
            if (sessionRestriction(child.getSnapshot())) throw new EditError("notReady");
            stage = "attachments";
            const content = text ? [{ type: "text", text }] : [];
            for (const item of prepared) {
              check();
              if (item.type === "image") {
                content.push(item);
                continue;
              }
              const receipt = item.origin === "original" ? await api.reuseFile({ sourceId: sessionId, childId, seq: node.data.seq, index: item.index }, lifetime.signal) : await api.uploadFile(childId, item.file, lifetime.signal);
              check();
              content.push({ type: "file", receiptId: receipt.receiptId });
            }
            check();
            stage = "prompt";
            await api.prompt(child, content, lifetime.signal);
            return { childId, sourceId: sessionId, atSeq };
          });
        });
      } catch (error) {
        if (error instanceof EditError) {
          if (childId) error.childId = childId;
          error.stage = stage;
          throw error;
        }
        throw new EditError(mode === "current" ? stage === "current" ? "currentUncertain" : "currentFailed" : childId ? "branchFailed" : "failed", { childId, stage });
      } finally {
        busy.delete(sessionId);
      }
    }
  };
}
function nativeAdapter(ctx) {
  async function post(path, request, signal) {
    const response = await ctx.fileUpload.post({ path, body: new Blob([JSON.stringify(request)], { type: "application/json" }), headers: { "content-type": "application/json" }, signal });
    const result = JSON.parse(response.body);
    if (response.status !== 200 || !result.ok) throw new EditError(result.error ?? "fileRead");
    return result.value;
  }
  return {
    planCurrent(sourceId, seq, signal) {
      return post("api/dsh-inline-edit/plan", { sourceId, seq, mode: "current" }, signal);
    },
    editCurrent(request, signal) {
      return post("api/dsh-inline-edit/current", request, signal);
    },
    async resolveBoundary(sourceId, seq, signal) {
      try {
        return (await post("api/dsh-inline-edit/plan", { sourceId, seq }, signal)).atSeq;
      } catch {
        throw new EditError("failed");
      }
    },
    using(id, operation) {
      return ctx.sessions.using(id, { source: "controllerOperation" }, async (reference) => operation((await reference.ready).session));
    },
    fork(sessionId, atSeq) {
      return ctx.sessions.fork({ sessionId, atSeq, increaseTitle: false, allowMigration: false });
    },
    async readImage(session, id) {
      const result = await session.readAttachment(id);
      if (!result.ok) throw new EditError("imageRead");
      return result.value;
    },
    async uploadFile(childId, file, signal) {
      const result = await ctx.fileUpload.upload(childId, file, file.name || void 0, signal);
      if (!result.ok || !result.value?.receiptId) throw new EditError("fileUpload");
      return result.value;
    },
    async reuseFile(request, signal) {
      const value = await post("api/dsh-inline-edit/reuse-file", request, signal);
      if (!value?.receiptId) throw new EditError("fileRead");
      return value;
    },
    async prompt(session, content, signal) {
      const result = await session.prompt(content, "queue", signal);
      if (!result.ok) throw new EditError("promptRejected");
    }
  };
}

// src/messages.js
var zh = {
  settingsTitle: "\u6D88\u606F\u7F16\u8F91",
  autoSave: "\u81EA\u52A8\u4FDD\u5B58",
  branchBadge: "\u65B0\u804A\u5929",
  currentBadge: "\u4EC5\u6700\u8FD1\u4E3B\u6D88\u606F",
  notesTitle: "\u4F7F\u7528\u8BF4\u660E",
  latestNote: "\u4E3B\u6D88\u606F\u6307\u7A7A\u95F2\u65F6\u53D1\u9001\u3001\u53D1\u8D77\u4E00\u8F6E\u4EFB\u52A1\u7684\u6D88\u606F\u3002\u8FD0\u884C\u65F6\u63D2\u8BDD\u6216\u6392\u961F\u8FFD\u52A0\u7684\u8865\u5145\u6D88\u606F\u4E0D\u652F\u6301\u539F\u5730\u7F16\u8F91\uFF1B\u66F4\u65E9\u7684\u4E3B\u6D88\u606F\u8BF7\u9009\u62E9\u300C\u589E\u52A0\u5206\u652F\u300D\u3002",
  settingsIntro: "\u9009\u62E9\u7F16\u8F91\u5DF2\u53D1\u9001\u6D88\u606F\u540E\u7684\u5904\u7406\u65B9\u5F0F\u3002\u8BBE\u7F6E\u81EA\u52A8\u4FDD\u5B58\uFF0C\u4EC5\u5F71\u54CD\u4E4B\u540E\u7684\u7F16\u8F91\uFF1B\u5207\u6362\u9009\u9879\u4E0D\u4F1A\u7ACB\u5373\u6539\u52A8\u5DF2\u6709\u5BF9\u8BDD\u3002",
  modeLabel: "\u91CD\u65B0\u751F\u6210\u65B9\u5F0F",
  branchTitle: "\u589E\u52A0\u5206\u652F",
  branchDescription: "\u4ECE\u4FEE\u6539\u7684\u4F4D\u7F6E\u53E6\u5EFA\u4E00\u4E2A\u804A\u5929\u7EE7\u7EED\uFF0C\u4FDD\u7559\u539F\u5BF9\u8BDD\u3002\u9002\u5408\u4FEE\u6539\u8F83\u65E9\u7684\u6D88\u606F\u3002",
  currentTitle: "\u5728\u5F53\u524D\u5BF9\u8BDD\u91CD\u65B0\u751F\u6210",
  currentDescription: "\u4EC5\u4FEE\u6539\u6700\u8FD1\u4E00\u6761\u53D1\u8D77\u4EFB\u52A1\u7684\u4E3B\u6D88\u606F\uFF0C\u53EF\u8C03\u6574\u6587\u5B57\u548C\u9644\u4EF6\u3002\u8BE5\u6D88\u606F\u4E4B\u540E\u7684\u8865\u5145\u6D88\u606F\u548C\u56DE\u7B54\u4F1A\u4E00\u5E76\u66FF\u6362\uFF0C\u4FA7\u8FB9\u680F\u4E0D\u65B0\u589E\u804A\u5929\u3002",
  branchMode: "\u5728\u65B0\u5206\u652F\u91CD\u65B0\u751F\u6210",
  historyNote: "\u65E7\u5185\u5BB9\u4ECD\u53EF\u5728\u300C\u8F68\u8FF9\u300D\u4E2D\u67E5\u770B\u3002\u5DF2\u538B\u7F29\u7684\u5386\u53F2\u3001\u8F6E\u5185\u8865\u5145\u6D88\u606F\u8BF7\u4F7F\u7528\u5206\u652F\u6A21\u5F0F\u3002",
  settingSaved: "\u5DF2\u4FDD\u5B58",
  settingFailed: "\u4FDD\u5B58\u5931\u8D25\uFF0C\u4ECD\u4F7F\u7528\u670D\u52A1\u5668\u5DF2\u4FDD\u5B58\u7684\u9009\u9879\u3002\u8BF7\u68C0\u67E5\u8FDE\u63A5\u540E\u91CD\u8BD5\u3002",
  settingSaving: "\u6B63\u5728\u4FDD\u5B58\u2026",
  settingLoading: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026",
  settingReadOnly: "\u5F53\u524D\u914D\u7F6E\u4E3A\u53EA\u8BFB\u3002",
  latestOnly: "\u5F53\u524D\u6A21\u5F0F\u53EA\u80FD\u7F16\u8F91\u6700\u8FD1\u4E00\u6761\u4E3B\u6D88\u606F\u3002\u66F4\u65E9\u7684\u6D88\u606F\u8BF7\u4F7F\u7528\u589E\u52A0\u5206\u652F\u6A21\u5F0F\u3002",
  supplemental: "\u8FD0\u884C\u65F6\u63D2\u8BDD\u6216\u6392\u961F\u8FFD\u52A0\u7684\u8865\u5145\u6D88\u606F\u4E0D\u652F\u6301\u5F53\u524D\u5BF9\u8BDD\u7F16\u8F91\u3002",
  stale: "\u8FD9\u6761\u6D88\u606F\u4E4B\u540E\u7684\u4F1A\u8BDD\u5DF2\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u5E76\u91CD\u65B0\u7F16\u8F91\u3002",
  compacted: "\u8FD9\u6761\u6D88\u606F\u5DF2\u88AB\u538B\u7F29\uFF0C\u65E0\u6CD5\u5728\u5F53\u524D\u4F1A\u8BDD\u56DE\u9000\uFF0C\u8BF7\u6539\u7528\u589E\u52A0\u5206\u652F\u3002",
  steeringCurrent: "\u8F6E\u5185\u8865\u5145\u6D88\u606F\u6682\u4E0D\u652F\u6301\u539F\u4F1A\u8BDD\u91CD\u53D1\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u9009\u62E9\u589E\u52A0\u5206\u652F\u3002",
  imageModel: "\u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u56FE\u7247\uFF0C\u8BF7\u5207\u6362\u6A21\u578B\u6216\u79FB\u9664\u56FE\u7247\u3002",
  currentFailed: "\u672A\u80FD\u63D0\u4EA4\u4FEE\u6539\uFF0C\u539F\u5BF9\u8BDD\u4FDD\u7559\u3002\u8BF7\u68C0\u67E5\u8FDE\u63A5\u3001\u9644\u4EF6\u53CA\u6A21\u578B\u8BBE\u7F6E\u540E\u91CD\u8BD5\u3002",
  currentUncertain: "\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4\u63D0\u4EA4\u72B6\u6001\uFF0C\u8BF7\u5148\u5237\u65B0\u5E76\u68C0\u67E5\u5F53\u524D\u804A\u5929\u3002\u5173\u95ED\u7F16\u8F91\u6846\u4E0D\u4F1A\u89E3\u9501\uFF1B\u786E\u8BA4\u7ED3\u679C\u524D\u4E0D\u8981\u91CD\u590D\u63D0\u4EA4\u3002",
  checkedOutcome: "\u6211\u5DF2\u68C0\u67E5\u63D0\u4EA4\u7ED3\u679C",
  confirmChecked: "\u8BF7\u786E\u8BA4\u5DF2\u5237\u65B0\u5E76\u68C0\u67E5\u4F1A\u8BDD\u4E0E\u5F85\u53D1\u9001\u961F\u5217\u3002\u89E3\u9501\u4E0D\u64A4\u9500\u4E0A\u6B21\u8BF7\u6C42\uFF1B\u5982\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u53D6\u6D88\u3002\u4ECD\u8981\u89E3\u9501\u5417\uFF1F",
  edit: "\u7F16\u8F91\u6D88\u606F",
  copy: "\u590D\u5236\u6D88\u606F",
  copied: "\u5DF2\u590D\u5236",
  copyFailed: "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u6587\u672C\u590D\u5236\u3002",
  label: "\u7F16\u8F91\u8FD9\u6761\u6D88\u606F",
  cancel: "\u53D6\u6D88",
  save: "\u53D1\u9001",
  saving: "\u53D1\u9001\u4E2D\u2026",
  attachments: "\u6D88\u606F\u9644\u4EF6",
  addFiles: "\u6DFB\u52A0\u6587\u4EF6",
  addHint: "\u6DFB\u52A0\u6587\u4EF6\uFF0C\u4E5F\u53EF\u4EE5\u62D6\u5165\u6216\u7C98\u8D34\u9644\u4EF6",
  remove: "\u79FB\u9664",
  removeHint: "\u4EC5\u4ECE\u8FD9\u6761\u6D88\u606F\u79FB\u9664\uFF0C\u4E0D\u5220\u9664\u539F\u6587\u4EF6",
  fileRead: "\u65E7\u9644\u4EF6\u590D\u7528\u5931\u8D25\uFF0C\u672A\u63D0\u4EA4\u6D88\u606F\u3002\u8BF7\u68C0\u67E5\u65B0\u5206\u652F\uFF0C\u6216\u79FB\u9664\u65E7\u9644\u4EF6\u540E\u91CD\u65B0\u6DFB\u52A0\u6587\u4EF6\u3002",
  fileUpload: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF0C\u672A\u63D0\u4EA4\u6D88\u606F\u3002\u8BF7\u68C0\u67E5\u8FDE\u63A5\u540E\u91CD\u8BD5\u3002",
  fileSize: "\u5355\u4E2A\u9644\u4EF6\u8BF7\u63A7\u5236\u5728 64 MiB \u4EE5\u5185\u3002",
  totalSize: "\u9644\u4EF6\u5408\u8BA1\u8BF7\u63A7\u5236\u5728 128 MiB \u4EE5\u5185\u3002",
  attachmentCount: "\u4E00\u6761\u6D88\u606F\u6700\u591A\u6DFB\u52A0 32 \u4E2A\u9644\u4EF6\u3002",
  hint: "\u4FEE\u6539\u540E\u4ECE\u8FD9\u91CC\u5F00\u542F\u65B0\u5206\u652F\uFF0C\u539F\u5BF9\u8BDD\u4FDD\u7559\u3002",
  effects: "\u91CD\u65B0\u751F\u6210\u4E0D\u4F1A\u64A4\u9500\u4E4B\u524D\u5DF2\u7ECF\u6267\u884C\u7684\u6587\u4EF6\u4FEE\u6539\u3001\u547D\u4EE4\u6216\u5176\u4ED6\u64CD\u4F5C\u3002",
  keys: "Enter \u6362\u884C \xB7 Ctrl/\u2318 + Enter \u53D1\u9001 \xB7 Esc \u53D6\u6D88",
  recover: "\u6253\u5F00\u65B0\u5206\u652F\u68C0\u67E5",
  returned: "\u65B0\u56DE\u7B54\u5DF2\u5728\u5206\u652F\u4E2D\u5F00\u59CB\u751F\u6210\u3002",
  empty: "\u8BF7\u8F93\u5165\u6587\u5B57\u6216\u6DFB\u52A0\u9644\u4EF6\u3002",
  tooLong: "\u6D88\u606F\u8D85\u8FC7 20 \u4E07\u4E2A\u5B57\u7B26\uFF0C\u8BF7\u7F29\u77ED\u540E\u518D\u53D1\u9001\u3002",
  unchanged: "\u5185\u5BB9\u6CA1\u6709\u53D8\u5316\u3002",
  unsupported: "\u8FD9\u6761\u6D88\u606F\u5305\u542B\u6682\u4E0D\u652F\u6301\u91CD\u65B0\u63D0\u4EA4\u7684\u5185\u5BB9\u3002",
  references: "\u6B64\u6D88\u606F\u5305\u542B\u6280\u80FD\u6216\u4F1A\u8BDD\u5F15\u7528\uFF0C\u8BF7\u4F7F\u7528\u539F\u751F\u8F93\u5165\u6846\u91CD\u65B0\u9009\u62E9\u5F15\u7528\u540E\u53D1\u9001\u3002",
  notReady: "\u4F1A\u8BDD\u5C1A\u672A\u52A0\u8F7D\u5B8C\u6210\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
  running: "\u8BF7\u7B49\u5F85\u5F53\u524D\u56DE\u7B54\u5B8C\u6210\uFF0C\u6216\u5148\u505C\u6B62\u751F\u6210\u3002",
  subagent: "\u5B50\u667A\u80FD\u4F53\u7684\u6D88\u606F\u4E0D\u80FD\u5728\u8FD9\u91CC\u91CD\u53D1\u3002",
  duplicate: "\u8FD9\u6BB5\u4F1A\u8BDD\u5DF2\u6709\u7F16\u8F91\u6B63\u5728\u63D0\u4EA4\u3002",
  disposed: "\u63D2\u4EF6\u5DF2\u505C\u7528\uFF0C\u8BF7\u91CD\u65B0\u542F\u7528\u540E\u518D\u8BD5\u3002",
  imageRead: "\u539F\u56FE\u7247\u8BFB\u53D6\u5931\u8D25\uFF0C\u6D88\u606F\u672A\u91CD\u65B0\u53D1\u9001\u3002",
  imageSize: "\u56FE\u7247\u603B\u5927\u5C0F\u8D85\u8FC7 20 MiB\uFF0C\u8BF7\u5728\u65B0\u6D88\u606F\u4E2D\u91CD\u65B0\u4E0A\u4F20\u3002",
  imageType: "\u539F\u56FE\u7247\u683C\u5F0F\u4E0D\u652F\u6301\u91CD\u65B0\u63D0\u4EA4\u3002",
  failed: "\u672A\u80FD\u5B8C\u6210\u64CD\u4F5C\uFF0C\u7F16\u8F91\u5185\u5BB9\u5DF2\u4FDD\u7559\u3002\u5982\u7F51\u7EDC\u4E2D\u65AD\uFF0C\u8BF7\u5148\u68C0\u67E5\u4F1A\u8BDD\u5217\u8868\u662F\u5426\u4EA7\u751F\u5206\u652F\uFF0C\u518D\u91CD\u8BD5\u3002",
  branchFailed: "\u65B0\u5206\u652F\u5DF2\u7ECF\u521B\u5EFA\uFF0C\u4F46\u540E\u7EED\u6B65\u9AA4\u672A\u80FD\u786E\u8BA4\u5B8C\u6210\u3002\u8BF7\u5148\u6253\u5F00\u5206\u652F\u68C0\u67E5\uFF0C\u907F\u514D\u91CD\u590D\u53D1\u9001\u3002",
  promptRejected: "\u672A\u80FD\u786E\u8BA4\u6D88\u606F\u5DF2\u88AB\u63A5\u53D7\u3002\u8BF7\u6253\u5F00\u65B0\u5206\u652F\u68C0\u67E5\uFF0C\u5FC5\u8981\u65F6\u5728\u5206\u652F\u7684\u8F93\u5165\u6846\u4E2D\u91CD\u65B0\u53D1\u9001\u3002"
};
var en = {
  settingsTitle: "Message editing",
  autoSave: "Saved automatically",
  branchBadge: "New chat",
  currentBadge: "Latest main message",
  notesTitle: "Usage notes",
  latestNote: "A main message starts a task while idle. Steering or queued input added during generation cannot be edited here. Use branches for earlier main messages.",
  settingsIntro: "This saved setting applies to future edits. Switching options does not change existing conversations.",
  modeLabel: "Regeneration mode",
  branchTitle: "Create a branch",
  branchDescription: "Keep the original conversation and continue in a new chat from the edit.",
  currentTitle: "Regenerate in this conversation",
  currentDescription: "Edit the latest message that started a task, including its text or attachments. Later supplemental messages and answers are replaced. No new sidebar chat is created.",
  branchMode: "Regenerate in a new branch",
  historyNote: "Audit records remain available in Trace. Use branches for compacted history and in-turn steering.",
  settingSaved: "Saved",
  settingFailed: "Could not save. The accepted server setting remains active.",
  settingSaving: "Saving\u2026",
  settingLoading: "Loading settings\u2026",
  settingReadOnly: "This configuration is read-only.",
  latestOnly: "Only the latest main message can be edited here. Use branch mode for older main messages.",
  supplemental: "Input added during generation cannot be edited in this conversation.",
  stale: "The conversation changed. Refresh it and edit again.",
  compacted: "This message was compacted. Use branch mode.",
  steeringCurrent: "In-turn steering currently requires branch mode.",
  imageModel: "The selected model does not support images.",
  currentFailed: "The edit could not be submitted. The original conversation is preserved. Check the connection, attachments and model.",
  currentUncertain: "Submission status is uncertain. Refresh and inspect this chat before retrying. Closing the editor does not unlock submission.",
  checkedOutcome: "I checked the submission outcome",
  confirmChecked: "Confirm you refreshed and checked the conversation and pending queue. Unlocking does not cancel the previous request. Cancel if unsure. Unlock anyway?",
  edit: "Edit message",
  copy: "Copy message",
  copied: "Copied",
  copyFailed: "Could not copy. Select and copy the text manually.",
  label: "Edit this message",
  cancel: "Cancel",
  save: "Send",
  saving: "Sending\u2026",
  attachments: "Message attachments",
  addFiles: "Add files",
  addHint: "Add, drop or paste files",
  remove: "Remove",
  removeHint: "Remove from this message; the original file is kept",
  fileRead: "Could not reuse an attachment. Nothing was submitted. Check the branch or reattach the file.",
  fileUpload: "Upload failed. Nothing was submitted. Check your connection.",
  fileSize: "Each attachment must be at most 64 MiB.",
  totalSize: "Attachments must total at most 128 MiB.",
  attachmentCount: "A message can have at most 32 attachments.",
  hint: "Continue in a new branch from here. The original conversation is preserved.",
  effects: "This does not undo file changes or other actions already performed.",
  keys: "Enter: newline \xB7 Ctrl/\u2318 + Enter: send \xB7 Esc: cancel",
  recover: "Open branch to check",
  returned: "The new answer has started in a branch.",
  empty: "Enter text or attach a file.",
  tooLong: "Keep the message under 200,000 characters.",
  unchanged: "The message has not changed.",
  unsupported: "This message contains content that cannot be resubmitted here.",
  references: "Reselect skills or session references in the native composer before sending.",
  notReady: "Wait for the conversation to finish loading.",
  running: "Wait for the current answer to finish, or stop it first.",
  subagent: "Subagent messages cannot be resubmitted here.",
  duplicate: "An edit is already being submitted in this conversation.",
  disposed: "The plugin has been disabled.",
  imageRead: "An original image could not be read. Nothing was resent.",
  imageSize: "Images exceed 20 MiB. Upload them in a new message.",
  imageType: "The original image format cannot be resubmitted.",
  failed: "The operation could not finish. Your draft is preserved. After a network failure, check the session list for a new branch before retrying.",
  branchFailed: "A branch was created, but the next step could not be confirmed. Open it before retrying to avoid a duplicate.",
  promptRejected: "Message acceptance could not be confirmed. Open the branch and, if needed, resend from its composer."
};
function labels(locale) {
  return /^en\b/i.test(locale ?? "") ? en : zh;
}

// src/settings.jsx
var import_react2 = __toESM(require("react"), 1);
var import_jsx_runtime2 = require("react/jsx-runtime");
function useSettings(form) {
  const source = (0, import_react2.useMemo)(() => ({ subscribe: (fn) => form.subscribe(fn), read: () => form.getSnapshot() }), [form]);
  return (0, import_react2.useSyncExternalStore)(source.subscribe, source.read, source.read);
}
function EditSettings({ form }) {
  const state = useSettings(form), [saving, setSaving] = (0, import_react2.useState)(false), [status, setStatus] = (0, import_react2.useState)("");
  const t = labels(document.documentElement.lang || navigator.language), id = (0, import_react2.useId)();
  async function choose(mode) {
    if (saving || !state.writable || state.status !== "ready") return;
    setSaving(true);
    setStatus("");
    try {
      setStatus(await form.set("mode", mode) ? t.settingSaved : t.settingFailed);
    } catch {
      setStatus(t.settingFailed);
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dsh-ie-settings", "aria-labelledby": `${id}-title`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { id: `${id}-title`, children: t.settingsTitle }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsh-ie-settings-intro", id: `${id}-intro`, children: t.settingsIntro }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("fieldset", { disabled: saving || state.status !== "ready" || !state.writable, "aria-describedby": `${id}-intro`, "aria-busy": saving, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("legend", { children: t.modeLabel }),
      ["branch", "current"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dsh-ie-mode", "data-selected": state.value?.mode === mode, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: `${id}-mode`, value: mode, checked: state.value?.mode === mode, "aria-labelledby": `${id}-${mode}-title`, "aria-describedby": `${id}-${mode}-description`, onChange: () => void choose(mode) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsh-ie-mode-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsh-ie-mode-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { id: `${id}-${mode}-title`, children: mode === "branch" ? t.branchTitle : t.currentTitle }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-ie-mode-badge", children: mode === "branch" ? t.branchBadge : t.currentBadge })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { id: `${id}-${mode}-description`, children: mode === "branch" ? t.branchDescription : t.currentDescription })
        ] })
      ] }, mode))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsh-ie-settings-status", role: "status", "aria-atomic": "true", "data-error": status === t.settingFailed, children: saving ? t.settingSaving : state.status !== "ready" ? t.settingLoading : !state.writable ? t.settingReadOnly : status || t.autoSave }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-ie-settings-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: t.notesTitle }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("ul", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: t.latestNote }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: t.effects }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: t.historyNote })
      ] })
    ] })
  ] });
}

// src/chat-history.jsx
var import_react3 = __toESM(require("react"), 1);

// src/history.js
var EDIT_PROJECTION = "dsh-inline-edit-history";
var LATEST_PROJECTION = "dsh-inline-edit-latest";
function isHidden(seq, ranges) {
  return Number.isFinite(seq) && ranges.some((r) => seq >= r.start && seq <= r.end);
}
function filterEntries(entries, nodes, groups, ranges) {
  if (!ranges.length) return entries;
  const visible = (entry) => !isHidden(nodes.get(entry.key)?.anchorSeq, ranges);
  return entries.flatMap((entry) => {
    if (entry.kind === "node") return visible(entry) ? [entry] : [];
    const group = groups?.groupSource(entry.key).getSnapshot();
    if (!group) return [entry];
    const members = group.members.filter(visible);
    if (!members.length) return [];
    return members.length === group.members.length ? [entry] : members;
  });
}

// src/chat-history.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var EMPTY = [];
function installHistoryView(ctx) {
  return ctx.slots.inject("conversation.chat.flow", () => {
    let disposeFlow, original;
    function adopt() {
      const entry = ctx.slots.entries("conversation.chat.flow").find((e) => e.children?.["conversation.chat.node"]);
      if (!entry || original === entry) return;
      disposeFlow?.();
      original = entry;
      const Original = entry.component;
      function HistoryFlow(props) {
        const session = ctx.sessions.binding(props.sessionId).session;
        const projection = session.projections.faceOf(EDIT_PROJECTION);
        const ranges = (0, import_react3.useSyncExternalStore)(projection.subscribe, projection.getSnapshot) ?? EMPTY;
        const chat = props.useChat((s) => s);
        const conversation = ctx.uiConversation.binding(props.sessionId).snapshot;
        const snap = (0, import_react3.useSyncExternalStore)(conversation.subscribe, conversation.getSnapshot);
        const entries = filterEntries(props.entries, chat.nodes, snap.views.grouped("chat"), ranges);
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          Original,
          {
            ...props,
            entries,
            renderSlot: (key, owner, options) => props.renderSlot(key === "conversation.chat.node" ? "dsh-inline-edit.node" : key, owner, options)
          }
        );
      }
      disposeFlow = ctx.slots.register({
        name: "conversation.chat.flow",
        priority: -10,
        locale: entry.locale,
        store: entry.store,
        inject: entry.inject,
        children: { "dsh-inline-edit.node": entry.children["conversation.chat.node"] }
      }, HistoryFlow);
    }
    const unsub = ctx.slots.subscribe("conversation.chat.flow", adopt);
    adopt();
    return () => {
      unsub();
      disposeFlow?.();
    };
  });
}
function installNativeNodeBridge(ctx) {
  function mirror(source, target) {
    const copies = /* @__PURE__ */ new Map();
    function sync() {
      const entries = ctx.slots.entries(source);
      for (const [entry, dispose] of copies) if (!entries.includes(entry)) {
        copies.delete(entry);
        dispose();
      }
      for (const entry of entries) {
        let Bridged = function(props) {
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            Original,
            {
              ...props,
              renderSlot: (key, ...args) => props.renderSlot(names[key] ?? key, ...args),
              renderSlotChain: (key, ...args) => props.renderSlotChain(names[key] ?? key, ...args)
            }
          );
        };
        if (copies.has(entry)) continue;
        const names = Object.fromEntries(Object.keys(entry.children ?? {}).map((key) => [key, "dsh-inline-edit.bridge." + key]));
        const children = Object.fromEntries(Object.entries(entry.children ?? {}).map(([key, spec]) => [names[key], spec]));
        const Original = entry.component;
        const dispose = ctx.slots.register({
          name: target,
          ...entry.options,
          locale: entry.locale,
          store: entry.store,
          inject: entry.inject,
          select: entry.select,
          children
        }, Bridged);
        const descendants = Object.keys(names).map((key) => mirror(key, names[key]));
        copies.set(entry, () => {
          descendants.forEach((f) => f());
          dispose();
        });
      }
    }
    const unsub = ctx.slots.subscribe(source, sync);
    sync();
    return () => {
      unsub();
      for (const dispose of copies.values()) dispose();
      copies.clear();
    };
  }
  return ctx.slots.inject("dsh-inline-edit.node", () => mirror("conversation.chat.node", "dsh-inline-edit.node"));
}

// src/style.css
var style_default = ".dsh-ie { display:flex; flex-direction:column; align-items:flex-end; min-width:0; max-width:100%; color:var(--dsw-alias-label-primary,#202124); font:inherit; font-family:var(--dsw-font-family,system-ui,sans-serif); }\r\n.dsh-ie-actions { display:flex; align-items:center; justify-content:flex-end; gap:5px; min-height:30px; margin-top:5px; color:var(--dsw-alias-label-tertiary,#85878c); opacity:0; transition:opacity .12s ease; }\r\n.dsh-ie:hover .dsh-ie-actions,.dsh-ie:focus-within .dsh-ie-actions { opacity:1; }\r\n.dsh-ie-time { font-size:12px; margin-inline-end:8px; font-variant-numeric:tabular-nums; }\r\n.dsh-ie button { font-family:inherit; cursor:pointer; }\r\n.dsh-ie-icon { color:inherit; border:0; background:transparent; display:inline-flex; align-items:center; justify-content:center; border-radius:var(--dsw-radius-sm,8px); width:30px; height:30px; padding:6px; flex:none; }\r\n.dsh-ie-icon:not(:disabled):not([aria-disabled=true]):hover { color:var(--dsw-alias-label-primary,#202124); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-icon:not(:disabled):not([aria-disabled=true]):active { background:var(--dsw-alias-interactive-bg-active,#2631481a); }\r\n.dsh-ie-icon[aria-disabled=true] { opacity:.45; cursor:not-allowed; }\r\n.dsh-ie button:focus-visible,.dsh-ie-info:focus-visible { outline:2px solid var(--dsw-focus-ring-color,#4c6fff); outline-offset:3px; }\r\n.dsh-ie-editor { box-sizing:border-box; width:100%; padding:14px 16px; border-radius:var(--dsw-radius-xl,24px); background:var(--dsw-alias-interactive-bg-hover-solid,#f3f3f4); }\r\n.dsh-ie-editor textarea { box-sizing:border-box; display:block; width:100%; min-height:62px; max-height:360px; resize:none; overflow:auto; padding:0; border:0; outline:0; background:transparent; color:inherit; font:inherit; font-size:var(--dsh-content-font-size,15px); line-height:1.7; white-space:pre-wrap; overflow-wrap:anywhere; }\r\n.dsh-ie-editor textarea:focus-visible { outline:none; }\r\n.dsh-ie-editor:focus-within { box-shadow:0 0 0 1px var(--dsw-alias-border-l2,transparent); }\r\n.dsh-ie-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:4px; }\r\n.dsh-ie-tools,.dsh-ie-buttons { display:flex; align-items:center; gap:8px; }\r\n.dsh-ie-tools { color:var(--dsw-alias-label-tertiary,#777980); }\r\n.dsh-ie-info { display:inline-flex; align-items:center; justify-content:center; width:24px; height:30px; padding:0; border:0; background:transparent; color:inherit; border-radius:var(--dsw-radius-sm,8px); cursor:help; }\r\n.dsh-ie-info:hover { color:var(--dsw-alias-label-primary,#202124); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-buttons { margin-inline-start:auto; }\r\n.dsh-ie-cancel,.dsh-ie-save { box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; border-radius:var(--dsw-radius-md,10px); padding:0 14px; min-height:36px; font-size:14px; line-height:22px; font-weight:400; border:0; transition:background-color .12s ease; }\r\n.dsh-ie-cancel { background:transparent; color:var(--dsw-alias-label-primary,#222); }\r\n.dsh-ie-save { background:var(--dsw-alias-button-primary-fill,#191b1d); color:var(--dsw-alias-label-primary-foreground,#fff); }\r\n.dsh-ie-cancel:not(:disabled):hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-cancel:not(:disabled):active { background:var(--dsw-alias-interactive-bg-active,#2631481a); }\r\n.dsh-ie-save:not(:disabled):hover { background:var(--dsw-alias-button-primary-hover,#35373b); }\r\n.dsh-ie button:disabled { opacity:.4; cursor:not-allowed; }\r\n.dsh-ie-error { font-size:12px; line-height:1.6; margin-top:8px; max-width:100%; overflow-wrap:anywhere; color:var(--dsw-alias-state-error-primary,#ad4036); }\r\n.dsh-ie-notice { font-size:12px; line-height:1.6; margin-top:8px; max-width:100%; overflow-wrap:anywhere; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-recover { border:0; border-radius:var(--dsw-radius-sm,8px); background:transparent; color:var(--dsw-alias-state-business-primary,#4166c5); text-decoration:none; padding:6px 8px; font-size:13px; line-height:20px; max-width:100%; overflow-wrap:anywhere; text-align:start; }\r\n.dsh-ie-recover:hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-picker { display:none; }\r\n.dsh-ie-files { display:flex; flex-wrap:wrap; gap:8px; padding:0; margin:0 0 12px; list-style:none; }\r\n.dsh-ie-file { display:flex; align-items:center; gap:8px; min-width:0; max-width:100%; width:218px; box-sizing:border-box; border:.5px solid var(--dsw-alias-border-l2,#dedee1); background:var(--dsw-specific-input-major,#fff); border-radius:var(--dsw-radius-lg,12px); padding:8px; }\r\n.dsh-ie-file img,.dsh-ie-file-icon { width:32px; height:36px; object-fit:cover; border-radius:4px; display:grid; place-items:center; flex:none; }\r\n.dsh-ie-file-icon { color:var(--dsw-static-neutral-bluish-300,#a4aebb); }\r\n.dsh-ie-file-label { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; font-size:13px; }\r\n.dsh-ie-file-label>span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\r\n.dsh-ie-file-label small { color:var(--dsw-alias-label-tertiary,#85878c); font-size:11px; }\r\n@media(hover:none),(pointer:coarse) { .dsh-ie-actions{opacity:1}.dsh-ie-icon{width:36px;height:36px} }\r\n@media(max-width:520px) { .dsh-ie-editor{padding:12px}.dsh-ie-file{width:100%}.dsh-ie-footer{gap:8px;flex-wrap:wrap}.dsh-ie-buttons{gap:6px} }\r\n@media(prefers-reduced-motion:reduce) { .dsh-ie-actions,.dsh-ie-cancel,.dsh-ie-save{transition:none} }\r\n\r\n\r\n/* Match native settings-form field typography and separators; never restyle the host dialog. */\r\n.dsh-ie-settings { width:100%; min-width:0; padding:0; box-sizing:border-box; color:var(--dsw-alias-label-primary,#202124); font:inherit; overflow-wrap:anywhere; }\r\n.dsh-ie-settings h2 { margin:0 0 8px; font-size:16px; font-weight:600; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-settings-intro { margin:0 0 20px; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings fieldset { min-width:0; margin:0; padding:0; border:0; }\r\n.dsh-ie-settings legend { padding:0; margin:0; font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-mode { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; margin-top:10px; border:1px solid var(--dsw-alias-border-l2,#e5e5e7); border-radius:var(--dsw-radius-md,10px); background:var(--dsw-alias-bg-base,#fff); cursor:pointer; }\r\n.dsh-ie-settings fieldset:not(:disabled) .dsh-ie-mode:hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-settings .dsh-ie-mode[data-selected=true] { border-color:var(--dsw-alias-state-business-primary,#4d6bfe); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-settings .dsh-ie-mode:focus-within { outline:2px solid var(--dsw-focus-ring-color,#4d6bfe); outline-offset:2px; }\r\n.dsh-ie-settings .dsh-ie-mode input { flex:0 0 auto; width:16px; height:16px; margin:2px 0 0; accent-color:var(--dsw-alias-brand-primary,#4d6bfe); cursor:inherit; }\r\n.dsh-ie-settings .dsh-ie-mode input:focus-visible { outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4d6bfe)); outline-offset:2px; }\r\n.dsh-ie-settings .dsh-ie-mode-body { flex:1; min-width:0; }\r\n.dsh-ie-settings .dsh-ie-mode-title { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px 8px; margin-bottom:6px; }\r\n.dsh-ie-settings .dsh-ie-mode-title strong { font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-mode-badge { font-size:12px; line-height:1.5; color:var(--dsw-alias-label-tertiary,#85878c); }\r\n.dsh-ie-settings .dsh-ie-mode small { display:block; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings fieldset:disabled .dsh-ie-mode { opacity:.5; cursor:default; }\r\n.dsh-ie-settings .dsh-ie-settings-status { min-height:18px; margin:10px 0 0; font-size:12px; line-height:1.5; color:var(--dsw-alias-label-tertiary,#85878c); }\r\n.dsh-ie-settings .dsh-ie-settings-status[data-error=true] { color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,#ad4036)); }\r\n.dsh-ie-settings .dsh-ie-settings-note { margin-top:16px; padding-top:12px; border-top:.5px solid var(--dsw-alias-border-l2,#e5e5e7); }\r\n.dsh-ie-settings .dsh-ie-settings-note h3 { margin:0 0 8px; font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-settings-note ul { padding-inline-start:17px; margin:0; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings .dsh-ie-settings-note li + li { margin-top:6px; }\r\n\r\n";

// src/vendor/dsh-icons.js
var import_jsx_runtime4 = require("react/jsx-runtime");
var IconCheckOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime4.jsx)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: (0, import_jsx_runtime4.jsx)("path", {
    d: "M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4",
    stroke: "currentColor"
  })
});
var IconCloseOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime4.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime4.jsx)("path", {
    d: "M2.5 2.5L13.5 13.5",
    stroke: "currentColor"
  }), (0, import_jsx_runtime4.jsx)("path", {
    d: "M13.5 2.5L2.5 13.5",
    stroke: "currentColor"
  })]
});
var IconCopyOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime4.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime4.jsx)("rect", {
    x: "1.52075",
    y: "4.07373",
    width: "10.3932",
    height: "10.3932",
    rx: "2",
    stroke: "currentColor"
  }), (0, import_jsx_runtime4.jsx)("path", {
    d: "M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z",
    fill: "currentColor"
  })]
});
var IconEditOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime4.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime4.jsx)("path", {
    d: "M8.85596 2.69971H4.19971C3.37141 2.69971 2.69992 3.37146 2.69971 4.19971V11.8003C2.69992 12.6285 3.37141 13.3003 4.19971 13.3003H11.8003C12.6283 13.2999 13.3001 12.6283 13.3003 11.8003V7.89893H14.3003V11.8003C14.3001 13.1806 13.1806 14.2999 11.8003 14.3003H4.19971C2.81913 14.3003 1.69992 13.1808 1.69971 11.8003V4.19971C1.69992 2.81918 2.81913 1.69971 4.19971 1.69971H8.85596V2.69971Z",
    fill: "currentColor"
  }), (0, import_jsx_runtime4.jsx)("path", {
    d: "M7.7849 8.23878L13.888 2.13574",
    stroke: "currentColor"
  })]
});
var IconPaperclipOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime4.jsx)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: (0, import_jsx_runtime4.jsx)("path", {
    d: "M12.75 4.5V9.5C12.75 10.7598 12.2496 11.968 11.3588 12.8588C10.468 13.7496 9.25978 14.25 8 14.25C6.74022 14.25 5.53204 13.7496 4.64124 12.8588C3.75045 11.968 3.25 10.7598 3.25 9.5V5C3.25 4.13805 3.59241 3.3114 4.2019 2.7019C4.8114 2.09241 5.63805 1.75 6.5 1.75C7.36195 1.75 8.1886 2.09241 8.7981 2.7019C9.40759 3.3114 9.75 4.13805 9.75 5V9.5C9.75 9.96413 9.56563 10.4092 9.23744 10.7374C8.90925 11.0656 8.46413 11.25 8 11.25C7.53587 11.25 7.09075 11.0656 6.76256 10.7374C6.43437 10.4092 6.25 9.96413 6.25 9.5V5.5",
    stroke: "currentColor"
  })
});
var IconInfoOutlineArtwork = ({ size = 14, className, strokeWidth }) => (0, import_jsx_runtime4.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 14 14",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [
    (0, import_jsx_runtime4.jsx)("path", {
      d: "M12.5757 7.00012C12.5757 3.92085 10.0794 1.42463 7.00012 1.42456C3.9208 1.42456 1.42456 3.9208 1.42456 7.00012C1.42463 10.0794 3.92085 12.5757 7.00012 12.5757C10.0793 12.5756 12.5756 10.0793 12.5757 7.00012ZM13.8002 7.00012C13.8001 10.7559 10.7559 13.8001 7.00012 13.8002C3.2443 13.8002 0.199291 10.7559 0.199219 7.00012C0.199219 3.24426 3.24426 0.199219 7.00012 0.199219C10.7559 0.199291 13.8002 3.2443 13.8002 7.00012Z",
      fill: "currentColor"
    }),
    (0, import_jsx_runtime4.jsx)("path", {
      d: "M7.6127 3.18921V4.55986H6.38735V3.18921H7.6127Z",
      fill: "currentColor"
    }),
    (0, import_jsx_runtime4.jsx)("path", {
      d: "M7.6127 5.68921V10.8109H6.38735V5.68921H7.6127Z",
      fill: "currentColor"
    })
  ]
});
var FILE_BODY = "M8.48924 28H19.5108C21.6479 28 22.7165 28 23.5594 27.6509C24.6833 27.1853 25.5762 26.2924 26.0417 25.1685C26.3909 24.3256 26.3909 23.257 26.3909 21.1199V8.79443C26.3909 8.32877 26.3909 8.09593 26.3471 7.87507C26.2887 7.58058 26.173 7.30042 26.0067 7.05048C25.882 6.86303 25.7177 6.69799 25.3893 6.36792L20.0611 1.01354C19.7304 0.681235 19.5651 0.515081 19.3769 0.38885C19.126 0.220541 18.8443 0.103463 18.5481 0.0443412C18.3259 0 18.0915 0 17.6226 0H8.48924C6.35209 0 5.28351 0 4.4406 0.349145C3.31672 0.814671 2.4238 1.70759 1.95828 2.83147C1.60913 3.67438 1.60913 4.74296 1.60913 6.88011V21.1199C1.60913 23.257 1.60913 24.3256 1.95828 25.1685C2.4238 26.2924 3.31672 27.1853 4.4406 27.6509C5.28351 28 6.35209 28 8.48924 28Z";
var FILE_FOLD = "M26.3909 7.37445L19.0525 0V3.77445C19.0525 4.89271 19.0525 5.45184 19.2352 5.89289C19.4788 6.48096 19.946 6.94818 20.5341 7.19176C20.9751 7.37445 21.5342 7.37445 22.6525 7.37445H26.3909Z";
function FileGlyph({ size, className, children, markTransform, muted = false }) {
  return (0, import_jsx_runtime4.jsxs)("svg", {
    width: size,
    height: size,
    className,
    viewBox: "0 0 28 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    children: [
      (0, import_jsx_runtime4.jsx)("path", {
        d: FILE_BODY,
        fill: "currentColor"
      }),
      muted ? (0, import_jsx_runtime4.jsx)("path", {
        d: FILE_FOLD,
        fill: "var(--dsw-static-neutral-400)"
      }) : (0, import_jsx_runtime4.jsx)("path", {
        d: FILE_FOLD,
        fill: "var(--dsw-static-neutral-00)",
        fillOpacity: ".7"
      }),
      children !== void 0 && (0, import_jsx_runtime4.jsx)("g", {
        color: "var(--dsw-static-neutral-00)",
        "data-file-type-mark": true,
        transform: markTransform,
        children
      })
    ]
  });
}

// src/client.jsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var name = "dsh-inline-edit";
var inject = ["slots", "sessions", "uiWorkspace", "fileUpload", "configForms", "uiConversation"];
var icons = { check: IconCheckOutlineArtwork, close: IconCloseOutlineArtwork, copy: IconCopyOutlineArtwork, edit: IconEditOutlineArtwork, attach: IconPaperclipOutlineArtwork, info: IconInfoOutlineArtwork };
function Icon({ kind }) {
  const Artwork = icons[kind];
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Artwork, { size: 16, strokeWidth: 1 });
}
function Attachment({ item, onRemove, disabled, t }) {
  const [url, setUrl] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    if (item.type !== "image" || item.origin !== "new") return;
    const next = URL.createObjectURL(item.file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [item]);
  const size = item.size < 1024 ? `${item.size} B` : item.size < 1048576 ? `${(item.size / 1024).toFixed(1)} KB` : `${(item.size / 1048576).toFixed(1)} MB`;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { className: "dsh-ie-file", children: [
    url ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("img", { src: url, alt: "" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsh-ie-file-icon", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FileGlyph, { size: 28, muted: true }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsh-ie-file-label", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: item.name, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { tabIndex: 0, children: item.name }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("small", { children: size })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: t.removeHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, disabled, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": `${t.remove} ${item.name}`, disabled, onClick: onRemove, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { kind: "close" }) }) })
  ] });
}
var pendingEdits = /* @__PURE__ */ new Map();
var pendingListeners = /* @__PURE__ */ new Map();
function subscribePending(key, listener) {
  let listeners = pendingListeners.get(key);
  if (!listeners) pendingListeners.set(key, listeners = /* @__PURE__ */ new Set());
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) pendingListeners.delete(key);
  };
}
function pendingKey(sessionId, seq) {
  return `dsh-inline-edit:pending:${sessionId}:${seq}`;
}
function readPending(key) {
  try {
    return window.sessionStorage.getItem(key) || pendingEdits.get(key);
  } catch {
    return pendingEdits.get(key);
  }
}
function writePending(key, id) {
  if (id) pendingEdits.set(key, id);
  else pendingEdits.delete(key);
  try {
    if (id) window.sessionStorage.setItem(key, id);
    else window.sessionStorage.removeItem(key);
  } catch {
  }
  for (const listener of pendingListeners.get(key) ?? []) listener();
}
function EditableMessage({ node, sessionId, useSession, renderFactorySlot, loadImage, coordinator, openSession, mode = "branch", latestSeq, supplemental = false, settingsReady = true }) {
  const data = node.data;
  const view = (0, import_react4.useMemo)(() => contentView(data), [data]);
  const snapshot = useSession((state) => state);
  const language = document.documentElement.lang || navigator.language;
  const t = labels(language);
  const [editing, setEditing] = (0, import_react4.useState)(false);
  const [draftMode, setDraftMode] = (0, import_react4.useState)(mode);
  const activeMode = editing ? draftMode : mode;
  const modeHint = activeMode === "current" ? t.currentTitle : t.branchMode;
  const pending = pendingKey(sessionId, data.seq);
  const [draft, setDraft] = (0, import_react4.useState)(view.text);
  const [attachments, setAttachments] = (0, import_react4.useState)(() => originalAttachments(data));
  const [saving, setSaving] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)(null);
  const [copied, setCopied] = (0, import_react4.useState)(false);
  const [recoverId, setRecoverId] = (0, import_react4.useState)(null);
  const pendingSource = (0, import_react4.useMemo)(() => ({ subscribe: (listener) => subscribePending(pending, listener), read: () => readPending(pending) ?? null }), [pending]);
  const pendingRequest = (0, import_react4.useSyncExternalStore)(pendingSource.subscribe, pendingSource.read, pendingSource.read);
  const uncertain = !!pendingRequest && !saving;
  const editor = (0, import_react4.useRef)(null), picker = (0, import_react4.useRef)(null), pencil = (0, import_react4.useRef)(null), nextKey = (0, import_react4.useRef)(0), mounted = (0, import_react4.useRef)(true), inFlight = (0, import_react4.useRef)(false), copyTimer = (0, import_react4.useRef)();
  const requestId = (0, import_react4.useRef)(null);
  const changed = draftChanged(data, draft, attachments);
  const restriction = (uncertain ? "currentUncertain" : null) ?? (!settingsReady ? "notReady" : null) ?? editRestriction(node) ?? sessionRestriction(snapshot) ?? (activeMode === "current" && (supplemental || node.kind === "steering") ? "supplemental" : null) ?? (activeMode === "current" && latestSeq !== data.seq ? latestSeq == null ? "notReady" : "latestOnly" : null);
  const facts = (0, import_react4.useMemo)(() => ({ ...data.referenceLabels ? { sessionLabels: data.referenceLabels } : {}, ...data.skillNames ? { skillNames: data.skillNames } : {} }), [data.referenceLabels, data.skillNames]);
  (0, import_react4.useEffect)(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(copyTimer.current);
    };
  }, []);
  (0, import_react4.useEffect)(() => {
    if (!editing) setDraft(view.text);
  }, [view.text, editing]);
  (0, import_react4.useEffect)(() => {
    if (!pendingRequest) setError((previous) => previous === t.currentUncertain ? null : previous);
  }, [pendingRequest, t.currentUncertain]);
  (0, import_react4.useLayoutEffect)(() => {
    if (!editing || !editor.current) return;
    const area = editor.current;
    const resize = () => {
      area.style.height = "auto";
      area.style.height = `${Math.min(360, Math.max(62, area.scrollHeight))}px`;
    };
    resize();
    let lastWidth = area.clientWidth;
    const observer = new ResizeObserver(() => {
      if (area.clientWidth !== lastWidth) {
        lastWidth = area.clientWidth;
        resize();
      }
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [editing, draft]);
  (0, import_react4.useEffect)(() => {
    if (editing && editor.current) {
      editor.current.focus();
      editor.current.setSelectionRange(editor.current.value.length, editor.current.value.length);
    }
  }, [editing]);
  function cancel() {
    if (inFlight.current) return;
    setDraft(view.text);
    setAttachments(originalAttachments(data));
    setError(uncertain ? t.currentUncertain : null);
    setRecoverId(null);
    setEditing(false);
    if (!uncertain) requestId.current = null;
    requestAnimationFrame(() => pencil.current?.focus());
  }
  function beginEdit() {
    if (restriction) return;
    setRecoverId(null);
    setError(null);
    setDraft(view.text);
    setAttachments(originalAttachments(data));
    setDraftMode(mode);
    setEditing(true);
  }
  async function save() {
    if (inFlight.current || recoverId || uncertain) return;
    if (restriction) {
      setError(t[restriction]);
      return;
    }
    if (!draft.trim() && !attachments.length) {
      setError(t.empty);
      return;
    }
    if (!changed) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      requestId.current ??= crypto.randomUUID();
      if (activeMode === "current") writePending(pending, requestId.current);
      const result = await coordinator.save({ sessionId, node, text: draft, attachments, mode: activeMode, requestId: requestId.current });
      writePending(pending, null);
      if (!mounted.current) return;
      if (result.childId) {
        setRecoverId(result.childId);
        await openSession(result.childId);
      }
      if (mounted.current) {
        setEditing(false);
        setError(result.childId ? t.returned : null);
      }
    } catch (failure) {
      if (failure.code !== "currentUncertain") writePending(pending, null);
      if (mounted.current) {
        if (failure.childId) setRecoverId(failure.childId);
        setError(t[failure.code] ?? (activeMode === "current" ? t.currentFailed : t.failed));
        if (failure.code === "currentUncertain") writePending(pending, requestId.current);
        if (failure.code !== "currentUncertain") requestId.current = null;
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  function addFiles(files) {
    if (inFlight.current || recoverId || uncertain) return;
    const next = [...attachments, ...Array.from(files).map((file) => newAttachment(file, `new:${++nextKey.current}`))];
    try {
      validateAttachments(next, data);
      setAttachments(next);
      setError(null);
    } catch (failure) {
      setError(t[failure.code] ?? t.failed);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(view.text);
      if (!mounted.current) return;
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
        if (mounted.current) setCopied(false);
      }, 1600);
    } catch {
      if (mounted.current) setError(t.copyFailed);
    }
  }
  const clock = Number.isFinite(data.time) ? new Intl.DateTimeFormat(language || "zh-CN", { hour: "2-digit", minute: "2-digit" }).format(data.time) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "dsh-ie", "data-dsh-inline-edit": "", "data-editing": editing || void 0, "aria-busy": saving, children: [
    editing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        className: "dsh-ie-editor",
        onDragOver: (event) => {
          if (event.dataTransfer.types.includes("Files")) event.preventDefault();
        },
        onDrop: (event) => {
          if (event.dataTransfer.files.length) {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }
        },
        children: [
          attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "dsh-ie-files", "aria-label": t.attachments, children: attachments.map(
            (item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Attachment, { item, t, disabled: saving || !!recoverId || uncertain, onRemove: () => {
              setAttachments((previous) => previous.filter((file) => file.key !== item.key));
              setError(null);
            } }, item.key)
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "textarea",
            {
              ref: editor,
              "aria-label": t.label,
              value: draft,
              disabled: saving || uncertain,
              maxLength: MAX_TEXT_LENGTH,
              onChange: (event) => {
                setDraft(event.target.value);
                setError(null);
              },
              onPaste: (event) => {
                if (event.clipboardData.files.length) {
                  event.preventDefault();
                  addFiles(event.clipboardData.files);
                }
              },
              onKeyDown: (event) => {
                if (event.nativeEvent.isComposing || event.isComposing || event.keyCode === 229) return;
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  cancel();
                } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  event.stopPropagation();
                  void save();
                }
              }
            }
          ),
          restriction && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-ie-error", role: "status", children: t[restriction] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              ref: picker,
              type: "file",
              multiple: true,
              className: "dsh-ie-picker",
              "aria-label": t.addFiles,
              disabled: saving || !!recoverId || uncertain,
              onChange: (event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-ie-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-ie-tools", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: t.addHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, disabled: saving || !!recoverId || uncertain, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": t.addFiles, disabled: saving || !!recoverId || uncertain, onClick: () => picker.current?.click(), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { kind: "attach" }) }) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: modeHint, side: "bottom", gap: 6, portal: true, maxWidth: 280, delayMs: 220, openOnClick: true, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-info", "aria-label": modeHint, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { kind: "info" }) }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-ie-buttons", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-cancel", disabled: saving, onClick: cancel, children: t.cancel }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-save", disabled: saving || !!restriction || !!recoverId || uncertain || !draft.trim() && !attachments.length || !changed, onClick: () => void save(), children: saving ? t.saving : t.save })
            ] })
          ] })
        ]
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      renderFactorySlot("conversation.chat.user.content", { content: view, loadImage, facts, interactive: true }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-ie-actions", children: [
        clock && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("time", { className: "dsh-ie-time", dateTime: new Date(data.time).toISOString(), children: clock }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: copied ? t.copied : t.copy, side: "left", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": copied ? t.copied : t.copy, onClick: () => void copy(), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { kind: copied ? "check" : "copy" }) }) }),
        !(activeMode === "current" && (supplemental || node.kind === "steering")) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Tooltip, { label: restriction ? t[restriction] : t.edit, side: "left", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "button",
          {
            type: "button",
            ref: pencil,
            className: "dsh-ie-icon",
            "aria-label": t.edit,
            "aria-disabled": !!restriction,
            "aria-description": restriction ? t[restriction] : void 0,
            onClick: beginEdit,
            children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { kind: "edit" })
          }
        ) })
      ] })
    ] }),
    (error || uncertain) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-ie-error", role: "status", children: error || t.currentUncertain }),
    uncertain && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-recover", onClick: () => {
      if (!window.confirm(t.confirmChecked)) return;
      writePending(pending, null);
      requestId.current = null;
      setError(null);
      setEditing(false);
    }, children: t.checkedOutcome }),
    recoverId && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-ie-recover", onClick: () => Promise.resolve(openSession(recoverId)).catch(() => setError(t.branchFailed)), children: t.recover })
  ] });
}
function apply(ctx) {
  const coordinator = createEditCoordinator(nativeAdapter(ctx));
  const form = ctx.configForms.get("dsh-inline-edit");
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshInlineEditStyle = "";
    style.textContent = style_default + dsh_tooltip_default;
    document.head.append(style);
    return () => {
      coordinator.dispose();
      style.remove();
    };
  });
  function Message(props) {
    const state = useSettings(form);
    const latest = ctx.sessions.binding(props.sessionId).session.projections.faceOf(LATEST_PROJECTION);
    const eligibility = (0, import_react4.useSyncExternalStore)(latest.subscribe, latest.getSnapshot);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EditableMessage, { ...props, settingsReady: state.status === "ready", latestSeq: eligibility?.latestSeq, supplemental: eligibility?.excluded.includes(props.node.data.seq), mode: state.value?.mode === "current" ? "current" : "branch", coordinator, openSession: (id) => ctx.uiWorkspace.openSession(id) }, `${props.sessionId}:${props.node.data.seq}`);
  }
  for (const key of ["user", "steering"]) {
    ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
      name: "conversation.chat.node",
      key,
      priority: -10,
      locale: "chat"
    }, Message));
  }
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-inline-edit",
    order: 55,
    label: () => labels(document.documentElement.lang || navigator.language).settingsTitle
  }, () => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EditSettings, { form })));
  installNativeNodeBridge(ctx);
  installHistoryView(ctx);
}
return module.exports; } });
