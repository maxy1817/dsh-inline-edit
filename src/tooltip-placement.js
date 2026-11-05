/** Stay beside the anchor, flipping sides only for viewport or control collisions. */
export function placeTooltip({anchor,width,height,viewportWidth,viewportHeight,gap=8,avoid=[],side='bottom',align='center'}) {
  const margin=12;
  width=Math.min(width,Math.max(0,viewportWidth-margin*2));
  height=Math.min(height,Math.max(0,viewportHeight-margin*2));
  const clampX=x=>Math.max(margin,Math.min(x,viewportWidth-margin-width));
  const clampY=y=>Math.max(margin,Math.min(y,viewportHeight-margin-height));
  const opposite={bottom:'top',top:'bottom',left:'right',right:'left'};
  // Clamp along the cross axis first, keeping the requested side and gap near
  // viewport edges. Never shift the anchor to clear a neighboring action row.
  const left=clampX(align==='end'?anchor.right-width:(anchor.left+anchor.right-width)/2);
  const top=clampY((anchor.top+anchor.bottom-height)/2);
  const positions={
    bottom:{left,top:anchor.bottom+gap},
    top:{left,top:anchor.top-gap-height},
    right:{left:anchor.right+gap,top},
    left:{left:anchor.left-gap-width,top},
  };
  const horizontal=side==='left'||side==='right';
  const candidates=[side,opposite[side],...(horizontal?['bottom','top']:['right','left'])]
    .map(side=>({...positions[side],side}));
  const overlap=(p,r)=>Math.max(0,Math.min(p.left+width,r.right+4)-Math.max(p.left,r.left-4))
    *Math.max(0,Math.min(p.top+height,r.bottom+4)-Math.max(p.top,r.top-4));
  const blockers=[anchor,...avoid];
  const fits=p=>p.left>=margin && p.top>=margin && p.left+width<=viewportWidth-margin && p.top+height<=viewportHeight-margin;
  const clear=p=>blockers.every(r=>overlap(p,r)===0);
  const natural=candidates.find(p=>fits(p)&&clear(p));
  if(natural) return {...natural,width,height,overflow:false};
  const bounded=candidates.map(p=>({...p,left:clampX(p.left),top:clampY(p.top)}));
  const free=bounded.find(clear);
  if(free) return {...free,width,height,overflow:false};
  // Keep the explanation discoverable even in a crowded editor. Prefer the
  // least obstructed candidate, heavily penalizing overlap with its own anchor.
  // Unpinned tooltips do not intercept pointer events; pinned ones dismiss outside.
  const score=p=>overlap(p,anchor)*1000+avoid.reduce((sum,r)=>sum+overlap(p,r),0);
  bounded.sort((a,b)=>score(a)-score(b));
  return {...bounded[0],width,height,overflow:true};
}
