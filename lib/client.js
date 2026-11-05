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
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod10, isNodeMode, target) => (target = mod10 != null ? __create(__getProtoOf(mod10)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod10 || !mod10.__esModule ? __defProp(target, "default", { value: mod10, enumerable: true }) : target,
  mod10
));
var __toCommonJS = (mod10) => __copyProps(__defProp({}, "__esModule", { value: true }), mod10);

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
var import_react6 = __toESM(require("react"), 1);
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

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
  const clampX = (x3) => Math.max(margin, Math.min(x3, viewportWidth - margin - width));
  const clampY = (y3) => Math.max(margin, Math.min(y3, viewportHeight - margin - height));
  const opposite = { bottom: "top", top: "bottom", left: "right", right: "left" };
  const left = clampX(align === "end" ? anchor.right - width : (anchor.left + anchor.right - width) / 2);
  const top = clampY((anchor.top + anchor.bottom - height) / 2);
  const positions = {
    bottom: { left, top: anchor.bottom + gap },
    top: { left, top: anchor.top - gap - height },
    right: { left: anchor.right + gap, top },
    left: { left: anchor.left - gap - width, top }
  };
  const horizontal = side === "left" || side === "right";
  const candidates = [side, opposite[side], ...horizontal ? ["bottom", "top"] : ["right", "left"]].map((side2) => ({ ...positions[side2], side: side2 }));
  const overlap = (p3, r2) => Math.max(0, Math.min(p3.left + width, r2.right + 4) - Math.max(p3.left, r2.left - 4)) * Math.max(0, Math.min(p3.top + height, r2.bottom + 4) - Math.max(p3.top, r2.top - 4));
  const blockers = [anchor, ...avoid];
  const fits = (p3) => p3.left >= margin && p3.top >= margin && p3.left + width <= viewportWidth - margin && p3.top + height <= viewportHeight - margin;
  const clear = (p3) => blockers.every((r2) => overlap(p3, r2) === 0);
  const natural = candidates.find((p3) => fits(p3) && clear(p3));
  if (natural) return { ...natural, width, height, overflow: false };
  const bounded = candidates.map((p3) => ({ ...p3, left: clampX(p3.left), top: clampY(p3.top) }));
  const free = bounded.find(clear);
  if (free) return { ...free, width, height, overflow: false };
  const score = (p3) => overlap(p3, anchor) * 1e3 + avoid.reduce((sum, r2) => sum + overlap(p3, r2), 0);
  bounded.sort((a2, b4) => score(a2) - score(b4));
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
  const mergedRef = (0, import_react.useCallback)((el2) => {
    anchor.current = el2;
    if (typeof childRef === "function") childRef(el2);
    else if (childRef != null) childRef.current = el2;
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
    const el2 = bubble.current;
    if (pos === null || !visible || suppressed || el2 === null) return;
    let size;
    const measure = () => {
      const rect = el2.getBoundingClientRect();
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
        avoid: [...(anchor.current?.closest(".dsh-ie") ?? document).querySelectorAll('button,input,textarea,select,[contenteditable="true"],[role="button"],.dsh-ie-time')].filter((control) => control !== anchor.current && !el2.contains(control) && !control.disabled).map((control) => control.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
      });
      const horizontal = placement.side === "right" || placement.side === "left";
      const offsetX = horizontal ? 0 : align === "end" ? placement.width : placement.width / 2;
      const offsetY = horizontal ? placement.height / 2 : placement.side === "top" ? placement.height : 0;
      el2.style.left = `${placement.left + offsetX}px`;
      el2.style.top = `${placement.top + offsetY}px`;
      el2.dataset.side = placement.side;
      el2.style.visibility = placement.hidden ? "hidden" : "visible";
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
    observer.observe(el2, { box: "border-box" });
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
    const el2 = anchor.current;
    if (el2 === null) return;
    setPos(el2.getBoundingClientRect());
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
      onMouseEnter: (e2) => {
        children.props.onMouseEnter?.(e2);
        triggers.current.hover = true;
        showAfterDelay(delayMs);
      },
      onMouseLeave: (e2) => {
        children.props.onMouseLeave?.(e2);
        triggers.current.hover = false;
        cancelShow();
        if (!pinned) withdraw();
      },
      onClick: (e2) => {
        children.props.onClick?.(e2);
        triggers.current.focus = false;
        cancelShow();
        if (openOnClick && !disabled && !pinned) {
          setPinned(true);
          show();
        } else withdraw();
      },
      onFocus: (e2) => {
        children.props.onFocus?.(e2);
        if ((0, import_dsh_client_ui_primitives.pointerModality)()) return;
        triggers.current.focus = true;
        showAfterDelay(focusDelayMs);
      },
      onBlur: (e2) => {
        children.props.onBlur?.(e2);
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
  for (let i2 = 0; i2 < bytes.length; i2 += 8192) binary += String.fromCharCode(...bytes.subarray(i2, i2 + 8192));
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
  async function post(path, request, signal2) {
    const response = await ctx.fileUpload.post({ path, body: new Blob([JSON.stringify(request)], { type: "application/json" }), headers: { "content-type": "application/json" }, signal: signal2 });
    const result = JSON.parse(response.body);
    if (response.status !== 200 || !result.ok) throw new EditError(result.error ?? "fileRead");
    return result.value;
  }
  return {
    planCurrent(sourceId, seq, signal2) {
      return post("api/dsh-inline-edit/plan", { sourceId, seq, mode: "current" }, signal2);
    },
    editCurrent(request, signal2) {
      return post("api/dsh-inline-edit/current", request, signal2);
    },
    async resolveBoundary(sourceId, seq, signal2) {
      try {
        return (await post("api/dsh-inline-edit/plan", { sourceId, seq }, signal2)).atSeq;
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
    async uploadFile(childId, file, signal2) {
      const result = await ctx.fileUpload.upload(childId, file, file.name || void 0, signal2);
      if (!result.ok || !result.value?.receiptId) throw new EditError("fileUpload");
      return result.value;
    },
    async reuseFile(request, signal2) {
      const value = await post("api/dsh-inline-edit/reuse-file", request, signal2);
      if (!value?.receiptId) throw new EditError("fileRead");
      return value;
    },
    async prompt(session, content, signal2) {
      const result = await session.prompt(content, "queue", signal2);
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
  settingsLoading: "\u6B63\u5728\u8BFB\u53D6\u6D88\u606F\u7F16\u8F91\u8BBE\u7F6E\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
  settingsReadFailed: "\u6D88\u606F\u7F16\u8F91\u8BBE\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u91CD\u8BD5\u3002",
  settingsUnavailable: "\u6D88\u606F\u7F16\u8F91\u670D\u52A1\u672A\u5C31\u7EEA\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u662F\u5426\u6B63\u5E38\u542F\u7528\u3002",
  settingsInvalid: "\u6D88\u606F\u7F16\u8F91\u8BBE\u7F6E\u65E0\u6CD5\u8BC6\u522B\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u7248\u672C\u548C\u914D\u7F6E\u3002",
  retrySettings: "\u91CD\u8BD5",
  latestOnly: "\u4EC5\u652F\u6301\u6700\u8FD1\u4E00\u6761\u4E3B\u6D88\u606F\uFF1B\u66F4\u65E9\u6D88\u606F\u8BF7\u4F7F\u7528\u5206\u652F\u6A21\u5F0F\u3002",
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
  editHint: "\u7F16\u8F91",
  copy: "\u590D\u5236\u6D88\u606F",
  copyHint: "\u590D\u5236",
  copied: "\u5DF2\u590D\u5236",
  copyFailed: "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u6587\u672C\u590D\u5236\u3002",
  label: "\u7F16\u8F91\u8FD9\u6761\u6D88\u606F",
  cancel: "\u53D6\u6D88",
  save: "\u53D1\u9001",
  saving: "\u53D1\u9001\u4E2D\u2026",
  attachments: "\u6D88\u606F\u9644\u4EF6",
  addFiles: "\u6DFB\u52A0\u6587\u4EF6",
  addHint: "\u6DFB\u52A0\u9644\u4EF6",
  remove: "\u79FB\u9664",
  removeHint: "\u4EC5\u4ECE\u8FD9\u6761\u6D88\u606F\u79FB\u9664\uFF0C\u4E0D\u5220\u9664\u539F\u6587\u4EF6",
  previewImage: "\u67E5\u770B\u56FE\u7247",
  imagePreview: "\u56FE\u7247\u9884\u89C8",
  closePreview: "\u5173\u95ED\u9884\u89C8",
  fileRead: "\u65E7\u9644\u4EF6\u590D\u7528\u5931\u8D25\uFF0C\u672A\u63D0\u4EA4\u6D88\u606F\u3002\u8BF7\u68C0\u67E5\u65B0\u5206\u652F\uFF0C\u6216\u79FB\u9664\u65E7\u9644\u4EF6\u540E\u91CD\u65B0\u6DFB\u52A0\u6587\u4EF6\u3002",
  fileUpload: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF0C\u672A\u63D0\u4EA4\u6D88\u606F\u3002\u8BF7\u68C0\u67E5\u8FDE\u63A5\u540E\u91CD\u8BD5\u3002",
  fileSize: "\u5355\u4E2A\u9644\u4EF6\u8BF7\u63A7\u5236\u5728 64 MiB \u4EE5\u5185\u3002",
  totalSize: "\u9644\u4EF6\u5408\u8BA1\u8BF7\u63A7\u5236\u5728 128 MiB \u4EE5\u5185\u3002",
  attachmentCount: "\u4E00\u6761\u6D88\u606F\u6700\u591A\u6DFB\u52A0 32 \u4E2A\u9644\u4EF6\u3002",
  hint: "\u4FEE\u6539\u540E\u4ECE\u8FD9\u91CC\u5F00\u542F\u65B0\u5206\u652F\uFF0C\u539F\u5BF9\u8BDD\u4FDD\u7559\u3002",
  effects: "\u91CD\u65B0\u751F\u6210\u4E0D\u4F1A\u64A4\u9500\u4E4B\u524D\u5DF2\u7ECF\u6267\u884C\u7684\u6587\u4EF6\u4FEE\u6539\u3001\u547D\u4EE4\u6216\u5176\u4ED6\u64CD\u4F5C\u3002",
  keys: "Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C \xB7 Esc \u53D6\u6D88",
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
  settingsLoading: "Loading message editing settings. Try again shortly.",
  settingsReadFailed: "Could not load message editing settings. Retry in Settings.",
  settingsUnavailable: "The message editing service is unavailable. Check that the plugin is enabled.",
  settingsInvalid: "Message editing settings are invalid. Check the plugin version and configuration.",
  retrySettings: "Retry",
  latestOnly: "Latest main message only; use branch mode for earlier messages.",
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
  editHint: "Edit",
  copy: "Copy message",
  copyHint: "Copy",
  copied: "Copied",
  copyFailed: "Could not copy. Select and copy the text manually.",
  label: "Edit this message",
  cancel: "Cancel",
  save: "Send",
  saving: "Sending\u2026",
  attachments: "Message attachments",
  addFiles: "Add files",
  addHint: "Attach files",
  remove: "Remove",
  removeHint: "Remove from this message; the original file is kept",
  fileRead: "Could not reuse an attachment. Nothing was submitted. Check the branch or reattach the file.",
  fileUpload: "Upload failed. Nothing was submitted. Check your connection.",
  fileSize: "Each attachment must be at most 64 MiB.",
  totalSize: "Attachments must total at most 128 MiB.",
  attachmentCount: "A message can have at most 32 attachments.",
  hint: "Continue in a new branch from here. The original conversation is preserved.",
  effects: "This does not undo file changes or other actions already performed.",
  keys: "Enter: send \xB7 Shift+Enter: newline \xB7 Esc: cancel",
  previewImage: "View image",
  imagePreview: "Image preview",
  closePreview: "Close preview",
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

// src/message-time.js
function localDate(value) {
  const date = new Date(value instanceof Date ? value.getTime() : typeof value === "number" ? value : NaN);
  return Number.isFinite(date.getTime()) ? date : null;
}
function formatMessageClock(time, language = "zh-CN", now = /* @__PURE__ */ new Date()) {
  const date = localDate(time), reference = localDate(now);
  if (!date || !reference) return "";
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const sameYear = year === reference.getFullYear();
  if (sameYear && date.getMonth() === reference.getMonth() && day === reference.getDate()) return clock;
  const english = /^en\b/i.test(language ?? "");
  const calendar = english ? sameYear ? `${month}/${day}` : `${year}-${month}-${day}` : `${sameYear ? "" : `${year}\u5E74`}${month}\u6708${day}\u65E5`;
  return `${calendar} ${clock}`;
}
function formatMessageTimestamp(time, language = "zh-CN") {
  const date = localDate(time);
  if (!date) return "";
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const calendar = /^en\b/i.test(language ?? "") ? `${year}-${pad(month)}-${pad(day)}` : `${year}\u5E74${month}\u6708${day}\u65E5`;
  return `${calendar} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function nextLocalMidnight(now = /* @__PURE__ */ new Date()) {
  const date = localDate(now);
  return date ? date.setHours(24, 0, 0, 0) : NaN;
}

// src/edit-scroll-anchor.js
var scrollableOverflow = /* @__PURE__ */ new Set(["auto", "scroll", "overlay"]);
var scrollKeys = /* @__PURE__ */ new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
var intentEvents = ["wheel", "touchstart", "pointerdown", "keydown", "beforematch"];
function captureEditScrollAnchor(section) {
  const document2 = section?.ownerDocument;
  const view = document2?.defaultView;
  const noop = { restore() {
  }, dispose() {
  } };
  if (!view || !section.isConnected) return noop;
  const bottom = section.getBoundingClientRect().bottom;
  if (!Number.isFinite(bottom)) return noop;
  const scrollers = [];
  for (let parent = section.parentElement; parent; parent = parent.parentElement) {
    if (scrollableOverflow.has(view.getComputedStyle(parent).overflowY)) scrollers.push(parent);
  }
  const page = document2.scrollingElement;
  if (page && !scrollers.includes(page)) {
    const overflow = view.getComputedStyle(page).overflowY;
    if (overflow !== "hidden" && overflow !== "clip") scrollers.push(page);
  }
  if (!scrollers.length) return noop;
  let active = true;
  function dispose() {
    if (!active) return;
    active = false;
    for (const type of intentEvents) document2.removeEventListener(type, onIntent, true);
  }
  function onIntent(event) {
    if (event.type !== "keydown" || scrollKeys.has(event.key)) dispose();
  }
  for (const type of intentEvents) document2.addEventListener(type, onIntent, { capture: true, passive: true });
  return {
    dispose,
    restore() {
      if (!active) return;
      dispose();
      if (!section.isConnected) return;
      for (const scroller of scrollers) {
        if (!scroller.isConnected || !scroller.contains(section)) continue;
        const displacement = section.getBoundingClientRect().bottom - bottom;
        if (!Number.isFinite(displacement) || Math.abs(displacement) < 0.5) break;
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const top = Math.max(0, Math.min(max, scroller.scrollTop + displacement));
        if (top === scroller.scrollTop) continue;
        if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top, behavior: "instant" });
        else scroller.scrollTop = top;
      }
    }
  };
}

// src/file-references.js
function textBoundary(text, offset) {
  if (offset === 0 || offset === text.length) return true;
  const before = text.charCodeAt(offset - 1), after = text.charCodeAt(offset);
  return !(before >= 55296 && before <= 56319 && after >= 56320 && after <= 57343);
}
function collectFileReferences(text, evaluateUserText, facts = {}) {
  if (typeof text !== "string" || typeof evaluateUserText !== "function") return [];
  try {
    const nodes = evaluateUserText({ text, facts });
    if (!Array.isArray(nodes)) return [];
    const references = [];
    let previousEnd = 0;
    for (const node of nodes) {
      if (!node || typeof node !== "object" || typeof node.id !== "string" || !node.id) return [];
      const { start, end } = node;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < previousEnd || end <= start || end > text.length || !textBoundary(text, start) || !textBoundary(text, end)) return [];
      previousEnd = end;
      if (node.id !== "file") continue;
      const { path, label } = node.data ?? {};
      if (typeof path !== "string" || !path.trim() || typeof label !== "string" || !label.trim()) return [];
      references.push({ start, end, path, label });
    }
    return references;
  } catch {
    return [];
  }
}

// src/reference-editor.jsx
var import_react3 = __toESM(require("react"), 1);
var import_react_dom2 = require("react-dom");

// node_modules/lexical/dist/Lexical.prod.mjs
var Lexical_prod_exports = {};
__export(Lexical_prod_exports, {
  $addUpdateTag: () => Al,
  $applyNodeReplacement: () => Wl,
  $assumeActiveEditor: () => gi,
  $caretFromPoint: () => tu,
  $caretRangeFromSelection: () => ru,
  $cloneWithProperties: () => Dc,
  $cloneWithPropertiesEphemeral: () => Fc,
  $comparePointCaretNext: () => Ya,
  $copyNode: () => Rl,
  $create: () => Vc,
  $createChildrenArray: () => Yc,
  $createLineBreakNode: () => qi,
  $createNodeSelection: () => Pr,
  $createParagraphNode: () => es,
  $createPoint: () => or,
  $createRangeSelection: () => Fr,
  $createRangeSelectionFromDom: () => Ir,
  $createTabNode: () => tr,
  $createTextNode: () => Go,
  $extendCaretToRange: () => ja,
  $findMatchingParent: () => qc,
  $formatText: () => _r,
  $fullReconcile: () => pi,
  $generateNodesFromRawText: () => qr,
  $getAdjacentChildCaret: () => Wa,
  $getAdjacentNode: () => kl,
  $getAdjacentSiblingOrParentSiblingCaret: () => gu,
  $getCaretInDirection: () => fu,
  $getCaretRange: () => Va,
  $getCaretRangeInDirection: () => du,
  $getCharacterOffsets: () => yr,
  $getChildCaret: () => Ba,
  $getChildCaretAtIndex: () => hu,
  $getChildCaretOrSelf: () => Ra,
  $getCollapsedCaretRange: () => Ja,
  $getCommonAncestor: () => Za,
  $getCommonAncestorResultBranchOrder: () => Ga,
  $getDOMSlot: () => kc,
  $getDOMTextNode: () => wc,
  $getDocument: () => Zl,
  $getEditor: () => vc,
  $getEditorDOMRenderConfig: () => Tc,
  $getNearestNodeFromDOMNode: () => Zs,
  $getNearestRootOrShadowRoot: () => Kl,
  $getNodeByKey: () => Ys,
  $getNodeByKeyOrThrow: () => Ul,
  $getNodeFromDOMNode: () => Gs,
  $getPreviousSelection: () => zr,
  $getRoot: () => nl,
  $getSelection: () => Kr,
  $getSiblingCaret: () => Ia,
  $getSlot: () => sa,
  $getSlotFrame: () => oa,
  $getSlotHost: () => ea,
  $getSlotNameWithinHost: () => na,
  $getSlotNames: () => ia,
  $getState: () => xt,
  $getStateChange: () => Ct,
  $getTextContent: () => Yr,
  $getTextNodeOffset: () => Ka,
  $getTextPointCaret: () => La,
  $getTextPointCaretSlice: () => za,
  $getWritableNodeState: () => bt,
  $hasAncestor: () => Fl,
  $hasUpdateTag: () => Ml,
  $insertNodeToNearestRootAtCaret: () => mu,
  $insertNodes: () => Jr,
  $isBlockElementNode: () => Ar,
  $isChildCaret: () => Aa,
  $isDecoratorNode: () => Ki,
  $isEditorState: () => Ui,
  $isElementDOMSlot: () => Ec,
  $isElementNode: () => Pi,
  $isExtendableTextPointCaret: () => uu,
  $isInlineElementOrDecoratorNode: () => Ll,
  $isInlineFormattable: () => Ro,
  $isLeafNode: () => $s,
  $isLexicalNode: () => po,
  $isLineBreakNode: () => Yi,
  $isNodeCaret: () => Oa,
  $isNodeSelection: () => dr,
  $isParagraphNode: () => ns,
  $isRangeSelection: () => ur,
  $isRootNode: () => Bi,
  $isRootOrShadowRoot: () => Bl,
  $isSelectionCapturedInDecoratorInput: () => Os,
  $isShadowRootNode: () => zl,
  $isSiblingCaret: () => Ma,
  $isSlotChild: () => Zc,
  $isSlotHost: () => Qc,
  $isTabNode: () => er,
  $isTextNode: () => Xo,
  $isTextPointCaret: () => wa,
  $isTextPointCaretSlice: () => Ha,
  $isTokenOrSegmented: () => Ks,
  $isTokenOrTab: () => Ls,
  $markSlotEditable: () => Bc,
  $needsBlockCursorBeside: () => Hl,
  $nodesOfType: () => vl,
  $normalizeCaret: () => au,
  $normalizeSelection__EXPERIMENTAL: () => It,
  $onUpdate: () => Dl,
  $parseSerializedNode: () => vi,
  $removeFromParent: () => Hs,
  $removeSlot: () => ya,
  $removeTextFromCaretRange: () => cu,
  $rewindSiblingCaret: () => iu,
  $selectAll: () => xl,
  $setCompositionKey: () => Vs,
  $setDirectionFromDOM: () => Ic,
  $setFormatFromDOM: () => Lc,
  $setPointFromCaret: () => eu,
  $setSelection: () => ol,
  $setSelectionFromCaretRange: () => nu,
  $setSlot: () => pa,
  $setState: () => St,
  $setTextFormat: () => gr,
  $splitAtPointCaretNext: () => yu,
  $splitNode: () => uc,
  $updateDOMSelection: () => jr,
  $updateRangeSelectionFromCaretRange: () => ou,
  ArtificialNode__DO_NOT_USE: () => ji,
  BEFORE_INPUT_COMMAND: () => ze,
  BLUR_COMMAND: () => Mn,
  CAN_REDO_COMMAND: () => En,
  CAN_UNDO_COMMAND: () => wn,
  CAN_USE_BEFORE_INPUT: () => s,
  CAN_USE_DOM: () => n,
  CLEAR_EDITOR_COMMAND: () => bn,
  CLEAR_HISTORY_COMMAND: () => Nn,
  CLICK_COMMAND: () => Ke,
  COLLABORATION_TAG: () => vo,
  COMMAND_PRIORITY_BEFORE_CRITICAL: () => hs,
  COMMAND_PRIORITY_BEFORE_EDITOR: () => as,
  COMMAND_PRIORITY_BEFORE_HIGH: () => ds,
  COMMAND_PRIORITY_BEFORE_LOW: () => us,
  COMMAND_PRIORITY_BEFORE_NORMAL: () => fs,
  COMMAND_PRIORITY_CRITICAL: () => cs,
  COMMAND_PRIORITY_EDITOR: () => rs,
  COMMAND_PRIORITY_HIGH: () => ls,
  COMMAND_PRIORITY_LOW: () => is,
  COMMAND_PRIORITY_NORMAL: () => ss,
  COMPOSITION_END_COMMAND: () => We,
  COMPOSITION_END_TAG: () => wo,
  COMPOSITION_START_COMMAND: () => Re,
  COMPOSITION_START_TAG: () => Eo,
  CONTROLLED_TEXT_INSERTION_COMMAND: () => je,
  COPY_COMMAND: () => vn,
  CUT_COMMAND: () => Tn,
  CUT_TAG: () => So,
  DEFAULT_EDITOR_DOM_CONFIG: () => ps,
  DELETE_CHARACTER_COMMAND: () => $e,
  DELETE_LINE_COMMAND: () => Ye,
  DELETE_WORD_COMMAND: () => qe,
  DRAGEND_COMMAND: () => Sn,
  DRAGOVER_COMMAND: () => Cn,
  DRAGSTART_COMMAND: () => xn,
  DROP_COMMAND: () => yn,
  DecoratorNode: () => Li,
  ElementNode: () => Fi,
  FOCUS_COMMAND: () => On,
  FORMAT_ELEMENT_COMMAND: () => mn,
  FORMAT_TEXT_COMMAND: () => Ge,
  HISTORIC_TAG: () => yo,
  HISTORY_MERGE_TAG: () => xo,
  HISTORY_PUSH_TAG: () => mo,
  INDENT_CONTENT_COMMAND: () => _n,
  INPUT_COMMAND: () => Be,
  INSERT_LINE_BREAK_COMMAND: () => Ue,
  INSERT_PARAGRAPH_COMMAND: () => He,
  INSERT_TAB_COMMAND: () => gn,
  INTERNAL_$isBlock: () => Sc,
  IS_ALL_FORMATTING: () => k,
  IS_ANDROID: () => c,
  IS_ANDROID_CHROME: () => f,
  IS_APPLE: () => r,
  IS_APPLE_WEBKIT: () => d,
  IS_BOLD: () => p,
  IS_CHROME: () => u,
  IS_CODE: () => C,
  IS_FIREFOX: () => i,
  IS_HIGHLIGHT: () => T,
  IS_IOS: () => l,
  IS_ITALIC: () => y,
  IS_SAFARI: () => a,
  IS_STRIKETHROUGH: () => m,
  IS_SUBSCRIPT: () => S,
  IS_SUPERSCRIPT: () => v,
  IS_UNDERLINE: () => x,
  KEY_ARROW_DOWN_COMMAND: () => ln,
  KEY_ARROW_LEFT_COMMAND: () => on,
  KEY_ARROW_RIGHT_COMMAND: () => en2,
  KEY_ARROW_UP_COMMAND: () => sn,
  KEY_BACKSPACE_COMMAND: () => un,
  KEY_DELETE_COMMAND: () => dn,
  KEY_DOWN_COMMAND: () => tn,
  KEY_ENTER_COMMAND: () => cn,
  KEY_ESCAPE_COMMAND: () => fn,
  KEY_MODIFIER_COMMAND: () => An,
  KEY_SPACE_COMMAND: () => an,
  KEY_TAB_COMMAND: () => hn,
  LineBreakNode: () => Ji,
  MOVE_TO_END: () => nn,
  MOVE_TO_START: () => rn,
  NODE_STATE_DIRECT: () => _t,
  NODE_STATE_KEY: () => H,
  NODE_STATE_LATEST: () => pt,
  OUTDENT_CONTENT_COMMAND: () => pn,
  PASTE_COMMAND: () => Je,
  PASTE_TAG: () => Co,
  ParagraphNode: () => Zi,
  REDO_COMMAND: () => Ze,
  REMOVE_TEXT_COMMAND: () => Ve,
  RootNode: () => zi,
  SELECTION_CHANGE_COMMAND: () => Ie,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND: () => Le,
  SELECT_ALL_COMMAND: () => kn,
  SET_TEXT_FORMAT_COMMAND: () => Xe,
  SKIP_COLLAB_TAG: () => To,
  SKIP_DOM_SELECTION_TAG: () => bo,
  SKIP_SCROLL_INTO_VIEW_TAG: () => ko,
  SKIP_SELECTION_FOCUS_TAG: () => No,
  TEXT_TYPE_TO_FORMAT: () => z,
  TabNode: () => Zo,
  TextNode: () => Wo,
  UNDO_COMMAND: () => Qe,
  addClassNamesToElement: () => bu,
  buildImportMap: () => uo,
  configExtension: () => Cu,
  createCommand: () => Pe,
  createEditor: () => ys,
  createRefCountedRegistry: () => Dn,
  createSharedNodeState: () => vt,
  createState: () => mt,
  declarePeerDependency: () => Su,
  defineExtension: () => xu,
  findAllLexicalElementsDeep: () => Xl,
  flipDirection: () => ka,
  getActiveElement: () => lc,
  getActiveElementDeep: () => cc,
  getComposedEventTarget: () => ac,
  getComposedStaticRange: () => tc,
  getDOMOwnerDocument: () => Ol,
  getDOMSelection: () => Jl,
  getDOMSelectionFromTarget: () => Vl,
  getDOMSelectionPoints: () => nc,
  getDOMSelectionRange: () => ec,
  getDOMSelectionRangeAndPoints: () => oc,
  getDOMShadowRoots: () => Gl,
  getDOMTextNode: () => Rs,
  getDeclaredSlots: () => da,
  getEditorPropertyFromDOMNode: () => Ps,
  getNearestEditorFromDOMNode: () => Fs,
  getParentElement: () => wl,
  getRegisteredNode: () => Es,
  getRegisteredNodeOrThrow: () => Ns,
  getRegisteredSubtypeMap: () => Jc,
  getRootOwnerDocument: () => Ql,
  getStaticNodeConfig: () => Hc,
  getStyleObjectFromCSS: () => Mo,
  getTextDirection: () => Is,
  getTransformSetFromKlass: () => _s,
  isBlockDomNode: () => Cc,
  isCurrentlyReadOnlyMode: () => ui,
  isDOMCapturingSelection: () => Rc,
  isDOMDocumentNode: () => Bs,
  isDOMNode: () => _c,
  isDOMShadowRoot: () => ql,
  isDOMTextNode: () => zs,
  isDOMUnmanaged: () => zc,
  isDocumentFragment: () => pc,
  isExactShortcutMatch: () => _l,
  isHTMLAnchorElement: () => fc,
  isHTMLElement: () => gc,
  isHTMLTableCellElement: () => hc,
  isHTMLTableRowElement: () => dc,
  isInlineDomNode: () => mc,
  isLastChildInBlockNode: () => Xi,
  isLexicalEditor: () => Ds,
  isModifierMatch: () => gl,
  isOnlyChildInBlockNode: () => Gi,
  isSelectionCapturedInDecoratorInput: () => Ms,
  isSelectionWithinEditor: () => As,
  iterStaticNodeConfigChain: () => jc,
  makeStepwiseIterator: () => qa,
  mergeRegister: () => Eu,
  mountSlotContainer: () => bc,
  normalizeClassNames: () => ku,
  registerEventListener: () => Fn,
  registerEventListeners: () => wu,
  removeClassNamesFromElement: () => Nu,
  removeFromParent: () => js,
  resetRandomKey: () => bs,
  safeCast: () => vu,
  setDOMStyleFromCSS: () => Fo,
  setDOMStyleObject: () => Do,
  setDOMUnmanaged: () => Kc,
  setNodeIndentFromDOM: () => Pc,
  shallowMergeConfig: () => Tu,
  stopLexicalPropagation: () => io,
  toggleTextFormatType: () => Ws,
  tokenizeRawText: () => Vr,
  unmountSlotContainer: () => Nc
});
function t(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", t2);
  for (const t3 of e2) o2.append("v", t3);
  throw n2.search = o2.toString(), Error(`Minified Lexical error #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
function e(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", t2);
  for (const t3 of e2) o2.append("v", t3);
  n2.search = o2.toString(), console.warn(`Minified Lexical warning #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
var n = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement;
var o = n && "documentMode" in document ? document.documentMode : null;
var r = n && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
var i = n && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent);
var s = !(!n || !("InputEvent" in window) || o) && "getTargetRanges" in new window.InputEvent("input");
var l = n && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var c = n && /Android/.test(navigator.userAgent);
var a = n && /Version\/[\d.]+.*Safari/.test(navigator.userAgent) && !c;
var u = n && /^(?=.*Chrome).*/i.test(navigator.userAgent);
var f = n && c && u;
var d = n && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && r && !u;
var h = 0;
var g = 1;
var _ = 2;
var p = 1;
var y = 2;
var m = 4;
var x = 8;
var C = 16;
var S = 32;
var v = 64;
var T = 128;
var k = 2047;
var b = 1;
var N = 2;
var E = 3;
var w = 4;
var O = 5;
var M = 6;
var A = a || l || d ? "\xA0" : "\u200B";
var D = "\n\n";
var F = i ? "\xA0" : A;
var P = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
var I = "A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF";
var L = new RegExp("^[^" + I + "]*[" + P + "]");
var K = new RegExp("^[^" + P + "]*[" + I + "]");
var z = { bold: 1, capitalize: 1024, code: 16, highlight: T, italic: 2, lowercase: 256, strikethrough: 4, subscript: 32, superscript: 64, underline: 8, uppercase: 512 };
var B = { directionless: 1, unmergeable: 2 };
var R = { center: 2, end: 6, justify: 4, left: 1, right: 3, start: 5 };
var W = { [N]: "center", [M]: "end", [w]: "justify", [b]: "left", [E]: "right", [O]: "start" };
var $ = { normal: 0, segmented: 2, token: 1 };
var U = { [h]: "normal", [_]: "segmented", [g]: "token" };
var H = "$";
var j = "$config";
function J() {
  return vc()._blockCursorElement;
}
function V(t2) {
  return null !== t2 && 1 === t2.nodeType && t2.hasAttribute("data-lexical-slot");
}
var q = class _q {
  element;
  before;
  after;
  constructor(t2, e2, n2) {
    this.element = t2, this.before = e2 || null, this.after = n2 || null;
  }
  withBefore(t2) {
    return new _q(this.element, t2, this.after);
  }
  withAfter(t2) {
    return new _q(this.element, this.before, t2);
  }
  withElement(t2) {
    return this.element === t2 ? this : new _q(t2, this.before, this.after);
  }
  insertChild(e2) {
    const n2 = this.getInsertionAnchor();
    return null !== n2 && n2.parentElement !== this.element && t(357), this.element.insertBefore(e2, n2), this;
  }
  removeChild(e2) {
    return e2.parentElement !== this.element && t(358), this.element.removeChild(e2), this;
  }
  replaceChild(e2, n2) {
    return n2.parentElement !== this.element && t(359), this.element.replaceChild(e2, n2), this;
  }
  getFirstChild() {
    const t2 = this.getFirstChildAnchor(), e2 = t2 ? t2.nextSibling : this.element.firstChild;
    return e2 === this.getInsertionAnchor() ? null : e2;
  }
  getFirstChildAnchor() {
    return this.after;
  }
  resolveLeafPosition(t2, e2, n2) {
    if (this.element === t2) return e2 === t2 && 0 === n2 ? "before" : "after";
    const o2 = Y(t2, this.element);
    if (null === o2) return "after";
    const r2 = Array.prototype.indexOf.call(t2.childNodes, o2);
    if (r2 < 0) return "after";
    if (e2 === t2) return n2 <= r2 ? "before" : "after";
    const i2 = Y(t2, e2);
    if (null === i2) return "after";
    const s2 = Array.prototype.indexOf.call(t2.childNodes, i2);
    return s2 >= 0 && s2 <= r2 ? "before" : "after";
  }
  getInsertionAnchor() {
    return this.before;
  }
};
function Y(t2, e2) {
  let n2 = e2;
  for (; null !== n2 && n2.parentNode !== t2; ) n2 = n2.parentNode;
  return n2;
}
var G = class _G extends q {
  withBefore(t2) {
    return new _G(this.element, t2, this.after);
  }
  withAfter(t2) {
    return new _G(this.element, this.before, t2);
  }
  withElement(t2) {
    return this.element === t2 ? this : new _G(t2, this.before, this.after);
  }
  getInsertionAnchor() {
    return super.getInsertionAnchor() || this.getManagedLineBreak();
  }
  getFirstChildAnchor() {
    let t2 = super.getFirstChildAnchor(), e2 = t2 ? t2.nextSibling : this.element.firstChild;
    for (; V(e2); ) t2 = e2, e2 = e2.nextSibling;
    const n2 = t2 ? t2.nextSibling : this.element.firstChild;
    return null !== n2 && n2 === J() ? n2 : t2;
  }
  getManagedLineBreak() {
    return this.element.__lexicalLineBreak || null;
  }
  setManagedLineBreak(t2) {
    if (this.element.__lexicalLastChildKind = t2, null === t2) this.removeManagedLineBreak();
    else {
      const e2 = "decorator" === t2 && (d || l || a);
      this.insertManagedLineBreak(e2);
    }
  }
  removeManagedLineBreak() {
    const t2 = this.getManagedLineBreak();
    if (t2) {
      const e2 = this.element, n2 = "IMG" === t2.nodeName ? t2.nextSibling : null;
      n2 && e2.removeChild(n2), e2.removeChild(t2), e2.__lexicalLineBreak = void 0;
    }
  }
  insertManagedLineBreak(t2) {
    const e2 = this.getManagedLineBreak();
    if (e2) {
      if (t2 === ("IMG" === e2.nodeName)) return;
      this.removeManagedLineBreak();
    }
    const n2 = this.element, o2 = this.before, r2 = Zl().createElement("br");
    if (r2.setAttribute("data-lexical-managed-linebreak", "true"), n2.insertBefore(r2, o2), t2) {
      const t3 = Zl().createElement("img");
      t3.setAttribute("data-lexical-managed-linebreak", "true"), t3.style.setProperty("display", "inline", "important"), t3.style.setProperty("border", "0px", "important"), t3.style.setProperty("margin", "0px", "important"), t3.alt = "", n2.insertBefore(t3, r2), n2.__lexicalLineBreak = t3;
    } else n2.__lexicalLineBreak = r2;
  }
  getFirstChildOffset() {
    const t2 = this.getFirstChild(), e2 = this.getInsertionAnchor();
    let n2 = 0;
    for (let o2 = this.element.firstChild; null !== o2 && o2 !== t2 && o2 !== e2; o2 = o2.nextSibling) n2++;
    return n2;
  }
  resolveChildIndex(t2, e2, n2, o2) {
    if (n2 === this.element) {
      const e3 = this.getFirstChildOffset(), n3 = J(), r3 = this.element.childNodes, i3 = Math.min(o2, r3.length);
      let s3 = 0;
      for (let t3 = e3; t3 < i3; t3++) r3[t3] !== n3 && s3++;
      return [t2, Math.min(s3, t2.getChildrenSize())];
    }
    const r2 = X(e2, n2);
    r2.push(o2);
    const i2 = X(e2, this.element);
    let s2 = t2.getIndexWithinParent();
    for (let t3 = 0; t3 < i2.length; t3++) {
      const e3 = r2[t3], n3 = i2[t3];
      if (void 0 === e3 || e3 < n3) break;
      if (e3 > n3) {
        s2 += 1;
        break;
      }
    }
    return [t2.getParentOrThrow(), s2];
  }
};
function X(e2, n2) {
  const o2 = [];
  let r2 = n2;
  for (; r2 !== e2 && null !== r2; r2 = r2.parentNode) {
    let t2 = 0;
    for (let e3 = r2.previousSibling; null !== e3; e3 = e3.previousSibling) t2++;
    o2.push(t2);
  }
  return r2 !== e2 && t(225), o2.reverse();
}
var Q;
try {
  Q = "0.49.0+prod.esm";
} catch (t2) {
}
var Z = Q ?? '"<unknown>+source"';
var tt = class {
  _front = /* @__PURE__ */ new Set();
  _back = /* @__PURE__ */ new Set();
  _cache;
  get size() {
    return this._front.size + this._back.size;
  }
  addBack(t2) {
    return delete this._cache, this._front.has(t2) || this._back.add(t2), this;
  }
  addFront(t2) {
    return delete this._cache, this._back.has(t2) || this._front.add(t2), this;
  }
  delete(t2) {
    return delete this._cache, this._front.delete(t2) || this._back.delete(t2);
  }
  toArray() {
    const t2 = Array.from(this._front).reverse();
    for (const e2 of this._back) t2.push(e2);
    return t2;
  }
  toReadonlyArray() {
    return this._cache = this._cache || this.toArray(), this._cache;
  }
  [Symbol.iterator]() {
    return this.toReadonlyArray()[Symbol.iterator]();
  }
};
var et = null;
function nt(t2, e2 = 1e3) {
  return t2 instanceof ot ? t2.clone() : t2.size < e2 ? new Map(t2) : new ot().init(new Map(t2), void 0, t2.size);
}
var ot = class _ot {
  _mutable = false;
  _old = void 0;
  _nursery = void 0;
  _size = 0;
  clone() {
    return this._mutable = false, new _ot().init(this._old, this._nursery, this._size);
  }
  init(t2, e2, n2) {
    return this._old = t2, this._nursery = e2, this._size = n2, this;
  }
  get size() {
    return this._size;
  }
  has(t2) {
    return void 0 !== this.get(t2);
  }
  getWithTombstone(t2) {
    const e2 = this._nursery && this._nursery.get(t2);
    return void 0 !== e2 ? e2 : this._old && this._old.get(t2);
  }
  get(t2) {
    const e2 = this.getWithTombstone(t2);
    return e2 === et ? void 0 : e2;
  }
  shouldCompact() {
    return void 0 !== this._nursery && 2 * this._nursery.size > this._size;
  }
  getNursery() {
    return this._mutable && this._nursery || (this.compact(), this._nursery = new Map(this._nursery), this._mutable = true), this._nursery;
  }
  compact(t2 = false) {
    if (this._nursery && this._nursery.size > 0 && (t2 || this.shouldCompact())) {
      const t3 = new Map(this._old);
      for (const [e2, n2] of this._nursery) n2 !== et ? t3.set(e2, n2) : t3.delete(e2);
      this._old = t3, this._nursery = void 0;
    }
    return this._mutable = false, this;
  }
  set(t2, e2) {
    const n2 = this.getWithTombstone(t2);
    if (n2 === e2) return this;
    const o2 = this.getNursery();
    return n2 !== et && void 0 !== n2 || (this._size++, n2 === et && o2.delete(t2)), o2.set(t2, e2), this;
  }
  delete(t2) {
    const e2 = this.has(t2);
    return e2 && (this.getNursery().set(t2, et), this._size--), e2;
  }
  getOrInsert(t2, e2) {
    const n2 = this.get(t2);
    return void 0 !== n2 ? n2 : (this.set(t2, e2), e2);
  }
  getOrInsertComputed(t2, e2) {
    const n2 = this.get(t2);
    if (void 0 !== n2) return n2;
    const o2 = e2(t2);
    return this.set(t2, o2), o2;
  }
  clear() {
    this._mutable = false, this._old = void 0, this._nursery = void 0, this._size = 0;
  }
  *keys() {
    for (const t2 of this.entries()) yield t2[0];
  }
  *values() {
    for (const t2 of this.entries()) yield t2[1];
  }
  *entries() {
    const t2 = this._nursery, e2 = this._old;
    if (e2) for (const n2 of e2) {
      const e3 = n2[0], o2 = t2 ? t2.get(e3) : void 0;
      o2 !== et && (void 0 !== o2 && (n2[1] = o2), yield n2);
    }
    if (t2) for (const n2 of t2) n2[1] === et || e2 && e2.has(n2[0]) || (yield n2);
  }
  forEach(t2, e2) {
    void 0 !== e2 && (t2 = t2.bind(e2));
    for (const [e3, n2] of this.entries()) t2(n2, e3, this);
  }
  get [Symbol.toStringTag]() {
    return "GenMap";
  }
  [Symbol.iterator]() {
    return this.entries();
  }
};
function rt(t2, e2, n2, o2, r2, i2) {
  if (Pi(t2)) {
    let s2 = t2.getFirstChild();
    for (; null !== s2; ) {
      const t3 = s2.__key;
      s2.__parent === e2 && ((Pi(s2) || Qc(s2) && null !== s2.__slots) && rt(s2, t3, n2, o2, r2, i2), n2.has(t3) || i2.delete(t3), r2.push(t3)), s2 = s2.getNextSibling();
    }
  }
  for (const s2 of Qc(t2) && null !== t2.__slots ? t2.__slots.values() : []) {
    const t3 = o2.get(s2);
    void 0 !== t3 && Zc(t3) && t3.__slotHost === e2 && ((Pi(t3) || Qc(t3) && null !== t3.__slots) && rt(t3, s2, n2, o2, r2, i2), n2.has(s2) || i2.delete(s2), r2.push(s2));
  }
}
var it = false;
var st = 0;
function lt(t2) {
  st = t2.timeStamp;
}
function ct(t2, e2, n2) {
  const o2 = "BR" === t2.nodeName, r2 = e2.__lexicalLineBreak;
  return r2 && (t2 === r2 || o2 && t2.previousSibling === r2) || o2 && void 0 !== Qs(t2, n2);
}
function at(t2, e2, n2) {
  const o2 = Jl(Il(n2)), r2 = o2 && nc(o2, n2._rootElement);
  let i2 = null, s2 = null;
  null !== r2 && r2.anchorNode === t2 && (i2 = r2.anchorOffset, s2 = r2.focusOffset);
  const l2 = t2.nodeValue;
  null !== l2 && fl(e2, l2, i2, s2, false);
}
function ut(t2, e2, n2) {
  if (ur(t2)) {
    const e3 = t2.anchor.getNode();
    if (e3.is(n2) && t2.format !== e3.getFormat()) return false;
  }
  return zs(e2) && n2.isAttached();
}
function ft(t2, e2, n2) {
  for (let o2 = t2; o2 && !zc(o2); o2 = wl(o2)) {
    const t3 = Qs(o2, e2);
    if (void 0 !== t3) {
      const e3 = Ys(t3, n2);
      if (e3) return Ki(e3) || !gc(o2) ? void 0 : [o2, e3];
    }
  }
}
function dt(t2, e2, n2) {
  it = true;
  const o2 = performance.now() - st > 100;
  try {
    Ai(t2, () => {
      const r2 = Kr() || (function(t3) {
        return t3.read("latest", () => {
          const t4 = Kr();
          return null !== t4 ? t4.clone() : null;
        });
      })(t2), s2 = /* @__PURE__ */ new Map(), l2 = t2._editorState, c3 = t2._blockCursorElement;
      let a2 = false, u2 = "";
      for (let n3 = 0; n3 < e2.length; n3++) {
        const f4 = e2[n3], d2 = f4.type, h3 = f4.target, g3 = ft(h3, t2, l2);
        if (!g3) continue;
        const [_3, p3] = g3;
        if ("characterData" === d2) o2 && Xo(p3) && zs(h3) && ut(r2, h3, p3) && at(h3, p3, t2);
        else if ("childList" === d2) {
          a2 = true;
          const e3 = f4.addedNodes;
          for (let n5 = 0; n5 < e3.length; n5++) {
            const o4 = e3[n5], r3 = Gs(o4), s3 = o4.parentNode;
            if (!(null == s3 || o4 === c3 || null !== r3 || ct(o4, s3, t2) || t2._slotsUsed && gc(o4) && o4.hasAttribute("data-lexical-slot") || zc(o4))) {
              if (i) {
                const t3 = (gc(o4) ? o4.innerText : null) || o4.nodeValue;
                t3 && (u2 += t3);
              }
              s3.removeChild(o4);
            }
          }
          const n4 = f4.removedNodes, o3 = n4.length;
          if (o3 > 0) {
            let e4 = 0;
            for (let r3 = 0; r3 < o3; r3++) {
              const o4 = n4[r3];
              (ct(o4, h3, t2) || c3 === o4) && (h3.appendChild(o4), e4++);
            }
            o3 !== e4 && s2.set(_3, p3);
          }
        }
      }
      if (s2.size > 0) for (const [e3, n3] of s2) n3.reconcileObservedMutation(e3, t2);
      const f3 = n2.takeRecords();
      if (f3.length > 0) {
        for (let e3 = 0; e3 < f3.length; e3++) {
          const n3 = f3[e3], o3 = n3.addedNodes, r3 = n3.target;
          for (let e4 = 0; e4 < o3.length; e4++) {
            const n4 = o3[e4], i2 = n4.parentNode;
            null == i2 || "BR" !== n4.nodeName || ct(n4, r3, t2) || i2.removeChild(n4);
          }
        }
        n2.takeRecords();
      }
      null !== r2 && (a2 && ol(r2), i && bl(t2) && r2.insertRawText(u2));
    });
  } finally {
    it = false;
  }
}
function ht(t2) {
  const e2 = t2._observer;
  if (null !== e2) {
    dt(t2, e2.takeRecords(), e2);
  }
}
function gt(t2) {
  !(function(t3) {
    0 === st && Il(t3).addEventListener("textInput", lt, true);
  })(t2), t2._observer = new MutationObserver((e2, n2) => {
    dt(t2, e2, n2);
  });
}
var _t = "direct";
var pt = "latest";
var yt = class {
  key;
  parse;
  unparse;
  isEqual;
  defaultValue;
  resetOnCopyNode;
  constructor(t2, e2) {
    this.key = t2, this.parse = e2.parse.bind(e2), this.unparse = (e2.unparse || wt).bind(e2), this.isEqual = (e2.isEqual || Object.is).bind(e2), this.defaultValue = this.parse(void 0), this.resetOnCopyNode = e2.resetOnCopyNode || false;
  }
};
function mt(t2, e2) {
  return new yt(t2, e2);
}
function xt(t2, e2, n2 = pt) {
  const o2 = (n2 === pt ? t2.getLatest() : t2).__state;
  return o2 ? o2.getValue(e2) : e2.defaultValue;
}
function Ct(t2, e2, n2) {
  const o2 = xt(t2, n2, _t), r2 = xt(e2, n2, _t);
  return n2.isEqual(o2, r2) ? null : [o2, r2];
}
function St(t2, e2, n2) {
  let o2;
  if (fi(), "function" == typeof n2) {
    const r3 = t2.getLatest(), i2 = xt(r3, e2);
    if (o2 = n2(i2), e2.isEqual(i2, o2)) return r3;
  } else o2 = n2;
  const r2 = t2.getWritable();
  return bt(r2).updateFromKnown(e2, o2), r2;
}
function vt(t2) {
  const e2 = /* @__PURE__ */ new Map(), n2 = /* @__PURE__ */ new Set();
  for (const { ownNodeConfig: o2 } of jc("function" == typeof t2 ? t2 : t2.replace)) if (o2 && o2.stateConfigs) for (const t3 of o2.stateConfigs) {
    let o3;
    "stateConfig" in t3 ? (o3 = t3.stateConfig, t3.flat && n2.add(o3.key)) : o3 = t3, e2.set(o3.key, o3);
  }
  return { flatKeys: n2, sharedConfigMap: e2 };
}
var Tt = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var kt = class _kt {
  node;
  knownState;
  unknownState;
  sharedNodeState;
  size;
  constructor(t2, e2, n2 = void 0, o2 = /* @__PURE__ */ new Map(), r2 = void 0) {
    this.node = t2, this.sharedNodeState = e2, this.unknownState = n2, this.knownState = o2;
    const { sharedConfigMap: i2 } = this.sharedNodeState, s2 = void 0 !== r2 ? r2 : (function(t3, e3, n3) {
      let o3 = n3.size;
      if (e3) for (const r3 in e3) {
        const e4 = t3.get(r3);
        e4 && n3.has(e4) || o3++;
      }
      return o3;
    })(i2, n2, o2);
    this.size = s2;
  }
  getValue(t2) {
    const e2 = this.knownState.get(t2);
    if (void 0 !== e2) return e2;
    this.sharedNodeState.sharedConfigMap.set(t2.key, t2);
    let n2 = t2.defaultValue;
    if (this.unknownState && t2.key in this.unknownState) {
      const e3 = this.unknownState[t2.key];
      void 0 !== e3 && (n2 = t2.parse(e3)), this.updateFromKnown(t2, n2);
    }
    return n2;
  }
  getInternalState() {
    return [this.unknownState, this.knownState];
  }
  toJSON() {
    const t2 = { ...this.unknownState }, e2 = {};
    for (const [e3, n2] of this.knownState) e3.isEqual(n2, e3.defaultValue) ? delete t2[e3.key] : t2[e3.key] = e3.unparse(n2);
    for (const n2 of this.sharedNodeState.flatKeys) n2 in t2 && (e2[n2] = t2[n2], delete t2[n2]);
    return Et(t2) && (e2.$ = t2), e2;
  }
  getWritable(t2) {
    if (this.node === t2) return this;
    const { sharedNodeState: e2, unknownState: n2 } = this, o2 = new Map(this.knownState);
    return new _kt(t2, e2, (function(t3, e3, n3) {
      let o3;
      if (n3) for (const [r2, i2] of Object.entries(n3)) {
        if (Tt.has(r2)) continue;
        const n4 = t3.get(r2);
        n4 ? e3.has(n4) || e3.set(n4, n4.parse(i2)) : (o3 = o3 || {}, o3[r2] = i2);
      }
      return o3;
    })(e2.sharedConfigMap, o2, n2), o2, this.size);
  }
  resetOnCopyNode() {
    for (const t2 of this.knownState.keys()) t2.resetOnCopyNode && this.knownState.set(t2, t2.defaultValue);
    return this;
  }
  updateFromKnown(t2, e2) {
    const n2 = t2.key;
    this.sharedNodeState.sharedConfigMap.set(n2, t2);
    const { knownState: o2, unknownState: r2 } = this;
    o2.has(t2) || r2 && n2 in r2 || (r2 && (delete r2[n2], this.unknownState = Et(r2)), this.size++), o2.set(t2, e2);
  }
  updateFromUnknown(t2, e2) {
    if (Tt.has(t2)) return;
    const n2 = this.sharedNodeState.sharedConfigMap.get(t2);
    n2 ? this.updateFromKnown(n2, n2.parse(e2)) : (this.unknownState = this.unknownState || {}, t2 in this.unknownState || this.size++, this.unknownState[t2] = e2);
  }
  updateFromJSON(t2) {
    const { knownState: e2 } = this;
    for (const t3 of e2.keys()) e2.set(t3, t3.defaultValue);
    if (this.size = e2.size, this.unknownState = void 0, t2) for (const [e3, n2] of Object.entries(t2)) this.updateFromUnknown(e3, n2);
  }
};
function bt(t2) {
  const e2 = t2.getWritable(), n2 = e2.__state ? e2.__state.getWritable(e2) : new kt(e2, Nt(e2));
  return e2.__state = n2, n2;
}
function Nt(t2) {
  return t2.__state ? t2.__state.sharedNodeState : Ns(vc(), t2.getType()).sharedNodeState;
}
function Et(t2) {
  if (t2) for (const e2 in t2) return t2;
}
function wt(t2) {
  return t2;
}
function Ot(t2, e2, n2) {
  for (const [o2, r2] of e2.knownState) {
    if (t2.has(o2.key)) continue;
    t2.add(o2.key);
    const e3 = n2 ? n2.getValue(o2) : o2.defaultValue;
    if (e3 !== r2 && !o2.isEqual(e3, r2)) return true;
  }
  return false;
}
function Mt(t2, e2, n2) {
  const { unknownState: o2 } = e2, r2 = n2 ? n2.unknownState : void 0;
  if (o2) for (const [e3, n3] of Object.entries(o2)) {
    if (t2.has(e3)) continue;
    t2.add(e3);
    if (n3 !== (r2 ? r2[e3] : void 0)) return true;
  }
  return false;
}
function At(t2, e2) {
  const n2 = t2.__state;
  return n2 && n2.node === t2 ? n2.getWritable(e2) : n2;
}
function Dt(t2, e2) {
  const n2 = t2.__mode, o2 = t2.__format, r2 = t2.__style, i2 = e2.__mode, s2 = e2.__format, l2 = e2.__style, c3 = t2.__state, a2 = e2.__state;
  return (null === n2 || n2 === i2) && (null === o2 || o2 === s2) && (null === r2 || r2 === l2) && (null === t2.__state || c3 === a2 || (function(t3, e3) {
    if (t3 === e3) return true;
    const n3 = /* @__PURE__ */ new Set();
    return !(t3 && Ot(n3, t3, e3) || e3 && Ot(n3, e3, t3) || t3 && Mt(n3, t3, e3) || e3 && Mt(n3, e3, t3));
  })(c3, a2));
}
function Ft(t2, e2) {
  const n2 = t2.mergeWithSibling(e2), o2 = _i()._normalizedNodes;
  return o2.add(t2.__key), o2.add(e2.__key), n2;
}
function Pt(t2) {
  let e2, n2, o2 = t2;
  if ("" !== o2.__text || !o2.isSimpleText() || o2.isUnmergeable()) {
    for (; null !== (e2 = o2.getPreviousSibling()) && Xo(e2) && e2.isSimpleText() && !e2.isUnmergeable(); ) {
      if ("" !== e2.__text) {
        if (Dt(e2, o2)) {
          o2 = Ft(e2, o2);
          break;
        }
        break;
      }
      e2.remove();
    }
    for (; null !== (n2 = o2.getNextSibling()) && Xo(n2) && n2.isSimpleText() && !n2.isUnmergeable(); ) {
      if ("" !== n2.__text) {
        if (Dt(o2, n2)) {
          o2 = Ft(o2, n2);
          break;
        }
        break;
      }
      n2.remove();
    }
  } else o2.remove();
}
function It(t2) {
  return Lt(t2.anchor), Lt(t2.focus), t2;
}
function Lt(t2) {
  for (; "element" === t2.type; ) {
    const e2 = t2.getNode(), n2 = t2.offset;
    let o2, r2;
    if (n2 === e2.getChildrenSize() ? (o2 = e2.getChildAtIndex(n2 - 1), r2 = true) : (o2 = e2.getChildAtIndex(n2), r2 = false), Xo(o2)) {
      t2.set(o2.__key, r2 ? o2.getTextContentSize() : 0, "text", true);
      break;
    }
    if (!Pi(o2)) break;
    t2.set(o2.__key, r2 ? o2.getChildrenSize() : 0, "element", true);
  }
}
var Kt = Symbol.for("@lexical/CachedTextSize");
function zt(e2, n2) {
  return ee.read(() => {
    let o2 = 0, r2 = e2;
    for (let e3 = 0; e3 < n2 && null !== r2; e3++) {
      const i2 = te.get(r2);
      if (void 0 === i2 && t(345, r2), Pi(i2)) {
        const s2 = ne.get(r2);
        if (void 0 !== s2 && Pi(s2) && s2.__parent !== i2.__parent) o2 += i2.getTextContentSize();
        else {
          const e4 = oe.get(r2), n3 = e4 && e4.__lexicalTextContent;
          "string" != typeof n3 && t(346, i2.getType()), o2 += n3.length;
        }
        e3 < n2 - 1 && !i2.isInline() && (o2 += 2);
      } else {
        const e4 = i2[Kt];
        void 0 === e4 && t(347, i2.getType(), r2), o2 += e4;
      }
      r2 = i2.__next;
    }
    return o2;
  }, { editor: $t });
}
function Bt(t2) {
  Pi(t2) || void 0 === t2[Kt] && (t2[Kt] = Xo(t2) ? t2.__text.length : t2.getTextContentSize());
}
var Rt = 4;
var Wt;
var $t;
var Ut;
var Ht = "";
var jt = null;
var Jt = null;
var Vt = null;
function qt() {
  return { firstTextKey: Vt, format: jt, style: Jt };
}
function Yt(t2) {
  null !== t2.firstTextKey && (jt = t2.format, Jt = t2.style, Vt = t2.firstTextKey);
}
function Gt(e2) {
  if (null !== Vt) return;
  const n2 = e2.__lexicalFirstTextKey;
  if (void 0 === n2 && t(348), null === n2) return;
  const o2 = ne.get(n2);
  Xo(o2) && (jt = o2.getFormat(), Jt = o2.getStyle(), Vt = n2);
}
var Xt;
var Qt;
var Zt;
var te;
var ee;
var ne;
var oe;
var re;
var ie;
var se;
var le = false;
var ce = false;
function ae(t2, e2) {
  const n2 = te.get(t2), o2 = ne.has(t2);
  if (null !== e2) {
    const n3 = Fe(t2);
    n3.parentNode === e2 && e2.removeChild(n3);
  }
  if (!o2) {
    if ($t._keyToDOMMap.delete(t2), Pi(n2)) {
      const t3 = Yc(n2, te);
      ue(t3, 0, t3.length - 1, null);
    }
    if (void 0 !== n2) {
      for (const t3 of xe(n2).values()) {
        const e3 = Se(t3);
        ae(t3, null), null !== e3 && e3.remove();
      }
      Sl(ie, Ut, Xt, n2, "destroyed");
    }
  }
}
function ue(t2, e2, n2, o2) {
  for (let r2 = e2; r2 <= n2; ++r2) {
    const e3 = t2[r2];
    void 0 !== e3 && ae(e3, o2);
  }
}
function fe(t2, e2) {
  t2.setProperty("text-align", e2);
}
var de = "40px";
function he(t2, e2) {
  const n2 = Wt.theme.indent;
  if ("string" == typeof n2) {
    const o2 = t2.classList.contains(n2);
    e2 > 0 && !o2 ? t2.classList.add(n2) : e2 < 1 && o2 && t2.classList.remove(n2);
  }
  t2.style.setProperty("padding-inline-start", 0 === e2 ? "" : `calc(${e2} * var(--lexical-indent-base-value, ${de}))`);
}
function ge(t2, e2) {
  const n2 = t2.style;
  0 === e2 ? fe(n2, "") : 1 === e2 ? fe(n2, "left") : 2 === e2 ? fe(n2, "center") : 3 === e2 ? fe(n2, "right") : 4 === e2 ? fe(n2, "justify") : 5 === e2 ? fe(n2, "start") : 6 === e2 && fe(n2, "end");
}
function _e(t2, e2) {
  const n2 = (function(t3) {
    const e3 = t3.__dir;
    if (null !== e3) return e3;
    if (Bi(t3)) return null;
    const n3 = t3.getParent();
    return null === n3 || Bl(n3) && null === n3.__dir ? "auto" : null;
  })(e2);
  null !== n2 ? t2.dir = n2 : t2.removeAttribute("dir");
}
function pe(t2) {
  const e2 = Zl().createElement("div");
  return e2.setAttribute("data-lexical-slot", t2), e2.style.display = "none", e2;
}
function ye(t2, e2, n2) {
  e2 || "false" === t2.contentEditable ? Bc(n2, $t) : n2.removeAttribute("contenteditable");
}
function me(t2, e2, n2) {
  const o2 = Ht, r2 = qt();
  Ht = "";
  let i2 = "";
  const s2 = Ki(t2);
  for (const [o3, r3] of n2) {
    const n3 = pe(o3);
    ye(e2, s2, n3), e2.appendChild(n3), Ht = "";
    const l2 = qt();
    Te(r3, kc(t2, n3, $t)), Yt(l2), Ce(t2, o3, e2, n3), i2 += Ht;
  }
  return Yt(r2), Ht = o2, i2;
}
function xe(t2) {
  return Qc(t2) && null !== t2.__slots ? t2.__slots : Xc;
}
function Ce(t2, e2, n2, o2) {
  const r2 = se.$getSlotTargetElement(t2, e2, n2, $t);
  null !== r2 && (o2.parentElement !== r2 && r2.appendChild(o2), o2.style.display = "");
}
function Se(t2) {
  const e2 = oe.get(t2);
  return void 0 !== e2 ? e2.parentElement : null;
}
function ve(t2, e2, n2) {
  const o2 = xe(t2), r2 = xe(e2);
  for (const [t3, e3] of o2) if (!r2.has(t3)) {
    const t4 = Se(e3);
    ae(e3, null), null !== t4 && t4.remove();
  }
  const i2 = Ht, s2 = qt();
  let l2 = "", c3 = null;
  const a2 = Ki(e2);
  for (const [t3, i3] of r2) {
    const r3 = o2.get(t3);
    let s3 = void 0 !== r3 ? Se(r3) : null;
    Ht = "";
    const u2 = qt();
    if (null === s3) {
      s3 = pe(t3);
      let o3 = null;
      for (const t4 of n2.children) if (!t4.hasAttribute("data-lexical-slot")) {
        o3 = t4;
        break;
      }
      n2.insertBefore(s3, o3), Te(i3, kc(e2, s3, $t));
    } else r3 === i3 ? we(i3, s3) : (void 0 !== r3 && ae(r3, s3), Te(i3, kc(e2, s3, $t)));
    if (Yt(u2), ye(n2, a2, s3), Ce(e2, t3, n2, s3), l2 += Ht, s3.parentElement === n2) {
      const t4 = null === c3 ? n2.firstChild : c3.nextSibling;
      t4 !== s3 && n2.insertBefore(s3, t4), c3 = s3;
    }
  }
  return Yt(s2), Ht = i2, l2;
}
function Te(e2, n2) {
  const o2 = ne.get(e2);
  if (void 0 === o2 && t(60), null !== n2) {
    const t2 = te.get(e2);
    if (void 0 !== t2) {
      const r3 = oe.get(e2);
      if (void 0 !== r3) {
        const i2 = Zc(t2) ? t2.__slotHost : null, s2 = Zc(o2) ? o2.__slotHost : null, l2 = t2.__parent !== o2.__parent || i2 !== s2, c3 = null !== s2 && r3.parentElement !== n2.element;
        if (l2 || c3) return n2.insertChild(r3), we(e2, n2.element);
      }
    }
  }
  const r2 = se.$createDOM(o2, $t);
  if ((function(t2, e3, n3) {
    const o3 = n3._keyToDOMMap;
    Xs(e3, n3, t2), o3.set(t2, e3);
  })(e2, r2, $t), Xo(o2) ? r2.setAttribute("data-lexical-text", "true") : Ki(o2) && (r2.setAttribute("data-lexical-decorator", "true"), Kc(r2, { captureSelection: true })), Pi(o2)) {
    const t2 = o2.__indent, e3 = o2.__size;
    _e(r2, o2), 0 !== t2 && he(r2, t2);
    const n3 = xe(o2), i2 = n3.size > 0 ? me(o2, r2, n3) : "";
    if (0 === e3) r2.__lexicalTextContent = i2, r2.__lexicalFirstTextKey = null, Ht += i2, n3.size > 0 && (r2.__lexicalSlotTextLength = i2.length);
    else {
      const t3 = Ht, s3 = e3 - 1;
      if (ke(Yc(o2, ne), o2, 0, s3, kc(o2, r2, $t)), "" !== i2) {
        const e4 = r2.__lexicalTextContent || "";
        r2.__lexicalTextContent = i2 + e4, Ht = t3 + i2 + e4;
      }
      n3.size > 0 && (r2.__lexicalSlotTextLength = i2.length);
    }
    const s2 = o2.__format;
    0 !== s2 && ge(r2, s2), o2.isInline() || be(null, o2, r2);
  } else {
    const t2 = o2.getTextContent();
    if (Ki(o2)) {
      const t3 = o2.decorate($t, Wt);
      null !== t3 && Oe(e2, t3), r2.contentEditable = "false";
      const n3 = xe(o2);
      n3.size > 0 && me(o2, r2, n3);
    }
    Ht += t2;
  }
  return null !== n2 && n2.insertChild(r2), se.$decorateDOM(o2, null, r2, $t), Bt(o2), Sl(ie, Ut, Xt, o2, "created"), r2;
}
function ke(e2, n2, o2, r2, i2) {
  const s2 = Ht, l2 = qt();
  Ht = "", jt = null, Jt = null, Vt = null;
  let c3 = o2;
  for (; c3 <= r2; ++c3) {
    const t2 = qt();
    Te(e2[c3], i2);
    const n3 = ne.get(e2[c3]);
    null !== n3 && Xo(n3) ? null === jt && (jt = n3.getFormat(), Jt = n3.getStyle(), Vt = n3.__key) : Pi(n3) && c3 < r2 && !n3.isInline() && (Ht += D), Yt(t2);
  }
  const a2 = $t._keyToDOMMap.get(n2.__key);
  void 0 === a2 && t(349, n2.__key), a2.__lexicalTextContent = Ht, a2.__lexicalFirstTextKey = Vt, Ht = s2 + Ht, Yt(l2);
}
function be(t2, e2, n2) {
  const o2 = kc(e2, n2, $t), r2 = o2.element.__lexicalLastChildKind ?? null, i2 = (function(t3, e3) {
    if (t3) {
      const n3 = t3.__last;
      if (n3) {
        const t4 = e3.get(n3);
        if (t4) return Yi(t4) ? "line-break" : Ki(t4) && t4.isInline() ? "decorator" : null;
      }
      return xe(t3).size > 0 ? null : "empty";
    }
    return null;
  })(e2, ne);
  r2 !== i2 && o2.setManagedLineBreak(i2);
}
function Ne(e2, n2, o2) {
  var r2;
  jt = null, Jt = null, Vt = null, (function(e3, n3, o3) {
    const r3 = Ht, i2 = e3.__size, s2 = n3.__size;
    Ht = "";
    const l2 = o3.element, c3 = $t._keyToDOMMap.get(n3.__key);
    void 0 === c3 && t(351, n3.__key);
    const a2 = s2 - i2;
    if (!le && Math.abs(a2) <= 1 && i2 >= Rt && e3.__first === n3.__first && (0 !== a2 || !$t._cloneNotNeeded.has(e3.__key))) {
      const i3 = c3.__lexicalTextContent, u2 = re.get(e3.__key);
      if (!le && "string" == typeof i3 && void 0 !== u2) {
        const s3 = (function(t2, e4) {
          const n4 = e4.size;
          if (0 === n4 || n4 >= t2.__size) return null;
          let o4 = t2.__last, r4 = null, i4 = 0;
          for (; null !== o4 && i4 < n4; ) {
            if (!e4.has(o4)) return null;
            r4 = o4;
            const t3 = ne.get(o4);
            if (void 0 === t3) return null;
            o4 = t3.__prev, i4++;
          }
          if (i4 !== n4) return null;
          if (null !== o4 && e4.has(o4)) return null;
          return r4;
        })(n3, u2);
        if (null !== s3) {
          const f3 = u2.size;
          if (0 === a2) {
            const e4 = zt(s3, f3);
            let o4 = s3, a3 = 0;
            for (; null !== o4 && a3 < f3; ) {
              const t2 = ne.get(o4);
              if (void 0 === t2) break;
              const e5 = qt();
              we(o4, l2), Xo(t2) && null === jt && (jt = t2.getFormat(), Jt = t2.getStyle(), Vt = t2.__key), Yt(e5), o4 = t2.__next, a3++;
            }
            let d2 = "";
            for (o4 = s3, a3 = 0; null !== o4 && a3 < f3; ) {
              const e5 = ne.get(o4);
              if (void 0 === e5) break;
              let n4;
              if (Pi(e5)) {
                const r4 = $t._keyToDOMMap.get(o4), i4 = r4 && r4.__lexicalTextContent;
                "string" != typeof i4 && t(352, e5.getType()), n4 = i4;
              } else n4 = e5.getTextContent();
              d2 += n4, a3 < f3 - 1 && Pi(e5) && !e5.isInline() && (d2 += D), o4 = e5.__next, a3++;
            }
            const h3 = c3.__lexicalSlotTextLength || 0, g3 = h3 > 0 ? i3.slice(h3) : i3, _3 = g3.slice(0, g3.length - e4) + d2;
            return c3.__lexicalTextContent = _3, Ht = r3 + _3, void Ee(n3, c3, u2);
          }
          if ((function(e4, n4, o4, r4, i4, s4, l3, c4) {
            if (1 !== c4 && -1 !== c4) return false;
            const a3 = 1 === c4 ? 2 : 1;
            if (l3 !== a3) return false;
            const u3 = l3 - c4;
            let f4 = e4.__last;
            for (let t2 = 0; t2 < u3 - 1; t2++) {
              if (null === f4) return false;
              const t3 = te.get(f4);
              if (void 0 === t3) return false;
              f4 = t3.__prev;
            }
            if (null === f4) return false;
            const d2 = ne.get(s4), h3 = te.get(f4);
            if (void 0 === d2 || void 0 === h3) return false;
            if (d2.__prev !== h3.__prev) return false;
            const g3 = [];
            let _3 = s4;
            for (let t2 = 0; t2 < l3; t2++) {
              if (null === _3) return false;
              g3.push(_3);
              const t3 = ne.get(_3);
              _3 = t3 ? t3.__next : null;
            }
            const p3 = [];
            _3 = f4;
            for (let t2 = 0; t2 < u3; t2++) {
              if (null === _3) return false;
              p3.push(_3);
              const t3 = te.get(_3);
              _3 = t3 ? t3.__next : null;
            }
            const y3 = new Set(p3), m3 = new Set(g3), x3 = [];
            let C2 = 0, S2 = 0;
            for (; C2 < u3 && S2 < l3; ) if (g3[S2] === p3[C2]) x3.push({ key: g3[S2], kind: "reconcile" }), C2++, S2++;
            else if (m3.has(p3[C2])) {
              if (y3.has(g3[S2])) return false;
              x3.push({ key: g3[S2], kind: "create", nextIndex: S2 }), S2++;
            } else x3.push({ key: p3[C2], kind: "destroy" }), C2++;
            for (; C2 < u3; ) x3.push({ key: p3[C2++], kind: "destroy" });
            for (; S2 < l3; ) x3.push({ key: g3[S2], kind: "create", nextIndex: S2 }), S2++;
            const v2 = zt(f4, u3);
            for (const t2 of x3) {
              const e5 = qt();
              if ("reconcile" === t2.kind) we(t2.key, o4.element);
              else if ("destroy" === t2.kind) ae(t2.key, o4.element);
              else {
                let e6 = null;
                for (let n5 = t2.nextIndex + 1; n5 < l3; n5++) {
                  const t3 = $t._keyToDOMMap.get(g3[n5]);
                  if (void 0 !== t3) {
                    e6 = t3;
                    break;
                  }
                }
                Te(t2.key, o4.withBefore(e6 ?? o4.before));
              }
              if ("destroy" !== t2.kind) {
                const e6 = ne.get(t2.key);
                e6 && Xo(e6) && null === jt && (jt = e6.getFormat(), Jt = e6.getStyle(), Vt = e6.__key);
              }
              Yt(e5);
            }
            let T2 = "";
            for (let e5 = 0; e5 < l3; e5++) {
              const n5 = ne.get(g3[e5]);
              if (void 0 === n5) return false;
              let o5;
              if (Pi(n5)) {
                const r5 = $t._keyToDOMMap.get(g3[e5]), i5 = r5 && r5.__lexicalTextContent;
                "string" != typeof i5 && t(350, n5.getType()), o5 = i5;
              } else o5 = n5.getTextContent();
              T2 += o5, e5 < l3 - 1 && Pi(n5) && !n5.isInline() && (T2 += D);
            }
            const k3 = r4.__lexicalSlotTextLength || 0, b4 = k3 > 0 ? i4.slice(k3) : i4;
            return r4.__lexicalTextContent = b4.slice(0, b4.length - v2) + T2, true;
          })(e3, 0, o3, c3, i3, s3, f3, a2)) {
            const e4 = c3.__lexicalTextContent;
            return "string" != typeof e4 && t(353), Ht = r3 + e4, void Ee(n3, c3, u2);
          }
        }
      }
      if (0 === a2) {
        let n4 = e3.__first, o4 = 0;
        for (; null !== n4; ) {
          const e4 = ne.get(n4);
          if (void 0 === e4) break;
          const r4 = le || Zt.has(n4) || Qt.has(n4), i4 = qt();
          if (r4) we(n4, l2);
          else {
            let o5, r5;
            if (Pi(e4)) {
              r5 = oe.get(n4);
              const i5 = r5 && r5.__lexicalTextContent;
              "string" != typeof i5 && t(354, e4.getType()), o5 = i5;
            } else o5 = e4.getTextContent();
            Ht += o5, void 0 !== r5 && Gt(r5);
          }
          Xo(e4) ? null === jt && (jt = e4.getFormat(), Jt = e4.getStyle(), Vt = e4.__key) : Pi(e4) && o4 < s2 - 1 && !e4.isInline() && (Ht += D), Yt(i4), n4 = e4.__next, o4++;
        }
        return c3.__lexicalTextContent = Ht, c3.__lexicalFirstTextKey = Vt, void (Ht = r3 + Ht);
      }
    }
    if (1 === i2 && 1 === s2) {
      const t2 = e3.__first, r4 = n3.__first;
      if (t2 === r4) we(t2, l2);
      else {
        const e4 = Fe(t2), n4 = Te(r4, null);
        try {
          e4.parentNode === l2 ? l2.replaceChild(n4, e4) : o3.insertChild(n4);
        } catch (o4) {
          if ("object" == typeof o4 && null != o4) {
            const i4 = `${o4.toString()} Parent: ${l2.tagName}, new child: {tag: ${n4.tagName} key: ${r4}}, old child: {tag: ${e4.tagName}, key: ${t2}}.`;
            throw new Error(i4);
          }
          throw o4;
        }
        ae(t2, null);
      }
      const i3 = ne.get(r4);
      Xo(i3) && null === jt && (jt = i3.getFormat(), Jt = i3.getStyle(), Vt = i3.__key);
    } else {
      const r4 = Yc(e3, te), c4 = Yc(n3, ne);
      if (r4.length !== i2 && t(227), c4.length !== s2 && t(228), 0 === i2) 0 !== s2 && ke(c4, n3, 0, s2 - 1, o3);
      else if (0 === s2) {
        if (0 !== i2) {
          const t2 = null == o3.after && null == o3.before && 0 === xe(n3).size && null == o3.element.__lexicalLineBreak;
          ue(r4, 0, i2 - 1, t2 ? null : l2), t2 && (l2.textContent = "");
        }
      } else !(function(t2, e4, n4, o4, r5, i3) {
        const s3 = o4 - 1, l3 = r5 - 1;
        let c5, a3, u2 = i3.getFirstChild(), f3 = 0, d2 = 0;
        for (; f3 <= s3 && d2 <= l3; ) {
          const t3 = e4[f3], o5 = n4[d2], r6 = qt();
          if (t3 === o5) u2 = Me(we(o5, i3.element)), f3++, d2++;
          else {
            if (void 0 === a3 && (a3 = Ae(n4, d2)), void 0 === c5) c5 = Ae(e4, f3);
            else if (!c5.has(t3)) {
              f3++, Yt(r6);
              continue;
            }
            if (!a3.has(t3)) {
              u2 = Me(Fe(t3)), ae(t3, i3.element), f3++, c5.delete(t3), Yt(r6);
              continue;
            }
            if (c5.has(o5)) {
              const t4 = El($t, o5);
              t4 !== u2 && i3.withBefore(u2 ?? i3.before).insertChild(t4), u2 = Me(we(o5, i3.element)), f3++, d2++;
            } else Te(o5, i3.withBefore(u2 ?? i3.before)), d2++;
          }
          const s4 = ne.get(o5);
          null !== s4 && Xo(s4) ? null === jt && (jt = s4.getFormat(), Jt = s4.getStyle(), Vt = s4.__key) : Pi(s4) && d2 <= l3 && !s4.isInline() && (Ht += D), Yt(r6);
        }
        const h3 = f3 > s3, g3 = d2 > l3;
        if (h3 && !g3) {
          const e5 = n4[l3 + 1], o5 = void 0 === e5 ? null : $t.getElementByKey(e5);
          ke(n4, t2, d2, l3, i3.withBefore(o5 ?? i3.before));
        } else g3 && !h3 && ue(e4, f3, s3, i3.element);
      })(n3, r4, c4, i2, s2, o3);
    }
    c3.__lexicalTextContent = Ht, c3.__lexicalFirstTextKey = Vt, Ht = r3 + Ht;
  })(e2, n2, kc(n2, o2, $t)), Bl(n2) || (r2 = n2, null == jt || jt === r2.__textFormat || ce || r2.setTextFormat(jt), (function(t2) {
    null == Jt || Jt === t2.__textStyle || ce || t2.setTextStyle(Jt);
  })(n2));
}
function Ee(t2, e2, n2) {
  const o2 = e2.__lexicalFirstTextKey;
  if (null != o2) {
    const e3 = t2.__key;
    let r2 = o2;
    for (; null !== r2; ) {
      const t3 = ne.get(r2);
      if (void 0 === t3) {
        r2 = null;
        break;
      }
      if (t3.__parent === e3) break;
      r2 = t3.__parent;
    }
    if (null !== r2 && !n2.has(r2)) {
      const t3 = ne.get(o2);
      if (Xo(t3)) return jt = t3.getFormat(), void (Jt = t3.getStyle());
    }
  }
  e2.__lexicalFirstTextKey = Vt;
}
function we(e2, n2) {
  const o2 = te.get(e2);
  let r2 = ne.get(e2);
  void 0 !== o2 && void 0 !== r2 || t(61);
  const i2 = le || Zt.has(e2) || Qt.has(e2), s2 = El($t, e2);
  if (o2 === r2 && !i2) {
    let e3;
    if (Pi(o2)) {
      const n3 = s2.__lexicalTextContent;
      "string" != typeof n3 && t(355, o2.getType()), e3 = n3, Gt(s2);
    } else e3 = o2.getTextContent();
    return Ht += e3, s2;
  }
  if (o2 !== r2 && i2 && Sl(ie, Ut, Xt, r2, "updated"), se.$updateDOM(r2, o2, s2, $t)) {
    const o3 = Te(e2, null);
    return null === n2 && t(62), n2.replaceChild(o3, s2), ae(e2, null), o3;
  }
  if (Pi(o2)) {
    Pi(r2) || t(334, e2);
    const n3 = r2.__indent;
    (le || n3 !== o2.__indent) && he(s2, n3);
    const l2 = r2.__format;
    (le || l2 !== o2.__format) && ge(s2, l2);
    const c3 = i2 && (xe(r2).size > 0 || xe(o2).size > 0) ? ve(o2, r2, s2) : "";
    if (i2) {
      const t2 = Ht;
      if (Ne(o2, r2, s2), Bi(r2) || r2.isInline() || be(0, r2, s2), "" !== c3) {
        const e3 = s2.__lexicalTextContent || "";
        s2.__lexicalTextContent = c3 + e3, Ht = t2 + c3 + e3, s2.__lexicalSlotTextLength = c3.length;
      } else (xe(r2).size > 0 || xe(o2).size > 0) && (s2.__lexicalSlotTextLength = 0);
    } else {
      const e3 = s2.__lexicalTextContent;
      "string" != typeof e3 && t(356, o2.getType()), Ht += e3, Gt(s2);
    }
    if ((le || r2.__dir !== o2.__dir || r2.__parent !== o2.__parent) && (_e(s2, r2), Bi(r2) && !le)) {
      for (const t2 of r2.getChildren()) if (Pi(t2)) {
        _e(El($t, t2.getKey()), t2);
      }
    }
  } else {
    const t2 = r2.getTextContent();
    if (Ki(r2)) {
      const t3 = r2.decorate($t, Wt);
      null !== t3 && Oe(e2, t3), i2 && (xe(r2).size > 0 || xe(o2).size > 0) && ve(o2, r2, s2);
    }
    Ht += t2;
  }
  if (!ce && Bi(r2)) {
    const t2 = r2.getLatest();
    if (t2.__cachedText !== Ht) {
      const e3 = t2.getWritable();
      e3.__cachedText = Ht, r2 = e3;
    }
  }
  return se.$decorateDOM(r2, o2, s2, $t), Bt(r2), s2;
}
function Oe(t2, e2) {
  let n2 = $t._pendingDecorators;
  const o2 = $t._decorators;
  if (null === n2) {
    if (o2[t2] === e2) return;
    n2 = tl($t);
  }
  n2[t2] = e2;
}
function Me(t2) {
  let e2 = t2.nextSibling;
  return null !== e2 && e2 === $t._blockCursorElement && (e2 = e2.nextSibling), e2;
}
function Ae(t2, e2) {
  const n2 = /* @__PURE__ */ new Set();
  for (let o2 = e2; o2 < t2.length; o2++) n2.add(t2[o2]);
  return n2;
}
function De(t2, e2, n2, o2, r2, i2) {
  Ht = "", jt = null, Jt = null, Vt = null, le = 2 === o2, $t = n2, Wt = n2._config, se = n2._config.dom || ps, Ut = n2._nodes, Xt = $t._listeners.mutation, Qt = r2, Zt = i2, te = t2._nodeMap, ee = t2, ne = e2._nodeMap, ce = e2._readOnly, oe = nt(n2._keyToDOMMap), re = (function() {
    const t3 = /* @__PURE__ */ new Map(), e3 = (e4) => {
      for (const n3 of e4) {
        const e5 = ne.get(n3);
        if (void 0 === e5) continue;
        const o3 = e5.__parent;
        if (null === o3) continue;
        let r3 = t3.get(o3);
        void 0 === r3 && (r3 = /* @__PURE__ */ new Set(), t3.set(o3, r3)), r3.add(n3);
      }
    };
    return e3(Qt.keys()), e3(Zt), t3;
  })();
  const s2 = /* @__PURE__ */ new Map();
  return ie = s2, we("root", null), $t = void 0, Ut = void 0, Qt = void 0, Zt = void 0, te = void 0, ee = void 0, ne = void 0, Wt = void 0, oe = void 0, re = void 0, ie = void 0, se = ps, s2;
}
function Fe(e2) {
  const n2 = oe.get(e2);
  return void 0 === n2 && t(75, e2), n2;
}
function Pe(t2) {
  return { type: t2 };
}
var Ie = /* @__PURE__ */ Pe("SELECTION_CHANGE_COMMAND");
var Le = /* @__PURE__ */ Pe("SELECTION_INSERT_CLIPBOARD_NODES_COMMAND");
var Ke = /* @__PURE__ */ Pe("CLICK_COMMAND");
var ze = /* @__PURE__ */ Pe("BEFORE_INPUT_COMMAND");
var Be = /* @__PURE__ */ Pe("INPUT_COMMAND");
var Re = /* @__PURE__ */ Pe("COMPOSITION_START_COMMAND");
var We = /* @__PURE__ */ Pe("COMPOSITION_END_COMMAND");
var $e = /* @__PURE__ */ Pe("DELETE_CHARACTER_COMMAND");
var Ue = /* @__PURE__ */ Pe("INSERT_LINE_BREAK_COMMAND");
var He = /* @__PURE__ */ Pe("INSERT_PARAGRAPH_COMMAND");
var je = /* @__PURE__ */ Pe("CONTROLLED_TEXT_INSERTION_COMMAND");
var Je = /* @__PURE__ */ Pe("PASTE_COMMAND");
var Ve = /* @__PURE__ */ Pe("REMOVE_TEXT_COMMAND");
var qe = /* @__PURE__ */ Pe("DELETE_WORD_COMMAND");
var Ye = /* @__PURE__ */ Pe("DELETE_LINE_COMMAND");
var Ge = /* @__PURE__ */ Pe("FORMAT_TEXT_COMMAND");
var Xe = /* @__PURE__ */ Pe("SET_TEXT_FORMAT_COMMAND");
var Qe = /* @__PURE__ */ Pe("UNDO_COMMAND");
var Ze = /* @__PURE__ */ Pe("REDO_COMMAND");
var tn = /* @__PURE__ */ Pe("KEYDOWN_COMMAND");
var en2 = /* @__PURE__ */ Pe("KEY_ARROW_RIGHT_COMMAND");
var nn = /* @__PURE__ */ Pe("MOVE_TO_END");
var on = /* @__PURE__ */ Pe("KEY_ARROW_LEFT_COMMAND");
var rn = /* @__PURE__ */ Pe("MOVE_TO_START");
var sn = /* @__PURE__ */ Pe("KEY_ARROW_UP_COMMAND");
var ln = /* @__PURE__ */ Pe("KEY_ARROW_DOWN_COMMAND");
var cn = /* @__PURE__ */ Pe("KEY_ENTER_COMMAND");
var an = /* @__PURE__ */ Pe("KEY_SPACE_COMMAND");
var un = /* @__PURE__ */ Pe("KEY_BACKSPACE_COMMAND");
var fn = /* @__PURE__ */ Pe("KEY_ESCAPE_COMMAND");
var dn = /* @__PURE__ */ Pe("KEY_DELETE_COMMAND");
var hn = /* @__PURE__ */ Pe("KEY_TAB_COMMAND");
var gn = /* @__PURE__ */ Pe("INSERT_TAB_COMMAND");
var _n = /* @__PURE__ */ Pe("INDENT_CONTENT_COMMAND");
var pn = /* @__PURE__ */ Pe("OUTDENT_CONTENT_COMMAND");
var yn = /* @__PURE__ */ Pe("DROP_COMMAND");
var mn = /* @__PURE__ */ Pe("FORMAT_ELEMENT_COMMAND");
var xn = /* @__PURE__ */ Pe("DRAGSTART_COMMAND");
var Cn = /* @__PURE__ */ Pe("DRAGOVER_COMMAND");
var Sn = /* @__PURE__ */ Pe("DRAGEND_COMMAND");
var vn = /* @__PURE__ */ Pe("COPY_COMMAND");
var Tn = /* @__PURE__ */ Pe("CUT_COMMAND");
var kn = /* @__PURE__ */ Pe("SELECT_ALL_COMMAND");
var bn = /* @__PURE__ */ Pe("CLEAR_EDITOR_COMMAND");
var Nn = /* @__PURE__ */ Pe("CLEAR_HISTORY_COMMAND");
var En = /* @__PURE__ */ Pe("CAN_REDO_COMMAND");
var wn = /* @__PURE__ */ Pe("CAN_UNDO_COMMAND");
var On = /* @__PURE__ */ Pe("FOCUS_COMMAND");
var Mn = /* @__PURE__ */ Pe("BLUR_COMMAND");
var An = /* @__PURE__ */ Pe("KEY_MODIFIER_COMMAND");
function Dn(t2) {
  const e2 = /* @__PURE__ */ new Map();
  return { dispose() {
    for (const t3 of e2.values()) t3.dispose();
    e2.clear();
  }, register(n2, o2) {
    let r2 = e2.get(n2);
    void 0 === r2 && (r2 = { dispose: t2(n2, o2), holders: /* @__PURE__ */ new Set() }, e2.set(n2, r2));
    const i2 = () => {
      const t3 = e2.get(n2);
      t3 && t3.holders.delete(i2) && 0 === t3.holders.size && (e2.delete(n2), t3.dispose());
    };
    return r2.holders.add(i2), i2;
  } };
}
function Fn(t2, e2, n2, o2) {
  return t2.addEventListener(e2, n2, o2), t2.removeEventListener.bind(t2, e2, n2, o2);
}
var Pn = Object.freeze({});
var In = [["keydown", function(t2, e2) {
  const n2 = e2._inputState;
  n2.lastKeyDownTimeStamp = t2.timeStamp, n2.lastKeyCode = t2.key, "Backspace" !== t2.key && Jn(n2);
  if (e2.isComposing()) return;
  Nl(e2, tn, t2);
}], ["pointerdown", function(t2, e2) {
  const n2 = ac(t2), o2 = t2.pointerType;
  _c(n2) && "touch" !== o2 && "pen" !== o2 && 0 === t2.button && Ai(e2, () => {
    Rc(n2, e2) || (e2._inputState.isSelectionChangeFromMouseDown = true);
  });
}], ["compositionstart", function(t2, e2) {
  Nl(e2, Re, t2);
}], ["compositionend", function(t2, e2) {
  const n2 = e2._inputState;
  i ? n2.compositionPhase = "ending-firefox" : l || !a && !d ? Nl(e2, We, t2) : (n2.compositionPhase = "ending-safari", n2.compositionEndData = t2.data);
}], ["input", function(t2, e2) {
  t2.stopPropagation();
  const n2 = e2._inputState;
  Jn(n2), Ai(e2, () => {
    qn(t2, e2) || e2.dispatchCommand(Be, t2);
  }, { event: t2 }), n2.unprocessedBeforeInputData = null;
}], ["click", function(t2, e2) {
  Ai(e2, () => {
    const n2 = Kr(), o2 = Jl(Il(e2)), r2 = zr();
    if (o2) {
      if (ur(n2)) {
        const t3 = n2.anchor, e3 = t3.getNode();
        "element" === t3.type && 0 === t3.offset && n2.isCollapsed() && !Bi(e3) && 1 === nl().getChildrenSize() && e3.getTopLevelElementOrThrow().isEmpty() && null !== r2 && n2.is(r2) && (o2.removeAllRanges(), n2.dirty = true);
      } else if ("touch" === t2.pointerType || "pen" === t2.pointerType) {
        const n3 = nc(o2, e2._rootElement).anchorNode;
        if (gc(n3) || zs(n3)) {
          ol(Lr(r2, o2, e2, t2));
        }
      }
    }
    if (i && null !== o2 && 0 === o2.rangeCount) {
      const n3 = e2._rootElement;
      if (null !== n3 && t2.target === n3) {
        const i2 = t2.clientY;
        let s2 = n3.childNodes.length;
        for (let t3 = 0; t3 < n3.childNodes.length; t3++) {
          const e3 = n3.childNodes[t3];
          if (gc(e3)) {
            const n4 = e3.getBoundingClientRect();
            if (i2 <= (n4.top + n4.bottom) / 2) {
              s2 = t3;
              break;
            }
          }
        }
        o2.setBaseAndExtent(n3, s2, n3, s2);
        const l2 = Lr(r2, o2, e2, t2);
        null !== l2 ? ol(l2) : o2.removeAllRanges();
      }
    }
    Nl(e2, Ke, t2);
  });
}], ["cut", Pn], ["copy", Pn], ["dragstart", Pn], ["dragover", Pn], ["dragend", Pn], ["paste", Pn], ["focus", Pn], ["blur", Pn], ["drop", Pn]];
s && In.push(["beforeinput", (t2, e2) => (function(t3, e3) {
  const n2 = t3.inputType;
  if ("deleteCompositionText" === n2 || i && bl(e3)) return;
  if ("insertCompositionText" === n2) return;
  Ai(e3, () => {
    qn(t3, e3) || Nl(e3, ze, t3);
  }, { event: t3 });
})(t2, e2)]);
var Ln = /* @__PURE__ */ new WeakMap();
var Kn = /* @__PURE__ */ new WeakMap();
var zn = Dn((t2) => (t2.addEventListener("selectionchange", ro), () => t2.removeEventListener("selectionchange", ro)));
function Bn(t2, e2, n2, o2, r2, i2) {
  const l2 = t2.anchor, c3 = t2.focus, a2 = l2.getNode(), u2 = _i();
  let f3;
  if (void 0 !== i2) f3 = i2;
  else {
    const t3 = Jl(Il(u2));
    f3 = null !== t3 ? nc(t3, u2._rootElement) : null;
  }
  const d2 = null !== f3 ? f3.anchorNode : null, h3 = l2.key, g3 = u2.getElementByKey(h3), _3 = n2.length;
  return h3 !== c3.key || !Xo(a2) || (!r2 && (!s || u2._inputState.lastBeforeInputInsertTextTimeStamp < o2 + 50) || a2.isDirty() && _3 < 2 || sl(n2)) && l2.offset !== c3.offset && !a2.isComposing() || Ks(a2) || a2.isDirty() && _3 > 1 || (r2 || !s) && null !== g3 && !a2.isComposing() && d2 !== wc(a2, g3, u2) || null !== f3 && null !== e2 && (!e2.collapsed || e2.startContainer !== f3.anchorNode || e2.startOffset !== f3.anchorOffset) || !a2.isComposing() && (a2.getFormat() !== t2.format || a2.getStyle() !== t2.style) || (function(t3, e3) {
    if (e3.isSegmented()) return true;
    if (!t3.isCollapsed()) return false;
    const n3 = t3.anchor.offset, o3 = e3.getParentOrThrow(), r3 = Ls(e3);
    return 0 === n3 ? !e3.canInsertTextBefore() || !o3.canInsertTextBefore() && !e3.isComposing() || r3 || (function(t4) {
      const e4 = t4.getPreviousSibling();
      return (Xo(e4) || Pi(e4) && e4.isInline()) && !e4.canInsertTextAfter();
    })(e3) : n3 === e3.getTextContentSize() && (!e3.canInsertTextAfter() || !o3.canInsertTextAfter() && !e3.isComposing() || r3);
  })(t2, a2);
}
function Rn(t2, e2) {
  return zs(t2) && null !== t2.nodeValue && 0 !== e2 && e2 !== t2.nodeValue.length;
}
function Wn(e2, n2, o2) {
  const { anchorNode: r2, anchorOffset: i2, focusNode: s2, focusOffset: l2 } = nc(e2, n2._rootElement), c3 = n2._inputState;
  c3.isSelectionChangeFromDOMUpdate && (c3.isSelectionChangeFromDOMUpdate = false, Rn(r2, i2) && Rn(s2, l2) && !c3.postDeleteSelectionToRestore) || Ai(n2, () => {
    if (!o2) return void ol(null);
    if (!As(n2, r2, s2)) return;
    let a2 = Kr();
    if (c3.postDeleteSelectionToRestore && ur(a2) && a2.isCollapsed()) {
      const t2 = a2.anchor, e3 = c3.postDeleteSelectionToRestore.anchor;
      (t2.key === e3.key && t2.offset === e3.offset + 1 || 1 === t2.offset && e3.getNode().is(t2.getNode().getPreviousSibling())) && (a2 = c3.postDeleteSelectionToRestore.clone(), ol(a2));
    }
    if (c3.postDeleteSelectionToRestore = null, ur(a2)) {
      const o3 = a2.anchor, u2 = o3.getNode();
      if (a2.isCollapsed()) {
        "Range" === e2.type && r2 === s2 && (a2.dirty = true);
        const i3 = Il(n2).event, l3 = i3 ? i3.timeStamp : performance.now(), { format: f3, style: d2, offset: h3, key: g3, timeStamp: _3 } = c3.collapsedSelectionFormat, p3 = nl(), y3 = false === n2.isComposing() && "" === p3.getTextContent();
        if (l3 < _3 + 200 && o3.offset === h3 && o3.key === g3) $n(a2, f3, d2);
        else if ("text" === o3.type) Xo(u2) || t(141), Un(a2, u2);
        else if ("element" === o3.type && !y3) {
          Pi(u2) || t(259);
          const e3 = o3.getNode();
          e3.isEmpty() ? (function(t2, e4) {
            const n3 = e4.getTextFormat(), o4 = e4.getTextStyle();
            $n(t2, n3, o4);
          })(a2, e3) : $n(a2, a2.format, "");
        }
      } else {
        const t2 = o3.key, e3 = a2.focus.key, n3 = a2.getNodes(), r3 = n3.length, s3 = a2.isBackward(), c4 = s3 ? l2 : i2, u3 = s3 ? i2 : l2, f3 = s3 ? e3 : t2, d2 = s3 ? t2 : e3;
        let h3 = 2047, g3 = false;
        for (let t3 = 0; t3 < r3; t3++) {
          const e4 = n3[t3], o4 = e4.getTextContentSize();
          if (Xo(e4) && 0 !== o4 && !(0 === t3 && e4.__key === f3 && c4 === o4 || t3 === r3 - 1 && e4.__key === d2 && 0 === u3) && (g3 = true, h3 &= e4.getFormat(), 0 === h3)) break;
        }
        a2.format = g3 ? h3 : 0;
      }
    }
    Nl(n2, Ie);
  });
}
function $n(t2, e2, n2) {
  t2.format === e2 && t2.style === n2 || (t2.format = e2, t2.style = n2, t2.dirty = true);
}
function Un(t2, e2) {
  $n(t2, e2.getFormat(), e2.getStyle());
}
function Hn(t2) {
  if (!t2.getTargetRanges) return null;
  const e2 = t2.getTargetRanges();
  return 0 === e2.length ? null : e2[0];
}
function jn(t2) {
  const { lastKeyCode: e2 } = _i()._inputState;
  if (null == t2 || t2.length <= 1 || null == e2) return;
  const n2 = 1 === e2.length ? e2 : "Enter" === e2 ? "\n" : "Tab" === e2 ? "	" : null;
  if (!n2) return;
  const o2 = Kr();
  if (!ur(o2) || !o2.isCollapsed()) return;
  const r2 = o2.anchor.getNode();
  if (!Xo(r2)) return;
  const { offset: i2 } = o2.anchor;
  if (r2.getTextContentSize() === i2) {
    const t3 = r2.getNextSibling();
    if ("\n" === n2) {
      if (Yi(t3)) t3.selectEnd();
      else if (!t3) {
        const t4 = qc(r2, Ar), e3 = t4 && t4.getNextSibling();
        Pi(e3) && e3.selectStart();
      }
    } else "	" === n2 ? er(t3) && t3.selectEnd() : Xo(t3) && t3.getTextContent()[0] === n2 && t3.select(1, 1);
  } else r2.getTextContent()[i2] === n2 && r2.select(i2 + 1, i2 + 1);
}
function Jn(t2) {
  t2.isInsertTextAfterHandledSelectionCommand = false, null !== t2.handledSelectionCommandTimeoutId && (clearTimeout(t2.handledSelectionCommandTimeoutId), t2.handledSelectionCommandTimeoutId = null);
}
function Vn(t2) {
  Jn(t2), t2.isInsertTextAfterHandledSelectionCommand = true, t2.handledSelectionCommandTimeoutId = setTimeout(() => Jn(t2), 0);
}
function qn(t2, e2) {
  const n2 = ac(t2);
  if (gc(n2) && Rc(n2, e2)) return true;
  const o2 = e2.getRootElement();
  if (null === o2) return false;
  const r2 = cc(o2.ownerDocument);
  return null !== r2 && o2.contains(r2) && Rc(r2, e2);
}
function Yn(e2) {
  const n2 = e2.inputType, o2 = Hn(e2), r2 = _i(), i2 = r2._inputState, s2 = Kr();
  if ("insertText" === n2 && e2.data && i2.isInsertTextAfterHandledSelectionCommand) {
    if (Jn(i2), e2.preventDefault(), ur(s2) && !s2.isCollapsed()) {
      const t2 = s2.isBackward() ? s2.anchor : s2.focus;
      s2.anchor.set(t2.key, t2.offset, t2.type), s2.focus.set(t2.key, t2.offset, t2.type);
    }
    return true;
  }
  if ("deleteContentBackward" === n2) {
    if (null === s2) {
      const t2 = zr();
      if (!ur(t2)) return true;
      ol(t2.clone());
    }
    if (ur(s2)) {
      const n3 = s2.anchor.key === s2.focus.key;
      if ((function(t2, e3) {
        return "MediaLast" === t2.lastKeyCode && e3 < t2.lastKeyDownTimeStamp + 30;
      })(i2, e2.timeStamp) && r2.isComposing() && n3) {
        if (Vs(null), i2.lastKeyDownTimeStamp = 0, setTimeout(() => {
          Ai(r2, () => {
            Vs(null);
          });
        }, 30), ur(s2)) {
          const e3 = s2.anchor.getNode();
          e3.markDirty(), Xo(e3) || t(142), Un(s2, e3);
        }
      } else {
        if (Vs(null), l && null !== o2 && !o2.collapsed && (s2.applyDOMRange(o2), !s2.isCollapsed())) return e2.preventDefault(), s2.removeText(), true;
        e2.preventDefault();
        const t2 = s2.anchor.getNode(), c4 = t2.getTextContent(), a3 = t2.canInsertTextAfter(), u3 = 0 === s2.anchor.offset && s2.focus.offset === c4.length;
        let d3 = f && n3 && !u3 && a3;
        if (d3 && s2.isCollapsed() && (d3 = !Ki(kl(s2.anchor, true))), !d3) {
          Nl(r2, $e, true);
          const t3 = Kr();
          f && ur(t3) && t3.isCollapsed() && (i2.postDeleteSelectionToRestore = t3, setTimeout(() => i2.postDeleteSelectionToRestore = null));
        }
      }
      return true;
    }
  }
  if (!ur(s2)) return true;
  const c3 = e2.data;
  null !== i2.unprocessedBeforeInputData && ul(false, r2, i2.unprocessedBeforeInputData), s2.dirty && null === i2.unprocessedBeforeInputData || !s2.isCollapsed() || Bi(s2.anchor.getNode()) || null === o2 || s2.applyDOMRange(o2), i2.unprocessedBeforeInputData = null;
  const a2 = s2.anchor, u2 = s2.focus, d2 = a2.getNode(), h3 = u2.getNode();
  if ("insertText" === n2 || "insertTranspose" === n2) {
    if ("\n" === c3) e2.preventDefault(), Nl(r2, Ue, false);
    else if (c3 === D) e2.preventDefault(), Nl(r2, He);
    else if (null == c3 && e2.dataTransfer) {
      const t2 = e2.dataTransfer.getData("text/plain");
      e2.preventDefault(), s2.insertRawText(t2);
    } else null != c3 && Bn(s2, o2, c3, e2.timeStamp, true) ? (e2.preventDefault(), Nl(r2, je, c3), jn(c3)) : i2.unprocessedBeforeInputData = c3;
    return i2.lastBeforeInputInsertTextTimeStamp = e2.timeStamp, true;
  }
  switch (e2.preventDefault(), n2) {
    case "insertFromYank":
    case "insertFromDrop":
    case "insertReplacementText":
      Nl(r2, je, e2);
      jn((e2.dataTransfer ? e2.dataTransfer.getData("text/plain") : null) ?? e2.data);
      break;
    case "insertFromComposition": {
      const t2 = i2.hadOrphanedCompositionEvents;
      i2.hadOrphanedCompositionEvents = false;
      const n3 = r2._compositionKey;
      Vs(null), t2 || Nl(r2, je, e2), Zn(n3);
      break;
    }
    case "insertLineBreak":
      Vs(null), Nl(r2, Ue, false);
      break;
    case "insertParagraph":
      Vs(null), i2.isInsertLineBreak && !l ? (i2.isInsertLineBreak = false, Nl(r2, Ue, false)) : Nl(r2, He);
      break;
    case "insertFromPaste":
    case "insertFromPasteAsQuotation":
      Nl(r2, Je, e2);
      break;
    case "deleteByComposition":
      (function(t2, e3) {
        return t2 !== e3 || Pi(t2) || Pi(e3) || !Ls(t2) || !Ls(e3);
      })(d2, h3) && Nl(r2, Ve, e2);
      break;
    case "deleteByDrag":
      Al(No), Nl(r2, Ve, e2);
      break;
    case "deleteByCut":
      Nl(r2, Ve, e2);
      break;
    case "deleteContent":
      Nl(r2, $e, false);
      break;
    case "deleteWordBackward":
      Nl(r2, qe, true);
      break;
    case "deleteWordForward":
      Nl(r2, qe, false);
      break;
    case "deleteHardLineBackward":
    case "deleteSoftLineBackward":
      Nl(r2, Ye, true);
      break;
    case "deleteContentForward":
    case "deleteHardLineForward":
    case "deleteSoftLineForward":
      Nl(r2, Ye, false);
      break;
    case "formatStrikeThrough":
      Nl(r2, Ge, "strikethrough");
      break;
    case "formatBold":
      Nl(r2, Ge, "bold");
      break;
    case "formatItalic":
      Nl(r2, Ge, "italic");
      break;
    case "formatUnderline":
      Nl(r2, Ge, "underline");
      break;
    case "historyUndo":
      Nl(r2, Qe);
      break;
    case "historyRedo":
      Nl(r2, Ze);
  }
  return true;
}
function Gn(t2) {
  const e2 = _i(), n2 = e2._inputState, o2 = Kr(), r2 = t2.data, l2 = Hn(t2);
  let c3 = false;
  if (null != r2 && ur(o2)) {
    const a2 = Jl(Il(e2)), u2 = null !== a2 ? nc(a2, e2._rootElement) : null, d2 = "insertCompositionText" === t2.inputType && "ending-firefox" !== n2.compositionPhase && !e2.isComposing();
    d2 && (n2.hadOrphanedCompositionEvents = true);
    const h3 = o2.anchor.getNode(), g3 = "insertCompositionText" === t2.inputType && "ending-firefox" !== n2.compositionPhase && e2.isComposing() && Xo(h3) && Ks(h3);
    if (!d2 && !g3 && Bn(o2, l2, r2, t2.timeStamp, false, u2)) {
      if (c3 = true, "ending-firefox" === n2.compositionPhase) {
        const t3 = to(e2, r2);
        if (n2.compositionPhase = "idle", t3) return Al(wo), rl(), true;
      }
      const l3 = o2.anchor.getNode();
      if (null === a2 || null === u2) return true;
      const d3 = o2.isBackward(), h4 = d3 ? o2.anchor.offset : o2.focus.offset, g4 = d3 ? o2.focus.offset : o2.anchor.offset;
      s && !o2.isCollapsed() && Xo(l3) && null !== u2.anchorNode && l3.getTextContent().slice(0, h4) + r2 + l3.getTextContent().slice(h4 + g4) === al(u2.anchorNode) || Nl(e2, je, r2);
      const _3 = r2.length;
      i && _3 > 1 && "insertCompositionText" === t2.inputType && !e2.isComposing() && (o2.anchor.offset -= _3, o2._cachedNodes = null, o2._cachedIsBackward = null), f && e2.isComposing() && (n2.lastKeyDownTimeStamp = 0, Vs(null));
    }
  }
  if (!c3) {
    ul(false, e2, null !== r2 ? r2 : void 0), "ending-firefox" === n2.compositionPhase && (to(e2, r2 || void 0), Al(wo), n2.compositionPhase = "idle");
  }
  return rl(), true;
}
function Xn(t2) {
  const e2 = _i(), n2 = e2._inputState, o2 = Kr();
  if (ur(o2) && !e2.isComposing()) {
    n2.compositionPhase = "composing", n2.hadOrphanedCompositionEvents = false;
    const r2 = o2.anchor, i2 = o2.anchor.getNode();
    if (Vs(r2.key), Al(Eo), t2.timeStamp < n2.lastKeyDownTimeStamp + 30 || "element" === r2.type || !o2.isCollapsed() || !f && (i2.getFormat() !== o2.format || Xo(i2) && i2.getStyle() !== o2.style) || Xo(i2) && (Ks(i2) || 0 === r2.offset && !i2.canInsertTextBefore() || r2.offset === i2.getTextContentSize() && !i2.canInsertTextAfter())) {
      Nl(e2, je, F);
      const t3 = Kr();
      ur(t3) && Vs(t3.anchor.key);
    }
  }
  return true;
}
function Qn(t2) {
  const e2 = _i();
  return e2._inputState.compositionPhase = "idle", to(e2, t2.data), Al(wo), true;
}
function Zn(t2) {
  if (null === t2) return;
  const e2 = Ys(t2);
  if (!Xo(e2) || "text" === e2.getType() || Ks(e2) || !e2.isAttached()) return;
  const n2 = Kr(), o2 = ur(n2) && n2.anchor.key === t2 ? n2.anchor.offset : null, r2 = Go(e2.getTextContent());
  if (r2.setFormat(e2.getFormat()), r2.setStyle(e2.getStyle()), e2.replace(r2), null !== o2) {
    const t3 = Math.min(o2, r2.getTextContentSize());
    r2.select(t3, t3);
  }
}
function to(t2, e2) {
  const n2 = t2._compositionKey;
  if (Vs(null), null !== n2 && null != e2) {
    if ("" === e2) {
      const e3 = Ys(n2), o3 = t2.getElementByKey(n2), r2 = null !== o3 && Xo(e3) ? wc(e3, o3, t2) : null;
      if (null !== r2 && null !== r2.nodeValue && Xo(e3)) {
        const n3 = Jl(Il(t2)), o4 = n3 && nc(n3, t2._rootElement);
        let i2 = null, s2 = null;
        null !== o4 && o4.anchorNode === r2 && (i2 = o4.anchorOffset, s2 = o4.focusOffset), fl(e3, r2.nodeValue, i2, s2, true);
      }
      return Zn(n2), false;
    }
    if ("\n" === e2[e2.length - 1]) {
      const e3 = Kr();
      if (ur(e3) || dr(e3)) {
        if (ur(e3)) {
          const t3 = e3.focus;
          e3.anchor.set(t3.key, t3.offset, t3.type);
        }
        return Nl(t2, cn, null), Zn(n2), false;
      }
    }
    const o2 = Ys(n2);
    if (null !== o2 && Xo(o2) && Ks(o2)) {
      o2.markDirty();
      const t3 = Kr(), r2 = o2.getTextContentSize(), i2 = ur(t3) && t3.anchor.key === n2 ? t3.anchor.offset : r2;
      return o2.select(i2, i2).insertText(e2), true;
    }
  }
  return ul(true, t2, e2), Zn(n2), false;
}
function eo(t2) {
  const e2 = _i(), n2 = e2._inputState;
  if (null == t2.key) return true;
  if ("ending-safari" === n2.compositionPhase) {
    const o2 = ml(t2);
    if (o2 && Ai(e2, () => {
      to(e2, n2.compositionEndData);
    }), n2.compositionPhase = "idle", n2.compositionEndData = "", o2) return true;
  }
  if ((function(t3) {
    return _l(t3, "ArrowRight", { shiftKey: "any" });
  })(t2)) Nl(e2, en2, t2);
  else if ((function(t3) {
    return _l(t3, "ArrowRight", { ...pl, shiftKey: "any" });
  })(t2)) Nl(e2, nn, t2);
  else if ((function(t3) {
    return _l(t3, "ArrowLeft", { shiftKey: "any" });
  })(t2)) Nl(e2, on, t2);
  else if ((function(t3) {
    return _l(t3, "ArrowLeft", { ...pl, shiftKey: "any" });
  })(t2)) Nl(e2, rn, t2);
  else if ((function(t3) {
    return _l(t3, "ArrowUp", { altKey: "any", shiftKey: "any" });
  })(t2)) Nl(e2, sn, t2);
  else if ((function(t3) {
    return _l(t3, "ArrowDown", { altKey: "any", shiftKey: "any" });
  })(t2)) Nl(e2, ln, t2);
  else if ((function(t3) {
    return _l(t3, "Enter", { altKey: "any", ctrlKey: "any", metaKey: "any", shiftKey: true });
  })(t2)) n2.isInsertLineBreak = true, Nl(e2, cn, t2);
  else if ((function(t3) {
    return " " === t3.key;
  })(t2)) Nl(e2, an, t2);
  else if ((function(t3) {
    return r && _l(t3, "o", { ctrlKey: true });
  })(t2)) t2.preventDefault(), n2.isInsertLineBreak = true, Nl(e2, Ue, true);
  else if ((function(t3) {
    return _l(t3, "Enter", { altKey: "any", ctrlKey: "any", metaKey: "any" });
  })(t2)) n2.isInsertLineBreak = false, Nl(e2, cn, t2);
  else if ((function(t3) {
    return _l(t3, "Backspace", { shiftKey: "any" }) || r && _l(t3, "h", { ctrlKey: true });
  })(t2)) ml(t2) ? Nl(e2, un, t2) && Vn(n2) : (t2.preventDefault(), Nl(e2, $e, true));
  else if ((function(t3) {
    return "Escape" === t3.key;
  })(t2)) Nl(e2, fn, t2);
  else if ((function(t3) {
    return _l(t3, "Delete", {}) || r && _l(t3, "d", { ctrlKey: true });
  })(t2)) !(function(t3) {
    return "Delete" === t3.key;
  })(t2) ? (t2.preventDefault(), Nl(e2, $e, false)) : Nl(e2, dn, t2);
  else if ((function(t3) {
    return _l(t3, "Backspace", yl);
  })(t2)) t2.preventDefault(), Nl(e2, qe, true);
  else if ((function(t3) {
    return _l(t3, "Delete", yl);
  })(t2)) t2.preventDefault(), Nl(e2, qe, false);
  else if ((function(t3) {
    return r && _l(t3, "Backspace", { metaKey: true });
  })(t2)) t2.preventDefault(), Nl(e2, Ye, true);
  else if ((function(t3) {
    return r && (_l(t3, "Delete", { metaKey: true }) || _l(t3, "k", { ctrlKey: true }));
  })(t2)) t2.preventDefault(), Nl(e2, Ye, false);
  else if ((function(t3) {
    return _l(t3, "b", pl);
  })(t2)) t2.preventDefault(), Nl(e2, Ge, "bold");
  else if ((function(t3) {
    return _l(t3, "u", pl);
  })(t2)) t2.preventDefault(), Nl(e2, Ge, "underline");
  else if ((function(t3) {
    return _l(t3, "i", pl);
  })(t2)) t2.preventDefault(), Nl(e2, Ge, "italic");
  else if ((function(t3) {
    return _l(t3, "Tab", { shiftKey: "any" });
  })(t2)) Nl(e2, hn, t2);
  else if ((function(t3) {
    return _l(t3, "z", pl);
  })(t2)) t2.preventDefault(), Nl(e2, Qe);
  else if ((function(t3) {
    if (r) return _l(t3, "z", { metaKey: true, shiftKey: true });
    return _l(t3, "y", { ctrlKey: true }) || _l(t3, "z", { ctrlKey: true, shiftKey: true });
  })(t2)) t2.preventDefault(), Nl(e2, Ze);
  else {
    const o2 = e2._editorState._selection;
    !(function(t3) {
      return _l(t3, "a", pl);
    })(t2) ? null === o2 || ur(o2) || (!(function(t3) {
      return _l(t3, "c", pl);
    })(t2) ? (function(t3) {
      return _l(t3, "x", pl);
    })(t2) && (t2.preventDefault(), Nl(e2, Tn, t2)) : (t2.preventDefault(), Nl(e2, vn, t2))) : (t2.preventDefault(), Nl(e2, kn, t2) && Vn(n2));
  }
  return (function(t3) {
    return t3.ctrlKey || t3.shiftKey || t3.altKey || t3.metaKey;
  })(t2) && e2.dispatchCommand(An, t2), true;
}
function no(t2) {
  let e2 = t2.__lexicalEventHandles;
  return void 0 === e2 && (e2 = [], t2.__lexicalEventHandles = e2), e2;
}
var oo = /* @__PURE__ */ new Map();
function ro(t2) {
  const e2 = Vl(t2.target);
  if (null === e2) return;
  const n2 = Ol(t2.target);
  let o2 = null, r2 = null;
  const i2 = null !== n2 ? Kn.get(n2) : void 0;
  if (null !== n2) {
    if (void 0 !== i2) {
      const t3 = i2.editors;
      let n3 = i2.hasShadowEditor;
      if (void 0 === n3) {
        n3 = false;
        for (const e3 of t3) if (null !== e3._rootElement && ql(e3._rootElement.getRootNode())) {
          n3 = true;
          break;
        }
        i2.hasShadowEditor = n3;
      }
      if (n3) {
        let n4 = null, i3 = null;
        for (const s3 of t3) {
          const t4 = s3._rootElement;
          if (null === t4) continue;
          const l3 = nc(e2, t4).anchorNode;
          if (null !== l3 && Fs(l3) === s3) {
            if (ql(t4.getRootNode())) {
              o2 = s3, r2 = l3;
              break;
            }
            null === n4 && (n4 = s3, i3 = l3);
          }
        }
        null === o2 && null !== n4 && (o2 = n4, r2 = i3);
      } else {
        const t4 = e2.anchorNode;
        null === t4 || gc(t4) && null !== t4.shadowRoot || (o2 = Fs(t4), null !== o2 && (r2 = t4));
      }
    }
    if (null === o2) {
      const t3 = cc(n2);
      o2 = null !== t3 ? Fs(t3) : null;
    }
  }
  if (null === o2) return;
  if (o2._inputState.isSelectionChangeFromMouseDown) {
    if (void 0 !== i2) for (const t3 of i2.editors) t3._inputState.isSelectionChangeFromMouseDown = false;
    Ai(o2, () => {
      const n3 = zr(), i3 = r2 ?? nc(e2, o2._rootElement).anchorNode;
      if (gc(i3) || zs(i3)) {
        ol(Lr(n3, e2, o2, t2));
      }
    });
  }
  const s2 = ll(o2), l2 = s2[s2.length - 1], c3 = l2._key, a2 = oo.get(c3), u2 = a2 || l2;
  u2 !== o2 && Wn(e2, u2, false), Wn(e2, o2, true), o2 !== l2 ? oo.set(c3, o2) : a2 && oo.delete(c3);
}
function io(t2) {
  t2._lexicalHandled = true;
}
function so(t2) {
  return true === t2._lexicalHandled;
}
var lo = () => {
};
function co(e2) {
  const n2 = Ln.get(e2);
  if (void 0 === n2) return void lo();
  const o2 = Kn.get(n2);
  if (void 0 === o2) return void lo();
  Ln.delete(e2);
  const r2 = Ps(e2);
  Ds(r2) ? (!(function(t2) {
    if (null !== t2._parentEditor) {
      const e3 = ll(t2), n3 = e3[e3.length - 1]._key;
      oo.get(n3) === t2 && oo.delete(n3);
    } else oo.delete(t2._key);
  })(r2), o2.editors.delete(r2), o2.hasShadowEditor = void 0, e2.__lexicalEditor = null) : r2 && t(198);
  const i2 = no(e2);
  for (let t2 = 0; t2 < i2.length; t2++) i2[t2]();
  e2.__lexicalEventHandles = [];
}
function ao(e2, n2, o2) {
  fi();
  const r2 = e2.__key, i2 = e2.getParent();
  if (null === i2) return void (null !== ta(e2) && t(367, r2, String(ta(e2))));
  const s2 = (function(t2) {
    const e3 = Kr();
    if (!ur(e3) || !Pi(t2)) return e3;
    const { anchor: n3, focus: o3 } = e3, r3 = n3.getNode(), i3 = o3.getNode();
    Fl(r3, t2) && n3.set(t2.__key, 0, "element");
    Fl(i3, t2) && o3.set(t2.__key, 0, "element");
    return e3;
  })(e2);
  let l2 = false;
  if (ur(s2) && n2) {
    const t2 = s2.anchor, n3 = s2.focus;
    t2.key === r2 && (Wr(t2, e2, i2, e2.getPreviousSibling(), e2.getNextSibling()), l2 = true), n3.key === r2 && (Wr(n3, e2, i2, e2.getPreviousSibling(), e2.getNextSibling()), l2 = true);
  } else dr(s2) && n2 && e2.isSelected() && e2.selectPrevious();
  if (ur(s2) && n2 && !l2) {
    const t2 = e2.getIndexWithinParent();
    Hs(e2), Br(s2, i2, t2, -1);
  } else Hs(e2);
  o2 || Bl(i2) || i2.canBeEmpty() || !i2.isEmpty() || ao(i2, n2), n2 && s2 && Bi(i2) && i2.isEmpty() && i2.selectEnd();
}
function uo(t2) {
  return t2;
}
var fo = Symbol.for("ephemeral");
function ho(t2) {
  return t2[fo] || false;
}
var go = { configurable: true, enumerable: false, value: void 0, writable: true };
var _o = class {
  __type;
  __key;
  __parent;
  __prev;
  __next;
  __state;
  [Kt];
  static getType() {
    const { ownNodeType: e2 } = Hc(this);
    return void 0 === e2 && t(64, this.name), e2;
  }
  static clone(e2) {
    t(65, this.name);
  }
  $config() {
    return {};
  }
  config(t2, e2) {
    const n2 = e2.extends || Gc(this.constructor);
    return Object.assign(e2, { extends: n2 }), "string" == typeof t2 && Object.assign(e2, { type: t2 }), { [t2]: e2 };
  }
  afterCloneFrom(t2) {
    this.__key === t2.__key ? (this.__parent = t2.__parent, this.__next = t2.__next, this.__prev = t2.__prev, this.__state = t2.__state) : t2.__state && (this.__state = t2.__state.getWritable(this));
  }
  resetOnCopyNodeFrom(t2) {
    this.__state && (this.__state = this.__state.getWritable(this).resetOnCopyNode());
  }
  static importDOM;
  constructor(t2) {
    this.__type = this.constructor.getType(), this.__parent = null, this.__prev = null, this.__next = null, Object.defineProperty(this, "__state", go), Object.defineProperty(this, Kt, go), Us(this, t2);
  }
  getType() {
    return this.__type;
  }
  isInline() {
    t(137, this.constructor.name);
  }
  isAttached() {
    let t2 = this.__key;
    for (; null !== t2; ) {
      if ("root" === t2) return true;
      const e2 = Ys(t2);
      if (null === e2) break;
      t2 = null !== e2.__parent ? e2.__parent : ta(e2);
    }
    return false;
  }
  isSelected(t2) {
    const e2 = t2 || Kr();
    if (null == e2) return false;
    const n2 = e2.getNodes().some((t3) => t3.__key === this.__key);
    if (Xo(this)) return n2;
    if (ur(e2) && "element" === e2.anchor.type && "element" === e2.focus.type) {
      if (e2.isCollapsed()) return false;
      const t3 = this.getParent();
      if (Ki(this) && this.isInline() && t3) {
        const n3 = e2.isBackward() ? e2.focus : e2.anchor;
        if (t3.is(n3.getNode()) && n3.offset === t3.getChildrenSize() && this.is(t3.getLastChild())) return false;
      }
    }
    return n2;
  }
  getKey() {
    return this.__key;
  }
  getIndexWithinParent() {
    const t2 = this.getParent();
    if (null === t2) return -1;
    let e2 = t2.getFirstChild(), n2 = 0;
    for (; null !== e2; ) {
      if (this.is(e2)) return n2;
      n2++, e2 = e2.getNextSibling();
    }
    return -1;
  }
  getParent() {
    const t2 = this.getLatest().__parent;
    return null === t2 ? null : Ys(t2);
  }
  getParentOrThrow() {
    const e2 = this.getParent();
    return null === e2 && t(66, this.__key), e2;
  }
  getTopLevelElement() {
    let e2 = this;
    for (; null !== e2; ) {
      const n2 = e2.getParent();
      if (Bl(n2) || null !== ta(e2)) return Pi(e2) || e2 === this && Ki(e2) || t(194), e2;
      e2 = n2;
    }
    return null;
  }
  getTopLevelElementOrThrow() {
    const e2 = this.getTopLevelElement();
    return null === e2 && t(67, this.__key), e2;
  }
  getParents() {
    const t2 = [];
    let e2 = this.getParent();
    for (; null !== e2; ) t2.push(e2), e2 = e2.getParent();
    return t2;
  }
  getParentKeys() {
    const t2 = [];
    let e2 = this.getParent();
    for (; null !== e2; ) t2.push(e2.__key), e2 = e2.getParent();
    return t2;
  }
  getPreviousSibling() {
    const t2 = this.getLatest().__prev;
    return null === t2 ? null : Ys(t2);
  }
  getPreviousSiblings() {
    const t2 = [], e2 = this.getParent();
    if (null === e2) return t2;
    let n2 = e2.getFirstChild();
    for (; null !== n2 && !n2.is(this); ) t2.push(n2), n2 = n2.getNextSibling();
    return t2;
  }
  getNextSibling() {
    const t2 = this.getLatest().__next;
    return null === t2 ? null : Ys(t2);
  }
  getNextSiblings() {
    const t2 = [];
    let e2 = this.getNextSibling();
    for (; null !== e2; ) t2.push(e2), e2 = e2.getNextSibling();
    return t2;
  }
  getCommonAncestor(t2) {
    const e2 = Pi(this) ? this : this.getParent(), n2 = Pi(t2) ? t2 : t2.getParent(), o2 = e2 && n2 ? Za(e2, n2) : null;
    return o2 ? o2.commonAncestor : null;
  }
  is(t2) {
    return null != t2 && this.__key === t2.__key;
  }
  isBefore(e2) {
    const n2 = Za(this, e2);
    return null !== n2 && ("descendant" === n2.type || ("branch" === n2.type ? -1 === Ga(n2) : ("same" !== n2.type && "ancestor" !== n2.type && t(279), false)));
  }
  isParentOf(t2) {
    return Fl(t2, this);
  }
  getNodesBetween(e2) {
    const n2 = this.isBefore(e2), o2 = [], r2 = /* @__PURE__ */ new Set();
    let i2 = this;
    for (; null !== i2; ) {
      const s2 = i2.__key;
      if (r2.has(s2) || (r2.add(s2), o2.push(i2)), i2 === e2) break;
      const l2 = Pi(i2) ? n2 ? i2.getFirstChild() : i2.getLastChild() : null;
      if (null !== l2) {
        i2 = l2;
        continue;
      }
      const c3 = n2 ? i2.getNextSibling() : i2.getPreviousSibling();
      if (null !== c3) {
        i2 = c3;
        continue;
      }
      const a2 = i2.getParentOrThrow();
      if (r2.has(a2.__key) || o2.push(a2), a2 === e2) break;
      let u2 = null, f3 = a2;
      do {
        if (null === f3 && t(68), u2 = n2 ? f3.getNextSibling() : f3.getPreviousSibling(), f3 = f3.getParent(), null === f3) break;
        null !== u2 || r2.has(f3.__key) || o2.push(f3);
      } while (null === u2);
      i2 = u2;
    }
    return n2 || o2.reverse(), o2;
  }
  isDirty() {
    const t2 = _i()._dirtyLeaves;
    return null !== t2 && t2.has(this.__key);
  }
  getLatest() {
    if (ho(this)) return this;
    const e2 = Ys(this.__key);
    return null === e2 && t(113), e2;
  }
  getWritable() {
    if (ho(this)) return this;
    fi();
    const t2 = hi(), e2 = _i(), n2 = t2._nodeMap, o2 = this.__key, r2 = this.getLatest(), i2 = e2._cloneNotNeeded, s2 = Kr();
    if (null !== s2 && s2.setCachedNodes(null), i2.has(o2)) return Js(r2), r2;
    const l2 = Dc(r2);
    return i2.add(o2), Js(l2), n2.set(o2, l2), l2;
  }
  getTextContent() {
    return ha(this);
  }
  getTextContentSize() {
    return this.getTextContent().length;
  }
  createDOM(e2, n2) {
    t(70);
  }
  updateDOM(e2, n2, o2) {
    t(71);
  }
  getDOMSlot(t2) {
    return new q(t2);
  }
  exportDOM(t2) {
    return { element: this.createDOM(t2._config, t2) };
  }
  exportJSON() {
    const t2 = this.__state ? this.__state.toJSON() : void 0;
    return { type: this.__type, version: 1, ...t2 };
  }
  static importJSON(e2) {
    t(18, this.name);
  }
  updateFromJSON(t2) {
    return (function(t3, e2) {
      const n2 = t3.getWritable(), o2 = e2.$;
      let r2 = o2;
      for (const t4 of Nt(n2).flatKeys) t4 in e2 && (void 0 !== r2 && r2 !== o2 || (r2 = { ...o2 }), r2[t4] = e2[t4]);
      return (n2.__state || r2) && bt(t3).updateFromJSON(r2), n2;
    })(this, t2);
  }
  static transform() {
    return null;
  }
  remove(t2) {
    ao(this, true, t2);
  }
  replace(e2, n2) {
    fi();
    let o2 = Kr();
    null !== o2 && (o2 = o2.clone()), $l(this, e2);
    const r2 = this.getLatest(), i2 = this.__key, s2 = e2.__key, l2 = e2.getWritable(), c3 = this.getParentOrThrow().getWritable(), a2 = c3.__size, u2 = l2.getParent(), f3 = null !== u2 ? l2.getIndexWithinParent() : -1;
    Hs(l2), null !== u2 && ur(o2) && Br(o2, u2, f3, -1);
    const d2 = r2.getPreviousSibling(), h3 = r2.getNextSibling(), g3 = r2.__prev, _3 = r2.__next, p3 = r2.__parent;
    if (ao(r2, false, true), null === d2) c3.__first = s2;
    else {
      d2.getWritable().__next = s2;
    }
    if (l2.__prev = g3, null === h3) c3.__last = s2;
    else {
      h3.getWritable().__prev = s2;
    }
    l2.__next = _3, l2.__parent = p3, c3.__size = a2;
    let y3 = 0;
    n2 && (Pi(this) && Pi(l2) || t(139), y3 = l2.getChildrenSize(), l2.splice(y3, 0, this.getChildren()));
    const m3 = ia(this);
    if (m3.length > 0) {
      Qc(this) && Qc(l2) || t(368, this.__key, l2.__key);
      for (const t2 of m3) {
        const e3 = sa(this, t2);
        null !== e3 && (ya(this, t2), pa(l2, t2, e3));
      }
    }
    if (ur(o2)) {
      ol(o2);
      const t2 = o2.anchor, e3 = o2.focus;
      t2.key === i2 && (n2 && "element" === t2.type ? t2.set(l2.__key, y3 + t2.offset, "element") : ir(t2, l2)), e3.key === i2 && (n2 && "element" === e3.type ? e3.set(l2.__key, y3 + e3.offset, "element") : ir(e3, l2));
    }
    return qs() === i2 && Vs(s2), l2;
  }
  insertAfter(t2, e2 = true) {
    fi(), $l(this, t2);
    const n2 = this.getWritable(), o2 = t2.getWritable();
    ma(this.getParentOrThrow());
    const r2 = o2.getParent(), i2 = Kr();
    let s2 = false, l2 = false;
    if (null !== r2) {
      const n3 = t2.getIndexWithinParent();
      if (ur(i2)) {
        const t3 = r2.__key, e3 = i2.anchor, o3 = i2.focus;
        s2 = "element" === e3.type && e3.key === t3 && e3.offset === n3 + 1, l2 = "element" === o3.type && o3.key === t3 && o3.offset === n3 + 1;
      }
      Hs(o2), e2 && ur(i2) && Br(i2, r2, n3, -1);
    } else Hs(o2);
    const c3 = this.getNextSibling(), a2 = this.getParentOrThrow().getWritable(), u2 = o2.__key, f3 = n2.__next;
    if (null === c3) a2.__last = u2;
    else {
      c3.getWritable().__prev = u2;
    }
    if (a2.__size++, n2.__next = u2, o2.__next = f3, o2.__prev = n2.__key, o2.__parent = n2.__parent, e2 && ur(i2)) {
      const t3 = this.getIndexWithinParent();
      Br(i2, a2, t3 + 1);
      const e3 = a2.__key;
      s2 && i2.anchor.set(e3, t3 + 2, "element"), l2 && i2.focus.set(e3, t3 + 2, "element");
    }
    return t2;
  }
  insertBefore(t2, e2 = true) {
    fi(), $l(this, t2);
    const n2 = this.getWritable(), o2 = t2.getWritable();
    ma(this.getParentOrThrow());
    const r2 = o2.__key, i2 = Kr(), s2 = o2.getParent(), l2 = null !== s2 ? o2.getIndexWithinParent() : -1;
    Hs(o2), null !== s2 && e2 && ur(i2) && Br(i2, s2, l2, -1);
    const c3 = this.getPreviousSibling(), a2 = this.getParentOrThrow().getWritable(), u2 = n2.__prev, f3 = this.getIndexWithinParent();
    if (null === c3) a2.__first = r2;
    else {
      c3.getWritable().__next = r2;
    }
    if (a2.__size++, n2.__prev = r2, o2.__prev = u2, o2.__next = n2.__key, o2.__parent = n2.__parent, e2 && ur(i2)) {
      Br(i2, this.getParentOrThrow(), f3);
    }
    return t2;
  }
  isParentRequired() {
    return false;
  }
  createParentElementNode() {
    return es();
  }
  selectStart() {
    return this.selectPrevious();
  }
  selectEnd() {
    return this.selectNext(0, 0);
  }
  selectPrevious(t2, e2) {
    fi();
    const n2 = ea(this);
    if (null !== n2) return n2.selectPrevious(t2, e2);
    const o2 = this.getPreviousSibling(), r2 = this.getParentOrThrow();
    if (null === o2) return r2.select(0, 0);
    if (Pi(o2)) return o2.select();
    if (!Xo(o2)) {
      const t3 = o2.getIndexWithinParent() + 1;
      return r2.select(t3, t3);
    }
    return o2.select(t2, e2);
  }
  selectNext(t2, e2) {
    fi();
    const n2 = ea(this);
    if (null !== n2) return n2.selectNext(t2, e2);
    const o2 = this.getNextSibling(), r2 = this.getParentOrThrow();
    if (null === o2) return r2.select();
    if (Pi(o2)) return o2.select(0, 0);
    if (!Xo(o2)) {
      const t3 = o2.getIndexWithinParent();
      return r2.select(t3, t3);
    }
    return o2.select(t2, e2);
  }
  markDirty() {
    this.getWritable();
  }
  reconcileObservedMutation(t2, e2) {
    this.markDirty();
  }
};
function po(t2) {
  return t2 instanceof _o;
}
var yo = "historic";
var mo = "history-push";
var xo = "history-merge";
var Co = "paste";
var So = "cut";
var vo = "collaboration";
var To = "skip-collab";
var ko = "skip-scroll-into-view";
var bo = "skip-dom-selection";
var No = "skip-selection-focus";
var Eo = "composition-start";
var wo = "composition-end";
var Oo = "!important";
function Mo(t2) {
  const e2 = {};
  if (!t2) return e2;
  let n2 = "", o2 = "", r2 = null, i2 = false, s2 = false, l2 = false, c3 = 0;
  const a2 = t2.length;
  let u2 = -1;
  for (let f4 = 0; f4 < a2; f4++) {
    const a3 = t2[f4];
    if (i2) "*" === a3 && "/" === t2[f4 + 1] && (i2 = false, f4++);
    else if (s2) -1 === u2 && (u2 = f4), s2 = false;
    else if (null === r2) if ("/" !== a3 || "*" !== t2[f4 + 1]) if ('"' !== a3 && "'" !== a3) if ("(" !== a3) if (")" !== a3) if (l2 || ":" !== a3 || 0 !== c3) {
      if (";" === a3 && 0 === c3) {
        -1 !== u2 && (l2 ? o2 += t2.slice(u2, f4) : n2 += t2.slice(u2, f4), u2 = -1);
        const r3 = n2.trim(), i3 = o2.trim();
        "" !== r3 && "" !== i3 && (e2[r3] = i3), n2 = "", o2 = "", l2 = false;
        continue;
      }
      -1 === u2 && (u2 = f4);
    } else -1 !== u2 && (n2 += t2.slice(u2, f4), u2 = -1), l2 = true;
    else -1 === u2 && (u2 = f4), c3 = Math.max(0, c3 - 1);
    else -1 === u2 && (u2 = f4), c3++;
    else -1 === u2 && (u2 = f4), r2 = a3;
    else -1 !== u2 && (l2 ? o2 += t2.slice(u2, f4) : n2 += t2.slice(u2, f4), u2 = -1), i2 = true, f4++;
    else -1 === u2 && (u2 = f4), "\\" === a3 ? s2 = true : a3 === r2 && (r2 = null);
  }
  -1 !== u2 && (l2 ? o2 += t2.slice(u2, a2) : n2 += t2.slice(u2, a2));
  const f3 = n2.trim(), d2 = o2.trim();
  return "" !== f3 && "" !== d2 && (e2[f3] = d2), e2;
}
function Ao(t2, e2, n2) {
  const o2 = n2.trimEnd(), r2 = o2.length - 10;
  r2 >= 0 && o2.slice(r2).toLowerCase() === Oo ? t2.setProperty(e2, o2.slice(0, r2).trim(), "important") : t2.setProperty(e2, n2, "");
}
function Do(t2, e2) {
  for (const n2 in e2) {
    const o2 = e2[n2];
    null == o2 ? t2.removeProperty(n2) : Ao(t2, n2, o2);
  }
}
function Fo(t2, e2, n2 = "") {
  if (e2 === n2) return;
  const o2 = Mo(n2), r2 = Mo(e2);
  for (const e3 in r2) delete o2[e3], Ao(t2, e3, r2[e3]);
  for (const e3 in o2) t2.removeProperty(e3);
}
function Po(t2, e2) {
  return 16 & e2 ? "code" : e2 & T ? "mark" : 32 & e2 ? "sub" : 64 & e2 ? "sup" : null;
}
function Io(t2, e2) {
  return 1 & e2 ? "strong" : 2 & e2 ? "em" : "span";
}
function Lo(t2, e2, n2, o2, r2) {
  const i2 = o2.classList;
  let s2 = Cl(r2, "base");
  void 0 !== s2 && i2.add(...s2), s2 = Cl(r2, "underlineStrikethrough");
  let l2 = false;
  const c3 = 8 & e2 && 4 & e2;
  void 0 !== s2 && (8 & n2 && 4 & n2 ? (l2 = true, c3 || i2.add(...s2)) : c3 && i2.remove(...s2));
  for (const t3 in z) {
    const o3 = z[t3];
    if (s2 = Cl(r2, t3), void 0 !== s2) if (n2 & o3) {
      if (l2 && ("underline" === t3 || "strikethrough" === t3)) {
        e2 & o3 && i2.remove(...s2);
        continue;
      }
      (0 === (e2 & o3) || c3 && "underline" === t3 || "strikethrough" === t3) && i2.add(...s2);
    } else e2 & o3 && i2.remove(...s2);
  }
}
function Ko(t2, e2, n2) {
  const o2 = n2.isComposing(), r2 = t2 + (o2 ? A : ""), s2 = vc(), l2 = Tc(s2).$getDOMSlot(n2, e2, s2), c3 = l2.getFirstChild();
  if (null === c3 || c3.nodeType !== Node.TEXT_NODE) return void l2.insertChild(Zl().createTextNode(r2));
  const a2 = c3, u2 = a2.nodeValue;
  if (u2 !== r2) if (o2 || i) {
    const [t3, e3, n3] = (function(t4, e4) {
      const n4 = t4.length, o3 = e4.length;
      let r3 = 0, i2 = 0;
      for (; r3 < n4 && r3 < o3 && t4[r3] === e4[r3]; ) r3++;
      for (; i2 + r3 < n4 && i2 + r3 < o3 && t4[n4 - i2 - 1] === e4[o3 - i2 - 1]; ) i2++;
      return [r3, n4 - r3 - i2, e4.slice(r3, o3 - i2)];
    })(u2, r2);
    0 !== e3 && a2.deleteData(t3, e3), a2.insertData(t3, n3);
  } else a2.nodeValue = r2;
}
function zo(t2, e2, n2, o2, r2, i2) {
  Ko(r2, t2, e2);
  const s2 = i2.theme.text;
  void 0 !== s2 && Lo(0, 0, o2, t2, s2);
}
function Bo(t2, e2) {
  const n2 = Zl().createElement(e2);
  return n2.appendChild(t2), n2;
}
function Ro(t2) {
  return null != t2 && true === t2.__isInlineFormattable;
}
var Wo = class extends _o {
  __text;
  __format;
  __style;
  __mode;
  __detail;
  get __isInlineFormattable() {
    return true;
  }
  $config() {
    return this.config("text", { importDOM: { "#text": () => ({ conversion: Jo, priority: 0 }), b: () => ({ conversion: Uo, priority: 0 }), code: () => ({ conversion: Yo, priority: 0 }), em: () => ({ conversion: Yo, priority: 0 }), i: () => ({ conversion: Yo, priority: 0 }), mark: () => ({ conversion: Yo, priority: 0 }), s: () => ({ conversion: Yo, priority: 0 }), span: () => ({ conversion: $o, priority: 0 }), strong: () => ({ conversion: Yo, priority: 0 }), sub: () => ({ conversion: Yo, priority: 0 }), sup: () => ({ conversion: Yo, priority: 0 }), u: () => ({ conversion: Yo, priority: 0 }) } });
  }
  afterCloneFrom(t2) {
    super.afterCloneFrom(t2), this.__text = t2.__text, this.__format = t2.__format, this.__style = t2.__style, this.__mode = t2.__mode, this.__detail = t2.__detail;
  }
  constructor(t2 = "", e2) {
    super(e2), this.__text = t2, this.__format = 0, this.__style = "", this.__mode = 0, this.__detail = 0;
  }
  getFormat() {
    return this.getLatest().__format;
  }
  getDetail() {
    return this.getLatest().__detail;
  }
  getMode() {
    const t2 = this.getLatest();
    return U[t2.__mode];
  }
  getStyle() {
    return this.getLatest().__style;
  }
  isToken() {
    return 1 === this.getLatest().__mode;
  }
  isComposing() {
    return this.__key === qs();
  }
  isSegmented() {
    return 2 === this.getLatest().__mode;
  }
  isDirectionless() {
    return !!(1 & this.getLatest().__detail);
  }
  isUnmergeable() {
    return !!(2 & this.getLatest().__detail);
  }
  hasFormat(t2) {
    const e2 = z[t2];
    return 0 !== (this.getFormat() & e2);
  }
  isSimpleText() {
    return "text" === this.__type && 0 === this.__mode;
  }
  getTextContent() {
    return this.getLatest().__text;
  }
  getFormatFlags(t2, e2) {
    return Ws(this.getLatest().__format, t2, e2);
  }
  canHaveFormat() {
    return true;
  }
  isInline() {
    return true;
  }
  createDOM(t2, e2) {
    const n2 = this.__format, o2 = Po(0, n2), r2 = Io(0, n2), i2 = null === o2 ? r2 : o2, s2 = Zl().createElement(i2);
    let l2 = s2;
    this.hasFormat("code") && s2.setAttribute("spellcheck", "false"), null !== o2 && (l2 = Zl().createElement(r2), s2.appendChild(l2));
    zo(l2, this, 0, n2, this.__text, t2);
    const c3 = this.__style;
    return "" !== c3 && Fo(s2.style, c3), s2;
  }
  updateDOM(e2, n2, o2) {
    const r2 = this.__text, i2 = e2.__format, s2 = this.__format, l2 = Po(0, i2), c3 = Po(0, s2), a2 = Io(0, i2), u2 = Io(0, s2);
    if ((null === l2 ? a2 : l2) !== (null === c3 ? u2 : c3)) return true;
    if (l2 === c3 && a2 !== u2) {
      const e3 = n2.firstChild;
      null == e3 && t(48);
      const i3 = Zl().createElement(u2);
      return zo(i3, this, 0, s2, r2, o2), n2.replaceChild(i3, e3), false;
    }
    let f3 = n2;
    null !== c3 && null !== l2 && (f3 = n2.firstChild, null == f3 && t(49)), Ko(r2, f3, this);
    const d2 = o2.theme.text;
    void 0 !== d2 && i2 !== s2 && Lo(0, i2, s2, f3, d2);
    const h3 = e2.__style, g3 = this.__style;
    return h3 !== g3 && Fo(n2.style, g3, h3), false;
  }
  updateFromJSON(t2) {
    return super.updateFromJSON(t2).setTextContent(t2.text).setFormat(t2.format).setDetail(t2.detail).setMode(t2.mode).setStyle(t2.style);
  }
  exportDOM(e2) {
    let { element: n2 } = super.exportDOM(e2);
    return gc(n2) || t(132), n2.style.whiteSpace = "pre-wrap", this.hasFormat("lowercase") ? n2.style.textTransform = "lowercase" : this.hasFormat("uppercase") ? n2.style.textTransform = "uppercase" : this.hasFormat("capitalize") && (n2.style.textTransform = "capitalize"), this.hasFormat("bold") && (n2 = Bo(n2, "b")), this.hasFormat("italic") && (n2 = Bo(n2, "i")), this.hasFormat("strikethrough") && (n2 = Bo(n2, "s")), this.hasFormat("underline") && (n2 = Bo(n2, "u")), { element: n2 };
  }
  exportJSON() {
    return { detail: this.getDetail(), format: this.getFormat(), mode: this.getMode(), style: this.getStyle(), text: this.getTextContent(), ...super.exportJSON() };
  }
  selectionTransform(t2, e2) {
  }
  setFormat(t2) {
    const e2 = this.getWritable();
    return e2.__format = "string" == typeof t2 ? z[t2] : t2, e2;
  }
  setDetail(t2) {
    const e2 = this.getWritable();
    return e2.__detail = "string" == typeof t2 ? B[t2] : t2, e2;
  }
  setStyle(t2) {
    const e2 = this.getWritable();
    return e2.__style = t2, e2;
  }
  toggleFormat(t2) {
    const e2 = Ws(this.getFormat(), t2, null);
    return this.setFormat(e2);
  }
  toggleDirectionless() {
    const t2 = this.getWritable();
    return t2.__detail ^= 1, t2;
  }
  toggleUnmergeable() {
    const t2 = this.getWritable();
    return t2.__detail ^= 2, t2;
  }
  setMode(t2) {
    const e2 = $[t2];
    if (this.__mode === e2) return this;
    const n2 = this.getWritable();
    return n2.__mode = e2, n2;
  }
  setTextContent(t2) {
    if (this.__text === t2) return this;
    const e2 = this.getWritable();
    return e2.__text = t2, e2;
  }
  select(t2, e2) {
    fi();
    let n2 = t2, o2 = e2;
    const r2 = Kr(), i2 = this.getTextContent(), s2 = this.__key;
    if ("string" == typeof i2) {
      const t3 = i2.length;
      void 0 === n2 && (n2 = t3), void 0 === o2 && (o2 = t3);
    } else n2 = 0, o2 = 0;
    if (!ur(r2)) return Dr(s2, n2, s2, o2, "text", "text");
    {
      const t3 = qs();
      t3 !== r2.anchor.key && t3 !== r2.focus.key || Vs(s2), r2.setTextNodeRange(this, n2, this, o2);
    }
    return r2;
  }
  selectStart() {
    return this.select(0, 0);
  }
  selectEnd() {
    const t2 = this.getTextContentSize();
    return this.select(t2, t2);
  }
  spliceText(t2, e2, n2, o2) {
    const r2 = this.getWritable(), i2 = r2.__text, s2 = n2.length;
    let l2 = t2;
    l2 < 0 && (l2 = s2 + l2, l2 < 0 && (l2 = 0));
    const c3 = Kr();
    if (o2 && ur(c3)) {
      const e3 = t2 + s2;
      c3.setTextNodeRange(r2, e3, r2, e3);
    }
    const a2 = i2.slice(0, l2) + n2 + i2.slice(l2 + e2);
    return r2.__text = a2, r2;
  }
  canInsertTextBefore() {
    return true;
  }
  canInsertTextAfter() {
    return true;
  }
  splitText(...t2) {
    fi();
    const e2 = this.getLatest(), n2 = e2.getTextContent();
    if ("" === n2) return [];
    const o2 = e2.__key, r2 = qs(), i2 = n2.length;
    t2.sort((t3, e3) => t3 - e3), t2.push(i2);
    const s2 = [], l2 = t2.length;
    for (let e3 = 0, o3 = 0; e3 < i2 && o3 <= l2; o3++) {
      const r3 = t2[o3];
      r3 > e3 && (s2.push(n2.slice(e3, r3)), e3 = r3);
    }
    const c3 = s2.length;
    if (1 === c3) return [e2];
    const a2 = s2[0], u2 = e2.getParent();
    let f3;
    const d2 = e2.getFormat(), h3 = e2.getStyle(), g3 = e2.__detail;
    let _3 = false, p3 = null, y3 = null;
    const m3 = Kr();
    if (ur(m3)) {
      const [t3, e3] = m3.isBackward() ? [m3.focus, m3.anchor] : [m3.anchor, m3.focus];
      "text" === t3.type && t3.key === o2 && (p3 = t3), "text" === e3.type && e3.key === o2 && (y3 = e3);
    }
    e2.isSegmented() ? (f3 = Go(a2), f3.__format = d2, f3.__style = h3, f3.__detail = g3, f3.__state = At(e2, f3), _3 = true) : f3 = e2.setTextContent(a2);
    const x3 = [f3];
    for (let t3 = 1; t3 < c3; t3++) {
      const n3 = Go(s2[t3]);
      n3.__format = d2, n3.__style = h3, n3.__detail = g3, n3.__state = At(e2, n3);
      const i3 = n3.__key;
      r2 === o2 && Vs(i3), x3.push(n3);
    }
    const C2 = p3 ? p3.offset : null, S2 = y3 ? y3.offset : null;
    let v2 = 0;
    for (const t3 of x3) {
      if (!p3 && !y3) break;
      const e3 = v2 + t3.getTextContentSize();
      if (null !== p3 && null !== C2 && C2 <= e3 && C2 >= v2 && (p3.set(t3.getKey(), C2 - v2, "text"), C2 < e3 && (p3 = null)), null !== y3 && null !== S2 && S2 <= e3 && S2 >= v2) {
        y3.set(t3.getKey(), S2 - v2, "text");
        break;
      }
      v2 = e3;
    }
    if (null !== u2) {
      !(function(t4) {
        const e4 = t4.getPreviousSibling(), n3 = t4.getNextSibling();
        null !== e4 && Js(e4);
        null !== n3 && Js(n3);
      })(this);
      const t3 = u2.getWritable(), e3 = this.getIndexWithinParent();
      _3 ? (t3.splice(e3, 0, x3), this.remove()) : t3.splice(e3, 1, x3), ur(m3) && Br(m3, u2, e3, c3 - 1);
    }
    return x3;
  }
  mergeWithSibling(e2) {
    const n2 = e2 === this.getPreviousSibling();
    n2 || e2 === this.getNextSibling() || t(50);
    const o2 = this.__key, r2 = e2.__key, i2 = this.__text, s2 = i2.length;
    qs() === r2 && Vs(o2);
    const l2 = Kr();
    if (ur(l2)) {
      const t2 = l2.anchor, i3 = l2.focus;
      null !== t2 && t2.key === r2 && $r(t2, n2, o2, e2, s2), null !== i3 && i3.key === r2 && $r(i3, n2, o2, e2, s2);
    }
    const c3 = e2.__text, a2 = n2 ? c3 + i2 : i2 + c3;
    this.setTextContent(a2);
    const u2 = this.getWritable();
    return e2.remove(), u2;
  }
  isTextEntity() {
    return false;
  }
};
function $o(t2) {
  return { forChild: Qo(t2.style), node: null };
}
function Uo(t2) {
  const e2 = t2, n2 = "normal" === e2.style.fontWeight;
  return { forChild: Qo(e2.style, n2 ? void 0 : "bold"), node: null };
}
var Ho = /* @__PURE__ */ new WeakMap();
function jo(t2) {
  if (!gc(t2)) return false;
  if ("PRE" === t2.nodeName) return true;
  const e2 = t2.style.whiteSpace;
  return "string" == typeof e2 && e2.startsWith("pre");
}
function Jo(e2) {
  const n2 = e2;
  null === e2.parentElement && t(129);
  let o2 = n2.textContent || "";
  if (null !== (function(t2) {
    let e3, n3 = t2.parentNode;
    const o3 = [t2];
    for (; null !== n3 && void 0 === (e3 = Ho.get(n3)) && !jo(n3); ) o3.push(n3), n3 = n3.parentNode;
    const r2 = void 0 === e3 ? n3 : e3;
    for (let t3 = 0; t3 < o3.length; t3++) Ho.set(o3[t3], r2);
    return r2;
  })(n2)) return { node: qr(o2) };
  if (o2 = o2.replace(/\r/g, "").replace(/[ \t\n]+/g, " "), "" === o2) return { node: null };
  if (" " === o2[0]) {
    let t2 = n2, e3 = true;
    for (; null !== t2 && null !== (t2 = Vo(t2, false)); ) {
      const n3 = t2.textContent || "";
      if (n3.length > 0) {
        /[ \t\n]$/.test(n3) && (o2 = o2.slice(1)), e3 = false;
        break;
      }
    }
    e3 && (o2 = o2.slice(1));
  }
  if (" " === o2[o2.length - 1]) {
    let t2 = n2, e3 = true;
    for (; null !== t2 && null !== (t2 = Vo(t2, true)); ) {
      if ((t2.textContent || "").replace(/^( |\t|\r?\n)+/, "").length > 0) {
        e3 = false;
        break;
      }
    }
    e3 && (o2 = o2.slice(0, o2.length - 1));
  }
  return "" === o2 ? { node: null } : { node: Go(o2) };
}
function Vo(t2, e2) {
  let n2 = t2;
  for (; ; ) {
    let t3;
    for (; null === (t3 = e2 ? n2.nextSibling : n2.previousSibling); ) {
      const t4 = n2.parentElement;
      if (null === t4) return null;
      n2 = t4;
    }
    if (n2 = t3, gc(n2)) {
      const t4 = n2.style.display;
      if ("" === t4 && !mc(n2) || "" !== t4 && !t4.startsWith("inline")) return null;
    }
    let o2 = n2;
    for (; null !== (o2 = e2 ? n2.firstChild : n2.lastChild); ) n2 = o2;
    if (zs(n2)) return n2;
    if ("BR" === n2.nodeName) return null;
  }
}
var qo = { code: "code", em: "italic", i: "italic", mark: "highlight", s: "strikethrough", strong: "bold", sub: "subscript", sup: "superscript", u: "underline" };
function Yo(t2) {
  const e2 = qo[t2.nodeName.toLowerCase()];
  return void 0 === e2 ? { node: null } : { forChild: Qo(t2.style, e2), node: null };
}
function Go(t2 = "") {
  return Wl(new Wo(t2));
}
function Xo(t2) {
  return t2 instanceof Wo;
}
function Qo(t2, e2) {
  const n2 = t2.fontWeight, o2 = t2.textDecoration.split(" "), r2 = "700" === n2 || "bold" === n2, i2 = o2.includes("line-through"), s2 = "italic" === t2.fontStyle, l2 = o2.includes("underline"), c3 = t2.verticalAlign;
  return (t3) => Xo(t3) || Ro(t3) ? (r2 && !t3.hasFormat("bold") && t3.toggleFormat("bold"), i2 && !t3.hasFormat("strikethrough") && t3.toggleFormat("strikethrough"), s2 && !t3.hasFormat("italic") && t3.toggleFormat("italic"), l2 && !t3.hasFormat("underline") && t3.toggleFormat("underline"), "sub" !== c3 || t3.hasFormat("subscript") || t3.toggleFormat("subscript"), "super" !== c3 || t3.hasFormat("superscript") || t3.toggleFormat("superscript"), e2 && !t3.hasFormat(e2) && t3.toggleFormat(e2), t3) : t3;
}
var Zo = class extends Wo {
  $config() {
    return this.config("tab", { extends: Wo });
  }
  constructor(t2 = void 0) {
    super("	", t2), this.__detail = 2;
  }
  createDOM(t2) {
    const e2 = super.createDOM(t2), n2 = Cl(t2.theme, "tab");
    if (void 0 !== n2) {
      e2.classList.add(...n2);
    }
    return e2;
  }
  setTextContent(t2) {
    return super.setTextContent("	");
  }
  spliceText(e2, n2, o2, r2) {
    return "" === o2 && 0 === n2 || "	" === o2 && 1 === n2 || t(286), this;
  }
  setDetail(e2) {
    return 2 !== e2 && t(127), this;
  }
  setMode(e2) {
    return "normal" !== e2 && t(128), this;
  }
  canInsertTextBefore() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
};
function tr() {
  return Wl(new Zo());
}
function er(t2) {
  return t2 instanceof Zo;
}
var nr = class {
  key;
  offset;
  type;
  _selection;
  constructor(t2, e2, n2) {
    this._selection = null, this.key = t2, this.offset = e2, this.type = n2;
  }
  is(t2) {
    return this.key === t2.key && this.offset === t2.offset && this.type === t2.type;
  }
  isBefore(t2) {
    if (this.key === t2.key) return this.offset < t2.offset;
    return Ya(au(tu(this, "next")), au(tu(t2, "next"))) < 0;
  }
  getNode() {
    const e2 = Ys(this.key);
    return null === e2 && t(20), e2;
  }
  set(t2, e2, n2, o2) {
    const r2 = this._selection, i2 = this.key;
    o2 && this.key === t2 && this.offset === e2 && this.type === n2 || (this.key = t2, this.offset = e2, this.type = n2, ui() || (qs() === i2 && Vs(t2), null !== r2 && (r2.setCachedNodes(null), ur(r2) && (r2._cachedIsBackward = null), r2.dirty = true)));
  }
};
function or(t2, e2, n2) {
  return new nr(t2, e2, n2);
}
function rr(t2, e2) {
  let n2 = e2.__key, o2 = t2.offset, r2 = "element";
  if (Xo(e2)) {
    r2 = "text";
    const t3 = e2.getTextContentSize();
    o2 > t3 && (o2 = t3);
  } else if (!Pi(e2)) {
    const t3 = e2.getNextSibling();
    if (Xo(t3)) n2 = t3.__key, o2 = 0, r2 = "text";
    else {
      const t4 = e2.getParent();
      t4 && (n2 = t4.__key, o2 = e2.getIndexWithinParent() + 1);
    }
  }
  t2.set(n2, o2, r2);
}
function ir(t2, e2) {
  if (Pi(e2)) {
    const n2 = e2.getLastDescendant();
    Pi(n2) || Xo(n2) ? rr(t2, n2) : rr(t2, e2);
  } else rr(t2, e2);
}
function sr(t2, e2, n2, o2) {
  const r2 = t2.getNode(), i2 = r2.getChildAtIndex(t2.offset), s2 = Go();
  if (s2.setFormat(n2), s2.setStyle(o2), ns(i2)) i2.splice(0, 0, [s2]);
  else if (null !== i2) {
    const t3 = Bl(r2) ? es().append(s2) : s2;
    i2.insertBefore(t3);
  } else if (Bl(r2)) {
    const t3 = r2.getLastChild();
    Pi(t3) && !t3.isInline() && t3.isEmpty() ? t3.append(s2) : r2.append(es().append(s2));
  } else r2.append(s2);
  t2.is(e2) && e2.set(s2.__key, 0, "text"), t2.set(s2.__key, 0, "text");
}
function lr(e2, n2, o2, r2) {
  const i2 = e2.anchor.getNode();
  Xo(i2) || t(398);
  const s2 = e2.anchor.offset, l2 = Go(n2);
  l2.setFormat(o2), l2.setStyle(r2);
  const c3 = i2.getParentOrThrow();
  if (0 === s2) c3.isInline() && !i2.__prev ? c3.insertBefore(l2) : i2.insertBefore(l2, false);
  else if (s2 === i2.getTextContentSize()) c3.isInline() && !i2.__next ? c3.insertAfter(l2) : i2.insertAfter(l2, false);
  else {
    const [t2] = i2.splitText(s2);
    t2.insertAfter(l2, false);
  }
  "" === i2.getTextContent() && i2.isAttached() && i2.remove(), l2.selectEnd(), l2.isComposing() && "text" === e2.anchor.type && e2.anchor.set(e2.anchor.key, e2.anchor.offset - n2.length, e2.anchor.type);
}
var cr = class _cr {
  _nodes;
  _cachedNodes;
  dirty;
  constructor(t2) {
    this._cachedNodes = null, this._nodes = t2, this.dirty = false;
  }
  getCachedNodes() {
    return this._cachedNodes;
  }
  setCachedNodes(t2) {
    this._cachedNodes = t2;
  }
  is(t2) {
    if (!dr(t2)) return false;
    const e2 = this._nodes, n2 = t2._nodes;
    return e2.size === n2.size && Array.from(e2).every((t3) => n2.has(t3));
  }
  isCollapsed() {
    return false;
  }
  isBackward() {
    return false;
  }
  getStartEndPoints() {
    return null;
  }
  add(t2) {
    this.dirty = true, this._nodes.add(t2), this._cachedNodes = null;
  }
  delete(t2) {
    this.dirty = true, this._nodes.delete(t2), this._cachedNodes = null;
  }
  clear() {
    this.dirty = true, this._nodes.clear(), this._cachedNodes = null;
  }
  has(t2) {
    return this._nodes.has(t2);
  }
  clone() {
    return new _cr(new Set(this._nodes));
  }
  extract() {
    return this.getNodes();
  }
  insertRawText(t2) {
  }
  insertText() {
  }
  insertNodes(t2) {
    const e2 = this.getNodes().filter((t3) => null === ta(t3)), n2 = e2.length;
    if (0 === n2) return;
    const o2 = e2[n2 - 1];
    let r2;
    if (Xo(o2)) r2 = o2.select();
    else {
      const t3 = o2.getIndexWithinParent() + 1;
      r2 = o2.getParentOrThrow().select(t3, t3);
    }
    r2.insertNodes(t2);
    for (let t3 = 0; t3 < n2; t3++) e2[t3].remove();
  }
  getNodes() {
    const t2 = this._cachedNodes;
    if (null !== t2) return t2;
    const e2 = this._nodes, n2 = [];
    for (const t3 of e2) {
      const e3 = Ys(t3);
      null !== e3 && n2.push(e3);
    }
    return ui() || (this._cachedNodes = n2), n2;
  }
  getTextContent() {
    const t2 = this.getNodes();
    let e2 = "";
    for (let n2 = 0; n2 < t2.length; n2++) e2 += t2[n2].getTextContent();
    return e2;
  }
  deleteNodes() {
    const t2 = this.getNodes().filter((t3) => null === ta(t3));
    if ((Kr() || zr()) === this && t2[0]) {
      const e2 = Ia(t2[0], "next");
      nu(Va(e2, e2));
    }
    for (const e2 of t2) e2.remove();
    ar();
  }
};
function ar() {
  const t2 = nl();
  if (t2.isEmpty()) {
    const e2 = es();
    t2.append(e2), e2.select();
  }
}
function ur(t2) {
  return t2 instanceof fr;
}
var fr = class _fr {
  format;
  style;
  anchor;
  focus;
  _cachedNodes;
  _cachedIsBackward;
  dirty;
  constructor(t2, e2, n2, o2) {
    this.anchor = t2, this.focus = e2, t2._selection = this, e2._selection = this, this._cachedNodes = null, this._cachedIsBackward = null, this.format = n2, this.style = o2, this.dirty = false;
  }
  getCachedNodes() {
    return this._cachedNodes;
  }
  setCachedNodes(t2) {
    this._cachedNodes = t2;
  }
  is(t2) {
    return !!ur(t2) && (this.anchor.is(t2.anchor) && this.focus.is(t2.focus) && this.format === t2.format && this.style === t2.style);
  }
  isCollapsed() {
    return this.anchor.is(this.focus);
  }
  getNodes() {
    const t2 = this._cachedNodes;
    if (null !== t2) return t2;
    const e2 = (function(t3) {
      const e3 = [], [n2, o2] = t3.getTextSlices();
      n2 && e3.push(n2.caret.origin);
      const r2 = /* @__PURE__ */ new Set(), i2 = /* @__PURE__ */ new Set();
      for (const n3 of t3) if (Aa(n3)) {
        const { origin: t4 } = n3;
        0 === e3.length ? r2.add(t4) : (i2.add(t4), e3.push(t4));
      } else {
        const { origin: t4 } = n3;
        Pi(t4) && i2.has(t4) || e3.push(t4);
      }
      o2 && e3.push(o2.caret.origin);
      if (Ma(t3.focus) && Pi(t3.focus.origin) && null === t3.focus.getNodeAtCaret()) for (let n3 = Ba(t3.focus.origin, "previous"); Aa(n3) && r2.has(n3.origin) && !n3.origin.isEmpty() && n3.origin.is(e3[e3.length - 1]); n3 = Wa(n3)) r2.delete(n3.origin), e3.pop();
      for (; e3.length > 1; ) {
        const t4 = e3[e3.length - 1];
        if (!Pi(t4) || i2.has(t4) || t4.isEmpty() || r2.has(t4)) break;
        e3.pop();
      }
      if (0 === e3.length && t3.isCollapsed()) {
        const n3 = au(t3.anchor), o3 = au(t3.anchor.getFlipped()), r3 = (t4) => wa(t4) ? t4.origin : t4.getNodeAtCaret(), i3 = r3(n3) || r3(o3) || (t3.anchor.getNodeAtCaret() ? n3.origin : o3.origin);
        e3.push(i3);
      }
      return e3;
    })(du(ru(this), "next"));
    return ui() || (this._cachedNodes = e2), e2;
  }
  setTextNodeRange(t2, e2, n2, o2) {
    return this.anchor.set(t2.__key, e2, "text"), this.focus.set(n2.__key, o2, "text"), this;
  }
  getTextContent() {
    const t2 = this.getNodes();
    if (0 === t2.length) return "";
    const e2 = t2[0], n2 = t2[t2.length - 1], o2 = this.anchor, r2 = this.focus, i2 = o2.isBefore(r2), [s2, l2] = yr(this);
    let c3 = "", a2 = true;
    for (let u2 = 0; u2 < t2.length; u2++) {
      const f3 = t2[u2];
      if (Pi(f3) && !f3.isInline()) {
        a2 || (c3 += "\n");
        let t3 = "";
        for (const e3 of ia(f3)) {
          const n3 = sa(f3, e3);
          null !== n3 && (t3 += n3.getTextContent());
        }
        "" !== t3 ? (c3 += t3, a2 = false) : a2 = !f3.isEmpty();
      } else if (a2 = false, Xo(f3)) {
        let t3 = f3.getTextContent();
        f3 === e2 ? f3 === n2 ? "element" === o2.type && "element" === r2.type && r2.offset !== o2.offset || (t3 = s2 < l2 ? t3.slice(s2, l2) : t3.slice(l2, s2)) : t3 = i2 ? t3.slice(s2) : t3.slice(l2) : f3 === n2 && (t3 = i2 ? t3.slice(0, l2) : t3.slice(0, s2)), c3 += t3;
      } else !Ki(f3) && !Yi(f3) || f3 === n2 && this.isCollapsed() || (c3 += f3.getTextContent());
    }
    return c3;
  }
  applyDOMRange(t2) {
    const e2 = _i(), n2 = e2.getEditorState()._selection, o2 = Mr(t2.startContainer, t2.startOffset, t2.endContainer, t2.endOffset, e2, n2);
    if (null === o2) return;
    const [r2, i2, s2] = o2;
    this.anchor.set(r2.key, r2.offset, r2.type, true), this.focus.set(i2.key, i2.offset, i2.type, true), s2 && (this.dirty = true), It(this);
  }
  clone() {
    const t2 = this.anchor, e2 = this.focus;
    return new _fr(or(t2.key, t2.offset, t2.type), or(e2.key, e2.offset, e2.type), this.format, this.style);
  }
  toggleFormat(t2) {
    this.format = Ws(this.format, t2, null), this.dirty = true;
  }
  setFormat(t2) {
    this.format = t2, this.dirty = true;
  }
  setStyle(t2) {
    this.style = t2, this.dirty = true;
  }
  hasFormat(t2) {
    const e2 = z[t2];
    return 0 !== (this.format & e2);
  }
  insertRawText(t2) {
    this.insertNodes(qr(t2));
  }
  insertText(e2) {
    let n2 = this.format, o2 = this.style;
    if (!this.isCollapsed()) {
      const t2 = (this.focus.isBefore(this.anchor) ? this.focus : this.anchor).getNode();
      if (Xo(t2) && (n2 = t2.getFormat(), o2 = t2.getStyle()), this.removeText(), this.format = n2, this.style = o2, "" === e2) return;
      if (null === qs()) return "element" === this.anchor.type && sr(this.anchor, this.focus, n2, o2), void lr(this, e2, n2, o2);
    }
    "element" === this.anchor.type && sr(this.anchor, this.focus, n2, o2);
    const r2 = this.anchor.getNode();
    Xo(r2) || t(398);
    const i2 = this.anchor.offset, s2 = r2.getParentOrThrow(), l2 = r2.getTextContentSize();
    if (Ks(r2) || 0 === i2 && (!r2.canInsertTextBefore() || !s2.canInsertTextBefore() && !r2.__prev) || i2 === l2 && (!r2.canInsertTextAfter() || !s2.canInsertTextAfter() && !r2.__next)) {
      if (r2.isSegmented() && 0 !== i2 && i2 !== l2) {
        if (null !== qs()) r2.setMode("normal").setFormat(n2).setStyle(o2);
        else {
          const t3 = Go(r2.getTextContent());
          t3.setFormat(n2), t3.setStyle(o2), r2.replace(t3), t3.select(i2, i2);
        }
        return void ("" !== e2 && this.insertText(e2));
      }
      if ("" === e2) return;
      if (0 === i2) {
        const t3 = r2.getPreviousSibling();
        if (Xo(t3) && t3.canInsertTextAfter() && !Ks(t3)) t3.select();
        else {
          const t4 = Go();
          t4.setFormat(n2), t4.setStyle(o2), s2.canInsertTextBefore() ? r2.insertBefore(t4) : s2.insertBefore(t4), t4.select();
        }
        return void this.insertText(e2);
      }
      if (i2 === l2) {
        const t3 = r2.getNextSibling();
        if (Xo(t3) && t3.canInsertTextBefore() && !Ks(t3)) t3.select(0, 0);
        else {
          const t4 = Go();
          t4.setFormat(n2), t4.setStyle(o2), s2.canInsertTextAfter() ? r2.insertAfter(t4) : s2.insertAfter(t4), t4.select(0, 0);
        }
        return void this.insertText(e2);
      }
      const t2 = Go(e2);
      return t2.setFormat(n2), t2.setStyle(o2), r2.replace(t2), void t2.select();
    }
    if ("" === e2) return;
    const c3 = s2.isInline() && 0 === i2 && !r2.__prev, a2 = s2.isInline() && i2 === l2 && !r2.__next, u2 = r2.getFormat() !== n2 || r2.getStyle() !== o2;
    if (c3 || a2 || u2) {
      if ("" !== r2.getTextContent() || c3 || a2) return void lr(this, e2, n2, o2);
      r2.setFormat(n2), r2.setStyle(o2);
    }
    r2.spliceText(i2, 0, e2, true), r2.isComposing() && "text" === this.anchor.type && this.anchor.set(this.anchor.key, this.anchor.offset - e2.length, this.anchor.type);
  }
  removeText() {
    const t2 = Kr() === this;
    ou(this, cu(ru(this))), t2 && Kr() !== this && ol(this);
  }
  formatText(t2, e2 = null) {
    _r(this, t2, e2);
  }
  insertNodes(e2) {
    if (0 === e2.length) return;
    this.isCollapsed() || this.removeText();
    const n2 = this.anchor.getNode();
    if ("element" === this.anchor.type && Pi(n2) && null !== ta(n2)) {
      let o3 = n2.isShadowRoot() ? n2.getFirstChild() ?? n2.append(es()).getFirstChild() : n2.getFirstChild();
      if (n2.isShadowRoot() && null !== o3 && !Pi(o3)) {
        const t2 = es();
        o3.insertBefore(t2), o3 = t2;
      }
      if (null !== o3) {
        o3.selectStart();
        const n3 = Kr();
        return ur(n3) || t(369), n3.insertNodes(e2);
      }
    }
    if ("element" === this.anchor.type && Bl(n2)) {
      const t2 = ti(e2), o3 = t2.getLastDescendant();
      return n2.splice(this.anchor.offset, 0, t2.getChildren()), void (null !== o3 && o3.selectEnd());
    }
    let o2 = (this.isBackward() ? this.focus : this.anchor).getNode(), r2 = qc(o2, Sc);
    const i2 = e2[e2.length - 1];
    if (Pi(r2) && "__language" in r2) {
      if ("__language" in e2[0]) this.insertText(e2[0].getTextContent());
      else {
        const t2 = Xr(this);
        r2.splice(t2, 0, e2), i2.selectEnd();
      }
      return;
    }
    if (!e2.some((t2) => (Pi(t2) || Ki(t2)) && !t2.isInline())) {
      Pi(r2) || t(211, o2.constructor.name, o2.getType());
      const n3 = Xr(this);
      return r2.splice(n3, 0, e2), void i2.selectEnd();
    }
    if (Pi(r2) && null !== ta(r2)) {
      const t2 = Xr(this), n3 = Gr(e2);
      r2.splice(t2, 0, n3);
      const o3 = n3[n3.length - 1];
      return void (void 0 !== o3 ? o3.selectEnd() : r2.select(t2, t2));
    }
    if (null === r2) {
      const t2 = ti(e2), n3 = t2.getLastDescendant();
      let o3 = tu(this.anchor, "next");
      for (const e3 of t2.getChildren()) o3 = mu(e3, o3);
      return void (null !== n3 && n3.selectEnd());
    }
    if (Pi(r2) && !r2.isParentRequired() && !Bl(r2.getParentOrThrow())) {
      const t2 = Xr(this), n3 = Gr(e2);
      r2.splice(t2, 0, n3);
      const o3 = n3[n3.length - 1];
      return void (void 0 !== o3 ? o3.selectEnd() : r2.select(t2, t2));
    }
    const s2 = ti(e2), l2 = s2.getLastDescendant(), c3 = s2.getChildren(), a2 = !Pi(r2) || !r2.isEmpty() ? this.insertParagraph() : null;
    a2 && !r2.isAttached() && (o2 = this.anchor.getNode(), r2 = qc(o2, Sc));
    const u2 = c3[c3.length - 1];
    let f3 = c3[0];
    var d2;
    Pi(d2 = f3) && Sc(d2) && !d2.isEmpty() && Pi(r2) && (!r2.isEmpty() || r2.canMergeWhenEmpty()) && (Pi(r2) || t(211, o2.constructor.name, o2.getType()), r2.append(...f3.getChildren()), f3 = c3[1]), f3 && (null === r2 && t(212, o2.constructor.name, o2.getType()), (function(e3, n3) {
      const o3 = n3.getParentOrThrow().getLastChild();
      let r3 = n3;
      const i3 = [n3];
      for (; r3 !== o3; ) r3.getNextSibling() || t(140), r3 = r3.getNextSibling(), i3.push(r3);
      let s3 = e3;
      for (const t2 of i3) s3 = s3.insertAfter(t2);
    })(r2, f3));
    const h3 = qc(l2, Sc);
    a2 && Pi(h3) && (a2.canMergeWhenEmpty() || Sc(u2)) && (h3.append(...a2.getChildren()), a2.remove()), Pi(r2) && r2.isEmpty() && r2.remove(), l2.selectEnd();
    const g3 = Pi(r2) ? r2.getLastChild() : null;
    Yi(g3) && h3 !== r2 && g3.remove();
  }
  insertParagraph() {
    const e2 = this.anchor.getNode();
    if ("element" === this.anchor.type && Bl(e2)) {
      const t2 = es();
      return e2.splice(this.anchor.offset, 0, [t2]), t2.select(), t2;
    }
    const n2 = Xr(this), o2 = qc(this.anchor.getNode(), Sc);
    if (null !== o2 && null !== ta(o2)) return null;
    Pi(o2) || t(213);
    const r2 = o2.getChildAtIndex(n2), i2 = r2 ? [r2, ...r2.getNextSiblings()] : [], s2 = o2.insertNewAfter(this, false);
    return s2 ? (s2.append(...i2), s2.selectStart(), s2) : null;
  }
  insertLineBreak(t2) {
    const e2 = qi();
    if (this.insertNodes([e2]), t2) {
      const t3 = e2.getParentOrThrow(), n2 = e2.getIndexWithinParent();
      t3.select(n2, n2);
    }
  }
  extract() {
    const t2 = [...this.getNodes()], e2 = t2.length;
    let n2 = t2[0], o2 = t2[e2 - 1];
    const [r2, i2] = yr(this), s2 = this.isBackward(), [l2, c3] = s2 ? [this.focus, this.anchor] : [this.anchor, this.focus], [a2, u2] = s2 ? [i2, r2] : [r2, i2];
    if (0 === e2) return [];
    if (1 === e2) {
      if (Xo(n2) && !this.isCollapsed()) {
        const t3 = n2.splitText(a2, u2), e3 = 0 === a2 ? t3[0] : t3[1];
        return e3 ? (l2.set(e3.getKey(), 0, "text"), c3.set(e3.getKey(), e3.getTextContentSize(), "text"), [e3]) : [];
      }
      return [n2];
    }
    if (Xo(n2) && (a2 === n2.getTextContentSize() ? t2.shift() : 0 !== a2 && ([, n2] = n2.splitText(a2), t2[0] = n2, l2.set(n2.getKey(), 0, "text"))), Xo(o2)) {
      const e3 = o2.getTextContent().length;
      0 === u2 ? t2.pop() : u2 !== e3 && ([o2] = o2.splitText(u2), t2[t2.length - 1] = o2, c3.set(o2.getKey(), o2.getTextContentSize(), "text"));
    }
    return t2;
  }
  modify(t2, e2, n2) {
    if (ei(this, t2, e2, n2)) return;
    const o2 = "move" === t2, r2 = _i(), i2 = Jl(Il(r2));
    if (!i2) return;
    const s2 = r2._blockCursorElement, l2 = r2._rootElement, c3 = this.focus.getNode();
    null === l2 || null === s2 || !Pi(c3) || c3.isInline() || c3.canBeEmpty() || jl(s2, r2, l2);
    const a2 = El(r2, this.focus.key);
    let u2 = a2;
    if ("text" === this.focus.type && (u2 = Xo(c3) ? wc(c3, a2, r2) : null), this.dirty) {
      const t3 = El(r2, this.anchor.key);
      let e3 = t3;
      if ("text" === this.anchor.type) {
        const n3 = this.anchor.getNode();
        e3 = Xo(n3) ? wc(n3, t3, r2) : null;
      }
      e3 && u2 && Ur(i2, e3, this.anchor.offset, u2, this.focus.offset);
    }
    if ("character" === n2 && Xo(c3) && c3.isUnmergeable()) {
      if (e2 ? 0 === this.focus.offset : this.focus.offset === c3.getTextContentSize()) {
        const t3 = Ia(c3, e2 ? "previous" : "next").getNodeAtCaret();
        if (Xo(t3)) {
          if (!o2) {
            const n3 = t3.getTextContentSize();
            return e2 ? this.focus.set(t3.__key, n3 - 1, "text") : this.focus.set(t3.__key, 1, "text"), void (this.dirty = true);
          }
          {
            const n3 = r2.getElementByKey(t3.getKey()), o3 = n3 ? wc(t3, n3, r2) : null;
            if (o3) {
              const t4 = e2 ? o3.length : 0;
              Ur(i2, o3, t4, o3, t4);
            }
          }
        }
      }
    }
    if (Cr(i2, t2, e2 ? "backward" : "forward", n2), i2.rangeCount > 0) {
      const t3 = tc(i2, r2._rootElement), n3 = t3 || i2.getRangeAt(0), s3 = this.anchor.getNode(), l3 = Bi(s3) ? s3 : Kl(s3);
      if (this.applyDOMRange(n3), this.dirty = true, !o2) {
        Sr(this, e2, l3);
        (t3 ? "backward" !== i2.direction : i2.anchorNode === n3.startContainer && i2.anchorOffset === n3.startOffset) || xr(this);
      }
    }
    "lineboundary" === n2 && ei(this, t2, e2, n2, "decorators");
  }
  forwardDeletion(t2, e2, n2) {
    if (!n2 && ("element" === t2.type && Pi(e2) && t2.offset === e2.getChildrenSize() || "text" === t2.type && t2.offset === e2.getTextContentSize())) {
      const t3 = e2.getParent(), n3 = e2.getNextSibling() || (null === t3 ? null : t3.getNextSibling());
      if (Pi(n3) && n3.isShadowRoot()) return true;
    }
    return false;
  }
  deleteCharacter(t2) {
    const e2 = this.isCollapsed();
    if (this.isCollapsed()) {
      const e3 = this.anchor;
      let n2 = e3.getNode();
      if (this.forwardDeletion(e3, n2, t2)) return;
      const o2 = ja(tu(e3, t2 ? "previous" : "next"));
      if (o2.getTextSlices().every((t3) => null === t3 || 0 === t3.distance)) {
        let t3 = { type: "initial" };
        for (const e4 of o2.iterNodeCarets("shadowRoot")) if (Aa(e4)) if (e4.origin.isInline()) ;
        else {
          if (e4.origin.isShadowRoot()) {
            if ("merge-block" === t3.type) break;
            if (Pi(o2.anchor.origin) && o2.anchor.origin.isEmpty()) {
              const t4 = au(e4);
              ou(this, Va(t4, t4)), o2.anchor.origin.remove();
            }
            return;
          }
          "merge-next-block" !== t3.type && "merge-block" !== t3.type || (t3 = { block: t3.block, caret: e4, type: "merge-block" });
        }
        else {
          if ("merge-block" === t3.type) break;
          if (Ma(e4)) {
            if (Pi(e4.origin)) {
              if (e4.origin.isInline()) {
                if (!e4.origin.isParentOf(o2.anchor.origin)) break;
              } else t3 = { block: e4.origin, type: "merge-next-block" };
              continue;
            }
            if (Ki(e4.origin)) {
              if (e4.origin.isIsolated()) ;
              else if (ia(e4.origin).length > 0) {
                if (Pi(o2.anchor.origin) && o2.anchor.origin.isEmpty()) {
                  o2.anchor.origin.remove();
                  const t4 = Pr();
                  t4.add(e4.origin.getKey()), ol(t4);
                }
              } else if ("merge-next-block" === t3.type && (e4.origin.isKeyboardSelectable() || !e4.origin.isInline()) && Pi(o2.anchor.origin) && o2.anchor.origin.isEmpty()) {
                o2.anchor.origin.remove();
                const t4 = Pr();
                t4.add(e4.origin.getKey()), ol(t4);
              } else e4.origin.remove();
              return;
            }
            break;
          }
        }
        if ("merge-block" === t3.type) {
          const { caret: e4, block: n3 } = t3;
          if (ia(n3).length > 0) return;
          return e4.origin.isEmpty() && !n3.isEmpty() && e4.origin.getParent() === n3.getParent() ? void e4.origin.remove(true) : (ou(this, Va(!e4.origin.isEmpty() && n3.isEmpty() ? iu(Ia(n3, e4.direction)) : o2.anchor, e4)), this.removeText());
        }
        for (let t4 = e3.getNode(); null !== t4; ) {
          if (null !== ta(t4)) return;
          if (Pi(t4) && t4.isShadowRoot()) break;
          t4 = t4.getParent();
        }
      }
      const r2 = this.focus;
      if (vr(this, t2, "character"), this.isCollapsed()) {
        if (t2 && 0 === e3.offset && mr(this, e3.getNode())) return;
      } else {
        const o3 = "text" === r2.type ? r2.getNode() : null;
        if (n2 = "text" === e3.type ? e3.getNode() : null, null !== o3 && o3.isSegmented()) {
          const e4 = r2.offset, i2 = o3.getTextContentSize();
          if (o3.is(n2) || t2 && e4 !== i2 || !t2 && 0 !== e4) return void kr(o3, t2, e4);
        } else if (null !== n2 && n2.isSegmented()) {
          const r3 = e3.offset, i2 = n2.getTextContentSize();
          if (n2.is(o3) || t2 && 0 !== r3 || !t2 && r3 !== i2) return void kr(n2, t2, r3);
        }
        !(function(t3, e4) {
          const n3 = t3.anchor, o4 = t3.focus, r3 = n3.getNode(), i2 = o4.getNode();
          if (r3 === i2 && "text" === n3.type && "text" === o4.type) {
            const t4 = n3.offset, i3 = o4.offset, s2 = t4 < i3, l2 = s2 ? t4 : i3, c3 = s2 ? i3 : t4, a2 = c3 - 1;
            if (l2 !== a2) {
              (function(t5) {
                return !(sl(t5) || Tr(t5));
              })(r3.getTextContent().slice(l2, c3)) && (e4 ? o4.set(o4.key, a2, o4.type) : n3.set(n3.key, a2, n3.type));
            }
          }
        })(this, t2);
      }
    }
    if (this.removeText(), t2 && !e2 && this.isCollapsed() && "element" === this.anchor.type && 0 === this.anchor.offset) {
      const t3 = this.anchor.getNode();
      t3.isEmpty() && Bi(t3.getParent()) && null === t3.getPreviousSibling() && mr(this, t3), ar();
    }
  }
  deleteLine(t2) {
    const e2 = Er(this.anchor);
    if (null !== e2 && Ki(ea(e2))) return this.isCollapsed() || this.focus.set(this.anchor.key, this.anchor.offset, this.anchor.type), void this.deleteCharacter(t2);
    if (this.isCollapsed() && vr(this, t2, "lineboundary"), this.isCollapsed()) this.deleteCharacter(t2);
    else {
      qc(this.anchor.getNode(), Sc) !== qc(this.focus.getNode(), Sc) ? (this.focus.set(this.anchor.key, this.anchor.offset, this.anchor.type), this.deleteCharacter(t2)) : this.removeText();
    }
  }
  deleteWord(t2) {
    if (this.isCollapsed()) {
      const e2 = this.anchor, n2 = e2.getNode();
      if (this.forwardDeletion(e2, n2, t2)) return;
      vr(this, t2, "word");
    }
    this.isCollapsed() ? this.deleteCharacter(t2) : this.removeText();
  }
  isBackward() {
    const t2 = this._cachedIsBackward;
    if (null !== t2) return t2;
    const e2 = this.focus.isBefore(this.anchor);
    return ui() || (this._cachedIsBackward = e2), e2;
  }
  getStartEndPoints() {
    return [this.anchor, this.focus];
  }
};
function dr(t2) {
  return t2 instanceof cr;
}
function hr(t2, e2) {
  if (dr(t2)) {
    for (const n3 of t2.getNodes()) Ro(n3) && n3.setFormat(e2(n3.getFormat()));
    return;
  }
  if (t2.isCollapsed()) return t2.setFormat(e2(t2.format)), void Vs(null);
  const n2 = [];
  for (const o3 of t2.getNodes()) Xo(o3) ? n2.push(o3) : Pi(o3) ? o3.setTextFormat(e2(o3.getTextFormat())) : Ro(o3) && o3.setFormat(e2(o3.getFormat()));
  const o2 = n2.length;
  if (0 === o2) return t2.setFormat(e2(t2.format)), void Vs(null);
  const r2 = t2.anchor, i2 = t2.focus, s2 = t2.isBackward(), l2 = s2 ? i2 : r2, c3 = s2 ? r2 : i2;
  let a2 = 0, u2 = n2[0], f3 = "element" === l2.type ? 0 : l2.offset;
  if ("text" === l2.type && f3 === u2.getTextContentSize() && (a2 = 1, u2 = n2[1], f3 = 0), null == u2) return;
  const d2 = o2 - 1;
  let h3 = n2[d2];
  const g3 = "text" === c3.type ? c3.offset : h3.getTextContentSize();
  if (u2.is(h3)) {
    if (f3 === g3) return;
    const n3 = e2(u2.getFormat());
    if (Ks(u2) || 0 === f3 && g3 === u2.getTextContentSize()) u2.setFormat(n3);
    else {
      const t3 = u2.splitText(f3, g3), e3 = 0 === f3 ? t3[0] : t3[1];
      e3.setFormat(n3), "text" === l2.type && l2.set(e3.__key, 0, "text"), "text" === c3.type && c3.set(e3.__key, g3 - f3, "text");
    }
    return void (t2.format = n3);
  }
  0 === f3 || Ks(u2) || ([, u2] = u2.splitText(f3), f3 = 0);
  const _3 = e2(u2.getFormat());
  u2.setFormat(_3);
  const p3 = e2(h3.getFormat());
  g3 > 0 && (g3 === h3.getTextContentSize() || Ks(h3) || ([h3] = h3.splitText(g3)), h3.setFormat(p3));
  for (let t3 = a2 + 1; t3 < d2; t3++) {
    const o3 = n2[t3];
    o3.setFormat(e2(o3.getFormat()));
  }
  "text" === l2.type && l2.set(u2.__key, f3, "text"), "text" === c3.type && c3.set(h3.__key, g3, "text"), t2.format = _3 | p3;
}
function gr(t2, e2) {
  const n2 = [];
  for (const [t3, o2] of Object.entries(e2)) "boolean" == typeof o2 && n2.push([t3, o2]);
  0 !== n2.length && hr(t2, (t3) => {
    for (const [e3, o2] of n2) t3 = Ws(t3, e3, o2 ? z[e3] : 0);
    return t3;
  });
}
function _r(t2, e2, n2 = null) {
  const o2 = null === n2 && ur(t2) ? Ws(t2.format, e2, null) : n2;
  hr(t2, (t3) => Ws(t3, e2, o2));
}
function pr(t2) {
  const e2 = t2.offset;
  if ("text" === t2.type) return e2;
  const n2 = t2.getNode();
  return e2 === n2.getChildrenSize() ? n2.getTextContent().length : 0;
}
function yr(t2) {
  const e2 = t2.getStartEndPoints();
  if (null === e2) return [0, 0];
  const [n2, o2] = e2;
  return "element" === n2.type && "element" === o2.type && n2.key === o2.key && n2.offset === o2.offset ? [0, 0] : [pr(n2), pr(o2)];
}
function mr(t2, e2) {
  for (let n2 = e2; n2; n2 = n2.getParent()) {
    if (Pi(n2)) {
      if (n2.collapseAtStart(t2)) return true;
      if (Bl(n2)) break;
    }
    if (n2.getPreviousSibling()) break;
  }
  return false;
}
function xr(t2) {
  const e2 = t2.focus, n2 = t2.anchor, o2 = n2.key, r2 = n2.offset, i2 = n2.type;
  n2.set(e2.key, e2.offset, e2.type, true), e2.set(o2, r2, i2, true);
}
function Cr(t2, e2, n2, o2) {
  t2.modify(e2, n2, o2);
}
function Sr(t2, e2, n2) {
  const o2 = t2.getNodes(), r2 = o2.filter((t3) => Fl(t3, n2));
  if (0 === r2.length || r2.length === o2.length) return false;
  const i2 = e2 ? r2[0] : r2[r2.length - 1], s2 = Pi(i2) ? i2 : i2.getParentOrThrow();
  return e2 ? s2.selectStart() : s2.selectEnd(), true;
}
function vr(t2, e2, n2) {
  if (ei(t2, "extend", e2, n2)) return;
  const o2 = _i(), r2 = Jl(Il(o2));
  if (!r2 || "function" != typeof r2.modify) return;
  const i2 = o2._blockCursorElement, s2 = o2._rootElement, l2 = t2.anchor, c3 = t2.focus.getNode();
  null === s2 || null === i2 || !Pi(c3) || c3.isInline() || c3.canBeEmpty() || jl(i2, o2, s2);
  const a2 = (t3) => {
    const e3 = t3.getNode(), n3 = o2.getElementByKey(t3.key);
    return null !== n3 && "text" === t3.type && Xo(e3) ? wc(e3, n3, o2) : n3;
  }, u2 = l2.getNode(), f3 = a2(l2);
  if (null === f3) return;
  const d2 = l2.offset, h3 = t2.isCollapsed(), g3 = t2.focus, _3 = h3 ? f3 : a2(g3);
  if (null === _3) return;
  const p3 = g3.offset;
  if (Ur(r2, _3, p3, _3, p3), Cr(r2, "move", e2 ? "backward" : "forward", n2), 0 === r2.rangeCount) return;
  const y3 = tc(r2, s2) || r2.getRangeAt(0), m3 = y3.startContainer, x3 = y3.startOffset;
  if (h3 && "character" === n2 && "text" === l2.type && Xo(u2) && u2.isUnmergeable()) {
    if (d2 === (e2 ? 0 : u2.getTextContentSize())) {
      const n3 = Ia(u2, e2 ? "previous" : "next").getNodeAtCaret();
      if (Xo(n3)) {
        const o3 = e2 ? n3.getTextContentSize() - 1 : 1;
        return t2.focus.set(n3.__key, o3, "text"), void (t2.dirty = true);
      }
    }
  }
  if (h3 && "character" === n2 && "text" === l2.type) {
    const n3 = e2 ? 0 : u2.getTextContentSize(), o3 = m3 === f3 ? x3 : d2 !== n3 ? n3 : -1;
    if (o3 >= 0) return void (o3 !== d2 && (t2.focus.set(l2.key, o3, "text"), t2.dirty = true));
  }
  const [C2, S2, v2, T2] = e2 ? [m3, x3, f3, d2] : [f3, d2, m3, x3], k3 = Bi(u2) ? u2 : Kl(u2);
  t2.applyDOMRange({ collapsed: false, endContainer: v2, endOffset: T2, startContainer: C2, startOffset: S2 }), t2.dirty = true, !Sr(t2, e2, k3) && e2 && xr(t2), "lineboundary" === n2 && ei(t2, "extend", e2, n2, "decorators");
}
var Tr = (() => {
  try {
    const t2 = new RegExp("\\p{Emoji}", "u"), e2 = t2.test.bind(t2);
    if (e2("\u2764\uFE0F") && e2("#\uFE0F\u20E3") && e2("\u{1F44D}")) return e2;
  } catch (t2) {
  }
  return () => false;
})();
function kr(t2, e2, n2) {
  const o2 = t2, r2 = o2.getTextContent().split(/(?=\s)/g), i2 = r2.length;
  let s2 = 0, l2 = 0;
  for (let t3 = 0; t3 < i2; t3++) {
    const o3 = t3 === i2 - 1;
    if (l2 = s2, s2 += r2[t3].length, e2 && s2 === n2 || s2 > n2 || o3) {
      r2.splice(t3, 1), o3 && (l2 = void 0);
      break;
    }
  }
  const c3 = r2.join("").trim();
  "" === c3 ? o2.remove() : (o2.setTextContent(c3), o2.select(l2, l2));
}
function br(e2, n2, o2, r2) {
  let i2, s2 = n2, l2 = false;
  if (gc(e2)) {
    let c3 = false;
    const a2 = e2.childNodes, u2 = a2.length, f3 = r2._blockCursorElement;
    s2 === u2 && u2 > 0 && (c3 = true, s2 = u2 - 1), void 0 !== Qs(e2, r2) || Rc(e2, r2) || (l2 = true);
    let d2 = a2[s2], h3 = false;
    if (d2 === f3) d2 = a2[s2 + 1], h3 = true;
    else if (null !== f3) {
      const t2 = f3.parentNode;
      if (e2 === t2) {
        n2 > Array.prototype.indexOf.call(t2.children, f3) && s2--;
      }
    }
    if (i2 = il(d2), Xo(i2)) s2 = Ka(i2, c3 ? "next" : "previous");
    else {
      let a3 = il(e2);
      if (null === a3) return null;
      if (Pi(a3)) {
        const l3 = r2.getElementByKey(a3.getKey());
        null === l3 && t(214);
        const u3 = kc(a3, l3, r2);
        [a3, s2] = u3.resolveChildIndex(a3, l3, e2, n2), Pi(a3) || t(215), c3 && s2 >= a3.getChildrenSize() && (s2 = Math.max(0, a3.getChildrenSize() - 1));
        let f4 = a3.getChildAtIndex(s2);
        if (Pi(f4) && (function(t2, e3, n3) {
          const o3 = t2.getParent();
          return null === n3 || null === o3 || !o3.canBeEmpty() || o3 !== n3.getNode();
        })(f4, 0, o2)) {
          const t2 = c3 ? f4.getLastDescendant() : f4.getFirstDescendant();
          null === t2 ? a3 = f4 : (f4 = t2, a3 = Pi(f4) ? f4 : f4.getParentOrThrow()), s2 = 0;
        }
        Xo(f4) ? (i2 = f4, a3 = null, s2 = Ka(f4, c3 ? "next" : "previous")) : f4 !== a3 && c3 && !h3 && (Pi(a3) || t(216), s2 = Math.min(a3.getChildrenSize(), s2 + 1));
      } else {
        const t2 = ea(a3), o3 = null !== t2 ? t2 : a3, i3 = o3.getIndexWithinParent(), l3 = r2.getElementByKey(a3.getKey());
        let c4 = "after";
        if (null !== l3 && il(e2) === a3) {
          const t3 = kc(a3, l3, r2);
          t3.element !== l3 ? c4 = t3.resolveLeafPosition(l3, e2, n2) : 0 === n2 && Ki(a3) && (c4 = "before");
        }
        s2 = "before" === c4 ? i3 : i3 + 1, a3 = o3.getParentOrThrow();
      }
      if (Pi(a3)) return [or(a3.__key, s2, "element"), l2];
    }
  } else i2 = il(e2);
  return Xo(i2) ? [or(i2.__key, Ka(i2, s2, "clamp"), "text"), l2] : null;
}
function Nr(t2, e2, n2) {
  const o2 = t2.offset, r2 = t2.getNode();
  if (0 === o2) {
    const o3 = r2.getPreviousSibling(), i2 = r2.getParent();
    if (e2) {
      if ((n2 || !e2) && null === o3 && Pi(i2) && i2.isInline()) {
        const e3 = i2.getPreviousSibling();
        Xo(e3) && t2.set(e3.__key, e3.getTextContent().length, "text");
      }
    } else Pi(o3) && !n2 && o3.isInline() ? t2.set(o3.__key, o3.getChildrenSize(), "element") : Xo(o3) && !r2.isUnmergeable() && t2.set(o3.__key, o3.getTextContent().length, "text");
  } else if (o2 === r2.getTextContent().length) {
    const o3 = r2.getNextSibling(), i2 = r2.getParent();
    if (e2 && Pi(o3) && o3.isInline()) t2.set(o3.__key, 0, "element");
    else if ((n2 || e2) && null === o3 && Pi(i2) && i2.isInline() && !i2.canInsertTextAfter() && i2.getTextContentSize() > 1) {
      const e3 = i2.getNextSibling();
      Xo(e3) && t2.set(e3.__key, 0, "text");
    }
  }
}
function Er(t2) {
  const e2 = Ys(t2.key);
  return null === e2 ? null : oa(e2);
}
function wr(t2, e2, n2) {
  const o2 = Er(t2), r2 = Er(e2);
  if (o2 === r2 || null !== o2 && null !== r2 && o2.is(r2)) return false;
  const i2 = n2(o2, r2);
  if (null !== o2) return Pi(o2) ? e2.set(o2.getKey(), i2 ? o2.getChildrenSize() : 0, "element") : e2.set(o2.getKey(), i2 ? o2.getTextContentSize() : 0, "text"), true;
  const s2 = ea(r2);
  if (null === s2) return false;
  const l2 = s2.getParent();
  if (null === l2) return false;
  const c3 = s2.getIndexWithinParent();
  return e2.set(l2.getKey(), i2 ? c3 + 1 : c3, "element"), true;
}
function Or(t2) {
  const e2 = wr(t2.anchor, t2.focus, (e3, n2) => (function(t3, e4, n3, o2) {
    if (null !== n3 && null !== o2) {
      const t4 = ea(n3), e5 = ea(o2);
      if (null !== t4 && t4.is(e5)) {
        for (const e6 of ra(t4).values()) {
          if (e6 === n3.getKey()) return true;
          if (e6 === o2.getKey()) return false;
        }
        return true;
      }
      return null === t4 || null === e5 || t4.isBefore(e5);
    }
    if (null !== n3) {
      const t4 = ea(n3), o3 = Ys(e4.key);
      return null === t4 || null === o3 || !(!t4.is(o3) && !t4.isParentOf(o3)) || t4.isBefore(o3);
    }
    const r2 = ea(o2), i2 = Ys(t3.key);
    return null !== r2 && null !== i2 && !r2.is(i2) && !r2.isParentOf(i2) && i2.isBefore(r2);
  })(t2.anchor, t2.focus, e3, n2));
  return e2 && (t2.dirty = true), e2;
}
function Mr(t2, e2, n2, o2, r2, i2) {
  if (null === t2 || null === n2 || !As(r2, t2, n2)) return null;
  const s2 = br(t2, e2, ur(i2) ? i2.anchor : null, r2);
  if (null === s2) return null;
  const l2 = br(n2, o2, ur(i2) ? i2.focus : null, r2);
  if (null === l2) return null;
  const [c3, a2] = s2, [u2, f3] = l2;
  if ("element" === c3.type && "element" === u2.type) {
    const e3 = il(t2), o3 = il(n2);
    if (Ki(e3) && Ki(o3)) return null;
  }
  const d2 = r2._slotsUsed && wr(c3, u2, () => 0 !== (t2.compareDocumentPosition(n2) & Node.DOCUMENT_POSITION_FOLLOWING));
  return (function(t3, e3) {
    if ("text" === t3.type && "text" === e3.type) {
      const n3 = t3.isBefore(e3), o3 = t3.is(e3);
      Nr(t3, n3, o3), Nr(e3, !n3, o3), o3 && e3.set(t3.key, t3.offset, t3.type);
    }
  })(c3, u2), [c3, u2, a2 || f3 || d2];
}
function Ar(t2) {
  return Pi(t2) && !t2.isInline();
}
function Dr(t2, e2, n2, o2, r2, i2) {
  const s2 = hi(), l2 = new fr(or(t2, e2, r2), or(n2, o2, i2), 0, "");
  return l2.dirty = true, s2._selection = l2, l2;
}
function Fr() {
  const t2 = or("root", 0, "element"), e2 = or("root", 0, "element");
  return new fr(t2, e2, 0, "");
}
function Pr() {
  return new cr(/* @__PURE__ */ new Set());
}
function Ir(t2, e2) {
  return Lr(null, t2, e2, null);
}
function Lr(t2, e2, n2, o2) {
  const r2 = n2._window;
  if (null === r2) return null;
  const i2 = o2 || r2.event, s2 = i2 ? i2.type : void 0, l2 = "selectionchange" === s2, c3 = !it && (l2 || "beforeinput" === s2 || "compositionstart" === s2 || "compositionend" === s2 || "click" === s2 && i2 && 3 === i2.detail || "drop" === s2 || void 0 === s2);
  let a2, u2, f3, d2;
  if (ur(t2) && !c3) return t2.clone();
  {
    if (null === e2) return null;
    const o3 = nc(e2, n2._rootElement);
    if (a2 = o3.anchorNode, u2 = o3.focusNode, f3 = o3.anchorOffset, d2 = o3.focusOffset, (l2 || void 0 === s2) && ur(t2) && !As(n2, a2, u2)) return t2.clone();
  }
  const h3 = Mr(a2, f3, u2, d2, n2, t2);
  if (null === h3) return null;
  const [g3, _3, p3] = h3;
  let y3 = 0, m3 = "";
  if (ur(t2)) {
    const e3 = t2.anchor;
    if (g3.key === e3.key) y3 = t2.format, m3 = t2.style;
    else {
      const t3 = g3.getNode();
      Xo(t3) ? (y3 = t3.getFormat(), m3 = t3.getStyle()) : Pi(t3) && (y3 = t3.getTextFormat(), m3 = t3.getTextStyle());
    }
  }
  const x3 = new fr(g3, _3, y3, m3);
  return p3 && (x3.dirty = true), x3;
}
function Kr() {
  return hi()._selection;
}
function zr() {
  return _i()._editorState._selection;
}
function Br(t2, e2, n2, o2 = 1) {
  const r2 = t2.anchor, i2 = t2.focus, s2 = r2.getNode(), l2 = i2.getNode();
  if (!e2.is(s2) && !e2.is(l2)) return;
  const c3 = e2.__key;
  if (t2.isCollapsed()) {
    const e3 = r2.offset;
    if (n2 <= e3 && o2 > 0 || n2 < e3 && o2 < 0) {
      const n3 = Math.max(0, e3 + o2);
      r2.set(c3, n3, "element"), i2.set(c3, n3, "element"), Rr(t2);
    }
  } else {
    const s3 = t2.isBackward(), l3 = s3 ? i2 : r2, a2 = l3.getNode(), u2 = s3 ? r2 : i2, f3 = u2.getNode();
    if (e2.is(a2)) {
      const t3 = l3.offset;
      (n2 <= t3 && o2 > 0 || n2 < t3 && o2 < 0) && l3.set(c3, Math.max(0, t3 + o2), "element");
    }
    if (e2.is(f3)) {
      const t3 = u2.offset;
      (n2 <= t3 && o2 > 0 || n2 < t3 && o2 < 0) && u2.set(c3, Math.max(0, t3 + o2), "element");
    }
  }
  Rr(t2);
}
function Rr(t2) {
  const e2 = t2.anchor, n2 = e2.offset, o2 = t2.focus, r2 = o2.offset, i2 = e2.getNode(), s2 = o2.getNode();
  if (t2.isCollapsed()) {
    if (!Pi(i2)) return;
    const t3 = i2.getChildrenSize(), r3 = n2 >= t3, s3 = r3 ? i2.getChildAtIndex(t3 - 1) : i2.getChildAtIndex(n2);
    if (Xo(s3)) {
      let t4 = 0;
      r3 && (t4 = s3.getTextContentSize()), e2.set(s3.__key, t4, "text"), o2.set(s3.__key, t4, "text");
    }
    return;
  }
  if (Pi(i2)) {
    const t3 = i2.getChildrenSize(), o3 = n2 >= t3, r3 = o3 ? i2.getChildAtIndex(t3 - 1) : i2.getChildAtIndex(n2);
    if (Xo(r3)) {
      let t4 = 0;
      o3 && (t4 = r3.getTextContentSize()), e2.set(r3.__key, t4, "text");
    }
  }
  if (Pi(s2)) {
    const t3 = s2.getChildrenSize(), e3 = r2 >= t3, n3 = e3 ? s2.getChildAtIndex(t3 - 1) : s2.getChildAtIndex(r2);
    if (Xo(n3)) {
      let t4 = 0;
      e3 && (t4 = n3.getTextContentSize()), o2.set(n3.__key, t4, "text");
    }
  }
}
function Wr(t2, e2, n2, o2, r2) {
  let i2 = null, s2 = 0, l2 = null;
  null !== o2 ? (i2 = o2.__key, Xo(o2) ? (s2 = o2.getTextContentSize(), l2 = "text") : Pi(o2) && (s2 = o2.getChildrenSize(), l2 = "element")) : null !== r2 && (i2 = r2.__key, Xo(r2) ? l2 = "text" : Pi(r2) && (l2 = "element")), null !== i2 && null !== l2 ? t2.set(i2, s2, l2) : (s2 = e2.getIndexWithinParent(), -1 === s2 && (s2 = n2.getChildrenSize()), t2.set(n2.__key, s2, "element"));
}
function $r(t2, e2, n2, o2, r2) {
  "text" === t2.type ? t2.set(n2, t2.offset + (e2 ? 0 : r2), "text") : t2.offset > o2.getIndexWithinParent() && t2.set(t2.key, t2.offset - 1, "element");
}
function Ur(t2, e2, n2, o2, r2) {
  try {
    t2.setBaseAndExtent(e2, n2, o2, r2);
  } catch (t3) {
  }
}
function Hr(t2, e2, n2) {
  const o2 = El(t2, e2.getKey());
  if (Pi(e2)) {
    const r2 = kc(e2, o2, t2);
    return [r2.element, n2 + r2.getFirstChildOffset()];
  }
  return [o2, n2];
}
function jr(t2, e2, n2, o2, r2, s2) {
  const l2 = s2.getRootNode(), c3 = Bs(l2) || ql(l2) ? cc(l2) : null;
  if (r2.has(vo) && c3 !== s2 || null !== c3 && Os(c3, c3)) return;
  const a2 = nc(o2, s2);
  let u2;
  if (!ur(e2)) return void (null !== t2 && As(n2, a2.anchorNode, a2.focusNode) && o2.removeAllRanges());
  const f3 = e2.anchor, d2 = e2.focus, h3 = f3.getNode(), g3 = d2.getNode(), [_3, p3] = Hr(n2, h3, f3.offset), [y3, m3] = Hr(n2, g3, d2.offset), x3 = e2.format, C2 = e2.style, S2 = e2.isCollapsed();
  let v2 = _3, T2 = y3, k3 = false;
  if ("text" === f3.type ? (v2 = Xo(h3) ? wc(h3, _3, n2) : null, k3 = h3.getFormat() !== x3 || h3.getStyle() !== C2) : ur(t2) && "text" === t2.anchor.type && (k3 = true), "text" === d2.type && (T2 = Xo(g3) ? wc(g3, y3, n2) : null), null !== v2 && null !== T2) {
    if (S2 && (null === t2 || k3 || ur(t2) && (t2.format !== x3 || t2.style !== C2)) && (function(t3, e3, n3, o3, r3, i2) {
      t3._inputState.collapsedSelectionFormat = { format: e3, key: r3, offset: o3, style: n3, timeStamp: i2 };
    })(n2, x3, C2, p3, f3.key, performance.now()), ("Range" !== o2.type || !S2) && a2.anchorOffset === p3 && a2.focusOffset === m3 && a2.anchorNode === v2 && a2.focusNode === T2) {
      if (null === c3 || !s2.contains(c3)) {
        const t3 = null !== c3 ? Fs(c3) : null;
        null !== t3 && t3 !== n2 || r2.has(No) || s2.focus({ preventScroll: true });
      }
      if ("element" !== f3.type) return;
    }
    if (Ur(o2, v2, p3, T2, m3), i && e2.isCollapsed() && null !== s2 && !r2.has(No)) {
      const t3 = lc(s2);
      if (null === t3 || !s2.contains(t3)) {
        const t4 = cc(s2.ownerDocument), e3 = null !== t4 ? Fs(t4) : null;
        null !== e3 && e3 !== n2 || s2.focus({ preventScroll: true });
      }
    }
    if (!r2.has(ko) && e2.isCollapsed() && null !== s2 && s2 === lc(s2)) {
      const t3 = ur(e2) && "element" === e2.anchor.type ? v2.childNodes[p3] || null : (void 0 === u2 && (u2 = ec(o2, s2)), u2);
      if (null !== t3) {
        let e3;
        if (zs(t3)) {
          const n3 = t3.ownerDocument.createRange();
          n3.selectNode(t3), e3 = n3.getBoundingClientRect();
        } else e3 = t3.getBoundingClientRect();
        !(function(t4, e4, n3) {
          const o3 = Ol(n3), r3 = Pl(o3);
          if (null === o3 || null === r3) return;
          const i2 = n3.getBoundingClientRect();
          if (e4.bottom < i2.top) return;
          let { top: s3, bottom: l3 } = e4, c4 = 0, a3 = 0, u3 = n3;
          for (; null !== u3; ) {
            const e5 = u3 === o3.body;
            if (e5) {
              const e6 = r3.visualViewport;
              if (e6) {
                const t5 = e6.offsetTop;
                c4 = t5, a3 = t5 + e6.height;
              } else c4 = 0, a3 = Il(t4).innerHeight;
              const n4 = r3.getComputedStyle(o3.documentElement), i3 = parseFloat(n4.scrollPaddingTop), s4 = parseFloat(n4.scrollPaddingBottom);
              isFinite(i3) && (c4 += i3), isFinite(s4) && (a3 -= s4);
            } else {
              const t5 = u3 === n3 ? i2 : u3.getBoundingClientRect();
              c4 = t5.top, a3 = t5.bottom;
            }
            let f4 = 0;
            if (s3 < c4 ? f4 = -(c4 - s3) : l3 > a3 && (f4 = l3 - a3), 0 !== f4) if (e5) r3.scrollBy(0, f4);
            else {
              const t5 = u3.scrollTop;
              u3.scrollTop += f4;
              const e6 = u3.scrollTop - t5;
              s3 -= e6, l3 -= e6;
            }
            if (e5) break;
            u3 = wl(u3);
          }
        })(n2, e3, s2);
      }
    }
    !(function(t3) {
      t3._inputState.isSelectionChangeFromDOMUpdate = true;
    })(n2);
  }
}
function Jr(t2) {
  let e2 = Kr() || zr();
  null === e2 && (e2 = nl().selectEnd()), e2.insertNodes(t2);
}
function Vr(t2, e2) {
  for (const n2 of t2.split(/(\r?\n|\t)/)) "\n" === n2 || "\r\n" === n2 ? e2.linebreak() : "	" === n2 ? e2.tab() : "" !== n2 && e2.text(n2);
}
function qr(t2) {
  const e2 = [];
  return Vr(t2, { linebreak: () => e2.push(qi()), tab: () => e2.push(tr()), text: (t3) => e2.push(Go(t3)) }), e2;
}
function Yr() {
  const t2 = Kr();
  return null === t2 ? "" : t2.getTextContent();
}
function Gr(t2) {
  const e2 = [];
  for (const n2 of t2) Yi(n2) || (!Pi(n2) && !Ki(n2) || n2.isInline() ? e2.push(n2) : Pi(n2) && e2.push(...Gr(n2.getChildren())));
  return e2;
}
function Xr(e2) {
  let n2 = e2;
  e2.isCollapsed() || n2.removeText();
  const o2 = Kr();
  ur(o2) && (n2 = o2), ur(n2) || t(161);
  const r2 = n2.anchor;
  let i2 = r2.getNode(), s2 = r2.offset;
  for (; !Sc(i2) && null === ta(i2); ) {
    const t2 = i2;
    if ([i2, s2] = Qr(i2, s2), t2.is(i2)) break;
  }
  return s2;
}
function Qr(t2, e2) {
  const n2 = t2.getParent();
  if (!n2) {
    const t3 = es();
    return nl().append(t3), t3.select(), [nl(), 0];
  }
  if (Xo(t2)) {
    const o3 = t2.splitText(e2);
    if (0 === o3.length) return [n2, t2.getIndexWithinParent()];
    const r2 = 0 === e2 ? 0 : 1;
    return [n2, o3[0].getIndexWithinParent() + r2];
  }
  if (!Pi(t2) || 0 === e2) return [n2, t2.getIndexWithinParent()];
  const o2 = t2.getChildAtIndex(e2);
  if (o2) {
    const n3 = new fr(or(t2.__key, e2, "element"), or(t2.__key, e2, "element"), 0, ""), r2 = t2.insertNewAfter(n3);
    r2 && r2.append(o2, ...o2.getNextSiblings());
  }
  return [n2, t2.getIndexWithinParent() + 1];
}
function Zr(t2) {
  return Yi(t2) || Ll(t2) || Xo(t2) || t2.isParentRequired();
}
function ti(t2) {
  const e2 = es();
  let n2 = null;
  for (let o2 = 0; o2 < t2.length; o2++) {
    const r2 = t2[o2];
    if (Zr(r2)) {
      if (null === n2) {
        n2 = r2.createParentElementNode(), e2.append(n2);
        const i2 = t2[o2 + 1];
        if (Yi(r2) && (void 0 === i2 || !Zr(i2))) continue;
      }
      n2.append(r2);
    } else e2.append(r2), n2 = null;
  }
  return e2;
}
function ei(t2, e2, n2, o2, r2 = "decorators-and-blocks") {
  if ("move" === e2 && "character" === o2 && !t2.isCollapsed()) {
    const [e3, o3] = n2 === t2.isBackward() ? [t2.focus, t2.anchor] : [t2.anchor, t2.focus];
    return o3.set(e3.key, e3.offset, e3.type), true;
  }
  const i2 = tu(t2.focus, n2 ? "previous" : "next"), s2 = "lineboundary" === o2, l2 = "move" === e2;
  let c3 = i2, a2 = "decorators-and-blocks" === r2;
  if (!uu(c3)) {
    for (const t3 of c3) {
      a2 = false;
      const { origin: e3 } = t3;
      if (!Ki(e3) || e3.isIsolated() || (c3 = t3, !s2 || !e3.isInline())) break;
    }
    if (a2) for (const t3 of ja(i2).iterNodeCarets("extend" === e2 ? "shadowRoot" : "root")) {
      if (Aa(t3)) t3.origin.isInline() || (c3 = t3);
      else {
        if (Pi(t3.origin)) continue;
        Ki(t3.origin) && !t3.origin.isInline() && (c3 = t3);
      }
      break;
    }
  }
  if (c3 === i2) return false;
  if (l2 && !s2 && Ki(c3.origin) && c3.origin.isKeyboardSelectable()) {
    const t3 = Pr();
    return t3.add(c3.origin.getKey()), ol(t3), true;
  }
  return c3 = au(c3), l2 && eu(t2.anchor, c3), eu(t2.focus, c3), a2 || !s2;
}
var ni = null;
var oi = null;
var ri = false;
var ii = false;
var si = false;
var li = /* @__PURE__ */ new Set();
var ci = 0;
var ai = { characterData: true, childList: true, subtree: true };
function ui() {
  return ri || null !== ni && ni._readOnly;
}
function fi() {
  ri && t(13);
}
function di() {
  ci > 99 && t(14);
}
function hi() {
  return null === ni && t(195, yi()), ni;
}
function gi(t2) {
  null !== hi() && null === oi && (oi = t2), oi !== t2 && e(378);
}
function _i() {
  return null === oi && t(337, yi()), oi;
}
function pi() {
  _i()._dirtyType = 2;
}
function yi() {
  let t2 = 0;
  const e2 = /* @__PURE__ */ new Set(), n2 = Cs.version;
  if ("undefined" != typeof window) for (const o3 of Xl(document)) {
    const r2 = Ps(o3);
    if (Ds(r2)) t2++;
    else if (r2) {
      let t3 = String(r2.constructor.version || "<0.17.1");
      t3 === n2 && (t3 += " (separately built, likely a bundler configuration issue)"), e2.add(t3);
    }
  }
  let o2 = ` Detected on the page: ${t2} compatible editor(s) with version ${n2}`;
  return e2.size && (o2 += ` and incompatible editors with versions ${Array.from(e2).join(", ")}`), o2;
}
function mi() {
  return oi;
}
function xi(t2, e2, n2) {
  const o2 = e2.__type, r2 = Ns(t2, o2);
  let i2 = n2.get(o2);
  void 0 === i2 && (i2 = Array.from(r2.transforms), n2.set(o2, i2));
  const s2 = i2.length;
  for (let t3 = 0; t3 < s2 && (i2[t3](e2), e2.isAttached()); t3++) ;
}
function Ci(t2, e2) {
  return void 0 !== t2 && t2.__key !== e2 && t2.isAttached();
}
function Si(t2, e2) {
  if (!e2) return;
  const n2 = t2._updateTags;
  let o2 = e2;
  Array.isArray(e2) || (o2 = [e2]);
  for (const t3 of o2) n2.add(t3);
}
function vi(t2) {
  return Ti(t2, _i()._nodes);
}
function Ti(e2, n2) {
  const o2 = e2.type, r2 = n2.get(o2);
  void 0 === r2 && t(17, o2);
  const i2 = r2.klass;
  e2.type !== i2.getType() && t(18, i2.name);
  const s2 = i2.importJSON(e2), l2 = e2.children;
  if (Pi(s2) && Array.isArray(l2)) for (let t2 = 0; t2 < l2.length; t2++) {
    const e3 = Ti(l2[t2], n2);
    s2.append(e3);
  }
  const c3 = e2.$slots;
  if (c3) {
    Qc(s2) || t(379, i2.name);
    for (const t2 in c3) {
      pa(s2, t2, Ti(c3[t2], n2));
    }
  }
  return s2;
}
function ki(t2, e2, n2) {
  const o2 = ni, r2 = ri, i2 = oi;
  ni = e2, ri = true, oi = t2;
  try {
    return n2();
  } finally {
    ni = o2, ri = r2, oi = i2;
  }
}
function bi(t2, e2) {
  const n2 = si;
  si = true;
  try {
    !(function(t3, e3) {
      const n3 = t3._pendingEditorState, o2 = t3._rootElement, r2 = t3._headless || null === o2;
      if (null === n3) return void (!t3._updating && t3._deferred.length > 0 && wi(t3, t3._deferred));
      const i2 = t3._editorState, s2 = i2._selection, l2 = n3._selection, c3 = 0 !== t3._dirtyType, a2 = ni, u2 = ri, f3 = oi, d2 = t3._updating, h3 = t3._observer;
      let g3 = null;
      if (t3._pendingEditorState = null, t3._editorState = n3, !r2 && c3 && null !== h3) {
        oi = t3, ni = n3, ri = false, t3._updating = true;
        try {
          const e4 = t3._dirtyType, o3 = t3._dirtyElements, r3 = t3._dirtyLeaves;
          h3.disconnect(), g3 = De(i2, n3, t3, e4, o3, r3);
        } catch (e4) {
          if (e4 instanceof Error && t3._onError(e4), ii) throw e4;
          return gs(t3, null, o2, n3), gt(t3), t3._dirtyType = 2, ii = true, bi(t3, i2), void (ii = false);
        } finally {
          h3.observe(o2, ai), t3._updating = d2, ni = a2, ri = u2, oi = f3;
        }
      }
      n3._readOnly || (n3._readOnly = true);
      const _3 = t3._dirtyLeaves, p3 = t3._dirtyElements, y3 = t3._normalizedNodes, m3 = t3._updateTags;
      c3 && (t3._dirtyType = 0, t3._cloneNotNeeded.clear(), t3._dirtyLeaves = /* @__PURE__ */ new Set(), t3._dirtyElements = /* @__PURE__ */ new Map(), t3._normalizedNodes = /* @__PURE__ */ new Set());
      t3._updateTags = /* @__PURE__ */ new Set(), (function(t4, e4) {
        const n4 = t4._decorators;
        let o3 = t4._pendingDecorators || n4;
        const r3 = e4._nodeMap;
        let i3;
        for (i3 in o3) r3.has(i3) || (o3 === n4 && (o3 = tl(t4)), delete o3[i3]);
      })(t3, n3);
      const x3 = r2 ? null : Jl(Il(t3));
      if (t3._editable && null !== x3 && (c3 || null === l2 || l2.dirty || !l2.is(s2)) && null !== o2 && !m3.has(bo)) {
        oi = t3, ni = n3;
        try {
          if (null !== h3 && h3.disconnect(), c3 || null === l2 || l2.dirty) {
            const e4 = t3._blockCursorElement;
            null !== e4 && jl(e4, t3, o2), jr(s2, l2, t3, x3, m3, o2);
          }
          !(function(t4, e4, n4) {
            let o3 = t4._blockCursorElement;
            if (ur(n4) && n4.isCollapsed() && "element" === n4.anchor.type && e4.contains(lc(e4))) {
              const r3 = n4.anchor, i3 = r3.getNode(), s3 = r3.offset;
              let l3 = false, c4 = null;
              if (s3 === i3.getChildrenSize()) {
                Hl(i3.getChildAtIndex(s3 - 1)) && (l3 = true);
              } else {
                const e5 = i3.getChildAtIndex(s3);
                if (null !== e5 && Hl(e5)) {
                  const n5 = e5.getPreviousSibling();
                  (null === n5 || Hl(n5)) && (l3 = true, c4 = t4.getElementByKey(e5.__key));
                }
              }
              if (l3) {
                const n5 = kc(i3, t4.getElementByKey(i3.__key), t4).element;
                return null === o3 && (t4._blockCursorElement = o3 = (function(t5) {
                  const e5 = t5.theme, n6 = Zl().createElement("div");
                  n6.contentEditable = "false", n6.setAttribute("data-lexical-cursor", "true");
                  let o4 = e5.blockCursor;
                  if (void 0 !== o4) {
                    if ("string" == typeof o4) {
                      const t6 = ku(o4);
                      o4 = e5.blockCursor = t6;
                    }
                    void 0 !== o4 && n6.classList.add(...o4);
                  }
                  return n6;
                })(t4._config)), e4.style.caretColor = "transparent", void (null === c4 ? n5.appendChild(o3) : n5.insertBefore(o3, c4));
              }
            }
            null !== o3 && jl(o3, t4, e4);
          })(t3, o2, l2);
        } finally {
          null !== h3 && h3.observe(o2, ai), oi = f3, ni = a2;
        }
      }
      null !== g3 && (function(t4, e4, n4, o3, r3) {
        const i3 = Array.from(t4._listeners.mutation), s3 = i3.length;
        for (let t5 = 0; t5 < s3; t5++) {
          const [s4, l3] = i3[t5];
          for (const t6 of l3) {
            const i4 = e4.get(t6);
            void 0 !== i4 && s4(i4, { dirtyLeaves: o3, prevEditorState: r3, updateTags: n4 });
          }
        }
      })(t3, g3, m3, _3, i2);
      ur(l2) || null === l2 || null !== s2 && s2.is(l2) || t3.dispatchCommand(Ie);
      const C2 = t3._pendingDecorators;
      null !== C2 && (t3._decorators = C2, t3._pendingDecorators = null, Ni("decorator", t3, true, C2));
      if ((function(t4, e4, n4) {
        const o3 = el(e4), r3 = el(n4);
        o3 !== r3 && Ni("textcontent", t4, true, r3);
      })(t3, e3 || i2, n3), Ni("update", t3, true, { dirtyElements: p3, dirtyLeaves: _3, editorState: n3, mutatedNodes: g3, normalizedNodes: y3, prevEditorState: e3 || i2, tags: m3 }), !d2) {
        wi(t3, t3._deferred);
      }
      !(function(t4) {
        const e4 = t4._updates;
        if (0 === e4.length) return void (t4._cascadeCount = 0);
        if ((function(t5) {
          if (li.has(t5)) return;
          li.add(t5), setTimeout(() => {
            li.delete(t5), t5._cascadeCount = 0;
          }, 0);
        })(t4), t4._cascadeCount++ > 99) return t4._updates = [], t4._cascadeCount = 0, void t4._onWarn(new Error(`One or more update listeners are endlessly enqueueing more updates. May have encountered infinite recursion caused by update listeners that trigger additional updates without a stop condition. Editor namespace: ${t4._config.namespace}`));
        const n4 = e4.shift();
        if (n4) {
          const [e5, o3] = n4;
          Mi(t4, e5, o3);
        }
      })(t3);
    })(t2, e2);
  } finally {
    si = n2;
  }
}
function Ni(t2, e2, n2, ...o2) {
  const r2 = e2._updating;
  e2._updating = n2;
  try {
    const n3 = e2._listeners[t2], r3 = Array.from(n3);
    for (const [t3, e3] of r3) {
      e3 && e3();
      const r4 = t3(...o2);
      n3.has(t3) ? n3.set(t3, r4) : r4 && r4();
    }
  } finally {
    e2._updating = r2;
  }
}
function Ei(t2, e2, n2, o2) {
  const r2 = ll(t2);
  let i2;
  if (!si) for (let t3 = 0; t3 < r2.length; t3++) r2[t3]._updating || (r2[t3]._cascadeCount = 0);
  for (let t3 = 4; t3 >= 0; t3--) for (let s2 = 0; s2 < r2.length; s2++) {
    const l2 = r2[s2];
    if (s2 > 0 && l2._updating) {
      i2 = l2;
      break;
    }
    const c3 = l2._commands.get(e2);
    if (void 0 !== c3) {
      const e3 = c3[t3];
      if (e3.size > 0) {
        let t4 = false;
        if (Ai(l2, () => {
          for (const r3 of e3) if (r3(n2, o2)) return void (t4 = true);
        }), t4) return t4;
      }
    }
  }
  return i2 && i2.update(() => {
    Ei(i2, e2, n2, o2);
  }), false;
}
function wi(t2, e2) {
  if (t2._deferred = [], 0 !== e2.length) {
    const n2 = t2._updating;
    t2._updating = true;
    try {
      for (let t3 = 0; t3 < e2.length; t3++) e2[t3]();
    } finally {
      t2._updating = n2;
    }
  }
}
function Oi(e2, n2) {
  const o2 = e2._updates;
  let r2 = n2 || false;
  for (; 0 !== o2.length; ) {
    const n3 = o2.shift();
    if (n3) {
      const [o3, i2] = n3, s2 = e2._pendingEditorState;
      let l2;
      void 0 !== i2 && (l2 = i2.onUpdate, i2.skipTransforms && (r2 = true), i2.discrete && (null === s2 && t(191), s2._flushSync = true), l2 && e2._deferred.push(l2), Si(e2, i2.tag)), null == s2 ? Mi(e2, o3, i2) : o3();
    }
  }
  return r2;
}
function Mi(e2, n2, o2) {
  const r2 = e2._updateTags;
  let i2, s2 = false, l2 = false;
  void 0 !== o2 && (i2 = o2.onUpdate, Si(e2, o2.tag), s2 = o2.skipTransforms || false, l2 = o2.discrete || false), i2 && e2._deferred.push(i2);
  const c3 = e2._editorState;
  let a2 = e2._pendingEditorState, u2 = false;
  (null === a2 || a2._readOnly) && (a2 = e2._pendingEditorState = Ri(a2 || c3), u2 = true), a2._flushSync = l2;
  const f3 = ni, d2 = ri, h3 = oi, g3 = e2._updating;
  ni = a2, ri = false, e2._updating = true, oi = e2;
  const _3 = e2._headless || null === e2.getRootElement();
  vs(null);
  try {
    u2 && (_3 ? null !== c3._selection && (a2._selection = c3._selection.clone()) : a2._selection = (function(t2, e3) {
      const n3 = t2.getEditorState()._selection, o3 = Jl(Il(t2));
      return ur(n3) || null == n3 ? Lr(n3, o3, t2, e3) : n3.clone();
    })(e2, o2 && o2.event || null));
    const r3 = e2._compositionKey;
    n2(), s2 = Oi(e2, s2), (function(t2, e3) {
      const n3 = e3.getEditorState()._selection, o3 = t2._selection;
      if (ur(o3)) {
        const t3 = o3.anchor, e4 = o3.focus;
        let r4;
        if ("text" === t3.type && (r4 = t3.getNode(), r4.selectionTransform(n3, o3)), "text" === e4.type) {
          const t4 = e4.getNode();
          r4 !== t4 && t4.selectionTransform(n3, o3);
        }
      }
    })(a2, e2), 0 !== e2._dirtyType && (s2 ? (function(t2, e3) {
      const n3 = e3._dirtyLeaves, o3 = t2._nodeMap;
      for (const t3 of n3) {
        const e4 = o3.get(t3);
        Xo(e4) && e4.isAttached() && e4.isSimpleText() && !e4.isUnmergeable() && Pt(e4);
      }
    })(a2, e2) : (function(t2, e3) {
      const n3 = e3._dirtyLeaves, o3 = e3._dirtyElements, r4 = t2._nodeMap, i4 = qs(), s3 = /* @__PURE__ */ new Map();
      let l3 = n3, c4 = l3.size, a3 = o3, u3 = a3.size;
      for (; c4 > 0 || u3 > 0; ) {
        if (c4 > 0) {
          e3._dirtyLeaves = /* @__PURE__ */ new Set();
          for (const t3 of l3) {
            const o4 = r4.get(t3);
            Xo(o4) && o4.isAttached() && o4.isSimpleText() && !o4.isUnmergeable() && Pt(o4), void 0 !== o4 && Ci(o4, i4) && xi(e3, o4, s3), n3.add(t3);
          }
          if (l3 = e3._dirtyLeaves, c4 = l3.size, c4 > 0) {
            ci++;
            continue;
          }
        }
        e3._dirtyLeaves = /* @__PURE__ */ new Set(), e3._dirtyElements = /* @__PURE__ */ new Map(), a3.delete("root") && a3.set("root", true);
        for (const t3 of a3) {
          const n4 = t3[0], l4 = t3[1];
          if (o3.set(n4, l4), !l4) continue;
          const c5 = r4.get(n4);
          void 0 !== c5 && Ci(c5, i4) && xi(e3, c5, s3);
        }
        l3 = e3._dirtyLeaves, c4 = l3.size, a3 = e3._dirtyElements, u3 = a3.size, ci++;
      }
      e3._dirtyLeaves = n3, e3._dirtyElements = o3;
    })(a2, e2), Oi(e2), (function(t2, e3, n3, o3) {
      const r4 = t2._nodeMap, i4 = e3._nodeMap, s3 = [];
      for (const [t3] of o3) {
        const e4 = i4.get(t3);
        void 0 !== e4 && (e4.isAttached() || (Pi(e4) && rt(e4, t3, r4, i4, s3, o3), r4.has(t3) || o3.delete(t3), s3.push(t3)));
      }
      for (const t3 of n3) {
        const e4 = i4.get(t3);
        void 0 === e4 || e4.isAttached() || (Qc(e4) && null !== e4.__slots && rt(e4, t3, r4, i4, s3, n3), r4.has(t3) || n3.delete(t3), s3.push(t3));
      }
      for (const t3 of s3) i4.delete(t3);
      const l3 = _i(), c4 = l3._compositionKey;
      null === c4 || i4.has(c4) || (l3._compositionKey = null);
    })(c3, a2, e2._dirtyLeaves, e2._dirtyElements));
    r3 !== e2._compositionKey && (a2._flushSync = true);
    const i3 = a2._selection;
    if (ur(i3)) {
      e2._slotsUsed && Or(i3);
      const n3 = a2._nodeMap, o3 = i3.anchor.key, r4 = i3.focus.key;
      void 0 !== n3.get(o3) && void 0 !== n3.get(r4) || t(19);
    } else dr(i3) && 0 === i3._nodes.size && (a2._selection = null);
  } catch (t2) {
    return t2 instanceof Error && e2._onError(t2), e2._pendingEditorState = c3, e2._dirtyType = 2, e2._cloneNotNeeded.clear(), e2._dirtyLeaves = /* @__PURE__ */ new Set(), e2._dirtyElements.clear(), void bi(e2);
  } finally {
    ni = f3, ri = d2, oi = h3, e2._updating = g3, ci = 0;
  }
  const p3 = 0 !== e2._dirtyType || e2._deferred.length > 0 || (function(t2, e3) {
    const n3 = e3.getEditorState()._selection, o3 = t2._selection;
    if (null !== o3) {
      if (o3.dirty || !o3.is(n3)) return true;
    } else if (null !== n3) return true;
    return false;
  })(a2, e2);
  p3 ? a2._flushSync ? (a2._flushSync = false, bi(e2)) : u2 && ws(() => {
    bi(e2);
  }) : (a2._flushSync = false, u2 && (r2.clear(), e2._deferred = [], e2._pendingEditorState = null));
}
function Ai(t2, e2, n2) {
  oi === t2 && void 0 === n2 ? ui() ? Mi(t2, e2, n2) : e2() : Mi(t2, e2, n2);
}
function Di(t2) {
  if (Bl(t2)) {
    let e2 = null;
    for (const n2 of t2.getChildren()) e2 = n2.isInline() ? (e2 || n2.replace(n2.createParentElementNode())).append(n2) : null;
  }
}
var Fi = class extends _o {
  __first;
  __last;
  __size;
  __format;
  __style;
  __indent;
  __dir;
  __textFormat;
  __textStyle;
  __slotHost;
  __slots;
  $config() {
    return this.config(Symbol.for("ElementNode"), { $transform: Di, extends: _o });
  }
  constructor(t2) {
    super(t2), this.__first = null, this.__last = null, this.__size = 0, this.__format = 0, this.__style = "", this.__indent = 0, this.__dir = null, this.__textFormat = 0, this.__textStyle = "", this.__slotHost = null, this.__slots = null;
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__key === e2.__key && (this.__first = e2.__first, this.__last = e2.__last, this.__size = e2.__size, this.__slotHost = e2.__slotHost, null !== this.__slotHost && null !== this.__parent && t(384, this.__key, String(this.__slotHost), String(this.__parent)), this.__slots = e2.__slots), this.__indent = e2.__indent, this.__format = e2.__format, this.__style = e2.__style, this.__dir = e2.__dir, this.__textFormat = e2.__textFormat, this.__textStyle = e2.__textStyle;
  }
  getFormat() {
    return this.getLatest().__format;
  }
  getFormatType() {
    const t2 = this.getFormat();
    return W[t2] || "";
  }
  getStyle() {
    return this.getLatest().__style;
  }
  getIndent() {
    return this.getLatest().__indent;
  }
  getChildren() {
    const t2 = [];
    let e2 = this.getFirstChild();
    for (; null !== e2; ) t2.push(e2), e2 = e2.getNextSibling();
    return t2;
  }
  getChildrenKeys() {
    const t2 = [];
    let e2 = this.getFirstChild();
    for (; null !== e2; ) t2.push(e2.__key), e2 = e2.getNextSibling();
    return t2;
  }
  getChildrenSize() {
    return this.getLatest().__size;
  }
  isEmpty() {
    return 0 === this.getChildrenSize() && 0 === ia(this).length;
  }
  isDirty() {
    const t2 = _i()._dirtyElements;
    return null !== t2 && t2.has(this.__key);
  }
  isLastChild() {
    const t2 = this.getLatest(), e2 = this.getParentOrThrow().getLastChild();
    return null !== e2 && e2.is(t2);
  }
  getAllTextNodes() {
    const t2 = [];
    for (const e3 of ia(this)) {
      const n2 = sa(this, e3);
      Pi(n2) && t2.push(...n2.getAllTextNodes());
    }
    let e2 = this.getFirstChild();
    for (; null !== e2; ) {
      if (Xo(e2) && t2.push(e2), Pi(e2)) {
        const n2 = e2.getAllTextNodes();
        t2.push(...n2);
      }
      e2 = e2.getNextSibling();
    }
    return t2;
  }
  getFirstDescendant() {
    let t2 = this.getFirstChild();
    for (; Pi(t2); ) {
      const e2 = t2.getFirstChild();
      if (null === e2) break;
      t2 = e2;
    }
    return t2;
  }
  getLastDescendant() {
    let t2 = this.getLastChild();
    for (; Pi(t2); ) {
      const e2 = t2.getLastChild();
      if (null === e2) break;
      t2 = e2;
    }
    return t2;
  }
  getDescendantByIndex(t2) {
    const e2 = this.getChildren(), n2 = e2.length;
    if (t2 >= n2) {
      const t3 = e2[n2 - 1];
      return Pi(t3) && t3.getLastDescendant() || t3 || null;
    }
    const o2 = e2[t2];
    return Pi(o2) && o2.getFirstDescendant() || o2 || null;
  }
  getFirstChild() {
    const t2 = this.getLatest().__first;
    return null === t2 ? null : Ys(t2);
  }
  getFirstChildOrThrow() {
    const e2 = this.getFirstChild();
    return null === e2 && t(45, this.__key), e2;
  }
  getLastChild() {
    const t2 = this.getLatest().__last;
    return null === t2 ? null : Ys(t2);
  }
  getLastChildOrThrow() {
    const e2 = this.getLastChild();
    return null === e2 && t(96, this.__key), e2;
  }
  getChildAtIndex(t2) {
    const e2 = this.getChildrenSize();
    let n2, o2;
    if (t2 < e2 / 2) {
      for (n2 = this.getFirstChild(), o2 = 0; null !== n2 && o2 <= t2; ) {
        if (o2 === t2) return n2;
        n2 = n2.getNextSibling(), o2++;
      }
      return null;
    }
    for (n2 = this.getLastChild(), o2 = e2 - 1; null !== n2 && o2 >= t2; ) {
      if (o2 === t2) return n2;
      n2 = n2.getPreviousSibling(), o2--;
    }
    return null;
  }
  getTextContent() {
    let t2 = ha(this);
    const e2 = this.getChildren(), n2 = e2.length;
    for (let o2 = 0; o2 < n2; o2++) {
      const r2 = e2[o2];
      t2 += r2.getTextContent(), Pi(r2) && o2 !== n2 - 1 && !r2.isInline() && (t2 += D);
    }
    return t2;
  }
  getTextContentSize() {
    let t2 = (function(t3) {
      let e3 = 0;
      for (const n3 of ia(t3)) {
        const o2 = sa(t3, n3);
        null !== o2 && (e3 += o2.getTextContentSize());
      }
      return e3;
    })(this);
    const e2 = this.getChildren(), n2 = e2.length;
    for (let o2 = 0; o2 < n2; o2++) {
      const r2 = e2[o2];
      t2 += r2.getTextContentSize(), Pi(r2) && o2 !== n2 - 1 && !r2.isInline() && (t2 += 2);
    }
    return t2;
  }
  getDirection() {
    return this.getLatest().__dir;
  }
  getTextFormat() {
    return this.getLatest().__textFormat;
  }
  hasFormat(t2) {
    if ("" !== t2) {
      const e2 = R[t2];
      return 0 !== (this.getFormat() & e2);
    }
    return false;
  }
  hasTextFormat(t2) {
    const e2 = z[t2];
    return 0 !== (this.getTextFormat() & e2);
  }
  getFormatFlags(t2, e2) {
    return Ws(this.getLatest().__textFormat, t2, e2);
  }
  getTextStyle() {
    return this.getLatest().__textStyle;
  }
  select(t2, e2) {
    fi();
    const n2 = Kr();
    let o2 = t2, r2 = e2;
    const i2 = this.getChildrenSize();
    if (!this.canBeEmpty()) {
      if (0 === t2 && 0 === e2) {
        const t3 = this.getFirstChild();
        if (Xo(t3) || Pi(t3)) return t3.select(0, 0);
      } else if (!(void 0 !== t2 && t2 !== i2 || void 0 !== e2 && e2 !== i2)) {
        const t3 = this.getLastChild();
        if (Xo(t3) || Pi(t3)) return t3.select();
      }
    }
    void 0 === o2 && (o2 = i2), void 0 === r2 && (r2 = i2);
    const s2 = this.__key;
    return ur(n2) ? (n2.anchor.set(s2, o2, "element"), n2.focus.set(s2, r2, "element"), n2.dirty = true, n2) : Dr(s2, o2, s2, r2, "element", "element");
  }
  selectStart() {
    const t2 = this.getFirstDescendant();
    return t2 ? t2.selectStart() : this.select();
  }
  selectEnd() {
    const t2 = this.getLastDescendant();
    return t2 ? t2.selectEnd() : this.select();
  }
  clear() {
    const t2 = this.getWritable();
    return this.getChildren().forEach((t3) => t3.remove()), t2;
  }
  append(...t2) {
    return this.splice(this.getChildrenSize(), 0, t2);
  }
  setDirection(t2) {
    const e2 = this.getWritable();
    return e2.__dir = t2, e2;
  }
  setFormat(t2) {
    return this.getWritable().__format = "" !== t2 && R[t2] || 0, this;
  }
  setStyle(t2) {
    return this.getWritable().__style = t2 || "", this;
  }
  setTextFormat(t2) {
    const e2 = this.getWritable();
    return e2.__textFormat = t2, e2;
  }
  setTextStyle(t2) {
    const e2 = this.getWritable();
    return e2.__textStyle = t2, e2;
  }
  setIndent(t2) {
    return this.getWritable().__indent = t2, this;
  }
  splice(e2, n2, o2) {
    ho(this) && t(324, this.__key, this.__type);
    const r2 = this.getChildrenSize(), i2 = this.getWritable();
    e2 + n2 <= r2 || t(226, String(e2), String(n2), String(r2));
    for (const t2 of o2) ;
    const s2 = i2.__key, l2 = [], c3 = [], a2 = this.getChildAtIndex(e2 + n2);
    let u2 = null, f3 = r2 - n2 + o2.length;
    if (0 !== e2) if (e2 === r2) u2 = this.getLastChild();
    else {
      const t2 = this.getChildAtIndex(e2);
      null !== t2 && (u2 = t2.getPreviousSibling());
    }
    if (n2 > 0) {
      let e3 = null === u2 ? this.getFirstChild() : u2.getNextSibling();
      for (let o3 = 0; o3 < n2; o3++) {
        null === e3 && t(100);
        const n3 = e3.getNextSibling(), o4 = e3.__key;
        Hs(e3.getWritable()), c3.push(o4), e3 = n3;
      }
    }
    let d2 = u2;
    for (const e3 of o2) {
      null !== d2 && e3.is(d2) && (u2 = d2 = d2.getPreviousSibling());
      const n3 = e3.getWritable();
      n3.__parent === s2 && f3--, Hs(n3);
      const o3 = e3.__key;
      if (null === d2) i2.__first = o3, n3.__prev = null;
      else {
        const t2 = d2.getWritable();
        t2.__next = o3, n3.__prev = t2.__key;
      }
      e3.__key === s2 && t(76), n3.__parent = s2, l2.push(o3), d2 = e3;
    }
    if (e2 + n2 === r2) {
      if (null !== d2) {
        d2.getWritable().__next = null, i2.__last = d2.__key;
      }
    } else if (null !== a2) {
      const t2 = a2.getWritable();
      if (null !== d2) {
        const e3 = d2.getWritable();
        t2.__prev = d2.__key, e3.__next = a2.__key;
      } else t2.__prev = null;
    }
    if (i2.__size = f3, c3.length) {
      const t2 = Kr();
      if (ur(t2)) {
        const e3 = new Set(c3), n3 = new Set(l2), { anchor: o3, focus: r3 } = t2;
        Ii(o3, e3, n3) && Wr(o3, o3.getNode(), this, u2, a2), Ii(r3, e3, n3) && Wr(r3, r3.getNode(), this, u2, a2), 0 !== f3 || this.canBeEmpty() || Bl(this) || this.remove();
      }
    }
    return i2;
  }
  getDOMSlot(t2) {
    return new G(t2);
  }
  exportDOM(t2) {
    const { element: e2 } = super.exportDOM(t2);
    if (gc(e2)) {
      const t3 = this.getIndent();
      t3 > 0 && (e2.style.paddingInlineStart = 40 * t3 + "px", e2.setAttribute("data-lexical-indent", String(t3)));
      const n2 = this.getDirection();
      n2 && (e2.dir = n2);
    }
    return { element: e2 };
  }
  exportJSON() {
    const t2 = { children: [], direction: this.getDirection(), format: this.getFormatType(), indent: this.getIndent(), ...super.exportJSON() }, e2 = this.getTextFormat(), n2 = this.getTextStyle();
    return 0 === e2 && "" === n2 || Bl(this) || this.getChildren().some(Xo) || (0 !== e2 && (t2.textFormat = e2), "" !== n2 && (t2.textStyle = n2)), t2;
  }
  updateFromJSON(t2) {
    return super.updateFromJSON(t2).setFormat(t2.format).setIndent(t2.indent).setDirection(t2.direction).setTextFormat(t2.textFormat || 0).setTextStyle(t2.textStyle || "");
  }
  insertNewAfter(t2, e2) {
    return null;
  }
  canIndent() {
    return true;
  }
  collapseAtStart(t2) {
    return false;
  }
  excludeFromCopy(t2) {
    return false;
  }
  canReplaceWith(t2) {
    return true;
  }
  canInsertAfter(t2) {
    return true;
  }
  canBeEmpty() {
    return true;
  }
  canInsertTextBefore() {
    return true;
  }
  canInsertTextAfter() {
    return true;
  }
  isInline() {
    return false;
  }
  isShadowRoot() {
    return false;
  }
  canMergeWith(t2) {
    return false;
  }
  extractWithChild(t2, e2, n2) {
    return false;
  }
  canMergeWhenEmpty() {
    return false;
  }
  reconcileObservedMutation(t2, e2) {
    const n2 = kc(this, t2, e2);
    let o2 = n2.getFirstChild();
    for (let t3 = this.getFirstChild(); t3; t3 = t3.getNextSibling()) {
      const r2 = e2.getElementByKey(t3.getKey());
      null !== r2 && (null == o2 ? (n2.insertChild(r2), o2 = r2) : o2 !== r2 && n2.replaceChild(r2, o2), o2 = o2.nextSibling);
    }
  }
};
function Pi(t2) {
  return t2 instanceof Fi;
}
function Ii(t2, e2, n2) {
  let o2 = t2.getNode();
  for (; o2; ) {
    const t3 = o2.__key;
    if (e2.has(t3) && !n2.has(t3)) return true;
    o2 = o2.getParent();
  }
  return false;
}
var Li = class extends _o {
  __slotHost;
  __slots;
  constructor(t2) {
    super(t2), this.__slotHost = null, this.__slots = null;
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__key === e2.__key && (this.__slotHost = e2.__slotHost, null !== this.__slotHost && null !== this.__parent && t(383, this.__key, String(this.__slotHost), String(this.__parent)), this.__slots = e2.__slots);
  }
  decorate(t2, e2) {
    return null;
  }
  isIsolated() {
    return false;
  }
  isInline() {
    return true;
  }
  isKeyboardSelectable() {
    return true;
  }
};
function Ki(t2) {
  return t2 instanceof Li;
}
var zi = class extends Fi {
  __cachedText;
  $config() {
    return this.config("root", { extends: Fi });
  }
  constructor() {
    super("root"), this.__cachedText = null;
  }
  getTopLevelElementOrThrow() {
    t(51);
  }
  getTextContent() {
    const t2 = this.__cachedText;
    return null === t2 || !ui() && 0 !== _i()._dirtyType ? super.getTextContent() : t2;
  }
  remove() {
    t(52);
  }
  replace(e2) {
    t(53);
  }
  insertBefore(e2) {
    t(54);
  }
  insertAfter(e2) {
    t(55);
  }
  updateDOM(t2, e2) {
    return false;
  }
  splice(e2, n2, o2) {
    for (const e3 of o2) Pi(e3) || Ki(e3) || t(282);
    return super.splice(e2, n2, o2);
  }
  static importJSON(t2) {
    return nl().updateFromJSON(t2);
  }
  collapseAtStart() {
    return true;
  }
};
function Bi(t2) {
  return t2 instanceof zi;
}
function Ri(t2) {
  return new Hi(nt(t2._nodeMap), null, t2._slotsUsed);
}
function Wi() {
  return new Hi(/* @__PURE__ */ new Map([["root", new zi()]]), null, false);
}
function $i(e2) {
  const n2 = e2.exportJSON(), o2 = e2.constructor;
  if (n2.type !== o2.getType() && t(130, o2.name), Pi(e2)) {
    const r3 = n2.children;
    Array.isArray(r3) || t(59, o2.name);
    const i2 = e2.getChildren();
    for (let t2 = 0; t2 < i2.length; t2++) {
      const e3 = $i(i2[t2]);
      r3.push(e3);
    }
  }
  const r2 = ia(e2);
  if (r2.length > 0) {
    const i2 = {};
    for (const n3 of r2) {
      const r3 = sa(e2, n3);
      null === r3 && t(366, o2.name, n3), i2[n3] = $i(r3);
    }
    n2.$slots = i2;
  }
  return n2;
}
function Ui(t2) {
  return t2 instanceof Hi;
}
var Hi = class _Hi {
  _nodeMap;
  _selection;
  _flushSync;
  _readOnly;
  _parsed;
  _slotsUsed;
  constructor(t2, e2 = null, n2 = false) {
    this._nodeMap = t2, this._selection = e2 || null, this._flushSync = false, this._readOnly = false, this._parsed = false, this._slotsUsed = n2;
  }
  isEmpty() {
    return 1 === this._nodeMap.size && null === this._selection;
  }
  read(t2, e2) {
    return ki(e2 && e2.editor || null, this, t2);
  }
  clone(t2) {
    const e2 = new _Hi(this._nodeMap, void 0 === t2 ? this._selection : t2, this._slotsUsed);
    return e2._readOnly = true, e2;
  }
  toJSON() {
    return ki(null, this, () => ({ root: $i(nl()) }));
  }
};
var ji = class extends Fi {
  $config() {
    return this.config("artificial", { extends: Fi });
  }
  createDOM(t2) {
    return Zl().createElement("div");
  }
};
var Ji = class extends _o {
  $config() {
    return this.config("linebreak", { importDOM: { br: (t2) => Gi(t2) || Xi(t2) ? null : { conversion: Vi, priority: 0 } } });
  }
  getTextContent() {
    return "\n";
  }
  createDOM() {
    return Zl().createElement("br");
  }
  updateDOM() {
    return false;
  }
  isInline() {
    return true;
  }
};
function Vi(t2) {
  return { node: qi() };
}
function qi() {
  return Wl(new Ji());
}
function Yi(t2) {
  return t2 instanceof Ji;
}
function Gi(t2) {
  const e2 = t2.parentElement;
  if (null !== e2 && Cc(e2)) {
    const n2 = e2.firstChild;
    if (n2 === t2 || n2.nextSibling === t2 && Qi(n2)) {
      const n3 = e2.lastChild;
      if (n3 === t2 || n3.previousSibling === t2 && Qi(n3)) return true;
    }
  }
  return false;
}
function Xi(t2) {
  const e2 = t2.parentElement;
  if (null !== e2 && Cc(e2)) {
    const n2 = e2.firstChild;
    if (n2 === t2 || n2.nextSibling === t2 && Qi(n2)) return false;
    const o2 = e2.lastChild;
    if (o2 === t2 || o2.previousSibling === t2 && Qi(o2)) return true;
  }
  return false;
}
function Qi(t2) {
  return zs(t2) && /^( |\t|\r?\n)+$/.test(t2.textContent || "");
}
var Zi = class extends Fi {
  $config() {
    return this.config("paragraph", { extends: Fi, importDOM: { p: () => ({ conversion: ts, priority: 0 }) } });
  }
  createDOM(t2) {
    const e2 = Zl().createElement("p"), n2 = Cl(t2.theme, "paragraph");
    if (void 0 !== n2) {
      e2.classList.add(...n2);
    }
    return e2;
  }
  updateDOM(t2, e2, n2) {
    return false;
  }
  exportDOM(t2) {
    const { element: e2 } = super.exportDOM(t2);
    if (gc(e2)) {
      this.isEmpty() && e2.append(Zl().createElement("br"));
      const t3 = this.getFormatType();
      t3 && (e2.style.textAlign = t3);
    }
    return { element: e2 };
  }
  exportJSON() {
    const t2 = super.exportJSON();
    if (void 0 === t2.textFormat || void 0 === t2.textStyle) {
      const e2 = this.getChildren().find(Xo);
      e2 ? (t2.textFormat = e2.getFormat(), t2.textStyle = e2.getStyle()) : (t2.textFormat = this.getTextFormat(), t2.textStyle = this.getTextStyle());
    }
    return t2;
  }
  insertNewAfter(t2, e2) {
    const n2 = es();
    n2.setTextFormat(t2.format), n2.setTextStyle(t2.style);
    const o2 = this.getDirection();
    return n2.setDirection(o2), n2.setFormat(this.getFormatType()), n2.setStyle(this.getStyle()), this.insertAfter(n2, e2), n2;
  }
  collapseAtStart() {
    const t2 = this.getChildren();
    if (0 === t2.length || Xo(t2[0]) && "" === t2[0].getTextContent().trim()) {
      if (null !== this.getNextSibling()) return this.selectNext(), this.remove(), true;
      if (null !== this.getPreviousSibling()) return this.selectPrevious(), this.remove(), true;
    }
    return false;
  }
};
function ts(t2) {
  const e2 = es();
  if (Lc(e2, t2), Pc(t2, e2), "" === e2.getFormatType()) {
    const n2 = t2.getAttribute("align");
    n2 && n2 && n2 in R && e2.setFormat(n2);
  }
  return Ic(e2, t2), { node: e2 };
}
function es() {
  return Wl(new Zi());
}
function ns(t2) {
  return t2 instanceof Zi;
}
function os(t2) {
  console.warn(t2);
}
var rs = 0;
var is = 1;
var ss = 2;
var ls = 3;
var cs = 4;
var as = -8;
var us = -7;
var fs = -6;
var ds = -5;
var hs = -4;
function gs(t2, e2, n2, o2, r2) {
  const i2 = t2._keyToDOMMap;
  i2.clear(), t2._editorState = Wi(), t2._pendingEditorState = o2, t2._compositionKey = null, t2._dirtyType = 0, t2._cloneNotNeeded.clear(), t2._dirtyLeaves = /* @__PURE__ */ new Set(), t2._dirtyElements.clear(), t2._normalizedNodes = /* @__PURE__ */ new Set(), r2 && r2.preserveUpdateQueue || (t2._updateTags = /* @__PURE__ */ new Set(), t2._updates = [], t2._cascadeCount = 0), t2._blockCursorElement = null, null !== t2._inputState.handledSelectionCommandTimeoutId && clearTimeout(t2._inputState.handledSelectionCommandTimeoutId), t2._inputState = { collapsedSelectionFormat: { format: 0, key: "root", offset: 0, style: "", timeStamp: 0 }, compositionEndData: "", compositionPhase: "idle", hadOrphanedCompositionEvents: false, handledSelectionCommandTimeoutId: null, isInsertLineBreak: false, isInsertTextAfterHandledSelectionCommand: false, isSelectionChangeFromDOMUpdate: false, isSelectionChangeFromMouseDown: false, lastBeforeInputInsertTextTimeStamp: 0, lastKeyCode: null, lastKeyDownTimeStamp: 0, postDeleteSelectionToRestore: null, unprocessedBeforeInputData: null };
  const s2 = t2._observer;
  null !== s2 && (s2.disconnect(), t2._observer = null), null !== e2 && (e2.textContent = "", (function(t3, e3) {
    const n3 = `__lexicalKey_${e3._key}`;
    delete t3[n3];
  })(e2, t2)), null !== n2 && (n2.textContent = "", i2.set("root", n2), Xs(n2, t2, "root"));
}
function _s(t2) {
  const e2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set();
  for (const { klass: o2, ownNodeConfig: r2 } of jc(t2)) {
    const t3 = o2.transform;
    if (!n2.has(t3)) {
      n2.add(t3);
      const r3 = o2.transform();
      r3 && e2.add(r3);
    }
    if (r2) {
      const t4 = r2.$transform;
      t4 && e2.add(t4);
    }
  }
  return e2;
}
var ps = { $createDOM: (t2, e2) => t2.createDOM(e2._config, e2), $decorateDOM: (t2, e2, n2, o2) => {
}, $exportDOM: (t2, e2) => {
  const n2 = Es(e2, t2.getType());
  return n2 && void 0 !== n2.exportDOM ? n2.exportDOM(e2, t2) : t2.exportDOM(e2);
}, $extractWithChild: (t2, e2, n2, o2, r2) => Pi(t2) && t2.extractWithChild(e2, n2, o2), $getDOMSlot: (t2, e2, n2) => t2.getDOMSlot(e2), $getSlotTargetElement: (t2, e2, n2, o2) => null, $shouldExclude: (t2, e2, n2) => Pi(t2) && t2.excludeFromCopy("html"), $shouldInclude: (t2, e2, n2) => !e2 || t2.isSelected(e2), $updateDOM: (t2, e2, n2, o2) => t2.updateDOM(e2, n2, o2._config) };
function ys(e2) {
  const n2 = e2 || {}, o2 = mi(), r2 = n2.theme || {}, i2 = void 0 === e2 ? o2 : n2.parentEditor || null, s2 = n2.disableEvents || false, l2 = Wi(), c3 = n2.namespace || (null !== i2 ? i2._config.namespace : cl()), a2 = n2.editorState, u2 = [zi, Wo, Ji, Zo, Zi, ji, ...n2.nodes || []], { onError: f3, onWarn: d2, html: h3 } = n2, g3 = void 0 === n2.editable || n2.editable;
  let _3;
  if (void 0 === e2 && null !== o2) _3 = o2._nodes;
  else {
    _3 = /* @__PURE__ */ new Map();
    for (let e3 = 0; e3 < u2.length; e3++) {
      let o3 = u2[e3], r3 = null, i3 = null;
      if (o3 && "object" == typeof o3) {
        const t2 = o3;
        o3 = t2.replace, r3 = t2.with, i3 = t2.withKlass || null;
      }
      if ("function" != typeof o3 || !o3.prototype || !(o3 === _o || o3.prototype instanceof _o)) {
        let r4 = "<unknown>";
        try {
          r4 = JSON.parse(Z);
        } catch (t2) {
        }
        t(365, String(e3 - u2.length + (n2.nodes ? n2.nodes.length : 0)), "function" == typeof o3 ? `${o3.name}${"function" == typeof o3.getType ? ` (type ${String(o3.getType())})` : ""}` : String(o3), String(r4));
      }
      Hc(o3);
      const s3 = o3.getType(), l3 = _s(o3);
      _3.set(s3, { exportDOM: h3 && h3.export ? h3.export.get(o3) : void 0, klass: o3, replace: r3, replaceWithKlass: i3, sharedNodeState: vt(u2[e3]), transforms: l3 });
    }
  }
  const p3 = new Cs(l2, i2, _3, { disableEvents: s2, dom: { ...ps, ...e2 && e2.dom }, namespace: c3, theme: r2 }, f3 || console.error, d2 || os, (function(t2, e3) {
    const n3 = /* @__PURE__ */ new Map(), o3 = /* @__PURE__ */ new Set(), r3 = (t3) => {
      Object.keys(t3).forEach((e4) => {
        let o4 = n3.get(e4);
        void 0 === o4 && (o4 = [], n3.set(e4, o4)), o4.push(t3[e4]);
      });
    };
    return t2.forEach((t3) => {
      const e4 = t3.klass.importDOM;
      if (null == e4 || o3.has(e4)) return;
      o3.add(e4);
      const n4 = e4.call(t3.klass);
      null !== n4 && r3(n4);
    }), e3 && r3(e3), n3;
  })(_3, h3 ? h3.import : void 0), g3, e2);
  return void 0 !== a2 && (p3._pendingEditorState = a2, p3._dirtyType = 2), (function(t2) {
    t2.registerCommand(ze, Yn, rs), t2.registerCommand(Be, Gn, rs), t2.registerCommand(Re, Xn, rs), t2.registerCommand(We, Qn, rs), t2.registerCommand(tn, eo, rs);
  })(p3), p3;
}
function ms(t2, e2) {
  const n2 = t2.get(e2);
  t2.delete(e2), n2 && n2();
}
function xs(t2, e2, n2) {
  return t2.set(e2, n2), ms.bind(null, t2, e2);
}
var Cs = class {
  static version;
  _headless;
  _parentEditor;
  _rootElement;
  _editorState;
  _pendingEditorState;
  _compositionKey;
  _deferred;
  _keyToDOMMap;
  _updates;
  _updating;
  _cascadeCount;
  _listeners;
  _commands;
  _nodes;
  _decorators;
  _pendingDecorators;
  _config;
  _dirtyType;
  _cloneNotNeeded;
  _dirtyLeaves;
  _dirtyElements;
  _normalizedNodes;
  _updateTags;
  _observer;
  _key;
  _onError;
  _onWarn;
  _htmlConversions;
  _window;
  _editable;
  _blockCursorElement;
  _slotsUsed;
  _inputState;
  _createEditorArgs;
  constructor(t2, e2, n2, o2, r2, i2, s2, l2, c3) {
    this._createEditorArgs = c3, this._parentEditor = e2, this._rootElement = null, this._editorState = t2, this._pendingEditorState = null, this._compositionKey = null, this._deferred = [], this._keyToDOMMap = new ot(), this._updates = [], this._updating = false, this._cascadeCount = 0, this._listeners = { decorator: /* @__PURE__ */ new Map(), editable: /* @__PURE__ */ new Map(), mutation: /* @__PURE__ */ new Map(), root: /* @__PURE__ */ new Map(), textcontent: /* @__PURE__ */ new Map(), update: /* @__PURE__ */ new Map() }, this._commands = /* @__PURE__ */ new Map(), this._config = o2, this._nodes = n2, this._decorators = {}, this._pendingDecorators = null, this._dirtyType = 0, this._cloneNotNeeded = /* @__PURE__ */ new Set(), this._dirtyLeaves = /* @__PURE__ */ new Set(), this._dirtyElements = /* @__PURE__ */ new Map(), this._normalizedNodes = /* @__PURE__ */ new Set(), this._updateTags = /* @__PURE__ */ new Set(), this._observer = null, this._key = cl(), this._onError = r2, this._onWarn = i2, this._htmlConversions = s2, this._editable = l2, this._headless = null !== e2 && e2._headless, this._window = null, this._blockCursorElement = null, this._slotsUsed = false, this._inputState = { collapsedSelectionFormat: { format: 0, key: "root", offset: 0, style: "", timeStamp: 0 }, compositionEndData: "", compositionPhase: "idle", hadOrphanedCompositionEvents: false, handledSelectionCommandTimeoutId: null, isInsertLineBreak: false, isInsertTextAfterHandledSelectionCommand: false, isSelectionChangeFromDOMUpdate: false, isSelectionChangeFromMouseDown: false, lastBeforeInputInsertTextTimeStamp: 0, lastKeyCode: null, lastKeyDownTimeStamp: 0, postDeleteSelectionToRestore: null, unprocessedBeforeInputData: null };
  }
  isComposing() {
    return null != this._compositionKey;
  }
  registerUpdateListener(t2) {
    return xs(this._listeners.update, t2);
  }
  registerEditableListener(t2) {
    return xs(this._listeners.editable, t2);
  }
  registerDecoratorListener(t2) {
    return xs(this._listeners.decorator, t2);
  }
  registerTextContentListener(t2) {
    return xs(this._listeners.textcontent, t2);
  }
  registerRootListener(t2) {
    const e2 = this._listeners.root;
    return Eu(xs(e2, t2, t2(this._rootElement, null) || void 0), () => (function(t3, e3, n2) {
      const o2 = t3.get(e3);
      o2 && o2(), t3.set(e3, e3(...n2) || void 0);
    })(e2, t2, [null, this._rootElement]));
  }
  registerCommand(e2, n2, o2) {
    void 0 === o2 && t(35);
    const r2 = this._commands;
    r2.has(e2) || r2.set(e2, [new tt(), new tt(), new tt(), new tt(), new tt()]);
    const i2 = r2.get(e2);
    void 0 === i2 && t(36, String(e2));
    const s2 = (function(t2) {
      return 7 & t2;
    })(o2), l2 = i2[s2];
    return s2 !== o2 ? l2.addFront(n2) : l2.addBack(n2), () => {
      l2.delete(n2), i2.every((t2) => 0 === t2.size) && r2.delete(e2);
    };
  }
  registerMutationListener(t2, e2, n2) {
    const o2 = this.resolveRegisteredNodeAfterReplacements(this.getRegisteredNode(t2)).klass, r2 = this._listeners.mutation;
    let i2 = r2.get(e2);
    void 0 === i2 && (i2 = /* @__PURE__ */ new Set(), r2.set(e2, i2)), i2.add(o2);
    const s2 = n2 && n2.skipInitialization;
    return void 0 !== s2 && s2 || this.initializeMutationListener(e2, o2), () => {
      i2.delete(o2), 0 === i2.size && r2.delete(e2);
    };
  }
  getRegisteredNode(e2) {
    const n2 = this._nodes.get(e2.getType());
    return void 0 === n2 && t(37, e2.name), n2;
  }
  resolveRegisteredNodeAfterReplacements(t2) {
    for (; t2.replaceWithKlass; ) t2 = this.getRegisteredNode(t2.replaceWithKlass);
    return t2;
  }
  initializeMutationListener(t2, e2) {
    const n2 = this._editorState, o2 = Ac(n2).get(e2.getType());
    if (!o2) return;
    const r2 = /* @__PURE__ */ new Map();
    for (const t3 of o2.keys()) r2.set(t3, "created");
    r2.size > 0 && t2(r2, { dirtyLeaves: /* @__PURE__ */ new Set(), prevEditorState: n2, updateTags: /* @__PURE__ */ new Set(["registerMutationListener"]) });
  }
  registerNodeTransformToKlass(t2, e2) {
    const n2 = this.getRegisteredNode(t2);
    return n2.transforms.add(e2), n2;
  }
  registerNodeTransform(t2, e2) {
    const n2 = this.registerNodeTransformToKlass(t2, e2), o2 = [n2], r2 = n2.replaceWithKlass;
    if (null != r2) {
      const t3 = this.registerNodeTransformToKlass(r2, e2);
      o2.push(t3);
    }
    return (function(t3, e3) {
      const n3 = Ac(t3.getEditorState()), o3 = [];
      for (const t4 of e3) {
        const e4 = n3.get(t4);
        e4 && o3.push(e4);
      }
      if (0 === o3.length) return;
      t3.update(() => {
        for (const t4 of o3) for (const e4 of t4.keys()) {
          const t5 = Ys(e4);
          t5 && t5.markDirty();
        }
      }, null === t3._pendingEditorState ? { tag: xo } : void 0);
    })(this, o2.map((t3) => t3.klass.getType())), () => {
      o2.forEach((t3) => t3.transforms.delete(e2));
    };
  }
  hasNode(t2) {
    return this._nodes.has(t2.getType());
  }
  hasNodes(t2) {
    return t2.every(this.hasNode.bind(this));
  }
  dispatchCommand(t2, ...e2) {
    return Nl(this, t2, ...e2);
  }
  getDecorators() {
    return this._decorators;
  }
  getRootElement() {
    return this._rootElement;
  }
  getKey() {
    return this._key;
  }
  setRootElement(t2) {
    const e2 = this._rootElement;
    if (t2 !== e2) {
      const n2 = Cl(this._config.theme, "root"), o2 = this._pendingEditorState || this._editorState;
      if (this._rootElement = t2, gs(this, e2, t2, o2, { preserveUpdateQueue: true }), null !== e2 && (this._config.disableEvents || co(e2), null != n2 && e2.classList.remove(...n2)), null !== t2) {
        const e3 = Pl(t2), o3 = t2.style;
        o3.userSelect = "text", o3.whiteSpace = "pre-wrap", o3.wordBreak = "break-word", t2.setAttribute("data-lexical-editor", "true"), this._window = e3, this._dirtyType = 2, gt(this), this._updateTags.add(xo), bi(this), this._config.disableEvents || (function(t3, e4) {
          const n3 = t3.ownerDocument;
          Ln.set(t3, n3);
          let o4 = Kn.get(n3);
          void 0 === o4 && (o4 = { editors: /* @__PURE__ */ new Set(), hasShadowEditor: void 0 }, Kn.set(n3, o4)), o4.editors.add(e4), o4.hasShadowEditor = void 0, t3.__lexicalEditor = e4;
          const r2 = no(t3);
          r2.push(zn.register(n3));
          for (let n4 = 0; n4 < In.length; n4++) {
            const [o5, i2] = In[n4], s2 = "function" == typeof i2 ? (t4) => {
              so(t4) || (io(t4), (e4.isEditable() || "click" === o5) && i2(t4, e4));
            } : (t4) => {
              if (so(t4)) return;
              io(t4);
              const n5 = e4.isEditable();
              switch (o5) {
                case "cut":
                  return n5 && Nl(e4, Tn, t4);
                case "copy":
                  return Nl(e4, vn, t4);
                case "paste":
                  return n5 && Nl(e4, Je, t4);
                case "dragstart":
                  return n5 && Nl(e4, xn, t4);
                case "dragover":
                  return n5 && Nl(e4, Cn, t4);
                case "dragend":
                  return n5 && Nl(e4, Sn, t4);
                case "focus":
                  return n5 && Nl(e4, On, t4);
                case "blur":
                  return n5 && Nl(e4, Mn, t4);
                case "drop":
                  return n5 && Nl(e4, yn, t4);
              }
            };
            r2.push(Fn(t3, o5, s2));
          }
        })(t2, this), null != n2 && t2.classList.add(...n2);
      } else this._window = null, this._updateTags.add(xo), bi(this);
      Ni("root", this, false, t2, e2);
    }
  }
  getElementByKey(t2) {
    return this._keyToDOMMap.get(t2) || null;
  }
  getEditorState() {
    return this._editorState;
  }
  setEditorState(e2, n2) {
    e2.isEmpty() && t(38);
    let o2 = e2;
    o2._readOnly && (o2 = Ri(e2), o2._selection = e2._selection ? e2._selection.clone() : null), ht(this);
    const r2 = this._pendingEditorState, i2 = void 0 !== n2 ? n2.tag : null;
    null === r2 || r2.isEmpty() || (null != i2 && this._updateTags.add(i2), bi(this)), this._pendingEditorState = o2, this._dirtyType = 2, this._dirtyElements.set("root", false), this._compositionKey = null, this._slotsUsed = this._slotsUsed || e2._slotsUsed, Ai(this, () => {
      if (i2 && this._updateTags.add(i2), e2._parsed) for (const [t2, e3] of o2._nodeMap.entries()) Pi(e3) ? this._dirtyElements.set(t2, true) : this._dirtyLeaves.add(t2);
    }, { discrete: !this._updating || void 0 });
  }
  parseEditorState(t2, e2) {
    return (function(t3, e3, n2) {
      const o2 = Wi(), r2 = ni, i2 = ri, s2 = oi, l2 = e3._dirtyElements, c3 = e3._dirtyLeaves, a2 = e3._cloneNotNeeded, u2 = e3._dirtyType;
      e3._dirtyElements = /* @__PURE__ */ new Map(), e3._dirtyLeaves = /* @__PURE__ */ new Set(), e3._cloneNotNeeded = /* @__PURE__ */ new Set(), e3._dirtyType = 0, ni = o2, ri = false, oi = e3, vs(null);
      try {
        const r3 = e3._nodes;
        Ti(t3.root, r3), n2 && n2(), o2._readOnly = true, o2._parsed = true;
      } catch (t4) {
        t4 instanceof Error && e3._onError(t4);
      } finally {
        e3._dirtyElements = l2, e3._dirtyLeaves = c3, e3._cloneNotNeeded = a2, e3._dirtyType = u2, ni = r2, ri = i2, oi = s2;
      }
      return o2;
    })("string" == typeof t2 ? JSON.parse(t2) : t2, this, e2);
  }
  read(...t2) {
    const [e2, n2] = 1 === t2.length ? ["force-commit", t2[0]] : t2;
    "force-commit" === e2 && bi(this);
    return ("pending" === e2 ? this._pendingEditorState || this._editorState : this.getEditorState()).read(n2, { editor: this });
  }
  update(t2, e2) {
    !(function(t3, e3, n2) {
      t3._updating ? t3._updates.push([e3, n2]) : Mi(t3, e3, n2);
    })(this, t2, e2);
  }
  focus(t2, e2 = {}) {
    const n2 = this._rootElement;
    null !== n2 && (n2.setAttribute("autocapitalize", "off"), Ai(this, () => {
      const o2 = Kr(), r2 = nl();
      null !== o2 ? o2.dirty || ol(o2.clone()) : 0 !== r2.getChildrenSize() && ("rootStart" === e2.defaultSelection ? r2.selectStart() : r2.selectEnd()), Al("focus"), Dl(() => {
        n2.removeAttribute("autocapitalize"), t2 && t2();
      });
    }), null === this._pendingEditorState && n2.removeAttribute("autocapitalize"));
  }
  blur() {
    const t2 = this._rootElement;
    null !== t2 && t2.blur();
    const e2 = Jl(this._window);
    null !== e2 && e2.removeAllRanges();
  }
  isEditable() {
    return this._editable;
  }
  setEditable(t2) {
    this._editable !== t2 && (this._editable = t2, Ni("editable", this, true, t2), this._slotsUsed && this.update(() => pi()));
  }
  toJSON() {
    return { editorState: this._editorState.toJSON() };
  }
};
Cs.version = Z;
var Ss = null;
function vs(t2) {
  Ss = t2;
}
var Ts = Symbol("INTERNAL_SKIP_AFTER_CLONE_FROM");
var ks = 1;
function bs() {
  ks = 1;
}
function Ns(e2, n2) {
  const o2 = Es(e2, n2);
  return void 0 === o2 && t(30, n2), o2;
}
function Es(t2, e2) {
  return t2._nodes.get(e2);
}
var ws = "function" == typeof queueMicrotask ? queueMicrotask : (t2) => {
  Promise.resolve().then(t2);
};
function Os(t2, e2) {
  const n2 = void 0 !== e2 ? e2 : (() => {
    const e3 = t2.getRootNode();
    return Bs(e3) || ql(e3) ? cc(e3) : null;
  })();
  if (!gc(n2)) return false;
  if (n2.hasAttribute("data-lexical-slot")) return false;
  const o2 = Zs(n2), r2 = n2.nodeName;
  return po(o2) && ("INPUT" === r2 || "TEXTAREA" === r2 || "true" === n2.contentEditable && null == Ps(n2));
}
var Ms = Os;
function As(t2, e2, n2) {
  const o2 = t2.getRootElement();
  if (!o2) return false;
  try {
    if (!e2 || !o2.contains(e2) || !o2.contains(n2)) return false;
  } catch (t3) {
    return false;
  }
  return Fs(e2) === t2 && t2.read("latest", () => !Os(e2));
}
function Ds(t2) {
  return t2 instanceof Cs;
}
function Fs(t2) {
  let e2 = t2;
  for (; null != e2; ) {
    const t3 = Ps(e2);
    if (Ds(t3)) return t3;
    e2 = wl(e2);
  }
  return null;
}
function Ps(t2) {
  return t2 ? t2.__lexicalEditor : null;
}
function Is(t2) {
  return L.test(t2) ? "rtl" : K.test(t2) ? "ltr" : null;
}
function Ls(t2) {
  return er(t2) || t2.isToken();
}
function Ks(t2) {
  return Ls(t2) || t2.isSegmented();
}
function zs(t2) {
  return _c(t2) && 3 === t2.nodeType;
}
function Bs(t2) {
  return _c(t2) && 9 === t2.nodeType;
}
function Rs(t2) {
  let e2 = t2;
  for (; null != e2; ) {
    if (zs(e2)) return e2;
    e2 = e2.firstChild;
  }
  return null;
}
function Ws(t2, e2, n2) {
  const o2 = z[e2];
  if (null !== n2 && (t2 & o2) === (n2 & o2)) return t2;
  let r2 = t2 ^ o2;
  return "subscript" === e2 ? r2 &= ~z.superscript : "superscript" === e2 ? r2 &= ~z.subscript : "lowercase" === e2 ? (r2 &= ~z.uppercase, r2 &= ~z.capitalize) : "uppercase" === e2 ? (r2 &= ~z.lowercase, r2 &= ~z.capitalize) : "capitalize" === e2 && (r2 &= ~z.lowercase, r2 &= ~z.uppercase), r2;
}
function $s(t2) {
  return Xo(t2) || Yi(t2) || Ki(t2);
}
function Us(t2, e2) {
  const n2 = (function() {
    const t3 = Ss;
    return Ss = null, t3;
  })();
  if (null != (e2 = e2 || n2 && n2.__key)) return void (t2.__key = e2);
  fi(), di();
  const o2 = _i(), r2 = hi(), i2 = "" + ks++;
  r2._nodeMap.set(i2, t2), Pi(t2) ? o2._dirtyElements.set(i2, true) : o2._dirtyLeaves.add(i2), o2._cloneNotNeeded.add(i2), 0 === o2._dirtyType && (o2._dirtyType = 1), t2.__key = i2;
}
function Hs(e2) {
  null !== ta(e2) && t(380, e2.__key, String(ta(e2)));
  const n2 = e2.getParent();
  if (null !== n2) {
    const t2 = e2.getWritable(), o2 = n2.getWritable(), r2 = e2.getPreviousSibling(), i2 = e2.getNextSibling(), s2 = null !== i2 ? i2.__key : null, l2 = null !== r2 ? r2.__key : null, c3 = null !== r2 ? r2.getWritable() : null, a2 = null !== i2 ? i2.getWritable() : null;
    null === r2 && (o2.__first = s2), null === i2 && (o2.__last = l2), null !== c3 && (c3.__next = s2), null !== a2 && (a2.__prev = l2), t2.__prev = null, t2.__next = null, t2.__parent = null, o2.__size--;
  }
}
var js = Hs;
function Js(e2) {
  di(), ho(e2) && t(323, e2.__key, e2.__type);
  const n2 = e2.getLatest(), o2 = null !== n2.__parent ? n2.__parent : Zc(n2) ? n2.__slotHost : null, r2 = hi(), i2 = _i(), s2 = r2._nodeMap, l2 = i2._dirtyElements;
  null !== o2 && (function(t2, e3, n3) {
    let o3 = t2;
    for (; null !== o3; ) {
      if (n3.has(o3)) return;
      const t3 = e3.get(o3);
      if (void 0 === t3) break;
      n3.set(o3, false), o3 = null !== t3.__parent ? t3.__parent : Zc(t3) ? t3.__slotHost : null;
    }
  })(o2, s2, l2);
  const c3 = n2.__key;
  0 === i2._dirtyType && (i2._dirtyType = 1), Pi(e2) ? l2.set(c3, true) : i2._dirtyLeaves.add(c3);
}
function Vs(t2) {
  fi();
  const e2 = _i(), n2 = e2._compositionKey;
  if (t2 !== n2) {
    if (e2._compositionKey = t2, null !== n2) {
      const t3 = Ys(n2);
      null !== t3 && t3.getWritable();
    }
    if (null !== t2) {
      const e3 = Ys(t2);
      null !== e3 && e3.getWritable();
    }
  }
}
function qs() {
  if (ui()) return null;
  return _i()._compositionKey;
}
function Ys(t2, e2) {
  const n2 = (e2 || hi())._nodeMap.get(t2);
  return void 0 === n2 ? null : n2;
}
function Gs(t2, e2) {
  const n2 = Qs(t2, _i());
  return void 0 !== n2 ? Ys(n2, e2) : null;
}
function Xs(t2, e2, n2) {
  t2[`__lexicalKey_${e2._key}`] = n2;
}
function Qs(t2, e2) {
  return t2[`__lexicalKey_${e2._key}`];
}
function Zs(t2, e2) {
  let n2 = t2;
  for (; null != n2; ) {
    const t3 = Gs(n2, e2);
    if (null !== t3) return t3;
    n2 = wl(n2);
  }
  return null;
}
function tl(t2) {
  const e2 = t2._decorators, n2 = Object.assign({}, e2);
  return t2._pendingDecorators = n2, n2;
}
function el(t2) {
  return t2.read(() => nl().getTextContent());
}
function nl() {
  return hi()._nodeMap.get("root");
}
function ol(t2) {
  fi();
  const e2 = hi();
  null !== t2 && (t2.dirty = true, t2.setCachedNodes(null), ur(t2) && _i()._slotsUsed && Or(t2)), e2._selection = t2;
}
function rl() {
  fi();
  ht(_i());
}
function il(t2) {
  const e2 = (function(t3, e3) {
    let n2 = t3;
    for (; null != n2; ) {
      const t4 = Qs(n2, e3);
      if (void 0 !== t4) return t4;
      n2 = wl(n2);
    }
    return null;
  })(t2, _i());
  return null === e2 ? null : Ys(e2);
}
function sl(t2) {
  return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(t2);
}
function ll(t2) {
  const e2 = [];
  for (let n2 = t2; null !== n2; n2 = n2._parentEditor) e2.push(n2);
  return e2;
}
function cl() {
  return Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 5);
}
function al(t2) {
  return zs(t2) ? t2.nodeValue : null;
}
function ul(t2, e2, n2) {
  const o2 = Jl(Il(e2));
  if (null === o2) return;
  const r2 = nc(o2, e2._rootElement), i2 = r2.anchorNode;
  let { anchorOffset: s2, focusOffset: l2 } = r2;
  if (null !== i2) {
    let e3 = al(i2);
    const o3 = Zs(i2);
    if (null !== e3 && Xo(o3)) {
      if ((e3 === A || e3 === F) && n2) {
        const t3 = n2.length;
        e3 = n2, s2 = t3, l2 = t3;
      }
      null !== e3 && fl(o3, e3, s2, l2, t2);
    }
  }
}
function fl(t2, e2, n2, o2, r2) {
  let i2 = t2;
  if (i2.isAttached() && (r2 || !i2.isDirty())) {
    const s2 = i2.isComposing();
    if (i2.isToken() && s2) return;
    let c3 = e2;
    if ((s2 || r2) && (e2.endsWith(A) && (c3 = e2.slice(0, -A.length)), r2)) {
      const t3 = F;
      let e3;
      for (; -1 !== (e3 = c3.indexOf(t3)); ) c3 = c3.slice(0, e3) + c3.slice(e3 + t3.length), null !== n2 && n2 > e3 && (n2 = Math.max(e3, n2 - t3.length)), null !== o2 && o2 > e3 && (o2 = Math.max(e3, o2 - t3.length));
    }
    const u2 = i2.getTextContent();
    if (r2 || c3 !== u2) {
      const e3 = Kr();
      if ("" === c3) {
        if (Vs(null), a || l || d) i2.remove();
        else {
          const t3 = _i();
          dl(i2, "", e3), setTimeout(() => {
            t3.update(() => {
              i2.isAttached() && "" === i2.getTextContent() && i2.remove();
            });
          }, 20);
        }
        return;
      }
      const r3 = i2.getParent(), u3 = zr(), f3 = i2.getTextContentSize(), h3 = qs(), g3 = i2.getKey();
      if (i2.isToken() && !s2 || null !== h3 && g3 === h3 && !s2 || ur(u3) && (null !== r3 && !r3.canInsertTextBefore() && 0 === u3.anchor.offset || u3.anchor.key === t2.__key && 0 === u3.anchor.offset && !i2.canInsertTextBefore() && !s2 || u3.focus.key === t2.__key && u3.focus.offset === f3 && !i2.canInsertTextAfter() && !s2)) return void i2.markDirty();
      if (!ur(e3) || null === n2 || null === o2) return void dl(i2, c3, e3);
      if (e3.setTextNodeRange(i2, n2, i2, o2), i2.isSegmented()) {
        const t3 = Go(i2.getTextContent());
        i2.replace(t3), i2 = t3;
      }
      dl(i2, c3, e3);
    }
  }
}
function dl(t2, e2, n2) {
  if (t2.setTextContent(e2), ur(n2)) {
    const e3 = t2.getKey();
    let o2 = false;
    for (const r2 of ["anchor", "focus"]) {
      const i2 = n2[r2];
      "text" === i2.type && i2.key === e3 && (i2.offset = Ka(t2, i2.offset, "clamp"), o2 = true);
    }
    o2 && (n2._cachedNodes = null, n2._cachedIsBackward = null);
  }
}
function hl(t2, e2, n2) {
  const o2 = e2[n2] || false;
  return "any" === o2 || o2 === t2[n2];
}
function gl(t2, e2) {
  return hl(t2, e2, "altKey") && hl(t2, e2, "ctrlKey") && hl(t2, e2, "shiftKey") && hl(t2, e2, "metaKey");
}
function _l(t2, e2, n2) {
  if (!gl(t2, n2)) return false;
  if (t2.key.toLowerCase() === e2.toLowerCase()) return true;
  if (e2.length > 1) return false;
  if (1 === t2.key.length && t2.key.charCodeAt(0) <= 127) return false;
  if (t2.code.startsWith("Digit") && /^\d$/.test(e2)) return t2.code === `Digit${e2}`;
  const o2 = "Key" + e2.toUpperCase();
  return t2.code === o2;
}
var pl = { ctrlKey: !r, metaKey: r };
var yl = { altKey: r, ctrlKey: !r };
function ml(t2) {
  return "Backspace" === t2.key;
}
function xl(t2) {
  const e2 = nl();
  if (ur(t2)) {
    const e3 = t2.anchor, n2 = t2.focus, o2 = e3.getNode();
    if (Bi(o2)) return e3.set(o2.getKey(), 0, "element"), n2.set(o2.getKey(), o2.getChildrenSize(), "element"), It(t2), t2;
    const r2 = o2.getTopLevelElementOrThrow(), i2 = r2.getParent();
    if (null === i2) return Pi(r2) && (e3.set(r2.getKey(), 0, "element"), n2.set(r2.getKey(), r2.getChildrenSize(), "element"), It(t2)), t2;
    const s2 = i2;
    return e3.set(s2.getKey(), 0, "element"), n2.set(s2.getKey(), s2.getChildrenSize(), "element"), It(t2), t2;
  }
  {
    const t3 = e2.select(0, e2.getChildrenSize());
    return ol(It(t3)), t3;
  }
}
function Cl(t2, e2) {
  void 0 === t2.__lexicalClassNameCache && (t2.__lexicalClassNameCache = {});
  const n2 = t2.__lexicalClassNameCache, o2 = n2[e2];
  if (void 0 !== o2) return o2;
  const r2 = t2[e2];
  if ("string" == typeof r2) {
    const t3 = ku(r2);
    return n2[e2] = t3, t3;
  }
  return r2;
}
function Sl(e2, n2, o2, r2, i2) {
  if (0 === o2.size) return;
  const s2 = r2.__type, l2 = r2.__key, c3 = n2.get(s2);
  void 0 === c3 && t(33, s2);
  const a2 = c3.klass;
  let u2 = e2.get(a2);
  void 0 === u2 && (u2 = /* @__PURE__ */ new Map(), e2.set(a2, u2));
  const f3 = u2.get(l2), d2 = "destroyed" === f3 && "created" === i2;
  (void 0 === f3 || d2) && u2.set(l2, d2 ? "updated" : i2);
}
function vl(t2) {
  const e2 = t2.getType(), n2 = hi();
  if (n2._readOnly) {
    const t3 = Ac(n2).get(e2);
    return t3 ? Array.from(t3.values()) : [];
  }
  const o2 = n2._nodeMap, r2 = [];
  for (const [, n3] of o2) n3 instanceof t2 && n3.__type === e2 && n3.isAttached() && r2.push(n3);
  return r2;
}
function Tl(t2, e2, n2) {
  const o2 = t2.getParent();
  let r2 = n2, i2 = t2;
  return null !== o2 && (e2 && 0 === n2 ? (r2 = i2.getIndexWithinParent(), i2 = o2) : e2 || n2 !== i2.getChildrenSize() || (r2 = i2.getIndexWithinParent() + 1, i2 = o2)), i2.getChildAtIndex(e2 ? r2 - 1 : r2);
}
function kl(t2, e2) {
  const n2 = t2.offset;
  if ("element" === t2.type) {
    return Tl(t2.getNode(), e2, n2);
  }
  {
    const o2 = t2.getNode();
    if (e2 && 0 === n2 || !e2 && n2 === o2.getTextContentSize()) {
      const t3 = e2 ? o2.getPreviousSibling() : o2.getNextSibling();
      return null === t3 ? Tl(o2.getParentOrThrow(), e2, o2.getIndexWithinParent() + (e2 ? 0 : 1)) : t3;
    }
  }
  return null;
}
function bl(t2) {
  const e2 = Il(t2).event, n2 = e2 && e2.inputType;
  return "insertFromPaste" === n2 || "insertFromPasteAsQuotation" === n2;
}
function Nl(t2, e2, ...n2) {
  return Ei(t2, e2, n2[0], t2);
}
function El(e2, n2) {
  const o2 = e2._keyToDOMMap.get(n2);
  return void 0 === o2 && t(75, n2), o2;
}
function wl(t2) {
  const e2 = t2.assignedSlot || t2.parentElement;
  if (null !== e2) return e2;
  const n2 = t2.parentNode;
  return ql(n2) ? n2.host : null;
}
function Ol(t2) {
  return Bs(t2) ? t2 : gc(t2) ? t2.ownerDocument : null;
}
function Ml(t2) {
  return _i()._updateTags.has(t2);
}
function Al(t2) {
  fi();
  _i()._updateTags.add(t2);
}
function Dl(t2) {
  fi();
  _i()._deferred.push(t2);
}
function Fl(t2, e2) {
  let n2 = t2.getParent();
  for (; null !== n2; ) {
    if (n2.is(e2)) return true;
    n2 = n2.getParent();
  }
  return false;
}
function Pl(t2) {
  const e2 = Ol(t2);
  return e2 ? e2.defaultView : null;
}
function Il(e2) {
  const n2 = e2._window;
  return null === n2 && t(78), n2;
}
function Ll(t2) {
  return Pi(t2) && t2.isInline() || Ki(t2) && t2.isInline();
}
function Kl(t2) {
  let e2 = t2.getLatest();
  for (; null !== e2; ) {
    if (null !== ta(e2) && Pi(e2)) return e2;
    const t3 = e2.getParentOrThrow();
    if (Bl(t3)) return t3;
    e2 = t3;
  }
  return e2;
}
function zl(t2) {
  return Pi(t2) && t2.isShadowRoot();
}
function Bl(t2) {
  return Bi(t2) || zl(t2);
}
function Rl(t2, e2 = false) {
  const n2 = t2.constructor.clone(t2, Ts);
  return Us(n2, null), n2.afterCloneFrom(t2), e2 || n2.resetOnCopyNodeFrom(t2), n2;
}
function Wl(e2) {
  const n2 = _i(), o2 = e2.getType(), r2 = Es(n2, o2);
  void 0 === r2 && t(200, e2.constructor.name, o2);
  const { replace: i2, replaceWithKlass: s2 } = r2;
  if (null !== i2) {
    const n3 = i2(e2), r3 = n3.constructor;
    return null !== s2 ? n3 instanceof s2 || t(201, s2.name, s2.getType(), r3.name, r3.getType(), e2.constructor.name, o2) : n3 instanceof e2.constructor && r3 !== e2.constructor || t(202, r3.name, r3.getType(), e2.constructor.name, o2), n3.__key === e2.__key && t(203, e2.constructor.name, o2, r3.name, r3.getType()), n3;
  }
  return e2;
}
function $l(e2, n2) {
  !Bi(e2.getParent()) || Pi(n2) || Ki(n2) || t(99);
}
function Ul(e2) {
  const n2 = Ys(e2);
  return null === n2 && t(63, e2), n2;
}
function Hl(t2) {
  if (!t2 || t2.isInline()) return false;
  if (Ki(t2)) return true;
  if (Pi(t2)) {
    if (t2.isShadowRoot()) {
      const e2 = t2.getParent();
      return !(Pi(e2) && e2.isShadowRoot());
    }
    return !t2.canBeEmpty();
  }
  return false;
}
function jl(t2, e2, n2) {
  n2.style.removeProperty("caret-color"), e2._blockCursorElement = null;
  const o2 = t2.parentElement;
  null !== o2 && o2.removeChild(t2);
}
function Jl(t2) {
  return n ? (t2 || window).getSelection() : null;
}
function Vl(t2) {
  const e2 = Pl(t2);
  return e2 ? e2.getSelection() : null;
}
function ql(t2) {
  return pc(t2) && "host" in t2;
}
var Yl = [];
function Gl(t2) {
  const e2 = t2.getRootNode();
  if (e2 === t2 || !ql(e2)) return Yl;
  const n2 = [e2];
  let o2 = e2.host;
  for (; ; ) {
    const t3 = o2.getRootNode();
    if (t3 === o2 || !ql(t3)) break;
    n2.push(t3), o2 = t3.host;
  }
  return n2;
}
function* Xl(t2) {
  const e2 = [t2];
  let n2;
  for (; n2 = e2.pop(); ) {
    yield* n2.querySelectorAll('[data-lexical-editor="true"]');
    const t3 = (Bs(n2) ? n2 : n2.ownerDocument).createTreeWalker(n2, NodeFilter.SHOW_ELEMENT);
    let o2;
    for (; o2 = t3.nextNode(); ) o2.shadowRoot && e2.push(o2.shadowRoot);
  }
}
function Ql(t2) {
  return null !== t2 ? t2.ownerDocument : document;
}
function Zl() {
  const t2 = mi();
  return Ql(null !== t2 ? t2._rootElement : null);
}
function tc(t2, e2) {
  if (null === e2 || "function" != typeof t2.getComposedRanges) return null;
  const n2 = Gl(e2);
  if (0 === n2.length) return null;
  const o2 = t2.getComposedRanges;
  try {
    const e3 = o2.call(t2, { shadowRoots: n2 })[0];
    if (void 0 !== e3) return e3;
  } catch (t3) {
  }
  try {
    const e3 = o2.apply(t2, n2)[0];
    if (void 0 !== e3) return e3;
  } catch (t3) {
  }
  return null;
}
function ec(t2, e2) {
  const n2 = tc(t2, e2);
  if (null !== n2) {
    const t3 = rc(n2);
    if (null !== t3) return t3;
  }
  return t2.rangeCount > 0 ? t2.getRangeAt(0) : null;
}
function nc(t2, e2) {
  const n2 = tc(t2, e2);
  return null === n2 ? t2 : ic(n2, sc(t2));
}
function oc(t2, e2) {
  const n2 = tc(t2, e2);
  if (null === n2) return { points: t2, range: t2.rangeCount > 0 ? t2.getRangeAt(0) : null };
  const o2 = rc(n2) ?? (t2.rangeCount > 0 ? t2.getRangeAt(0) : null);
  return { points: ic(n2, sc(t2)), range: o2 };
}
function rc(t2) {
  const e2 = t2.startContainer.ownerDocument;
  if (null === e2) return null;
  const n2 = e2.createRange();
  try {
    return n2.setStart(t2.startContainer, t2.startOffset), n2.setEnd(t2.endContainer, t2.endOffset), n2;
  } catch (t3) {
    return null;
  }
}
function ic(t2, e2) {
  const { startContainer: n2, startOffset: o2, endContainer: r2, endOffset: i2 } = t2;
  return "backward" === e2 ? { anchorNode: r2, anchorOffset: i2, direction: e2, focusNode: n2, focusOffset: o2 } : { anchorNode: n2, anchorOffset: o2, direction: e2, focusNode: r2, focusOffset: i2 };
}
function sc(t2) {
  return t2.direction;
}
function lc(t2) {
  const e2 = t2.getRootNode();
  return Bs(e2) || ql(e2) ? e2.activeElement : null;
}
function cc(t2) {
  let e2 = t2.activeElement;
  for (; null !== e2 && null !== e2.shadowRoot; ) {
    const t3 = e2.shadowRoot.activeElement;
    if (null === t3) break;
    e2 = t3;
  }
  return e2;
}
function ac(t2) {
  const e2 = t2.target;
  if (null !== e2 && gc(e2) && null !== e2.shadowRoot && "function" == typeof t2.composedPath) {
    const e3 = t2.composedPath();
    if (e3.length > 0) return e3[0];
  }
  return e2;
}
function uc(e2, n2) {
  let o2 = e2.getChildAtIndex(n2);
  null == o2 && (o2 = e2), Bl(e2) && t(102);
  const r2 = (e3) => {
    const n3 = e3.getParentOrThrow(), i3 = Bl(n3), s3 = e3 !== o2 || i3 ? Rl(e3) : e3;
    if (i3) return Pi(e3) && Pi(s3) || t(133), e3.insertAfter(s3), [e3, s3, s3];
    {
      const [t2, o3, i4] = r2(n3), l2 = e3.getNextSiblings();
      return i4.append(s3, ...l2), [t2, o3, s3];
    }
  }, [i2, s2] = r2(o2);
  return [i2, s2];
}
function fc(t2) {
  return gc(t2) && "A" === t2.tagName;
}
function dc(t2) {
  return gc(t2) && "TR" === t2.tagName;
}
function hc(t2) {
  return gc(t2) && ("TD" === t2.tagName || "TH" === t2.tagName);
}
function gc(t2) {
  return _c(t2) && 1 === t2.nodeType;
}
function _c(t2) {
  return "object" == typeof t2 && null !== t2 && "nodeType" in t2 && "number" == typeof t2.nodeType;
}
function pc(t2) {
  return _c(t2) && 11 === t2.nodeType;
}
var yc = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|mark|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/i;
function mc(t2) {
  return !(!gc(t2) || !t2.style.display.startsWith("inline")) || yc.test(t2.nodeName);
}
var xc = /^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/i;
function Cc(t2) {
  return (!gc(t2) || !t2.style.display.startsWith("inline")) && xc.test(t2.nodeName);
}
function Sc(t2) {
  if (Ki(t2) && !t2.isInline()) return true;
  if (!Pi(t2) || Bl(t2)) return false;
  const e2 = t2.getFirstChild(), n2 = null === e2 || Yi(e2) || Xo(e2) || e2.isInline();
  return !t2.isInline() && false !== t2.canBeEmpty() && n2;
}
function vc() {
  return _i();
}
function Tc(t2 = vc()) {
  return t2._config.dom || ps;
}
function kc(e2, n2, o2 = vc()) {
  const r2 = Tc(o2).$getDOMSlot(e2, n2, o2);
  return Pi(e2) && (Ec(r2) || t(344, e2.getKey(), e2.getType())), r2;
}
function bc(t2, e2, n2, o2) {
  const r2 = t2.read("latest", () => {
    const o3 = Ys(e2);
    return null !== o3 ? (function(t3, e3, n3 = vc()) {
      const o4 = sa(t3, e3);
      if (null === o4) return null;
      const r3 = n3.getElementByKey(o4.getKey());
      return null !== r3 ? r3.parentElement : null;
    })(o3, n2, t2) : null;
  });
  return null !== r2 && (r2.parentElement !== o2 && o2.appendChild(r2), r2.style.display = ""), r2;
}
function Nc(t2, e2, n2) {
  n2.style.display = "none";
  const o2 = t2.getElementByKey(e2);
  null !== o2 && n2.parentElement !== o2 && o2.insertBefore(n2, o2.firstChild);
}
function Ec(t2) {
  return t2 instanceof G;
}
function wc(t2, e2, n2 = vc()) {
  return Rs(kc(t2, e2, n2).element);
}
var Oc = /* @__PURE__ */ new WeakMap();
var Mc = /* @__PURE__ */ new Map();
function Ac(e2) {
  if (!e2._readOnly && e2.isEmpty()) return Mc;
  e2._readOnly || t(192);
  let n2 = Oc.get(e2);
  return n2 || (n2 = (function(t2) {
    const e3 = /* @__PURE__ */ new Map();
    for (const [n3, o2] of t2._nodeMap) {
      const t3 = o2.__type;
      let r2 = e3.get(t3);
      r2 || (r2 = /* @__PURE__ */ new Map(), e3.set(t3, r2)), r2.set(n3, o2);
    }
    return e3;
  })(e2), Oc.set(e2, n2)), n2;
}
function Dc(t2) {
  const e2 = t2.constructor.clone(t2, Ts);
  return e2.afterCloneFrom(t2), e2;
}
function Fc(t2) {
  return (e2 = Dc(t2))[fo] = true, e2;
  var e2;
}
function Pc(t2, e2) {
  const n2 = t2.getAttribute("data-lexical-indent");
  if (null !== n2) {
    const t3 = parseInt(n2, 10);
    if (Number.isFinite(t3) && t3 >= 0) return void e2.setIndent(t3);
  }
  const o2 = parseInt(t2.style.paddingInlineStart, 10) || 0, r2 = Math.round(o2 / 40);
  e2.setIndent(r2);
}
function Ic(t2, e2) {
  const n2 = e2.getAttribute("dir");
  return "ltr" === n2 || "rtl" === n2 ? t2.setDirection(n2) : t2;
}
function Lc(t2, e2) {
  const n2 = e2.style.textAlign;
  return n2 && n2 in R ? t2.setFormat(n2) : t2;
}
function Kc(t2, e2) {
  t2.__lexicalUnmanaged = true, e2 && void 0 !== e2.captureSelection && (t2.__lexicalCapturedSelection = e2.captureSelection);
}
function zc(t2) {
  return true === t2.__lexicalUnmanaged;
}
function Bc(t2, e2 = vc()) {
  const n2 = e2.isEditable();
  t2.contentEditable = n2 ? "true" : "false", n2 ? t2.__lexicalEditor = e2 : delete t2.__lexicalEditor;
}
function Rc(t2, e2) {
  let n2 = t2;
  for (; null != n2; ) {
    if (true === n2.__lexicalCapturedSelection) return true;
    if (gc(n2) && n2.hasAttribute("data-lexical-slot")) return false;
    if (void 0 !== Qs(n2, e2)) return false;
    n2 = wl(n2);
  }
  return false;
}
function Wc(t2, e2) {
  return (function(t3, e3) {
    return Object.prototype.hasOwnProperty.call(t3, e3);
  })(t2, e2) && t2[e2] !== _o[e2];
}
var $c = /* @__PURE__ */ new WeakMap();
var Uc = Symbol("lexical.synthesizedGetType");
function Hc(e2) {
  const n2 = $c.get(e2);
  if (n2) return n2;
  const o2 = null != e2.prototype && j in e2.prototype ? e2.prototype[j]() : void 0, r2 = (function(e3) {
    if (!(e3 === _o || e3.prototype instanceof _o)) {
      let n3 = "<unknown>", o3 = "<unknown>";
      try {
        n3 = e3.getType();
      } catch (t2) {
      }
      try {
        Cs.version && (o3 = JSON.parse(Cs.version));
      } catch (t2) {
      }
      t(290, e3.name, n3, o3);
    }
    return e3 === Li || e3 === Fi || e3 === _o;
  })(e2), i2 = !r2 && Wc(e2, "getType") ? e2.getType : void 0, s2 = i2 && !(Uc in i2) ? i2.call(e2) : void 0;
  let l2, c3 = s2;
  if (o2) if (s2) l2 = o2[s2];
  else {
    for (const [t2, e3] of Object.entries(o2)) c3 = t2, l2 = e3;
    if (!l2) for (const t2 of Object.getOwnPropertySymbols(o2)) {
      const e3 = o2[t2];
      if (e3) {
        l2 = e3;
        break;
      }
    }
  }
  if (!r2 && c3) {
    if (!Wc(e2, "getType")) {
      const t2 = e2, n3 = function() {
        return this !== t2 ? _o.getType.call(this) : c3;
      };
      n3[Uc] = true, e2.getType = n3;
    }
    if (Wc(e2, "clone") || (e2.clone = (t2, n3) => {
      vs(t2);
      const o3 = new e2();
      return n3 !== Ts && o3.afterCloneFrom(t2), o3;
    }), Wc(e2, "importJSON") || (e2.importJSON = l2 && l2.$importJSON || ((t2) => new e2().updateFromJSON(t2))), !Wc(e2, "importDOM") && l2) {
      const { importDOM: t2 } = l2;
      t2 && (e2.importDOM = () => t2);
    }
  }
  const a2 = { klass: e2, ownNodeConfig: l2, ownNodeType: c3 };
  return $c.set(e2, a2), a2;
}
function* jc(t2) {
  for (let e2 = t2; e2 && (e2 === _o || po(e2.prototype)); ) {
    const t3 = Hc(e2);
    yield t3, e2 = t3.ownNodeConfig && t3.ownNodeConfig.extends || Gc(e2);
  }
}
function Jc(t2) {
  const e2 = /* @__PURE__ */ new Map(), n2 = /* @__PURE__ */ new Map();
  for (const o2 of t2) {
    const { ownNodeType: t3 } = Hc(o2);
    t3 && (n2.set(t3, o2), e2.set(t3, /* @__PURE__ */ new Set()));
  }
  for (const [t3, o2] of n2) for (const { ownNodeType: n3 } of jc(o2)) {
    const o3 = n3 && e2.get(n3);
    o3 && o3.add(t3);
  }
  return e2;
}
function Vc(t2) {
  const e2 = vc();
  fi();
  return new (e2.resolveRegisteredNodeAfterReplacements(e2.getRegisteredNode(t2))).klass();
}
var qc = (t2, e2) => {
  let n2 = t2;
  for (; null != n2 && !Bi(n2); ) {
    if (e2(n2)) return n2;
    n2 = n2.getParent();
  }
  return null;
};
function Yc(e2, n2) {
  const o2 = [];
  let r2 = e2.__first;
  for (; null !== r2; ) {
    const e3 = null === n2 ? Ys(r2) : n2.get(r2);
    null == e3 && t(174), o2.push(r2), r2 = e3.__next;
  }
  return o2;
}
function Gc(t2) {
  const e2 = Object.getPrototypeOf(t2);
  if ("function" == typeof e2 && e2 !== Function.prototype) return e2;
  const n2 = t2.prototype && Object.getPrototypeOf(t2.prototype);
  return n2 ? n2.constructor : null;
}
var Xc = /* @__PURE__ */ new Map();
function Qc(t2) {
  return Pi(t2) || Ki(t2);
}
function Zc(t2) {
  return Pi(t2) || Ki(t2);
}
function ta(t2) {
  const e2 = t2.getLatest();
  return Zc(e2) ? e2.__slotHost : null;
}
function ea(e2) {
  const n2 = ta(e2);
  if (null === n2) return null;
  const o2 = Ys(n2);
  return Pi(o2) || Ki(o2) || t(370), o2;
}
function na(t2) {
  const e2 = ea(t2);
  if (null === e2) return null;
  const n2 = t2.getLatest().__key;
  for (const [t3, o2] of ra(e2)) if (o2 === n2) return t3;
  return null;
}
function oa(t2) {
  let e2 = t2.getLatest();
  for (; null !== e2; ) {
    if (null !== ta(e2)) return e2;
    e2 = e2.getParent();
  }
  return null;
}
function ra(t2) {
  const e2 = t2.getLatest();
  return Qc(e2) && null !== e2.__slots ? e2.__slots : Xc;
}
function ia(t2) {
  return Array.from(ra(t2).keys());
}
function sa(t2, e2) {
  const n2 = ra(t2).get(e2);
  return void 0 === n2 ? null : Ys(n2);
}
var la = ["__proto__", "constructor", "prototype"];
var ca = Symbol("slotMapOwner");
function aa(t2) {
  let e2 = t2.__slots;
  return null !== e2 && e2[ca] === t2 || (e2 = new Map(e2), e2[ca] = t2, t2.__slots = e2), e2;
}
var ua = /* @__PURE__ */ new WeakMap();
var fa = [];
function da(t2) {
  for (const { ownNodeConfig: e2 } of jc(t2)) {
    const t3 = e2 && e2.slots;
    if (t3) return t3;
  }
  return fa;
}
function ha(t2) {
  let e2 = "";
  for (const n2 of ia(t2)) {
    const o2 = sa(t2, n2);
    null !== o2 && (e2 += o2.getTextContent());
  }
  return e2;
}
function ga(t2, e2, n2) {
  const o2 = n2.get(t2), r2 = n2.get(e2);
  return void 0 !== o2 ? void 0 !== r2 ? o2 - r2 : -1 : void 0 !== r2 ? 1 : t2 < e2 ? -1 : t2 > e2 ? 1 : 0;
}
function _a(e2) {
  const n2 = e2.__slots;
  if (null === n2 || n2.size < 2) return;
  const o2 = (function(e3) {
    let n3 = ua.get(e3);
    if (void 0 === n3) {
      const o3 = da(e3), r3 = /* @__PURE__ */ new Map();
      for (const n4 of o3) la.includes(n4) && t(371, e3.name, n4), r3.has(n4) && t(372, e3.name, n4), r3.set(n4, r3.size);
      n3 = r3, ua.set(e3, n3);
    }
    return n3;
  })(e2.constructor);
  let r2 = null, i2 = true;
  for (const t2 of n2.keys()) {
    if (null !== r2 && ga(r2, t2, o2) > 0) {
      i2 = false;
      break;
    }
    r2 = t2;
  }
  if (i2) return;
  const s2 = Array.from(n2).sort(([t2], [e3]) => ga(t2, e3, o2));
  n2.clear();
  for (const [t2, e3] of s2) n2.set(t2, e3);
}
function pa(e2, n2, o2) {
  "__proto__" !== n2 && "constructor" !== n2 && "prototype" !== n2 || t(373, n2);
  const r2 = e2.getLatest();
  if (null !== r2.__slots && r2.__slots.get(n2) === o2.getLatest().__key) return r2;
  (!Pi(o2) && !Ki(o2) || o2.isInline()) && t(374, o2.__key);
  const i2 = e2.getWritable(), s2 = aa(i2), l2 = s2.get(n2);
  void 0 !== l2 && xa(l2);
  const c3 = o2.getWritable(), a2 = ea(c3);
  if (null !== a2) {
    const t2 = na(c3);
    null !== t2 && aa(a2.getWritable()).delete(t2), c3.__slotHost = null;
  }
  return Hs(c3), c3.__slotHost = i2.__key, s2.set(n2, c3.__key), _a(i2), (function() {
    const t2 = vc();
    t2._slotsUsed = true, t2._pendingEditorState && (t2._pendingEditorState._slotsUsed = true);
  })(), i2;
}
function ya(t2, e2) {
  const n2 = t2.getWritable();
  if (null === n2.__slots) return n2;
  const o2 = n2.__slots.get(e2);
  return void 0 !== o2 && (xa(o2), aa(n2).delete(e2)), n2;
}
function ma(t2, e2) {
}
function xa(e2) {
  const n2 = Ys(e2);
  if (null === n2) return;
  const o2 = n2.getWritable();
  Zc(o2) || t(377, e2), o2.__slotHost = null, o2.remove();
}
var Ca = { next: "previous", previous: "next" };
var Sa = class {
  origin;
  constructor(t2) {
    this.origin = t2;
  }
  [Symbol.iterator]() {
    return qa({ hasNext: Ma, initial: this.getAdjacentCaret(), map: (t2) => t2, step: (t2) => t2.getAdjacentCaret() });
  }
  getAdjacentCaret() {
    return Ia(this.getNodeAtCaret(), this.direction);
  }
  getSiblingCaret() {
    return Ia(this.origin, this.direction);
  }
  remove() {
    const t2 = this.getNodeAtCaret();
    return t2 && t2.remove(), this;
  }
  replaceOrInsert(t2, e2) {
    const n2 = this.getNodeAtCaret();
    return t2.is(this.origin) || t2.is(n2) || (null === n2 ? this.insert(t2) : n2.replace(t2, e2)), this;
  }
  splice(e2, n2, o2 = "next") {
    const r2 = o2 === this.direction ? n2 : Array.from(n2).reverse();
    let i2 = this;
    const s2 = this.getParentAtCaret(), l2 = /* @__PURE__ */ new Map();
    for (let t2 = i2.getAdjacentCaret(); null !== t2 && l2.size < e2; t2 = t2.getAdjacentCaret()) {
      const e3 = t2.origin.getWritable();
      l2.set(e3.getKey(), e3);
    }
    for (const e3 of r2) {
      if (l2.size > 0) {
        const n3 = i2.getNodeAtCaret();
        if (n3) if (l2.delete(n3.getKey()), l2.delete(e3.getKey()), n3.is(e3) || i2.origin.is(e3)) ;
        else {
          const t2 = e3.getParent();
          t2 && t2.is(s2) && e3.remove(), n3.replace(e3);
        }
        else null === n3 && t(263, Array.from(l2).join(" "));
      } else i2.insert(e3);
      i2 = Ia(e3, this.direction);
    }
    for (const t2 of l2.values()) t2.remove();
    return this;
  }
};
var va = class _va extends Sa {
  type = "child";
  getLatest() {
    const t2 = this.origin.getLatest();
    return t2 === this.origin ? this : Ba(t2, this.direction);
  }
  getParentCaret(t2 = "root") {
    return Ia(ba(this.getParentAtCaret(), t2), this.direction);
  }
  getFlipped() {
    const t2 = ka(this.direction);
    return Ia(this.getNodeAtCaret(), t2) || Ba(this.origin, t2);
  }
  getParentAtCaret() {
    return this.origin;
  }
  getChildCaret() {
    return this;
  }
  isSameNodeCaret(t2) {
    return t2 instanceof _va && this.direction === t2.direction && this.origin.is(t2.origin);
  }
  isSamePointCaret(t2) {
    return this.isSameNodeCaret(t2);
  }
};
var Ta = { root: Bi, shadowRoot: Bl };
function ka(t2) {
  return Ca[t2];
}
function ba(t2, e2 = "root") {
  return null === t2 || Ta[e2](t2) ? null : null === ta(t2) ? t2 : null;
}
var Na = class _Na extends Sa {
  type = "sibling";
  getLatest() {
    const t2 = this.origin.getLatest();
    return t2 === this.origin ? this : Ia(t2, this.direction);
  }
  getSiblingCaret() {
    return this;
  }
  getParentAtCaret() {
    return this.origin.getParent();
  }
  getChildCaret() {
    return Pi(this.origin) ? Ba(this.origin, this.direction) : null;
  }
  getParentCaret(t2 = "root") {
    return Ia(ba(this.getParentAtCaret(), t2), this.direction);
  }
  getFlipped() {
    const t2 = ka(this.direction);
    return Ia(this.getNodeAtCaret(), t2) || Ba(this.origin.getParentOrThrow(), t2);
  }
  isSamePointCaret(t2) {
    return t2 instanceof _Na && this.direction === t2.direction && this.origin.is(t2.origin);
  }
  isSameNodeCaret(t2) {
    return (t2 instanceof _Na || t2 instanceof Ea) && this.direction === t2.direction && this.origin.is(t2.origin);
  }
};
var Ea = class _Ea extends Sa {
  type = "text";
  offset;
  constructor(t2, e2) {
    super(t2), this.offset = e2;
  }
  getLatest() {
    const t2 = this.origin.getLatest();
    return t2 === this.origin ? this : La(t2, this.direction, this.offset);
  }
  getParentAtCaret() {
    return this.origin.getParent();
  }
  getChildCaret() {
    return null;
  }
  getParentCaret(t2 = "root") {
    return Ia(ba(this.getParentAtCaret(), t2), this.direction);
  }
  getFlipped() {
    return La(this.origin, ka(this.direction), this.offset);
  }
  isSamePointCaret(t2) {
    return t2 instanceof _Ea && this.direction === t2.direction && this.origin.is(t2.origin) && this.offset === t2.offset;
  }
  isSameNodeCaret(t2) {
    return (t2 instanceof Na || t2 instanceof _Ea) && this.direction === t2.direction && this.origin.is(t2.origin);
  }
  getSiblingCaret() {
    return Ia(this.origin, this.direction);
  }
};
function wa(t2) {
  return t2 instanceof Ea;
}
function Oa(t2) {
  return t2 instanceof Sa;
}
function Ma(t2) {
  return t2 instanceof Na;
}
function Aa(t2) {
  return t2 instanceof va;
}
var Da = { next: class extends Ea {
  direction = "next";
  getNodeAtCaret() {
    return this.origin.getNextSibling();
  }
  insert(t2) {
    return this.origin.insertAfter(t2), this;
  }
}, previous: class extends Ea {
  direction = "previous";
  getNodeAtCaret() {
    return this.origin.getPreviousSibling();
  }
  insert(t2) {
    return this.origin.insertBefore(t2), this;
  }
} };
var Fa = { next: class extends Na {
  direction = "next";
  getNodeAtCaret() {
    return this.origin.getNextSibling();
  }
  insert(t2) {
    return this.origin.insertAfter(t2), this;
  }
}, previous: class extends Na {
  direction = "previous";
  getNodeAtCaret() {
    return this.origin.getPreviousSibling();
  }
  insert(t2) {
    return this.origin.insertBefore(t2), this;
  }
} };
var Pa = { next: class extends va {
  direction = "next";
  getNodeAtCaret() {
    return this.origin.getFirstChild();
  }
  insert(t2) {
    return this.origin.splice(0, 0, [t2]), this;
  }
}, previous: class extends va {
  direction = "previous";
  getNodeAtCaret() {
    return this.origin.getLastChild();
  }
  insert(t2) {
    return this.origin.splice(this.origin.getChildrenSize(), 0, [t2]), this;
  }
} };
function Ia(t2, e2) {
  return t2 ? new Fa[e2](t2) : null;
}
function La(t2, e2, n2) {
  return t2 ? new Da[e2](t2, Ka(t2, n2)) : null;
}
function Ka(t2, n2, o2 = "error") {
  const r2 = t2.getTextContentSize();
  let i2 = "next" === n2 ? r2 : "previous" === n2 ? 0 : n2;
  return (i2 < 0 || i2 > r2) && ("clamp" !== o2 && e(284, String(n2), String(r2), t2.getKey()), i2 = i2 < 0 ? 0 : r2), i2;
}
function za(t2, e2) {
  return new Ua(t2, e2);
}
function Ba(t2, e2) {
  return Pi(t2) ? new Pa[e2](t2) : null;
}
function Ra(t2) {
  return t2 && t2.getChildCaret() || t2;
}
function Wa(t2) {
  return t2 && Ra(t2.getAdjacentCaret());
}
var $a = class _$a {
  type = "node-caret-range";
  direction;
  anchor;
  focus;
  constructor(t2, e2, n2) {
    this.anchor = t2, this.focus = e2, this.direction = n2;
  }
  getLatest() {
    const t2 = this.anchor.getLatest(), e2 = this.focus.getLatest();
    return t2 === this.anchor && e2 === this.focus ? this : new _$a(t2, e2, this.direction);
  }
  isCollapsed() {
    return this.anchor.isSamePointCaret(this.focus);
  }
  getTextSlices() {
    const t2 = (t3) => {
      const e3 = this[t3].getLatest();
      return wa(e3) ? (function(t4, e4) {
        const { direction: n3, origin: o2 } = t4, r2 = Ka(o2, "focus" === e4 ? ka(n3) : n3);
        return za(t4, r2 - t4.offset);
      })(e3, t3) : null;
    }, e2 = t2("anchor"), n2 = t2("focus");
    if (e2 && n2) {
      const { caret: t3 } = e2, { caret: o2 } = n2;
      if (t3.isSameNodeCaret(o2)) return [za(t3, o2.offset - t3.offset), null];
    }
    return [e2, n2];
  }
  iterNodeCarets(t2 = "root") {
    const e2 = wa(this.anchor) ? this.anchor.getSiblingCaret() : this.anchor.getLatest(), n2 = this.focus.getLatest(), o2 = wa(n2), r2 = (e3) => e3.isSameNodeCaret(n2) ? null : Wa(e3) || e3.getParentCaret(t2);
    return qa({ hasNext: (t3) => null !== t3 && !(o2 && n2.isSameNodeCaret(t3)), initial: e2.isSameNodeCaret(n2) ? null : r2(e2), map: (t3) => t3, step: r2 });
  }
  [Symbol.iterator]() {
    return this.iterNodeCarets("root");
  }
};
var Ua = class {
  type = "slice";
  caret;
  distance;
  constructor(t2, e2) {
    this.caret = t2, this.distance = e2;
  }
  getSliceIndices() {
    const { distance: t2, caret: { offset: e2 } } = this, n2 = e2 + t2;
    return n2 < e2 ? [n2, e2] : [e2, n2];
  }
  getTextContent() {
    const [t2, e2] = this.getSliceIndices();
    return this.caret.origin.getTextContent().slice(t2, e2);
  }
  getTextContentSize() {
    return Math.abs(this.distance);
  }
  removeTextSlice() {
    const { caret: { origin: t2, direction: e2 } } = this, [n2, o2] = this.getSliceIndices(), r2 = t2.getTextContent();
    return La(t2.setTextContent(r2.slice(0, n2) + r2.slice(o2)), e2, n2);
  }
};
function Ha(t2) {
  return t2 instanceof Ua;
}
function ja(t2) {
  return Va(t2, Ia(nl(), t2.direction));
}
function Ja(t2) {
  return Va(t2, t2);
}
function Va(e2, n2) {
  return e2.direction !== n2.direction && t(265), new $a(e2, n2, e2.direction);
}
function qa(t2) {
  const { initial: e2, hasNext: n2, step: o2, map: r2 } = t2;
  let i2 = e2;
  return { [Symbol.iterator]() {
    return this;
  }, next() {
    if (!n2(i2)) return { done: true, value: void 0 };
    const t3 = { done: false, value: r2(i2) };
    return i2 = o2(i2), t3;
  } };
}
function Ya(e2, n2) {
  const o2 = Za(e2.origin, n2.origin);
  switch (null === o2 && t(275, e2.origin.getKey(), n2.origin.getKey()), o2.type) {
    case "same": {
      const t2 = "text" === e2.type, o3 = "text" === n2.type;
      return t2 && o3 ? (function(t3, e3) {
        return Math.sign(t3 - e3);
      })(e2.offset, n2.offset) : e2.type === n2.type ? 0 : t2 ? -1 : o3 ? 1 : "child" === e2.type ? -1 : 1;
    }
    case "ancestor":
      return "child" === e2.type ? -1 : 1;
    case "descendant":
      return "child" === n2.type ? 1 : -1;
    case "branch":
      return Ga(o2);
  }
}
function Ga(t2) {
  const { a: e2, b: n2 } = t2, o2 = e2.__key, r2 = n2.__key;
  let i2 = e2, s2 = n2;
  for (; i2 && s2; i2 = i2.getNextSibling(), s2 = s2.getNextSibling()) {
    if (i2.__key === r2) return -1;
    if (s2.__key === o2) return 1;
  }
  return null === i2 ? 1 : -1;
}
function Xa(t2, e2) {
  return e2.is(t2);
}
function Qa(t2) {
  return Pi(t2) ? [t2.getLatest(), null] : [t2.getParent(), t2.getLatest()];
}
function Za(e2, n2) {
  if (e2.is(n2)) return { commonAncestor: e2, type: "same" };
  const o2 = /* @__PURE__ */ new Map();
  for (let [t2, n3] = Qa(e2); t2; n3 = t2, t2 = t2.getParent()) o2.set(t2, n3);
  for (let [r2, i2] = Qa(n2); r2; i2 = r2, r2 = r2.getParent()) {
    const s2 = o2.get(r2);
    if (void 0 !== s2) return null === s2 ? (Xa(e2, r2) || t(276), { commonAncestor: r2, type: "ancestor" }) : null === i2 ? (Xa(n2, r2) || t(277), { commonAncestor: r2, type: "descendant" }) : ((Pi(s2) || Xa(e2, s2)) && (Pi(i2) || Xa(n2, i2)) && r2.is(s2.getParent()) && r2.is(i2.getParent()) || t(278), { a: s2, b: i2, commonAncestor: r2, type: "branch" });
  }
  return null;
}
function tu(e2, n2) {
  const { type: o2, key: r2, offset: i2 } = e2, s2 = Ul(e2.key);
  return "text" === o2 ? (Xo(s2) || t(266, s2.getType(), r2), La(s2, n2, i2)) : (Pi(s2) || t(267, s2.getType(), r2), hu(s2, e2.offset, n2));
}
function eu(e2, n2) {
  const { origin: o2, direction: r2 } = n2, i2 = "next" === r2;
  wa(n2) ? e2.set(o2.getKey(), n2.offset, "text") : Ma(n2) ? Xo(o2) ? e2.set(o2.getKey(), Ka(o2, r2), "text") : e2.set(o2.getParentOrThrow().getKey(), o2.getIndexWithinParent() + (i2 ? 1 : 0), "element") : (Aa(n2) && Pi(o2) || t(268), e2.set(o2.getKey(), i2 ? 0 : o2.getChildrenSize(), "element"));
}
function nu(t2) {
  const e2 = Kr(), n2 = ur(e2) ? e2 : Fr();
  return ou(n2, t2), ol(n2), n2;
}
function ou(t2, e2) {
  eu(t2.anchor, e2.anchor), eu(t2.focus, e2.focus);
}
function ru(t2) {
  const { anchor: e2, focus: n2 } = t2, o2 = tu(e2, "next"), r2 = tu(n2, "next"), i2 = Ya(o2, r2) <= 0 ? "next" : "previous";
  return Va(fu(o2, i2), fu(r2, i2));
}
function iu(t2) {
  const { direction: e2, origin: n2 } = t2, o2 = Ia(n2, ka(e2)).getNodeAtCaret();
  return o2 ? Ia(o2, e2) : Ba(n2.getParentOrThrow(), e2);
}
function su(t2, e2 = "root") {
  const n2 = [t2];
  for (let o2 = Aa(t2) ? t2.getParentCaret(e2) : t2.getSiblingCaret(); null !== o2; o2 = o2.getParentCaret(e2)) n2.push(iu(o2));
  return n2;
}
function lu(t2) {
  return !!t2 && t2.origin.isAttached();
}
function cu(e2, n2 = "removeEmptySlices") {
  if (e2.isCollapsed()) return e2;
  const o2 = "root", r2 = "next";
  let i2 = n2;
  const s2 = du(e2, r2), l2 = su(s2.anchor, o2), c3 = su(s2.focus.getFlipped(), o2), a2 = /* @__PURE__ */ new Set(), u2 = [];
  for (const t2 of s2.iterNodeCarets(o2)) if (Aa(t2)) a2.add(t2.origin.getKey());
  else if (Ma(t2)) {
    const { origin: e3 } = t2;
    Pi(e3) && !a2.has(e3.getKey()) || u2.push(e3);
  }
  const f3 = /* @__PURE__ */ new Set();
  for (const t2 of u2) {
    const e3 = t2.getParent();
    null === e3 || a2.has(e3.getKey()) || f3.add(e3), Hs(t2);
  }
  for (const t2 of f3) !t2.canBeEmpty() && !Bl(t2) && t2.isEmpty() && t2.isAttached() && t2.remove();
  for (const t2 of s2.getTextSlices()) {
    if (!t2) continue;
    const { origin: e3 } = t2.caret, n3 = e3.getTextContentSize(), o3 = iu(Ia(e3, r2)), s3 = e3.getMode();
    if (Math.abs(t2.distance) === n3 && "removeEmptySlices" === i2 || "token" === s3 && 0 !== t2.distance) o3.remove();
    else if (0 !== t2.distance) {
      i2 = "removeEmptySlices";
      let e4 = t2.removeTextSlice();
      const n4 = t2.caret.origin;
      if ("segmented" === s3) {
        const t3 = e4.origin, n5 = Go(t3.getTextContent()).setStyle(t3.getStyle()).setFormat(t3.getFormat());
        o3.replaceOrInsert(n5), e4 = La(n5, r2, e4.offset);
      }
      n4.is(l2[0].origin) && (l2[0] = e4), n4.is(c3[0].origin) && (c3[0] = e4.getFlipped());
    }
  }
  let d2, h3;
  for (const t2 of l2) if (lu(t2)) {
    d2 = au(t2);
    break;
  }
  for (const t2 of c3) if (lu(t2)) {
    h3 = au(t2);
    break;
  }
  const g3 = (function(t2, e3, n3) {
    if (!t2 || !e3) return null;
    const o3 = t2.getParentAtCaret(), r3 = e3.getParentAtCaret();
    if (!o3 || !r3) return null;
    const i3 = o3.getParents().reverse();
    i3.push(o3);
    const s3 = r3.getParents().reverse();
    s3.push(r3);
    const l3 = Math.min(i3.length, s3.length);
    let c4;
    for (c4 = 0; c4 < l3 && i3[c4] === s3[c4]; c4++) ;
    const a3 = (t3, e4) => {
      let n4;
      for (let o4 = c4; o4 < t3.length; o4++) {
        const r4 = t3[o4];
        if (Bl(r4)) return;
        !n4 && e4(r4) && (n4 = r4);
      }
      return n4;
    }, u3 = a3(i3, Sc), f4 = u3 && a3(s3, (t3) => n3.has(t3.getKey()) && Sc(t3));
    if (f4 && ia(f4).length > 0) return null;
    return u3 && f4 ? [u3, f4] : null;
  })(d2, h3, a2);
  if (g3) {
    const [t2, e3] = g3;
    Ba(t2, "previous").splice(0, e3.getChildren());
    let n3 = e3.getParent();
    for (e3.remove(true); n3 && n3.isEmpty(); ) {
      const t3 = n3;
      n3 = n3.getParent(), t3.remove(true);
    }
  } else if (h3) {
    const t2 = (function(t3) {
      if (Aa(t3)) {
        const e4 = t3.origin;
        if (Sc(e4)) return e4;
      } else {
        const e4 = t3.getParentAtCaret();
        if (e4 && Sc(e4)) return e4;
      }
      return null;
    })(h3), e3 = t2 && t2.getParent(), n3 = t2 && t2.getParents().findLast(zl);
    if (t2 && e3 && !Bi(e3) && t2.isEmpty() && a2.has(t2.getKey()) && 0 === ia(t2).length && (!n3 || a2.has(n3.getKey()))) {
      t2.remove(true);
      let n4 = e3;
      for (; n4 && !Bi(n4) && n4.isEmpty(); ) {
        const t3 = n4.getParent();
        if (t3 && Bi(t3) && t3.getChildrenSize() <= 1) break;
        const e4 = n4;
        n4 = t3, e4.remove(true);
      }
    }
  }
  const _3 = [d2, h3, ...l2, ...c3].find(lu);
  if (_3) {
    return Ja(fu(au(_3), e2.direction));
  }
  t(269, JSON.stringify(l2.map((t2) => t2.origin.__key)));
}
function au(t2) {
  const e2 = (function(t3) {
    let e3 = t3;
    for (; Aa(e3); ) {
      const t4 = Wa(e3);
      if (!Aa(t4)) break;
      e3 = t4;
    }
    return e3;
  })(t2.getLatest()), { direction: n2 } = e2;
  if (Xo(e2.origin)) return wa(e2) ? e2 : La(e2.origin, n2, n2);
  const o2 = e2.getAdjacentCaret();
  return Ma(o2) && Xo(o2.origin) ? La(o2.origin, n2, ka(n2)) : e2;
}
function uu(t2) {
  return wa(t2) && t2.offset !== Ka(t2.origin, t2.direction);
}
function fu(t2, e2) {
  return t2.direction === e2 ? t2 : t2.getFlipped();
}
function du(t2, e2) {
  return t2.direction === e2 ? t2 : Va(fu(t2.focus, e2), fu(t2.anchor, e2));
}
function hu(t2, e2, n2) {
  let o2 = Ba(t2, "next");
  for (let t3 = 0; t3 < e2; t3++) {
    const t4 = o2.getAdjacentCaret();
    if (null === t4) break;
    o2 = t4;
  }
  return fu(o2, n2);
}
function gu(t2, e2 = "root") {
  let n2 = 0, o2 = t2, r2 = Wa(o2);
  for (; null === r2; ) {
    if (n2--, r2 = o2.getParentCaret(e2), !r2) return null;
    o2 = r2, r2 = Wa(o2);
  }
  return r2 && [r2, n2];
}
function _u(e2) {
  const { origin: n2, offset: o2, direction: r2 } = e2;
  if (o2 === Ka(n2, r2)) return e2.getSiblingCaret();
  if (o2 === Ka(n2, ka(r2))) return iu(e2.getSiblingCaret());
  const [i2] = n2.splitText(o2);
  return Xo(i2) || t(281), fu(Ia(i2, "next"), r2);
}
function pu(t2, e2) {
  return true;
}
function yu(t2, { $copyElementNode: e2 = Rl, $splitTextPointCaretNext: n2 = _u, rootMode: o2 = "shadowRoot", $shouldSplit: r2 = pu, removeEmptyDestination: i2 = false } = {}) {
  if (wa(t2)) return n2(t2);
  const s2 = t2.getParentCaret(o2);
  if (s2) {
    const { origin: n3 } = s2;
    if (Aa(t2)) {
      const t3 = iu(s2);
      if (i2 && n3.isEmpty()) return n3.remove(), t3;
      if (!n3.canBeEmpty() || !r2(n3, "first")) return t3;
    }
    const o3 = (function(t3) {
      const e3 = [];
      for (let n4 = t3.getAdjacentCaret(); n4; n4 = n4.getAdjacentCaret()) e3.push(n4.origin);
      return e3;
    })(t2);
    (o3.length > 0 || !i2 && n3.canBeEmpty() && r2(n3, "last")) && s2.insert(e2(n3).splice(0, 0, o3));
  }
  return s2;
}
function mu(e2, n2, o2) {
  let r2 = fu(n2, "next");
  wa(r2) && (0 === r2.offset ? r2 = Ia(r2.origin, "previous").getFlipped() : r2.offset === r2.origin.getTextContentSize() && (r2 = Ia(r2.origin, "next"))), r2.origin.is(e2) && (Ma(r2) || t(342, e2.getKey(), e2.getType()), r2 = iu(r2)), (e2.is(r2.getNodeAtCaret()) || e2.is(r2.getFlipped().getNodeAtCaret())) && e2.remove(true);
  for (let t2 = r2; t2; t2 = yu(t2, o2)) r2 = t2;
  return wa(r2) && t(283), r2.insert(e2.isInline() ? es().append(e2) : e2), fu(Ia(e2.getLatest(), "next"), n2.direction);
}
function xu(t2) {
  return t2;
}
function Cu(...t2) {
  return t2;
}
function Su(t2, e2) {
  return [t2, e2];
}
function vu(t2) {
  return t2;
}
function Tu(t2, e2) {
  if (!e2 || t2 === e2) return t2;
  for (const n2 in e2) if (t2[n2] !== e2[n2]) return { ...t2, ...e2 };
  return t2;
}
function ku(...t2) {
  const e2 = [];
  for (const n2 of t2) if (n2 && "string" == typeof n2) for (const [t3] of n2.matchAll(/\S+/g)) e2.push(t3);
  return e2;
}
function bu(t2, ...e2) {
  const n2 = ku(...e2);
  n2.length > 0 && t2.classList.add(...n2);
}
function Nu(t2, ...e2) {
  const n2 = ku(...e2);
  n2.length > 0 && t2.classList.remove(...n2);
}
function Eu(...t2) {
  return () => {
    for (let e2 = t2.length - 1; e2 >= 0; e2--) t2[e2]();
    t2.length = 0;
  };
}
function wu(t2, e2, n2) {
  return Eu(...Object.entries(e2).map(([e3, o2]) => Fn(t2, e3, o2, n2)));
}

// node_modules/lexical/dist/Lexical.mjs
var mod = false ? Lexical_dev_exports : Lexical_prod_exports;
var $addUpdateTag = mod.$addUpdateTag;
var $applyNodeReplacement = mod.$applyNodeReplacement;
var $assumeActiveEditor = mod.$assumeActiveEditor;
var $caretFromPoint = mod.$caretFromPoint;
var $caretRangeFromSelection = mod.$caretRangeFromSelection;
var $cloneWithProperties = mod.$cloneWithProperties;
var $cloneWithPropertiesEphemeral = mod.$cloneWithPropertiesEphemeral;
var $comparePointCaretNext = mod.$comparePointCaretNext;
var $copyNode = mod.$copyNode;
var $create = mod.$create;
var $createChildrenArray = mod.$createChildrenArray;
var $createLineBreakNode = mod.$createLineBreakNode;
var $createNodeSelection = mod.$createNodeSelection;
var $createParagraphNode = mod.$createParagraphNode;
var $createPoint = mod.$createPoint;
var $createRangeSelection = mod.$createRangeSelection;
var $createRangeSelectionFromDom = mod.$createRangeSelectionFromDom;
var $createTabNode = mod.$createTabNode;
var $createTextNode = mod.$createTextNode;
var $extendCaretToRange = mod.$extendCaretToRange;
var $findMatchingParent = mod.$findMatchingParent;
var $formatText = mod.$formatText;
var $fullReconcile = mod.$fullReconcile;
var $generateNodesFromRawText = mod.$generateNodesFromRawText;
var $getAdjacentChildCaret = mod.$getAdjacentChildCaret;
var $getAdjacentNode = mod.$getAdjacentNode;
var $getAdjacentSiblingOrParentSiblingCaret = mod.$getAdjacentSiblingOrParentSiblingCaret;
var $getCaretInDirection = mod.$getCaretInDirection;
var $getCaretRange = mod.$getCaretRange;
var $getCaretRangeInDirection = mod.$getCaretRangeInDirection;
var $getCharacterOffsets = mod.$getCharacterOffsets;
var $getChildCaret = mod.$getChildCaret;
var $getChildCaretAtIndex = mod.$getChildCaretAtIndex;
var $getChildCaretOrSelf = mod.$getChildCaretOrSelf;
var $getCollapsedCaretRange = mod.$getCollapsedCaretRange;
var $getCommonAncestor = mod.$getCommonAncestor;
var $getCommonAncestorResultBranchOrder = mod.$getCommonAncestorResultBranchOrder;
var $getDOMSlot = mod.$getDOMSlot;
var $getDOMTextNode = mod.$getDOMTextNode;
var $getDocument = mod.$getDocument;
var $getEditor = mod.$getEditor;
var $getEditorDOMRenderConfig = mod.$getEditorDOMRenderConfig;
var $getNearestNodeFromDOMNode = mod.$getNearestNodeFromDOMNode;
var $getNearestRootOrShadowRoot = mod.$getNearestRootOrShadowRoot;
var $getNodeByKey = mod.$getNodeByKey;
var $getNodeByKeyOrThrow = mod.$getNodeByKeyOrThrow;
var $getNodeFromDOMNode = mod.$getNodeFromDOMNode;
var $getPreviousSelection = mod.$getPreviousSelection;
var $getRoot = mod.$getRoot;
var $getSelection = mod.$getSelection;
var $getSiblingCaret = mod.$getSiblingCaret;
var $getSlot = mod.$getSlot;
var $getSlotFrame = mod.$getSlotFrame;
var $getSlotHost = mod.$getSlotHost;
var $getSlotNameWithinHost = mod.$getSlotNameWithinHost;
var $getSlotNames = mod.$getSlotNames;
var $getState = mod.$getState;
var $getStateChange = mod.$getStateChange;
var $getTextContent = mod.$getTextContent;
var $getTextNodeOffset = mod.$getTextNodeOffset;
var $getTextPointCaret = mod.$getTextPointCaret;
var $getTextPointCaretSlice = mod.$getTextPointCaretSlice;
var $getWritableNodeState = mod.$getWritableNodeState;
var $hasAncestor = mod.$hasAncestor;
var $hasUpdateTag = mod.$hasUpdateTag;
var $insertNodeToNearestRootAtCaret = mod.$insertNodeToNearestRootAtCaret;
var $insertNodes = mod.$insertNodes;
var $isBlockElementNode = mod.$isBlockElementNode;
var $isChildCaret = mod.$isChildCaret;
var $isDecoratorNode = mod.$isDecoratorNode;
var $isEditorState = mod.$isEditorState;
var $isElementDOMSlot = mod.$isElementDOMSlot;
var $isElementNode = mod.$isElementNode;
var $isExtendableTextPointCaret = mod.$isExtendableTextPointCaret;
var $isInlineElementOrDecoratorNode = mod.$isInlineElementOrDecoratorNode;
var $isInlineFormattable = mod.$isInlineFormattable;
var $isLeafNode = mod.$isLeafNode;
var $isLexicalNode = mod.$isLexicalNode;
var $isLineBreakNode = mod.$isLineBreakNode;
var $isNodeCaret = mod.$isNodeCaret;
var $isNodeSelection = mod.$isNodeSelection;
var $isParagraphNode = mod.$isParagraphNode;
var $isRangeSelection = mod.$isRangeSelection;
var $isRootNode = mod.$isRootNode;
var $isRootOrShadowRoot = mod.$isRootOrShadowRoot;
var $isSelectionCapturedInDecoratorInput = mod.$isSelectionCapturedInDecoratorInput;
var $isShadowRootNode = mod.$isShadowRootNode;
var $isSiblingCaret = mod.$isSiblingCaret;
var $isSlotChild = mod.$isSlotChild;
var $isSlotHost = mod.$isSlotHost;
var $isTabNode = mod.$isTabNode;
var $isTextNode = mod.$isTextNode;
var $isTextPointCaret = mod.$isTextPointCaret;
var $isTextPointCaretSlice = mod.$isTextPointCaretSlice;
var $isTokenOrSegmented = mod.$isTokenOrSegmented;
var $isTokenOrTab = mod.$isTokenOrTab;
var $markSlotEditable = mod.$markSlotEditable;
var $needsBlockCursorBeside = mod.$needsBlockCursorBeside;
var $nodesOfType = mod.$nodesOfType;
var $normalizeCaret = mod.$normalizeCaret;
var $normalizeSelection__EXPERIMENTAL = mod.$normalizeSelection__EXPERIMENTAL;
var $onUpdate = mod.$onUpdate;
var $parseSerializedNode = mod.$parseSerializedNode;
var $removeFromParent = mod.$removeFromParent;
var $removeSlot = mod.$removeSlot;
var $removeTextFromCaretRange = mod.$removeTextFromCaretRange;
var $rewindSiblingCaret = mod.$rewindSiblingCaret;
var $selectAll = mod.$selectAll;
var $setCompositionKey = mod.$setCompositionKey;
var $setDirectionFromDOM = mod.$setDirectionFromDOM;
var $setFormatFromDOM = mod.$setFormatFromDOM;
var $setPointFromCaret = mod.$setPointFromCaret;
var $setSelection = mod.$setSelection;
var $setSelectionFromCaretRange = mod.$setSelectionFromCaretRange;
var $setSlot = mod.$setSlot;
var $setState = mod.$setState;
var $setTextFormat = mod.$setTextFormat;
var $splitAtPointCaretNext = mod.$splitAtPointCaretNext;
var $splitNode = mod.$splitNode;
var $updateDOMSelection = mod.$updateDOMSelection;
var $updateRangeSelectionFromCaretRange = mod.$updateRangeSelectionFromCaretRange;
var ArtificialNode__DO_NOT_USE = mod.ArtificialNode__DO_NOT_USE;
var BEFORE_INPUT_COMMAND = mod.BEFORE_INPUT_COMMAND;
var BLUR_COMMAND = mod.BLUR_COMMAND;
var CAN_REDO_COMMAND = mod.CAN_REDO_COMMAND;
var CAN_UNDO_COMMAND = mod.CAN_UNDO_COMMAND;
var CAN_USE_BEFORE_INPUT = mod.CAN_USE_BEFORE_INPUT;
var CAN_USE_DOM = mod.CAN_USE_DOM;
var CLEAR_EDITOR_COMMAND = mod.CLEAR_EDITOR_COMMAND;
var CLEAR_HISTORY_COMMAND = mod.CLEAR_HISTORY_COMMAND;
var CLICK_COMMAND = mod.CLICK_COMMAND;
var COLLABORATION_TAG = mod.COLLABORATION_TAG;
var COMMAND_PRIORITY_BEFORE_CRITICAL = mod.COMMAND_PRIORITY_BEFORE_CRITICAL;
var COMMAND_PRIORITY_BEFORE_EDITOR = mod.COMMAND_PRIORITY_BEFORE_EDITOR;
var COMMAND_PRIORITY_BEFORE_HIGH = mod.COMMAND_PRIORITY_BEFORE_HIGH;
var COMMAND_PRIORITY_BEFORE_LOW = mod.COMMAND_PRIORITY_BEFORE_LOW;
var COMMAND_PRIORITY_BEFORE_NORMAL = mod.COMMAND_PRIORITY_BEFORE_NORMAL;
var COMMAND_PRIORITY_CRITICAL = mod.COMMAND_PRIORITY_CRITICAL;
var COMMAND_PRIORITY_EDITOR = mod.COMMAND_PRIORITY_EDITOR;
var COMMAND_PRIORITY_HIGH = mod.COMMAND_PRIORITY_HIGH;
var COMMAND_PRIORITY_LOW = mod.COMMAND_PRIORITY_LOW;
var COMMAND_PRIORITY_NORMAL = mod.COMMAND_PRIORITY_NORMAL;
var COMPOSITION_END_COMMAND = mod.COMPOSITION_END_COMMAND;
var COMPOSITION_END_TAG = mod.COMPOSITION_END_TAG;
var COMPOSITION_START_COMMAND = mod.COMPOSITION_START_COMMAND;
var COMPOSITION_START_TAG = mod.COMPOSITION_START_TAG;
var CONTROLLED_TEXT_INSERTION_COMMAND = mod.CONTROLLED_TEXT_INSERTION_COMMAND;
var COPY_COMMAND = mod.COPY_COMMAND;
var CUT_COMMAND = mod.CUT_COMMAND;
var CUT_TAG = mod.CUT_TAG;
var DEFAULT_EDITOR_DOM_CONFIG = mod.DEFAULT_EDITOR_DOM_CONFIG;
var DELETE_CHARACTER_COMMAND = mod.DELETE_CHARACTER_COMMAND;
var DELETE_LINE_COMMAND = mod.DELETE_LINE_COMMAND;
var DELETE_WORD_COMMAND = mod.DELETE_WORD_COMMAND;
var DRAGEND_COMMAND = mod.DRAGEND_COMMAND;
var DRAGOVER_COMMAND = mod.DRAGOVER_COMMAND;
var DRAGSTART_COMMAND = mod.DRAGSTART_COMMAND;
var DROP_COMMAND = mod.DROP_COMMAND;
var DecoratorNode = mod.DecoratorNode;
var ElementNode = mod.ElementNode;
var FOCUS_COMMAND = mod.FOCUS_COMMAND;
var FORMAT_ELEMENT_COMMAND = mod.FORMAT_ELEMENT_COMMAND;
var FORMAT_TEXT_COMMAND = mod.FORMAT_TEXT_COMMAND;
var HISTORIC_TAG = mod.HISTORIC_TAG;
var HISTORY_MERGE_TAG = mod.HISTORY_MERGE_TAG;
var HISTORY_PUSH_TAG = mod.HISTORY_PUSH_TAG;
var INDENT_CONTENT_COMMAND = mod.INDENT_CONTENT_COMMAND;
var INPUT_COMMAND = mod.INPUT_COMMAND;
var INSERT_LINE_BREAK_COMMAND = mod.INSERT_LINE_BREAK_COMMAND;
var INSERT_PARAGRAPH_COMMAND = mod.INSERT_PARAGRAPH_COMMAND;
var INSERT_TAB_COMMAND = mod.INSERT_TAB_COMMAND;
var INTERNAL_$isBlock = mod.INTERNAL_$isBlock;
var IS_ALL_FORMATTING = mod.IS_ALL_FORMATTING;
var IS_ANDROID = mod.IS_ANDROID;
var IS_ANDROID_CHROME = mod.IS_ANDROID_CHROME;
var IS_APPLE = mod.IS_APPLE;
var IS_APPLE_WEBKIT = mod.IS_APPLE_WEBKIT;
var IS_BOLD = mod.IS_BOLD;
var IS_CHROME = mod.IS_CHROME;
var IS_CODE = mod.IS_CODE;
var IS_FIREFOX = mod.IS_FIREFOX;
var IS_HIGHLIGHT = mod.IS_HIGHLIGHT;
var IS_IOS = mod.IS_IOS;
var IS_ITALIC = mod.IS_ITALIC;
var IS_SAFARI = mod.IS_SAFARI;
var IS_STRIKETHROUGH = mod.IS_STRIKETHROUGH;
var IS_SUBSCRIPT = mod.IS_SUBSCRIPT;
var IS_SUPERSCRIPT = mod.IS_SUPERSCRIPT;
var IS_UNDERLINE = mod.IS_UNDERLINE;
var KEY_ARROW_DOWN_COMMAND = mod.KEY_ARROW_DOWN_COMMAND;
var KEY_ARROW_LEFT_COMMAND = mod.KEY_ARROW_LEFT_COMMAND;
var KEY_ARROW_RIGHT_COMMAND = mod.KEY_ARROW_RIGHT_COMMAND;
var KEY_ARROW_UP_COMMAND = mod.KEY_ARROW_UP_COMMAND;
var KEY_BACKSPACE_COMMAND = mod.KEY_BACKSPACE_COMMAND;
var KEY_DELETE_COMMAND = mod.KEY_DELETE_COMMAND;
var KEY_DOWN_COMMAND = mod.KEY_DOWN_COMMAND;
var KEY_ENTER_COMMAND = mod.KEY_ENTER_COMMAND;
var KEY_ESCAPE_COMMAND = mod.KEY_ESCAPE_COMMAND;
var KEY_MODIFIER_COMMAND = mod.KEY_MODIFIER_COMMAND;
var KEY_SPACE_COMMAND = mod.KEY_SPACE_COMMAND;
var KEY_TAB_COMMAND = mod.KEY_TAB_COMMAND;
var LineBreakNode = mod.LineBreakNode;
var MOVE_TO_END = mod.MOVE_TO_END;
var MOVE_TO_START = mod.MOVE_TO_START;
var NODE_STATE_DIRECT = mod.NODE_STATE_DIRECT;
var NODE_STATE_KEY = mod.NODE_STATE_KEY;
var NODE_STATE_LATEST = mod.NODE_STATE_LATEST;
var OUTDENT_CONTENT_COMMAND = mod.OUTDENT_CONTENT_COMMAND;
var PASTE_COMMAND = mod.PASTE_COMMAND;
var PASTE_TAG = mod.PASTE_TAG;
var ParagraphNode = mod.ParagraphNode;
var REDO_COMMAND = mod.REDO_COMMAND;
var REMOVE_TEXT_COMMAND = mod.REMOVE_TEXT_COMMAND;
var RootNode = mod.RootNode;
var SELECTION_CHANGE_COMMAND = mod.SELECTION_CHANGE_COMMAND;
var SELECTION_INSERT_CLIPBOARD_NODES_COMMAND = mod.SELECTION_INSERT_CLIPBOARD_NODES_COMMAND;
var SELECT_ALL_COMMAND = mod.SELECT_ALL_COMMAND;
var SET_TEXT_FORMAT_COMMAND = mod.SET_TEXT_FORMAT_COMMAND;
var SKIP_COLLAB_TAG = mod.SKIP_COLLAB_TAG;
var SKIP_DOM_SELECTION_TAG = mod.SKIP_DOM_SELECTION_TAG;
var SKIP_SCROLL_INTO_VIEW_TAG = mod.SKIP_SCROLL_INTO_VIEW_TAG;
var SKIP_SELECTION_FOCUS_TAG = mod.SKIP_SELECTION_FOCUS_TAG;
var TEXT_TYPE_TO_FORMAT = mod.TEXT_TYPE_TO_FORMAT;
var TabNode = mod.TabNode;
var TextNode = mod.TextNode;
var UNDO_COMMAND = mod.UNDO_COMMAND;
var addClassNamesToElement = mod.addClassNamesToElement;
var buildImportMap = mod.buildImportMap;
var configExtension = mod.configExtension;
var createCommand = mod.createCommand;
var createEditor = mod.createEditor;
var createRefCountedRegistry = mod.createRefCountedRegistry;
var createSharedNodeState = mod.createSharedNodeState;
var createState = mod.createState;
var declarePeerDependency = mod.declarePeerDependency;
var defineExtension = mod.defineExtension;
var findAllLexicalElementsDeep = mod.findAllLexicalElementsDeep;
var flipDirection = mod.flipDirection;
var getActiveElement = mod.getActiveElement;
var getActiveElementDeep = mod.getActiveElementDeep;
var getComposedEventTarget = mod.getComposedEventTarget;
var getComposedStaticRange = mod.getComposedStaticRange;
var getDOMOwnerDocument = mod.getDOMOwnerDocument;
var getDOMSelection = mod.getDOMSelection;
var getDOMSelectionFromTarget = mod.getDOMSelectionFromTarget;
var getDOMSelectionPoints = mod.getDOMSelectionPoints;
var getDOMSelectionRange = mod.getDOMSelectionRange;
var getDOMSelectionRangeAndPoints = mod.getDOMSelectionRangeAndPoints;
var getDOMShadowRoots = mod.getDOMShadowRoots;
var getDOMTextNode = mod.getDOMTextNode;
var getDeclaredSlots = mod.getDeclaredSlots;
var getEditorPropertyFromDOMNode = mod.getEditorPropertyFromDOMNode;
var getNearestEditorFromDOMNode = mod.getNearestEditorFromDOMNode;
var getParentElement = mod.getParentElement;
var getRegisteredNode = mod.getRegisteredNode;
var getRegisteredNodeOrThrow = mod.getRegisteredNodeOrThrow;
var getRegisteredSubtypeMap = mod.getRegisteredSubtypeMap;
var getRootOwnerDocument = mod.getRootOwnerDocument;
var getStaticNodeConfig = mod.getStaticNodeConfig;
var getStyleObjectFromCSS = mod.getStyleObjectFromCSS;
var getTextDirection = mod.getTextDirection;
var getTransformSetFromKlass = mod.getTransformSetFromKlass;
var isBlockDomNode = mod.isBlockDomNode;
var isCurrentlyReadOnlyMode = mod.isCurrentlyReadOnlyMode;
var isDOMCapturingSelection = mod.isDOMCapturingSelection;
var isDOMDocumentNode = mod.isDOMDocumentNode;
var isDOMNode = mod.isDOMNode;
var isDOMShadowRoot = mod.isDOMShadowRoot;
var isDOMTextNode = mod.isDOMTextNode;
var isDOMUnmanaged = mod.isDOMUnmanaged;
var isDocumentFragment = mod.isDocumentFragment;
var isExactShortcutMatch = mod.isExactShortcutMatch;
var isHTMLAnchorElement = mod.isHTMLAnchorElement;
var isHTMLElement = mod.isHTMLElement;
var isHTMLTableCellElement = mod.isHTMLTableCellElement;
var isHTMLTableRowElement = mod.isHTMLTableRowElement;
var isInlineDomNode = mod.isInlineDomNode;
var isLastChildInBlockNode = mod.isLastChildInBlockNode;
var isLexicalEditor = mod.isLexicalEditor;
var isModifierMatch = mod.isModifierMatch;
var isOnlyChildInBlockNode = mod.isOnlyChildInBlockNode;
var isSelectionCapturedInDecoratorInput = mod.isSelectionCapturedInDecoratorInput;
var isSelectionWithinEditor = mod.isSelectionWithinEditor;
var iterStaticNodeConfigChain = mod.iterStaticNodeConfigChain;
var makeStepwiseIterator = mod.makeStepwiseIterator;
var mergeRegister = mod.mergeRegister;
var mountSlotContainer = mod.mountSlotContainer;
var normalizeClassNames = mod.normalizeClassNames;
var registerEventListener = mod.registerEventListener;
var registerEventListeners = mod.registerEventListeners;
var removeClassNamesFromElement = mod.removeClassNamesFromElement;
var removeFromParent = mod.removeFromParent;
var resetRandomKey = mod.resetRandomKey;
var safeCast = mod.safeCast;
var setDOMStyleFromCSS = mod.setDOMStyleFromCSS;
var setDOMStyleObject = mod.setDOMStyleObject;
var setDOMUnmanaged = mod.setDOMUnmanaged;
var setNodeIndentFromDOM = mod.setNodeIndentFromDOM;
var shallowMergeConfig = mod.shallowMergeConfig;
var stopLexicalPropagation = mod.stopLexicalPropagation;
var toggleTextFormatType = mod.toggleTextFormatType;
var tokenizeRawText = mod.tokenizeRawText;
var unmountSlotContainer = mod.unmountSlotContainer;

// node_modules/@lexical/selection/dist/LexicalSelection.prod.mjs
var LexicalSelection_prod_exports = {};
__export(LexicalSelection_prod_exports, {
  $addNodeStyle: () => D2,
  $cloneWithProperties: () => $cloneWithProperties,
  $copyBlockFormatIndent: () => W2,
  $ensureForwardRangeSelection: () => V2,
  $forEachSelectedTextNode: () => H2,
  $getComputedStyleForElement: () => R2,
  $getComputedStyleForParent: () => O2,
  $getSelectionStyleValueForProperty: () => ie2,
  $isAtEdgeOfElement: () => X2,
  $isAtNodeEnd: () => M2,
  $isParentElementRTL: () => oe2,
  $isParentRTL: () => _2,
  $moveCaretSelection: () => ne2,
  $moveCharacter: () => le2,
  $patchStyleText: () => j2,
  $selectAll: () => $selectAll,
  $setBlocksType: () => q2,
  $shouldOverrideDefaultCharacterSelection: () => te2,
  $sliceSelectedTextNodeContent: () => L2,
  $trimTextContentFromAnchor: () => $2,
  $wrapNodes: () => Q2,
  createDOMRange: () => b2,
  createRectsFromDOMRange: () => z2,
  getCSSFromStyleObject: () => A2,
  getStyleObjectFromCSS: () => se2,
  trimTextContentFromAnchor: () => ce2
});
function B2(e2, ...t2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", e2);
  for (const e3 of t2) o2.append("v", e3);
  throw n2.search = o2.toString(), Error(`Minified Lexical error #${e2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
function k2(e2) {
  let t2 = e2;
  for (; null != t2; ) {
    if (t2.nodeType === Node.TEXT_NODE) return t2;
    t2 = t2.firstChild;
  }
  return null;
}
function F2(e2) {
  const t2 = e2.parentNode;
  if (null == t2) throw new Error("Should never happen");
  return [t2, Array.from(t2.childNodes).indexOf(e2)];
}
function b2(n2, o2, l2, r2, i2) {
  const s2 = o2.getKey(), c3 = r2.getKey(), f3 = getRootOwnerDocument(n2.getRootElement()).createRange();
  let u2 = n2.getElementByKey(s2), g3 = n2.getElementByKey(c3), a2 = l2, d2 = i2;
  if ($isTextNode(o2) && (u2 = k2(u2)), $isTextNode(r2) && (g3 = k2(g3)), void 0 === o2 || void 0 === r2 || null === u2 || null === g3) return null;
  "BR" === u2.nodeName && ([u2, a2] = F2(u2)), "BR" === g3.nodeName && ([g3, d2] = F2(g3));
  const p3 = u2.firstChild;
  u2 === g3 && null != p3 && "BR" === p3.nodeName && 0 === a2 && 0 === d2 && (d2 = 1);
  try {
    f3.setStart(u2, a2), f3.setEnd(g3, d2);
  } catch (e2) {
    return null;
  }
  return !f3.collapsed || a2 === d2 && s2 === c3 || (f3.setStart(g3, d2), f3.setEnd(u2, a2)), f3;
}
function z2(e2, t2) {
  const n2 = e2.getRootElement();
  if (null === n2) return [];
  const o2 = n2.getBoundingClientRect(), l2 = getComputedStyle(n2), r2 = parseFloat(l2.paddingLeft) + parseFloat(l2.paddingRight), i2 = Array.from(t2.getClientRects());
  let s2, c3 = i2.length;
  i2.sort((e3, t3) => {
    const n3 = e3.top - t3.top;
    return Math.abs(n3) <= 3 ? e3.left - t3.left : n3;
  });
  for (let e3 = 0; e3 < c3; e3++) {
    const t3 = i2[e3], n3 = s2 && s2.top <= t3.top && s2.top + s2.height > t3.top && s2.left + s2.width > t3.left, l3 = t3.width + r2 === o2.width;
    n3 || l3 ? (i2.splice(e3--, 1), c3--) : s2 = t3;
  }
  return i2;
}
function A2(e2) {
  let t2 = "";
  for (const n2 in e2) n2 && (t2 += `${n2}: ${e2[n2]};`);
  return t2;
}
function R2(e2) {
  const t2 = $getEditor().getElementByKey(e2.getKey());
  if (null === t2) return null;
  const o2 = t2.ownerDocument.defaultView;
  return null === o2 ? null : o2.getComputedStyle(t2);
}
function O2(e2) {
  return R2($isRootNode(e2) ? e2 : e2.getParentOrThrow());
}
function _2(e2) {
  const t2 = O2(e2);
  return null !== t2 && "rtl" === t2.direction;
}
function L2(e2, t2, n2 = "self") {
  const o2 = e2.getStartEndPoints();
  if (t2.isSelected(e2) && !$isTokenOrSegmented(t2) && null !== o2) {
    const [l2, r2] = o2, i2 = e2.isBackward(), s2 = l2.getNode(), c3 = r2.getNode(), g3 = t2.is(s2), a2 = t2.is(c3);
    if (g3 || a2) {
      const [o3, l3] = $getCharacterOffsets(e2), r3 = s2.is(c3), g4 = t2.is(i2 ? c3 : s2), a3 = t2.is(i2 ? s2 : c3);
      let d2, p3 = 0;
      if (r3) p3 = o3 > l3 ? l3 : o3, d2 = o3 > l3 ? o3 : l3;
      else if (g4) {
        p3 = i2 ? l3 : o3, d2 = void 0;
      } else if (a3) {
        p3 = 0, d2 = i2 ? o3 : l3;
      }
      const h3 = t2.__text.slice(p3, d2);
      h3 !== t2.__text && ("clone" === n2 && (t2 = $cloneWithPropertiesEphemeral(t2)), t2.__text = h3);
    }
  }
  return t2;
}
function M2(e2) {
  if ("text" === e2.type) return e2.offset === e2.getNode().getTextContentSize();
  const t2 = e2.getNode();
  return $isElementNode(t2) || B2(177), e2.offset === t2.getChildrenSize();
}
function $2(e2, n2, l2) {
  let i2 = n2.getNode(), s2 = l2;
  if ($isElementNode(i2)) {
    const e3 = i2.getDescendantByIndex(n2.offset);
    null !== e3 && (i2 = e3);
  }
  for (; s2 > 0 && null !== i2; ) {
    if ($isElementNode(i2)) {
      const e3 = i2.getLastDescendant();
      null !== e3 && (i2 = e3);
    }
    let l3 = i2.getPreviousSibling(), f3 = 0;
    if (null === l3) {
      let e3 = i2.getParentOrThrow(), t2 = e3.getPreviousSibling();
      for (; null === t2; ) {
        if (e3 = e3.getParent(), null === e3) {
          l3 = null;
          break;
        }
        t2 = e3.getPreviousSibling();
      }
      null !== e3 && (f3 = e3.isInline() ? 0 : 2, l3 = t2);
    }
    let u2 = i2.getTextContent();
    "" === u2 && $isElementNode(i2) && !i2.isInline() && (u2 = "\n\n");
    const p3 = u2.length;
    if (!$isTextNode(i2) || s2 >= p3) {
      const e3 = i2.getParent();
      i2.remove(), null == e3 || 0 !== e3.getChildrenSize() || $isRootNode(e3) || e3.remove(), s2 -= p3 + f3, i2 = l3;
    } else {
      const o2 = i2.getKey(), l4 = e2.read("latest", () => {
        const e3 = $getNodeByKey(o2);
        return $isTextNode(e3) && e3.isSimpleText() ? e3.getTextContent() : null;
      }), c3 = p3 - s2, f4 = u2.slice(0, c3);
      if (null !== l4 && l4 !== u2) {
        const e3 = $getPreviousSelection();
        let t2 = i2;
        if (i2.isSimpleText()) i2.setTextContent(l4);
        else {
          const e4 = $createTextNode(l4);
          i2.replace(e4), t2 = e4;
        }
        if ($isRangeSelection(e3) && e3.isCollapsed()) {
          const n3 = e3.anchor.offset;
          t2.select(n3, n3);
        }
      } else if (i2.isSimpleText()) {
        const e3 = n2.key === o2;
        let t2 = n2.offset;
        t2 < s2 && (t2 = p3);
        const l5 = e3 ? t2 - s2 : 0, r2 = e3 ? t2 : c3;
        if (e3 && 0 === l5) {
          const [e4] = i2.splitText(l5, r2);
          e4.remove();
        } else {
          const [, e4] = i2.splitText(l5, r2);
          e4.remove();
        }
      } else {
        const e3 = $createTextNode(f4);
        i2.replace(e3);
      }
      s2 = 0;
    }
  }
}
var D2 = () => {
};
function U2(e2, n2) {
  ($isRangeSelection(e2) ? e2.isCollapsed() : $isTextNode(e2) || $isElementNode(e2)) || B2(280);
  const o2 = getStyleObjectFromCSS($isRangeSelection(e2) ? e2.style : $isTextNode(e2) ? e2.getStyle() : e2.getTextStyle()), l2 = A2(Object.entries(n2).reduce((t2, [n3, l3]) => ("function" == typeof l3 ? t2[n3] = l3(o2[n3], e2) : null === l3 ? delete t2[n3] : t2[n3] = l3, t2), { ...o2 }));
  $isRangeSelection(e2) || $isTextNode(e2) ? e2.setStyle(l2) : e2.setTextStyle(l2);
}
function j2(e2, t2) {
  if ($isRangeSelection(e2) && e2.isCollapsed()) {
    U2(e2, t2);
    const n3 = e2.anchor.getNode();
    $isElementNode(n3) && n3.isEmpty() && U2(n3, t2);
  }
  H2((e3) => {
    U2(e3, t2);
  });
  const n2 = e2.getNodes();
  if (n2.length > 0) {
    const e3 = /* @__PURE__ */ new Set();
    for (const o2 of n2) {
      if (!$isElementNode(o2) || !o2.canBeEmpty() || 0 !== o2.getChildrenSize()) continue;
      const n3 = o2.getKey();
      e3.has(n3) || (e3.add(n3), U2(o2, t2));
    }
  }
}
function H2(e2) {
  const n2 = $getSelection();
  if (!n2) return;
  const o2 = /* @__PURE__ */ new Map(), c3 = (e3) => o2.get(e3.getKey()) || [0, e3.getTextContentSize()];
  if ($isRangeSelection(n2)) for (const e3 of $caretRangeFromSelection(n2).getTextSlices()) e3 && o2.set(e3.caret.origin.getKey(), e3.getSliceIndices());
  const f3 = n2.getNodes();
  for (const n3 of f3) {
    if (!$isTextNode(n3) || !n3.canHaveFormat()) continue;
    const [o3, l2] = c3(n3);
    if (l2 !== o3) if ($isTokenOrSegmented(n3) || 0 === o3 && l2 === n3.getTextContentSize()) e2(n3);
    else {
      e2(n3.splitText(o3, l2)[0 === o3 ? 0 : 1]);
    }
  }
  $isRangeSelection(n2) && "text" === n2.anchor.type && "text" === n2.focus.type && n2.anchor.key === n2.focus.key && V2(n2);
}
function V2(e2) {
  if (e2.isBackward()) {
    const { anchor: t2, focus: n2 } = e2, { key: o2, offset: l2, type: r2 } = t2;
    t2.set(n2.key, n2.offset, n2.type), n2.set(o2, l2, r2);
  }
}
function W2(e2, t2) {
  const n2 = e2.getFormatType(), o2 = e2.getIndent();
  n2 !== t2.getFormatType() && t2.setFormat(n2), o2 !== t2.getIndent() && t2.setIndent(o2);
}
function X2(e2, t2, n2) {
  let o2 = $caretFromPoint(e2, n2);
  if ($isExtendableTextPointCaret(o2)) return false;
  for (; o2; o2 = o2.getParentCaret()) {
    const e3 = o2.getParentAtCaret();
    if (!e3 || o2.getNodeAtCaret()) return false;
    if (t2.is(e3)) return true;
  }
  return false;
}
function q2(e2, t2, n2 = W2) {
  if (!e2) return;
  const o2 = e2.getStartEndPoints();
  let l2 = false, r2 = null;
  const i2 = /* @__PURE__ */ new Map();
  if (o2) {
    const [t3, n3] = o2, s2 = $findMatchingParent(t3.getNode(), INTERNAL_$isBlock);
    r2 = $findMatchingParent(n3.getNode(), INTERNAL_$isBlock);
    const f3 = e2.isBackward() ? "previous" : "next";
    l2 = $isElementNode(r2) && !r2.is(s2) && (function(e3, t4, n4) {
      const o3 = e3.getNode();
      return (!$isElementNode(o3) || !o3.isEmpty()) && X2(e3, t4, n4);
    })(n3, r2, flipDirection(f3)), $isElementNode(s2) && i2.set(s2.getKey(), s2), $isElementNode(r2) && !l2 && i2.set(r2.getKey(), r2);
  }
  for (const t3 of e2.getNodes()) if ($isElementNode(t3) && INTERNAL_$isBlock(t3)) {
    if (l2 && t3.is(r2)) continue;
    i2.set(t3.getKey(), t3);
  } else if (!o2) {
    const e3 = $findMatchingParent(t3, INTERNAL_$isBlock);
    $isElementNode(e3) && i2.set(e3.getKey(), e3);
  }
  for (const e3 of i2.values()) {
    const o3 = t2();
    n2(e3, o3), e3.replace(o3, true);
  }
}
function G2(e2) {
  return e2.getNode().isAttached();
}
function J2(e2) {
  let t2 = e2;
  for (; null !== t2 && !$isRootOrShadowRoot(t2); ) {
    const e3 = t2.getLatest(), n2 = t2.getParent();
    0 === e3.getChildrenSize() && t2.remove(true), t2 = n2;
  }
}
function Q2(e2, t2, n2 = null) {
  const o2 = e2.getStartEndPoints(), l2 = o2 ? o2[0] : null, r2 = e2.getNodes(), i2 = r2.length;
  if (null !== l2 && (0 === i2 || 1 === i2 && "element" === l2.type && 0 === l2.getNode().getChildrenSize())) {
    const e3 = "text" === l2.type ? l2.getNode().getParentOrThrow() : l2.getNode(), o3 = e3.getChildren();
    let r3 = t2();
    return r3.setFormat(e3.getFormatType()), r3.setIndent(e3.getIndent()), o3.forEach((e4) => r3.append(e4)), n2 && (r3 = n2.append(r3)), void e3.replace(r3);
  }
  let s2 = null, c3 = [];
  for (let o3 = 0; o3 < i2; o3++) {
    const l3 = r2[o3];
    $isRootOrShadowRoot(l3) ? (Y2(e2, c3, c3.length, t2, n2), c3 = [], s2 = l3) : null === s2 || null !== s2 && $hasAncestor(l3, s2) ? c3.push(l3) : (Y2(e2, c3, c3.length, t2, n2), c3 = [l3]);
  }
  Y2(e2, c3, c3.length, t2, n2);
}
function Y2(e2, t2, n2, o2, l2 = null) {
  if (0 === t2.length) return;
  const i2 = t2[0], s2 = /* @__PURE__ */ new Map(), f3 = [], u2 = $isElementNode(i2) ? i2 : i2.getParentOrThrow();
  let g3 = u2.isInline() ? u2.getParentOrThrow() : u2, d2 = false;
  for (; null !== g3; ) {
    const e3 = g3.getPreviousSibling();
    if (null !== e3) {
      g3 = e3, d2 = true;
      break;
    }
    if (g3 = g3.getParentOrThrow(), $isRootOrShadowRoot(g3)) break;
  }
  const p3 = /* @__PURE__ */ new Set();
  for (let e3 = 0; e3 < n2; e3++) {
    const n3 = t2[e3];
    $isElementNode(n3) && 0 === n3.getChildrenSize() && p3.add(n3.getKey());
  }
  const h3 = /* @__PURE__ */ new Set();
  for (let e3 = 0; e3 < n2; e3++) {
    const n3 = t2[e3];
    let l3 = n3.getParent();
    if (null !== l3 && l3.isInline() && (l3 = l3.getParent()), null !== l3 && $isLeafNode(n3) && !h3.has(n3.getKey())) {
      const e4 = l3.getKey();
      if (void 0 === s2.get(e4)) {
        const t3 = o2();
        t3.setFormat(l3.getFormatType()), t3.setIndent(l3.getIndent()), f3.push(t3), s2.set(e4, t3);
        const n4 = l3.getChildren();
        t3.splice(t3.getChildrenSize(), 0, n4);
        for (const e5 of n4) if (h3.add(e5.getKey()), $isElementNode(e5)) for (const t4 of e5.getChildrenKeys()) h3.add(t4);
        J2(l3);
      }
    } else if (p3.has(n3.getKey())) {
      $isElementNode(n3) || B2(179);
      const e4 = o2();
      e4.setFormat(n3.getFormatType()), e4.setIndent(n3.getIndent()), f3.push(e4), n3.remove(true);
    }
  }
  if (null !== l2) for (let e3 = 0; e3 < f3.length; e3++) {
    const t3 = f3[e3];
    l2.append(t3);
  }
  let y3 = null;
  if ($isRootOrShadowRoot(g3)) if (d2) if (null !== l2) g3.insertAfter(l2);
  else for (let e3 = f3.length - 1; e3 >= 0; e3--) {
    const t3 = f3[e3];
    g3.insertAfter(t3);
  }
  else {
    const e3 = g3, t3 = e3.getFirstChild();
    if ($isElementNode(t3) && (g3 = t3), null === t3) if (l2) e3.append(l2);
    else for (let t4 = 0; t4 < f3.length; t4++) {
      const n3 = f3[t4];
      e3.append(n3), y3 = n3;
    }
    else if (null !== l2) t3.insertBefore(l2);
    else for (let e4 = 0; e4 < f3.length; e4++) {
      const n3 = f3[e4];
      t3.insertBefore(n3), y3 = n3;
    }
  }
  else if (l2) g3.insertAfter(l2);
  else for (let e3 = f3.length - 1; e3 >= 0; e3--) {
    const t3 = f3[e3];
    g3.insertAfter(t3), y3 = t3;
  }
  const m3 = $getPreviousSelection();
  $isRangeSelection(m3) && G2(m3.anchor) && G2(m3.focus) ? $setSelection(m3.clone()) : null !== y3 ? y3.selectEnd() : e2.dirty = true;
}
function Z2(e2) {
  const t2 = ee2(e2);
  return null !== t2 && "vertical-rl" === t2.writingMode;
}
function ee2(e2) {
  const t2 = e2.anchor.getNode();
  return $isElementNode(t2) ? R2(t2) : O2(t2);
}
function te2(e2, n2) {
  let o2 = Z2(e2) ? !n2 : n2;
  oe2(e2) && (o2 = !o2);
  const l2 = $caretFromPoint(e2.focus, o2 ? "previous" : "next");
  if ($isExtendableTextPointCaret(l2)) return false;
  if ($isTextPointCaret(l2) && !$isTabNode(l2.origin) && l2.origin.isUnmergeable()) {
    const e3 = l2.getNodeAtCaret();
    if ($isTextNode(e3) && !$isTabNode(e3)) return true;
  }
  for (const e3 of $extendCaretToRange(l2)) {
    if ($isChildCaret(e3)) return !e3.origin.isInline();
    if (!$isElementNode(e3.origin)) {
      if ($isDecoratorNode(e3.origin)) return true;
      break;
    }
  }
  return false;
}
function ne2(e2, t2, n2, o2) {
  e2.modify(t2 ? "extend" : "move", n2, o2);
}
function oe2(e2) {
  const t2 = ee2(e2);
  return null !== t2 && "rtl" === t2.direction;
}
function le2(e2, t2, n2) {
  const o2 = oe2(e2);
  let l2;
  l2 = Z2(e2) || o2 ? !n2 : n2, ne2(e2, t2, l2, "character");
}
function re2(e2, t2, n2) {
  const o2 = e2.getStyle(), l2 = getStyleObjectFromCSS(o2);
  return null !== l2 && l2[t2] || n2;
}
function ie2(e2, n2, o2 = "") {
  let l2 = null;
  const i2 = e2.getNodes();
  let s2, c3;
  if ($isRangeSelection(e2)) {
    if (e2.isCollapsed() && "" !== e2.style) {
      const t2 = getStyleObjectFromCSS(e2.style);
      if (null !== t2 && n2 in t2) return t2[n2];
    }
    const { anchor: o3, focus: l3 } = e2, r2 = e2.isBackward(), i3 = r2 ? l3.getNode() : o3.getNode(), f3 = r2 ? o3.getNode() : l3.getNode(), u2 = r2 ? l3.offset : o3.offset, g3 = r2 ? o3.offset : l3.offset;
    $isTextNode(i3) && u2 === i3.getTextContentSize() && (s2 = i3), 0 === g3 && (c3 = f3);
  }
  for (let e3 = 0; e3 < i2.length; e3++) {
    const r2 = i2[e3];
    if ($isTextNode(r2) && !r2.is(0 === e3 ? s2 : c3)) {
      const e4 = re2(r2, n2, o2);
      if (null === l2) l2 = e4;
      else if (l2 !== e4) {
        l2 = "";
        break;
      }
    }
  }
  return null === l2 ? o2 : l2;
}
var se2 = getStyleObjectFromCSS;
var ce2 = $2;

// node_modules/@lexical/selection/dist/LexicalSelection.mjs
var mod2 = false ? LexicalSelection_dev_exports : LexicalSelection_prod_exports;
var $addNodeStyle = mod2.$addNodeStyle;
var $cloneWithProperties2 = mod2.$cloneWithProperties;
var $copyBlockFormatIndent = mod2.$copyBlockFormatIndent;
var $ensureForwardRangeSelection = mod2.$ensureForwardRangeSelection;
var $forEachSelectedTextNode = mod2.$forEachSelectedTextNode;
var $getComputedStyleForElement = mod2.$getComputedStyleForElement;
var $getComputedStyleForParent = mod2.$getComputedStyleForParent;
var $getSelectionStyleValueForProperty = mod2.$getSelectionStyleValueForProperty;
var $isAtEdgeOfElement = mod2.$isAtEdgeOfElement;
var $isAtNodeEnd = mod2.$isAtNodeEnd;
var $isParentElementRTL = mod2.$isParentElementRTL;
var $isParentRTL = mod2.$isParentRTL;
var $moveCaretSelection = mod2.$moveCaretSelection;
var $moveCharacter = mod2.$moveCharacter;
var $patchStyleText = mod2.$patchStyleText;
var $selectAll2 = mod2.$selectAll;
var $setBlocksType = mod2.$setBlocksType;
var $shouldOverrideDefaultCharacterSelection = mod2.$shouldOverrideDefaultCharacterSelection;
var $sliceSelectedTextNodeContent = mod2.$sliceSelectedTextNodeContent;
var $trimTextContentFromAnchor = mod2.$trimTextContentFromAnchor;
var $wrapNodes = mod2.$wrapNodes;
var createDOMRange = mod2.createDOMRange;
var createRectsFromDOMRange = mod2.createRectsFromDOMRange;
var getCSSFromStyleObject = mod2.getCSSFromStyleObject;
var getStyleObjectFromCSS2 = mod2.getStyleObjectFromCSS;
var trimTextContentFromAnchor = mod2.trimTextContentFromAnchor;

// node_modules/@lexical/utils/dist/LexicalUtils.prod.mjs
var LexicalUtils_prod_exports = {};
__export(LexicalUtils_prod_exports, {
  $descendantsMatching: () => Wt2,
  $dfs: () => dt2,
  $dfsIterator: () => pt2,
  $dfsWithSlots: () => ht2,
  $dfsWithSlotsIterator: () => mt2,
  $filter: () => Kt2,
  $findMatchingParent: () => $findMatchingParent,
  $firstToLastIterator: () => Xt2,
  $getAdjacentCaret: () => at2,
  $getAdjacentSiblingOrParentSiblingCaret: () => $getAdjacentSiblingOrParentSiblingCaret,
  $getDepth: () => Ct2,
  $getNearestBlockElementAncestorOrThrow: () => It2,
  $getNearestNodeOfType: () => _t2,
  $getNextRightPreorderNode: () => xt2,
  $getNextSiblingOrParentSibling: () => wt2,
  $handleIndentAndOutdent: () => $t2,
  $insertFirst: () => Ht2,
  $insertNodeIntoLeaf: () => Ot2,
  $insertNodeToNearestRoot: () => Bt2,
  $insertNodeToNearestRootAtCaret: () => $insertNodeToNearestRootAtCaret,
  $isAtEndOfNode: () => ee3,
  $isAtStartOfNode: () => te3,
  $isBlockFullySelected: () => Lt2,
  $isEditorIsNestedEditor: () => jt2,
  $lastToFirstIterator: () => Gt2,
  $onEscapeDown: () => Zt2,
  $onEscapeUp: () => Qt2,
  $restoreEditorState: () => Dt2,
  $reverseDfs: () => gt2,
  $reverseDfsIterator: () => St2,
  $reverseDfsWithSlots: () => Nt2,
  $reverseDfsWithSlotsIterator: () => At2,
  $splitNode: () => $splitNode,
  $unwrapAndFilterDescendants: () => zt2,
  $unwrapNode: () => qt2,
  $wrapNodeInElement: () => Tt2,
  CAN_USE_BEFORE_INPUT: () => CAN_USE_BEFORE_INPUT,
  CAN_USE_DOM: () => CAN_USE_DOM,
  IS_ANDROID: () => IS_ANDROID,
  IS_ANDROID_CHROME: () => IS_ANDROID_CHROME,
  IS_APPLE: () => IS_APPLE,
  IS_APPLE_WEBKIT: () => IS_APPLE_WEBKIT,
  IS_CHROME: () => IS_CHROME,
  IS_FIREFOX: () => IS_FIREFOX,
  IS_IOS: () => IS_IOS,
  IS_SAFARI: () => IS_SAFARI,
  addClassNamesToElement: () => addClassNamesToElement,
  calculateZoomLevel: () => Ut2,
  dedupeSelectionRects: () => tt2,
  eventFiles: () => Ft2,
  getScrollParent: () => ut2,
  isBlockDomNode: () => isBlockDomNode,
  isHTMLAnchorElement: () => isHTMLAnchorElement,
  isHTMLElement: () => isHTMLElement,
  isInlineDomNode: () => isInlineDomNode,
  isMimeType: () => ct2,
  makeStateWrapper: () => Jt2,
  markSelection: () => lt2,
  mediaFileReader: () => ft2,
  mergeRegister: () => mergeRegister,
  objectKlassEquals: () => Mt2,
  positionNodeOnRange: () => ot2,
  registerNestedElementResolver: () => Pt2,
  removeClassNamesFromElement: () => removeClassNamesFromElement,
  selectionAlwaysOnDisplay: () => st2
});
function Z3(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", t2);
  for (const t3 of e2) o2.append("v", t3);
  throw n2.search = o2.toString(), Error(`Minified Lexical error #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
function tt2(t2) {
  const e2 = (t3, e3) => e3.left >= t3.left - 1 && e3.top >= t3.top - 1 && e3.right <= t3.right + 1 && e3.bottom <= t3.bottom + 1, n2 = [];
  for (const o2 of Array.from(t2)) if (!(o2.width < 0.5 || o2.height < 0.5 || n2.some((t3) => e2(o2, t3)))) {
    for (let t3 = n2.length - 1; t3 >= 0; t3--) e2(n2[t3], o2) && n2.splice(t3, 1);
    n2.push(o2);
  }
  return n2;
}
function et2(t2) {
  return `${t2}px`;
}
var nt2 = { attributes: true, characterData: true, childList: true, subtree: true };
function ot2(e2, r2, i2) {
  let l2 = null, s2 = null, u2 = null, c3 = [];
  const f3 = getRootOwnerDocument(e2.getRootElement()).createElement("div");
  function d2() {
    null === l2 && Z3(182), null === s2 && Z3(183);
    const { left: o2, top: u3 } = s2.getBoundingClientRect(), d3 = tt2(createRectsFromDOMRange(e2, r2));
    var a3, g4;
    f3.isConnected || (g4 = f3, (a3 = s2).insertBefore(g4, a3.firstChild));
    let p3 = false;
    for (let t2 = 0; t2 < d3.length; t2++) {
      const e3 = d3[t2], r3 = c3[t2] || getRootOwnerDocument(l2).createElement("div"), i3 = r3.style;
      "absolute" !== i3.position && (i3.position = "absolute", p3 = true);
      const s3 = et2(e3.left - o2);
      i3.left !== s3 && (i3.left = s3, p3 = true);
      const a4 = et2(e3.top - u3);
      i3.top !== a4 && (r3.style.top = a4, p3 = true);
      const g5 = et2(e3.width);
      i3.width !== g5 && (r3.style.width = g5, p3 = true);
      const h3 = et2(e3.height);
      i3.height !== h3 && (r3.style.height = h3, p3 = true), r3.parentNode !== f3 && (f3.append(r3), p3 = true), c3[t2] = r3;
    }
    for (; c3.length > d3.length; ) {
      const t2 = c3.pop();
      null != t2 && t2.remove();
    }
    p3 && i2(c3);
  }
  function a2() {
    s2 = null, l2 = null, null !== u2 && u2.disconnect(), u2 = null, f3.remove();
    for (const t2 of c3) t2.remove();
    c3 = [];
  }
  f3.style.position = "relative";
  const g3 = e2.registerRootListener(function t2() {
    const n2 = e2.getRootElement();
    if (null === n2) return a2();
    const r3 = n2.parentElement;
    if (!isHTMLElement(r3)) return a2();
    a2(), l2 = n2, s2 = r3, u2 = new MutationObserver((n3) => {
      const o2 = e2.getRootElement(), r4 = o2 && o2.parentElement;
      if (o2 !== l2 || r4 !== s2) return t2();
      for (const t3 of n3) if (!f3.contains(t3.target)) return d2();
    }), u2.observe(r3, nt2), d2();
  });
  return () => {
    g3(), a2();
  };
}
function rt2(t2, e2, n2, o2) {
  if ("text" !== e2.type && $isElementNode(n2)) {
    const r2 = $getDOMSlot(n2, o2, t2);
    return [r2.element, r2.getFirstChildOffset() + e2.offset];
  }
  return [($isTextNode(n2) ? $getDOMTextNode(n2, o2, t2) : getDOMTextNode(o2)) || o2, e2.offset];
}
function it2(t2) {
  for (const e2 of t2) {
    const t3 = e2.style;
    "Highlight" !== t3.background && (t3.background = "Highlight"), "HighlightText" !== t3.color && (t3.color = "HighlightText"), t3.marginTop !== et2(-1.5) && (t3.marginTop = et2(-1.5)), t3.paddingTop !== et2(4) && (t3.paddingTop = et2(4)), t3.paddingBottom !== et2(0) && (t3.paddingBottom = et2(0));
  }
}
function lt2(t2, e2 = it2) {
  let n2 = null, o2 = null, s2 = null, u2 = null, c3 = null, f3 = null, d2 = () => {
  };
  function a2(r2) {
    r2.read(() => {
      const r3 = $getSelection();
      if (!$isRangeSelection(r3)) return n2 = null, s2 = null, u2 = null, f3 = null, d2(), void (d2 = () => {
      });
      const [a3, g3] = (function(t3) {
        const e3 = t3.getStartEndPoints();
        return t3.isBackward() ? [e3[1], e3[0]] : e3;
      })(r3), p3 = a3.getNode(), h3 = p3.getKey(), m3 = a3.offset, y3 = g3.getNode(), v2 = y3.getKey(), E3 = g3.offset, w2 = t2.getElementByKey(h3), C2 = t2.getElementByKey(v2), x3 = null === n2 || w2 !== o2 || m3 !== s2 || h3 !== n2.getKey(), S2 = null === u2 || C2 !== c3 || E3 !== f3 || v2 !== u2.getKey();
      if ((x3 || S2) && null !== w2 && null !== C2) {
        const n3 = (function(t3, e3, n4, o3, r4, i2, l2) {
          const s3 = (t3._window ? t3._window.document : document).createRange();
          return s3.setStart(...rt2(t3, e3, n4, o3)), s3.setEnd(...rt2(t3, r4, i2, l2)), s3;
        })(t2, a3, p3, w2, g3, y3, C2);
        d2(), d2 = ot2(t2, n3, e2);
      }
      n2 = p3, o2 = w2, s2 = m3, u2 = y3, c3 = C2, f3 = E3;
    }, { editor: t2 });
  }
  return a2(t2.getEditorState()), mergeRegister(t2.registerUpdateListener(({ editorState: t3 }) => a2(t3)), () => {
    d2();
  });
}
function st2(t2, e2) {
  let n2 = null;
  const o2 = () => {
    const o3 = t2.getRootElement(), r2 = null !== o3 ? o3.ownerDocument.defaultView : null, i2 = null !== r2 ? r2.getSelection() : null, l2 = null !== i2 ? getDOMSelectionPoints(i2, o3).anchorNode : null;
    null !== l2 && null !== o3 && o3.contains(l2) ? null !== n2 && (n2(), n2 = null) : null === n2 && (n2 = lt2(t2, e2));
  };
  return t2.registerRootListener((t3) => {
    if (t3) {
      const e3 = t3.ownerDocument, i2 = mergeRegister(registerEventListener(e3, "selectionchange", o2), () => {
        null !== n2 && n2();
      });
      return o2(), i2;
    }
  });
}
function ut2(t2, e2) {
  const n2 = t2.ownerDocument, o2 = n2.defaultView || window;
  let r2 = o2.getComputedStyle(t2);
  const i2 = "absolute" === r2.position, l2 = e2 ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
  if ("fixed" === r2.position) return n2.body;
  for (let e3 = t2; e3 = getParentElement(e3); ) if (r2 = o2.getComputedStyle(e3), (!i2 || "static" !== r2.position) && l2.test(r2.overflow + r2.overflowY + r2.overflowX)) return e3;
  return n2.body;
}
function ct2(t2, e2) {
  for (const n2 of e2) if (t2.type.startsWith(n2)) return true;
  return false;
}
function ft2(t2, e2) {
  const n2 = t2[Symbol.iterator]();
  return new Promise((t3, o2) => {
    const r2 = [], i2 = () => {
      const { done: l2, value: s2 } = n2.next();
      if (l2) return t3(r2);
      const u2 = new FileReader();
      u2.addEventListener("error", o2), u2.addEventListener("load", () => {
        const t4 = u2.result;
        "string" == typeof t4 && r2.push({ file: s2, result: t4 }), i2();
      }), ct2(s2, e2) ? u2.readAsDataURL(s2) : i2();
    };
    i2();
  });
}
function dt2(t2, e2) {
  return Array.from(pt2(t2, e2));
}
function at2(t2) {
  return t2 ? t2.getAdjacentCaret() : null;
}
function gt2(t2, e2) {
  return Array.from(St2(t2, e2));
}
function pt2(t2, e2) {
  return Et2("next", t2, e2);
}
function ht2(t2, e2) {
  return Array.from(mt2(t2, e2));
}
function* mt2(t2, e2) {
  for (const n2 of Et2("next", t2, e2)) {
    yield n2;
    const { node: t3, depth: o2 } = n2;
    if ($isSlotHost(t3) && !t3.is(e2)) for (const e3 of $getSlotNames(t3)) {
      const n3 = $getSlot(t3, e3);
      null !== n3 && (yield* yt2(n3, o2 + 1));
    }
  }
}
function* yt2(t2, e2) {
  yield { depth: e2, node: t2 };
  const n2 = e2 + 1;
  if ($isSlotHost(t2)) for (const e3 of $getSlotNames(t2)) {
    const o2 = $getSlot(t2, e3);
    null !== o2 && (yield* yt2(o2, n2));
  }
  if ($isElementNode(t2)) for (const e3 of t2.getChildren()) yield* yt2(e3, n2);
}
function vt2(t2, e2) {
  const n2 = $getAdjacentSiblingOrParentSiblingCaret($getSiblingCaret(t2, e2));
  return n2 && n2[0];
}
function Et2(t2, e2, n2) {
  const o2 = $getRoot(), r2 = e2 || o2, i2 = $isElementNode(r2) ? $getChildCaret(r2, t2) : $getSiblingCaret(r2, t2), l2 = Ct2(r2), u2 = n2 ? $getAdjacentChildCaret($getChildCaretOrSelf($getSiblingCaret(n2, t2))) || vt2(n2, t2) : vt2(r2, t2);
  let c3 = l2;
  return makeStepwiseIterator({ hasNext: (t3) => null !== t3, initial: i2, map: (t3) => ({ depth: c3, node: t3.origin }), step: (t3) => {
    if (t3.isSameNodeCaret(u2)) return null;
    $isChildCaret(t3) && c3++;
    const e3 = $getAdjacentSiblingOrParentSiblingCaret(t3);
    return !e3 || e3[0].isSameNodeCaret(u2) ? null : (c3 += e3[1], e3[0]);
  } });
}
function wt2(t2) {
  const e2 = $getAdjacentSiblingOrParentSiblingCaret($getSiblingCaret(t2, "next"));
  return e2 && [e2[0].origin, e2[1]];
}
function Ct2(t2) {
  let e2 = -1;
  for (let n2 = t2; null !== n2; n2 = n2.getParent() ?? $getSlotHost(n2)) e2++;
  return e2;
}
function xt2(t2) {
  const e2 = $getChildCaretOrSelf($getSiblingCaret(t2, "previous")), n2 = $getAdjacentSiblingOrParentSiblingCaret(e2, "root");
  return n2 && n2[0].origin;
}
function St2(t2, e2) {
  return Et2("previous", t2, e2);
}
function Nt2(t2, e2) {
  return Array.from(At2(t2, e2));
}
function* At2(t2, e2) {
  const n2 = [];
  for (const o2 of Et2("previous", t2, e2)) {
    for (; n2.length > 0 && o2.depth <= n2[n2.length - 1].depth; ) {
      const t4 = n2.pop();
      yield* bt2(t4.node, t4.depth + 1);
    }
    yield o2;
    const { node: t3, depth: r2 } = o2;
    $isSlotHost(t3) && $getSlotNames(t3).length > 0 && !t3.is(e2) && n2.push({ depth: r2, node: t3 });
  }
  for (; n2.length > 0; ) {
    const t3 = n2.pop();
    yield* bt2(t3.node, t3.depth + 1);
  }
}
function* bt2(t2, e2) {
  const n2 = $getSlotNames(t2);
  for (let o2 = n2.length - 1; o2 >= 0; o2--) {
    const r2 = $getSlot(t2, n2[o2]);
    null !== r2 && (yield* Rt2(r2, e2));
  }
}
function* Rt2(t2, e2) {
  yield { depth: e2, node: t2 };
  const n2 = e2 + 1;
  if ($isElementNode(t2)) {
    const e3 = t2.getChildren();
    for (let t3 = e3.length - 1; t3 >= 0; t3--) yield* Rt2(e3[t3], n2);
  }
  $isSlotHost(t2) && (yield* bt2(t2, n2));
}
function _t2(t2, e2) {
  let n2 = t2;
  for (; null != n2; ) {
    if (n2 instanceof e2) return n2;
    n2 = n2.getParent();
  }
  return null;
}
function It2(t2) {
  const e2 = $findMatchingParent(t2, (t3) => $isElementNode(t3) && !t3.isInline());
  return $isElementNode(e2) || Z3(4, t2.__key), e2;
}
function Lt2(t2, e2) {
  const n2 = $getCaretRangeInDirection($isRangeSelection(e2) ? $caretRangeFromSelection(e2) : e2, "next"), o2 = $getSlotFrame(n2.anchor.origin), r2 = $getSlotFrame(t2.getLatest());
  if (null === o2 ? null !== r2 : !o2.is(r2)) return false;
  const i2 = $normalizeCaret($getChildCaret(t2, "next")), s2 = $getCaretInDirection($normalizeCaret($getChildCaret(t2, "previous")), "next");
  return $comparePointCaretNext(n2.anchor, i2) <= 0 && $comparePointCaretNext(n2.focus, s2) >= 0;
}
function Pt2(t2, e2, n2, o2) {
  const r2 = (t3) => t3 instanceof e2;
  return t2.registerNodeTransform(e2, (t3) => {
    const e3 = ((t4) => {
      const e4 = t4.getChildren();
      for (let t5 = 0; t5 < e4.length; t5++) {
        const n4 = e4[t5];
        if (r2(n4)) return null;
      }
      let n3 = t4, o3 = t4;
      for (; null !== n3; ) if (o3 = n3, n3 = n3.getParent(), r2(n3)) return { child: o3, parent: n3 };
      return null;
    })(t3);
    if (null !== e3) {
      const { child: r3, parent: i2 } = e3;
      if (r3.is(t3)) {
        o2(i2, t3);
        const e4 = r3.getNextSiblings(), l2 = e4.length;
        if (i2.insertAfter(r3), 0 !== l2) {
          const t4 = n2(i2);
          r3.insertAfter(t4);
          for (let n3 = 0; n3 < l2; n3++) t4.append(e4[n3]);
        }
        i2.canBeEmpty() || 0 !== i2.getChildrenSize() || i2.remove();
      }
    }
  });
}
function Dt2(t2, e2) {
  const n2 = /* @__PURE__ */ new Map(), o2 = t2._pendingEditorState;
  for (const [t3, o3] of e2._nodeMap) n2.set(t3, $cloneWithProperties(o3));
  o2 && (o2._nodeMap = n2), $fullReconcile();
  const r2 = e2._selection;
  $setSelection(null === r2 ? null : r2.clone());
}
function Bt2(t2) {
  const e2 = $getSelection() || $getPreviousSelection();
  let n2;
  if ($isRangeSelection(e2)) n2 = $caretFromPoint(e2.focus, "next");
  else {
    if (null != e2) {
      const t3 = e2.getNodes(), o3 = t3[t3.length - 1];
      o3 && (n2 = $getSiblingCaret(o3, "next"));
    }
    n2 = n2 || $getChildCaret($getRoot(), "previous").getFlipped().insert($createParagraphNode());
  }
  const o2 = $insertNodeToNearestRootAtCaret(t2, n2), r2 = $getAdjacentChildCaret(o2), s2 = $isChildCaret(r2) ? $normalizeCaret(r2) : o2;
  return $setSelectionFromCaretRange($getCollapsedCaretRange(s2)), t2.getLatest();
}
function Ot2(t2) {
  const e2 = $getSelection();
  if (!$isRangeSelection(e2)) return void (e2 && e2.insertNodes([t2]));
  const n2 = $caretRangeFromSelection(e2);
  let o2 = $getCaretRangeInDirection($removeTextFromCaretRange(n2), "next").anchor;
  if ($isTextPointCaret(o2)) {
    const t3 = $splitAtPointCaretNext(o2);
    if (!t3) return;
    o2 = t3;
  }
  const r2 = o2.getFlipped();
  r2.insert(t2), $setSelectionFromCaretRange($getCaretRange(r2, r2));
}
function Tt2(t2, e2) {
  const n2 = e2();
  return t2.replace(n2), n2.append(t2), n2;
}
function Mt2(t2, e2) {
  return null !== t2 && Object.getPrototypeOf(t2).constructor.name === e2.name;
}
function Ft2(t2) {
  let e2 = null;
  if (Mt2(t2, DragEvent) ? e2 = t2.dataTransfer : Mt2(t2, ClipboardEvent) && (e2 = t2.clipboardData), null === e2) return [false, [], false];
  const n2 = e2.types, o2 = n2.includes("Files"), r2 = n2.includes("text/html") || n2.includes("text/plain");
  return [o2, Array.from(e2.files), r2];
}
function Kt2(t2, e2) {
  const n2 = [];
  for (let o2 = 0; o2 < t2.length; o2++) {
    const r2 = e2(t2[o2]);
    null !== r2 && n2.push(r2);
  }
  return n2;
}
function $t2(t2) {
  const e2 = $getSelection();
  if (!$isRangeSelection(e2)) return false;
  const n2 = /* @__PURE__ */ new Set(), o2 = e2.getNodes();
  for (let e3 = 0; e3 < o2.length; e3++) {
    const r2 = o2[e3], i2 = r2.getKey();
    if (n2.has(i2)) continue;
    const l2 = $findMatchingParent(r2, (t3) => $isElementNode(t3) && !t3.isInline());
    if (null === l2) continue;
    const u2 = l2.getKey();
    l2.canIndent() && !n2.has(u2) && (n2.add(u2), t2(l2));
  }
  return n2.size > 0;
}
function Ht2(t2, e2) {
  $getChildCaret(t2, "next").insert(e2);
}
var kt2 = !(IS_FIREFOX || !CAN_USE_DOM) && void 0;
function Ut2(t2, e2 = false) {
  let n2 = 1;
  if ((function() {
    if (void 0 === kt2) {
      const t3 = document.createElement("div");
      t3.style.position = "absolute", t3.style.opacity = "0", t3.style.width = "100px", t3.style.left = "-1000px", document.body.appendChild(t3);
      const e3 = t3.getBoundingClientRect();
      t3.style.setProperty("zoom", "2"), kt2 = t3.getBoundingClientRect().width === e3.width, document.body.removeChild(t3);
    }
    return kt2;
  })() || e2) {
    const e3 = t2 && t2.ownerDocument.defaultView || window;
    for (; t2; ) n2 *= Number(e3.getComputedStyle(t2).getPropertyValue("zoom")), t2 = getParentElement(t2);
  }
  return n2;
}
function jt2(t2) {
  return null !== t2._parentEditor;
}
function zt2(t2, e2) {
  return Vt2(t2, e2, null);
}
function Vt2(t2, e2, n2) {
  let o2 = false;
  for (const r2 of Gt2(t2)) e2(r2) ? null !== n2 && n2(r2) : (o2 = true, $isElementNode(r2) && Vt2(r2, e2, n2 || ((t3) => r2.insertAfter(t3))), r2.remove());
  return o2;
}
function Wt2(t2, e2) {
  const n2 = [], o2 = Array.from(t2).reverse();
  for (let t3 = o2.pop(); void 0 !== t3; t3 = o2.pop()) if (e2(t3)) n2.push(t3);
  else if ($isElementNode(t3)) for (const e3 of Gt2(t3)) o2.push(e3);
  return n2;
}
function Xt2(t2) {
  return Yt2($getChildCaret(t2, "next"));
}
function Gt2(t2) {
  return Yt2($getChildCaret(t2, "previous"));
}
function Yt2(t2) {
  return makeStepwiseIterator({ hasNext: $isSiblingCaret, initial: t2.getAdjacentCaret(), map: (t3) => t3.origin.getLatest(), step: (t3) => t3.getAdjacentCaret() });
}
function qt2(t2) {
  $rewindSiblingCaret($getSiblingCaret(t2, "next")).splice(1, t2.getChildren());
}
function Jt2(t2) {
  const e2 = (e3) => $getState(e3, t2), n2 = (e3, n3) => $setState(e3, t2, n3);
  return { $get: e2, $set: n2, accessors: [e2, n2], makeGetterMethod: () => function() {
    return e2(this);
  }, makeSetterMethod: () => function(t3) {
    return n2(this, t3);
  }, stateConfig: t2 };
}
function Qt2(t2, e2) {
  const n2 = $getSelection();
  if ($isRangeSelection(n2) && n2.isCollapsed()) {
    const o2 = $findMatchingParent(n2.anchor.getNode(), t2);
    if (o2) {
      const t3 = o2.getParent();
      if (null !== t3 && t3.getFirstChild() === o2 && te3(n2.anchor, o2)) return o2.insertBefore($createParagraphNode()).selectEnd(), e2 && e2.preventDefault(), true;
    }
  }
  return false;
}
function Zt2(t2, e2) {
  const n2 = $getSelection();
  if ($isRangeSelection(n2) && n2.isCollapsed()) {
    const o2 = $findMatchingParent(n2.anchor.getNode(), t2);
    if (o2) {
      const t3 = o2.getParent();
      if (null !== t3 && t3.getLastChild() === o2 && ee3(n2.anchor, o2)) return o2.insertAfter($createParagraphNode()).selectEnd(), e2 && e2.preventDefault(), true;
    }
  }
  return false;
}
function te3(t2, n2) {
  return $isAtEdgeOfElement(t2, n2, "previous");
}
function ee3(t2, n2) {
  return $isAtEdgeOfElement(t2, n2, "next");
}

// node_modules/@lexical/utils/dist/LexicalUtils.mjs
var mod3 = false ? LexicalUtils_dev_exports : LexicalUtils_prod_exports;
var $descendantsMatching = mod3.$descendantsMatching;
var $dfs = mod3.$dfs;
var $dfsIterator = mod3.$dfsIterator;
var $dfsWithSlots = mod3.$dfsWithSlots;
var $dfsWithSlotsIterator = mod3.$dfsWithSlotsIterator;
var $filter = mod3.$filter;
var $findMatchingParent2 = mod3.$findMatchingParent;
var $firstToLastIterator = mod3.$firstToLastIterator;
var $getAdjacentCaret = mod3.$getAdjacentCaret;
var $getAdjacentSiblingOrParentSiblingCaret2 = mod3.$getAdjacentSiblingOrParentSiblingCaret;
var $getDepth = mod3.$getDepth;
var $getNearestBlockElementAncestorOrThrow = mod3.$getNearestBlockElementAncestorOrThrow;
var $getNearestNodeOfType = mod3.$getNearestNodeOfType;
var $getNextRightPreorderNode = mod3.$getNextRightPreorderNode;
var $getNextSiblingOrParentSibling = mod3.$getNextSiblingOrParentSibling;
var $handleIndentAndOutdent = mod3.$handleIndentAndOutdent;
var $insertFirst = mod3.$insertFirst;
var $insertNodeIntoLeaf = mod3.$insertNodeIntoLeaf;
var $insertNodeToNearestRoot = mod3.$insertNodeToNearestRoot;
var $insertNodeToNearestRootAtCaret2 = mod3.$insertNodeToNearestRootAtCaret;
var $isAtEndOfNode = mod3.$isAtEndOfNode;
var $isAtStartOfNode = mod3.$isAtStartOfNode;
var $isBlockFullySelected = mod3.$isBlockFullySelected;
var $isEditorIsNestedEditor = mod3.$isEditorIsNestedEditor;
var $lastToFirstIterator = mod3.$lastToFirstIterator;
var $onEscapeDown = mod3.$onEscapeDown;
var $onEscapeUp = mod3.$onEscapeUp;
var $restoreEditorState = mod3.$restoreEditorState;
var $reverseDfs = mod3.$reverseDfs;
var $reverseDfsIterator = mod3.$reverseDfsIterator;
var $reverseDfsWithSlots = mod3.$reverseDfsWithSlots;
var $reverseDfsWithSlotsIterator = mod3.$reverseDfsWithSlotsIterator;
var $splitNode2 = mod3.$splitNode;
var $unwrapAndFilterDescendants = mod3.$unwrapAndFilterDescendants;
var $unwrapNode = mod3.$unwrapNode;
var $wrapNodeInElement = mod3.$wrapNodeInElement;
var CAN_USE_BEFORE_INPUT2 = mod3.CAN_USE_BEFORE_INPUT;
var CAN_USE_DOM2 = mod3.CAN_USE_DOM;
var IS_ANDROID2 = mod3.IS_ANDROID;
var IS_ANDROID_CHROME2 = mod3.IS_ANDROID_CHROME;
var IS_APPLE2 = mod3.IS_APPLE;
var IS_APPLE_WEBKIT2 = mod3.IS_APPLE_WEBKIT;
var IS_CHROME2 = mod3.IS_CHROME;
var IS_FIREFOX2 = mod3.IS_FIREFOX;
var IS_IOS2 = mod3.IS_IOS;
var IS_SAFARI2 = mod3.IS_SAFARI;
var addClassNamesToElement2 = mod3.addClassNamesToElement;
var calculateZoomLevel = mod3.calculateZoomLevel;
var dedupeSelectionRects = mod3.dedupeSelectionRects;
var eventFiles = mod3.eventFiles;
var getScrollParent = mod3.getScrollParent;
var isBlockDomNode2 = mod3.isBlockDomNode;
var isHTMLAnchorElement2 = mod3.isHTMLAnchorElement;
var isHTMLElement2 = mod3.isHTMLElement;
var isInlineDomNode2 = mod3.isInlineDomNode;
var isMimeType = mod3.isMimeType;
var makeStateWrapper = mod3.makeStateWrapper;
var markSelection = mod3.markSelection;
var mediaFileReader = mod3.mediaFileReader;
var mergeRegister2 = mod3.mergeRegister;
var objectKlassEquals = mod3.objectKlassEquals;
var positionNodeOnRange = mod3.positionNodeOnRange;
var registerNestedElementResolver = mod3.registerNestedElementResolver;
var removeClassNamesFromElement2 = mod3.removeClassNamesFromElement;
var selectionAlwaysOnDisplay = mod3.selectionAlwaysOnDisplay;

// node_modules/@lexical/extension/dist/LexicalExtension.prod.mjs
var LexicalExtension_prod_exports = {};
__export(LexicalExtension_prod_exports, {
  $applyFormatToDom: () => we2,
  $createHorizontalRuleNode: () => pn2,
  $defaultShouldInsertAfter: () => he2,
  $getExtensionDependency: () => cn2,
  $getExtensionOutput: () => an2,
  $getPeerDependency: () => dn2,
  $isDecoratorTextNode: () => Ee2,
  $isHorizontalRuleNode: () => mn2,
  AutoFocusExtension: () => de2,
  ClearEditorExtension: () => fe2,
  ClickAfterLastBlockExtension: () => pe2,
  DecoratorTextExtension: () => Re2,
  DecoratorTextNode: () => ye2,
  EditorStateExtension: () => De2,
  HorizontalRuleExtension: () => vn2,
  HorizontalRuleNode: () => hn2,
  IMEExtension: () => xn2,
  INSERT_HORIZONTAL_RULE_COMMAND: () => fn2,
  InitialStateExtension: () => Je2,
  LexicalBuilder: () => nn2,
  NestedEditorExtension: () => yn2,
  NodeSelectionDataSelectedExtension: () => En2,
  NodeSelectionExtension: () => un2,
  NormalizeInlineElementsExtension: () => Sn2,
  NormalizeTripleClickSelectionExtension: () => Nn2,
  PreventSelectAllExtension: () => Rn2,
  RootElementExtension: () => Cn2,
  SelectBlockExtension: () => Dn2,
  SelectionAlwaysOnDisplayExtension: () => In2,
  TabIndentationExtension: () => kn2,
  WatchEditableExtension: () => _n2,
  applyFormatFromStyle: () => be2,
  applyFormatToDom: () => Se2,
  batch: () => jt3,
  buildEditorFromExtensions: () => Ye2,
  computed: () => ne3,
  configExtension: () => configExtension,
  declarePeerDependency: () => declarePeerDependency,
  defineExtension: () => defineExtension,
  effect: () => ce3,
  getExtensionDependencyFromEditor: () => on2,
  getKnownTypesAndNodes: () => me2,
  getPeerDependencyFromEditor: () => sn2,
  getPeerDependencyFromEditorOrThrow: () => rn2,
  namedSignals: () => ae2,
  registerClearEditor: () => ue2,
  registerTabIndentation: () => Mn2,
  safeCast: () => safeCast,
  shallowMergeConfig: () => shallowMergeConfig,
  signal: () => Yt3,
  untracked: () => Ut3,
  watchedSignal: () => Ce2
});
var Kt3 = Symbol.for("preact-signals");
function $t3() {
  if (Bt3 > 1) return void Bt3--;
  let t2, e2 = false;
  for (!(function() {
    let t3 = Wt3;
    for (Wt3 = void 0; void 0 !== t3; ) t3.S.v === t3.v && (t3.S.i = t3.i), t3 = t3.o;
  })(); void 0 !== zt3; ) {
    let n2 = zt3;
    for (zt3 = void 0, Vt3++; void 0 !== n2; ) {
      const i2 = n2.u;
      if (n2.u = void 0, n2.f &= -3, !(8 & n2.f) && qt3(n2)) try {
        n2.c();
      } catch (n3) {
        e2 || (t2 = n3, e2 = true);
      }
      n2 = i2;
    }
  }
  if (Vt3 = 0, Bt3--, e2) throw t2;
}
function jt3(t2) {
  if (Bt3 > 0) return t2();
  Zt3 = ++Gt3, Bt3++;
  try {
    return t2();
  } finally {
    $t3();
  }
}
var Tt3;
var zt3;
function Ut3(t2) {
  const e2 = Tt3;
  Tt3 = void 0;
  try {
    return t2();
  } finally {
    Tt3 = e2;
  }
}
var Wt3;
var Bt3 = 0;
var Vt3 = 0;
var Gt3 = 0;
var Zt3 = 0;
var Ht3 = 0;
function Jt3(t2) {
  if (void 0 === Tt3) return;
  let e2 = t2.n;
  return void 0 === e2 || e2.t !== Tt3 ? (e2 = { i: 0, S: t2, p: Tt3.s, n: void 0, t: Tt3, e: void 0, x: void 0, r: e2 }, void 0 !== Tt3.s && (Tt3.s.n = e2), Tt3.s = e2, t2.n = e2, 32 & Tt3.f && t2.S(e2), e2) : -1 === e2.i ? (e2.i = 0, void 0 !== e2.n && (e2.n.p = e2.p, void 0 !== e2.p && (e2.p.n = e2.n), e2.p = Tt3.s, e2.n = void 0, Tt3.s.n = e2, Tt3.s = e2), e2) : void 0;
}
function Xt3(t2, e2) {
  this.v = t2, this.i = 0, this.n = void 0, this.t = void 0, this.l = 0, this.W = null == e2 ? void 0 : e2.watched, this.Z = null == e2 ? void 0 : e2.unwatched, this.name = null == e2 ? void 0 : e2.name;
}
function Yt3(t2, e2) {
  return new Xt3(t2, e2);
}
function qt3(t2) {
  for (let e2 = t2.s; void 0 !== e2; e2 = e2.n) if (e2.S.i !== e2.i || !e2.S.h() || e2.S.i !== e2.i) return true;
  return false;
}
function Qt3(t2) {
  for (let e2 = t2.s; void 0 !== e2; e2 = e2.n) {
    const n2 = e2.S.n;
    if (void 0 !== n2 && (e2.r = n2), e2.S.n = e2, e2.i = -1, void 0 === e2.n) {
      t2.s = e2;
      break;
    }
  }
}
function te4(t2) {
  let e2, n2 = t2.s;
  for (; void 0 !== n2; ) {
    const t3 = n2.p;
    -1 === n2.i ? (n2.S.U(n2), void 0 !== t3 && (t3.n = n2.n), void 0 !== n2.n && (n2.n.p = t3)) : e2 = n2, n2.S.n = n2.r, void 0 !== n2.r && (n2.r = void 0), n2 = t3;
  }
  t2.s = e2;
}
function ee4(t2, e2) {
  Xt3.call(this, void 0), this.x = t2, this.s = void 0, this.g = Ht3 - 1, this.f = 4, this.W = null == e2 ? void 0 : e2.watched, this.Z = null == e2 ? void 0 : e2.unwatched, this.name = null == e2 ? void 0 : e2.name;
}
function ne3(t2, e2) {
  return new ee4(t2, e2);
}
function ie3(t2) {
  const e2 = t2.m;
  if (t2.m = void 0, "function" == typeof e2) {
    Bt3++;
    const n2 = Tt3;
    Tt3 = void 0;
    try {
      e2();
    } catch (e3) {
      throw t2.f &= -2, t2.f |= 8, oe3(t2), e3;
    } finally {
      Tt3 = n2, $t3();
    }
  }
}
function oe3(t2) {
  for (let e2 = t2.s; void 0 !== e2; e2 = e2.n) e2.S.U(e2);
  t2.x = void 0, t2.s = void 0, ie3(t2);
}
function se3(t2) {
  if (Tt3 !== this) throw new Error("Out-of-order effect");
  te4(this), Tt3 = t2, this.f &= -2, 8 & this.f && oe3(this), $t3();
}
function re3(t2, e2) {
  this.x = t2, this.m = void 0, this.s = void 0, this.u = void 0, this.f = 32, this.name = null == e2 ? void 0 : e2.name;
}
function ce3(t2, e2) {
  const n2 = new re3(t2, e2);
  try {
    n2.c();
  } catch (t3) {
    throw n2.d(), t3;
  }
  const i2 = n2.d.bind(n2);
  return i2[Symbol.dispose] = i2, i2;
}
function ae2(t2, e2 = {}) {
  const n2 = {};
  for (const i2 in t2) {
    const o2 = e2[i2], s2 = Yt3(void 0 === o2 ? t2[i2] : o2);
    n2[i2] = s2;
  }
  return n2;
}
Xt3.prototype.brand = Kt3, Xt3.prototype.h = function() {
  return true;
}, Xt3.prototype.S = function(t2) {
  const e2 = this.t;
  e2 !== t2 && void 0 === t2.e && (t2.x = e2, this.t = t2, void 0 !== e2 ? e2.e = t2 : Ut3(() => {
    var t3;
    null == (t3 = this.W) || t3.call(this);
  }));
}, Xt3.prototype.U = function(t2) {
  if (void 0 !== this.t) {
    const e2 = t2.e, n2 = t2.x;
    void 0 !== e2 && (e2.x = n2, t2.e = void 0), void 0 !== n2 && (n2.e = e2, t2.x = void 0), t2 === this.t && (this.t = n2, void 0 === n2 && Ut3(() => {
      var t3;
      null == (t3 = this.Z) || t3.call(this);
    }));
  }
}, Xt3.prototype.subscribe = function(t2) {
  return ce3(() => {
    const e2 = this.value, n2 = Tt3;
    Tt3 = void 0;
    try {
      t2(e2);
    } finally {
      Tt3 = n2;
    }
  }, { name: "sub" });
}, Xt3.prototype.valueOf = function() {
  return this.value;
}, Xt3.prototype.toString = function() {
  return this.value + "";
}, Xt3.prototype.toJSON = function() {
  return this.value;
}, Xt3.prototype.peek = function() {
  const t2 = Tt3;
  Tt3 = void 0;
  try {
    return this.value;
  } finally {
    Tt3 = t2;
  }
}, Object.defineProperty(Xt3.prototype, "value", { get() {
  const t2 = Jt3(this);
  return void 0 !== t2 && (t2.i = this.i), this.v;
}, set(t2) {
  if (t2 !== this.v) {
    if (Vt3 > 100) throw new Error("Cycle detected");
    !(function(t3) {
      0 !== Bt3 && 0 === Vt3 && t3.l !== Zt3 && (t3.l = Zt3, Wt3 = { S: t3, v: t3.v, i: t3.i, o: Wt3 });
    })(this), this.v = t2, this.i++, Ht3++, Bt3++;
    try {
      for (let t3 = this.t; void 0 !== t3; t3 = t3.x) t3.t.N();
    } finally {
      $t3();
    }
  }
} }), ee4.prototype = new Xt3(), ee4.prototype.h = function() {
  if (this.f &= -3, 1 & this.f) return false;
  if (32 == (36 & this.f)) return true;
  if (this.f &= -5, this.g === Ht3) return true;
  if (this.g = Ht3, this.f |= 1, this.i > 0 && !qt3(this)) return this.f &= -2, true;
  const t2 = Tt3;
  try {
    Qt3(this), Tt3 = this;
    const t3 = this.x();
    (16 & this.f || this.v !== t3 || 0 === this.i) && (this.v = t3, this.f &= -17, this.i++);
  } catch (t3) {
    this.v = t3, this.f |= 16, this.i++;
  }
  return Tt3 = t2, te4(this), this.f &= -2, true;
}, ee4.prototype.S = function(t2) {
  if (void 0 === this.t) {
    this.f |= 36;
    for (let t3 = this.s; void 0 !== t3; t3 = t3.n) t3.S.S(t3);
  }
  Xt3.prototype.S.call(this, t2);
}, ee4.prototype.U = function(t2) {
  if (void 0 !== this.t && (Xt3.prototype.U.call(this, t2), void 0 === this.t)) {
    this.f &= -33;
    for (let t3 = this.s; void 0 !== t3; t3 = t3.n) t3.S.U(t3);
  }
}, ee4.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (let t2 = this.t; void 0 !== t2; t2 = t2.x) t2.t.N();
  }
}, Object.defineProperty(ee4.prototype, "value", { get() {
  if (1 & this.f) throw new Error("Cycle detected");
  const t2 = Jt3(this);
  if (this.h(), void 0 !== t2 && (t2.i = this.i), 16 & this.f) throw this.v;
  return this.v;
} }), re3.prototype.c = function() {
  const t2 = this.S();
  try {
    if (8 & this.f) return;
    if (void 0 === this.x) return;
    const t3 = this.x();
    "function" == typeof t3 && (this.m = t3);
  } finally {
    t2();
  }
}, re3.prototype.S = function() {
  if (1 & this.f) throw new Error("Cycle detected");
  this.f |= 1, this.f &= -9, ie3(this), Qt3(this), Bt3++;
  const t2 = Tt3;
  return Tt3 = this, se3.bind(this, t2);
}, re3.prototype.N = function() {
  2 & this.f || (this.f |= 2, this.u = zt3, zt3 = this);
}, re3.prototype.d = function() {
  this.f |= 8, 1 & this.f || oe3(this);
}, re3.prototype.dispose = function() {
  this.d();
};
var de2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ defaultSelection: "rootEnd", disabled: false }), name: "@lexical/extension/AutoFocus", register(t2, e2, i2) {
  const o2 = i2.getOutput();
  return ce3(() => o2.disabled.value ? void 0 : t2.registerRootListener((e3) => {
    t2.focus(() => {
      const t3 = null !== e3 ? getActiveElement(e3) : null;
      null === e3 || null !== t3 && e3.contains(t3) || e3.focus({ preventScroll: true });
    }, { defaultSelection: o2.defaultSelection.peek() });
  }));
} });
function le3() {
  const t2 = $getRoot(), e2 = $getSelection(), n2 = $createParagraphNode();
  t2.clear(), t2.append(n2), null !== e2 && n2.select(), $isRangeSelection(e2) && (e2.format = 0);
}
function ue2(t2, e2 = le3) {
  return t2.registerCommand(CLEAR_EDITOR_COMMAND, () => (e2(), true), COMMAND_PRIORITY_EDITOR);
}
var fe2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ $onClear: le3 }), name: "@lexical/extension/ClearEditor", register(t2, e2, n2) {
  const { $onClear: i2 } = n2.getOutput();
  return ce3(() => ue2(t2, i2.value));
} });
function he2(t2) {
  return !!$isDecoratorNode(t2) || !(!$isElementNode(t2) || !t2.isShadowRoot());
}
function ge2(t2, e2, n2, i2) {
  return !!t2.isEditable() && (n2.target === e2 && t2.read("latest", () => {
    const e3 = $getRoot().getLastChild();
    if (null === e3) return false;
    const o2 = t2.getElementByKey(e3.getKey());
    return null !== o2 && (!(n2.clientY <= o2.getBoundingClientRect().bottom) && i2(e3));
  }));
}
var pe2 = /* @__PURE__ */ defineExtension({ build: (t2, e2) => ae2(e2), config: /* @__PURE__ */ safeCast({ $shouldInsertAfter: he2, disabled: false }), name: "@lexical/ClickAfterLastBlock", register: (t2, e2, n2) => ce3(() => {
  const e3 = n2.getOutput();
  if (!e3.disabled.value) return t2.registerRootListener((n3) => {
    if (null === n3) return;
    return registerEventListeners(n3, { click: (i2) => {
      ge2(t2, n3, i2, e3.$shouldInsertAfter.peek()) && (i2.preventDefault(), stopLexicalPropagation(i2), t2.update(() => {
        const t3 = $getRoot().getLastChild();
        if (null === t3) return;
        if (!e3.$shouldInsertAfter.peek()(t3)) return;
        const n4 = $createParagraphNode();
        t3.insertAfter(n4), n4.select();
      }));
    }, mousedown: (i2) => {
      ge2(t2, n3, i2, e3.$shouldInsertAfter.peek()) && i2.preventDefault();
    } }, true);
  });
}) });
function me2(t2) {
  const e2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set();
  for (const i2 of ve2(t2)) {
    const t3 = "function" == typeof i2 ? i2 : i2.replace;
    getStaticNodeConfig(t3), e2.add(t3.getType()), n2.add(t3);
  }
  return { nodes: n2, types: e2 };
}
function ve2(t2) {
  return ("function" == typeof t2.nodes ? t2.nodes() : t2.nodes) || [];
}
var xe2 = /* @__PURE__ */ createState("format", { parse: (t2) => "number" == typeof t2 ? t2 : 0 });
var ye2 = class extends DecoratorNode {
  get __isInlineFormattable() {
    return true;
  }
  $config() {
    return this.config("decorator-text", { extends: DecoratorNode, stateConfigs: [{ flat: true, stateConfig: xe2 }] });
  }
  getFormat(t2) {
    return $getState(this, xe2, t2);
  }
  getFormatFlags(t2, e2) {
    return toggleTextFormatType(this.getFormat(), t2, e2);
  }
  hasFormat(t2) {
    const e2 = TEXT_TYPE_TO_FORMAT[t2];
    return 0 !== (this.getFormat() & e2);
  }
  setFormat(t2) {
    return $setState(this, xe2, t2);
  }
  toggleFormat(t2) {
    const e2 = this.getFormat(), n2 = toggleTextFormatType(e2, t2, null);
    return this.setFormat(n2);
  }
  isInline() {
    return true;
  }
  createDOM(t2, e2) {
    return $getDocument().createElement("span");
  }
};
function Ee2(t2) {
  return t2 instanceof ye2;
}
function be2(t2, e2, n2) {
  const i2 = e2.fontWeight, o2 = e2.textDecoration.split(" "), s2 = "700" === i2 || "bold" === i2, r2 = o2.includes("line-through"), c3 = "italic" === e2.fontStyle, a2 = o2.includes("underline"), d2 = e2.verticalAlign;
  return s2 && !t2.hasFormat("bold") && t2.toggleFormat("bold"), r2 && !t2.hasFormat("strikethrough") && t2.toggleFormat("strikethrough"), c3 && !t2.hasFormat("italic") && t2.toggleFormat("italic"), a2 && !t2.hasFormat("underline") && t2.toggleFormat("underline"), "sub" !== d2 || t2.hasFormat("subscript") || t2.toggleFormat("subscript"), "super" !== d2 || t2.hasFormat("superscript") || t2.toggleFormat("superscript"), n2 && !t2.hasFormat(n2) && t2.toggleFormat(n2), t2;
}
function Se2(t2, e2, n2 = Oe2) {
  let i2 = e2;
  for (const [e3, o2] of Object.entries(n2)) t2.hasFormat(o2) && (i2 = Ne2(i2, e3));
  return i2;
}
var we2 = Se2;
function Ne2(t2, e2) {
  const n2 = t2.ownerDocument.createElement(e2);
  return n2.appendChild(t2), n2;
}
var Oe2 = { b: "bold", code: "code", em: "italic", i: "italic", mark: "highlight", s: "strikethrough", strong: "bold", sub: "subscript", sup: "superscript", u: "underline" };
var Re2 = /* @__PURE__ */ defineExtension({ name: "@lexical/extension/DecoratorText", nodes: () => [ye2] });
function Ce2(t2, e2) {
  let n2;
  return Yt3(t2(), { unwatched() {
    n2 && (n2(), n2 = void 0);
  }, watched() {
    this.value = t2(), n2 = e2(this);
  } });
}
var De2 = /* @__PURE__ */ defineExtension({ build: (t2) => Ce2(() => t2.getEditorState(), (e2) => t2.registerUpdateListener((t3) => {
  e2.value = t3.editorState;
})), name: "@lexical/extension/EditorState" });
function Ie2(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), i2 = new URLSearchParams();
  i2.append("code", t2);
  for (const t3 of e2) i2.append("v", t3);
  throw n2.search = i2.toString(), Error(`Minified Lexical error #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
var Fe2;
try {
  Fe2 = "0.49.0+prod.esm";
} catch (t2) {
}
var Me2 = Fe2 ?? '"<unknown>+source"';
var ke2 = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function _e2(t2, e2) {
  if (t2 && e2 && !Array.isArray(e2) && "object" == typeof t2 && "object" == typeof e2) {
    const n2 = t2, i2 = e2;
    for (const t3 in i2) !ke2.has(t3) && Object.prototype.hasOwnProperty.call(i2, t3) && (n2[t3] = _e2(n2[t3], i2[t3]));
    return t2;
  }
  return e2;
}
var Ae2 = 0;
var Pe2 = 1;
var Le2 = 2;
var Ke2 = 3;
var $e2 = 4;
var je2 = 5;
var Te2 = 6;
var ze2 = 7;
function Ue2(t2) {
  return t2.id === Ae2;
}
function We2(t2) {
  return t2.id === Le2;
}
function Be2(t2) {
  return (function(t3) {
    return t3.id === Pe2;
  })(t2) || Ie2(305, String(t2.id), String(Pe2)), Object.assign(t2, { id: Le2 });
}
var Ve2 = /* @__PURE__ */ new Set();
var Ge2 = class {
  builder;
  configs;
  _dependency;
  _peerNameSet;
  extension;
  state;
  _signal;
  constructor(t2, e2) {
    this.builder = t2, this.extension = e2, this.configs = /* @__PURE__ */ new Set(), this.state = { id: Ae2 };
  }
  mergeConfigs() {
    let t2 = this.extension.config || {};
    const e2 = this.extension.mergeConfig ? this.extension.mergeConfig.bind(this.extension) : shallowMergeConfig;
    for (const n2 of this.configs) t2 = e2(t2, n2);
    return t2;
  }
  init(t2) {
    const e2 = this.state;
    We2(e2) || Ie2(306, String(e2.id));
    const n2 = { getDependency: this.getInitDependency.bind(this), getDirectDependentNames: this.getDirectDependentNames.bind(this), getPeer: this.getInitPeer.bind(this), getPeerNameSet: this.getPeerNameSet.bind(this) }, i2 = { ...n2, getDependency: this.getDependency.bind(this), getInitResult: this.getInitResult.bind(this), getPeer: this.getPeer.bind(this) }, o2 = (function(t3, e3, n3) {
      return Object.assign(t3, { config: e3, id: Ke2, registerState: n3 });
    })(e2, this.mergeConfigs(), n2);
    let s2;
    this.state = o2, this.extension.init && (s2 = this.extension.init(t2, o2.config, n2)), this.state = (function(t3, e3, n3) {
      return Object.assign(t3, { id: $e2, initResult: e3, registerState: n3 });
    })(o2, s2, i2);
  }
  build(t2) {
    const e2 = this.state;
    let n2;
    e2.id !== $e2 && Ie2(307, String(e2.id), String(je2)), this.extension.build && (n2 = this.extension.build(t2, e2.config, e2.registerState));
    const i2 = { ...e2.registerState, getOutput: () => n2, getSignal: this.getSignal.bind(this) };
    this.state = (function(t3, e3, n3) {
      return Object.assign(t3, { id: je2, output: e3, registerState: n3 });
    })(e2, n2, i2);
  }
  register(t2, e2) {
    this._signal = e2;
    const n2 = this.state;
    n2.id !== je2 && Ie2(308, String(n2.id), String(je2));
    const i2 = this.extension.register && this.extension.register(t2, n2.config, n2.registerState);
    return this.state = (function(t3) {
      return Object.assign(t3, { id: Te2 });
    })(n2), () => {
      const t3 = this.state;
      t3.id !== ze2 && Ie2(309, String(n2.id), String(ze2)), this.state = (function(t4) {
        return Object.assign(t4, { id: je2 });
      })(t3), i2 && i2();
    };
  }
  afterRegistration(t2) {
    const e2 = this.state;
    let n2;
    return e2.id !== Te2 && Ie2(310, String(e2.id), String(Te2)), this.extension.afterRegistration && (n2 = this.extension.afterRegistration(t2, e2.config, e2.registerState)), this.state = (function(t3) {
      return Object.assign(t3, { id: ze2 });
    })(e2), n2;
  }
  getSignal() {
    return void 0 === this._signal && Ie2(311), this._signal;
  }
  getInitResult() {
    void 0 === this.extension.init && Ie2(312, this.extension.name);
    const t2 = this.state;
    return (function(t3) {
      return t3.id >= $e2;
    })(t2) || Ie2(313, String(t2.id), String($e2)), t2.initResult;
  }
  getInitPeer(t2) {
    const e2 = this.builder.extensionNameMap.get(t2);
    return e2 ? e2.getExtensionInitDependency() : void 0;
  }
  getExtensionInitDependency() {
    const t2 = this.state;
    return (function(t3) {
      return t3.id >= Ke2;
    })(t2) || Ie2(314, String(t2.id), String(Ke2)), { config: t2.config };
  }
  getPeer(t2) {
    const e2 = this.builder.extensionNameMap.get(t2);
    return e2 ? e2.getExtensionDependency() : void 0;
  }
  getInitDependency(t2) {
    const e2 = this.builder.getExtensionRep(t2);
    return void 0 === e2 && Ie2(315, this.extension.name, t2.name), e2.getExtensionInitDependency();
  }
  getDependency(t2) {
    const e2 = this.builder.getExtensionRep(t2);
    return void 0 === e2 && Ie2(315, this.extension.name, t2.name), e2.getExtensionDependency();
  }
  getState() {
    const t2 = this.state;
    return (function(t3) {
      return t3.id >= ze2;
    })(t2) || Ie2(316, String(t2.id), String(ze2)), t2;
  }
  getDirectDependentNames() {
    return this.builder.incomingEdges.get(this.extension.name) || Ve2;
  }
  getPeerNameSet() {
    let t2 = this._peerNameSet;
    return t2 || (t2 = new Set((this.extension.peerDependencies || []).map(([t3]) => t3)), this._peerNameSet = t2), t2;
  }
  getExtensionDependency() {
    if (!this._dependency) {
      const t2 = this.state;
      (function(t3) {
        return t3.id >= je2;
      })(t2) || Ie2(317, this.extension.name), this._dependency = { config: t2.config, init: t2.initResult, output: t2.output };
    }
    return this._dependency;
  }
};
var Ze2 = { tag: HISTORY_MERGE_TAG };
function He2() {
  const t2 = $getRoot();
  t2.isEmpty() && t2.append($createParagraphNode());
}
var Je2 = /* @__PURE__ */ defineExtension({ config: /* @__PURE__ */ safeCast({ setOptions: Ze2, updateOptions: Ze2 }), init: ({ $initialEditorState: t2 = He2 }) => ({ $initialEditorState: t2, initialized: false }), afterRegistration(t2, { updateOptions: e2, setOptions: n2 }, i2) {
  const o2 = i2.getInitResult();
  if (!o2.initialized) {
    o2.initialized = true;
    const { $initialEditorState: i3 } = o2;
    if ($isEditorState(i3)) t2.setEditorState(i3, n2);
    else if ("function" == typeof i3) t2.update(() => {
      i3(t2);
    }, e2);
    else if (i3 && ("string" == typeof i3 || "object" == typeof i3)) {
      const e3 = t2.parseEditorState(i3);
      t2.setEditorState(e3, n2);
    }
  }
  return () => {
  };
}, name: "@lexical/extension/InitialState", nodes: [RootNode, TextNode, LineBreakNode, TabNode, ParagraphNode] });
var Xe2 = Symbol.for("@lexical/extension/LexicalBuilder");
function Ye2(...t2) {
  return nn2.fromExtensions(t2).buildEditor();
}
function qe2() {
}
function Qe2(t2) {
  throw t2;
}
function tn2(t2) {
  return Array.isArray(t2) ? t2 : [t2];
}
var en3 = Me2;
var nn2 = class _nn {
  roots;
  extensionNameMap;
  outgoingConfigEdges;
  incomingEdges;
  conflicts;
  _sortedExtensionReps;
  PACKAGE_VERSION;
  constructor(t2) {
    this.outgoingConfigEdges = /* @__PURE__ */ new Map(), this.incomingEdges = /* @__PURE__ */ new Map(), this.extensionNameMap = /* @__PURE__ */ new Map(), this.conflicts = /* @__PURE__ */ new Map(), this.PACKAGE_VERSION = en3, this.roots = t2;
    for (const e2 of t2) this.addExtension(e2);
  }
  static fromExtensions(t2) {
    const e2 = [tn2(Je2)];
    for (const n2 of t2) e2.push(tn2(n2));
    return new _nn(e2);
  }
  static maybeFromEditor(t2) {
    const e2 = t2[Xe2];
    return e2 && (e2.PACKAGE_VERSION !== en3 && Ie2(292, e2.PACKAGE_VERSION, en3), e2 instanceof _nn || Ie2(293)), e2;
  }
  static fromEditor(t2) {
    const e2 = _nn.maybeFromEditor(t2);
    return void 0 === e2 && Ie2(294), e2;
  }
  constructEditor() {
    const { $initialEditorState: t2, onError: e2, onWarn: n2, ...i2 } = this.buildCreateEditorArgs(), o2 = Object.assign(createEditor({ ...i2, ...e2 ? { onError: (t3) => {
      e2(t3, o2);
    } } : {}, ...n2 ? { onWarn: (t3) => {
      n2(t3, o2);
    } } : {} }), { [Xe2]: this });
    for (const t3 of this.sortedExtensionReps()) t3.build(o2);
    return o2;
  }
  buildEditor() {
    let t2 = qe2;
    function e2() {
      try {
        t2();
      } finally {
        t2 = qe2;
      }
    }
    const n2 = Object.assign(this.constructEditor(), { dispose: e2, [Symbol.dispose]: e2 });
    return t2 = mergeRegister(this.registerEditor(n2), () => n2.setRootElement(null)), n2;
  }
  hasExtensionByName(t2) {
    return this.extensionNameMap.has(t2);
  }
  getExtensionRep(t2) {
    const e2 = this.extensionNameMap.get(t2.name);
    if (e2) return e2.extension !== t2 && Ie2(295, t2.name), e2;
  }
  addEdge(t2, e2, n2) {
    const i2 = this.outgoingConfigEdges.get(t2);
    i2 ? i2.set(e2, n2) : this.outgoingConfigEdges.set(t2, /* @__PURE__ */ new Map([[e2, n2]]));
    const o2 = this.incomingEdges.get(e2);
    o2 ? o2.add(t2) : this.incomingEdges.set(e2, /* @__PURE__ */ new Set([t2]));
  }
  addExtension(t2) {
    void 0 !== this._sortedExtensionReps && Ie2(296);
    const e2 = tn2(t2), [n2] = e2;
    "string" != typeof n2.name && Ie2(297, typeof n2.name);
    let i2 = this.extensionNameMap.get(n2.name);
    if (void 0 !== i2 && i2.extension !== n2 && Ie2(298, n2.name), !i2) {
      i2 = new Ge2(this, n2), this.extensionNameMap.set(n2.name, i2);
      const t3 = this.conflicts.get(n2.name);
      "string" == typeof t3 && Ie2(299, n2.name, t3);
      for (const t4 of n2.conflictsWith || []) this.extensionNameMap.has(t4) && Ie2(299, n2.name, t4), this.conflicts.set(t4, n2.name);
      for (const t4 of n2.dependencies || []) {
        const e3 = tn2(t4);
        this.addEdge(n2.name, e3[0].name, e3.slice(1)), this.addExtension(e3);
      }
      for (const [t4, e3] of n2.peerDependencies || []) this.addEdge(n2.name, t4, e3 ? [e3] : []);
    }
  }
  sortedExtensionReps() {
    if (this._sortedExtensionReps) return this._sortedExtensionReps;
    const t2 = [], e2 = (n2, i2) => {
      let o2 = n2.state;
      if (We2(o2)) return;
      const s2 = n2.extension.name;
      var r2;
      Ue2(o2) || Ie2(300, s2, i2 || "[unknown]"), Ue2(r2 = o2) || Ie2(304, String(r2.id), String(Ae2)), o2 = Object.assign(r2, { id: Pe2 }), n2.state = o2;
      const c3 = this.outgoingConfigEdges.get(s2);
      if (c3) for (const t3 of c3.keys()) {
        const n3 = this.extensionNameMap.get(t3);
        n3 && e2(n3, s2);
      }
      o2 = Be2(o2), n2.state = o2, t2.push(n2);
    };
    for (const t3 of this.extensionNameMap.values()) Ue2(t3.state) && e2(t3);
    for (const e3 of t2) for (const [t3, n2] of this.outgoingConfigEdges.get(e3.extension.name) || []) if (n2.length > 0) {
      const e4 = this.extensionNameMap.get(t3);
      if (e4) for (const t4 of n2) e4.configs.add(t4);
    }
    for (const [t3, ...e3] of this.roots) if (e3.length > 0) {
      const n2 = this.extensionNameMap.get(t3.name);
      void 0 === n2 && Ie2(301, t3.name);
      for (const t4 of e3) n2.configs.add(t4);
    }
    return this._sortedExtensionReps = t2, this._sortedExtensionReps;
  }
  registerEditor(t2) {
    const e2 = this.sortedExtensionReps(), n2 = new AbortController(), i2 = [() => n2.abort()], o2 = n2.signal;
    for (const n3 of e2) {
      const e3 = n3.register(t2, o2);
      e3 && i2.push(e3);
    }
    for (const n3 of e2) {
      const e3 = n3.afterRegistration(t2);
      e3 && i2.push(e3);
    }
    return mergeRegister(...i2);
  }
  buildCreateEditorArgs() {
    const t2 = {}, e2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Map(), i2 = /* @__PURE__ */ new Map(), o2 = {}, s2 = {}, r2 = this.sortedExtensionReps();
    for (const c4 of r2) {
      const { extension: r3 } = c4;
      if (void 0 !== r3.onError && (t2.onError = r3.onError), void 0 !== r3.onWarn && (t2.onWarn = r3.onWarn), void 0 !== r3.disableEvents && (t2.disableEvents = r3.disableEvents), void 0 !== r3.parentEditor && (t2.parentEditor = r3.parentEditor), void 0 !== r3.editable && (t2.editable = r3.editable), void 0 !== r3.namespace && (t2.namespace = r3.namespace), void 0 !== r3.$initialEditorState && (t2.$initialEditorState = r3.$initialEditorState), r3.nodes) for (const t3 of ve2(r3)) {
        if ("function" != typeof t3) {
          const e3 = n2.get(t3.replace);
          e3 && Ie2(302, r3.name, t3.replace.name, e3.extension.name), n2.set(t3.replace, c4);
        }
        e2.add(t3);
      }
      if (r3.html) {
        if (r3.html.export) for (const [t3, e3] of r3.html.export.entries()) i2.set(t3, e3);
        r3.html.import && Object.assign(o2, r3.html.import);
      }
      r3.theme && _e2(s2, r3.theme);
    }
    Object.keys(s2).length > 0 && (t2.theme = s2), e2.size && (t2.nodes = [...e2]);
    const c3 = Object.keys(o2).length > 0, a2 = i2.size > 0;
    (c3 || a2) && (t2.html = {}, c3 && (t2.html.import = o2), a2 && (t2.html.export = i2));
    for (const e3 of r2) e3.init(t2);
    return t2.onError || (t2.onError = Qe2), t2;
  }
};
function on2(t2, e2) {
  const n2 = nn2.fromEditor(t2).getExtensionRep(e2);
  return void 0 === n2 && Ie2(303, e2.name), n2.getExtensionDependency();
}
function sn2(t2, e2) {
  const n2 = nn2.maybeFromEditor(t2);
  if (!n2) return;
  const i2 = n2.extensionNameMap.get(e2);
  return i2 ? i2.getExtensionDependency() : void 0;
}
function rn2(t2, e2) {
  const n2 = sn2(t2, e2);
  return void 0 === n2 && Ie2(291, e2), n2;
}
function cn2(t2) {
  return on2($getEditor(), t2);
}
function an2(t2) {
  return cn2(t2).output;
}
function dn2(t2) {
  return sn2($getEditor(), t2);
}
var ln2 = /* @__PURE__ */ new Set();
var un2 = /* @__PURE__ */ defineExtension({ build(t2, e2, n2) {
  const i2 = n2.getDependency(De2).output, o2 = Yt3({ watchedNodeKeys: /* @__PURE__ */ new Map() }), s2 = Ce2(() => {
  }, () => ce3(() => {
    const t3 = s2.peek(), { watchedNodeKeys: e3 } = o2.value;
    let n3, c3 = false;
    i2.value.read(() => {
      if ($getSelection()) for (const [i3, o3] of e3.entries()) {
        if (0 === o3.size) {
          e3.delete(i3);
          continue;
        }
        const s3 = $getNodeByKey(i3), r2 = s3 && s3.isSelected() || false;
        c3 = c3 || r2 !== (!!t3 && t3.has(i3)), r2 && (n3 = n3 || /* @__PURE__ */ new Set(), n3.add(i3));
      }
    }), !c3 && n3 && t3 && n3.size === t3.size || (s2.value = n3);
  }));
  return { watchNodeKey: function(t3) {
    const e3 = ne3(() => (s2.value || ln2).has(t3)), { watchedNodeKeys: n3 } = o2.peek();
    let i3 = n3.get(t3);
    const r2 = void 0 !== i3;
    return i3 = i3 || /* @__PURE__ */ new Set(), i3.add(e3), r2 || (n3.set(t3, i3), o2.value = { watchedNodeKeys: n3 }), e3;
  } };
}, dependencies: [De2], name: "@lexical/extension/NodeSelection" });
var fn2 = /* @__PURE__ */ createCommand("INSERT_HORIZONTAL_RULE_COMMAND");
var hn2 = class extends DecoratorNode {
  $config() {
    return this.config("horizontalrule", { importDOM: { hr: () => ({ conversion: gn2, priority: 0 }) } });
  }
  exportDOM() {
    return { element: $getDocument().createElement("hr") };
  }
  createDOM(t2) {
    const e2 = $getDocument().createElement("hr");
    return addClassNamesToElement(e2, t2.theme.hr), e2;
  }
  getTextContent() {
    return "\n";
  }
  isInline() {
    return false;
  }
  updateDOM() {
    return false;
  }
};
function gn2() {
  return { node: pn2() };
}
function pn2() {
  return $create(hn2);
}
function mn2(t2) {
  return t2 instanceof hn2;
}
var vn2 = /* @__PURE__ */ defineExtension({ dependencies: [De2, un2], name: "@lexical/extension/HorizontalRule", nodes: () => [hn2], register(t2, e2, n2) {
  const { watchNodeKey: i2 } = n2.getDependency(un2).output, s2 = Yt3({ nodeSelections: /* @__PURE__ */ new Map() }), c3 = t2._config.theme.hrSelected ?? "selected";
  return mergeRegister(t2.registerCommand(fn2, (t3) => {
    const e3 = $getSelection();
    if (!$isRangeSelection(e3)) return false;
    if (null !== e3.focus.getNode()) {
      const t4 = pn2();
      $insertNodeToNearestRoot(t4);
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), t2.registerCommand(CLICK_COMMAND, (t3) => {
    if (isDOMNode(t3.target)) {
      const e3 = $getNodeFromDOMNode(t3.target);
      if (mn2(e3)) return (function(t4, e4 = false) {
        const n3 = $getSelection(), i3 = t4.isSelected(), o2 = t4.getKey();
        let s3;
        e4 && $isNodeSelection(n3) ? s3 = n3 : (s3 = $createNodeSelection(), $setSelection(s3)), i3 ? s3.delete(o2) : s3.add(o2);
      })(e3, t3.shiftKey), true;
    }
    return false;
  }, COMMAND_PRIORITY_LOW), t2.registerMutationListener(hn2, (e3, n3) => {
    jt3(() => {
      let n4 = false;
      const { nodeSelections: o2 } = s2.peek();
      for (const [s3, r2] of e3.entries()) if ("destroyed" === r2) o2.delete(s3), n4 = true;
      else {
        const e4 = o2.get(s3), r3 = t2.getElementByKey(s3);
        e4 ? e4.domNode.value = r3 : (n4 = true, o2.set(s3, { domNode: Yt3(r3), selectedSignal: i2(s3) }));
      }
      n4 && (s2.value = { nodeSelections: o2 });
    });
  }), ce3(() => {
    const t3 = [];
    for (const { domNode: e3, selectedSignal: n3 } of s2.value.nodeSelections.values()) t3.push(ce3(() => {
      const t4 = e3.value;
      if (t4) {
        n3.value ? addClassNamesToElement(t4, c3) : removeClassNamesFromElement(t4, c3);
      }
    }));
    return mergeRegister(...t3);
  }));
} });
var xn2 = /* @__PURE__ */ defineExtension({ build: (t2) => ({ composingTextNode: Yt3(null), compositionKey: Yt3(null) }), name: "@lexical/extension/IME", register(t2, e2, n2) {
  const { compositionKey: i2, composingTextNode: o2 } = n2.getOutput(), s2 = t2.registerCommand(COMPOSITION_START_COMMAND, () => {
    const t3 = $getSelection();
    return $isRangeSelection(t3) && (i2.value = t3.anchor.key), false;
  }, COMMAND_PRIORITY_BEFORE_EDITOR), c3 = ce3(() => {
    const e3 = i2.value;
    o2.value = null !== e3 ? t2.read("latest", () => {
      const t3 = $getNodeByKey(e3);
      return $isTextNode(t3) ? t3 : null;
    }) : null;
  }), d2 = t2.registerUpdateListener(({ tags: t3, editorState: e3 }) => {
    t3.has(COMPOSITION_START_TAG) && e3.read(() => {
      const t4 = $getSelection();
      if (!$isRangeSelection(t4)) return;
      const e4 = t4.anchor.getNode();
      $isTextNode(e4) && (o2.value = e4);
    });
  }), l2 = t2.registerRootListener((t3) => {
    if (null === t3) return void (i2.value = null);
    return registerEventListener(t3, "compositionend", () => {
      i2.value = null;
    });
  });
  return mergeRegister(s2, c3, d2, l2);
} });
var yn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2) => ae2({ inheritEditableFromParent: e2.inheritEditableFromParent }), config: /* @__PURE__ */ safeCast({ $getParentEditor: function() {
  const t2 = $getEditor();
  return nn2.fromEditor(t2), t2;
}, inheritEditableFromParent: false }), init: (t2, e2, n2) => {
  const i2 = e2.$getParentEditor();
  t2.parentEditor = i2, t2.theme = t2.theme || i2._config.theme;
}, name: "@lexical/extension/NestedEditor", register: (t2, e2, n2) => ce3(() => {
  const e3 = t2._parentEditor;
  if (e3 && n2.getOutput().inheritEditableFromParent.value) return t2.setEditable(e3.isEditable()), e3.registerEditableListener(t2.setEditable.bind(t2));
}) });
var En2 = /* @__PURE__ */ defineExtension({ config: /* @__PURE__ */ safeCast({ attribute: "data-selected", nodes: [] }), init(t2, e2) {
  const n2 = /* @__PURE__ */ new Set(), i2 = getRegisteredSubtypeMap(me2(t2).nodes);
  for (const t3 of e2.nodes) {
    const e3 = t3.getType(), o2 = i2.get(e3);
    void 0 === o2 && Ie2(339, t3.name, e3), n2.add(e3);
    for (const t4 of o2) n2.add(t4);
  }
  return { matchTypes: n2 };
}, mergeConfig: (t2, e2) => shallowMergeConfig(t2, { ...e2, ...e2.nodes && { nodes: [...t2.nodes, ...e2.nodes] } }), name: "@lexical/extension/NodeSelectionDataSelected", register(t2, e2, n2) {
  const { attribute: i2 } = e2, { matchTypes: o2 } = n2.getInitResult(), s2 = /* @__PURE__ */ new Map(), c3 = (e3) => {
    const n3 = /* @__PURE__ */ new Set();
    e3.read(() => {
      const t3 = $getSelection();
      if ($isNodeSelection(t3)) for (const e4 of t3.getNodes()) o2.has(e4.getType()) && n3.add(e4.getKey());
    });
    for (const [t3, e4] of s2) n3.has(t3) || (e4.removeAttribute(i2), s2.delete(t3));
    for (const e4 of n3) {
      const n4 = t2.getElementByKey(e4);
      null !== n4 && (n4.setAttribute(i2, "true"), s2.set(e4, n4));
    }
  };
  c3(t2.getEditorState());
  const a2 = t2.registerUpdateListener(({ editorState: t3 }) => c3(t3));
  return () => {
    a2();
    for (const t3 of s2.values()) t3.removeAttribute(i2);
    s2.clear();
  };
} });
function bn2(t2) {
  $isElementNode(t2) && t2.isInline() && t2.isEmpty() && t2.remove();
}
var Sn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ disabled: false }), name: "@lexical/NormalizeInlineElements", register: (t2, e2, n2) => {
  const i2 = n2.getOutput();
  return ce3(() => {
    if (!i2.disabled.value) {
      const e3 = [];
      for (const { klass: n3, transforms: i3 } of t2._nodes.values()) n3.prototype instanceof ElementNode && n3.prototype.isInline !== ElementNode.prototype.isInline && (i3.add(bn2), e3.push(() => i3.delete(bn2)));
      return () => e3.forEach((t3) => t3());
    }
  });
} });
var wn2 = /* @__PURE__ */ new Set([SKIP_SELECTION_FOCUS_TAG, SKIP_SCROLL_INTO_VIEW_TAG]);
var Nn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ $fixFocusOverselection: function() {
  const t2 = $getSelection();
  if ($isRangeSelection(t2) && !t2.isCollapsed()) {
    const e2 = $getCaretRangeInDirection($caretRangeFromSelection(t2), "next");
    let n2 = e2.focus;
    for ($isTextPointCaret(n2) && e2.anchor.origin !== n2.origin && 0 === n2.offset && (n2 = $rewindSiblingCaret(n2.getSiblingCaret())), $isSiblingCaret(n2) && e2.anchor.origin !== n2.origin && $isLineBreakNode(n2.origin) && (n2 = $rewindSiblingCaret(n2)); $isChildCaret(n2) && e2.anchor.origin !== n2.origin; ) n2 = $rewindSiblingCaret($getSiblingCaret(n2.origin, "next"));
    if ($isSiblingCaret(n2) && $isElementNode(n2.origin) && (n2 = $normalizeCaret($getChildCaret(n2.origin, "previous")).getFlipped()), n2 = $normalizeCaret(n2), !n2.isSamePointCaret(e2.focus)) {
      const t3 = $setSelectionFromCaretRange($getCaretRange(e2.anchor, n2)), i2 = $getEditor().getRootElement(), o2 = i2 && getDOMSelection(i2.ownerDocument.defaultView);
      o2 && $updateDOMSelection($getPreviousSelection(), t3, $getEditor(), o2, wn2, i2);
    }
  }
}, dateNow: Date.now, disabled: false, thresholdMsec: 100 }), name: "@lexical/NormalizeTripleClickSelection", register: (t2, e2, n2) => ce3(() => {
  const e3 = n2.getOutput();
  if (!e3.disabled.value) return t2.registerRootListener((n3) => {
    if (!n3) return;
    let i2 = 0;
    const o2 = (t3) => {
      if (t3 ? 3 === t3.detail : i2 > 0) {
        const n4 = e3.dateNow.peek()();
        i2 = t3 && "mousedown" === t3.type || n4 - i2 <= e3.thresholdMsec.peek() ? n4 : 0;
      }
      return i2;
    };
    return mergeRegister(t2.registerCommand(SELECTION_CHANGE_COMMAND, () => (o2(null) && (i2 = 0, e3.$fixFocusOverselection.peek()()), false), COMMAND_PRIORITY_BEFORE_CRITICAL), registerEventListeners(n3, { mousedown: o2, mouseup: o2 }, true));
  });
}) });
function On2(t2) {
  const e2 = t2.target;
  isExactShortcutMatch(t2, "a", { ctrlKey: !IS_APPLE, metaKey: IS_APPLE }) && isHTMLElement(e2) && ("INPUT" === e2.tagName || "TEXTAREA" === e2.tagName) && e2.addEventListener("keydown", stopLexicalPropagation, { once: true });
}
var Rn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ disabled: false }), name: "@lexical/extension/PreventSelectAll", register: (t2, e2, n2) => {
  const i2 = n2.getOutput();
  return ce3(() => {
    if (!i2.disabled.value) return t2.registerRootListener((t3) => {
      if (t3) return registerEventListener(t3, "keydown", On2, true);
    });
  });
} });
var Cn2 = /* @__PURE__ */ defineExtension({ build: (t2) => Ce2(() => t2.getRootElement(), (e2) => t2.registerRootListener((t3) => {
  e2.value = t3;
})), name: "@lexical/extension/RootElement" });
var Dn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ cascadeSelection: false, disabled: false }), dependencies: [Rn2], name: "@lexical/extension/SelectBlock", register: (t2, e2, n2) => {
  const i2 = n2.getOutput(), o2 = n2.getDependency(Rn2).output;
  return mergeRegister(ce3(() => {
    o2.disabled.value = i2.disabled.value;
  }), ce3(() => {
    if (!i2.disabled.value) return t2.registerCommand(SELECT_ALL_COMMAND, (e3, n3) => {
      if (n3 !== t2) {
        if (!i2.cascadeSelection.peek()) return false;
        return !!n3.read("pending", () => {
          const t3 = $getSelection();
          return $isRangeSelection(t3) && $isBlockFullySelected($getRoot(), t3);
        }) && ($selectAll(), true);
      }
      const o3 = $getSelection();
      if ($isNodeSelection(o3)) {
        const t3 = o3.getNodes(), e4 = t3[0];
        if (!e4) return false;
        const n4 = e4.getTopLevelElement();
        return !n4 || $isRootNode(n4) || n4.is(e4) || t3.length > 1 && (c3 = n4, !t3.every((t4) => c3.is(t4.getTopLevelElement()))) ? $selectAll() : $isElementNode(n4) && n4.select(0, n4.getChildrenSize()), true;
      }
      var c3;
      if (!$isRangeSelection(o3)) return false;
      const d2 = o3.anchor.getNode(), u2 = d2.getTopLevelElement();
      if (u2 && u2.is(o3.focus.getNode().getTopLevelElement()) && !$isBlockFullySelected(u2, o3)) return u2.select(0, u2.getChildrenSize()), true;
      let f3 = $getSlotFrame(d2);
      for (; null !== f3; ) {
        if ($isElementNode(f3) && !$isBlockFullySelected(f3, o3)) return f3.select(0, f3.getChildrenSize()), true;
        const t3 = $getSlotHost(f3);
        f3 = null === t3 ? null : $getSlotFrame(t3);
      }
      return $isBlockFullySelected($getRoot(), o3) || $selectAll(), true;
    }, COMMAND_PRIORITY_LOW);
  }));
} });
var In2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ disabled: false, onReposition: void 0 }), name: "@lexical/utils/SelectionAlwaysOnDisplay", register: (t2, e2, n2) => {
  const i2 = n2.getOutput();
  return ce3(() => {
    if (!i2.disabled.value) return selectionAlwaysOnDisplay(t2, i2.onReposition.value);
  });
} });
function Fn2(t2) {
  return t2.canIndent();
}
function Mn2(t2, e2, n2 = Fn2) {
  return mergeRegister(t2.registerCommand(KEY_TAB_COMMAND, (e3) => {
    const n3 = $getSelection();
    if (!$isRangeSelection(n3)) return false;
    e3.preventDefault();
    const i2 = (function(t3) {
      if (t3.getNodes().filter((t4) => $isBlockElementNode(t4) && t4.canIndent()).length > 0) return true;
      const e4 = t3.anchor, n4 = t3.focus, i3 = n4.isBefore(e4) ? n4 : e4, o2 = i3.getNode(), s2 = $getNearestBlockElementAncestorOrThrow(o2);
      if (s2.canIndent()) {
        const t4 = s2.getKey();
        let e5 = $createRangeSelection();
        if (e5.anchor.set(t4, 0, "element"), e5.focus.set(t4, 0, "element"), e5 = $normalizeSelection__EXPERIMENTAL(e5), e5.anchor.is(i3)) return true;
      }
      return false;
    })(n3) ? e3.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND : INSERT_TAB_COMMAND;
    return t2.dispatchCommand(i2);
  }, COMMAND_PRIORITY_EDITOR), t2.registerCommand(INDENT_CONTENT_COMMAND, () => {
    const t3 = "number" == typeof e2 ? e2 : e2 ? e2.peek() : null, i2 = $getSelection();
    if (!$isRangeSelection(i2)) return false;
    const o2 = "function" == typeof n2 ? n2 : n2.peek();
    return $handleIndentAndOutdent((e3) => {
      if (o2(e3)) {
        const n3 = e3.getIndent() + 1;
        (!t3 || n3 < t3) && e3.setIndent(n3);
      }
    });
  }, COMMAND_PRIORITY_CRITICAL));
}
var kn2 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => ae2(e2), config: /* @__PURE__ */ safeCast({ $canIndent: Fn2, disabled: false, maxIndent: null }), name: "@lexical/extension/TabIndentation", register(t2, e2, n2) {
  const { disabled: i2, maxIndent: o2, $canIndent: s2 } = n2.getOutput();
  return ce3(() => {
    if (!i2.value) return Mn2(t2, o2, s2);
  });
} });
var _n2 = /* @__PURE__ */ defineExtension({ build: (t2) => Ce2(() => t2.isEditable(), (e2) => t2.registerEditableListener((t3) => {
  e2.value = t3;
})), name: "@lexical/extension/WatchEditable" });

// node_modules/@lexical/extension/dist/LexicalExtension.mjs
var mod4 = false ? LexicalExtension_dev_exports : LexicalExtension_prod_exports;
var $applyFormatToDom = mod4.$applyFormatToDom;
var $createHorizontalRuleNode = mod4.$createHorizontalRuleNode;
var $defaultShouldInsertAfter = mod4.$defaultShouldInsertAfter;
var $getExtensionDependency = mod4.$getExtensionDependency;
var $getExtensionOutput = mod4.$getExtensionOutput;
var $getPeerDependency = mod4.$getPeerDependency;
var $isDecoratorTextNode = mod4.$isDecoratorTextNode;
var $isHorizontalRuleNode = mod4.$isHorizontalRuleNode;
var AutoFocusExtension = mod4.AutoFocusExtension;
var ClearEditorExtension = mod4.ClearEditorExtension;
var ClickAfterLastBlockExtension = mod4.ClickAfterLastBlockExtension;
var DecoratorTextExtension = mod4.DecoratorTextExtension;
var DecoratorTextNode = mod4.DecoratorTextNode;
var EditorStateExtension = mod4.EditorStateExtension;
var HorizontalRuleExtension = mod4.HorizontalRuleExtension;
var HorizontalRuleNode = mod4.HorizontalRuleNode;
var IMEExtension = mod4.IMEExtension;
var INSERT_HORIZONTAL_RULE_COMMAND = mod4.INSERT_HORIZONTAL_RULE_COMMAND;
var InitialStateExtension = mod4.InitialStateExtension;
var LexicalBuilder = mod4.LexicalBuilder;
var NestedEditorExtension = mod4.NestedEditorExtension;
var NodeSelectionDataSelectedExtension = mod4.NodeSelectionDataSelectedExtension;
var NodeSelectionExtension = mod4.NodeSelectionExtension;
var NormalizeInlineElementsExtension = mod4.NormalizeInlineElementsExtension;
var NormalizeTripleClickSelectionExtension = mod4.NormalizeTripleClickSelectionExtension;
var PreventSelectAllExtension = mod4.PreventSelectAllExtension;
var RootElementExtension = mod4.RootElementExtension;
var SelectBlockExtension = mod4.SelectBlockExtension;
var SelectionAlwaysOnDisplayExtension = mod4.SelectionAlwaysOnDisplayExtension;
var TabIndentationExtension = mod4.TabIndentationExtension;
var WatchEditableExtension = mod4.WatchEditableExtension;
var applyFormatFromStyle = mod4.applyFormatFromStyle;
var applyFormatToDom = mod4.applyFormatToDom;
var batch = mod4.batch;
var buildEditorFromExtensions = mod4.buildEditorFromExtensions;
var computed = mod4.computed;
var configExtension2 = mod4.configExtension;
var declarePeerDependency2 = mod4.declarePeerDependency;
var defineExtension2 = mod4.defineExtension;
var effect = mod4.effect;
var getExtensionDependencyFromEditor = mod4.getExtensionDependencyFromEditor;
var getKnownTypesAndNodes = mod4.getKnownTypesAndNodes;
var getPeerDependencyFromEditor = mod4.getPeerDependencyFromEditor;
var getPeerDependencyFromEditorOrThrow = mod4.getPeerDependencyFromEditorOrThrow;
var namedSignals = mod4.namedSignals;
var registerClearEditor = mod4.registerClearEditor;
var registerTabIndentation = mod4.registerTabIndentation;
var safeCast2 = mod4.safeCast;
var shallowMergeConfig2 = mod4.shallowMergeConfig;
var signal = mod4.signal;
var untracked = mod4.untracked;
var watchedSignal = mod4.watchedSignal;

// node_modules/@lexical/html/dist/LexicalHtml.prod.mjs
var LexicalHtml_prod_exports = {};
__export(LexicalHtml_prod_exports, {
  $appendNodeToHTML: () => An2,
  $distributeInlineWrapper: () => Re3,
  $generateDOMFromNodes: () => Dn3,
  $generateDOMFromRoot: () => wn3,
  $generateHtmlFromNodes: () => On3,
  $generateNodesFromDOM: () => kn3,
  $generateNodesFromDOMViaExtension: () => xn3,
  $getImportContextValue: () => Ee3,
  $getRenderContextValue: () => wt3,
  $getSessionDOMRenderConfig: () => Nt3,
  $inlineStylesFromStyleSheets: () => gt3,
  $isBlockLevel: () => We3,
  $propagateTextAlignToBlockChildren: () => Fe3,
  $setRenderContextValue: () => Mt3,
  $updateRenderContextValue: () => At3,
  $withImportContext: () => Ie3,
  $withRenderContext: () => Et3,
  BlockSchema: () => Pe3,
  CoreImportExtension: () => Sn3,
  CoreImportRules: () => nn3,
  DOMImportExtension: () => yn3,
  DOMRenderExtension: () => oe4,
  HorizontalRuleImportExtension: () => vn3,
  HorizontalRuleImportRules: () => $n2,
  ImportOverlays: () => Me3,
  ImportSource: () => ve3,
  ImportSourceDataTransfer: () => Ce3,
  ImportTextFormat: () => be3,
  ImportTextStyle: () => ke3,
  ImportWhitespaceConfig: () => Oe3,
  InlineSchema: () => je3,
  NestedBlockSchema: () => ze3,
  RenderContextExport: () => kt3,
  RenderContextRoot: () => bt3,
  RootSchema: () => _e3,
  contextUpdater: () => at3,
  contextValue: () => ft3,
  createImportState: () => $e3,
  createRenderState: () => Ct3,
  defaultIsInline: () => we3,
  defaultPreservesWhitespace: () => De3,
  defineImportRule: () => Se3,
  defineOverlayRules: () => fn3,
  domOverride: () => It3,
  isElementOfTag: () => he3,
  parseSelector: () => xe3,
  sel: () => Cn3
});
function nt3(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", t2);
  for (const t3 of e2) o2.append("v", t3);
  throw n2.search = o2.toString(), Error(`Minified Lexical error #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
var ot3;
function rt3(t2, e2) {
  const { key: n2 } = e2;
  return t2 && n2 in t2 ? t2[n2] : e2.defaultValue;
}
function st3(t2) {
  return ot3 && ot3.editor === t2 ? ot3 : void 0;
}
function it3(t2, e2) {
  const n2 = st3(e2);
  return n2 && n2[t2];
}
function ct3(t2, e2) {
  if ("cfg" in e2) {
    const { cfg: n2, updater: o2 } = e2;
    return [n2, o2(rt3(t2, n2))];
  }
  return e2;
}
function lt3(t2, e2) {
  let n2 = e2;
  for (const o2 of t2) {
    const [t3, r2] = ct3(n2, o2), s2 = t3.key;
    if (n2 === e2 && rt3(n2, t3) === r2) continue;
    const i2 = n2 === e2 || void 0 === n2 ? ut3(e2) : n2;
    i2[s2] = r2, n2 = i2;
  }
  return n2;
}
function ut3(t2) {
  return Object.create(t2 || null);
}
function ft3(t2, e2) {
  return [t2, e2];
}
function at3(t2, e2) {
  return { cfg: t2, updater: e2 };
}
function dt3(t2, n2, o2, r2 = $getEditor()) {
  const s2 = ot3, i2 = st3(r2);
  try {
    return ot3 = { ...i2, editor: r2, [t2]: n2 }, o2();
  } finally {
    ot3 = s2;
  }
}
function pt3(t2, n2 = () => {
}) {
  return (o2, r2 = $getEditor()) => (e2) => {
    const s2 = st3(r2), i2 = s2 && s2[t2], c3 = lt3(o2, i2 || n2(r2));
    return c3 && c3 !== i2 ? dt3(t2, c3, e2, r2) : e2();
  };
}
function ht3(t2, e2, o2, r2) {
  return Object.assign(createState(Symbol(e2), { isEqual: r2, parse: o2 }), { [t2]: true });
}
var gt3 = (t2, e2, n2) => {
  mt3(t2), n2();
};
function mt3(t2) {
  if (!isDOMDocumentNode(t2)) return;
  const e2 = t2;
  if (null === e2.querySelector("style")) return;
  const n2 = /* @__PURE__ */ new Map();
  function s2(t3) {
    let e3 = n2.get(t3);
    if (void 0 === e3) {
      e3 = /* @__PURE__ */ new Set();
      for (let n3 = 0; n3 < t3.style.length; n3++) e3.add(t3.style[n3]);
      n2.set(t3, e3);
    }
    return e3;
  }
  try {
    for (const t3 of Array.from(e2.styleSheets)) {
      let n3;
      try {
        n3 = t3.cssRules;
      } catch (t4) {
        continue;
      }
      for (const t4 of Array.from(n3)) {
        if (!objectKlassEquals(t4, CSSStyleRule)) continue;
        let n4;
        try {
          n4 = e2.querySelectorAll(t4.selectorText);
        } catch (t5) {
          continue;
        }
        for (const e3 of Array.from(n4)) {
          if (!isHTMLElement(e3)) continue;
          const n5 = s2(e3);
          for (let o2 = 0; o2 < t4.style.length; o2++) {
            const r2 = t4.style[o2];
            n5.has(r2) || e3.style.setProperty(r2, t4.style.getPropertyValue(r2), t4.style.getPropertyPriority(r2));
          }
        }
      }
    }
  } catch (t3) {
  }
}
var yt3 = "@lexical/html/DOM";
var xt3 = Symbol.for("@lexical/html/DOMExportContext");
var St3 = "@lexical/html/DOMImport";
var $t4 = Symbol.for("@lexical/html/DOMImportContext");
var vt3 = () => true;
function Ct3(t2, e2, n2) {
  return ht3(xt3, t2, e2, n2);
}
var bt3 = /* @__PURE__ */ Ct3("root", Boolean);
var kt3 = /* @__PURE__ */ Ct3("isExport", Boolean);
function Dt3(t2) {
  const e2 = getPeerDependencyFromEditor(t2, yt3);
  return e2 ? e2.output.defaults : void 0;
}
function wt3(t2, n2 = $getEditor()) {
  return rt3((function(t3) {
    return it3(xt3, t3) || Dt3(t3);
  })(n2), t2);
}
function Ot3(t2) {
  const e2 = getPeerDependencyFromEditor(t2, yt3);
  return e2 ? e2.output.runtime : void 0;
}
function Mt3(t2, n2, o2 = $getEditor()) {
  const r2 = Ot3(o2);
  r2 && r2.setContextValue(t2, n2);
}
function At3(t2, n2, o2 = $getEditor()) {
  const r2 = Ot3(o2);
  r2 && r2.setContextValue(t2, n2(rt3(r2.editorContext, t2)));
}
function Nt3(t2 = $getEditor()) {
  const n2 = Ot3(t2);
  return n2 ? n2.getSessionConfig() : $getEditorDOMRenderConfig(t2);
}
var Et3 = pt3(xt3, Dt3);
function It3(t2, e2, n2) {
  return { ...e2, ...n2, nodes: t2 };
}
function Wt4(t2) {
  return (e2) => e2 instanceof t2;
}
function Rt3(t2, { nodes: e2 }) {
  if ("*" === e2) return vt3;
  let n2 = {};
  const o2 = [];
  for (const r2 of e2) if ("getType" in r2) {
    const e3 = r2.getType();
    if (n2) {
      const o3 = t2.get(e3);
      void 0 === o3 && nt3(339, r2.name, e3);
      for (const t3 of o3) n2[t3] = true;
    }
    o2.push(Wt4(r2));
  } else n2 = void 0, o2.push(r2);
  return n2 || (1 === o2.length ? o2[0] : (t3) => {
    for (const e3 of o2) if (e3(t3)) return true;
    return false;
  });
}
function Ft3(t2) {
  return (e2, n2, o2) => t2(e2, o2);
}
function Tt4(t2) {
  return (e2, n2, o2, r2) => t2(e2, n2, r2);
}
function Pt3(t2) {
  return (e2, n2, o2, r2, s2) => t2(e2, n2, o2, s2);
}
function jt4(t2) {
  return (e2, n2, o2, r2, s2, i2) => t2(e2, n2, o2, r2, i2);
}
function zt4(t2, e2) {
  return (n2, o2) => {
    const r2 = () => t2(n2, o2), s2 = e2(n2);
    return s2 ? s2(n2, r2, o2) : r2();
  };
}
function _t3(t2, e2) {
  return (n2, o2, r2) => {
    const s2 = () => t2(n2, o2, r2), i2 = e2(n2);
    return i2 ? i2(n2, o2, s2, r2) : s2();
  };
}
var Lt3 = _t3;
var Ut4 = Tt4;
function Bt4(t2, e2) {
  return (n2, o2, r2, s2) => {
    const i2 = () => t2(n2, o2, r2, s2), c3 = e2(n2);
    return c3 ? c3(n2, o2, r2, i2, s2) : i2();
  };
}
function Vt4(t2, e2) {
  return (n2, o2, r2, s2, i2) => {
    const c3 = () => t2(n2, o2, r2, s2, i2), l2 = e2(n2);
    return l2 ? l2(n2, o2, r2, s2, c3, i2) : c3();
  };
}
function qt4(t2, e2) {
  return (n2, o2, r2, s2) => {
    t2(n2, o2, r2, s2);
    const i2 = e2(n2);
    i2 && i2(n2, o2, r2, s2);
  };
}
function Gt4(t2, e2, n2, o2, r2) {
  let s2 = n2[e2];
  for (const n3 of t2[e2]) if ("function" == typeof n3[0]) {
    const [t3, e3] = n3;
    s2 = o2(s2, (n4) => t3(n4) && e3 || void 0);
  } else {
    const t3 = n3[1], e3 = {};
    for (const n4 in t3) {
      const r3 = t3[n4];
      r3 && (e3[n4] = r3.reduce((t4, e4) => o2(t4, () => e4), s2));
    }
    s2 = o2(s2, (t4) => {
      const n4 = e3[t4.getType()];
      return n4 && r2(n4);
    });
  }
  n2[e2] = s2;
}
function Ht4(t2, e2, n2, o2) {
  if (!o2) return;
  const r2 = t2[e2];
  if ("function" == typeof n2) r2.push([n2, o2]);
  else {
    const t3 = r2[r2.length - 1];
    let e3;
    t3 && "types" === t3[0] ? e3 = t3[1] : (e3 = {}, r2.push(["types", e3]));
    for (const t4 in n2) {
      const n3 = e3[t4] || [];
      e3[t4] = n3, n3.push(o2);
    }
  }
}
function Jt4(t2) {
  return "*" === t2.nodes;
}
function Qt4(t2, e2) {
  const n2 = getRegisteredSubtypeMap(getKnownTypesAndNodes(t2).nodes), o2 = { $createDOM: [], $decorateDOM: [], $exportDOM: [], $extractWithChild: [], $getDOMSlot: [], $getSlotTargetElement: [], $shouldExclude: [], $shouldInclude: [], $updateDOM: [] };
  for (const t3 of (function(t4) {
    const e3 = [], n3 = [], o3 = [];
    for (const r3 of t4) if (Jt4(r3)) e3.push(r3);
    else if (Array.isArray(r3.nodes)) for (const t5 of r3.nodes) $isLexicalNode(t5.prototype) ? o3.push(1 === r3.nodes.length ? r3 : { ...r3, nodes: [t5] }) : n3.push(1 === r3.nodes.length ? r3 : { ...r3, nodes: [t5] });
    const r2 = /* @__PURE__ */ new Map(), s2 = (t5) => {
      let e4 = r2.get(t5);
      if (void 0 === e4) {
        e4 = -1;
        for (const n4 of iterStaticNodeConfigChain(t5)) e4++;
        r2.set(t5, e4);
      }
      return e4;
    };
    return o3.sort((t5, e4) => s2(t5.nodes[0]) - s2(e4.nodes[0])), [...o3, ...n3, ...e3];
  })(e2)) {
    const e3 = Rt3(n2, t3);
    for (const n3 in o2) {
      Ht4(o2, n3, e3, t3[n3]);
    }
  }
  return o2;
}
function Kt4(t2) {
  return t2;
}
function Yt4(t2, { overrides: e2 }) {
  const n2 = Qt4(t2, e2), o2 = { ...DEFAULT_EDITOR_DOM_CONFIG, ...t2.dom };
  return Gt4(n2, "$createDOM", o2, zt4, Ft3), Gt4(n2, "$exportDOM", o2, zt4, Ft3), Gt4(n2, "$extractWithChild", o2, Vt4, jt4), Gt4(n2, "$getDOMSlot", o2, Lt3, Ut4), Gt4(n2, "$shouldExclude", o2, _t3, Tt4), Gt4(n2, "$shouldInclude", o2, _t3, Tt4), Gt4(n2, "$getSlotTargetElement", o2, Bt4, Pt3), Gt4(n2, "$updateDOM", o2, Bt4, Pt3), Gt4(n2, "$decorateDOM", o2, qt4, Kt4), o2;
}
function Zt4(t2) {
  return { get: (e2) => rt3(t2, e2) };
}
function Xt4(t2) {
  const e2 = /* @__PURE__ */ Object.create(null);
  return lt3(t2, e2) || e2;
}
function te5(t2, e2) {
  const n2 = Zt4(e2);
  return t2.filter((t3) => !(t3.disabledForEditor && t3.disabledForEditor(n2)));
}
function ee5(t2) {
  if ("*" === t2.nodes) return () => true;
  const e2 = t2.nodes.map((t3) => {
    const e3 = t3;
    return $isLexicalNode(e3.prototype) ? (t4) => t4 instanceof e3 : t3;
  });
  return (t3) => e2.some((e3) => e3(t3));
}
var ne4 = class {
  editor;
  initialEditorConfig;
  overrides;
  editorContext;
  hasSessionGates;
  installed;
  sessionCache = /* @__PURE__ */ new Map();
  constructor(t2, e2, n2, o2) {
    this.editor = t2, this.initialEditorConfig = e2, this.overrides = n2, this.editorContext = o2, this.installed = te5(n2, o2), this.hasSessionGates = n2.some((t3) => t3.disabledForSession);
  }
  setContextValue(t2, e2) {
    const n2 = this.installed;
    this.editorContext[t2.key] = e2;
    const o2 = te5(this.overrides, this.editorContext);
    if ((function(t3, e3) {
      if (t3.length !== e3.length) return false;
      for (let n3 = 0; n3 < t3.length; n3++) if (t3[n3] !== e3[n3]) return false;
      return true;
    })(n2, o2)) return;
    const r2 = (function(t3, e3) {
      const n3 = new Set(t3), o3 = new Set(e3), r3 = [];
      for (const e4 of t3) o3.has(e4) || r3.push(e4);
      for (const t4 of e3) n3.has(t4) || r3.push(t4);
      return r3;
    })(n2, o2);
    this.installed = o2, this.sessionCache.clear();
    const s2 = Yt4(this.initialEditorConfig, { overrides: o2 });
    this.editor._config.dom = s2;
    const i2 = (function(t3) {
      const e3 = [];
      for (const n3 of t3) (n3.$createDOM || n3.$getDOMSlot || n3.$decorateDOM) && e3.push(ee5(n3));
      return 0 === e3.length ? null : (t4) => e3.some((e4) => e4(t4));
    })(r2);
    if (!i2) return;
    const c3 = s2.$updateDOM;
    s2.$updateDOM = (t3, e3, n3, o3) => !!i2(t3) || c3(t3, e3, n3, o3), this.editor.update($fullReconcile, { discrete: true }), s2.$updateDOM = c3;
  }
  getSessionConfig() {
    const t2 = this.editor._config.dom || DEFAULT_EDITOR_DOM_CONFIG;
    if (!this.hasSessionGates) return t2;
    const e2 = Zt4(it3(xt3, this.editor) || this.editorContext), n2 = [], o2 = [];
    if (this.installed.forEach((t3, r3) => {
      t3.disabledForSession && t3.disabledForSession(e2) ? n2.push(String(r3)) : o2.push(t3);
    }), 0 === n2.length) return t2;
    const r2 = n2.join(",");
    let s2 = this.sessionCache.get(r2);
    return s2 || (s2 = Yt4(this.initialEditorConfig, { overrides: o2 }), this.sessionCache.set(r2, s2)), s2;
  }
};
var oe4 = /* @__PURE__ */ defineExtension({ build(t2, e2, n2) {
  const { initialEditorConfig: o2 } = n2.getInitResult(), r2 = Xt4(e2.contextDefaults);
  return { defaults: r2, runtime: new ne4(t2, o2, e2.overrides, r2) };
}, config: { contextDefaults: [], overrides: [] }, html: { export: /* @__PURE__ */ new Map([[RootNode, () => {
  const t2 = $getDocument().createElement("div");
  return t2.role = "textbox", { element: t2 };
}]]) }, init(t2, e2) {
  const n2 = { dom: t2.dom, nodes: t2.nodes }, o2 = Xt4(e2.contextDefaults), r2 = te5(e2.overrides, o2);
  return t2.dom = Yt4(t2, { overrides: r2 }), { initialEditorConfig: n2 };
}, mergeConfig(t2, e2) {
  const n2 = shallowMergeConfig(t2, e2);
  for (const o2 of ["overrides", "contextDefaults"]) e2[o2] && (n2[o2] = [...t2[o2], ...e2[o2]]);
  return n2;
}, name: yt3 });
var re4 = Symbol.for("@lexical/html/SelectorImpl");
function se4(t2, e2) {
  const n2 = { kind: "element", predicate: (o2 = e2, 0 === o2.length ? isHTMLElement : 1 === o2.length ? o2[0] : (t3, e3) => {
    for (const n3 of o2) if (!n3(t3, e3)) return false;
    return true;
  }), tags: t2 };
  var o2;
  const s2 = (n3) => se4(t2, [...e2, n3]);
  return { [re4]: n2, attr: (t3, e3, n3) => s2(le4(t3, e3, n3)), classAll: (...t3) => s2(ce4(t3)), classAny: (...t3) => s2((function(t4) {
    const e3 = ie4(t4);
    if (0 === e3.length) return () => false;
    return (t5) => {
      if (!isHTMLElement(t5)) return false;
      const n3 = t5.classList;
      for (const t6 of e3) if (n3.contains(t6)) return true;
      return false;
    };
  })(t3)), styleAny: (t3, e3, n3) => s2((function(t4, e4, n4) {
    if ("string" == typeof e4) return (n5) => isHTMLElement(n5) && n5.style.getPropertyValue(t4) === e4;
    if (e4 instanceof RegExp) {
      const o3 = n4 && n4.capture, s3 = e4;
      return (e5, n5) => {
        if (!isHTMLElement(e5)) return false;
        const i2 = e5.style.getPropertyValue(t4);
        if (!i2) return false;
        const c3 = i2.match(s3);
        return null !== c3 && (void 0 !== o3 && (n5[o3] = c3), true);
      };
    }
    nt3(362, JSON.stringify(t4));
  })(t3, e3, n3)) };
}
function ie4(t2) {
  const e2 = [];
  for (const n2 of t2) n2 && e2.push(n2);
  return e2;
}
function ce4(t2) {
  const e2 = ie4(t2);
  return 0 === e2.length ? () => true : (t3) => {
    if (!isHTMLElement(t3)) return false;
    const n2 = t3.classList;
    for (const t4 of e2) if (!n2.contains(t4)) return false;
    return true;
  };
}
function le4(t2, e2, n2) {
  if (true === e2) return (e3) => isHTMLElement(e3) && e3.hasAttribute(t2);
  if ("string" == typeof e2) return (n3) => isHTMLElement(n3) && n3.getAttribute(t2) === e2;
  if (e2 instanceof RegExp) {
    const o2 = n2 && n2.capture, s2 = e2;
    return (e3, n3) => {
      if (!isHTMLElement(e3)) return false;
      const i2 = e3.getAttribute(t2);
      if (null == i2) return false;
      const c3 = i2.match(s2);
      return null !== c3 && (void 0 !== o2 && (n3[o2] = c3), true);
    };
  }
  nt3(361, JSON.stringify(t2));
}
var ue3 = { kind: "text", predicate: isDOMTextNode, tags: /* @__PURE__ */ new Set() };
var fe3 = { [re4]: ue3 };
var ae3 = { kind: "comment", predicate: (t2) => 8 === t2.nodeType, tags: /* @__PURE__ */ new Set() };
var de3 = { [re4]: ae3 };
var pe3 = { any: () => se4(/* @__PURE__ */ new Set(), []), comment: () => de3, tag(...t2) {
  t2.length > 0 || nt3(363);
  const e2 = /* @__PURE__ */ new Set();
  for (const n2 of t2) e2.add(n2.toUpperCase());
  return se4(e2, []);
}, text: () => fe3 };
function he3(t2, e2) {
  return isHTMLElement(t2) && t2.nodeName === e2.toUpperCase();
}
var ge3 = /[A-Za-z0-9_-]/;
var me3 = class {
  constructor(t2, e2) {
    this.source = t2, this.pos = e2;
  }
  peek(t2 = 0) {
    return this.source[this.pos + t2] || "";
  }
  consume() {
    return this.source[this.pos++] || "";
  }
  eof() {
    return this.pos >= this.source.length;
  }
  skipWhitespace() {
    for (; !this.eof() && /\s/.test(this.peek()); ) this.pos++;
  }
  readIdent() {
    const t2 = this.pos;
    for (; !this.eof() && ge3.test(this.peek()); ) this.pos++;
    return this.source.slice(t2, this.pos);
  }
  readQuoted() {
    const t2 = this.consume();
    this.assert('"' === t2 || "'" === t2, "expected quote");
    const e2 = this.pos;
    for (; !this.eof() && this.peek() !== t2; ) "\\" === this.peek() ? this.pos += 2 : this.pos++;
    this.assert(!this.eof(), "unterminated string");
    const n2 = this.source.slice(e2, this.pos);
    return this.pos++, n2.replace(/\\(.)/g, "$1");
  }
  assert(t2, e2) {
    t2 || nt3(364, String(this.pos + 1), e2, this.source);
  }
};
function ye3(t2) {
  const e2 = /* @__PURE__ */ new Set(), n2 = [], o2 = [];
  if (t2.skipWhitespace(), "*" === t2.peek()) t2.consume();
  else if (ge3.test(t2.peek())) {
    const n3 = t2.readIdent();
    n3 && e2.add(n3.toUpperCase());
  }
  for (; !t2.eof(); ) {
    const e3 = t2.peek();
    if ("." === e3) {
      t2.consume();
      const e4 = t2.readIdent();
      t2.assert("" !== e4, 'expected class name after "."'), o2.push(e4);
    } else if ("#" === e3) {
      t2.consume();
      const e4 = t2.readIdent();
      t2.assert("" !== e4, 'expected id after "#"'), n2.push(le4("id", e4));
    } else {
      if ("[" !== e3) break;
      {
        t2.consume(), t2.skipWhitespace();
        const e4 = t2.readIdent();
        t2.assert("" !== e4, 'expected attribute name after "["'), t2.skipWhitespace();
        let o3 = true;
        if ("=" === t2.peek()) {
          t2.consume(), t2.skipWhitespace();
          const e5 = t2.peek();
          '"' === e5 || "'" === e5 ? o3 = t2.readQuoted() : (o3 = t2.readIdent(), t2.assert("" !== o3, "expected attribute value")), t2.skipWhitespace();
        }
        t2.assert("]" === t2.peek(), 'expected "]"'), t2.consume(), n2.push(le4(e4, o3));
      }
    }
  }
  return o2.length > 0 && n2.push(ce4(o2)), { predicates: n2, tags: e2 };
}
function xe3(t2) {
  const e2 = new me3(t2, 0), n2 = [];
  for (; ; ) {
    const t3 = ye3(e2);
    if (n2.push(t3), e2.skipWhitespace(), e2.eof()) break;
    e2.assert("," === e2.peek(), 'expected "," (selector lists are the only supported combinator)'), e2.consume(), e2.skipWhitespace();
  }
  if (1 === n2.length) return se4(n2[0].tags, n2[0].predicates);
  const o2 = /* @__PURE__ */ new Set();
  if (n2.every((t3) => t3.tags.size > 0)) for (const t3 of n2) for (const e3 of t3.tags) o2.add(e3);
  return se4(o2, [(t3, e3) => {
    for (const o3 of n2) {
      const n3 = t3.nodeName;
      if (o3.tags.size > 0 && !o3.tags.has(n3)) continue;
      let r2 = true;
      for (const n4 of o3.predicates) if (!n4(t3, e3)) {
        r2 = false;
        break;
      }
      if (r2) return true;
    }
    return false;
  }]);
}
function Se3(t2) {
  return t2;
}
function $e3(t2, e2, n2) {
  return ht3($t4, t2, e2, n2);
}
var ve3 = /* @__PURE__ */ $e3("importSource", () => "unknown");
var Ce3 = /* @__PURE__ */ $e3("importSourceDataTransfer", () => null);
var be3 = /* @__PURE__ */ $e3("textFormat", () => 0);
var ke3 = /* @__PURE__ */ $e3("textStyle", () => ({}));
function De3(t2) {
  if (!isHTMLElement(t2)) return false;
  if ("PRE" === t2.nodeName) return true;
  const e2 = t2.style.whiteSpace;
  return "string" == typeof e2 && e2.startsWith("pre");
}
function we3(t2) {
  if (isDOMTextNode(t2)) return true;
  if (!isHTMLElement(t2)) return false;
  const e2 = t2.style.display;
  return e2 ? e2.startsWith("inline") : !isBlockDomNode(t2) && isInlineDomNode(t2);
}
var Oe3 = /* @__PURE__ */ $e3("whitespaceConfig", () => ({ isInline: we3, preservesWhitespace: De3 }));
var Me3 = /* @__PURE__ */ $e3("importOverlays", () => []);
var Ae3 = class {
  constructor(t2) {
    this.record = t2;
  }
  get(t2) {
    return rt3(this.record, t2);
  }
  set(t2, e2) {
    this.record[t2.key] = e2;
  }
  update(t2, e2) {
    this.record[t2.key] = e2(rt3(this.record, t2));
  }
  has(t2) {
    return Object.prototype.hasOwnProperty.call(this.record, t2.key);
  }
};
function Ne3(t2) {
  const e2 = getPeerDependencyFromEditor(t2, St3);
  return e2 ? e2.output.defaults : void 0;
}
function Ee3(t2, n2 = $getEditor()) {
  return rt3((function(t3) {
    return it3($t4, t3) || Ne3(t3);
  })(n2), t2);
}
var Ie3 = pt3($t4, Ne3);
function We3(t2) {
  return $isBlockElementNode(t2) || $isDecoratorNode(t2) && !t2.isInline();
}
function Re3(t2, e2) {
  const n2 = [];
  let o2 = [];
  const r2 = () => {
    0 !== o2.length && (n2.push(e2().splice(0, 0, o2)), o2 = []);
  };
  for (const s2 of t2) if (We3(s2)) {
    if (r2(), $isElementNode(s2)) {
      const t3 = Re3(s2.getChildren(), e2);
      s2.splice(0, s2.getChildrenSize(), t3);
    }
    n2.push(s2);
  } else o2.push(s2);
  return r2(), n2;
}
function Fe3(t2, e2) {
  if (!isHTMLElement(e2)) return t2;
  const n2 = e2.style.textAlign;
  if (!Be3(n2)) return t2;
  for (const e3 of t2) $isBlockElementNode(e3) && "" === e3.getFormatType() && e3.setFormat(n2);
  return t2;
}
function Te3(t2, e2, n2) {
  1 === t2.length && $isLineBreakNode(t2[0]) && (t2 = []);
  const o2 = $createParagraphNode();
  if (isHTMLElement(n2)) {
    const t3 = n2.style.textAlign;
    Be3(t3) && o2.setFormat(t3);
  }
  return [o2.splice(0, 0, t2)];
}
var Pe3 = { $accepts: We3, $packageRun: Te3, name: "BlockSchema" };
var je3 = { $accepts: (t2) => !We3(t2), name: "InlineSchema" };
var ze3 = { $accepts: We3, $packageRun: (t2) => t2, name: "NestedBlockSchema" };
var _e3 = { $accepts: We3, $packageRun: Te3, name: "RootSchema" };
var Le3 = pe3;
var Ue3 = /* @__PURE__ */ new Set(["center", "end", "justify", "left", "right", "start"]);
function Be3(t2) {
  return Ue3.has(t2);
}
var Ve3 = { B: { fontWeight: "bold" }, EM: { fontStyle: "italic" }, I: { fontStyle: "italic" }, S: { textDecoration: "line-through" }, STRONG: { fontWeight: "bold" }, SUB: { verticalAlign: "sub" }, SUP: { verticalAlign: "super" }, U: { textDecoration: "underline" } };
var qe3 = { CODE: IS_CODE, MARK: IS_HIGHLIGHT };
var Ge3 = /* @__PURE__ */ new Set(["font-weight", "font-style", "text-decoration", "vertical-align"]);
var He3 = /* @__PURE__ */ Se3({ $import: (t2, e2) => {
  const n2 = t2.get(be3), o2 = Ve3[e2.nodeName], r2 = (function(t3) {
    return { fontStyle: t3.style.fontStyle, fontWeight: t3.style.fontWeight, textDecoration: t3.style.textDecoration, verticalAlign: t3.style.verticalAlign };
  })(e2), s2 = o2 ? (i2 = o2, { fontStyle: (c3 = r2).fontStyle || i2.fontStyle, fontWeight: c3.fontWeight || i2.fontWeight, textDecoration: c3.textDecoration || i2.textDecoration, verticalAlign: c3.verticalAlign || i2.verticalAlign }) : r2;
  var i2, c3;
  let l2 = (u2 = n2, f3 = (function(t3) {
    let e3 = 0, n3 = 0;
    const { fontWeight: o3, fontStyle: r3, textDecoration: s3, verticalAlign: i3 } = t3;
    if ("700" === o3 || "bold" === o3 ? e3 |= IS_BOLD : "normal" !== o3 && "400" !== o3 || (n3 |= IS_BOLD), "italic" === r3 ? e3 |= IS_ITALIC : "normal" === r3 && (n3 |= IS_ITALIC), s3) {
      const t4 = s3.split(" ");
      t4.includes("underline") && (e3 |= IS_UNDERLINE), t4.includes("line-through") && (e3 |= IS_STRIKETHROUGH), t4.includes("none") && (n3 |= IS_UNDERLINE | IS_STRIKETHROUGH);
    }
    return "sub" === i3 ? (e3 |= IS_SUBSCRIPT, n3 |= IS_SUPERSCRIPT) : "super" === i3 ? (e3 |= IS_SUPERSCRIPT, n3 |= IS_SUBSCRIPT) : "baseline" === i3 && (n3 |= IS_SUBSCRIPT | IS_SUPERSCRIPT), { clear: n3, set: e3 };
  })(s2), u2 & ~f3.clear | f3.set);
  var u2, f3;
  const a2 = qe3[e2.nodeName];
  return a2 && (l2 |= a2), l2 === n2 ? t2.$importChildren(e2) : t2.$importChildren(e2, { context: [ft3(be3, l2)] });
}, match: Le3.tag("b", "strong", "em", "i", "code", "mark", "s", "sub", "sup", "u", "span"), name: "@lexical/html/inline-format" });
function Je3(t2, e2, n2) {
  let o2 = t2;
  for (; ; ) {
    let t3 = null;
    for (; null === (t3 = e2 ? o2.nextSibling : o2.previousSibling); ) {
      const t4 = o2.parentNode;
      if (null === t4) return null;
      o2 = t4;
    }
    if (o2 = t3, !n2.isInline(o2)) return null;
    let r2 = o2;
    for (; null !== (r2 = e2 ? o2.firstChild : o2.lastChild); ) o2 = r2;
    if (isDOMTextNode(o2)) return o2;
    if ("BR" === o2.nodeName) return null;
  }
}
function Qe3(t2, e2) {
  return 0 !== e2 && $isTextNode(t2) ? t2.setFormat(e2) : t2;
}
function Ke3(t2, e2) {
  if ($isTextNode(t2)) {
    const n2 = (function(t3) {
      let e3 = "";
      for (const n3 in t3) Ge3.has(n3) || (e3 += `${n3}: ${t3[n3]}; `);
      return e3.trimEnd();
    })(e2);
    "" !== n2 && t2.setStyle(n2);
  }
  return t2;
}
var Ye3 = /* @__PURE__ */ Se3({ $import: (t2, e2) => {
  const n2 = t2.get(be3), o2 = t2.get(ke3), r2 = t2.get(Oe3);
  if ((function(t3, e3) {
    let n3 = t3.parentNode;
    for (; null !== n3; ) {
      if (e3.preservesWhitespace(n3)) return true;
      n3 = n3.parentNode;
    }
    return false;
  })(e2, r2)) {
    const t3 = $generateNodesFromRawText(e2.textContent || "");
    for (const e3 of t3) Qe3(e3, n2), Ke3(e3, o2);
    return t3;
  }
  const s2 = (function(t3, e3) {
    let n3 = (t3.textContent || "").replace(/\r/g, "").replace(/[ \t\n]+/g, " ");
    if (0 === n3.length) return "";
    if (" " === n3[0]) {
      let o3 = t3, r3 = true;
      for (; null !== o3 && null !== (o3 = Je3(o3, false, e3)); ) {
        const t4 = o3.textContent || "";
        if (t4.length > 0) {
          /[ \t\n]$/.test(t4) && (n3 = n3.slice(1)), r3 = false;
          break;
        }
      }
      r3 && (n3 = n3.slice(1));
    }
    if (n3.length > 0 && " " === n3[n3.length - 1]) {
      let o3 = t3, r3 = true;
      for (; null !== o3 && null !== (o3 = Je3(o3, true, e3)); ) if ((o3.textContent || "").replace(/^( |\t|\r?\n)+/, "").length > 0) {
        r3 = false;
        break;
      }
      r3 && (n3 = n3.slice(0, -1));
    }
    return n3;
  })(e2, r2);
  if ("" === s2) return [];
  const i2 = $createTextNode(s2);
  return Qe3(i2, n2), Ke3(i2, o2), [i2];
}, match: Le3.text(), name: "@lexical/html/#text" });
var Ze3 = /* @__PURE__ */ Se3({ $import: () => [], match: Le3.tag("script", "style"), name: "@lexical/html/script-style-ignore" });
var Xe3 = /* @__PURE__ */ Se3({ $import: (t2, e2) => isOnlyChildInBlockNode(e2) || isLastChildInBlockNode(e2) ? [] : [$createLineBreakNode()], match: Le3.tag("br"), name: "@lexical/html/br" });
var tn3 = /* @__PURE__ */ Se3({ $import: (t2, e2) => {
  const n2 = $createParagraphNode();
  if ($setFormatFromDOM(n2, e2), setNodeIndentFromDOM(e2, n2), "" === n2.getFormatType()) {
    const t3 = e2.getAttribute("align");
    t3 && Be3(t3) && n2.setFormat(t3);
  }
  return $setDirectionFromDOM(n2, e2), [n2.splice(0, 0, t2.$importChildren(e2))];
}, match: Le3.tag("p"), name: "@lexical/html/p" });
var en4 = /* @__PURE__ */ Se3({ $import: (t2, n2, o2) => $getEditor().hasNode(HorizontalRuleNode) ? [$createHorizontalRuleNode()] : o2(), match: Le3.tag("hr"), name: "@lexical/html/hr" });
var nn3 = [Ze3, tn3, en4, /* @__PURE__ */ Se3({ $import: (t2, e2, n2) => isBlockDomNode(e2) ? Fe3(t2.$importChildren(e2, { schema: Pe3 }), e2) : n2(), match: Le3.any(), name: "@lexical/html/transparent-block" }), Ye3, Xe3, He3];
function on3(t2, e2) {
  const n2 = [];
  let o2 = 0, r2 = 0;
  for (; o2 < t2.length && r2 < e2.length; ) t2[o2] <= e2[r2] ? n2.push(t2[o2++]) : n2.push(e2[r2++]);
  for (; o2 < t2.length; ) n2.push(t2[o2++]);
  for (; r2 < e2.length; ) n2.push(e2[r2++]);
  return n2;
}
function rn3(t2) {
  const e2 = [], n2 = /* @__PURE__ */ new Map(), o2 = [], r2 = [], s2 = [], i2 = /* @__PURE__ */ new Set();
  t2.forEach((t3, c4) => {
    const l2 = (function(t4) {
      const e3 = t4[re4];
      return void 0 === e3 && nt3(360), e3;
    })(t3.match), u2 = t3.name || (function(t4, e3) {
      if ("text" === t4.kind) return `#text@${e3}`;
      if ("comment" === t4.kind) return `#comment@${e3}`;
      if (0 === t4.tags.size) return `*@${e3}`;
      const n3 = Array.from(t4.tags).join(",").toLowerCase();
      return `${n3}@${e3}`;
    })(l2, c4);
    if (t3.name && i2.add(t3.name), e2.push({ $import: t3.$import, name: u2, predicate: l2.predicate }), "text" === l2.kind) r2.push(c4);
    else if ("comment" === l2.kind) s2.push(c4);
    else if (0 === l2.tags.size) o2.push(c4);
    else for (const t4 of l2.tags) {
      let e3 = n2.get(t4);
      e3 || (e3 = [], n2.set(t4, e3)), e3.push(c4);
    }
  });
  const c3 = /* @__PURE__ */ new Map();
  if (0 === o2.length) for (const [t3, e3] of n2) c3.set(t3, e3);
  else for (const [t3, e3] of n2) c3.set(t3, on3(e3, o2));
  return { byTag: c3, commentIndices: s2, rules: e2, textIndices: r2, wildcardIndices: o2 };
}
function sn3(t2, e2) {
  return isDOMTextNode(e2) ? t2.textIndices : 8 === e2.nodeType ? t2.commentIndices : isHTMLElement(e2) ? t2.byTag.get(e2.nodeName) || t2.wildcardIndices : cn3;
}
var cn3 = Object.freeze([]);
function ln3(t2) {
  const e2 = [];
  for (const n2 of t2) if (un3(n2)) for (const t3 of n2.rules) e2.push(t3);
  else e2.push(n2);
  return e2;
}
function un3(t2) {
  return "object" == typeof t2 && null !== t2 && "__type" in t2 && "CompiledOverlayRules" === t2.__type;
}
function fn3(t2) {
  const e2 = ln3(t2);
  return { __type: "CompiledOverlayRules", dispatch: rn3(e2), rules: e2 };
}
var an3 = Object.freeze({});
function dn3(t2, e2) {
  const n2 = { $importChildren: (e3, n3) => (function(t3, e4, n4) {
    const o2 = n4 && n4.rules ? n4.rules.dispatch : void 0;
    o2 && t3.overlays.push(o2);
    try {
      const o3 = () => pn3(t3, e4, n4);
      return n4 && n4.context ? Ie3(n4.context, t3.editor)(o3) : o3();
    } finally {
      o2 && t3.overlays.pop();
    }
  })(t2, e3, n3), $importOne: (e3, n3) => hn3(t2, e3, n3), captures: e2, get: (e3) => Ee3(e3, t2.editor), session: t2.session };
  return n2;
}
function pn3(t2, e2, n2) {
  const o2 = n2 && n2.$onChild, r2 = [];
  for (const n3 of Array.from(e2.childNodes)) {
    const e3 = hn3(t2, n3, void 0);
    for (const t3 of e3) {
      const e4 = o2 ? o2(t3) : t3;
      null != e4 && r2.push(e4);
    }
  }
  const s2 = n2 && n2.$after ? n2.$after(r2) : r2, i2 = n2 && n2.schema;
  return i2 ? (function(t3, e3, n3, o3) {
    const r3 = [];
    let s3 = null;
    const i3 = () => {
      if (null === s3) return;
      const e4 = s3;
      if (s3 = null, t3.$packageRun) {
        const s4 = t3.$packageRun(e4, n3, o3);
        if (s4.length > 0) {
          for (const t4 of s4) r3.push(t4);
          return;
        }
      }
      if ("hoist" === t3.onReject) for (const t4 of e4) r3.push(t4);
    };
    for (const o4 of e3) t3.$accepts(o4, n3) ? (i3(), r3.push(o4)) : (null === s3 && (s3 = []), s3.push(o4));
    return i3(), t3.$finalize ? t3.$finalize(r3, n3) : r3;
  })(i2, s2, null, e2) : s2;
}
function hn3(t2, e2, n2) {
  const o2 = () => (function(t3, e3) {
    const n3 = (function(t4, e4) {
      const n4 = [];
      for (let o5 = t4.overlays.length - 1; o5 >= 0; o5--) {
        const r3 = t4.overlays[o5], s3 = sn3(r3, e4);
        s3.length > 0 && n4.push({ dispatch: r3, indices: s3 });
      }
      const o4 = sn3(t4.dispatch, e4);
      o4.length > 0 && n4.push({ dispatch: t4.dispatch, indices: o4 });
      return n4;
    })(t3, e3);
    if (0 === n3.length) return gn3(t3, e3);
    let o3 = 0, r2 = 0;
    const s2 = () => {
      for (; o3 < n3.length; ) {
        const { dispatch: i2, indices: c3 } = n3[o3];
        for (; r2 < c3.length; ) {
          const n4 = c3[r2++], o4 = i2.rules[n4], l2 = {};
          if (o4.predicate(e3, l2)) {
            const n5 = dn3(t3, 0 === Object.keys(l2).length ? an3 : l2);
            try {
              return o4.$import(n5, e3, s2);
            } catch (t4) {
              throw t4;
            }
          }
        }
        o3++, r2 = 0;
      }
      return gn3(t3, e3);
    };
    return s2();
  })(t2, e2);
  return n2 && n2.context ? Ie3(n2.context, t2.editor)(o2) : o2();
}
function gn3(t2, e2) {
  if (0 === e2.childNodes.length) return [];
  const n2 = [];
  for (const o2 of Array.from(e2.childNodes)) {
    const e3 = hn3(t2, o2, void 0);
    for (const t3 of e3) n2.push(t3);
  }
  return n2;
}
var mn3 = /* @__PURE__ */ Se3({ $import: (t2, e2) => t2.$importChildren(e2), match: pe3.any(), name: "@lexical/html/default-hoist" });
var yn3 = /* @__PURE__ */ defineExtension({ build(t2, e2) {
  const n2 = rn3(ln3(e2.rules)), r2 = lt3(e2.contextDefaults, void 0), s2 = e2.preprocess;
  return { $generateNodesFromDOM: (e3, i2) => {
    const c3 = it3($t4, t2) || r2, l2 = i2 && i2.context ? lt3(i2.context, c3) : c3, u2 = void 0 !== l2 && l2 !== c3 ? l2 : Object.create(c3 || null), f3 = new Ae3(u2), a2 = { session: f3 };
    return (function(t3, e4, n3) {
      let o2 = t3.length - 1;
      const r3 = () => {
        for (; o2 >= 0; ) return void (0, t3[o2--])(e4, n3, r3);
      };
      r3();
    })(i2 && i2.preprocess ? [...s2, ...i2.preprocess] : s2, e3, a2), dt3($t4, u2, () => (function(t3, e4, n3, r3) {
      return pn3({ dispatch: t3, editor: e4, overlays: r3.get(Me3).map((t4) => t4.dispatch), session: r3 }, isDOMDocumentNode(n3) ? n3.body : n3, { schema: _e3 });
    })(n2, t2, e3, f3), t2);
  }, defaults: r2 };
}, config: { contextDefaults: [], preprocess: [gt3], rules: [mn3] }, mergeConfig: (t2, e2) => shallowMergeConfig(t2, { ...e2, ...e2.contextDefaults && { contextDefaults: [...t2.contextDefaults, ...e2.contextDefaults] }, ...e2.preprocess && { preprocess: [...t2.preprocess, ...e2.preprocess] }, ...e2.rules && { rules: [...e2.rules, ...t2.rules] } }), name: St3 });
function xn3(t2, e2) {
  return $getExtensionOutput(yn3).$generateNodesFromDOM(t2, e2);
}
var Sn3 = /* @__PURE__ */ defineExtension({ dependencies: [/* @__PURE__ */ configExtension(yn3, { rules: nn3 })], name: "@lexical/html/CoreImport" });
var $n2 = [en4];
var vn3 = /* @__PURE__ */ defineExtension({ dependencies: [HorizontalRuleExtension, Sn3], name: "@lexical/html/HorizontalRuleImport" });
var Cn3 = { any: pe3.any, comment: pe3.comment, css: xe3, tag: pe3.tag, text: pe3.text };
var bn3 = /* @__PURE__ */ new Set(["STYLE", "SCRIPT"]);
function kn3(t2, e2) {
  mt3(e2);
  const n2 = isDOMDocumentNode(e2) ? e2.body.childNodes : e2.childNodes, r2 = [], s2 = [];
  for (const e3 of n2) if (!bn3.has(e3.nodeName)) {
    const n3 = Nn3(e3, t2, s2, false);
    if (null !== n3) for (const t3 of n3) r2.push(t3);
  }
  return (function(t3) {
    for (const e3 of t3) e3.getParent() && e3.getNextSibling() instanceof ArtificialNode__DO_NOT_USE && e3.insertAfter($createLineBreakNode());
    for (const e3 of t3) {
      const t4 = e3.getParent();
      t4 && t4.splice(e3.getIndexWithinParent(), 1, e3.getChildren());
    }
  })(s2), r2;
}
function Dn3(t2, n2 = null, o2 = $getEditor()) {
  return Et3([ft3(kt3, true)], o2)(() => {
    const e2 = $getRoot(), r2 = Nt3(o2), s2 = $isRangeSelection(n2) ? $getSlotFrame(n2.anchor.getNode()) : null, i2 = t2.append.bind(t2);
    for (const t3 of ($isElementNode(s2) ? s2 : e2).getChildren()) Mn3(o2, t3, i2, n2, r2);
    return t2;
  });
}
function wn3(t2, n2 = $getRoot()) {
  const o2 = $getEditor();
  return Et3([ft3(kt3, true), ft3(bt3, true)], o2)(() => {
    const e2 = Nt3(o2), r2 = t2.append.bind(t2);
    return Mn3(o2, n2, r2, null, e2), t2;
  });
}
function On3(t2, e2 = null) {
  return ("undefined" == typeof document || "undefined" == typeof window && void 0 === global.window) && nt3(338), $assumeActiveEditor(t2), Dn3($getDocument().createElement("div"), e2, t2).innerHTML;
}
function Mn3(e2, n2, o2, i2 = null, c3 = $getEditorDOMRenderConfig(e2)) {
  let l2 = c3.$shouldInclude(n2, i2, e2);
  const u2 = c3.$shouldExclude(n2, i2, e2);
  let f3 = n2;
  null !== i2 && $isTextNode(n2) && (f3 = $sliceSelectedTextNodeContent(i2, n2, "clone"));
  const a2 = c3.$exportDOM(f3, e2), { element: d2, after: p3, append: g3, $getChildNodes: m3 } = a2;
  if (!d2) return false;
  const y3 = $getDocument().createDocumentFragment(), S2 = m3 ? m3() : $isElementNode(f3) ? f3.getChildren() : [], $3 = l2 && $isNodeSelection(i2) && $isElementNode(n2) ? null : i2, v2 = y3.append.bind(y3);
  for (const t2 of S2) {
    const o3 = Mn3(e2, t2, v2, $3, c3);
    !l2 && o3 && c3.$extractWithChild(n2, t2, i2, "html", e2) && (l2 = true);
  }
  if (l2 && !u2) {
    if ((isHTMLElement(d2) || isDocumentFragment(d2)) && (g3 ? g3(y3) : d2.append(y3)), o2(d2), p3) {
      const t2 = p3.call(f3, d2);
      t2 && (isDocumentFragment(d2) ? d2.replaceChildren(t2) : d2.replaceWith(t2));
    }
  } else o2(y3);
  return l2;
}
function An2(t2, e2, n2, o2 = null) {
  return Mn3(t2, e2, n2.append.bind(n2), o2, Nt3(t2));
}
function Nn3(t2, e2, n2, o2, r2 = /* @__PURE__ */ new Map(), s2) {
  const i2 = [];
  if (bn3.has(t2.nodeName)) return i2;
  let c3 = null;
  const l2 = (function(t3, e3) {
    const { nodeName: n3 } = t3, o3 = e3._htmlConversions.get(n3.toLowerCase());
    let r3 = null;
    if (void 0 !== o3) for (const e4 of o3) {
      const n4 = e4(t3);
      null !== n4 && (null === r3 || (r3.priority || 0) <= (n4.priority || 0)) && (r3 = n4);
    }
    return null !== r3 ? r3.conversion : null;
  })(t2, e2), u2 = l2 ? l2(t2) : null;
  let f3 = null;
  if (null !== u2) {
    f3 = u2.after;
    const e3 = u2.node;
    if (c3 = Array.isArray(e3) ? e3[e3.length - 1] : e3, null !== c3) {
      for (const [, t3] of r2) if (c3 = t3(c3, s2), !c3) break;
      c3 && i2.push(...Array.isArray(e3) ? e3 : [c3]);
    }
    null != u2.forChild && r2.set(t2.nodeName, u2.forChild);
  }
  const a2 = t2.childNodes;
  let d2 = [];
  const p3 = (null == c3 || !$isRootOrShadowRoot(c3)) && (null != c3 && $isBlockElementNode(c3) || o2);
  for (let t3 = 0; t3 < a2.length; t3++) d2.push(...Nn3(a2[t3], e2, n2, p3, new Map(r2), c3));
  if (null != f3 && (d2 = f3(d2)), isBlockDomNode(t2) && (d2 = En3(t2, d2, p3 ? () => {
    const t3 = new ArtificialNode__DO_NOT_USE();
    return n2.push(t3), t3;
  } : $createParagraphNode)), null == c3) if (d2.length > 0) for (const t3 of d2) i2.push(t3);
  else isBlockDomNode(t2) && (function(t3) {
    if (null == t3.nextSibling || null == t3.previousSibling) return false;
    return isInlineDomNode(t3.nextSibling) && isInlineDomNode(t3.previousSibling);
  })(t2) && i2.push($createLineBreakNode());
  else $isElementNode(c3) && c3.append(...d2);
  return i2;
}
function En3(t2, e2, n2) {
  const o2 = t2.style.textAlign, r2 = [];
  let s2 = [];
  for (let t3 = 0; t3 < e2.length; t3++) {
    const i2 = e2[t3];
    if ($isBlockElementNode(i2)) o2 && !i2.getFormat() && i2.setFormat(o2), r2.push(i2);
    else if (s2.push(i2), t3 === e2.length - 1 || t3 < e2.length - 1 && $isBlockElementNode(e2[t3 + 1])) {
      const t4 = n2();
      t4.setFormat(o2), t4.append(...s2), r2.push(t4), s2 = [];
    }
  }
  return r2;
}

// node_modules/@lexical/html/dist/LexicalHtml.mjs
var mod5 = false ? LexicalHtml_dev_exports : LexicalHtml_prod_exports;
var $appendNodeToHTML = mod5.$appendNodeToHTML;
var $distributeInlineWrapper = mod5.$distributeInlineWrapper;
var $generateDOMFromNodes = mod5.$generateDOMFromNodes;
var $generateDOMFromRoot = mod5.$generateDOMFromRoot;
var $generateHtmlFromNodes = mod5.$generateHtmlFromNodes;
var $generateNodesFromDOM = mod5.$generateNodesFromDOM;
var $generateNodesFromDOMViaExtension = mod5.$generateNodesFromDOMViaExtension;
var $getImportContextValue = mod5.$getImportContextValue;
var $getRenderContextValue = mod5.$getRenderContextValue;
var $getSessionDOMRenderConfig = mod5.$getSessionDOMRenderConfig;
var $inlineStylesFromStyleSheets = mod5.$inlineStylesFromStyleSheets;
var $isBlockLevel = mod5.$isBlockLevel;
var $propagateTextAlignToBlockChildren = mod5.$propagateTextAlignToBlockChildren;
var $setRenderContextValue = mod5.$setRenderContextValue;
var $updateRenderContextValue = mod5.$updateRenderContextValue;
var $withImportContext = mod5.$withImportContext;
var $withRenderContext = mod5.$withRenderContext;
var BlockSchema = mod5.BlockSchema;
var CoreImportExtension = mod5.CoreImportExtension;
var CoreImportRules = mod5.CoreImportRules;
var DOMImportExtension = mod5.DOMImportExtension;
var DOMRenderExtension = mod5.DOMRenderExtension;
var HorizontalRuleImportExtension = mod5.HorizontalRuleImportExtension;
var HorizontalRuleImportRules = mod5.HorizontalRuleImportRules;
var ImportOverlays = mod5.ImportOverlays;
var ImportSource = mod5.ImportSource;
var ImportSourceDataTransfer = mod5.ImportSourceDataTransfer;
var ImportTextFormat = mod5.ImportTextFormat;
var ImportTextStyle = mod5.ImportTextStyle;
var ImportWhitespaceConfig = mod5.ImportWhitespaceConfig;
var InlineSchema = mod5.InlineSchema;
var NestedBlockSchema = mod5.NestedBlockSchema;
var RenderContextExport = mod5.RenderContextExport;
var RenderContextRoot = mod5.RenderContextRoot;
var RootSchema = mod5.RootSchema;
var contextUpdater = mod5.contextUpdater;
var contextValue = mod5.contextValue;
var createImportState = mod5.createImportState;
var createRenderState = mod5.createRenderState;
var defaultIsInline = mod5.defaultIsInline;
var defaultPreservesWhitespace = mod5.defaultPreservesWhitespace;
var defineImportRule = mod5.defineImportRule;
var defineOverlayRules = mod5.defineOverlayRules;
var domOverride = mod5.domOverride;
var isElementOfTag = mod5.isElementOfTag;
var parseSelector = mod5.parseSelector;
var sel = mod5.sel;

// node_modules/@lexical/clipboard/dist/LexicalClipboard.prod.mjs
var LexicalClipboard_prod_exports = {};
__export(LexicalClipboard_prod_exports, {
  $exportMimeTypeFromSelection: () => At4,
  $generateJSONFromSelectedNodes: () => wt4,
  $generateNodesFromSerializedNodes: () => $t5,
  $getClipboardDataFromSelection: () => Rt4,
  $getHtmlContent: () => pt4,
  $getLexicalContent: () => dt4,
  $handlePlainTextDrop: () => bt4,
  $handleRichTextDrop: () => Tt5,
  $insertDataTransferForPlainText: () => mt4,
  $insertDataTransferForRichText: () => gt4,
  $insertGeneratedNodes: () => Mt4,
  $writeDragSourceToDataTransfer: () => xt4,
  ClipboardDOMImportExtension: () => ft4,
  ClipboardImportExtension: () => at4,
  DEFAULT_IMPORT_MIME_TYPE: () => lt4,
  DEFAULT_IMPORT_MIME_TYPE_PRIORITY: () => ot4,
  GetClipboardDataExtension: () => Kt5,
  caretFromPoint: () => et3,
  copyToClipboard: () => Dt4,
  setLexicalClipboardDataTransfer: () => St4
});
function et3(r2, i2, l2 = null) {
  const c3 = getRootOwnerDocument(l2), s2 = l2 ? getDOMShadowRoots(l2) : [], u2 = null !== l2 && s2.length > 0;
  if (u2 && "function" == typeof c3.caretPositionFromPoint) {
    const t2 = c3.caretPositionFromPoint(r2, i2, { shadowRoots: s2 });
    if (null !== t2 && (function(t3, e2) {
      for (let n2 = t3; null !== n2; ) {
        if (n2 === e2) return true;
        n2 = getParentElement(n2);
      }
      return false;
    })(t2.offsetNode, l2)) return { node: t2.offsetNode, offset: t2.offset };
  }
  if (u2) {
    const t2 = l2.getRootNode();
    if (isDOMShadowRoot(t2)) {
      const e2 = t2.elementFromPoint(r2, i2);
      if (null !== e2 && l2.contains(e2)) {
        const t3 = (function(t4, e3, n2, o2) {
          const r3 = o2.createRange(), i3 = (t5) => e3 < t5.top ? t5.top - e3 : e3 > t5.bottom ? e3 - t5.bottom : 0, l3 = (e4) => t4 < e4.left ? e4.left - t4 : t4 > e4.right ? t4 - e4.right : 0, c4 = o2.createTreeWalker(n2, NodeFilter.SHOW_TEXT);
          let s3 = null, u3 = 1 / 0, a2 = 1 / 0;
          for (let t5 = c4.nextNode(); t5; t5 = c4.nextNode()) {
            r3.selectNodeContents(t5);
            for (const e4 of r3.getClientRects()) {
              const n3 = i3(e4), o3 = l3(e4);
              (n3 < u3 || n3 === u3 && o3 < a2) && (u3 = n3, a2 = o3, s3 = t5);
            }
          }
          if (null === s3) return null;
          let f3 = 0, p3 = 1 / 0, d2 = 1 / 0;
          for (let e4 = 0; e4 <= s3.length; e4++) {
            r3.setStart(s3, e4), r3.collapse(true);
            const n3 = r3.getBoundingClientRect(), o3 = i3(n3), l4 = Math.abs(t4 - n3.left);
            (o3 < p3 || o3 === p3 && l4 < d2) && (p3 = o3, d2 = l4, f3 = e4);
          }
          return { node: s3, offset: f3 };
        })(r2, i2, e2, c3);
        if (null !== t3) return t3;
      }
    }
  }
  if ("function" == typeof c3.caretRangeFromPoint) {
    const t2 = c3.caretRangeFromPoint(r2, i2);
    return null === t2 ? null : { node: t2.startContainer, offset: t2.startOffset };
  }
  if ("function" == typeof c3.caretPositionFromPoint) {
    const t2 = c3.caretPositionFromPoint(r2, i2);
    return null === t2 ? null : { node: t2.offsetNode, offset: t2.offset };
  }
  return null;
}
function nt4(t2, ...e2) {
  const n2 = new URL("https://lexical.dev/docs/error"), o2 = new URLSearchParams();
  o2.append("code", t2);
  for (const t3 of e2) o2.append("v", t3);
  throw n2.search = o2.toString(), Error(`Minified Lexical error #${t2}; visit ${n2.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}
var ot4 = { "application/x-lexical-editor": 0, "text/html": 10, "text/plain": 20, "text/uri-list": 30 };
function rt4(t2) {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    return window.trustedTypes.createPolicy("lexical", { createHTML: (t3) => t3 }).createHTML(t2);
  }
  return t2;
}
var it4 = (t2, e2) => {
  if (!$isRangeSelection(e2)) return e2.insertRawText(t2), true;
  const n2 = (t3) => {
    const e3 = $getSelection();
    $isRangeSelection(e3) && t3(e3);
  };
  return tokenizeRawText(t2, { linebreak: () => n2((t3) => t3.insertParagraph()), tab: () => n2((t3) => t3.insertNodes([$createTabNode()])), text: (t3) => n2((e3) => e3.insertText(t3)) }), true;
};
var lt4 = { "application/x-lexical-editor": [(t2, e2, n2) => {
  try {
    const n3 = $getEditor(), o2 = JSON.parse(t2);
    if (o2 && o2.namespace === n3._config.namespace && Array.isArray(o2.nodes)) {
      return Mt4(n3, $t5(o2.nodes), e2), true;
    }
  } catch (t3) {
    console.error(t3);
  }
  return n2();
}], "text/html": [(t2, e2, n2) => {
  try {
    const n3 = $getEditor(), o2 = new DOMParser().parseFromString(rt4(t2), "text/html");
    return Mt4(n3, $generateNodesFromDOM(n3, o2), e2), true;
  } catch (t3) {
    return console.error(t3), n2();
  }
}], "text/plain": [it4], "text/uri-list": [it4] };
function ct4(t2, e2, n2, o2) {
  if (!t2) return false;
  const r2 = (i2) => !!t2[i2] && t2[i2](e2, n2, r2.bind(null, i2 - 1), o2);
  return r2(t2.length - 1);
}
function st4(t2, e2, n2) {
  const o2 = e2.getData("text/plain");
  for (const r2 of (function(t3) {
    return Object.keys(t3.$importMimeType).filter((e3) => void 0 !== t3.$importMimeType[e3]).sort((e3, n3) => {
      const o3 = t3.priority[e3], r3 = t3.priority[n3];
      return void 0 === o3 && void 0 === r3 ? e3 < n3 ? -1 : e3 > n3 ? 1 : 0 : void 0 === o3 ? 1 : void 0 === r3 ? -1 : o3 - r3;
    });
  })(t2)) {
    const i2 = e2.getData(r2);
    if (i2 && (("text/html" !== r2 || i2 !== o2) && ct4(t2.$importMimeType[r2], i2, n2, e2))) return true;
  }
  return false;
}
var ut4 = { $importMimeType: lt4, $insertDataTransfer: (t2, e2) => st4({ $importMimeType: lt4, priority: ot4 }, t2, e2), priority: ot4 };
var at4 = /* @__PURE__ */ defineExtension({ build: (t2, e2) => ({ $importMimeType: e2.$importMimeType, $insertDataTransfer: (t3, n2) => st4(e2, t3, n2), priority: e2.priority }), config: /* @__PURE__ */ safeCast({ $importMimeType: lt4, priority: ot4 }), mergeConfig(t2, e2) {
  const n2 = shallowMergeConfig(t2, e2);
  if (e2.$importMimeType) {
    const o2 = { ...t2.$importMimeType };
    for (const [t3, n3] of Object.entries(e2.$importMimeType)) if (n3) {
      const e3 = o2[t3];
      o2[t3] = e3 ? [...e3, ...n3] : n3;
    }
    n2.$importMimeType = o2;
  }
  return e2.priority && (n2.priority = { ...t2.priority, ...e2.priority }), n2;
}, name: "@lexical/clipboard/Import" });
var ft4 = /* @__PURE__ */ defineExtension({ dependencies: [CoreImportExtension, /* @__PURE__ */ configExtension2(at4, { $importMimeType: { "text/html": [(t2, e2, n2, o2) => {
  const r2 = new DOMParser().parseFromString(rt4(t2), "text/html"), l2 = $generateNodesFromDOMViaExtension(r2, { context: [contextValue(ImportSource, "paste"), contextValue(ImportSourceDataTransfer, o2)] });
  return Mt4($getEditor(), l2, e2), true;
}] } })], name: "@lexical/clipboard/DOMImport" });
function pt4(t2, e2 = $getSelection()) {
  return null == e2 && nt4(166), $isRangeSelection(e2) && e2.isCollapsed() || 0 === e2.getNodes().length ? "" : $generateHtmlFromNodes(t2, e2);
}
function dt4(t2, e2 = $getSelection()) {
  return null == e2 && nt4(166), $isRangeSelection(e2) && e2.isCollapsed() || 0 === e2.getNodes().length ? null : JSON.stringify(wt4(t2, e2));
}
function mt4(t2, e2) {
  const n2 = t2.getData("text/plain") || t2.getData("text/uri-list");
  null != n2 && e2.insertRawText(n2);
}
function gt4(t2, e2, n2) {
  (function() {
    const t3 = $getPeerDependency(at4.name);
    return t3 ? t3.output : ut4;
  })().$insertDataTransfer(t2, e2);
}
var yt4 = "application/x-lexical-drag";
function xt4(t2, e2) {
  const n2 = { editorKey: e2.getKey() };
  t2.setData(yt4, JSON.stringify(n2));
}
function ht4(t2, e2, n2) {
  const o2 = t2.dataTransfer;
  if (null === o2) return false;
  const r2 = (function(t3) {
    const e3 = t3.getData(yt4);
    if (!e3) return null;
    let n3;
    try {
      n3 = JSON.parse(e3);
    } catch (t4) {
      return null;
    }
    return null !== (o3 = n3) && "object" == typeof o3 && "editorKey" in o3 && "string" == typeof o3.editorKey ? n3 : null;
    var o3;
  })(o2);
  if (null === r2) return false;
  const i2 = (function(t3, e3) {
    const n3 = et3(t3.clientX, t3.clientY, e3.getRootElement());
    if (null === n3) return null;
    const o3 = $getNearestNodeFromDOMNode(n3.node);
    if (null === o3) return null;
    if ($isTextNode(o3)) return $getTextPointCaret(o3, "next", n3.offset);
    if ($isElementNode(o3)) return $getChildCaretAtIndex(o3, n3.offset, "next");
    const r3 = o3.getParent();
    return null === r3 ? null : $getChildCaretAtIndex(r3, o3.getIndexWithinParent() + 1, "next");
  })(t2, e2);
  if (null === i2) return false;
  const l2 = $splitAtPointCaretNext(i2);
  if (null === l2) return false;
  const c3 = r2.editorKey === e2.getKey(), u2 = $getSelection();
  if (c3) {
    if (!$isRangeSelection(u2) || u2.isCollapsed()) return false;
    if ((function(t3, e3) {
      const { anchor: n3, focus: o3 } = $getCaretRangeInDirection($caretRangeFromSelection(e3), "next");
      return $comparePointCaretNext(n3, t3) < 0 && $comparePointCaretNext(t3, o3) < 0;
    })(i2, u2)) return t2.preventDefault(), true;
    u2.removeText();
  }
  if (!l2.origin.isAttached()) return t2.preventDefault(), true;
  if (n2(o2, $setSelectionFromCaretRange($getCollapsedCaretRange(l2)), e2), !c3) {
    const t3 = e2.getRootElement(), n3 = t3 ? t3.ownerDocument : null, o3 = n3 ? (function(t4, e3) {
      for (const n4 of findAllLexicalElementsDeep(e3)) {
        const e4 = getEditorPropertyFromDOMNode(n4);
        if (isLexicalEditor(e4) && e4.getKey() === t4 && isHTMLElement(n4)) return n4;
      }
      return null;
    })(r2.editorKey, n3) : null;
    null !== o3 && o3.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "deleteByDrag" }));
  }
  return t2.preventDefault(), true;
}
function Tt5(t2, e2) {
  return ht4(t2, e2, gt4);
}
function bt4(t2, e2) {
  return ht4(t2, e2, (t3, e3) => mt4(t3, e3));
}
function Mt4(t2, e2, n2) {
  t2.dispatchCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, { nodes: e2, selection: n2 }) || (n2.insertNodes(e2), (function(t3) {
    if ($isRangeSelection(t3) && t3.isCollapsed()) {
      const e3 = t3.anchor;
      let n3 = null;
      const o2 = $caretFromPoint(e3, "previous");
      if (o2) if ($isTextPointCaret(o2)) n3 = o2.origin;
      else {
        const t4 = $getCaretRange(o2, $getChildCaret($getRoot(), "next").getFlipped());
        for (const e4 of t4) {
          if ($isTextNode(e4.origin)) {
            n3 = e4.origin;
            break;
          }
          if ($isElementNode(e4.origin) && !e4.origin.isInline()) break;
        }
      }
      if (n3 && $isTextNode(n3)) {
        const e4 = n3.getFormat(), o3 = n3.getStyle();
        t3.format === e4 && t3.style === o3 || (t3.format = e4, t3.style = o3, t3.dirty = true);
      }
    }
  })(n2));
}
function vt4(t2, e2, n2, o2 = []) {
  let r2 = null === e2 || n2.isSelected(e2);
  const i2 = $isElementNode(n2) && n2.excludeFromCopy("html");
  let l2 = n2;
  null !== e2 && $isTextNode(l2) && (l2 = $sliceSelectedTextNodeContent(e2, l2, "clone"));
  const c3 = $isElementNode(l2) ? l2.getChildren() : [], s2 = (function(t3) {
    const e3 = t3.exportJSON(), n3 = t3.constructor;
    if (e3.type !== n3.getType() && nt4(58, n3.name), $isElementNode(t3)) {
      const t4 = e3.children;
      Array.isArray(t4) || nt4(59, n3.name);
    }
    return e3;
  })(l2);
  $isTextNode(l2) && 0 === l2.getTextContentSize() && (r2 = false);
  const u2 = r2 && $isNodeSelection(e2) && $isElementNode(n2) ? null : e2;
  for (let o3 = 0; o3 < c3.length; o3++) {
    const i3 = c3[o3], l3 = vt4(t2, u2, i3, s2.children);
    !r2 && $isElementNode(n2) && l3 && n2.extractWithChild(i3, e2, "clone") && (r2 = true);
  }
  if (r2 && !i2) {
    const e3 = $getSlotNames(l2);
    if (e3.length > 0) {
      const n3 = {};
      for (const o3 of e3) {
        const e4 = $getSlot(l2, o3);
        null === e4 && nt4(366, l2.constructor.name, o3);
        const r3 = [];
        vt4(t2, null, e4, r3), 1 === r3.length && r3[0].type === e4.getType() || nt4(385, o3, l2.constructor.name, String(r3.length), String(r3.length > 0 ? r3[0].type : "none")), n3[o3] = r3[0];
      }
      s2.$slots = n3;
    }
  }
  if (r2 && !i2) o2.push(s2);
  else if (Array.isArray(s2.children)) for (let t3 = 0; t3 < s2.children.length; t3++) {
    const e3 = s2.children[t3];
    o2.push(e3);
  }
  return r2;
}
function wt4(t2, e2) {
  const n2 = [], o2 = $getRoot(), r2 = $isRangeSelection(e2) ? e2.anchor.getNode() : $isNodeSelection(e2) ? e2.getNodes()[0] ?? null : null, i2 = null !== r2 ? $getSlotFrame(r2) : null, l2 = ($isElementNode(i2) ? i2 : o2).getChildren();
  for (let o3 = 0; o3 < l2.length; o3++) {
    vt4(t2, e2, l2[o3], n2);
  }
  return { namespace: t2._config.namespace, nodes: n2 };
}
function $t5(t2) {
  const e2 = [];
  for (const n2 of t2) e2.push($parseSerializedNode(n2));
  return e2;
}
var Ct4 = null;
async function Dt4(t2, e2, n2) {
  if (null !== Ct4) return false;
  if (null !== e2) return new Promise((o3, r3) => {
    t2.update(() => {
      o3(Nt4(t2, e2, n2));
    });
  });
  const o2 = t2.getRootElement(), r2 = t2._window || window, i2 = r2.document, l2 = getDOMSelection(r2);
  if (null === o2 || null === l2) return false;
  const c3 = i2.createElement("span");
  c3.style.position = "fixed", c3.style.top = "-1000px", c3.append(i2.createTextNode("#")), o2.append(c3);
  const s2 = i2.createRange();
  return s2.setStart(c3, 0), s2.setEnd(c3, 1), l2.removeAllRanges(), l2.addRange(s2), new Promise((e3, o3) => {
    const l3 = t2.registerCommand(COPY_COMMAND, (o4) => (objectKlassEquals(o4, ClipboardEvent) && (l3(), null !== Ct4 && (r2.clearTimeout(Ct4), Ct4 = null), e3(Nt4(t2, o4, n2))), true), COMMAND_PRIORITY_CRITICAL);
    Ct4 = r2.setTimeout(() => {
      l3(), Ct4 = null, e3(false);
    }, 50), i2.execCommand("copy"), c3.remove();
  });
}
function Nt4(t2, e2, n2) {
  if (void 0 === n2) {
    const e3 = getDOMSelection(t2._window), o3 = $getSelection();
    if (!o3 || o3.isCollapsed()) return false;
    if (!e3) return false;
    const r2 = getDOMSelectionPoints(e3, t2.getRootElement()), i2 = r2.anchorNode, l2 = r2.focusNode;
    if (null !== i2 && null !== l2 && !isSelectionWithinEditor(t2, i2, l2)) return false;
    n2 = Rt4(o3);
  }
  e2.preventDefault();
  const o2 = e2.clipboardData;
  return null !== o2 && (St4(o2, n2), true);
}
var Pt4 = [["text/html", pt4], ["application/x-lexical-editor", dt4]];
function Rt4(t2 = $getSelection()) {
  return (function(t3, e2) {
    const n2 = { "text/plain": "" };
    for (const [o2, r2] of Object.entries(t3)) if (r2) {
      const t4 = Et4(r2, e2);
      null !== t4 && (n2[o2] = t4);
    }
    return n2;
  })(Ot4(), t2);
}
function St4(t2, e2) {
  for (const [n2] of Pt4) void 0 === e2[n2] && t2.setData(n2, "");
  for (const n2 in e2) {
    const o2 = e2[n2];
    void 0 !== o2 && t2.setData(n2, o2);
  }
}
function Ot4(t2 = $getEditor()) {
  const e2 = getPeerDependencyFromEditor(t2, Kt5.name);
  return e2 ? e2.output : Ft4;
}
var Ft4 = { "application/x-lexical-editor": [(t2, e2) => t2 ? dt4($getEditor(), t2) : e2()], "text/html": [(t2, e2) => t2 ? pt4($getEditor(), t2) : e2()], "text/plain": [(t2, e2) => t2 ? t2.getTextContent() : e2()] };
function Et4(t2, e2) {
  const n2 = (o2) => t2[o2] ? t2[o2](e2, n2.bind(null, o2 - 1)) : null;
  return n2(t2.length - 1);
}
function At4(t2, e2 = $getSelection()) {
  return Et4(Ot4()[t2] || [], e2);
}
var Kt5 = /* @__PURE__ */ defineExtension({ build: (t2, e2, n2) => e2.$exportMimeType, config: /* @__PURE__ */ safeCast({ $exportMimeType: Ft4 }), mergeConfig(t2, e2) {
  const n2 = shallowMergeConfig(t2, e2);
  if (e2.$exportMimeType) {
    const o2 = { ...t2.$exportMimeType };
    for (const [t3, n3] of Object.entries(e2.$exportMimeType)) if (n3) {
      const e3 = o2[t3];
      o2[t3] = e3 ? [...e3, ...n3] : n3;
    }
    n2.$exportMimeType = o2;
  }
  return n2;
}, name: "@lexical/clipboard/GetClipboardData" });

// node_modules/@lexical/clipboard/dist/LexicalClipboard.mjs
var mod6 = false ? LexicalClipboard_dev_exports : LexicalClipboard_prod_exports;
var $exportMimeTypeFromSelection = mod6.$exportMimeTypeFromSelection;
var $generateJSONFromSelectedNodes = mod6.$generateJSONFromSelectedNodes;
var $generateNodesFromSerializedNodes = mod6.$generateNodesFromSerializedNodes;
var $getClipboardDataFromSelection = mod6.$getClipboardDataFromSelection;
var $getHtmlContent = mod6.$getHtmlContent;
var $getLexicalContent = mod6.$getLexicalContent;
var $handlePlainTextDrop = mod6.$handlePlainTextDrop;
var $handleRichTextDrop = mod6.$handleRichTextDrop;
var $insertDataTransferForPlainText = mod6.$insertDataTransferForPlainText;
var $insertDataTransferForRichText = mod6.$insertDataTransferForRichText;
var $insertGeneratedNodes = mod6.$insertGeneratedNodes;
var $writeDragSourceToDataTransfer = mod6.$writeDragSourceToDataTransfer;
var ClipboardDOMImportExtension = mod6.ClipboardDOMImportExtension;
var ClipboardImportExtension = mod6.ClipboardImportExtension;
var DEFAULT_IMPORT_MIME_TYPE = mod6.DEFAULT_IMPORT_MIME_TYPE;
var DEFAULT_IMPORT_MIME_TYPE_PRIORITY = mod6.DEFAULT_IMPORT_MIME_TYPE_PRIORITY;
var GetClipboardDataExtension = mod6.GetClipboardDataExtension;
var caretFromPoint = mod6.caretFromPoint;
var copyToClipboard = mod6.copyToClipboard;
var setLexicalClipboardDataTransfer = mod6.setLexicalClipboardDataTransfer;

// node_modules/@lexical/dragon/dist/LexicalDragon.prod.mjs
var LexicalDragon_prod_exports = {};
__export(LexicalDragon_prod_exports, {
  DragonExtension: () => h2,
  installDragonSupport: () => g2,
  registerDragonSupport: () => b3
});
var c2 = { bold: "bold", italic: "italic", strikeThrough: "strikethrough", subscript: "subscript", superscript: "superscript", underline: "underline" };
var f2 = Symbol.for("@lexical/dragon/WindowState");
function g2(e2 = /* @__PURE__ */ (function() {
  return "undefined" != typeof window ? window : void 0;
})()) {
  return e2 ? p2(e2, Symbol("@lexical/dragon/globalInstall"), void 0) : () => {
  };
}
function p2(e2, t2, n2) {
  const i2 = (function(e3) {
    let t3 = e3[f2];
    return void 0 === t3 && (t3 = { dispose: () => {
    }, editors: /* @__PURE__ */ new Map(), installs: /* @__PURE__ */ new Set() }, e3[f2] = t3), t3;
  })(e2);
  if (0 === i2.installs.size) {
    const t3 = x2.bind(e2);
    e2.addEventListener("message", t3, true), i2.dispose = () => {
      e2.removeEventListener("message", t3, true);
    };
  }
  if (i2.installs.add(t2), n2) {
    const e3 = i2.editors.get(n2) || /* @__PURE__ */ new Set();
    e3.add(t2), i2.editors.set(n2, e3);
  }
  return m2.bind(null, e2, i2, t2, n2);
}
function m2(e2, t2, n2, i2) {
  if (i2) {
    const e3 = t2.editors.get(i2);
    e3 && e3.delete(n2) && 0 === e3.size && t2.editors.delete(i2);
  }
  t2.installs.delete(n2) && 0 === t2.installs.size && (t2.dispose(), delete e2[f2]);
}
function y2(e2) {
  return e2 && e2.ownerDocument.defaultView;
}
function b3(n2) {
  const i2 = watchedSignal(() => y2(n2.getRootElement()), (e2) => n2.registerRootListener((t2) => {
    e2.value = y2(t2);
  }));
  return effect(() => {
    const e2 = i2.value;
    if (e2) return p2(e2, Symbol("@lexical/dragon/editorInstall"), n2);
  });
}
function x2(e2) {
  if (e2.origin !== this.location.origin) return;
  const t2 = (function(e3) {
    const t3 = e3[f2];
    if (void 0 === t3) return null;
    const n3 = getEditorPropertyFromDOMNode(getActiveElementDeep(e3.document));
    return isLexicalEditor(n3) && t3.editors.has(n3) ? n3 : null;
  })(this);
  if (null === t2) return;
  const n2 = e2.data;
  if ("string" == typeof n2) {
    let r2;
    try {
      r2 = JSON.parse(n2);
    } catch (e3) {
      return;
    }
    if (r2 && "nuanria_messaging" === r2.protocol && "request" === r2.type) {
      const n3 = r2.payload;
      if (n3 && "makeChanges" === n3.functionId) {
        const r3 = n3.args;
        if (Array.isArray(r3)) {
          const [n4, l2, a2, d2, u2, f3] = r3;
          if (![n4, l2, d2, u2].every(Number.isFinite) || "string" != typeof a2 && -1 !== a2) return;
          t2.update(() => {
            const t3 = $getSelection();
            if ($isRangeSelection(t3)) {
              const i2 = t3.anchor;
              let o2 = i2.getNode(), r4 = 0, g3 = 0;
              if ($isTextNode(o2) && n4 >= 0 && l2 >= 0 && (r4 = n4, g3 = n4 + l2, t3.setTextNodeRange(o2, r4, o2, g3)), "string" != typeof a2 || r4 === g3 && "" === a2 || (t3.insertRawText(a2), o2 = i2.getNode()), $isTextNode(o2)) {
                const e3 = o2.getTextContentSize();
                r4 = Math.min(Math.max(d2, 0), e3), g3 = d2 < 0 || u2 < 0 ? r4 : Math.min(d2 + u2, e3), t3.setTextNodeRange(o2, r4, o2, g3);
              }
              if ("string" == typeof f3 && u2 > 0 && !t3.isCollapsed()) {
                const e3 = c2[f3];
                void 0 !== e3 && t3.formatText(e3);
              }
              e2.stopImmediatePropagation();
            }
          });
        }
      }
    }
  }
}
var h2 = /* @__PURE__ */ defineExtension({ build: (e2, t2, i2) => namedSignals(t2), config: /* @__PURE__ */ safeCast({ disabled: "undefined" == typeof window }), name: "@lexical/dragon", register: (e2, n2, i2) => effect(() => i2.getOutput().disabled.value ? void 0 : b3(e2)) });

// node_modules/@lexical/dragon/dist/LexicalDragon.mjs
var mod7 = false ? LexicalDragon_dev_exports : LexicalDragon_prod_exports;
var DragonExtension = mod7.DragonExtension;
var installDragonSupport = mod7.installDragonSupport;
var registerDragonSupport = mod7.registerDragonSupport;

// node_modules/@lexical/plain-text/dist/LexicalPlainText.prod.mjs
var LexicalPlainText_prod_exports = {};
__export(LexicalPlainText_prod_exports, {
  PlainTextExtension: () => P2,
  registerPlainText: () => O3
});
function M3(e2, t2) {
  t2.update(() => {
    if (null !== e2) {
      const r2 = objectKlassEquals(e2, KeyboardEvent) ? null : e2.clipboardData, o2 = $getSelection();
      if (null !== o2 && !o2.isCollapsed() && null != r2) {
        e2.preventDefault();
        const a2 = $getHtmlContent(t2);
        null !== a2 && r2.setData("text/html", a2), r2.setData("text/plain", o2.getTextContent());
      }
    }
  });
}
function O3(n2) {
  return mergeRegister(n2.registerCommand(DELETE_CHARACTER_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (t2.deleteCharacter(e2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(DELETE_WORD_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (t2.deleteWord(e2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(DELETE_LINE_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (t2.deleteLine(e2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(CONTROLLED_TEXT_INSERTION_COMMAND, (t2) => {
    const r2 = $getSelection();
    if (!$isRangeSelection(r2)) return false;
    if ("string" == typeof t2) r2.insertText(t2);
    else {
      const n3 = t2.dataTransfer;
      if (null != n3) $insertDataTransferForPlainText(n3, r2);
      else {
        const e2 = t2.data;
        e2 && r2.insertText(e2);
      }
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(REMOVE_TEXT_COMMAND, () => {
    const e2 = $getSelection();
    return !!$isRangeSelection(e2) && (e2.removeText(), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(INSERT_LINE_BREAK_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (t2.insertLineBreak(e2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(INSERT_PARAGRAPH_COMMAND, () => {
    const e2 = $getSelection();
    return !!$isRangeSelection(e2) && (e2.insertLineBreak(), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(KEY_ARROW_LEFT_COMMAND, (e2) => {
    const t2 = $getSelection();
    if (!$isRangeSelection(t2)) return false;
    const r2 = e2, n3 = r2.shiftKey;
    return !!$shouldOverrideDefaultCharacterSelection(t2, true) && (r2.preventDefault(), $moveCharacter(t2, n3, true), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(KEY_ARROW_RIGHT_COMMAND, (e2) => {
    const t2 = $getSelection();
    if (!$isRangeSelection(t2)) return false;
    const r2 = e2, n3 = r2.shiftKey;
    return !!$shouldOverrideDefaultCharacterSelection(t2, false) && (r2.preventDefault(), $moveCharacter(t2, n3, false), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(KEY_BACKSPACE_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && ((!IS_IOS || !CAN_USE_BEFORE_INPUT) && (e2.preventDefault(), n2.dispatchCommand(DELETE_CHARACTER_COMMAND, true)));
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(KEY_DELETE_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (e2.preventDefault(), n2.dispatchCommand(DELETE_CHARACTER_COMMAND, false));
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(KEY_ENTER_COMMAND, (e2) => {
    const t2 = $getSelection();
    if (!$isRangeSelection(t2)) return false;
    if (null !== e2) {
      if ((IS_IOS || IS_SAFARI || IS_APPLE_WEBKIT) && CAN_USE_BEFORE_INPUT) return false;
      e2.preventDefault();
    }
    return n2.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(SELECT_ALL_COMMAND, () => {
    const e2 = $getSelection();
    return $selectAll($isRangeSelection(e2) && null !== $getSlotFrame(e2.anchor.getNode()) ? e2 : null), true;
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(COPY_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (M3(e2, n2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(CUT_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && ((function(e3, t3) {
      M3(e3, t3), t3.update(() => {
        const e4 = $getSelection();
        $isRangeSelection(e4) && e4.removeText();
      }, { tag: CUT_TAG });
    })(e2, n2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(PASTE_COMMAND, (t2) => {
    const r2 = $getSelection();
    return !!$isRangeSelection(r2) && ((function(t3, r3) {
      t3.preventDefault(), r3.update(() => {
        const r4 = $getSelection(), n3 = objectKlassEquals(t3, ClipboardEvent) ? t3.clipboardData : null;
        null != n3 && $isRangeSelection(r4) && $insertDataTransferForPlainText(n3, r4);
      }, { tag: PASTE_TAG });
    })(t2, n2), true);
  }, COMMAND_PRIORITY_EDITOR), n2.registerCommand(DROP_COMMAND, (e2) => $handlePlainTextDrop(e2, n2), COMMAND_PRIORITY_EDITOR), n2.registerCommand(DRAGSTART_COMMAND, (e2) => {
    const t2 = $getSelection();
    return !!$isRangeSelection(t2) && (t2.isCollapsed() || null === e2.dataTransfer || $writeDragSourceToDataTransfer(e2.dataTransfer, n2), true);
  }, COMMAND_PRIORITY_EDITOR));
}
var P2 = /* @__PURE__ */ defineExtension({ conflictsWith: ["@lexical/rich-text"], dependencies: [DragonExtension, NormalizeInlineElementsExtension, NormalizeTripleClickSelectionExtension], name: "@lexical/plain-text", register: O3 });

// node_modules/@lexical/plain-text/dist/LexicalPlainText.mjs
var mod8 = false ? LexicalPlainText_dev_exports : LexicalPlainText_prod_exports;
var PlainTextExtension = mod8.PlainTextExtension;
var registerPlainText = mod8.registerPlainText;

// node_modules/@lexical/history/dist/LexicalHistory.prod.mjs
var LexicalHistory_prod_exports = {};
__export(LexicalHistory_prod_exports, {
  HistoryExtension: () => H3,
  SharedHistoryExtension: () => I2,
  createEmptyHistoryState: () => z3,
  registerHistory: () => O4
});
function E2(t2, e2, n2, o2, r2) {
  if (null === t2 || 0 === n2.size && 0 === o2.size && !r2) return 0;
  const a2 = e2._selection, i2 = t2._selection;
  if (r2) return 1;
  if (!($isRangeSelection(a2) && $isRangeSelection(i2) && i2.isCollapsed() && a2.isCollapsed())) return 0;
  const l2 = (function(t3, e3, n3) {
    const o3 = t3._nodeMap, r3 = [];
    for (const t4 of e3) {
      const e4 = o3.get(t4);
      void 0 !== e4 && r3.push(e4);
    }
    for (const [t4, e4] of n3) {
      if (!e4) continue;
      const n4 = o3.get(t4);
      void 0 === n4 || $isRootNode(n4) || r3.push(n4);
    }
    return r3;
  })(e2, n2, o2);
  if (0 === l2.length) return 0;
  if (l2.length > 1) {
    const n3 = e2._nodeMap, o3 = n3.get(a2.anchor.key), r3 = n3.get(i2.anchor.key);
    return o3 && r3 && !t2._nodeMap.has(o3.__key) && $isTextNode(o3) && 1 === o3.__text.length && 1 === a2.anchor.offset ? 2 : 0;
  }
  const s2 = l2[0], u2 = t2._nodeMap.get(s2.__key);
  if (!$isTextNode(u2) || !$isTextNode(s2) || u2.__mode !== s2.__mode) return 0;
  const d2 = u2.__text, c3 = s2.__text;
  if (d2 === c3) return 0;
  const p3 = a2.anchor, f3 = i2.anchor;
  if (p3.key !== f3.key || "text" !== p3.type) return 0;
  const h3 = p3.offset, m3 = f3.offset, g3 = c3.length - d2.length;
  return 1 === g3 && m3 === h3 - 1 ? 2 : -1 === g3 && m3 === h3 + 1 ? 3 : -1 === g3 && m3 === h3 ? 4 : 0;
}
function D3(t2, e2, n2) {
  let o2 = n2(), r2 = 0, a2 = o2, i2 = 0, l2 = null;
  return (s2, u2, d2, c3, p3, f3) => {
    const h3 = n2();
    if (f3.has(COMPOSITION_START_TAG) && (a2 = o2, i2 = r2, l2 = s2), f3.has(HISTORIC_TAG)) return r2 = 0, o2 = h3, 2;
    f3.has(COMPOSITION_END_TAG) && l2 && (o2 = a2, r2 = i2, s2 = l2);
    const m3 = f3.has(PASTE_TAG) || f3.has(CUT_TAG) ? 0 : E2(s2, u2, c3, p3, t2.isComposing()), w2 = (() => {
      const n3 = null === d2 || d2.editor === t2, a3 = f3.has(HISTORY_PUSH_TAG);
      if (!a3 && n3 && f3.has(HISTORY_MERGE_TAG)) return 0;
      if (1 === m3) return 2;
      if (null === s2) return 1;
      const i3 = u2._selection;
      if (!(c3.size > 0 || p3.size > 0)) return null !== i3 ? 0 : 2;
      const l3 = "number" == typeof e2 ? e2 : e2.peek();
      if (false === a3 && 0 !== m3 && m3 === r2 && h3 < o2 + l3 && n3) return 0;
      if (1 === c3.size) {
        if ((function(t3, e3, n4) {
          const o3 = e3._nodeMap.get(t3), r3 = n4._nodeMap.get(t3), a4 = e3._selection, i4 = n4._selection;
          return !($isRangeSelection(a4) && $isRangeSelection(i4) && "element" === a4.anchor.type && "element" === a4.focus.type && "text" === i4.anchor.type && "text" === i4.focus.type || !$isTextNode(o3) || !$isTextNode(r3) || o3.__parent !== r3.__parent) && JSON.stringify(e3.read(() => o3.exportJSON())) === JSON.stringify(n4.read(() => r3.exportJSON()));
        })(Array.from(c3)[0], s2, u2)) return 0;
      }
      return 1;
    })();
    return o2 = h3, r2 = m3, w2;
  };
}
function M4(t2, e2) {
  t2.undoStack = [], t2.redoStack = [], t2.current = null, e2 && e2(t2);
}
function O4(t2, e2, n2, o2 = Date.now, r2, f3 = null) {
  const h3 = D3(t2, n2, o2), m3 = () => {
    r2 && r2(e2);
  };
  return m3(), mergeRegister(t2.registerCommand(UNDO_COMMAND, () => ((function(t3, e3, n3) {
    const o3 = e3.redoStack, r3 = e3.undoStack;
    if (0 !== r3.length) {
      const a2 = e3.current, i2 = r3.pop();
      null !== a2 && (o3.push(a2), t3.dispatchCommand(CAN_REDO_COMMAND, true)), 0 === r3.length && t3.dispatchCommand(CAN_UNDO_COMMAND, false), e3.current = i2 || null, n3 && n3(e3), i2 && i2.editor.setEditorState(i2.editorState, { tag: HISTORIC_TAG });
    }
  })(t2, e2, r2), true), COMMAND_PRIORITY_EDITOR), t2.registerCommand(REDO_COMMAND, () => ((function(t3, e3, n3) {
    const o3 = e3.redoStack, r3 = e3.undoStack;
    if (0 !== o3.length) {
      const a2 = e3.current;
      null !== a2 && (r3.push(a2), t3.dispatchCommand(CAN_UNDO_COMMAND, true));
      const i2 = o3.pop();
      0 === o3.length && t3.dispatchCommand(CAN_REDO_COMMAND, false), e3.current = i2 || null, n3 && n3(e3), i2 && i2.editor.setEditorState(i2.editorState, { tag: HISTORIC_TAG });
    }
  })(t2, e2, r2), true), COMMAND_PRIORITY_EDITOR), t2.registerCommand(CLEAR_EDITOR_COMMAND, () => (M4(e2, r2), false), COMMAND_PRIORITY_EDITOR), t2.registerCommand(CLEAR_HISTORY_COMMAND, () => (M4(e2, r2), t2.dispatchCommand(CAN_REDO_COMMAND, false), t2.dispatchCommand(CAN_UNDO_COMMAND, false), true), COMMAND_PRIORITY_EDITOR), t2.registerUpdateListener(({ editorState: n3, prevEditorState: o3, dirtyLeaves: r3, dirtyElements: a2, tags: i2 }) => {
    const l2 = e2.current, s2 = e2.redoStack, u2 = e2.undoStack, d2 = null === l2 ? null : l2.editorState;
    if (null !== l2 && n3 === d2) return;
    const g3 = h3(o3, n3, l2, r3, a2, i2);
    if (1 === g3) {
      if (0 !== s2.length && (e2.redoStack = [], t2.dispatchCommand(CAN_REDO_COMMAND, false)), null !== l2) {
        u2.push({ ...l2 });
        const e3 = "number" == typeof f3 || null === f3 ? f3 : f3.peek();
        null !== e3 && u2.length > e3 && u2.splice(0, u2.length - e3), t2.dispatchCommand(CAN_UNDO_COMMAND, true);
      }
    } else if (2 === g3) return;
    e2.current = { editor: t2, editorState: n3 }, m3();
  }));
}
function z3() {
  return { current: null, redoStack: [], undoStack: [] };
}
var H3 = /* @__PURE__ */ defineExtension({ build: (t2, { delay: e2, createInitialHistoryState: o2, disabled: r2, maxDepth: a2, now: i2 }, l2) => ({ ...namedSignals({ delay: e2, disabled: r2, historyState: o2(t2), maxDepth: a2, now: i2 }), ...l2.getInitResult() }), config: /* @__PURE__ */ safeCast({ createInitialHistoryState: z3, delay: 300, disabled: "undefined" == typeof window, maxDepth: null, now: Date.now }), init: () => ({ canRedo: signal(false), canUndo: signal(false) }), name: "@lexical/history/History", register: (e2, n2, r2) => {
  const { canUndo: a2, canRedo: i2 } = r2.getInitResult(), l2 = r2.getOutput(), s2 = (t2) => batch(() => {
    a2.value = null != t2 && t2.undoStack.length > 0, i2.value = null != t2 && t2.redoStack.length > 0;
  });
  return effect(() => {
    if (!l2.disabled.value) return O4(e2, l2.historyState.value, l2.delay, () => l2.now.peek()(), s2, l2.maxDepth);
    s2(null);
  });
} });
var I2 = /* @__PURE__ */ defineExtension({ build: (t2, { disabled: e2, parentEditor: o2 }) => namedSignals({ disabled: e2, parentEditor: o2 || t2._parentEditor }), config: /* @__PURE__ */ safeCast({ disabled: false, parentEditor: null }), dependencies: [/* @__PURE__ */ configExtension(H3, { disabled: true })], name: "@lexical/history/SharedHistory", register: (e2, n2, a2) => effect(() => {
  const { disabled: t2, parentEditor: e3 } = a2.getOutput();
  if (!t2.value) {
    const { output: t3 } = a2.getDependency(H3), n3 = (function(t4) {
      return t4 ? getPeerDependencyFromEditor(t4, H3.name) : null;
    })(e3.value);
    if (!n3) return;
    const i2 = n3.output;
    batch(() => {
      t3.delay.value = i2.delay.value, t3.historyState.value = i2.historyState.value, t3.now.value = i2.now.value, t3.disabled.value = i2.disabled.value;
    });
  }
}) });

// node_modules/@lexical/history/dist/LexicalHistory.mjs
var mod9 = false ? LexicalHistory_dev_exports : LexicalHistory_prod_exports;
var HistoryExtension = mod9.HistoryExtension;
var SharedHistoryExtension = mod9.SharedHistoryExtension;
var createEmptyHistoryState = mod9.createEmptyHistoryState;
var registerHistory = mod9.registerHistory;

// src/vendor/dsh-reference-node.jsx
var import_react2 = __toESM(require("react"), 1);
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
var ReferenceChipNode = class _ReferenceChipNode extends DecoratorNode {
  static getType() {
    return "dsh-inline-edit-reference";
  }
  static clone(node) {
    return new _ReferenceChipNode({
      source: node.__source,
      ref: node.__ref,
      label: node.__label,
      appearance: node.__appearance,
      clipboardText: node.__clipboardText
    }, node.__invalid, node.__key);
  }
  static importJSON(json) {
    return new _ReferenceChipNode(json, json.invalid);
  }
  constructor(insert, invalid = false, key) {
    super(key);
    this.__source = insert.source;
    this.__ref = insert.ref;
    this.__label = insert.label;
    this.__appearance = insert.appearance;
    this.__clipboardText = insert.clipboardText;
    this.__invalid = invalid;
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      type: _ReferenceChipNode.getType(),
      version: 1,
      source: this.__source,
      ref: this.__ref,
      label: this.__label,
      appearance: this.__appearance,
      clipboardText: this.__clipboardText,
      invalid: this.__invalid
    };
  }
  createDOM() {
    const element = document.createElement("span");
    element.setAttribute("data-dsh-ie-reference", this.__source);
    element.setAttribute("contenteditable", "false");
    return element;
  }
  updateDOM() {
    return false;
  }
  isInline() {
    return true;
  }
  // Native arrows cross the chip in one move; deletion removes it whole.
  isKeyboardSelectable() {
    return false;
  }
  // The display name is never the clipboard or submission representation.
  getTextContent() {
    return this.__clipboardText;
  }
  setInvalid(invalid) {
    this.getWritable().__invalid = invalid;
  }
  isInvalid() {
    return this.getLatest().__invalid;
  }
  getSource() {
    return this.getLatest().__source;
  }
  getReference() {
    return this.getLatest().__ref;
  }
  getLabel() {
    return this.getLatest().__label;
  }
  getAppearance() {
    return this.getLatest().__appearance;
  }
  decorate() {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-ie-reference-token", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.ReferenceChip, { appearance: this.__appearance || "file", label: this.__label, title: this.__clipboardText || this.__label }) });
  }
};
function $isReferenceChipNode(node) {
  return node instanceof ReferenceChipNode;
}
function $referenceLayout() {
  let text = "";
  const bounds = /* @__PURE__ */ new Map(), children = /* @__PURE__ */ new Map(), attachmentKeys = [];
  function walk(element) {
    const start = text.length, kids = element.getChildren();
    children.set(element.getKey(), kids.map((kid) => kid.getKey()));
    for (const kid of kids) {
      const from = text.length;
      if ($isReferenceChipNode(kid)) {
        if (kid.getSource() === "attachment") attachmentKeys.push(kid.getReference());
        else text += kid.getTextContent();
      } else if ($isTextNode(kid)) text += kid.getTextContent();
      else if ($isLineBreakNode(kid)) text += "\n";
      else if ($isElementNode(kid)) walk(kid);
      bounds.set(kid.getKey(), { start: from, end: text.length });
    }
    bounds.set(element.getKey(), { start, end: text.length });
  }
  const root = $getRoot(), blocks = root.getChildren();
  children.set(root.getKey(), blocks.map((block) => block.getKey()));
  blocks.forEach((block, index) => {
    if (index) text += "\n";
    if ($isElementNode(block)) walk(block);
  });
  bounds.set(root.getKey(), { start: 0, end: text.length });
  function offset(point) {
    const own = bounds.get(point.key);
    if (!own) return null;
    if (point.type === "text") return Math.min(own.end, own.start + point.offset);
    const child = children.get(point.key)?.[point.offset];
    return child === void 0 ? own.end : bounds.get(child)?.start ?? null;
  }
  return { text, offset, attachmentKeys };
}

// src/reference-editor.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function $seedReferenceText(value, references) {
  const root = $getRoot();
  root.clear();
  let paragraph = $createParagraphNode();
  root.append(paragraph);
  function append(text) {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index) {
        paragraph = $createParagraphNode();
        root.append(paragraph);
      }
      if (line) paragraph.append($createTextNode(line));
    });
  }
  let cursor = 0;
  for (const reference of references || []) {
    const { start, end, path, label } = reference;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < cursor || end <= start || end > value.length || typeof path !== "string" || typeof label !== "string") continue;
    const raw = value.slice(start, end);
    if (raw.includes("\n")) continue;
    append(value.slice(cursor, start));
    paragraph.append(new ReferenceChipNode({ source: "reference", ref: raw, label, appearance: "file", clipboardText: raw }));
    cursor = end;
  }
  append(value.slice(cursor));
  root.selectEnd();
}
function DecoratorPortals({ editor }) {
  const [decorators, setDecorators] = (0, import_react3.useState)(() => editor.getDecorators());
  (0, import_react3.useLayoutEffect)(() => {
    setDecorators(editor.getDecorators());
    return editor.registerDecoratorListener(setDecorators);
  }, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children: Object.entries(decorators).map(([key, view]) => {
    const element = editor.getElementByKey(key);
    return element === null ? null : (0, import_react_dom2.createPortal)(view, element, key);
  }) });
}
function selectionText() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const layout = $referenceLayout(), a2 = layout.offset(selection.anchor), b4 = layout.offset(selection.focus);
  return a2 === null || b4 === null ? null : { text: layout.text.slice(Math.min(a2, b4), Math.max(a2, b4)), selection };
}
function $selectTextOffset(start, end = start) {
  const layout = $referenceLayout(), length = layout.text.length;
  function point(offset) {
    offset = Math.max(0, Math.min(length, offset));
    for (const node of $getRoot().getAllTextNodes()) {
      const from = layout.offset({ key: node.getKey(), offset: 0, type: "text" });
      if (from !== null && offset >= from && offset <= from + node.getTextContentSize()) return { key: node.getKey(), offset: offset - from, type: "text" };
    }
    for (const block of $getRoot().getChildren()) {
      const children = block.getChildren?.() || [];
      for (let index = 0; index <= children.length; index++) {
        const at5 = layout.offset({ key: block.getKey(), offset: index, type: "element" });
        if (at5 !== null && at5 >= offset) return { key: block.getKey(), offset: index, type: "element" };
      }
    }
    const root = $getRoot();
    return { key: root.getKey(), offset: root.getChildrenSize(), type: "element" };
  }
  const selection = $getRoot().selectEnd(), anchor = point(start), focus = point(end);
  selection.anchor.set(anchor.key, anchor.offset, anchor.type);
  selection.focus.set(focus.key, focus.offset, focus.type);
  return selection;
}
function $insertAttachments(items, selection) {
  if (!items.length) return;
  const selected = selection || $getRoot().selectEnd();
  const nodes = items.map((item) => new ReferenceChipNode({ source: "attachment", ref: item.key, label: item.name, appearance: "file", clipboardText: "" }));
  selected.insertNodes(nodes);
  nodes.at(-1).selectNext(0, 0);
}
var ReferenceEditor = (0, import_react3.forwardRef)(function ReferenceEditor2(props, forwardedRef) {
  const { value, references, attachments = [], disabled, label, maxLength, onChange, onKeyDown, onFiles, onLimit } = props;
  const element = (0, import_react3.useRef)(null), current = (0, import_react3.useRef)(props), emitted = (0, import_react3.useRef)(value), frame = (0, import_react3.useRef)(null);
  const knownAttachments = (0, import_react3.useRef)(/* @__PURE__ */ new Map()), incomingKeys = (0, import_react3.useRef)(new Set(attachments.map((item) => item.key))), projectedKeys = (0, import_react3.useRef)([]), lastSelection = (0, import_react3.useRef)(null);
  for (const item of attachments) knownAttachments.current.set(item.key, item);
  current.current = props;
  const [editor] = (0, import_react3.useState)(() => createEditor({ namespace: "dsh-inline-edit", nodes: [ReferenceChipNode], onError: (error) => {
    throw error;
  } }));
  const history = (0, import_react3.useRef)(createEmptyHistoryState());
  (0, import_react3.useImperativeHandle)(forwardedRef, () => element.current, []);
  function $rememberSelection() {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) lastSelection.current = selection.clone();
  }
  function $restoredSelection() {
    const saved = lastSelection.current;
    if (saved && $getNodeByKey(saved.anchor.key) && $getNodeByKey(saved.focus.key)) {
      $setSelection(saved.clone());
      return $getSelection();
    }
    return $getRoot().selectEnd();
  }
  function revealCaret() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const host = element.current, selection = host?.ownerDocument.getSelection();
      if (!host || !selection?.isCollapsed || !selection.rangeCount || !host.contains(selection.anchorNode)) return;
      const rect = selection.getRangeAt(0).getBoundingClientRect?.(), box = host.getBoundingClientRect();
      if (!rect || !rect.height && !rect.width) return;
      if (rect.bottom > box.bottom) host.scrollTop += rect.bottom - box.bottom;
      else if (rect.top < box.top) host.scrollTop -= box.top - rect.top;
    });
  }
  (0, import_react3.useLayoutEffect)(() => {
    let active = true;
    editor.setRootElement(element.current);
    const plain = registerPlainText(editor);
    const noAncestorScroll = editor.registerNodeTransform(RootNode, () => {
      $addUpdateTag(SKIP_SCROLL_INTO_VIEW_TAG);
    });
    const trustedAttachments = editor.registerNodeTransform(ReferenceChipNode, (node) => {
      if (node.getSource() === "attachment" && !knownAttachments.current.has(node.getReference())) node.remove();
    });
    editor.update(() => {
      $seedReferenceText(current.current.value, current.current.references);
      const offset = current.current.initialAttachmentOffset;
      $insertAttachments(current.current.attachments || [], Number.isInteger(offset) ? $selectTextOffset(offset) : $getSelection());
      $rememberSelection();
      projectedKeys.current = $referenceLayout().attachmentKeys;
    }, {
      discrete: true,
      tag: [HISTORY_MERGE_TAG, SKIP_SCROLL_INTO_VIEW_TAG, SKIP_SELECTION_FOCUS_TAG]
    });
    let validState = editor.getEditorState();
    history.current.current = { editor, editorState: validState };
    const undo = registerHistory(editor, history.current, 1e3);
    let validHistory = { ...history.current, undoStack: [...history.current.undoStack], redoStack: [...history.current.redoStack] };
    let restoring = false, revision = 0;
    function rejectUpdate(version, notify) {
      const state = validState, snapshot = validHistory;
      queueMicrotask(() => {
        if (!active || version !== revision) return;
        restoring = true;
        editor.setEditorState(state, { tag: HISTORIC_TAG });
        Object.assign(history.current, snapshot, { undoStack: [...snapshot.undoStack], redoStack: [...snapshot.redoStack] });
        restoring = false;
        notify?.();
      });
    }
    const changed = editor.registerUpdateListener(({ editorState }) => {
      const { text, attachmentKeys } = editorState.read(() => {
        $rememberSelection();
        return $referenceLayout();
      });
      const version = ++revision;
      if (!restoring && text.length > current.current.maxLength) {
        rejectUpdate(version, () => current.current.onLimit?.());
        return;
      }
      if (attachmentKeys.length !== projectedKeys.current.length || attachmentKeys.some((key, index) => key !== projectedKeys.current[index])) {
        const items = attachmentKeys.map((key) => knownAttachments.current.get(key)).filter(Boolean);
        if (current.current.onAttachmentsChange?.(items) === false) {
          rejectUpdate(version);
          return;
        }
        projectedKeys.current = attachmentKeys;
      }
      validState = editorState;
      queueMicrotask(() => {
        if (active && version === revision) validHistory = { ...history.current, undoStack: [...history.current.undoStack], redoStack: [...history.current.redoStack] };
      });
      if (text !== emitted.current) {
        emitted.current = text;
        current.current.onChange(text);
      }
      revealCaret();
    });
    Object.defineProperty(element.current, "value", { configurable: true, get: () => editor.getEditorState().read(() => $referenceLayout().text) });
    element.current.setSelectionRange = (start, end) => editor.update(() => $selectTextOffset(start, end), { discrete: true, tag: SKIP_SCROLL_INTO_VIEW_TAG });
    element.current?.focus({ preventScroll: true });
    editor.update(() => $restoredSelection(), { discrete: true, tag: SKIP_SCROLL_INTO_VIEW_TAG });
    return () => {
      active = false;
      changed();
      undo();
      trustedAttachments();
      noAncestorScroll();
      plain();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      editor.setRootElement(null);
    };
  }, [editor]);
  (0, import_react3.useLayoutEffect)(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  (0, import_react3.useLayoutEffect)(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    editor.update(() => {
      $seedReferenceText(value, references);
      $insertAttachments(current.current.attachments || [], $getSelection());
      $rememberSelection();
    }, { discrete: true, tag: [HISTORY_MERGE_TAG, SKIP_SCROLL_INTO_VIEW_TAG, SKIP_SELECTION_FOCUS_TAG] });
    history.current.undoStack = [];
    history.current.redoStack = [];
    history.current.current = { editor, editorState: editor.getEditorState() };
  }, [editor, value, references]);
  (0, import_react3.useLayoutEffect)(() => {
    const next = new Set(attachments.map((item) => item.key)), previous = incomingKeys.current;
    incomingKeys.current = next;
    const present = editor.getEditorState().read(() => $referenceLayout().attachmentKeys);
    const added = attachments.filter((item) => !previous.has(item.key) && !present.includes(item.key));
    const removed = present.filter((key) => previous.has(key) && !next.has(key));
    if (!added.length && !removed.length) return;
    editor.update(() => {
      for (const node of $nodesOfType(ReferenceChipNode)) if (node.getSource() === "attachment" && removed.includes(node.getReference())) node.remove();
      if (added.length) $insertAttachments(added, $restoredSelection());
    }, { discrete: true, tag: HISTORY_PUSH_TAG });
  }, [editor, attachments]);
  function copy(event, cut = false) {
    const selected = editor.getEditorState().read(selectionText);
    if (!selected || selected.selection.isCollapsed() || !event.clipboardData) return;
    event.preventDefault();
    event.stopPropagation();
    event.clipboardData.setData("text/plain", selected.text);
    if (cut && !disabled) editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) selection.removeText();
    }, { discrete: true, tag: HISTORY_PUSH_TAG });
  }
  function paste(event) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    if (event.clipboardData.files.length) {
      onFiles(event.clipboardData.files);
      return;
    }
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    const length = editor.getEditorState().read(() => {
      const selected = selectionText();
      return $referenceLayout().text.length - (selected?.text.length || 0) + text.length;
    });
    if (length > maxLength) {
      onLimit?.();
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) selection.insertText(text);
      else $getRoot().selectEnd().insertText(text);
    }, { discrete: true, tag: PASTE_TAG });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "div",
      {
        ref: element,
        className: "dsh-ie-reference-editor",
        contentEditable: !disabled,
        suppressContentEditableWarning: true,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        "aria-disabled": disabled || void 0,
        onKeyDownCapture: onKeyDown,
        onPasteCapture: paste,
        onCopyCapture: (event) => copy(event),
        onCutCapture: (event) => copy(event, true),
        onDragOverCapture: (event) => {
          if (event.dataTransfer.types.includes("Files")) event.preventDefault();
        },
        onDropCapture: (event) => {
          if (event.dataTransfer.files.length) {
            event.preventDefault();
            event.stopPropagation();
            if (!disabled) onFiles(event.dataTransfer.files);
          }
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DecoratorPortals, { editor })
  ] });
});

// src/settings.jsx
var import_react4 = __toESM(require("react"), 1);
var import_jsx_runtime4 = require("react/jsx-runtime");
function useSettings(form, describe) {
  const source = (0, import_react4.useMemo)(() => ({ subscribe: (fn4) => form.subscribe(fn4), read: () => form.getSnapshot() }), [form]);
  const mirror = (0, import_react4.useMemo)(() => ({ subscribe: (fn4) => describe?.subscribe(fn4) ?? (() => {
  }), read: () => describe?.getSnapshot() ?? null }), [describe]);
  const state = (0, import_react4.useSyncExternalStore)(source.subscribe, source.read, source.read);
  const mirrored = (0, import_react4.useSyncExternalStore)(mirror.subscribe, mirror.read, mirror.read);
  const issue = state.status === "ready" ? ["branch", "current"].includes(state.value?.mode) ? null : "settingsInvalid" : state.status === "unavailable" ? "settingsUnavailable" : mirrored?.status === "idle" && mirrored.error ? "settingsReadFailed" : mirrored?.status === "ready" && mirrored.view ? "settingsInvalid" : "settingsLoading";
  return { ...state, issue };
}
function EditSettings({ form, describe }) {
  const state = useSettings(form, describe), [saving, setSaving] = (0, import_react4.useState)(false), [retrying, setRetrying] = (0, import_react4.useState)(false), [status, setStatus] = (0, import_react4.useState)("");
  const t2 = labels(document.documentElement.lang || navigator.language), id = (0, import_react4.useId)();
  (0, import_react4.useEffect)(() => {
    void describe?.ensure().catch(() => {
    });
  }, [describe]);
  async function retry() {
    if (retrying || !describe) return;
    setRetrying(true);
    try {
      await describe.ensure();
    } catch {
    } finally {
      setRetrying(false);
    }
  }
  async function choose(mode) {
    if (saving || !state.writable || state.issue) return;
    setSaving(true);
    setStatus("");
    try {
      setStatus(await form.set("mode", mode) ? t2.settingSaved : t2.settingFailed);
    } catch {
      setStatus(t2.settingFailed);
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsh-ie-settings", "aria-labelledby": `${id}-title`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { id: `${id}-title`, children: t2.settingsTitle }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsh-ie-settings-intro", id: `${id}-intro`, children: t2.settingsIntro }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("fieldset", { disabled: saving || !!state.issue || !state.writable, "aria-describedby": `${id}-intro`, "aria-busy": saving, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("legend", { children: t2.modeLabel }),
      ["branch", "current"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "dsh-ie-mode", "data-selected": state.value?.mode === mode, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "radio", name: `${id}-mode`, value: mode, checked: state.value?.mode === mode, "aria-labelledby": `${id}-${mode}-title`, "aria-describedby": `${id}-${mode}-description`, onChange: () => void choose(mode) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dsh-ie-mode-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dsh-ie-mode-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { id: `${id}-${mode}-title`, children: mode === "branch" ? t2.branchTitle : t2.currentTitle }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dsh-ie-mode-badge", children: mode === "branch" ? t2.branchBadge : t2.currentBadge })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { id: `${id}-${mode}-description`, children: mode === "branch" ? t2.branchDescription : t2.currentDescription })
        ] })
      ] }, mode))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsh-ie-settings-status", role: "status", "aria-atomic": "true", "data-error": status === t2.settingFailed || !!state.issue && state.issue !== "settingsLoading", children: saving ? t2.settingSaving : state.issue ? state.issue === "settingsLoading" ? t2.settingLoading : t2[state.issue] : !state.writable ? t2.settingReadOnly : status || t2.autoSave }),
    describe && (state.issue === "settingsReadFailed" || retrying) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-ie-recover", disabled: retrying, onClick: () => void retry(), children: retrying ? t2.settingLoading : t2.retrySettings }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-ie-settings-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: t2.notesTitle }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("ul", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { children: t2.latestNote }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { children: t2.effects }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("li", { children: t2.historyNote })
      ] })
    ] })
  ] });
}

// src/chat-history.jsx
var import_react5 = __toESM(require("react"), 1);

// src/history.js
var EDIT_PROJECTION = "dsh-inline-edit-history";
var LATEST_PROJECTION = "dsh-inline-edit-latest";
function isHidden(seq, ranges) {
  return Number.isFinite(seq) && ranges.some((r2) => seq >= r2.start && seq <= r2.end);
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
var import_jsx_runtime5 = require("react/jsx-runtime");
var EMPTY = [];
function installHistoryView(ctx) {
  return ctx.slots.inject("conversation.chat.flow", () => {
    let disposeFlow, original;
    function adopt() {
      const entry = ctx.slots.entries("conversation.chat.flow").find((e2) => e2.children?.["conversation.chat.node"]);
      if (!entry || original === entry) return;
      disposeFlow?.();
      original = entry;
      const Original = entry.component;
      function HistoryFlow(props) {
        const session = ctx.sessions.binding(props.sessionId).session;
        const projection = session.projections.faceOf(EDIT_PROJECTION);
        const ranges = (0, import_react5.useSyncExternalStore)(projection.subscribe, projection.getSnapshot) ?? EMPTY;
        const chat = props.useChat((s2) => s2);
        const conversation = ctx.uiConversation.binding(props.sessionId).snapshot;
        const snap = (0, import_react5.useSyncExternalStore)(conversation.subscribe, conversation.getSnapshot);
        const entries = filterEntries(props.entries, chat.nodes, snap.views.grouped("chat"), ranges);
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
          descendants.forEach((f3) => f3());
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
var style_default = ".dsh-ie { display:flex; flex-direction:column; align-items:flex-end; min-width:0; max-width:100%; color:var(--dsw-alias-label-primary,#202124); font:inherit; font-family:var(--dsw-font-family,system-ui,sans-serif); }\r\n.dsh-ie-actions { display:flex; align-items:center; justify-content:flex-end; gap:5px; min-height:30px; margin-top:5px; color:var(--dsw-alias-label-tertiary,#85878c); opacity:0; transition:opacity .12s ease; }\r\n.dsh-ie:hover .dsh-ie-actions,.dsh-ie:focus-within .dsh-ie-actions { opacity:1; }\r\n.dsh-ie-time { font-size:var(--dsh-content-font-size-secondary,13px); line-height:calc(24px + var(--dsh-content-font-delta,0px)); white-space:nowrap; margin-inline-end:8px; font-variant-numeric:tabular-nums; }\r\n.dsh-ie button { font-family:inherit; cursor:pointer; }\r\n.dsh-ie-icon { color:inherit; border:0; background:transparent; display:inline-flex; align-items:center; justify-content:center; border-radius:var(--dsw-radius-sm,8px); width:30px; height:30px; padding:6px; flex:none; }\r\n.dsh-ie-icon:not(:disabled):not([aria-disabled=true]):hover { color:var(--dsw-alias-label-primary,#202124); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-icon:not(:disabled):not([aria-disabled=true]):active { background:var(--dsw-alias-interactive-bg-active,#2631481a); }\r\n.dsh-ie-icon[aria-disabled=true] { opacity:.45; cursor:not-allowed; }\r\n.dsh-ie button:focus-visible,.dsh-ie-info:focus-visible,.dsh-ie-time:focus-visible { outline:2px solid var(--dsw-focus-ring-color,#4c6fff); outline-offset:3px; }\r\n.dsh-ie-editor { box-sizing:border-box; width:100%; padding:14px 16px; border-radius:var(--dsw-radius-xl,24px); background:var(--dsw-alias-interactive-bg-hover-solid,#f3f3f4); }\r\n.dsh-ie-editor textarea,.dsh-ie-reference-editor { box-sizing:border-box; display:block; width:100%; min-height:62px; max-height:360px; resize:none; overflow:auto; padding:0; border:0; outline:0; background:transparent; color:inherit; font:inherit; font-size:var(--dsh-content-font-size,15px); line-height:1.7; white-space:pre-wrap; overflow-wrap:anywhere; }\r\n.dsh-ie-editor textarea:focus-visible,.dsh-ie-reference-editor:focus-visible { outline:none; }\r\n.dsh-ie-reference-editor p { margin:0; }\r\n.dsh-ie-reference-editor[aria-disabled=true] { opacity:.5; }\r\n.dsh-ie-reference-token { display:inline-block; max-width:min(360px,100%); padding:0 4px; border-radius:var(--dsw-radius-sm,8px); color:var(--dsw-alias-state-business-primary,#4d6bfe); user-select:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:bottom; }\r\n.dsh-ie-editor:focus-within { box-shadow:0 0 0 1px var(--dsw-alias-border-l2,transparent); }\r\n.dsh-ie-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:4px; }\r\n.dsh-ie-tools,.dsh-ie-buttons { display:flex; align-items:center; gap:8px; }\r\n.dsh-ie-tools { color:var(--dsw-alias-label-tertiary,#777980); }\r\n.dsh-ie-info { display:inline-flex; align-items:center; justify-content:center; width:24px; height:30px; padding:0; border:0; background:transparent; color:inherit; border-radius:var(--dsw-radius-sm,8px); cursor:help; }\r\n.dsh-ie-info:hover { color:var(--dsw-alias-label-primary,#202124); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-buttons { margin-inline-start:auto; }\r\n.dsh-ie-cancel,.dsh-ie-save { box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; border-radius:var(--dsw-radius-md,10px); padding:0 14px; min-height:36px; font-size:14px; line-height:22px; font-weight:400; border:0; transition:background-color .12s ease; }\r\n.dsh-ie-cancel { background:transparent; color:var(--dsw-alias-label-primary,#222); }\r\n.dsh-ie-save { background:var(--dsw-alias-button-primary-fill,#191b1d); color:var(--dsw-alias-label-primary-foreground,#fff); }\r\n.dsh-ie-cancel:not(:disabled):hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-cancel:not(:disabled):active { background:var(--dsw-alias-interactive-bg-active,#2631481a); }\r\n.dsh-ie-save:not(:disabled):hover { background:var(--dsw-alias-button-primary-hover,#35373b); }\r\n.dsh-ie button:disabled { opacity:.4; cursor:not-allowed; }\r\n.dsh-ie-error { font-size:12px; line-height:1.6; margin-top:8px; max-width:100%; overflow-wrap:anywhere; color:var(--dsw-alias-state-error-primary,#ad4036); }\r\n.dsh-ie-notice { font-size:12px; line-height:1.6; margin-top:8px; max-width:100%; overflow-wrap:anywhere; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-recover { border:0; border-radius:var(--dsw-radius-sm,8px); background:transparent; color:var(--dsw-alias-state-business-primary,#4166c5); text-decoration:none; padding:6px 8px; font-size:13px; line-height:20px; max-width:100%; overflow-wrap:anywhere; text-align:start; }\r\n.dsh-ie-recover:hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-picker { display:none; }\r\n.dsh-ie-files { display:flex; flex-wrap:wrap; gap:8px; padding:0; margin:0 0 12px; list-style:none; }\r\n.dsh-ie-file { display:flex; align-items:center; gap:8px; min-width:0; max-width:100%; width:218px; box-sizing:border-box; border:.5px solid var(--dsw-alias-border-l2,#dedee1); background:var(--dsw-specific-input-major,#fff); border-radius:var(--dsw-radius-lg,12px); padding:8px; }\r\n.dsh-ie-file.dsh-ie-file-reference { align-self:flex-start; width:auto; gap:2px; padding:0; border:0; border-radius:0; background:transparent; min-height:30px; }\r\n.dsh-ie-reference-label { display:block; min-width:0; max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--dsh-content-font-size,15px); line-height:1.7; color:var(--dsw-alias-state-business-primary,#4d6bfe); }\r\n.dsh-ie-reference-label:focus-visible { outline:2px solid var(--dsw-focus-ring-color,#4c6fff); outline-offset:2px; border-radius:3px; }\r\n.dsh-ie-file img,.dsh-ie-file-icon { width:32px; height:36px; object-fit:cover; border-radius:4px; display:grid; place-items:center; flex:none; }\r\n.dsh-ie .dsh-ie-image-preview { display:grid; place-items:center; flex:none; width:32px; height:36px; padding:0; border:0; border-radius:4px; background:transparent; cursor:zoom-in; }\r\n.dsh-ie-file-icon { color:var(--dsw-static-neutral-bluish-300,#a4aebb); }\r\n.dsh-ie-file-label { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; font-size:13px; }\r\n.dsh-ie-file-label>span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\r\n.dsh-ie-file-label small { color:var(--dsw-alias-label-tertiary,#85878c); font-size:11px; }\r\n@media(hover:none),(pointer:coarse) { .dsh-ie-actions{opacity:1}.dsh-ie-icon{width:36px;height:36px} }\r\n@media(max-width:520px) { .dsh-ie-editor{padding:12px}.dsh-ie-file{width:100%}.dsh-ie-footer{gap:8px;flex-wrap:wrap}.dsh-ie-buttons{gap:6px} }\r\n@media(prefers-reduced-motion:reduce) { .dsh-ie-actions,.dsh-ie-cancel,.dsh-ie-save{transition:none} }\r\n\r\n\r\n/* Match native settings-form field typography and separators; never restyle the host dialog. */\r\n.dsh-ie-settings { width:100%; min-width:0; padding:0; box-sizing:border-box; color:var(--dsw-alias-label-primary,#202124); font:inherit; overflow-wrap:anywhere; }\r\n.dsh-ie-settings h2 { margin:0 0 8px; font-size:16px; font-weight:600; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-settings-intro { margin:0 0 20px; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings fieldset { min-width:0; margin:0; padding:0; border:0; }\r\n.dsh-ie-settings legend { padding:0; margin:0; font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-mode { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; margin-top:10px; border:1px solid var(--dsw-alias-border-l2,#e5e5e7); border-radius:var(--dsw-radius-md,10px); background:var(--dsw-alias-bg-base,#fff); cursor:pointer; }\r\n.dsh-ie-settings fieldset:not(:disabled) .dsh-ie-mode:hover { background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-settings .dsh-ie-mode[data-selected=true] { border-color:var(--dsw-alias-state-business-primary,#4d6bfe); background:var(--dsw-alias-interactive-bg-hover,#2631480f); }\r\n.dsh-ie-settings .dsh-ie-mode:focus-within { outline:2px solid var(--dsw-focus-ring-color,#4d6bfe); outline-offset:2px; }\r\n.dsh-ie-settings .dsh-ie-mode input { flex:0 0 auto; width:16px; height:16px; margin:2px 0 0; accent-color:var(--dsw-alias-brand-primary,#4d6bfe); cursor:inherit; }\r\n.dsh-ie-settings .dsh-ie-mode input:focus-visible { outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4d6bfe)); outline-offset:2px; }\r\n.dsh-ie-settings .dsh-ie-mode-body { flex:1; min-width:0; }\r\n.dsh-ie-settings .dsh-ie-mode-title { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px 8px; margin-bottom:6px; }\r\n.dsh-ie-settings .dsh-ie-mode-title strong { font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-mode-badge { font-size:12px; line-height:1.5; color:var(--dsw-alias-label-tertiary,#85878c); }\r\n.dsh-ie-settings .dsh-ie-mode small { display:block; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings fieldset:disabled .dsh-ie-mode { opacity:.5; cursor:default; }\r\n.dsh-ie-settings .dsh-ie-settings-status { min-height:18px; margin:10px 0 0; font-size:12px; line-height:1.5; color:var(--dsw-alias-label-tertiary,#85878c); }\r\n.dsh-ie-settings .dsh-ie-settings-status[data-error=true] { color:var(--dsw-alias-label-error,var(--dsw-alias-state-error-primary,#ad4036)); }\r\n.dsh-ie-settings .dsh-ie-settings-note { margin-top:16px; padding-top:12px; border-top:.5px solid var(--dsw-alias-border-l2,#e5e5e7); }\r\n.dsh-ie-settings .dsh-ie-settings-note h3 { margin:0 0 8px; font-size:13px; font-weight:500; line-height:1.5; }\r\n.dsh-ie-settings .dsh-ie-settings-note ul { padding-inline-start:17px; margin:0; font-size:12px; line-height:1.6; color:var(--dsw-alias-label-secondary,#696b71); }\r\n.dsh-ie-settings .dsh-ie-settings-note li + li { margin-top:6px; }\r\n\r\n";

// src/vendor/dsh-icons.js
var import_jsx_runtime6 = require("react/jsx-runtime");
var IconCheckOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime6.jsx)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: (0, import_jsx_runtime6.jsx)("path", {
    d: "M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4",
    stroke: "currentColor"
  })
});
var IconCloseOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime6.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime6.jsx)("path", {
    d: "M2.5 2.5L13.5 13.5",
    stroke: "currentColor"
  }), (0, import_jsx_runtime6.jsx)("path", {
    d: "M13.5 2.5L2.5 13.5",
    stroke: "currentColor"
  })]
});
var IconCopyOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime6.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime6.jsx)("rect", {
    x: "1.52075",
    y: "4.07373",
    width: "10.3932",
    height: "10.3932",
    rx: "2",
    stroke: "currentColor"
  }), (0, import_jsx_runtime6.jsx)("path", {
    d: "M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z",
    fill: "currentColor"
  })]
});
var IconEditOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime6.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [(0, import_jsx_runtime6.jsx)("path", {
    d: "M8.85596 2.69971H4.19971C3.37141 2.69971 2.69992 3.37146 2.69971 4.19971V11.8003C2.69992 12.6285 3.37141 13.3003 4.19971 13.3003H11.8003C12.6283 13.2999 13.3001 12.6283 13.3003 11.8003V7.89893H14.3003V11.8003C14.3001 13.1806 13.1806 14.2999 11.8003 14.3003H4.19971C2.81913 14.3003 1.69992 13.1808 1.69971 11.8003V4.19971C1.69992 2.81918 2.81913 1.69971 4.19971 1.69971H8.85596V2.69971Z",
    fill: "currentColor"
  }), (0, import_jsx_runtime6.jsx)("path", {
    d: "M7.7849 8.23878L13.888 2.13574",
    stroke: "currentColor"
  })]
});
var IconPaperclipOutlineArtwork = ({ size = 16, className, strokeWidth }) => (0, import_jsx_runtime6.jsx)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: (0, import_jsx_runtime6.jsx)("path", {
    d: "M12.75 4.5V9.5C12.75 10.7598 12.2496 11.968 11.3588 12.8588C10.468 13.7496 9.25978 14.25 8 14.25C6.74022 14.25 5.53204 13.7496 4.64124 12.8588C3.75045 11.968 3.25 10.7598 3.25 9.5V5C3.25 4.13805 3.59241 3.3114 4.2019 2.7019C4.8114 2.09241 5.63805 1.75 6.5 1.75C7.36195 1.75 8.1886 2.09241 8.7981 2.7019C9.40759 3.3114 9.75 4.13805 9.75 5V9.5C9.75 9.96413 9.56563 10.4092 9.23744 10.7374C8.90925 11.0656 8.46413 11.25 8 11.25C7.53587 11.25 7.09075 11.0656 6.76256 10.7374C6.43437 10.4092 6.25 9.96413 6.25 9.5V5.5",
    stroke: "currentColor"
  })
});
var IconInfoOutlineArtwork = ({ size = 14, className, strokeWidth }) => (0, import_jsx_runtime6.jsxs)("svg", {
  width: size,
  height: size,
  className,
  viewBox: "0 0 14 14",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": "true",
  strokeWidth,
  children: [
    (0, import_jsx_runtime6.jsx)("path", {
      d: "M12.5757 7.00012C12.5757 3.92085 10.0794 1.42463 7.00012 1.42456C3.9208 1.42456 1.42456 3.9208 1.42456 7.00012C1.42463 10.0794 3.92085 12.5757 7.00012 12.5757C10.0793 12.5756 12.5756 10.0793 12.5757 7.00012ZM13.8002 7.00012C13.8001 10.7559 10.7559 13.8001 7.00012 13.8002C3.2443 13.8002 0.199291 10.7559 0.199219 7.00012C0.199219 3.24426 3.24426 0.199219 7.00012 0.199219C10.7559 0.199291 13.8002 3.2443 13.8002 7.00012Z",
      fill: "currentColor"
    }),
    (0, import_jsx_runtime6.jsx)("path", {
      d: "M7.6127 3.18921V4.55986H6.38735V3.18921H7.6127Z",
      fill: "currentColor"
    }),
    (0, import_jsx_runtime6.jsx)("path", {
      d: "M7.6127 5.68921V10.8109H6.38735V5.68921H7.6127Z",
      fill: "currentColor"
    })
  ]
});
var FILE_BODY = "M8.48924 28H19.5108C21.6479 28 22.7165 28 23.5594 27.6509C24.6833 27.1853 25.5762 26.2924 26.0417 25.1685C26.3909 24.3256 26.3909 23.257 26.3909 21.1199V8.79443C26.3909 8.32877 26.3909 8.09593 26.3471 7.87507C26.2887 7.58058 26.173 7.30042 26.0067 7.05048C25.882 6.86303 25.7177 6.69799 25.3893 6.36792L20.0611 1.01354C19.7304 0.681235 19.5651 0.515081 19.3769 0.38885C19.126 0.220541 18.8443 0.103463 18.5481 0.0443412C18.3259 0 18.0915 0 17.6226 0H8.48924C6.35209 0 5.28351 0 4.4406 0.349145C3.31672 0.814671 2.4238 1.70759 1.95828 2.83147C1.60913 3.67438 1.60913 4.74296 1.60913 6.88011V21.1199C1.60913 23.257 1.60913 24.3256 1.95828 25.1685C2.4238 26.2924 3.31672 27.1853 4.4406 27.6509C5.28351 28 6.35209 28 8.48924 28Z";
var FILE_FOLD = "M26.3909 7.37445L19.0525 0V3.77445C19.0525 4.89271 19.0525 5.45184 19.2352 5.89289C19.4788 6.48096 19.946 6.94818 20.5341 7.19176C20.9751 7.37445 21.5342 7.37445 22.6525 7.37445H26.3909Z";
function FileGlyph({ size, className, children, markTransform, muted = false }) {
  return (0, import_jsx_runtime6.jsxs)("svg", {
    width: size,
    height: size,
    className,
    viewBox: "0 0 28 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    children: [
      (0, import_jsx_runtime6.jsx)("path", {
        d: FILE_BODY,
        fill: "currentColor"
      }),
      muted ? (0, import_jsx_runtime6.jsx)("path", {
        d: FILE_FOLD,
        fill: "var(--dsw-static-neutral-400)"
      }) : (0, import_jsx_runtime6.jsx)("path", {
        d: FILE_FOLD,
        fill: "var(--dsw-static-neutral-00)",
        fillOpacity: ".7"
      }),
      children !== void 0 && (0, import_jsx_runtime6.jsx)("g", {
        color: "var(--dsw-static-neutral-00)",
        "data-file-type-mark": true,
        transform: markTransform,
        children
      })
    ]
  });
}

// src/client.jsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var name = "dsh-inline-edit";
var inject = ["slots", "sessions", "uiWorkspace", "fileUpload", "configForms", "uiConversation"];
var icons = { check: IconCheckOutlineArtwork, close: IconCloseOutlineArtwork, copy: IconCopyOutlineArtwork, edit: IconEditOutlineArtwork, attach: IconPaperclipOutlineArtwork, info: IconInfoOutlineArtwork };
function Icon({ kind }) {
  const Artwork = icons[kind];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Artwork, { size: 16, strokeWidth: 1 });
}
function Attachment({ item, loadImage, onRemove, disabled, t: t2 }) {
  const [preview, setPreview] = (0, import_react6.useState)(null);
  const [expandedPreview, setExpandedPreview] = (0, import_react6.useState)(null);
  const closePreview = (0, import_react6.useCallback)(() => setExpandedPreview(null), []);
  (0, import_react6.useEffect)(() => {
    let active = true, ownedUrl;
    setPreview(null);
    async function load() {
      if (item.type !== "image") return;
      try {
        const url2 = item.origin === "new" ? ownedUrl = URL.createObjectURL(item.file) : await loadImage?.(item.ref);
        if (active && typeof url2 === "string" && url2) setPreview({ item, loadImage, url: url2 });
      } catch {
      }
    }
    void load();
    return () => {
      active = false;
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [item, loadImage]);
  const url = preview?.item === item && preview.loadImage === loadImage ? preview.url : null;
  const size = item.size < 1024 ? `${item.size} B` : item.size < 1048576 ? `${(item.size / 1024).toFixed(1)} KB` : `${(item.size / 1048576).toFixed(1)} MB`;
  const remove = /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: t2.removeHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, disabled, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": `${t2.remove} ${item.name}`, disabled, onClick: onRemove, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { kind: "close" }) }) });
  if (item.type !== "image") return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { className: "dsh-ie-file dsh-ie-file-reference", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: `${item.name}
${size}`, side: "bottom", portal: true, maxWidth: 360, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-ie-reference-label", tabIndex: 0, "aria-label": item.name, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives3.ReferenceChip, { appearance: "file", label: item.name, title: "" }) }) }),
    remove
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { className: "dsh-ie-file", children: [
    url ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-image-preview", "aria-haspopup": "dialog", "aria-label": `${t2.previewImage}\uFF1A${item.name}`, onClick: () => setExpandedPreview(preview), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("img", { src: url, alt: item.name, onError: () => setPreview((current) => current === preview ? null : current) }) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-ie-file-icon", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FileGlyph, { size: 28, muted: true }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "dsh-ie-file-label", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: item.name, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { tabIndex: 0, children: item.name }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: size })
    ] }),
    remove,
    url && expandedPreview === preview && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_dsh_client_ui_primitives3.ImageLightbox, { src: url, alt: item.name, labels: { dialog: t2.imagePreview, close: t2.closePreview }, onClose: closePreview })
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
function useCalendarDay() {
  const [now, setNow] = (0, import_react6.useState)(Date.now);
  (0, import_react6.useEffect)(() => {
    let timer;
    const schedule = () => {
      const current = Date.now();
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, Math.max(1, nextLocalMidnight(current) - current));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return now;
}
function EditableMessage({ node, sessionId, useSession, renderFactorySlot, loadImage, coordinator, openSession, mode = "branch", latestSeq, supplemental = false, settingsReady = true, settingsIssue, evaluateUserText }) {
  const data = node.data;
  const view = (0, import_react6.useMemo)(() => contentView(data), [data]);
  const hasCopyText = !!view.text.trim();
  const snapshot = useSession((state) => state);
  const language = document.documentElement.lang || navigator.language;
  const calendarDay = useCalendarDay();
  const t2 = labels(language);
  const [editing, setEditing] = (0, import_react6.useState)(false);
  const [referenceEditing, setReferenceEditing] = (0, import_react6.useState)(false);
  const [initialAttachmentOffset, setInitialAttachmentOffset] = (0, import_react6.useState)(null);
  const [draftMode, setDraftMode] = (0, import_react6.useState)(mode);
  const activeMode = editing ? draftMode : mode;
  const modeHint = activeMode === "current" ? t2.currentTitle : t2.branchMode;
  const pending = pendingKey(sessionId, data.seq);
  const [draft, setDraft] = (0, import_react6.useState)(view.text);
  const [attachments, setAttachments] = (0, import_react6.useState)(() => originalAttachments(data));
  const ordinaryFiles = (0, import_react6.useMemo)(() => attachments.filter((item) => item.type === "file"), [attachments]);
  const [saving, setSaving] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const [copied, setCopied] = (0, import_react6.useState)(false);
  const [recoverId, setRecoverId] = (0, import_react6.useState)(null);
  const pendingSource = (0, import_react6.useMemo)(() => ({ subscribe: (listener) => subscribePending(pending, listener), read: () => readPending(pending) ?? null }), [pending]);
  const pendingRequest = (0, import_react6.useSyncExternalStore)(pendingSource.subscribe, pendingSource.read, pendingSource.read);
  const uncertain = !!pendingRequest && !saving;
  const editor = (0, import_react6.useRef)(null), picker = (0, import_react6.useRef)(null), pencil = (0, import_react6.useRef)(null), nextKey = (0, import_react6.useRef)(0), mounted = (0, import_react6.useRef)(true), inFlight = (0, import_react6.useRef)(false), copyTimer = (0, import_react6.useRef)();
  const requestId = (0, import_react6.useRef)(null);
  const section = (0, import_react6.useRef)(null), scrollAnchor = (0, import_react6.useRef)(null);
  const restriction = (uncertain ? "currentUncertain" : null) ?? (!settingsReady ? settingsIssue ?? "settingsLoading" : null) ?? editRestriction(node) ?? sessionRestriction(snapshot) ?? (activeMode === "current" && (supplemental || node.kind === "steering") ? "supplemental" : null) ?? (activeMode === "current" && latestSeq !== data.seq ? latestSeq == null ? "notReady" : "latestOnly" : null);
  const facts = (0, import_react6.useMemo)(() => ({ ...data.referenceLabels ? { sessionLabels: data.referenceLabels } : {}, ...data.skillNames ? { skillNames: data.skillNames } : {} }), [data.referenceLabels, data.skillNames]);
  const references = (0, import_react6.useMemo)(() => referenceEditing ? collectFileReferences(draft, evaluateUserText, facts) : [], [referenceEditing, draft, evaluateUserText, facts]);
  (0, import_react6.useEffect)(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(copyTimer.current);
      scrollAnchor.current?.dispose();
      scrollAnchor.current = null;
    };
  }, []);
  (0, import_react6.useEffect)(() => {
    if (!editing) setDraft(view.text);
  }, [view.text, editing]);
  (0, import_react6.useEffect)(() => {
    if (!pendingRequest) setError((previous) => previous === t2.currentUncertain ? null : previous);
  }, [pendingRequest, t2.currentUncertain]);
  (0, import_react6.useLayoutEffect)(() => {
    if (!editing || !editor.current) return;
    const area = editor.current;
    const resize = () => {
      area.style.height = "auto";
      area.style.height = `${Math.min(360, Math.max(62, area.scrollHeight))}px`;
    };
    resize();
    const frame = referenceEditing ? requestAnimationFrame(() => {
      if (!area.isConnected) return;
      const anchor = captureEditScrollAnchor(section.current);
      resize();
      anchor.restore();
    }) : null;
    let lastWidth = area.clientWidth;
    const observer = new ResizeObserver(() => {
      if (area.clientWidth !== lastWidth) {
        lastWidth = area.clientWidth;
        resize();
      }
    });
    observer.observe(area);
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [editing, draft, referenceEditing]);
  (0, import_react6.useLayoutEffect)(() => {
    scrollAnchor.current?.restore();
    scrollAnchor.current = null;
  });
  (0, import_react6.useEffect)(() => {
    if (editing && editor.current) {
      editor.current.focus({ preventScroll: true });
      if (editor.current.tagName === "TEXTAREA") editor.current.setSelectionRange(editor.current.value.length, editor.current.value.length);
    }
  }, [editing]);
  function anchorLayoutChange() {
    scrollAnchor.current ??= captureEditScrollAnchor(section.current);
  }
  function cancel(restoreFocus = true) {
    if (inFlight.current) return;
    anchorLayoutChange();
    setDraft(view.text);
    setAttachments(originalAttachments(data));
    setError(uncertain ? t2.currentUncertain : null);
    setRecoverId(null);
    setEditing(false);
    if (!uncertain) requestId.current = null;
    if (restoreFocus) requestAnimationFrame(() => pencil.current?.focus({ preventScroll: true }));
  }
  function beginEdit() {
    if (restriction) return;
    anchorLayoutChange();
    setReferenceEditing(originalAttachments(data).some((item) => item.type === "file") || collectFileReferences(view.text, evaluateUserText, facts).length > 0);
    setInitialAttachmentOffset(null);
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
      setError(t2[restriction]);
      return;
    }
    if (!draft.trim() && !attachments.length) {
      setError(t2.empty);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      requestId.current ??= crypto.randomUUID();
      if (activeMode === "current") writePending(pending, requestId.current);
      const result = await coordinator.save({ sessionId, node, text: draft, attachments, mode: activeMode, requestId: requestId.current });
      writePending(pending, null);
      requestId.current = null;
      if (!mounted.current) return;
      if (result.childId) {
        setRecoverId(result.childId);
        await openSession(result.childId);
      }
      if (mounted.current) {
        setEditing(false);
        setError(result.childId ? t2.returned : null);
      }
    } catch (failure) {
      if (failure.code !== "currentUncertain") writePending(pending, null);
      if (mounted.current) {
        if (failure.childId) setRecoverId(failure.childId);
        setError(t2[failure.code] ?? (activeMode === "current" ? t2.currentFailed : t2.failed));
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
      anchorLayoutChange();
      if (!referenceEditing && next.some((item) => item.type === "file")) {
        setInitialAttachmentOffset(editor.current?.selectionStart ?? draft.length);
        setReferenceEditing(true);
      }
      setAttachments(next);
      setError(null);
    } catch (failure) {
      setError(t2[failure.code] ?? t2.failed);
    }
  }
  function changeOrdinaryFiles(files) {
    if (inFlight.current || recoverId || uncertain) return false;
    const next = [...attachments.filter((item) => item.type !== "file"), ...files];
    try {
      validateAttachments(next, data);
      anchorLayoutChange();
      setAttachments(next);
      setError(null);
      return true;
    } catch (failure) {
      setError(t2[failure.code] ?? t2.failed);
      return false;
    }
  }
  function changeDraft(text) {
    anchorLayoutChange();
    setDraft(text);
    setError(null);
  }
  function editorKeyDown(event) {
    if (event.nativeEvent.isComposing || event.isComposing || event.keyCode === 229) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel(true);
    } else if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) void save();
    }
  }
  async function copy() {
    if (!hasCopyText) return;
    try {
      await navigator.clipboard.writeText(view.text);
      if (!mounted.current) return;
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
        if (mounted.current) setCopied(false);
      }, 1600);
    } catch {
      if (mounted.current) setError(t2.copyFailed);
    }
  }
  const clock = formatMessageClock(data.time, language, calendarDay);
  const fullClock = formatMessageTimestamp(data.time, language);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { ref: section, className: "dsh-ie", "data-dsh-inline-edit": "", "data-editing": editing || void 0, "aria-busy": saving, children: [
    editing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
          attachments.some((item) => item.type === "image") && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ul", { className: "dsh-ie-files", "aria-label": t2.attachments, children: attachments.filter((item) => item.type === "image").map(
            (item) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Attachment, { item, loadImage, t: t2, disabled: saving || !!recoverId || uncertain, onRemove: () => {
              anchorLayoutChange();
              setAttachments((previous) => previous.filter((file) => file.key !== item.key));
              setError(null);
            } }, item.key)
          ) }),
          referenceEditing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            ReferenceEditor,
            {
              ref: editor,
              label: t2.label,
              value: draft,
              references,
              attachments: ordinaryFiles,
              onAttachmentsChange: changeOrdinaryFiles,
              initialAttachmentOffset,
              disabled: saving || uncertain,
              maxLength: MAX_TEXT_LENGTH,
              onChange: changeDraft,
              onKeyDown: editorKeyDown,
              onFiles: addFiles,
              onLimit: () => setError(t2.tooLong)
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "textarea",
            {
              ref: editor,
              "aria-label": t2.label,
              value: draft,
              disabled: saving || uncertain,
              maxLength: MAX_TEXT_LENGTH,
              onChange: (event) => changeDraft(event.target.value),
              onPaste: (event) => {
                if (event.clipboardData.files.length) {
                  event.preventDefault();
                  addFiles(event.clipboardData.files);
                }
              },
              onKeyDown: editorKeyDown
            }
          ),
          restriction && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-ie-error", role: "status", children: t2[restriction] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              ref: picker,
              type: "file",
              multiple: true,
              className: "dsh-ie-picker",
              "aria-label": t2.addFiles,
              disabled: saving || !!recoverId || uncertain,
              onChange: (event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-ie-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-ie-tools", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: t2.addHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, disabled: saving || !!recoverId || uncertain, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": t2.addFiles, disabled: saving || !!recoverId || uncertain, onClick: () => picker.current?.click(), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { kind: "attach" }) }) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: modeHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, openOnClick: true, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-info", "aria-label": modeHint, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { kind: "info" }) }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-ie-buttons", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-cancel", disabled: saving, onClick: (event) => cancel(event.detail === 0), children: t2.cancel }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-save", disabled: saving || !!restriction || !!recoverId || uncertain || !draft.trim() && !attachments.length, onClick: () => void save(), children: saving ? t2.saving : t2.save })
            ] })
          ] })
        ]
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      renderFactorySlot("conversation.chat.user.content", { content: view, loadImage, facts, interactive: true }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-ie-actions", children: [
        clock && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: fullClock, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "time",
          {
            className: "dsh-ie-time",
            tabIndex: 0,
            "aria-label": fullClock,
            dateTime: new Date(data.time).toISOString(),
            onClick: (event) => {
              if (event.detail > 0) event.currentTarget.blur();
            },
            children: clock
          }
        ) }),
        hasCopyText && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: copied ? t2.copied : t2.copyHint, side: "bottom", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-icon", "aria-label": copied ? t2.copied : t2.copy, onClick: (event) => {
          void copy();
          if (event.detail > 0) event.currentTarget.blur();
        }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { kind: copied ? "check" : "copy" }) }) }),
        !(activeMode === "current" && (supplemental || node.kind === "steering")) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Tooltip, { label: restriction ? t2[restriction] : t2.editHint, side: "bottom", align: restriction ? "end" : "center", portal: true, maxWidth: 280, delayMs: 220, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            ref: pencil,
            className: "dsh-ie-icon",
            "aria-label": t2.edit,
            "aria-disabled": !!restriction,
            "aria-description": restriction ? t2[restriction] : void 0,
            onClick: beginEdit,
            children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { kind: "edit" })
          }
        ) })
      ] })
    ] }),
    (error || uncertain) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-ie-error", role: "status", children: error || t2.currentUncertain }),
    uncertain && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-recover", onClick: () => {
      if (!window.confirm(t2.confirmChecked)) return;
      writePending(pending, null);
      requestId.current = null;
      setError(null);
      setEditing(false);
    }, children: t2.checkedOutcome }),
    recoverId && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-ie-recover", onClick: () => Promise.resolve(openSession(recoverId)).catch(() => setError(t2.branchFailed)), children: t2.recover })
  ] });
}
function apply(ctx) {
  const coordinator = createEditCoordinator(nativeAdapter(ctx));
  const form = ctx.configForms.get("dsh-inline-edit");
  const describe = ctx.configForms.describe();
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
    const state = useSettings(form, describe);
    const evaluateUserText = (0, import_react6.useMemo)(() => ctx.uiConversation?.userText?.createEvaluator?.(), []);
    const latest = ctx.sessions.binding(props.sessionId).session.projections.faceOf(LATEST_PROJECTION);
    const eligibility = (0, import_react6.useSyncExternalStore)(latest.subscribe, latest.getSnapshot);
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(EditableMessage, { ...props, evaluateUserText, settingsReady: !state.issue, settingsIssue: state.issue, latestSeq: eligibility?.latestSeq, supplemental: eligibility?.excluded.includes(props.node.data.seq), mode: state.value?.mode === "current" ? "current" : "branch", coordinator, openSession: (id) => ctx.uiWorkspace.openSession(id) }, `${props.sessionId}:${props.node.data.seq}`);
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
  }, () => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(EditSettings, { form, describe })));
  installNativeNodeBridge(ctx);
  installHistoryView(ctx);
}
return module.exports; } });
