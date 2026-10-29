import {build} from 'esbuild';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';

// Exercise the released host Tooltip in jsdom; production resolves it from
// DSH's module loader. CSS is emitted in memory, never into the repository.
export async function loadNativeTooltip(require) {
  const root=fileURLToPath(new URL('../../node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/',import.meta.url));
  const source=await readFile(new URL('../../node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js',import.meta.url),'utf8');
  // Select the publisher's verbatim regions, avoiding unrelated markdown and
  // icon-registry initializers. No Tooltip or placement behavior is mocked.
  const regions=['ShortcutKeys','useDismissOnOutsidePointer','tooltip-placement','input-modality','Tooltip'].map(name=>{
    const marker=`//#region lib/types/${name}.js`;
    const start=source.indexOf(marker),end=source.indexOf('//#endregion',start);
    if(start<0 || end<start)throw new Error(`Native Tooltip region missing: ${name}`);
    return source.slice(start,end);
  });
  const result = await build({
    stdin: {contents: `import {jsx,jsxs} from 'react/jsx-runtime';
      import {cloneElement,createContext,useCallback,useContext,useEffect,useId,useRef,useState} from 'react';
      import {createPortal} from 'react-dom'; import clsx from 'clsx';
      import css$13 from './ShortcutKeys.module.css'; import css$23 from './Tooltip.module.css';
      ${regions.join('\n')}\nexport {Tooltip,ShortcutKeys,pointerModality,useDismissOnOutsidePointer};`, resolveDir:root, loader:'js'},
    bundle:true, write:false, outfile:'native-tooltip.cjs', format:'cjs', platform:'browser',
    loader:{'.css':'local-css'}, logLevel:'silent',
    plugins:[{name:'host-dependencies',setup(builder){
      builder.onResolve({filter:/^[^./\\]/},args=>({path:args.path,external:true,sideEffects:false}));
    }}],
  });
  const module={exports:{}};
  vm.runInThisContext(`(function(require,module,exports){${result.outputFiles.find(file=>file.path.endsWith('.cjs')).text}\n})`)(require,module,module.exports);
  return module.exports;
}
