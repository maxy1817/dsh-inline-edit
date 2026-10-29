import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8'));
assert.equal(pkg.name,'dsh-inline-edit');
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
assert.equal(lock.version,pkg.version,'lockfile version mismatch');
assert.equal(lock.packages[''].version,pkg.version,'lockfile root version mismatch');
for (const name of ['index.js','current.js','history.js']) {
  assert.equal(await readFile('src/'+name,'utf8'),await readFile('lib/'+name,'utf8'),'stale host build: '+name);
}
assert.equal(pkg.dsh.bundle.patch,'./cordis.patch.yml');
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-file-upload'));
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings'));
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-primitives'));
for(const p of ['lib/current.js','lib/history.js','docs/ARCHITECTURE.md','assets/settings-light.png','assets/settings-dark.png','assets/settings-narrow.png'])assert.ok((await stat(p)).size>0,p);
for(const p of ['lib/index.js','lib/client.js','cordis.patch.yml','README.md','README.en.md','LICENSE','assets/icon.svg','assets/icon-180.png','assets/native-light.jpg','assets/native-dark.jpg','assets/native-narrow.jpg','THIRD_PARTY_NOTICES.md','docs/VALIDATION.md','docs/PUBLISHING.md'])assert.ok((await stat(p)).size>0,p);
for(const key of ['install','postinstall','prepare'])assert.equal(pkg.scripts[key],undefined);
assert.equal(Object.keys(pkg.dependencies||{}).length,0);
for (const name of ['settings-light','settings-dark','settings-narrow','tooltip-current','tooltip-dark','tooltip-narrow']) {
  const image=await readFile('assets/'+name+'.png');
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a','invalid PNG: '+name);
}
const js=await readFile('lib/client.js','utf8');
assert.ok(js.includes('window.__ModuleLoader__.load'));
assert.ok(js.includes('id: "dsh-inline-edit"'));
assert.equal(/react\.development\.js|react\.production\.min\.js|react-dom\/cjs/.test(js),false);
assert.equal(/C:\\\\Users|_maxy|BEGIN .*PRIVATE KEY/.test(js),false);
console.log('Native manifest and distribution files verified.');
