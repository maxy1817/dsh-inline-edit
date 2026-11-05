# Third-party notices

## DeepSeek Harness UI SVG artwork

The icon functions in src/vendor/dsh-icons.js are copied from @deepseek-ai/dsh-client-ui-primitives 0.2.1-rc.3, https://github.com/deepseek-ai/deepseek-harness. Only the required SVG artwork is included; it uses the host React runtime. Original plugin branding is separate.

The Tooltip component and stylesheet in src/vendor/dsh-tooltip.js and src/vendor/dsh-tooltip.css are adapted from the same MIT release. Native interaction behavior is retained; placement stays anchored to the control, avoids interactive controls, and follows scrolling. CSS names are scoped to this plugin. scripts/sync-tooltip.mjs reproduces the adaptation from the pinned upstream package. Host files are never changed.

MIT License

The reference node and single-newline text projection in src/vendor/dsh-reference-node.jsx, and the decorator portal bridge in src/reference-editor.jsx, are adapted from @deepseek-ai/dsh-client-ui-conversation 0.2.1-rc.3 (DeepSeek Harness). They use an independent editor instance and the public host ReferenceChip for presentation.

The client bundle also includes Lexical 0.49.0 and its plain-text/history support packages, https://github.com/facebook/lexical, under the same MIT terms below.

Copyright (c) Meta Platforms, Inc. and affiliates.

Copyright (c) 2026 DeepSeek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
