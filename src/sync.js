const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const metadataName = '.yss-harness-design.json';

// Business assets and approval records never enter the update plan.
function managedPath(ref) {
  return /^(?:\.(?:agents|claude|codex|cursor|pi|qoder|trae)\/skills\/|scripts\/|docs\/(?:agents\/|process\/|templates\/|architecture\/templates\/))/.test(ref)
    || ['AGENTS.md', 'CLAUDE.md', 'skills-lock.json'].includes(ref);
}
function safeFile(root, ref) {
  if (!ref || ref.includes('\\') || path.isAbsolute(ref) || ref.split('/').some(x => !x || x === '.' || x === '..')) throw new Error(`同步路径非法：${ref}`);
  let current = root;
  for (const [index, part] of ref.split('/').entries()) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isSymbolicLink() || (index === ref.split('/').length - 1 ? !stat.isFile() : !stat.isDirectory())) throw new Error(`同步路径不是普通文件或目录：${ref}`);
  }
  return current;
}
function syncManaged({ target, staged, operations, snapshot, cliVersion, manifestText, apply = false }) {
  if (!fs.lstatSync(target).isDirectory() || fs.lstatSync(target).isSymbolicLink()) throw new Error('同步目标必须是已有实例目录');
  const metadataPath = safeFile(target, metadataName);
  const old = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (old.metadataSchemaVersion !== 1 || old.templateName !== 'yss-harness-design-agent' || old.profileId !== 'harness.business-ddd-strategy-handoff' || old.templateSource !== 'github:iloveZzz/yss-harness-design-agent' || !old.managedFiles || typeof old.managedFiles !== 'object' || Array.isArray(old.managedFiles)) throw new Error('sync 需要本家族初始化生成的有效 metadata 与受管文件清单');
  const changes = [], conflicts = [], managedFiles = { ...old.managedFiles };
  for (const operation of operations) {
    const ref = operation.relativePath;
    if (operation.type === 'mkdir' || !managedPath(ref)) continue;
    const destination = safeFile(target, ref), source = safeFile(staged, ref);
    const bytes = fs.readFileSync(source), contentHash = hash(bytes);
    const current = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
    if (current && hash(current) !== contentHash && hash(current) !== old.managedFiles[ref]?.contentHash) {
      conflicts.push(ref); continue;
    }
    managedFiles[ref] = { type: operation.type, contentHash };
    if (!current || hash(current) !== contentHash) changes.push({ ref, source, destination, before: current, mode: current ? fs.statSync(destination).mode & 0o777 : null });
  }
  const report = { status: conflicts.length ? 'conflict' : apply ? 'synced' : 'preview', from: old.templateCommit, to: snapshot.templateCommit, changes: changes.map(x => x.ref), conflicts };
  if (!apply) return report;
  if (conflicts.length) throw new Error(`受管文件有本地修改，请先人工合并；未写入任何文件：${conflicts.join(', ')}`);
  const next = { ...old, cliVersion, templateCommit: snapshot.templateCommit, managedFilesManifestVersion: hash(manifestText), managedFiles, syncedAt: new Date().toISOString() };
  const originalMetadata = fs.readFileSync(metadataPath), dirs = [], written = [];
  try {
    for (const item of changes) {
      safeFile(target, item.ref);
      const missing = [];
      for (let dir = path.dirname(item.destination); dir !== target && !fs.existsSync(dir); dir = path.dirname(dir)) missing.push(dir);
      for (const dir of missing.reverse()) { fs.mkdirSync(dir); dirs.push(dir); }
      written.push(item);
      fs.copyFileSync(item.source, item.destination);
      fs.chmodSync(item.destination, fs.statSync(item.source).mode & 0o777);
    }
    fs.writeFileSync(metadataPath, JSON.stringify(next, null, 2) + '\n');
  } catch (error) {
    for (const item of written.reverse()) {
      if (item.before) { fs.writeFileSync(item.destination, item.before); fs.chmodSync(item.destination, item.mode); }
      else fs.rmSync(item.destination, { force: true });
    }
    fs.writeFileSync(metadataPath, originalMetadata);
    for (const dir of dirs.reverse()) fs.rmdirSync(dir);
    throw error;
  }
  return report;
}
module.exports = { syncManaged };
