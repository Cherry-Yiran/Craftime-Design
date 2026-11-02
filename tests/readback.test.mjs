import test from 'node:test';
import assert from 'node:assert/strict';
import {checkDesignReadback} from '../skills/craftime-figma-ui/scripts/check-design-readback.mjs';
const source={fileKey:'fixture-only',nodeId:'1:1',readAt:'2026-10-15T00:00:00Z'};
const screenshot={reference:'synthetic fixture only',reviewed:true};
function fixture(category,record) {return {scope:{targetFileKey:'fixture-only',targetNodeId:'1:1',readAt:source.readAt,categories:Object.fromEntries(['texts','icons','instances','protectedRegions'].map(c=>[c,c===category?{inScope:true}:{inScope:false,reason:'synthetic test excludes category'}]))},[category]:[{id:'1:1',evidence:source,screenshot,...record}]};}
const typography={styleId:'fixture-style',fontFamily:'Open Sans',fontWeight:400,fontSize:16,lineHeight:{unit:'PIXELS',value:24},letterSpacing:{unit:'PIXELS',value:0}};
const text=()=>fixture('texts',{platform:'web',language:'latin',migration:'current',actual:{type:'TEXT',...typography},expected:{source,role:'Body/Default',...typography}});
const icon=()=>fixture('icons',{officialSource:'https://www.mingcute.com/',iconName:'fixture',assetRevision:'fixture-only',actual:{finalWidth:24,finalHeight:24,paths:[{type:'VECTOR',editable:true,vectorPathsCount:1,strokes:[{type:'SOLID',opacity:1}],effectiveStrokeWeightPx:1.67,strokeVariableName:'icon/stroke-width',strokeVariableId:'fixture-variable'}]}});
const instance=()=>fixture('instances',{actual:{type:'INSTANCE',mainComponentId:'local-imported-id',mainComponentKey:'component-key',sourceFileKey:'source-file',platform:'web',state:'default'},expected:{source,mainComponentKey:'component-key',sourceFileKey:'source-file',platform:'web',state:'default'}});
const snapshot=()=>({structure:{children:['a','b']},layout:{x:0,width:240},style:{opacity:1},text:['Logo'],bindings:{color:'white'},reactions:[],ancestorEffects:[]});
const chrome=()=>fixture('protectedRegions',{region:'navigation',sourceFileKey:'RFpf6Kksqu6SFsnjxjIn5l',sourceNodeId:'1336:145424',before:snapshot(),after:snapshot(),beforeScreenshot:screenshot});

test('complete synthetic records pass each applicable category',()=>{for(const f of [text,icon,instance,chrome])assert.equal(checkDesignReadback(f()).status,'通过')});
test('missing fields or all exclusions never produce pass',()=>{for(const x of [{}, {scope:{categories:Object.fromEntries(['texts','icons','instances','protectedRegions'].map(c=>[c,{inScope:false,reason:'none'}]))}}])assert.equal(checkDesignReadback(x).status,'待验证')});
test('actual font overrides and wrong style fail',()=>{const x=text();x.texts[0].actual.fontWeight=700;x.texts[0].actual.styleId='wrong';const r=checkDesignReadback(x);assert.equal(r.status,'有偏差');assert.equal(r.issues.length,2)});
test('missing screenshot remains pending despite matching typography',()=>{const x=text();delete x.texts[0].screenshot;assert.equal(checkDesignReadback(x).status,'待验证')});
test('filled outline with nominal stroke weight fails',()=>{const x=icon();x.icons[0].actual.paths[0].strokes=[];assert.equal(checkDesignReadback(x).status,'有偏差')});
test('icon source, final stroke and variable name are checked',()=>{const x=icon();x.icons[0].officialSource='https://example.com/';x.icons[0].actual.paths[0].effectiveStrokeWeightPx=2;x.icons[0].actual.paths[0].strokeVariableName='wrong';assert.equal(checkDesignReadback(x).issues.length,3)});
test('detached component cannot pass identity check',()=>{const x=instance();x.instances[0].actual.type='FRAME';x.instances[0].actual.mainComponentKey='wrong';assert.equal(checkDesignReadback(x).status,'有偏差')});
test('cross-file local component ID may differ while key is preserved',()=>{assert.equal(checkDesignReadback(instance()).status,'通过')});
test('protected text, parent effects and interactions are compared',()=>{const x=chrome();x.protectedRegions[0].after.text=['changed'];x.protectedRegions[0].after.ancestorEffects=[{opacity:0.5}];x.protectedRegions[0].after.reactions=[{trigger:'click'}];assert.equal(checkDesignReadback(x).issues.length,3)});
test('missing fixed-region baseline is pending',()=>{const x=chrome();delete x.protectedRegions[0].before;assert.equal(checkDesignReadback(x).status,'待验证')});
test('object key order does not create false mismatch',()=>{const x=chrome();x.protectedRegions[0].after.layout={width:240,x:0};assert.equal(checkDesignReadback(x).status,'通过')});
test('invalid input rejects; known deviation retained with missing evidence',()=>{assert.throws(()=>checkDesignReadback(null));const x=text();delete x.texts[0].evidence;x.texts[0].actual.fontSize=12;const r=checkDesignReadback(x);assert.equal(r.status,'有偏差');assert.ok(r.pending.length)});

test('full-page scope requires both protected regions even when excluded',()=>{const x=text();x.scope.fullPage=true;assert.equal(checkDesignReadback(x).status,'待验证');assert.equal(checkDesignReadback(x).pending.filter(p=>p.property.startsWith('fullPage.')).length,2)});
