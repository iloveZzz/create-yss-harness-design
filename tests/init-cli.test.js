const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { treeHash } = require("../src/template-hash");
const { shouldDistribute } = require("../src/manifest");

const repoRoot = path.resolve(__dirname, "..");
const cliBin = path.join(repoRoot, "bin/create-yss-harness-design.js");
const packageVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
const metadataFileName = ".yss-harness-design.json";

function runCli(args, { input = "", timeout = 120000 } = {}) {
  return spawnSync(process.execPath, [cliBin, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    input,
    timeout,
  });
}

function runTemplateSync() {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts/sync-template.js")], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
    env: process.env,
  });
}

test("stable template commit produces byte-identical snapshot metadata", () => {
  const first = runTemplateSync();
  assert.equal(first.status, 0, first.stderr);
  const firstSnapshot = fs.readFileSync(path.join(repoRoot, "template.snapshot.json"));

  const second = runTemplateSync();
  assert.equal(second.status, 0, second.stderr);
  const secondSnapshot = fs.readFileSync(path.join(repoRoot, "template.snapshot.json"));

  assert.deepEqual(secondSnapshot, firstSnapshot);
});

test("help and version do not write files", () => {
  const help = runCli(["--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /create-yss-harness-design/);
  assert.match(help.stdout, /不是 create-yss-spec/);
  const version = runCli(["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, new RegExp(`create-yss-harness-design ${packageVersion}`));
});

test("v1 rejects attach and sync", () => {
  const attach = runCli(["attach", "--target-dir", "."]);
  assert.notEqual(attach.status, 0);
  assert.match(attach.stderr, /v1 不支持 attach/);
});

test("dry-run does not create the target directory", () => {
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-yss-harness-design-"));
  const targetDir = path.join(sandboxDir, "preview");
  const result = runCli([
    "--project-name",
    "Preview",
    "--business-domain",
    "供应链协同",
    "--target-dir",
    targetDir,
    "--dry-run",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry-run 预览/);
  assert.equal(fs.existsSync(targetDir), false);
});

test("non-empty target is rejected without --force", () => {
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-yss-harness-design-"));
  const targetDir = path.join(sandboxDir, "existing");
  fs.mkdirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, "keep.txt"), "no");
  const result = runCli([
    "--project-name",
    "Existing",
    "--business-domain",
    "供应链协同",
    "--target-dir",
    targetDir,
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /目标目录非空/);
  assert.equal(fs.readFileSync(path.join(targetDir, "keep.txt"), "utf8"), "no");
});

test("init generates a strategic design project-instance", () => {
  const snapshot = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "template.snapshot.json"), "utf8"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "template.manifest.json"), "utf8"),
  );
  assert.equal(snapshot.profileId, "harness.business-ddd-strategy-handoff");
  assert.match(snapshot.templateCommit, /^[0-9a-f]{40}$/);
  assert.equal(snapshot.snapshotHash, treeHash(path.join(repoRoot, "template")));
  assert.equal(shouldDistribute("docs/templates/openapi-spec-template.yaml", manifest), false);
  assert.equal(shouldDistribute("docs/process/harness-profile.yaml", manifest), true);

  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-yss-harness-design-"));
  const targetDir = path.join(sandboxDir, "demo-project");
  const result = runCli(
    [
      "--project-name",
      "Demo Strategy",
      "--business-domain",
      "供应链协同",
      "--team-size",
      "8",
      "--target-dir",
      targetDir,
    ],
    { timeout: 180000 },
  );
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  assert.match(result.stdout, /初始化完成/);
  assert.match(result.stdout, /Strategic Design Handoff/);

  assert.equal(
    fs.readFileSync(path.join(targetDir, "yss-project.yaml"), "utf8").includes(
      "repository_mode: project-instance",
    ),
    true,
  );
  const metadata = JSON.parse(fs.readFileSync(path.join(targetDir, metadataFileName), "utf8"));
  assert.equal(metadata.metadataSchemaVersion, 1);
  assert.equal(metadata.templateName, "yss-harness-design-agent");
  assert.equal(metadata.profileId, "harness.business-ddd-strategy-handoff");
  assert.equal(metadata.cliVersion, packageVersion);
  assert.match(metadata.templateCommit, /^[0-9a-f]{40}$/);
  assert.equal(typeof metadata.managedFiles, "object");

  assert.equal(fs.existsSync(path.join(targetDir, "docs/process/harness-profile.yaml")), true);
  assert.equal(
    fs.existsSync(path.join(targetDir, "docs/templates/strategic-design-handoff-template.yaml")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(targetDir, ".agents/skills/yss-strategic-design/SKILL.md")),
    true,
  );

  for (const forbidden of [
    ".template-source",
    "wiki",
    "docs/templates/openapi-spec-template.yaml",
    "docs/templates/vertical-slice-ticket-template.md",
    "docs/process/implementation-repo-integration.md",
    "scripts/verify-yss-router-scenarios",
    ".yss-template.json",
  ]) {
    assert.equal(fs.existsSync(path.join(targetDir, forbidden)), false, forbidden);
  }

  const agents = fs.readFileSync(path.join(targetDir, "AGENTS.md"), "utf8");
  const readme = fs.readFileSync(path.join(targetDir, "README.md"), "utf8");
  assert.match(agents, /Demo Strategy/);
  assert.doesNotMatch(agents, /\[填写\]/);
  assert.match(readme, /^# Demo Strategy/m);
  assert.doesNotMatch(agents, /进入实现时先读 `docs\/process\/implementation-repo-integration.md`/);
});
