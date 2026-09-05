const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline/promises");
const { spawnSync } = require("node:child_process");
const { UPDATE_COMMANDS, runUpdate } = require("./self-update");
const { treeHash } = require("./template-hash");
const { shouldDistribute, shouldVisitDirectory } = require("./manifest");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const PACKAGE_MANIFEST = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
);
const BUNDLED_TEMPLATE_ROOT = path.join(PACKAGE_ROOT, "template");
const BUNDLED_MANIFEST_PATH = path.join(PACKAGE_ROOT, "template.manifest.json");
const BUNDLED_SNAPSHOT_PATH = path.join(PACKAGE_ROOT, "template.snapshot.json");
const TEMPLATE_SOURCE = "github:iloveZzz/yss-harness-design-agent";
const PROFILE_ID = "harness.business-ddd-strategy-handoff";
const TEMPLATE_METADATA_FILENAME = ".yss-harness-design.json";
const METADATA_SCHEMA_VERSION = 1;
const HELP_FLAGS = new Set(["--help", "-h", "-help"]);
const VERSION_FLAGS = new Set(["--version", "-v", "-version"]);
const GITLINK_MODE = "160000";
const ISSUE_TRACKERS = new Set(["local-markdown", "github", "gitlab"]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function nowIsoString() {
  return new Date().toISOString();
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function pathKind(absolutePath) {
  try {
    const stat = fs.lstatSync(absolutePath);
    if (stat.isDirectory()) return "directory";
    if (stat.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

function loadBundledManifest() {
  if (!fs.existsSync(BUNDLED_MANIFEST_PATH)) {
    throw new Error("缺少 template.manifest.json，请先运行 npm run sync-template");
  }
  return JSON.parse(fs.readFileSync(BUNDLED_MANIFEST_PATH, "utf8"));
}

function readTemplateSnapshot() {
  if (!fs.existsSync(BUNDLED_SNAPSHOT_PATH) || !fs.existsSync(BUNDLED_TEMPLATE_ROOT)) {
    throw new Error("缺少模板快照，请先运行 npm run sync-template；正式发布不得使用浮动模板引用");
  }
  const snapshot = JSON.parse(fs.readFileSync(BUNDLED_SNAPSHOT_PATH, "utf8"));
  const manifestText = fs.readFileSync(BUNDLED_MANIFEST_PATH, "utf8");
  if (!/^[0-9a-f]{40}$/.test(snapshot.templateCommit || "")) {
    throw new Error("模板快照必须绑定 40 位不可变 templateCommit");
  }
  if (!/^[0-9a-f]{64}$/.test(snapshot.snapshotHash || "")) {
    throw new Error("模板快照必须包含 64 位 snapshotHash");
  }
  if (snapshot.manifestHash !== sha256(manifestText)) {
    throw new Error("模板快照与当前 template.manifest.json 不一致，请重新构建 CLI 包");
  }
  if (snapshot.profileId !== PROFILE_ID) {
    throw new Error("模板快照 profileId 必须为 harness.business-ddd-strategy-handoff");
  }
  if (snapshot.snapshotHash !== treeHash(BUNDLED_TEMPLATE_ROOT)) {
    throw new Error("模板快照内容 hash 不匹配，请重新构建 CLI 包");
  }
  return snapshot;
}

function logicalTemplatePath(bundledPath, snapshot) {
  const encoded = snapshot.encodedPaths || {};
  const inverted = new Map(
    Object.entries(encoded).map(([logicalPath, encodedPath]) => [
      normalizeRelativePath(encodedPath),
      normalizeRelativePath(logicalPath),
    ]),
  );
  return inverted.get(normalizeRelativePath(bundledPath)) || normalizeRelativePath(bundledPath);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];
    if (
      ["--project-name", "--business-domain", "--team-size", "--target-dir", "--issue-tracker"].includes(
        current,
      )
    ) {
      if (!next || next.startsWith("--")) throw new Error(`${current} 需要一个值`);
      const key = {
        "--project-name": "projectName",
        "--business-domain": "businessDomain",
        "--team-size": "teamSize",
        "--target-dir": "targetDir",
        "--issue-tracker": "issueTracker",
      }[current];
      options[key] = next;
      index += 1;
      continue;
    }
    if (current === "--dry-run") options.dryRun = true;
    else if (current === "--force") options.force = true;
    else if (current === "--git-init") options.gitInit = true;
    else if (HELP_FLAGS.has(current)) options.help = true;
    else if (VERSION_FLAGS.has(current)) options.version = true;
    else throw new Error(`不支持的参数：${current}`);
  }
  return options;
}

function normalizeInteractiveOptions(options, values) {
  const issueTracker = options.issueTracker || "local-markdown";
  if (!ISSUE_TRACKERS.has(issueTracker)) {
    throw new Error("--issue-tracker 必须是 local-markdown、github 或 gitlab");
  }
  return {
    ...values,
    issueTracker,
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    gitInit: Boolean(options.gitInit),
  };
}

async function promptForMissingOptions(options) {
  const askFrom = async (questionFn) => {
    const projectName = options.projectName || (await questionFn("项目名称")).trim();
    const businessDomain = options.businessDomain || (await questionFn("业务领域")).trim();
    const teamSizeInput =
      options.teamSize !== undefined ? options.teamSize : await questionFn("团队规模（可留空）");
    const targetDir = options.targetDir || (await questionFn("目标目录")).trim();
    return normalizeInteractiveOptions(options, {
      projectName,
      businessDomain,
      teamSize: (teamSizeInput || "").trim() || "待补充",
      targetDir,
    });
  };

  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const answers = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
    let answerIndex = 0;
    return askFrom(async (label) => {
      process.stdout.write(`${label}: `);
      const value = answers[answerIndex] ?? "";
      answerIndex += 1;
      return value;
    });
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await askFrom(async (label) => (await rl.question(`${label}: `)) || "");
  } finally {
    rl.close();
  }
}

function assertRequiredOptions(options) {
  if (!options.projectName) throw new Error("init 需要 --project-name，项目名称不能为空");
  if (!options.businessDomain) throw new Error("init 需要 --business-domain，业务领域不能为空");
  if (!options.targetDir) throw new Error("init 需要 --target-dir，目标目录不能为空");
}

function normalizeTargetDir(targetDir) {
  return path.resolve(process.cwd(), targetDir);
}

function isInsideTemplateRoot(targetDir) {
  const relativePath = path.relative(BUNDLED_TEMPLATE_ROOT, targetDir);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function collectGitRoots(start) {
  const roots = [];
  if (!start) return roots;
  let current = path.resolve(start);
  while (true) {
    const gitPath = path.join(current, ".git");
    try {
      const gitStat = fs.lstatSync(gitPath);
      const valid = gitStat.isDirectory()
        ? fs.readdirSync(gitPath).length > 0
        : gitStat.isFile();
      if (valid) roots.push(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (fs.existsSync(path.join(current, ".gitmodules"))) roots.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return [...new Set(roots)];
}

function gitlinkPaths(repoRoot) {
  const result = spawnSync("git", ["-C", repoRoot, "ls-files", "--stage", "-z"], {
    encoding: "utf8",
    timeout: 5000,
  });
  const paths = new Set();
  if (result.status === 0) {
    for (const record of (result.stdout || "").split("\0")) {
      const match = record.match(/^(160000)\s+[0-9a-f]+\s+\d+\s+(.+)$/i);
      if (match) paths.add(match[2].replaceAll("\\", "/"));
    }
  }
  return paths;
}

function posixRelative(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function gitlinkWriteViolation(targetDir, { force = false } = {}) {
  const resolved = path.resolve(targetDir);
  for (const root of collectGitRoots(resolved)) {
    if (path.resolve(root) === PACKAGE_ROOT) continue;
    const relative = posixRelative(root, resolved);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) continue;
    const listed = fs.existsSync(path.join(root, ".gitmodules"));
    const isMount = gitlinkPaths(root).has(relative) || listed;
    if (!isMount) continue;
    const hasGit = fs.existsSync(path.join(resolved, ".git"));
    if (!hasGit) {
      return "空 gitlink 不得当成普通目录写入；gitlink 不得由 CLI 覆盖";
    }
    const ref = spawnSync("git", ["-C", resolved, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      timeout: 5000,
    });
    if (ref.status === 0 && ref.stdout.trim() === "HEAD") {
      return "detached HEAD 不得当成普通目录写入；gitlink 不得由 CLI 覆盖";
    }
    return force
      ? "--force 不得把 git-submodule 挂载点当成普通目录覆盖"
      : "git-submodule gitlink 不得由 CLI 覆盖";
  }
  return null;
}

function targetPath(targetDir, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const resolved = path.resolve(targetDir, normalized);
  const relative = path.relative(targetDir, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`模板路径越界：${relativePath}`);
  }
  return resolved;
}

function parseRepositoryIdentity(content) {
  const fields = {};
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = line.match(/^([a-z_][a-z0-9_-]*):\s*([^\s#]+)\s*$/);
    if (!match) throw new Error(`yss-project.yaml 第 ${index + 1} 行格式非法`);
    const [, key, value] = match;
    if (fields[key] !== undefined) throw new Error(`yss-project.yaml 不允许重复字段：${key}`);
    fields[key] = value;
  }
  const keys = Object.keys(fields).sort();
  if (keys.join(",") !== "repository_mode,schema_version") {
    throw new Error("yss-project.yaml 只能包含 schema_version 和 repository_mode");
  }
  if (fields.schema_version !== "1") throw new Error("yss-project.yaml 的 schema_version 必须为 1");
  if (!["template-source", "project-instance"].includes(fields.repository_mode)) {
    throw new Error("yss-project.yaml 的 repository_mode 必须是 template-source 或 project-instance");
  }
  return fields;
}

function renderTemplateFile(relativePath, content, variables) {
  if (relativePath === "yss-project.yaml") {
    const identity = parseRepositoryIdentity(content);
    if (identity.repository_mode !== "template-source") {
      throw new Error("模板 yss-project.yaml 必须声明 repository_mode: template-source");
    }
    const renderedContent = content.replace(
      /^repository_mode:\s*template-source$/m,
      "repository_mode: project-instance",
    );
    if (parseRepositoryIdentity(renderedContent).repository_mode !== "project-instance") {
      throw new Error("生成项目 yss-project.yaml 未转换为 project-instance");
    }
    return renderedContent;
  }

  if (relativePath === "AGENTS.md" || relativePath === "README.md") {
    let rendered = content
      .replace(/(\*\*项目名称：\*\*\s*)\[填写\]/g, `$1${variables.projectName}`)
      .replace(/(\*\*业务领域：\*\*\s*)\[填写\]/g, `$1${variables.businessDomain}`)
      .replace(/(\*\*团队规模：\*\*\s*)\[填写\]/g, `$1${variables.teamSize}`);
    if (relativePath === "README.md") {
      rendered = rendered.replace(/^# YSS (?:Strategic Design|业务方案设计) Harness/m, `# ${variables.projectName}`);
    }
    return rendered;
  }

  if (relativePath === "docs/agents/issue-tracker.md") {
    return content
      .replace(/^(platform:\s*)[^\s]+/m, `$1${variables.issueTracker}`)
      .replace(/(\| `platform` \| `)[^`]+(` \|)/, `$1${variables.issueTracker}$2`);
  }

  return content;
}

function buildCopyPlan(sourceDir, targetDir, snapshot, manifest, relativeDir = "") {
  const operations = [];
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const bundledRelativePath = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
    const relativePath = logicalTemplatePath(bundledRelativePath, snapshot);
    const sourcePath = path.join(sourceDir, entry.name);
    const destination = targetPath(targetDir, relativePath);
    if (entry.isDirectory()) {
      if (!shouldVisitDirectory(relativePath, manifest)) continue;
      operations.push({ type: "mkdir", relativePath, targetPath: destination });
      operations.push(...buildCopyPlan(sourcePath, targetDir, snapshot, manifest, bundledRelativePath));
      continue;
    }
    if (!shouldDistribute(relativePath, manifest, { init: true })) continue;
    if (!entry.isFile()) continue;
    const rendered = (manifest.renderPaths || []).includes(relativePath);
    operations.push({
      type: rendered ? "render" : "copy",
      relativePath,
      sourcePath,
      targetPath: destination,
    });
  }
  return operations.filter((operation) => {
    if (operation.type === "mkdir") return true;
    return shouldDistribute(operation.relativePath, manifest, { init: true });
  });
}

function inspectTargetDir(targetDir, force) {
  if (isInsideTemplateRoot(targetDir)) {
    throw new Error("目标目录不能位于模板快照内部");
  }
  const violation = gitlinkWriteViolation(targetDir, { force });
  if (violation) throw new Error(violation);
  if (!fs.existsSync(targetDir)) return { exists: false, clearEntries: false };
  if (pathKind(targetDir) !== "directory") throw new Error("目标目录必须是目录");
  const entries = fs.readdirSync(targetDir);
  if (entries.length > 0 && !force) {
    throw new Error("目标目录非空，当前主路径不支持覆盖已有内容");
  }
  return { exists: true, clearEntries: entries.length > 0 && force };
}

function prepareTargetDir(targetDir, targetState) {
  if (!targetState.exists) {
    fs.mkdirSync(targetDir, { recursive: true });
    return;
  }
  if (!targetState.clearEntries) return;
  for (const entry of fs.readdirSync(targetDir)) {
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
  }
}

function executePlan(operations, variables) {
  for (const operation of operations) {
    if (operation.type === "mkdir") {
      fs.mkdirSync(operation.targetPath, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(operation.targetPath), { recursive: true });
    if (operation.type === "render") {
      const rendered = renderTemplateFile(
        operation.relativePath,
        fs.readFileSync(operation.sourcePath, "utf8"),
        variables,
      );
      fs.writeFileSync(operation.targetPath, rendered);
    } else {
      fs.copyFileSync(operation.sourcePath, operation.targetPath);
    }
    fs.chmodSync(operation.targetPath, fs.statSync(operation.sourcePath).mode & 0o777);
  }
}

function fileHash(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function buildMetadata(variables, operations, targetDir, snapshot, manifestText) {
  const managedFiles = {};
  for (const operation of operations) {
    if (operation.type === "mkdir") continue;
    managedFiles[operation.relativePath] = {
      type: operation.type,
      contentHash: fileHash(operation.targetPath),
    };
  }
  return {
    metadataSchemaVersion: METADATA_SCHEMA_VERSION,
    templateName: "yss-harness-design-agent",
    profileId: PROFILE_ID,
    cliVersion: PACKAGE_MANIFEST.version,
    templateSource: TEMPLATE_SOURCE,
    templateCommit: snapshot.templateCommit,
    initializedAt: nowIsoString(),
    managedFilesManifestVersion: sha256(manifestText),
    variables: {
      projectName: variables.projectName,
      businessDomain: variables.businessDomain,
      teamSize: variables.teamSize,
      issueTracker: variables.issueTracker,
    },
    managedFiles,
  };
}

function verifyGeneratedInstance(targetDir, manifest) {
  for (const relativePath of [
    ...(manifest.instanceForbiddenPaths || []),
    ".yss-template.json",
  ]) {
    if (pathKind(targetPath(targetDir, relativePath)) !== "missing") {
      throw new Error(`初始化结果包含禁止分发的模板源资产：${relativePath}`);
    }
  }
  const identity = parseRepositoryIdentity(
    fs.readFileSync(targetPath(targetDir, "yss-project.yaml"), "utf8"),
  );
  if (identity.repository_mode !== "project-instance") {
    throw new Error("初始化结果的 yss-project.yaml 必须是 project-instance");
  }
  const agentsContent = fs.readFileSync(targetPath(targetDir, "AGENTS.md"), "utf8");
  const readmeContent = fs.readFileSync(targetPath(targetDir, "README.md"), "utf8");
  if (agentsContent.includes("[填写]") || readmeContent.includes("[填写]")) {
    throw new Error("初始化结果仍包含模板占位信息");
  }
  if (agentsContent.includes("进入实现时先读 `docs/process/implementation-repo-integration.md`")) {
    throw new Error("初始化结果仍把 yss-router / 实现仓接入当作本地硬门禁");
  }
  const verify = spawnSync(targetPath(targetDir, "scripts/verify-template"), [], {
    cwd: targetDir,
    encoding: "utf8",
  });
  const output = [verify.stdout, verify.stderr].filter(Boolean).join("");
  if (output) process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  if (verify.status !== 0) {
    throw new Error(`生成项目校验失败：scripts/verify-template${output ? `\n${output}` : ""}`);
  }
}

function initializeGitRepository(targetDir) {
  const result = spawnSync("git", ["init"], { cwd: targetDir, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "git init 执行失败");
}

function printVersion() {
  console.log(`create-yss-harness-design ${PACKAGE_MANIFEST.version}`);
}

function printHelp() {
  console.log(`create-yss-harness-design ${PACKAGE_MANIFEST.version}

USAGE
  $ create-yss-harness-design [COMMAND] [OPTIONS]

本 CLI 只从 yss-harness-design-agent 生成战略设计 project-instance。
它不是 create-yss-spec，也不进入 OpenAPI / 垂直切片实现。

COMMANDS
  (default) init                     在空目录生成战略设计 project-instance
  update                             检查 npm 最新版本；可用时安装更新
  upgrade                            update 的别名

OPTIONS
  --project-name <name>              项目名称；不传则进入交互输入
  --business-domain <domain>         业务领域；不传则进入交互输入
  --team-size <size>                 团队规模；不传则可留空，默认「待补充」
  --target-dir <dir>                 目标目录；不传则进入交互输入
  --issue-tracker local-markdown|github|gitlab
                                     默认 local-markdown
  --dry-run                          init 只预览；update 只查询不安装
  --force                            init 允许清空非空目录；update 即使最新版也重新安装
  --git-init                         初始化完成后执行 git init
  -h, --help                         显示本帮助信息
  -v, --version                      显示 CLI 版本

EXAMPLES
  $ npm create yss-harness-design@latest
  $ npx create-yss-harness-design@latest \\
      --project-name "Acme Strategy" \\
      --business-domain "供应链协同" \\
      --target-dir "./acme-strategy" \\
      --git-init
  $ npx create-yss-harness-design update --dry-run
  $ npx create-yss-harness-design upgrade
`);
}

async function runInit(argv = []) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }
  if (options.version) {
    printVersion();
    return;
  }
  const promptedOptions = await promptForMissingOptions(options);
  assertRequiredOptions(promptedOptions);
  const snapshot = readTemplateSnapshot();
  const manifestText = fs.readFileSync(BUNDLED_MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(manifestText);
  const targetDir = normalizeTargetDir(promptedOptions.targetDir);
  const targetState = inspectTargetDir(targetDir, promptedOptions.force);
  const operations = buildCopyPlan(
    BUNDLED_TEMPLATE_ROOT,
    targetDir,
    snapshot,
    manifest,
  );

  if (promptedOptions.dryRun) {
    console.log("dry-run 预览");
    console.log(`输出目录：${targetDir}`);
    console.log(`profile：${PROFILE_ID}`);
    for (const operation of operations) {
      console.log(`${operation.type}: ${operation.relativePath}`);
    }
    return;
  }

  const created = !targetState.exists;
  let backupRoot = null;
  if (targetState.clearEntries) {
    backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-yss-harness-design-backup-"));
    fs.cpSync(targetDir, backupRoot, { recursive: true });
  }
  try {
    prepareTargetDir(targetDir, targetState);
    executePlan(operations, promptedOptions);
    verifyGeneratedInstance(targetDir, manifest);
    fs.writeFileSync(
      targetPath(targetDir, TEMPLATE_METADATA_FILENAME),
      `${JSON.stringify(buildMetadata(promptedOptions, operations, targetDir, snapshot, manifestText), null, 2)}\n`,
    );
    if (promptedOptions.gitInit) initializeGitRepository(targetDir);
  } catch (error) {
    if (created && fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    } else if (backupRoot) {
      for (const entry of fs.readdirSync(targetDir)) {
        fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
      }
      fs.cpSync(backupRoot, targetDir, { recursive: true });
    }
    if (backupRoot) fs.rmSync(backupRoot, { recursive: true, force: true });
    throw error;
  }
  if (backupRoot) fs.rmSync(backupRoot, { recursive: true, force: true });

  console.log("初始化完成");
  console.log(`输出目录：${targetDir}`);
  console.log("下一步建议：");
  console.log(`1. cd ${targetDir}`);
  console.log("2. 读取 AGENTS.md 与 CONTEXT.md");
  console.log("3. 用 yss-strategic-design 做入口分诊；本地终点是业务方案交接");
  console.log("4. 数字人运行时绑定仍按 docs/templates/digital-human-runtime-profile-template.md 手工 duplicate");
}

async function runCli(argv = []) {
  if (HELP_FLAGS.has(argv[0]) || argvIncludesFlag(argv, HELP_FLAGS)) {
    printHelp();
    return;
  }
  if (VERSION_FLAGS.has(argv[0]) || argvIncludesFlag(argv, VERSION_FLAGS)) {
    printVersion();
    return;
  }
  if (["attach", "sync"].includes(argv[0])) {
    throw new Error(`v1 不支持 ${argv[0]}，请使用空目录 init`);
  }
  if (UPDATE_COMMANDS.has(argv[0])) {
    runUpdate(argv.slice(1), {
      packageRoot: PACKAGE_ROOT,
      currentVersion: PACKAGE_MANIFEST.version,
    });
    return;
  }
  await runInit(argv);
}

function argvIncludesFlag(argv, flags) {
  return argv.some((arg) => flags.has(arg));
}

module.exports = { runCli };
