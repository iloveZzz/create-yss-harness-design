# create-yss-harness-design

当前版本：`0.4.1`，模板固定到 `f41c4a4af3afe6c26d299d6f4f16b6c6d4dc2e5e`。该版本新增战略交接快照包导出与核验，包含完整资产快照、稳定规则与场景索引、差异和离线交付证据。

用于从 `yss-harness-design-agent` 初始化战略设计 `project-instance` 的 npm CLI。

本工具不是 [`create-yss-spec`](https://github.com/iloveZzz/create-yss-spec)。`create-yss-spec` 面向全生命周期模板 `yss-spec-project-template`。本 CLI 只生成 `harness.business-ddd-strategy-handoff` 项目实例，本地终点是业务方案交接。

## 用法

```bash
npm create yss-harness-design@latest
```

或：

```bash
npx create-yss-harness-design@latest \
  --project-name "项目名称" \
  --business-domain "业务领域" \
  --target-dir "./project" \
  --git-init
```

CLI 协议 v1 的项目实例操作只支持空目录 `init`；`attach`、`sync` 仍不支持。CLI 自身可用 `update` 或其别名 `upgrade` 查询 npm 最新版本：全局或项目本地安装会升级，源码目录与 `npx` 运行仅给出安全提示，不会覆盖本地文件。`--dry-run` 可预览更新命令，`--force` 可在已是最新版本时重新安装。不创建远端仓库、CI 或 Ticket Board。

```bash
npx create-yss-harness-design update --dry-run
npx create-yss-harness-design upgrade
```

实例 metadata 写入 `.yss-harness-design.json`，并记录 40 位 `templateCommit` 与 `profileId`。CLI 运行时不拉取模板仓库。

## 开发

```bash
YSS_STRATEGIC_DESIGN_TEMPLATE_REPO=../yss-harness-design-agent npm test
```

未完成与模板仓的跨仓验证和正式独立审查前，不得 `npm publish`。

## 本次身份保护升级

本版本同步前后端 Harness 拆分后的共享交接资产，保持当前模板家族。init、attach 和 sync 的适用入口在生成计划前检查五种模板身份及已有 profile；异族、多重身份、损坏或矛盾声明均拒绝，`--force` 不能绕过，`--dry-run` 同样返回非零。历史 metadata 继续兼容，`legacy-attach` 仅在旧 schema 路径接受。

`update` / `upgrade` 只更新 CLI 程序，不同步实例资产。专职后端和前端新项目分别检出 `yss-harness-backend-agent`、`yss-harness-frontend-agent` 的固定提交，在各自模板目录运行 `node scripts/instantiate-harness --target <新目录>`；这两个入口不提供原地 sync 或跨 profile 迁移。

本 CLI 仍不支持 attach、sync；已有战略实例不因更新 CLI 而自动升级，也不要使用 init --force 代替实例升级。
