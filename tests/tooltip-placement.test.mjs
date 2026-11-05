import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeTooltip} from '../src/tooltip-placement.js';
const input={anchor:{left:100,right:128,top:100,bottom:128},width:160,height:30,viewportWidth:800,viewportHeight:600};
test('short hint stays centered directly below its button',()=>{
 const p=placeTooltip(input);
 assert.equal(p.left,34);assert.equal(p.top,136);assert.equal(p.side,'bottom');
});
test('hint flips above an adjacent control without moving away from its button',()=>{
 const p=placeTooltip({...input,avoid:[{left:130,top:130,right:310,bottom:170}]});
 assert.equal(p.side,'top');assert.equal(p.left,34);assert.equal(p.top,62);
});
test('right viewport edge clamps horizontally and keeps the preferred bottom side',()=>{
 const p=placeTooltip({...input,anchor:{left:740,right:768,top:100,bottom:128}});
 assert.equal(p.left,628);assert.equal(p.top,136);assert.equal(p.side,'bottom');
 assert.equal(p.overflow,false);
});
test('long action hint ends at its own button instead of shifting past the whole action row',()=>{
 const p=placeTooltip({...input,anchor:{left:500,right:530,top:150,bottom:180},width:280,align:'end',avoid:[{left:460,right:490,top:150,bottom:180},{left:400,right:450,top:155,bottom:175}]});
 assert.equal(p.side,'bottom');assert.equal(p.left,250);assert.equal(p.top,188);
 assert.equal(p.left+p.width,530);
});
test('short action hint ignores neighboring timestamps and buttons on the same row',()=>{
 const p=placeTooltip({...input,anchor:{left:500,right:530,top:150,bottom:180},width:70,avoid:[{left:460,right:490,top:150,bottom:180},{left:400,right:450,top:155,bottom:175}]});
 assert.equal(p.side,'bottom');assert.equal(p.left,480);assert.equal(p.top,188);
});
test('long end-aligned hint stays inside a narrow viewport',()=>{
 const p=placeTooltip({...input,anchor:{left:200,right:230,top:100,bottom:130},width:280,viewportWidth:320,align:'end'});
 assert.equal(p.side,'bottom');assert.equal(p.left,12);assert.equal(p.top,138);
 assert.ok(p.left+p.width<=308);
});
test('top hint flips below when the viewport has no space above',()=>{
 const p=placeTooltip({...input,anchor:{left:380,right:410,top:15,bottom:45},side:'top',align:'end'});
 assert.equal(p.side,'bottom');assert.equal(p.left,250);assert.equal(p.top,53);
});
test('bottom hint flips above near the viewport bottom',()=>{
 const p=placeTooltip({...input,anchor:{left:380,right:410,top:550,bottom:580}});
 assert.equal(p.side,'top');assert.equal(p.left,315);assert.equal(p.top,512);
});
test('horizontal hint clamps vertically before trying the opposite side',()=>{
 const p=placeTooltip({...input,anchor:{left:15,right:43,top:8,bottom:38},width:50,height:160,side:'left'});
 assert.equal(p.side,'right');assert.equal(p.left,51);assert.equal(p.top,12);
 assert.equal(p.overflow,false);
});
test('blocked vertical sides fall back beside the anchor rather than diagonally',()=>{
 const p=placeTooltip({...input,width:80,avoid:[{left:50,top:136,right:250,bottom:180},{left:50,top:50,right:250,bottom:92}]});
 assert.equal(p.side,'right');assert.equal(p.left,136);assert.equal(p.top,99);
});
test('crowded editor keeps a bounded hint without covering its own anchor when possible',()=>{
 const p=placeTooltip({...input,avoid:[{left:0,top:0,right:800,bottom:600}]});
 assert.notEqual(p.hidden,true);assert.equal(p.overflow,true);
 assert.ok(p.left>=12 && p.left+p.width<=788);
 assert.ok(p.top>=12 && p.top+p.height<=588);
 assert.ok(p.top>=input.anchor.bottom || p.top+p.height<=input.anchor.top || p.left>=input.anchor.right || p.left+p.width<=input.anchor.left);
});
