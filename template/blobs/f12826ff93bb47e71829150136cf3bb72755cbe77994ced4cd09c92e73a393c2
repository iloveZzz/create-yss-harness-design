---
name: yss-strategic-design
description: 编排 YSS 产品或模块从机会调研到业务边界与协作、Spec、页面原型、业务级 Ticket 和业务方案交接；不进入下游技术设计、实现、审查或发布。
---

# YSS 业务方案设计

这是生命周期主控 skill：负责识别阶段、判定影响面、检查产物与门禁、选择下一工作单元并验收结果。业务实现必须交给对应的 Matt/YSS 专项 skill；本 skill 不替代它们。

文档输出时按 `lifecycle-document-output` 条件调用 `i-have-adhd`，读取 `docs/process/document-writing.md`；作用域仅限当前产物，派发时传递条件及引用。

## 入口与边界

Plan 入口读取 `docs/plan/README.md` 和 `docs/process/plan-migration.md`，按注册表退出条件核查战略输入。关键未决项阻断进入 Spec；非关键项须有责任人、解决时点和接收方。只使用 Plan 标识，Plan 后仍保留 Spec、原型、业务 Ticket 与交接阶段。

1. 先读取 `yss-project.yaml`、`CONTEXT.md`、相关 ADR、map.md、checkpoint 和当前资产。
2. `repository_mode=template-source` 只走模板维护流程；命中产品流程时返回 `blocked: template-source-product-artifact-forbidden`，不得生成产品 Spec、原型、OpenAPI 或切片 Ticket。
3. `repository_mode=project-instance` 以 `docs/process/lifecycle-registry.yaml`、`harness-process-tailoring.md` 和本目录 references 为唯一阶段、门禁和裁剪事实源。数字人角色、阶段协作组、运行时绑定与会签级别以 `docs/agents/digital-human-roles.yaml` 为准；职称实例不另起编排器。
4. 模式：`route` 只读规划；`orchestrate` 有界推进；`resume` 重建后推进；`audit` 严格只读。未明确时使用 `route`。

## 业务方案设计 Harness profile

本分支默认面向内部兼容 ID `harness.business-ddd-strategy-handoff`：目标用户只有 `role.product-manager`（产品）、`role.requirements-manager`（需求）和 `role.business`（商务）；`role.lifecycle-orchestrator` 仅作为流程控制平面。项目管理、工程、测试和发布角色不在本分支注册或派发，由业务方案交接后的下游研发 profile 接管。

该 profile 的本地生命周期在业务级 Ticket 和业务方案交接处结束：

`入口分诊 → 机会与目标 → 业务故事 → 业务边界与协作 → 规则、例子与疑问 → 方案决策包 → Spec → 页面验证 → 业务级 Ticket → 业务方案交接`

业务方案交接包必须同时引用已批准且版本当前的 `artifact.domain-strategy`、`artifact.stage-decision-package`、Spec、已批准 UI 依据和业务级 Ticket 集，并以受支持的交接协议 `docs/templates/strategic-design-handoff-template.yaml` / `docs/process/schemas/strategic-design-handoff.schema.json` 的结构交给下游研发团队。新设计保留原型与视觉包要求；确无 UI 改动的既有页面使用 `existing-ui-baseline` v1 与 Strategic Handoff v5，按 `docs/process/existing-ui-baseline.md` 核验固定源码、真实动作/API/截图和当前产品确认，不能把截图自行升格为已批准原型。它必须携带当前根 `CONTEXT.md` 的 `source_context_snapshot`、结构化 `context_delta`，并声明目标仓在进入技术设计前完成本地 `context_reconciliation`。v1 交接包只读并返回 `migration-required`，不得从自由文本猜测术语映射。下游团队的下一工作单元由内部技能 `yss-technical-design` 接管；本 profile 不生成 OpenAPI、技术设计合同、Slice Implementation Contract、代码或发布资产。需要继续推进时，必须新建或切换到下游研发团队的 project profile，不能在本 profile 中越过 `work-unit.strategic-design-handoff`。

Matt 的 `ask-matt`、`grill-me`、`grill-with-docs`、`to-spec`、`to-tickets`、`triage` 和 `wayfinder` 保留为显式兼容入口；`implement` 已从本分支移除。默认路径是本 skill 持有的原生工作单元，由本编排器创建正式资产、维护状态并在会签门禁暂停。兼容入口不得自动调用它们或代替其创建正式资产；Matt 只导航，不得写生命周期资产或改变门禁/Ticket 状态；任何写入前回交本编排器。

## 不可裁剪的主链

机会与目标 → 业务故事 → 业务边界与协作 → 规则、例子与疑问 → 方案决策包 → Spec/功能架构 → 产品设计与页面验证 → 业务级 Ticket 正式化 → 业务方案交接。

## 面向业务角色的默认问法

默认通过 Agent 引导完成，不要求产品、需求或商务直接填写内部合同字段。Agent 必须先用业务人员熟悉的语言问清：

1. 谁遇到了什么问题，想得到什么结果；
2. 事情通常怎样一步步发生；
3. 每一步由谁负责，结果交给谁；
4. 有哪些规则、例外和仍待确认的问题；
5. 哪一小段可以独立交付并让用户得到结果；
6. 用哪些例子和证据证明结果正确。

需要区分业务板块的重要性时，不要求用户选择内部分类。Agent 改问“是否直接决定关键结果、是否存在独特规则、是否可复用或外购”，再提出“重点业务、必要支撑、通用能力”建议，由业务负责人确认。

## 业务方案总览

每轮路由先输出一页派生的“业务方案总览”，依次引用机会与目标、业务故事、业务责任区、规则与例子、Spec、页面验证、业务 Ticket 和交接状态。总览只显示当前状态、权威资产引用、未决问题、责任人和下一步，不复制各资产正文、不成为新的事实源，也不新增生命周期门禁。内部稳定 ID 和字段映射只在 Agent 运行结果或维护者诊断中显示；普通业务说明不附带术语对照表。

裁剪只允许将未命中的条件门禁标记为 `not-applicable` 并写原因；不得删除主阶段、已命中的门禁或必需产物。阶段是否完成取决于“内容 + 审查结论 + 上游新鲜度 + 可读证据”，文件存在不算通过。每个 `project-instance` 工作单元在请求批准或进入下一工作单元前，必须把已确认稳定术语回写到项目根目录唯一 `CONTEXT.md`，并生成通过 `scripts/verify-context-reconciliation` 的横切证据；候选术语、错误路径、伪锚点、作用域冲突或双摘要漂移均返回 `blocked`，不新增门禁。

上面的完整主链是下游研发模板的兼容链。本分支启用业务上游 profile 时，使用 profile 的有界主链，并把业务级 Ticket 与业务方案交接作为终点；该裁剪不是跳过已命中的门禁，而是明确本地 Harness 的职责边界。

## 阶段路由与技能

| 阶段 | 必需产物/门禁 | 工作单元与技能 | 通过条件 |
|---|---|---|---|
| 入口分诊 | 身份、影响面、最近可信阶段 | `yss-strategic-design` + `triage` / `wayfinder`（兼容入口） | `yss-project.yaml` 合法且影响面可解释 |
| 机会、目标与业务故事 | 用户/MVP/非目标/成功标准、业务故事、规则示例、测试 seam；需要时补充业务边界与规则设计和方案决策包 | `work-unit.plan-opportunity` + `work-unit.plan-requirements` + `work-unit.domain-strategy-design` + `work-unit.stage-decision`；市场/竞品事实用 `competitive-intelligence`，技术/标准事实用 `yss-research:technical-evidence`，业务边界与方案决策证据用 `yss-research:strategy-evidence`；业务词汇和责任区梳理用 `domain-modeling`；`grill-with-docs` 为兼容入口 | 未决事实已由 `yss-research` 核验或 handoff；业务板块、责任区、统一业务词汇、协作关系和不可违反规则可审查；方案决策包完成必要确认 |
| Spec/功能架构 | Spec、产品总体设计、功能架构；必要时 Spec Delta | 原生 `work-unit.spec-synthesis`；`to-spec` 为兼容入口 | 初稿先为 `ready-for-human`；只有 Spec baseline 会签批准后资产才为 `approved` 并进入下游 |
| 原型设计 | 交互说明、低保真、状态矩阵、H1/H2 原型交付物、评审记录 | `yss-design-system` → `yss-prototype-stage` → 默认 `yss-antdv-next-design` / 显式 React 兼容 `yss-antd-design`（仅原型事实）→ Codex `product-design:index`（非 Codex 交付等价合同） | `gate.prototype-reviewed`、`gate.prototype-verified`、`gate.user-confirmation` 均有证据 |
| 业务方案交接 | 业务方案交接包、研发待决问题和证据索引 | `yss-stage-decision` + `yss-strategic-design`；下游研发团队接管技术设计 | `artifact.domain-strategy`、`artifact.stage-decision-package`、Spec、适用的原型或既有 UI 基线、业务级 Ticket 已批准且版本当前，交接包字段完整；本地不生成技术模型 |
| 技术分析（下游兼容阶段） | OpenAPI Draft/Freeze、数据架构、工程基线和架构审查 | 下游研发团队的技术技能 | 不属于本 profile 的本地工作单元 |
| Ticket 正式化 | 业务级功能 Ticket 集（范围、优先级、验收、依赖、风险） | 本 profile 使用 `work-unit.business-ticket-formalization`；`to-tickets` 为兼容入口 | 业务行为可验证且不含 Adapter/Application/Domain/Infrastructure 技术拆分；下游再细化垂直切片 |
| 下游接管 | 技术设计、工程契约和实现 | 交接给下游研发团队；本 skill 不调用实现技能 | 业务方案交接包已批准且下游上下文、责任人和版本边界完整 |

Plan → Spec（含正式草稿、恢复与显式 `to-spec`）写入前，按 `docs/plan/entry-review.md` 持久化审阅包并运行 `node scripts/verify-plan-spec-entry <state.yaml>`。检查默认 pending，缺项、过期或无真实回复即阻断；独立调研可继续。

## 结果与暂停

凡主控向数字人角色或独立运行时正式派发生命周期工作单元，都必须通过结构化任务包派发，并返回 `Workflow Execution Result`（workflow reference、skill、changed files、`context_reconciliation`、evidence refs、actual verification、deferred seams、drift/new impacts）。任务包使用 `docs/process/schemas/digital-human-task-package.schema.json`，由 `scripts/verify-digital-human-task-package` 校验；其中 `role_id`、`runtime_id`、`execution_state`、`contract.kind/id/version`、允许写路径、预期证据和汇合引用必须完整。Plan、Spec、原型、业务 Ticket、业务方案交接和模板维护分别绑定各自的生命周期资产或维护 checkpoint。Slice Implementation Contract、代码和发布均属于下游 profile，不得在本地任务包中创建。缺少可读证据、`context_reconciliation` 未通过、`stale`、`violation`、`drift`、`new_impacts` 或阻塞信号时不得标记 completed。实现授权不包含 Git commit/push 授权；“做完提交”等自然语言意向不构成上述结构化 Git 授权。

输出固定包含：模式、当前阶段、影响面、资产/门禁状态、`context_reconciliation`、证据、业务 Ticket 状态、阻塞项、本轮动作、下一工作单元、暂停/继续理由、Ticket 同步和 Git checkpoint 判断。启用本 profile 时，`work-unit.strategic-design-handoff` 完成后 `next_route` 必须为 `null`；不得生成垂直切片、`ready-for-agent`、OpenAPI、下游技术设计或实现资产。兼容入口的输入必须回交本编排器验收；`implement` 请求直接 `blocked` 并转交下游研发团队。暂停会签时必须输出门禁 ID、指定 `role_id`、`runtime_id` 和会签文件路径。任务包的 `core_skills` / `forbidden_skills` 必须从角色注册表复制。

详细执行循环、readiness、审查快照、状态传播和 Matt 边界见 [orchestration.md](references/orchestration.md)、[orchestration-contract.yaml](references/orchestration-contract.yaml)、[artifact-dependencies.md](references/artifact-dependencies.md) 和 [state-model.md](references/state-model.md)。

## 便携交接工具

批准交接后由 `scripts/strategic-handoff export --source-root <source> --handoff <ref> --output <new-directory> --zip` 冻结原始资产；规则身份、批准绑定、包内索引和完整快照差异以 `docs/process/strategic-handoff-package.md` 为准。接收方先 `verify` 再 `import`，目标根术语对账和 `verify-strategic-handoff-consumption` 通过后进入战术设计/相关切片；工具不能代替生命周期批准。

## 当前关键决定

保留 Plan 审阅包确认；Spec 基线和命中影响的产品设计分别核验真实负责人的当前回复。按 `docs/agents/digital-human-roles.yaml.user_decision_policy`、`scripts/verify-approval-record --require-approved` 和 checkpoint 校验推进，数字人不能代答。等待状态可保存，缺当前决定不得恢复流转或宣布完成。交接复用按 `docs/process/strategic-handoff-package.md`，引用同一证明并核验范围、依据和风险；无变化不重复询问，变化只补受影响确认。
