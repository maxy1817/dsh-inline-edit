# Changelog

## 0.3.0

- Place retained and newly added ordinary files in the same Lexical text flow as native blue atomic labels, without an added delete X. Keep images in their preview row.
- Preserve the caret across file picking and continue typing immediately after inserted files, without adding spaces. Support text before, between and after file labels.
- Delete whole attachment tokens with Backspace, Delete or Cut, and restore the original attachment reference or File with Undo. Keep attachment payloads separate from the exact body text.
- Extend the declared DSH compatibility range to `>=0.2.1-rc.3 <0.2.3-0`. Desktop testing was confirmed before release; automated Web/Host checks remain pinned to rc.5.
- Pass 334 automated regressions covering the real editor's selection, clipboard, history, keyboard and composition events. Verify the official DSH 0.2.1-rc.5 Web/Host with an isolated offline provider, including recovery after a real Host restart, and browser file removal, Undo, multi-file insertion, continued typing and branch submission. See docs/VALIDATION.md for the exact scope.

## 0.2.14

- Display retained and newly added ordinary files as compact native blue reference labels, retaining their attachment objects and separate remove actions.
- Keep file mentions recognized by DSH as blue atomic labels when opening the message editor. Preserve the exact underlying text, file paths, quotes and line breaks for submission and clipboard operations.
- Use an isolated Lexical editor and an adapted native reference node for messages containing file mentions; retain the plain textarea for other messages. Keep image preview and upward expansion behavior.
- Update source, prebuilt output and documentation. Final regression and browser verification were not run at the user's request.

## 0.2.13

- Open retained and newly added image thumbnails in DSH's native ImageLightbox, preserving its backdrop, Escape, focus trapping and close behavior without discarding the edit draft.
- Anchor the message's bottom edge while opening, resizing or cancelling the editor and changing attachments, so available conversation scrolling makes the editor expand upward. Respect nested scroll boundaries and user scroll input.

## 0.2.12

- Send edited messages with Enter in both modes; use Shift+Enter for a newline and retain Ctrl/Cmd+Enter as send shortcuts.
- Preserve IME confirmation, empty-input and submission guards. Ignore held-key repeats so an unsuccessful send is not automatically repeated.

## 0.2.11

- Observe the native settings describe mirror alongside the cached form, distinguishing failed reads, unavailable services and invalid mode values from session readiness.
- Retry a failed initial settings read when reopening Settings, with an explicit Retry action after failure. Pending retries are deduplicated and failures do not start a polling loop.
- Require an explicitly accepted branch/current value before enabling editing, preserving the saved mode and existing busy-session guards.

## 0.2.10

- Hide Copy when a message has no non-whitespace text, keeping its clock, edit eligibility and regeneration behavior. Preserve all text whitespace when copying messages that also contain attachments.
- Show thumbnails for retained images through the host's image loader and for newly added images through local object URLs. Keep filenames and removal available when previews fail.
- Ignore late preview results after removal, cancellation or source changes. Release only object URLs created by the editor, preserving the host's cached image URLs.

## 0.2.9

- Shorten Copy, Edit, Attach files and latest-message restriction hints in Chinese and English, preserving full accessible action labels and submission warnings.
- Release focus on pointer copy without moving keyboard focus or stealing focus when clipboard promises settle. Keep success and failure feedback.
- Show the full local date and time, including year and seconds, on clock hover or keyboard focus. Keep the compact clock and its midnight refresh; pointer activation of the clock does not hold the toolbar open.

## 0.2.8

- Center short hints 8px below their own button, matching native DSH placement. Keep long edit restrictions aligned with the button's right edge; clamp near viewport edges before flipping, and remove the distant left-of-row and diagonal placements.
- Match the native local message clock: time today, month/day on other dates, and year across years. Refresh at local midnight and keep invalid timestamps from breaking message actions.
- Scope control avoidance to the current message so unrelated turn controls do not displace hints. Retain native tooltip interaction, scrolling updates and previous resend/cancel fixes.

## 0.2.7

- Allow unchanged text-only messages and text with attachments to regenerate in both modes using Send or Ctrl/Cmd + Enter. Remove the client and Host content-change requirement while retaining empty-input and submission checks.
- Give each confirmed regeneration a fresh request ID so another explicit send is not mistaken for an earlier request when the message component is reused.
- Stop pointer cancellation from refocusing Edit and leaving the message action bar visible after the pointer moves away. Keyboard cancellation and Escape still restore focus.
- Cover unchanged text and attachments through UI, coordinator, Host context replacement and strict disk recovery. This is a local patch build, not a remote publication.

## 0.2.6

- Allow unchanged attachment-only messages to be explicitly resent from the editor in both branch and current-conversation modes, including after a failed model run. No dummy text or attachment replacement is required.
- Keep unchanged text-bearing messages blocked and retain busy-session, duplicate-request, uncertain-outcome, attachment authorization and size/model checks.
- Add UI, coordinator and direct Host regressions. This is a local patch build, not a remote publication.

## 0.2.5

- Place message edit/copy hints to the left, clearing timestamps and neighboring controls on the same row before using fallback positions.
- Keep the information hint 6px below and to the right of its icon.
- Add two placement regressions; 126 automated tests pass.
- Synchronize installation, publishing and validation documentation with 0.2.5. Keep both public READMEs text-only, without screenshot embeds or preview links.
- Pin src/style.css checkout line endings in .gitattributes so Git normalization does not change the CSS string embedded in the existing bundle. This release-preparation step does not alter source or compiled JavaScript.

## 0.2.4

- Prefer top/end placement for message edit/copy tooltips to avoid the turn toolbar below. Fall back when the viewport leaves no space above.
- Preserve existing edit eligibility and hidden-button rules. Add two placement regression tests (124 tests total).

## 0.2.3

- Show bordered mode choices with theme-aware selection; scope layout to the plugin.
- Remove duplicate inline notices after unavailable edit clicks; retain hover/focus explanations and submission errors.
- Unify action tooltips and portal typography. Crowded placements remain visible at the least-obstructed corner; measure immediately instead of waiting for ResizeObserver.
- Align documentation, screenshot formats and source/build version checks.

## 0.2.2

- Adapt DSH's published MIT Tooltip for the mode indicator and unavailable edit action. Show only the mode name; keep detailed rules in Settings. Prefer the lower-right corner, avoid controls, track scroll, and retain native styling and interactions.
- Drop superseded recovery payloads from the active message surface on repeated edits, including accumulated revision chains from earlier releases.
- Fork edited replacements from their original boundary, excluding obsolete recovery metadata and queued admissions.
- Do not replay an interrupted edit on resume or retry after newer user input has arrived.
- Add context regression coverage for cache invalidation, later followups, tools, supplements, removed attachments, repeated revisions, forks and strict disk replay. Test the actual native Tooltip component.

## 0.2.1

### Editor hints

- Name the active draft's regeneration mode in the information-icon and Send tooltips, following the mode pinned when editing begins.
- Dismiss edit-eligibility notices after 3.5 seconds and immediately when eligibility changes; keep the reason on the edit button's tooltip.
- Keep submission failures and uncertain outcomes visible for recovery.

### Security hardening

- Enforce host image batch limits across retained and new images; validate the proposal before storage and admit new images as one batch.
- Reject associated skill/session references on the Host, using durable context events.
- Pin regeneration mode when opening a draft; settings changes apply to subsequent drafts.
- Persist uncertain current-edit request identifiers in tab session storage (memory fallback); cancel/remount does not unlock them. Explicit outcome confirmation is required to unlock.
- Render unsupported attachment structures without crashing the editor initialization.
- Storage/normalization failures can still leave unreachable attachment objects; no unsafe file deletion is attempted.

## 0.2.0

- Native Settings → Message editing, with persistent branch/current-conversation modes.
- Current mode retains the Session ID and regenerates from the latest idle-submitted main message.
- Generation-time steering and queued supplemental messages remain ineligible after replay/restart; both UI and Host enforce this.
- Text-only and attachment-only current edits use native upload receipts and trusted original references.
- Durable, producer-owned surface replacement with idempotent requests, idle maintenance locking and recovery.
- Public slot bridge preserves native message rendering while filtering superseded chat content.
- Settings explain scope, later-content replacement, audit history and tool effects; light/dark/narrow layouts verified.
- Released V4 disk-codec regression tests plus real DSH stop/start validation.

## 0.1.0

- Native inline user/steering editing with Cancel and Send.
- Independent text/attachment changes; file picking, dropping and pasting.
- Preserved source conversations and authenticated, immutable file reuse.
- Clean first-message fork boundary; no extra empty turn preambles.
- DSH theme tokens, IME, keyboard, duplicate-send prevention and recovery.
- Native DSH SVG artwork with attribution; light/dark themes and narrow-window validation.
- Compatibility target: DSH 0.2.1-rc.3.
