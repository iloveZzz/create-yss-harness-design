# Harness 流程裁剪与影响面判定

本文件规定如何根据变更规模和风险选择最近可信阶段。裁剪只减少未触发的门禁，不得跳过已经命中的条件强制门禁。

安全 / 权限不单独分诊。需求或冻结资产没有明确改变相关行为时不登记、不解释 `not-applicable`、不增加门禁；明确改变时只按实际 UI、API、Backend、Data、High-risk 影响复用普通流程。SQL / DDL / 迁移、上传 / 下载等技术载体继续由其数据或 API 影响决定路线，不自动升级为安全专项。

## 1. 判定顺序

1. 先读取 `yss-project.yaml`，非法、缺失或不支持的身份直接进入迁移检查。
2. 判断是否为模板源维护、项目实例小改动、中等变更或全新产品 / 模块。
3. 判断 UI、API、数据、后端、前端、跨仓库和高风险影响。
4. 从最近可信阶段恢复；不要因为当前目录存在某类文件就猜测阶段已通过。

## 2. 裁剪矩阵

| 类型 | 默认入口 | 必需工作 | 可记录为 `not-applicable` |
|---|---|---|---|
| 模板源维护 | 影响面分析 | 修改单一事实来源、按验证与审查强度分级执行证据、必要的技能投影同步、fresh verification / review | 产品 Spec、产品设计、OpenAPI、运行时代码 |
| 小改动 | 入口分诊 | 影响面、主 tracker 同步、fresh verification | Spec、架构、原型、切片（没有触发条件时） |
| 中等变更 | 最近可信的 Spec / 架构阶段 | Spec、功能架构、必要业务审查、业务 Ticket 和交接 | 未命中的 UI、数据或 API 门禁 |
| 全新产品 / 模块 | Plan | Plan、Spec、产品总体设计、功能架构、必要设计审查、业务 Ticket 和交接 | 未命中的 UI、数据或 API 门禁 |
| 高风险变更 | 既有冻结基线 | Spec Delta、业务规则复核、受影响确认及交接范围复核 | 与风险证据无关的门禁 |

任何裁剪都必须写明原因和证据，不生成空文档。对跨仓库变更，Harness 记录必须绑定实现仓库、分支、CI、验证命令、发布顺序和回滚点；没有前端、后端或 OpenAPI 影响时显式记录 `not-applicable`。

## 3. 执行与证据

同一独立执行者可以在一个连续工作单元内完成相邻的实现动作，但不能替代独立审查者。阶段证据在集中 checkpoint 回写，至少包含：范围、变更文件、受影响仓库、验证命令及结果、阻塞项、人工审查点、Ticket 状态和下一步。

## 4. 模板维护验证与审查强度

等级和触发项以 `maintenance-intensity.yaml` 为准。L1 至少有相关实际检查；L2 有行为反例、Fresh Verification 和维护者自检；L3 有 Fresh Verification 和维护者自检，并覆盖权限、恢复及跨仓反例。

日常维护停在 `implementation-ready`，不因 L2/L3 自动要求独立审查或冻结候选。独立审查按需；适用时实施者不得兼任 Reviewer，旧正式审查证据保持只读兼容。产品实例的业务会签与真实用户决定不因模板维护裁剪而减少。

- 内循环：`scripts/verify-template-fast`；未知路径和核心校验器变更按配置回退完整检查。
- PR：`scripts/verify-template-candidate`。
- main 与发布前：不可裁剪的 `scripts/verify-template`；发布和 Git 操作另按实际授权执行。

维护 checkpoint 沿用 schema v2，日常使用 `review_mode: self-check`、`verification_profile: fast`、`review_round: 0`、`candidate_digest: null`。通过 `scripts/verify-maintenance-checkpoint` 校验，记录范围、实际命令、退出码、证据、自检和剩余风险。`release-ready` 须绑定本轮完整验证，不能由历史结果推导。
