import {build} from 'esbuild';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';

// Exercise released host primitives in jsdom; production resolves them from
// DSH's module loader. CSS is emitted in memory, never into the repository.
export async function buildNativePrimitives() {
  const root=fileURLToPath(new URL('../../node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/',import.meta.url));
  const source=await readFile(new URL('../../node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js',import.meta.url),'utf8');
  // Select the publisher's verbatim regions, avoiding unrelated markdown and
  // icon-registry initializers. Reference chips, Tooltip and Lightbox remain
  // publisher code, including real artwork, styles and keyboard listeners.
  const regions=['icons/shared-artwork','ReferenceIcon','user-text','ShortcutKeys','useDismissOnOutsidePointer','tooltip-placement','input-modality','Tooltip','ImageLightbox'].map(name=>{
    const marker=`//#region lib/types/${name}.js`;
    const start=source.indexOf(marker),end=source.indexOf('//#endregion',start);
    if(start<0 || end<start)throw new Error(`Native primitive region missing: ${name}`);
    return source.slice(start,end);
  });
  const iconStart=source.indexOf('const IconCloseOutlineArtwork =');
  const iconEnd=source.indexOf('/** Medium IconCloseOutline artwork',iconStart);
  if(iconStart<0 || iconEnd<iconStart)throw new Error('Native Lightbox close artwork missing');
  const closeIcon=source.slice(iconStart,iconEnd);
  const mediumStroke=source.match(/const ICON_MEDIUM_STROKE = [^;]+;/)?.[0];
  if(!mediumStroke)throw new Error('Native reference icon stroke constant missing');
  return build({
    stdin: {contents: `import {Fragment,jsx,jsxs} from 'react/jsx-runtime';
      import {cloneElement,createContext,useCallback,useContext,useEffect,useId,useRef,useState} from 'react';
      import {createPortal} from 'react-dom'; import clsx from 'clsx';
      import css$13 from './ShortcutKeys.module.css'; import css$23 from './Tooltip.module.css';
      import css$34 from './ImageLightbox.module.css';
      import css$22 from './user-text.module.css'; import markdownCss from './markdown/MarkdownText.module.css';
      ${mediumStroke}\n${closeIcon}\n${regions.join('\n')}\nexport {Tooltip,ShortcutKeys,pointerModality,useDismissOnOutsidePointer,ImageLightbox,ReferenceChip};`, resolveDir:root, loader:'js'},
    bundle:true, write:false, outfile:'native-tooltip.cjs', format:'cjs', platform:'browser',
    loader:{'.css':'local-css'}, logLevel:'silent',
    plugins:[{name:'host-dependencies',setup(builder){
      builder.onResolve({filter:/^[^./\\]/},args=>({path:args.path,external:true,sideEffects:false}));
    }}],
  });
}

export async function loadNativeTooltip(require) {
  const result=await buildNativePrimitives();
  const module={exports:{}};
  vm.runInThisContext(`(function(require,module,exports){${result.outputFiles.find(file=>file.path.endsWith('.cjs')).text}\n})`)(require,module,module.exports);
  return module.exports;
}
