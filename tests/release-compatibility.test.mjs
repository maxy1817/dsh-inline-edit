import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import semver from 'semver';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const hostRequirements=[
 ['engines.dsh',pkg.engines?.dsh],
 ...Object.entries(pkg.peerDependencies??{})
  .filter(([name])=>/^@deepseek-ai\/dsh(?:-|$)/.test(name))
  .map(([name,range])=>['peerDependencies.'+name,range]),
];

function assertAcceptsRequirements(requirements) {
 const rejected=[];
 for(const [field,range,version] of requirements) {
  assert.equal(typeof range,'string',field+' must declare its compatibility range');
  assert.notEqual(semver.validRange(range),null,field+' must declare a valid range');
  for(const [mode,accepted] of [
   ['npm',semver.satisfies(version,range)],
   ['market',semver.satisfies(version,range,{includePrerelease:true})],
  ]) {
   if(!accepted) rejected.push({field,range,version,mode});
  }
 }
 assert.deepEqual(rejected,[],'published requirements reject supported host packages');
}

test('published requirements accept the current DSH 0.2.2-rc.1 host',()=>{
 assertAcceptsRequirements([
  ...hostRequirements.map(([field,range])=>[field,range,'0.2.2-rc.1']),
  ['peerDependencies.@deepseek-ai/schemastery',pkg.peerDependencies?.['@deepseek-ai/schemastery'],'3.19.0'],
  ['peerDependencies.zod',pkg.peerDependencies?.zod,'4.4.3'],
 ]);
});

test('published requirements retain supported DSH 0.2.1 hosts',()=>{
 for(const version of ['0.2.1-rc.3','0.2.1-rc.5']) {
  assertAcceptsRequirements([
   ...hostRequirements.map(([field,range])=>[field,range,version]),
   ['peerDependencies.@deepseek-ai/schemastery',pkg.peerDependencies?.['@deepseek-ai/schemastery'],'3.18.5'],
   ['peerDependencies.zod',pkg.peerDependencies?.zod,'4.4.3'],
  ]);
 }
});

test('published host ranges exclude older and unverified DSH releases',()=>{
 for(const version of [
  '0.2.1-rc.2','0.2.2-rc.0','0.2.3-0','0.2.3-rc.1','0.2.3',
  '0.3.0-rc.1','0.3.0',
 ]) {
  for(const [field,range] of hostRequirements) {
   assert.equal(semver.satisfies(version,range,{includePrerelease:true}),false,
    field+' ('+range+') admits unsupported DSH '+version);
  }
 }
});

test('published schema range excludes versions outside supported host lines',()=>{
 const range=pkg.peerDependencies?.['@deepseek-ai/schemastery'];
 for(const version of ['3.18.4','3.20.0-0','3.20.0-rc.1','3.20.0','4.0.0']) {
  assert.equal(semver.satisfies(version,range,{includePrerelease:true}),false,
   'schemastery '+range+' admits unsupported '+version);
 }
});

test('release manifest and lockfile publish the same 0.3.0 host requirements',async()=>{
 const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
 const root=lock.packages[''];
 assert.equal(pkg.version,'0.3.0');
 assert.equal(lock.version,pkg.version);
 assert.equal(root.version,pkg.version);
 assert.deepEqual(root.engines,pkg.engines);
 assert.deepEqual(root.peerDependencies,pkg.peerDependencies);
});
