import { validateHarnessSkillScope } from './harness-skill-scope.mjs';
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "../vendor/yaml.mjs";
import { loadSkillRegistry } from "./skill-registry.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function fail(message) {
  throw new TypeError(message);
}

export function validateSkillGovernance({ read = (relative) => readFileSync(path.join(ROOT, relative), "utf8"), exists = (relative) => existsSync(path.join(ROOT, relative)) } = {}) {
  // 当前分支只承载战略设计与产品设计事实；工程页面技能已由主分支维护。
  // 因此这里只验证本分支注册表、兼容 alias 与退役目录，不加载工程技能。

  validateHarnessSkillScope(ROOT);
  const registry = loadSkillRegistry();
  const canonicalIds = new Set(registry.skills.map((skill) => skill.id));
  const aliases = new Map(registry.skills.flatMap((skill) => skill.aliases.map((alias) => [alias, skill.id])));
  const legacy = new Set(["research"]);
  for (const alias of legacy) {
    if (exists(`.agents/skills/${alias}`)) fail(`legacy alias 不得存在独立 canonical 目录: ${alias}`);
    if (!aliases.has(alias)) fail(`legacy alias 未登记: ${alias}`);
  }
  if (exists(".agents/skills/high-fidelity-html-prototype") || aliases.has("high-fidelity-html-prototype")) {
    fail("high-fidelity-html-prototype 已退役，不得保留物理目录或运行时 alias");
  }
  for (const required of ["diagnosing-bugs", "resolving-merge-conflicts", "llm-wiki"]) {
    if (!canonicalIds.has(required) || !exists(`.agents/skills/${required}/SKILL.md`)) {
      fail(`AGENTS.md 强制本地技能未完整分发或登记: ${required}`);
    }
  }
  for (const stale of [".agents/skills/.yss-skills-manifest.json", ".agents/rules/yss-ai-skills.md"]) {
    if (exists(stale)) fail(`不得保留绕过技能注册表的旧实现技能清单: ${stale}`);
  }
  const cursorRules = read(".cursorrules");
  if (!cursorRules.includes("docs/agents/yss-skill-registry.yaml") || !cursorRules.includes("Strategic Design Handoff")) {
    fail(".cursorrules 必须指向技能注册表并声明战略设计终止边界");
  }
  const prototypeSkill = read(".agents/skills/yss-prototype-stage/SKILL.md");
  const prototypeContract = read(".agents/skills/yss-prototype-stage/scripts/prototype-contract.mjs");
  if (!prototypeSkill.includes("H1/H2") || !prototypeContract.includes("schema_version 必须为 4") || !prototypeSkill.includes("Visual Baseline schema v1")) {
    fail("yss-prototype-stage 必须提供 H1/H2 路由、Prototype Evidence schema v4 与 Visual Baseline schema v1 合同校验");
  }
  const lock = JSON.parse(read("skills-lock.json"));
  const productDesignPath = lock.skills?.platform?.[".codex/skills"]?.["product-design"]?.skillPath;
  if (!productDesignPath || !exists(productDesignPath)) fail("product-design 平台技能锁定入口不存在");
  const contractDocument = parseDocument(read(".agents/skills/yss-strategic-design/references/orchestration-contract.yaml"), { maxAliasCount: 0, uniqueKeys: true });
  if (contractDocument.errors.length > 0) fail(`战略编排合同无法解析: ${contractDocument.errors[0].message}`);
  const contract = contractDocument.toJS({ maxAliasCount: 0 });
  for (const forbidden of ["ticket_formalization", "ticket_role_transition", "review_input", "backend_scaffold", "scaffold_work_unit_policy", "post_scaffold_generated_code_policy", "release_readiness", "ready_for_agent", "frontend_implementation_plan", "frontend_implementation_verification"]) {
    if (contract[forbidden] !== undefined) fail(`战略编排合同不得持有下游执行段: ${forbidden}`);
  }
  if (contract.profile_registry?.terminal_work_unit !== "work-unit.strategic-design-handoff" || contract.profile_registry?.terminal_next_route !== null) {
    fail("战略编排合同必须在 Strategic Design Handoff 终止");
  }
  if (contract.task_package?.contract?.kinds?.includes("slice-implementation")) {
    fail("战略设计任务包不得声明 slice-implementation 合同类型");
  }
  for (const skill of registry.skills) {
    if (!canonicalIds.has(skill.id)) fail(`注册表 canonical skill 无效: ${skill.id}`);
    if (skill.maturity === "deprecated") {
      for (const field of ["replaced_by", "migration_deadline", "cleanup_status"]) {
        if (!skill[field] || typeof skill[field] !== "string") fail(`deprecated 技能缺少 ${field}: ${skill.id}`);
      }
    }
  }
  return { checked: true, legacy_aliases: legacy.size };
}
