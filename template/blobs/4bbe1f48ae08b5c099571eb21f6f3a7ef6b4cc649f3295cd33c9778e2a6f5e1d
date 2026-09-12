import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "../vendor/yaml.mjs";
import {
  BIOLOGICAL_ROLE_ID,
  countersignRuleForGate,
  loadDigitalHumanRoles,
  collectCountersignGateIds
} from "./digital-human-roles.mjs";
import { ROOT } from "./lifecycle-registry.mjs";

import { assertApprovalUserDecision } from "./user-decision-reuse.mjs";

const DECISIONS = new Set(["approved", "rejected", "vetoed"]);
const ACTOR_KINDS = new Set(["digital-human", "biological-human", "orchestrator"]);

function fail(message) {
  throw new TypeError(message);
}

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) fail(`${field} 不能为空`);
}

function yamlFromFile(filePath, label) {
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") fail(`缺少${label}: ${filePath}`);
    throw error;
  }
  const document = parseDocument(source, { maxAliasCount: 0, uniqueKeys: true });
  if (document.errors.length > 0) fail(`无法解析${label}: ${document.errors[0].message}`);
  const value = document.toJS({ maxAliasCount: 0 });
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}必须是对象`);
  return value;
}

export function loadApprovalRecord(filePath) {
  return yamlFromFile(filePath, "会签记录");
}

export function resolveApprovalRef(approvalRef, fromFile = ROOT) {
  requireString(approvalRef, "approval_ref");
  if (path.isAbsolute(approvalRef)) return approvalRef;
  const fromRoot = path.join(ROOT, approvalRef);
  if (existsSync(fromRoot)) return fromRoot;
  return path.resolve(path.dirname(fromFile), approvalRef);
}

export function validateApprovalRecord(record, { rolesDoc, requireApproved = false, ...decisionOptions } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) fail("会签记录必须是对象");
  if (record.schema_version !== 1) fail("会签记录 schema_version 必须为 1");
  requireString(record.gate_id, "gate_id");
  requireString(record.decision, "decision");
  if (!DECISIONS.has(record.decision)) fail("decision 必须是 approved、rejected 或 vetoed");
  requireString(record.actor_kind, "actor_kind");
  if (!ACTOR_KINDS.has(record.actor_kind)) fail("actor_kind 无效");
  requireString(record.role_id, "role_id");
  requireString(record.runtime_id, "runtime_id");
  requireString(record.principal_ref, "principal_ref");

  const registry = rolesDoc || loadDigitalHumanRoles();
  const runtimeIds = new Set((registry.runtimes || []).map((runtime) => runtime.id));
  if (!runtimeIds.has(record.runtime_id)) fail(`未知 runtime_id: ${record.runtime_id}`);
  if (record.actor_kind === "orchestrator") fail("编排器门禁不使用会签记录关闭");

  const rule = countersignRuleForGate(registry.gate_policy, record.gate_id);
  if (!rule) fail(`${record.gate_id} 不是会签门禁；evidence_only / orchestrator 门禁不写 approval-record`);

  if (requireApproved && record.decision !== "approved") {
    fail(`${record.gate_id} 会签 decision 必须为 approved 才能关闭门禁`);
  }
  if (record.decision === "approved" && record.biological_veto === true) {
    fail(`${record.gate_id} 已被生物人否决，不能标为 approved`);
  }

  if (rule.bucket === "biological_human") {
    if (record.actor_kind !== "biological-human") fail(`${record.gate_id} 必须由生物人会签`);
    if (record.role_id !== BIOLOGICAL_ROLE_ID) fail(`${record.gate_id} 的 role_id 必须为 ${BIOLOGICAL_ROLE_ID}`);
    if (requireApproved) assertRecordUserDecision(record, registry, decisionOptions);
    return rule;
  }

  if (record.actor_kind !== "digital-human") fail(`${record.gate_id} 必须由数字人会签`);
  if (!rule.countersigners.includes(record.role_id)) {
    fail(`${record.gate_id} 会签角色必须是 ${rule.countersigners.join(" / ")}`);
  }
  if (rule.drafter && record.role_id === rule.drafter) fail(`${record.gate_id} 起草者不得会签自己`);
  if (Array.isArray(record.countersigner_role_ids) && rule.drafter && record.countersigner_role_ids.includes(rule.drafter)) {
    fail(`${record.gate_id} 起草者不得出现在 countersigner_role_ids`);
  }
  if (rule.drafter && record.drafter_role_id && record.drafter_role_id !== rule.drafter) {
    fail(`${record.gate_id} drafter_role_id 必须为 ${rule.drafter}`);
  }
  if (requireApproved) assertRecordUserDecision(record, registry, decisionOptions);
  return rule;
}

export function validateApprovalRecordFile(filePath, options = {}) {
  return validateApprovalRecord(loadApprovalRecord(filePath), options);
}

export function assertApprovedGateHasValidApproval(gateId, gateState, { checkpointPath } = {}) {
  const rolesDoc = loadDigitalHumanRoles();
  const countersignGates = new Set(collectCountersignGateIds(rolesDoc.gate_policy));
  if (!countersignGates.has(gateId)) return;
  if (!gateState || typeof gateState !== "object") fail(`${gateId} 缺少门禁状态`);
  if (gateState.status !== "approved") return;
  if (!gateState.approval_ref || !String(gateState.approval_ref).trim()) {
    fail(`${gateId} 已 approved 但缺少 approval_ref`);
  }
  const resolved = resolveApprovalRef(gateState.approval_ref, checkpointPath || ROOT);
  if (!existsSync(resolved)) fail(`${gateId} 的 approval_ref 不可读: ${gateState.approval_ref}`);
  const record = loadApprovalRecord(resolved);
  if (record.gate_id !== gateId) fail(`${gateId} 的会签记录 gate_id 不匹配`);
  if (rolesDoc.user_decision_policy.gates.includes(gateId) && (!gateState.subject_ref || gateState.subject_ref !== record.subject_ref || !gateState.approval_scope?.length || JSON.stringify([...gateState.approval_scope].sort()) !== JSON.stringify([...(record.approval_scope || [])].sort()))) fail('user-decision-subject-mismatch: 当前 gate 与会签资产范围不一致');
  validateApprovalRecord(record, { rolesDoc, requireApproved: true });
}

export function assertCheckpointApprovals(checkpoint, checkpointPath) {
  const gates = checkpoint?.gates;
  if (!gates || typeof gates !== "object") return;
  if (checkpoint.artifacts?.['artifact.spec']?.ref && gates['gate.spec-baseline-approved']?.status === 'approved' && checkpoint.artifacts['artifact.spec'].ref !== gates['gate.spec-baseline-approved'].subject_ref) fail('user-decision-subject-mismatch: Spec 与当前批准不一致');
  for (const [gateId, state] of Object.entries(gates)) {
    assertApprovedGateHasValidApproval(gateId, state, { checkpointPath });
  }
}

function assertRecordUserDecision(record, registry, options) {
  if (!registry.user_decision_policy.gates.includes(record.gate_id)) return;
  return assertApprovalUserDecision(record, registry, options);
}

// Drafts may wait for a reply. Advancement derives requirements from current state,
// rather than trusting a caller-supplied completed_work_unit marker alone.
export function assertCheckpointUserDecisions(checkpoint) {
  if (checkpoint.repository_mode !== 'project-instance') return;
  const advancing = ['running','completed'].includes(checkpoint.status) || (checkpoint.mode === 'resume' && checkpoint.status === 'routing');
  if (!advancing) return;
  if (checkpoint.status === 'completed' && (checkpoint.blockers?.length || Object.values(checkpoint.gates || {}).some(gate => !['approved','not-applicable'].includes(gate.status)))) fail('user-decision-completion-blocked: 尚有阻塞或未通过门禁');
  const required = new Set();
  const artifacts = checkpoint.artifacts || {};
  const gates = checkpoint.gates || {};
  for (const [artifact, gate] of [['artifact.spec','gate.spec-baseline-approved'],['artifact.prototype-confirmation','gate.user-confirmation'],['artifact.strategic-design-handoff','gate.strategic-design-handoff-approved']]) {
    if (artifacts[artifact]?.status === 'approved') required.add(gate);
  }
  const units = [checkpoint.next_work_unit,checkpoint.stage_trace?.current_work_unit,checkpoint.stage_trace?.completed_work_unit];
  if (units.some(unit => ['work-unit.prototype-design','work-unit.business-ticket-formalization','work-unit.strategic-design-handoff'].includes(unit)) || ['stage.product-design','stage.ticket-formalization'].includes(checkpoint.stage)) required.add('gate.spec-baseline-approved');
  const designPresent = ['artifact.prototype-confirmation','artifact.interaction-spec','artifact.state-matrix','artifact.low-fidelity-prototype','artifact.high-fidelity-html-prototype'].some(id => artifacts[id] && artifacts[id].status !== 'not-applicable');
  if (designPresent && (checkpoint.stage === 'stage.ticket-formalization' || units.some(unit => ['work-unit.business-ticket-formalization','work-unit.strategic-design-handoff'].includes(unit)))) required.add('gate.user-confirmation');
  if (checkpoint.status === 'completed' || checkpoint.stage_trace?.completed_work_unit === 'work-unit.strategic-design-handoff') required.add('gate.strategic-design-handoff-approved');
  for (const id of required) {
    if (gates[id]?.status !== 'approved') fail(`user-decision-response-required: ${id}`);
    assertApprovedGateHasValidApproval(id,gates[id]);
  }
  for (const entry of checkpoint.human_review?.decision_reuse || []) {
    const record = loadApprovalRecord(resolveApprovalRef(gates[entry.target_gate]?.approval_ref));
    if (record.decision_reuse_ref !== entry.ref) fail('user-decision-reuse-invalid: checkpoint 与会签复用引用不一致');
  }
}

export function assertStrategicWorkUnitDecision(workUnit, state, options = {}) {
  const roles = options.rolesDoc || loadDigitalHumanRoles();
  for (const boundary of roles.user_decision_policy.work_unit_gates?.[workUnit] || []) {
    const gate = state.gates?.[boundary];
    if (gate?.status === 'approved') {
      assertApprovedGateHasValidApproval(boundary,gate);
      continue;
    }
    const requirement = (state.user_decisions || state.human_review?.user_decisions || []).find(item => item.boundary === boundary);
    if (!requirement) fail(`user-decision-response-required: ${boundary}`);
    assertApprovalUserDecision({gate_id:boundary,subject_ref:requirement.subject_ref,approval_scope:requirement.scope,user_decision_ref:requirement.user_decision_ref,decision_reuse_ref:requirement.decision_reuse_ref},roles,options);
  }
}
