# Changelog

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
