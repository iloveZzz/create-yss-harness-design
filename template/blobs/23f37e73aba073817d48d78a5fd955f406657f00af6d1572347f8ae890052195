# AGENTS.md — 战略设计 Harness 入口

> 本文件只保存常驻路由、硬门禁和禁止事项。生命周期 ID 以 `docs/process/lifecycle-registry.yaml` 为准；本仓边界以 `docs/process/harness-profile.yaml` 为准；影响面裁剪见 `docs/process/harness-process-tailoring.md`。

**项目名称：** [填写]
**业务领域：** [填写]
**团队规模：** [填写]

## 1. 仓库身份

每个任务先读根目录 `yss-project.yaml`：

- `template-source` 只维护模板，不生成具体产品的 Plan、Spec、原型、业务级 Ticket 或交接包。
- `project-instance` 使用 `harness.business-ddd-strategy-handoff`；本地终点为 `work-unit.strategic-design-handoff`。
- 文件缺失、schema 不支持或模式非法时停止路由并执行迁移检查；不得根据目录、Git 远程或占位符猜测身份。

## 2. 单一事实来源

| 事实 | 权威资产 |
|---|---|
| 业务词汇 | 根 `CONTEXT.md` |
| 本仓职责与允许 / 禁止工作单元 | `docs/process/harness-profile.yaml` |
| 生命周期 ID 与条件门禁 | `docs/process/lifecycle-registry.yaml`；`docs/process/lifecycle-artifact-map.md` 仅为派生视图 |
| 影响面与维护强度 | `docs/process/harness-process-tailoring.md`、`docs/process/maintenance-intensity.yaml` |
| 技能身份与路由 | `docs/agents/yss-skill-registry.yaml`（`status: active`；由生命周期消费，Router 不消费）；来源与投影见 `skills-lock.json` |
| 数字人角色与会签 | `docs/agents/digital-human-roles.yaml` |
| 实例分发 | `docs/process/instance-distribution-manifest.yaml`；CLI `template.manifest.json` 是投影 |

README、用户指南和 `CLAUDE.md` 只解释或指向上述事实，不定义第二套规则。

## 3. 语言与 Context Contract

- 业务、产品、架构、审查、交接和复盘文档正文使用简体中文；代码标识、API、schema、命令、文件名和协议 metadata 保持原样。
- 创建或修改稳定业务、产品、架构资产前必须读取并持续消费根 `CONTEXT.md`；无法读取时返回 `blocked`。
- 稳定术语先在根 `CONTEXT.md` 登记 PascalCase 英文标识，再进入 Spec、原型、Ticket 或交接资产。每仓仅允许一个根 `CONTEXT.md`；术语引用使用 `<ContextId>/<EnglishIdentifier>`，真正共享的术语使用 `Global/<EnglishIdentifier>`。
- `project-instance` 每个工作单元流转或申请批准前完成 `context_reconciliation`：先回写稳定术语，再核对 `document_digest` 与 `referenced_terms_digest`；缺失、冲突或漂移即 `blocked`。模板源只校验该合同并记录有理由的 `not-applicable`。

## 4. `template-source` 维护

- 创建、修改或退役 skill 时使用 `maintaining-skills`，维护强度和证据以裁剪文档为准；日常停在 `implementation-ready`，发布前执行完整门禁。
- `.agents/skills` 是共享技能权威内容；`.claude/skills`、`.codex/skills`、`.cursor/skills`、`.pi/skills`、`.qoder/skills`、`.trae/skills` 是生成投影，不得分别手改。
- 依次使用 `scripts/verify-template-fast`、显式候选时的 `scripts/verify-template-candidate` 和发布前不可裁剪的 `scripts/verify-template`。未完成 `create-yss-harness-design` 快照同步及生成实例验证，不得宣称可发布；不得绑定 `create-yss-spec`。

## 5. `project-instance` 战略设计路由

先读 `docs/process/harness-profile.yaml`，再按影响面和最近可信阶段裁剪；注册表可保留下游兼容 ID，本地只执行 profile 的 `allowed_work_units`。

- 主链：入口分诊 → 机会与目标 → 业务故事 → 业务边界与规则 → 阶段决策 → Spec → 页面验证 → 业务级 Ticket → Strategic Design Handoff。
- 新功能或较大变更进入 `yss-strategic-design`；`ask-matt`、`grill-me`、`grill-with-docs`、`to-spec`、`to-tickets`、`triage`、`wayfinder` 仅为显式兼容入口，完成后回交编排器验收。
- 命中的条件门禁必须完成；未命中只记录有理由的 `not-applicable`，不生成空文档。`seam-deferred` 必须记录风险、责任人、后续 Ticket、验证计划和目标版本或日期。
- 本地不生成 Tactical Design、OpenAPI、父 / 垂直切片 Ticket、Slice Implementation Contract 或运行时代码；`implement` 必须 `blocked` 并转交下游研发 profile。
- 完成 `work-unit.strategic-design-handoff` 后 `next_route` 必须为 `null`，本仓不继续推进下游生命周期。

## 6. Ticket 与状态

- checkpoint 是唯一机器状态源，map.md 展示并引用，`ticket_sync.status/refs` 关联索引和业务任务；旧 parent_ticket 只读兼容。
- 本地只产出 `artifact.business-ticket-set`：按范围、优先级、验收、依赖和业务风险组织，并保持 `ready-for-human`。
- 本地不得创建功能父 Ticket、垂直切片 Ticket 或设置 `ready-for-agent`。Tracker 按 `docs/agents/issue-tracker.md` 选择，不得从 Git remote 推断；平台不可用时生成待发布草案。

## 7. 下游交接边界

- 交接批准后，下游先把 `source_context_snapshot` 与 `context_delta` 对账到目标仓根 `CONTEXT.md`，形成目标侧 `context_reconciliation`，再接管 Tactical Design、OpenAPI、Slice Contract、脚手架、实现和验证。
- 覆盖率、实现仓和发布规则不是本仓本地门禁；需要继续推进时切换下游研发 profile，不得越过 `work-unit.strategic-design-handoff`。

## 8. 专项入口

- 技术事实或外部证据影响决策时使用 `yss-research`；竞品、市场或用户口碑事实使用 `competitive-intelligence`。
- UI / 原型影响使用 `yss-design-system` → `yss-prototype-stage` → 独立 `prototype-review`；H2 默认 `yss-antdv-next-design`，显式 React 兼容路线才使用 `yss-antd-design`。生产前端转交下游，原型阶段不调用 `yss-ui`。
- 数字人协同先读 `docs/agents/digital-human-roles.yaml`；角色实例不另起生命周期，不批准下游 Slice 合同、不设置 `ready-for-agent`、不宣布产品可发布。
- 模板脚本或校验故障使用 `diagnosing-bugs`；其它技能按 `docs/agents/yss-skill-registry.yaml` 的触发条件按需加载。

## 9. 工作区边界

本仓不承载产品运行时代码；`apps/**` 和独立实现仓属于下游。空 gitlink、detached HEAD 或 `--force` 覆盖挂载点不得当作普通目录。

## 10. 审查、验证与 Git

- 实施者不承担命中的独立审查。任何完成结论必须基于本轮 fresh verification；本仓不宣布实现可合并或产品可发布。
- 会签按 `docs/agents/digital-human-roles.yaml` 关闭并由 `scripts/verify-approval-record --require-approved` 校验；关键决定按角色表绑定真实负责人回复，当前资产、依据和范围一致时复用，历史读取不放行；发布、商务承诺和运行时外部副作用仍须生物人。
- 在暂停、handoff 和业务方案交接边界同步范围、证据、风险、会签点、Ticket 状态和下一步。
- Git checkpoint 只含本轮范围；获得用户授权后才提交或推送。返工或 IMPORTANT / CRITICAL finding 触发简体中文复盘并修订权威资产。

## 11. Subagent 协同

使用 subagent 前读取 `docs/process/subagent-collaboration.md`，定义任务包、数字人角色、运行时、执行态和不重叠写入范围；共享工作区不是沙箱。实施者不得兼任独立 Reviewer，仓库身份、Ticket 状态、Git checkpoint 和完成结论仍由主控裁决；主控也不得批准下游 Slice 合同或设置 `ready-for-agent`。
