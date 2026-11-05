import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

// The settings bundle uses only whole snapshots and shallow field updates.
// Keep its store boundary observable and immutable without pulling in the
// unrelated renderer/store-seat dependencies of the host store package.
function createSnapshotStore(initial) {
  let snapshot = freeze(initial);
  const listeners = new Set();
  const set = next => {
    snapshot = freeze(next);
    for (const listener of [...listeners]) listener();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    set,
    update: change => { const next = {...snapshot}; change(next); set(next); },
  };
}

// Exercise the released ConfigForms, ConfigFormController, describe mirror and
// schema decoder together. Only Cordis registration and the snapshot-store
// primitive are fixtures; no settings states, retries or validation are mocked.
export async function loadNativeSettings() {
  const source = await readFile(new URL('../../node_modules/@deepseek-ai/dsh-client-ui-settings/lib/client.js', import.meta.url), 'utf8');
  let exports;
  class Service {
    constructor(ctx, name) { this.ctx = ctx; ctx[name] = this; }
  }
  const window = {__ModuleLoader__: {load(definition) {
    exports = definition.factory(id => {
      if (id === '@deepseek-ai/cordis') return {Service};
      if (id === '@deepseek-ai/dsh-client-store') return {createSnapshotStore};
      throw new Error(`Unexpected native settings dependency: ${id}`);
    });
  }}};
  vm.runInThisContext(`(function(window){${source}\n})`)(window);
  return exports;
}
