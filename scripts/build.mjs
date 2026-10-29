import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('lib', { recursive: true });
for (const file of ['index.js','current.js','history.js']) await copyFile('src/'+file, 'lib/'+file);
await build({
  entryPoints: ['src/client.jsx'], outfile: 'lib/client.js', bundle: true,
  format: 'cjs', platform: 'browser', target: ['es2022'], jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'], loader: { '.css': 'text' },
  banner: { js: 'window.__ModuleLoader__.load({ id: "dsh-inline-edit", factory: (require) => { const module = { exports: {} }; const exports = module.exports;' },
  footer: { js: 'return module.exports; } });' },
  legalComments: 'eof', logLevel: 'info',
});
