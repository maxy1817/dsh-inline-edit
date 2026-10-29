import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeTooltip} from '../src/tooltip-placement.js';
const input={anchor:{left:100,right:128,top:100,bottom:128},width:160,height:30,viewportWidth:800,viewportHeight:600};
test('tooltip begins strictly to the right and below the icon, not centered beneath it',()=>{
  const p=placeTooltip(input);
  assert.equal(p.left,136);assert.equal(p.top,136);assert.equal(p.side,'bottom');
});
test('tooltip avoids an adjacent Send or Cancel control',()=>{
  const p=placeTooltip({...input,avoid:[{left:130,top:130,right:310,bottom:170}]});
  assert.equal(p.side,'top');assert.equal(p.left,136);assert.equal(p.top,62);
});
test('right viewport edge falls back to a clear lower-left corner',()=>{
  const p=placeTooltip({...input,anchor:{left:740,right:768,top:100,bottom:128}});
  assert.equal(p.left,572);assert.equal(p.top,136);assert.equal(p.hidden,undefined);
});
test('message action hint opens above and right-aligned without covering the turn toolbar',()=>{
  const p=placeTooltip({...input,anchor:{left:380,right:410,top:105,bottom:135},width:280,side:'top',align:'end',avoid:[{left:330,right:375,top:105,bottom:135},{left:300,right:420,top:150,bottom:180}]});
  assert.equal(p.side,'top');assert.equal(p.left,130);assert.equal(p.top,67);
  assert.ok(p.top+p.height<105);
});
test('top hint flips below when the viewport has no space above',()=>{
  const p=placeTooltip({...input,anchor:{left:380,right:410,top:15,bottom:45},side:'top',align:'end'});
  assert.equal(p.side,'bottom');assert.ok(p.top>=53);
});
test('action hint clears timestamp and copy button on the same row',()=>{
 const p=placeTooltip({...input,anchor:{left:500,right:530,top:150,bottom:180},width:280,side:'left',avoid:[{left:460,right:490,top:150,bottom:180},{left:400,right:450,top:155,bottom:175}]});
 assert.equal(p.side,'left');assert.equal(p.left,112);assert.equal(p.top,150);
});
test('information hint stays six pixels to the lower right',()=>{
 const p=placeTooltip({...input,gap:6});assert.equal(p.left,134);assert.equal(p.top,134);
});
test('crowded editor keeps the hint visible inside the viewport',()=>{
  const p=placeTooltip({...input,avoid:[{left:0,top:0,right:800,bottom:600}]});
  assert.notEqual(p.hidden,true);assert.equal(p.overflow,true);
  assert.ok(p.left>=12 && p.left+p.width<=788);
  assert.ok(p.top>=12 && p.top+p.height<=588);
});
