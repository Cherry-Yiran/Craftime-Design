import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('plugin.json',root),'utf8'));
const child=spawn(process.execPath,['server/index.mjs'],{cwd:fileURLToPath(root),stdio:['pipe','pipe','pipe']});
let buffer='',stderr='',nextId=1;
const pending=new Map();
child.stderr.on('data',chunk=>{stderr+=chunk});
child.stdout.on('data',chunk=>{buffer+=chunk;while(buffer.includes('\n')){const index=buffer.indexOf('\n');const line=buffer.slice(0,index);buffer=buffer.slice(index+1);if(!line.trim())continue;const message=JSON.parse(line);if(message.id&&pending.has(message.id)){const {resolve,reject,timer}=pending.get(message.id);clearTimeout(timer);pending.delete(message.id);message.error?reject(Error(JSON.stringify(message.error))):resolve(message.result)}}});
function request(method,params={}){const id=nextId++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timed out: ${method}; stderr=${stderr.slice(0,500)}`))},10000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')})}
function notify(method,params={}){child.stdin.write(JSON.stringify({jsonrpc:'2.0',method,params})+'\n')}
const checks=[];
try{
 const init=await request('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'Craftime release verification',version:'1.0.0'}});assert.equal(init.serverInfo.version,manifest.version);checks.push('initialize actual server version');notify('notifications/initialized');
 const list=await request('tools/list');assert.deepEqual(list.tools.map(t=>t.name).sort(),['craftime_check_design','craftime_get_rules','craftime_open']);for(const tool of list.tools){assert.equal(tool.annotations.readOnlyHint,true);assert.equal(tool.annotations.destructiveHint,false)}checks.push('three read-only tools with expected schemas');
 const rules=await request('tools/call',{name:'craftime_get_rules',arguments:{}});assert.equal(rules.isError,undefined);assert.equal(rules.structuredContent.version,manifest.version);assert.equal(rules.structuredContent.liveSpecificationRead,false);assert.equal(rules.structuredContent.fileKey,'03EUC7nSmTdbnEjMOWAQ3U');assert.equal(rules.structuredContent.sources.businessReference.fileKey,'h2Yu0Mg9J23KCatfp4uBgh');assert.match(rules.structuredContent.workflow,/#F6F6F6/);assert.match(rules.structuredContent.workflow,/MingCute/);assert.match(rules.structuredContent.workflow,/#018AE4/);assert.match(rules.structuredContent.workflow,/linkText/);checks.push('workflow, neutral surfaces, icons and source routing');
 const open=await request('tools/call',{name:'craftime_open',arguments:{}});assert.equal(open.structuredContent.version,manifest.version);assert.deepEqual(open.content,[]);checks.push('open tool has no implicit attachment');
 const resources=await request('resources/list');assert.equal(resources.resources[0].uri,'ui://craftime-design/specification');
 const resource=await request('resources/read',{uri:'ui://craftime-design/specification'});const html=resource.contents[0].text;assert.ok(html.includes(`const CLIENT_VERSION = "${manifest.version}"`));assert.ok(html.includes('state.rules.version'));assert.ok(!html.includes('v0.3.0'));assert.ok(html.includes('版本未确认'));assert.equal(resource.contents[0].mimeType,'text/html;profile=mcp-app');checks.push('MCP panel resource, generated client version, dynamic display');
 const empty=await request('tools/call',{name:'craftime_check_design',arguments:{readback:{}}});assert.equal(empty.structuredContent.status,'待验证');assert.equal(empty.structuredContent.checkedRecords,0);assert.ok(empty.structuredContent.pending.length);checks.push('missing evidence cannot pass via MCP');
 const bad=await request('tools/call',{name:'craftime_check_design',arguments:{readback:null}});assert.equal(bad.isError,true);checks.push('malformed readback is a tool error');
 const sample={scope:{targetFileKey:'synthetic-only',targetNodeId:'1:1',readAt:'2026-10-15',categories:Object.fromEntries(['texts','icons','instances','protectedRegions'].map(name=>[name,name==='icons'?{inScope:true}:{inScope:false,reason:'synthetic contract test'}]))},icons:[{id:'1:1',evidence:{fileKey:'synthetic-only',nodeId:'1:1',readAt:'2026-10-15'},screenshot:{reference:'synthetic-contract-fixture',reviewed:true},officialSource:'https://www.mingcute.com/',iconName:'fixture',assetRevision:'fixture',actual:{finalWidth:24,finalHeight:24,paths:[{type:'VECTOR',editable:true,vectorPathsCount:1,strokes:[{type:'SOLID'}],effectiveStrokeWeightPx:1.67,strokeVariableName:'icon/stroke-width',strokeVariableId:'fixture'}]}}]};
 const good=await request('tools/call',{name:'craftime_check_design',arguments:{readback:sample}});assert.equal(good.structuredContent.status,'通过');sample.icons[0].actual.paths[0].strokes=[];const filled=await request('tools/call',{name:'craftime_check_design',arguments:{readback:sample}});assert.equal(filled.structuredContent.status,'有偏差');checks.push('synthetic complete icon accepted; filled outline rejected over MCP');
 const semantic=JSON.parse(await readFile(new URL('skills/craftime-figma-ui/references/color-semantics.json',root),'utf8'));assert.equal(semantic.roles.fieldBackground.hex,'#F6F6F6');assert.equal(semantic.roles.linkText.hex,'#018AE4');assert.equal(semantic.roles.linkText.allowUnbound,true);checks.push('existing color semantics retained');
 const report={status:'passed',version:manifest.version,checks,checkedAt:new Date().toISOString(),transport:'Actual local stdio MCP process',hostUI:'not tested; controller tests use simulated host context',stderr};
 if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{child.stdin.end();child.kill();for(const entry of pending.values())clearTimeout(entry.timer)}

