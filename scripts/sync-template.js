const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { treeHash } = require("../src/template-hash");
const { shouldDistribute, shouldVisitDirectory } = require("../src/manifest");

const packageRoot = path.resolve(__dirname, "..");
const targetTemplateRoot = path.join(packageRoot, "template");
const targetManifestPath = path.join(packageRoot, "template.manifest.json");
const targetSnapshotPath = path.join(packageRoot, "template.snapshot.json");
const siblingHarness = path.resolve(packageRoot, "../yss-strategic-design-harness");
const defaultRemote = "https://github.com/iloveZzz/yss-harness-design-agent.git";
const NPM_IGNORED_BASENAMES = new Set([".gitignore", ".npmignore", ".npmrc"]);

function isLocalRepo(value) {
  return fs.existsSync(value) && fs.existsSync(path.join(value, "yss-project.yaml"));
}

const templateRepo =
  process.env.YSS_STRATEGIC_DESIGN_TEMPLATE_REPO ||
  (isLocalRepo(siblingHarness) ? siblingHarness : defaultRemote);
const DEFAULT_TEMPLATE_REF = "f50acabf45f9b947ab78df290253ced4e3fe242d";
const templateRef =
  process.env.YSS_STRATEGIC_DESIGN_TEMPLATE_REF ||
  (isLocalRepo(templateRepo) ? "HEAD" : DEFAULT_TEMPLATE_REF);

function run(command, args, cwd = packageRoot) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} 执行失败`);
  }
  return result.stdout;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function projectManifest(sourceRoot) {
  const projector = `
import { loadInstanceDistributionManifest, toCliManifest } from ${JSON.stringify(
    path.join(sourceRoot, "scripts/lib/instance-distribution.mjs"),
  )};
process.stdout.write(JSON.stringify(toCliManifest(), null, 2) + "\\n");
`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", projector], {
    cwd: sourceRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "无法投影实例分发清单");
  }
  const manifest = JSON.parse(result.stdout);
  if (manifest.profileId !== "harness.business-ddd-strategy-handoff") {
    throw new Error("投影清单 profileId 不是战略设计交付 profile");
  }
  return manifest;
}

function copyDistributedFiles(sourceRoot, manifest, destinationRoot) {
  const resolvedCheckoutRoot = fs.realpathSync(sourceRoot);

  const visit = (currentPath, relativeDir = "") => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name === ".DS_Store" || entry.name === ".git") continue;
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const sourcePath = path.join(currentPath, entry.name);
      const sourceLink = fs.lstatSync(sourcePath);
      let resolvedPath = sourcePath;
      if (sourceLink.isSymbolicLink()) {
        resolvedPath = fs.realpathSync(sourcePath);
        const resolvedRelative = path
          .relative(resolvedCheckoutRoot, resolvedPath)
          .split(path.sep)
          .join("/");
        if (
          resolvedRelative === ".." ||
          resolvedRelative.startsWith("../") ||
          path.isAbsolute(resolvedRelative)
        ) {
          throw new Error(`模板投影链接必须指向仓库内部目录：${relativePath}`);
        }
      }
      const resolvedStat = fs.statSync(resolvedPath);
      if (resolvedStat.isDirectory()) {
        if (!shouldVisitDirectory(relativePath, manifest)) continue;
        visit(resolvedPath, relativePath);
        continue;
      }
      if (!resolvedStat.isFile()) continue;
      if (!shouldDistribute(relativePath, manifest, { init: true })) continue;
      const targetPath = path.join(destinationRoot, relativePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(resolvedPath, targetPath);
      fs.chmodSync(targetPath, resolvedStat.mode & 0o777);
    }
  };

  visit(sourceRoot);
}

function materializeSharedSkillProjections(templateRoot) {
  const lockPath = path.join(templateRoot, "skills-lock.json");
  if (!fs.existsSync(lockPath)) return;
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  } catch {
    return;
  }
  const sharedNames = Object.keys(lock.skills?.shared ?? {});
  if (sharedNames.length === 0) return;
  const sourceRoot = path.join(templateRoot, ".agents/skills");
  const projectionRoots = Array.isArray(lock.projectionRoots) && lock.projectionRoots.length
    ? lock.projectionRoots
    : [
        ".claude/skills",
        ".codex/skills",
        ".cursor/skills",
        ".hermes/skills",
        ".pi/skills",
        ".qoder/skills",
        ".trae/skills",
      ];
  for (const name of sharedNames) {
    const source = path.join(sourceRoot, name);
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) continue;
    for (const root of projectionRoots) {
      const projectionRoot = path.join(templateRoot, root);
      const target = path.join(projectionRoot, name);
      fs.mkdirSync(projectionRoot, { recursive: true });
      fs.rmSync(target, { recursive: true, force: true });
      fs.cpSync(source, target, { recursive: true, preserveTimestamps: true });
    }
  }
}

function encodeNpmIgnoredDotfiles(root) {
  const encodedPaths = {};
  const visit = (currentPath, relativeDir = "") => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const absolutePath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile() || !NPM_IGNORED_BASENAMES.has(entry.name)) continue;
      const directory = path.posix.dirname(relativePath);
      const encoded = path.posix.join(
        directory === "." ? "" : directory,
        `__yss_dotfile__${entry.name}`,
      );
      if (Object.values(encodedPaths).includes(encoded) || fs.existsSync(path.join(root, encoded))) {
        throw new Error(`模板路径编码冲突：${relativePath} -> ${encoded}`);
      }
      encodedPaths[relativePath] = encoded;
      fs.renameSync(absolutePath, path.join(root, encoded));
    }
  };
  visit(root);
  return encodedPaths;
}

function assertSnapshotDistribution(stagingRoot, manifest, encodedPaths) {
  const logicalByEncoded = new Map(
    Object.entries(encodedPaths).map(([logicalPath, encodedPath]) => [encodedPath, logicalPath]),
  );
  const stack = [stagingRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(stagingRoot, absolute).split(path.sep).join("/");
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const logicalPath = logicalByEncoded.get(relative) || relative;
      if (!shouldDistribute(logicalPath, manifest, { init: true })) {
        throw new Error(`模板快照包含未登记的实例资源：${logicalPath}`);
      }
    }
  }
  for (const forbidden of manifest.instanceForbiddenPaths || []) {
    const candidate = path.join(stagingRoot, forbidden);
    if (fs.existsSync(candidate)) {
      throw new Error(`模板快照包含禁止分发路径：${forbidden}`);
    }
  }
}

function movePath(source, destination) {
  try {
    fs.renameSync(source, destination);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    const stat = fs.lstatSync(source);
    if (stat.isDirectory()) {
      fs.cpSync(source, destination, { recursive: true });
      fs.rmSync(source, { recursive: true, force: true });
      return;
    }
    fs.copyFileSync(source, destination);
    fs.rmSync(source, { force: true });
  }
}

function replaceTemplateRoot(stagingRoot, snapshotMetadata, manifestText) {
  if (fs.existsSync(targetTemplateRoot)) {
    fs.rmSync(targetTemplateRoot, { recursive: true, force: true });
  }
  movePath(stagingRoot, targetTemplateRoot);
  fs.writeFileSync(targetManifestPath, manifestText);
  fs.writeFileSync(targetSnapshotPath, `${JSON.stringify(snapshotMetadata, null, 2)}\n`);
}

function resolveSource(checkoutRoot) {
  if (isLocalRepo(templateRepo)) {
    return { sourceRoot: path.resolve(templateRepo), cleanup: () => {} };
  }
  if (!templateRef) {
    throw new Error("远程模板同步需要 YSS_STRATEGIC_DESIGN_TEMPLATE_REF 固定 40 位 commit");
  }
  run("git", ["clone", "--no-checkout", "--depth", "1", templateRepo, checkoutRoot]);
  run("git", ["fetch", "--depth", "1", "origin", templateRef], checkoutRoot);
  run("git", ["checkout", "--detach", "FETCH_HEAD"], checkoutRoot);
  return {
    sourceRoot: checkoutRoot,
    cleanup: () => fs.rmSync(checkoutRoot, { recursive: true, force: true }),
  };
}

if (require.main === module) {
  const checkoutRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yss-strategic-design-template-"));
  const stagingRoot = fs.mkdtempSync(path.join(packageRoot, ".template-staging-"));
  let source;
  try {
    source = resolveSource(checkoutRoot);
    const manifest = projectManifest(source.sourceRoot);
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    copyDistributedFiles(source.sourceRoot, manifest, stagingRoot);
    materializeSharedSkillProjections(stagingRoot);
    const encodedPaths = encodeNpmIgnoredDotfiles(stagingRoot);
    assertSnapshotDistribution(stagingRoot, manifest, encodedPaths);
    const templateCommit = run("git", ["rev-parse", "HEAD"], source.sourceRoot).trim();
    if (!/^[0-9a-f]{40}$/.test(templateCommit)) {
      throw new Error("模板快照必须绑定 40 位 templateCommit");
    }
    const templateCommitTime = run(
      "git",
      ["show", "-s", "--format=%cI", templateCommit],
      source.sourceRoot,
    ).trim();
    const parsedCommitTime = new Date(templateCommitTime);
    if (Number.isNaN(parsedCommitTime.getTime())) {
      throw new Error("模板快照无法解析 templateCommit 提交时间");
    }
    const generatedAt = parsedCommitTime.toISOString();
    const snapshotMetadata = {
      schemaVersion: 1,
      templateName: "yss-harness-design-agent",
      profileId: manifest.profileId,
      templateSource: "github:iloveZzz/yss-harness-design-agent",
      templateRepository: templateRepo,
      requestedRef: templateRef,
      templateCommit,
      manifestHash: sha256(manifestText),
      encodedPaths,
      snapshotHash: treeHash(stagingRoot),
      generatedAt,
    };
    replaceTemplateRoot(stagingRoot, snapshotMetadata, manifestText);
    console.log(
      `已从 ${templateRepo}#${templateCommit} 同步战略设计 Harness 快照`,
    );
  } finally {
    if (source) source.cleanup();
    fs.rmSync(checkoutRoot, { recursive: true, force: true });
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
}
