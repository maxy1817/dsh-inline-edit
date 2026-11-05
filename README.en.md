# dsh-inline-edit

The editor's information icon retains DSH's native Tooltip styling and interactions and shows only “Regenerate in this conversation” or “Regenerate in a new branch.” Short hints for attachments, mode and message actions sit centered 8px below their own button. Hover and focus are supported; clicking the mode hint pins it. The mode is fixed when the editor opens; details remain in Settings.

Long edit restrictions align with the button's right edge below it, rather than moving past the timestamp and the whole action row. Hints shift within viewport margins and flip sides when space or controls within the message require it. Crowded layouts keep hints visible with minimal overlap. The clock shows time today, month/day on other dates, and the year across years, updating at local midnight. Clicking an unavailable edit action adds no inline notice; submission failures and uncertain outcomes remain visible.

Action hints use the concise “Copy,” “Edit” and “Attach files,” while accessible control labels retain their full wording. The latest-message restriction is shorter. Hovering or keyboard-focusing the clock reveals the full local date, year and time including seconds. Pointer copying releases button focus so the action row can hide when the pointer leaves; keyboard copying keeps focus. Clipboard errors remain visible.

Current version: **0.3.0**. All 334 automated regressions, isolated official Web/Host checks with an offline provider, recovery after a real Host restart, and browser file-editing acceptance have passed. Native desktop acceptance is left to the user; see [Validation](docs/VALIDATION.md) for the exact scope.

Native inline message editing for DeepSeek Harness. Change text, attachments, or both, with Cancel and Send buttons, native icons and theme tokens.

## Modes

Choose **Settings → Message editing**. Settings persist in the active DSH profile.

Failed settings reads show an explicit Retry action; reopening Settings also attempts recovery. Unavailable services and invalid settings have distinct messages instead of being reported as an unfinished session. Editing stays blocked until a valid mode is received.

- **Create a branch** (default): preserve the source conversation and continue in a new chat.
- **Regenerate in this conversation**: edit only the **latest main message submitted while idle to start a task**. Retain the Session ID and sidebar chat. Later supplemental input and answers are replaced.

Steering and queued input submitted during generation are excluded, even when later processed as a separate turn. The UI hides their edit button and the Host rejects edits. Earlier main messages require branch mode. Wait for generation and the pending queue to finish. DSH's built-in pending-queue editor is unchanged.

## Installation

Version 0.3.0 was tested with **DSH 0.2.1-rc.5 official Web/Host on Windows**, using the desktop installation's CLI, an isolated configuration and an offline provider, including session recovery after a real Host restart. The rc.3 Web/Host checks are historical baselines. Electron-specific transport, real model providers, a physical Chinese IME, other releases and reverse proxies remain unverified.

~~~sh
dsh plugin --profile desktop add ./dsh-inline-edit-0.3.0.tgz
~~~

Use web instead of desktop for a Web profile. If dsh is not on PATH, use the full path to resources/runtime/cli/bin/dsh.cmd inside the desktop installation. Restart DSH. This package has **not been published** to npm or a marketplace.

~~~sh
dsh plugin --profile desktop remove dsh-inline-edit
~~~

## Behavior

Text-only messages, text with attachments, and attachment-only messages can be resent unchanged in either mode using Send or Enter, after either a failed or successful model run. Shift+Enter inserts a newline; Ctrl/Cmd + Enter still sends, and Esc cancels. IME confirmation and repeated keydown events do not submit. No text changes or attachment replacement are needed. Empty messages, busy sessions and uncertain submissions remain blocked.

Text-only edits retain attachments. Attachment-only edits can add, remove or replace files. Picking, dropping, pasting, IME, shortcuts and duplicate-send protection are supported. Removing attachments does not delete disk originals. Cancel restores the draft; errors preserve changes.

Retained and newly selected ordinary files appear as native blue atomic labels in the same text flow, without an added delete X. Type before, between or after files. Picking files preserves the previous caret position and leaves the caret immediately after the new labels, ready for more text without adding spaces. Backspace, Delete or cutting a selection removes a whole file token; Undo restores the real attachment. Submission retains the original attachment reference or new file contents, and display names do not become body text.

File mentions recognized by DSH also retain blue labels inside the editor; their original paths, quotes and surrounding text remain the submission and clipboard representation. Missing native recognition falls back to plain text.

Messages with no non-whitespace text hide the Copy action. Messages with text copy the full text, preserving spaces and line breaks even when attachments are present. Clicking a retained or newly added image thumbnail opens DSH's native image preview. Escape, the backdrop and Close return to editing with the draft and attachments intact; preview failures leave the filename and Remove action available.

Opening the editor, growing text and changing attachments expand upward by compensating conversation scrolling; cancellation keeps the following answer in place as well. Compensation respects available scroll space and manual scrolling, without overlapping earlier messages.

Current mode uses a logged surface replacement, not rewriting or deleting session files. Old content remains auditable in Trace; usage counters and native turn navigation retain historical turns. Navigation can include superseded content. Disabling the plugin can show old audit content again without restoring the old model context. A short edit-context notice accompanies the replacement.

Regeneration does not undo file changes, commands or external actions.

Repeated edits remove superseded recovery payloads from the active message surface as well. Branching from an edited replacement uses its original boundary. An interrupted edit is not automatically replayed after newer user input. Earlier valid conversation remains; tools can still read historical content from files, Trace or external memory.

Limits: 32 attachments, 64 MiB each, 128 MiB total, 20 MiB images, 200,000 characters. Skills/session references, busy/queued sessions and subagents are refused. Compacted messages require branches. Drafts are memory-only. Other chat-slot replacements may conflict.

## Development

From the source repository (not an unpacked distribution tarball), with Node.js 24.9+:

~~~sh
npm ci
npm run check
npm pack
~~~

Commit prebuilt lib/ and .gitattributes. The latter preserves CRLF in src/style.css so its embedded text-loader output matches the existing bundle on different platforms. DSH provides Host packages and React. No install hooks, private React access, session-file rewriting, telemetry or external model requests are added.

[中文](README.md) · [Validation](docs/VALIDATION.md) · [Architecture](docs/ARCHITECTURE.md) · [Publishing](docs/PUBLISHING.md). MIT; independent of DeepSeek and OpenAI.
