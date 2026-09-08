const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { syncManaged } = require('../src/sync');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'design-sync-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const target = path.join(root,'target'), staged = path.join(root,'staged');
  for (const dir of [target, staged]) fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});
  fs.writeFileSync(path.join(target,'scripts/tool'),'old');
  fs.writeFileSync(path.join(target,'CONTEXT.md'),'business vocabulary');
  fs.writeFileSync(path.join(target,'approved.yaml'),'approved old contract');
  fs.writeFileSync(path.join(staged,'scripts/tool'),'new');
  fs.writeFileSync(path.join(staged,'scripts/new-tool'),'added');
  fs.writeFileSync(path.join(staged,'CONTEXT.md'),'template vocabulary');
  const metadata = path.join(target,'.yss-harness-design.json');
  fs.writeFileSync(metadata,JSON.stringify({metadataSchemaVersion:1,templateName:'yss-harness-design-agent',profileId:'harness.business-ddd-strategy-handoff',templateSource:'github:iloveZzz/yss-harness-design-agent',templateCommit:'old',managedFiles:{'scripts/tool':{contentHash:hash('old')}}}));
  const input={target,staged,operations:['scripts/tool','scripts/new-tool','CONTEXT.md'].map(relativePath=>({relativePath,type:'copy'})),snapshot:{templateCommit:'new'},cliVersion:'0.5.0',manifestText:'{}'};
  return {input,target,staged,metadata};
}
test('preview is read-only; apply preserves vocabulary, approved files and then becomes idempotent',t=>{
  const {input,target,metadata}=fixture(t), before=fs.readFileSync(metadata);
  const preview=syncManaged(input);assert.equal(preview.status,'preview');assert.equal(preview.changes.length,2);assert.deepEqual(fs.readFileSync(metadata),before);assert.equal(fs.readFileSync(path.join(target,'scripts/tool'),'utf8'),'old');
  syncManaged({...input,apply:true});assert.equal(fs.readFileSync(path.join(target,'scripts/tool'),'utf8'),'new');assert.equal(fs.readFileSync(path.join(target,'CONTEXT.md'),'utf8'),'business vocabulary');assert.equal(fs.readFileSync(path.join(target,'approved.yaml'),'utf8'),'approved old contract');assert.deepEqual(syncManaged(input).changes,[]);
});
test('local conflict prevents all writes and metadata advancement',t=>{
  const {input,target,metadata}=fixture(t);fs.writeFileSync(path.join(target,'scripts/tool'),'user edit');const before=fs.readFileSync(metadata);
  assert.equal(syncManaged(input).status,'conflict');assert.throws(()=>syncManaged({...input,apply:true}),/本地修改/);assert.deepEqual(fs.readFileSync(metadata),before);assert.equal(fs.existsSync(path.join(target,'scripts/new-tool')),false);
});
test('foreign metadata, path traversal and symlink destinations cannot be updated',t=>{
  const {input,target,metadata}=fixture(t);const old=fs.readFileSync(metadata),data=JSON.parse(old);data.profileId='harness.dev-agent-slice';fs.writeFileSync(metadata,JSON.stringify(data));assert.throws(()=>syncManaged({...input,apply:true}),/本家族/);fs.writeFileSync(metadata,old);
  assert.throws(()=>syncManaged({...input,operations:[{type:'copy',relativePath:'scripts/../../outside'}]}),/路径非法/);
  fs.rmSync(path.join(target,'scripts/tool'));fs.symlinkSync(path.join(target,'CONTEXT.md'),path.join(target,'scripts/tool'));assert.throws(()=>syncManaged({...input,apply:true}),/普通文件/);assert.equal(fs.readFileSync(path.join(target,'CONTEXT.md'),'utf8'),'business vocabulary');
});
test('a mid-write failure rolls back changed files, newly created directories and metadata',t=>{
  const {input,target,staged,metadata}=fixture(t),before=fs.readFileSync(metadata);
  fs.mkdirSync(path.join(staged,'scripts/new-dir'));fs.writeFileSync(path.join(staged,'scripts/new-dir/tool'),'added');input.operations.push({type:'copy',relativePath:'scripts/new-dir/tool'});
  const copy=fs.copyFileSync;fs.copyFileSync=(source,dest,...args)=>{if(dest.endsWith('new-dir/tool'))throw new Error('injected write failure');return copy(source,dest,...args);};
  try {assert.throws(()=>syncManaged({...input,apply:true}),/injected write failure/);}finally{fs.copyFileSync=copy;}
  assert.deepEqual(fs.readFileSync(metadata),before);assert.equal(fs.readFileSync(path.join(target,'scripts/tool'),'utf8'),'old');assert.equal(fs.existsSync(path.join(target,'scripts/new-tool')),false);assert.equal(fs.existsSync(path.join(target,'scripts/new-dir')),false);
});
