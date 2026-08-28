# create-yss-harness-design

用于从 `yss-harness-design-agent` 初始化战略设计 `project-instance` 的 npm CLI。

本工具不是 [`create-yss-spec`](https://github.com/iloveZzz/create-yss-spec)。`create-yss-spec` 面向全生命周期模板 `yss-spec-project-template`。本 CLI 只生成 `harness.business-ddd-strategy-handoff` 项目实例，本地终点是 Strategic Design Handoff。

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

v1 只支持空目录 `init`。`--dry-run` 预览，`--force` 覆盖非空目录。不创建远端仓库、CI 或 Ticket Board。

实例 metadata 写入 `.yss-harness-design.json`，并记录 40 位 `templateCommit` 与 `profileId`。CLI 运行时不拉取模板仓库。

## 开发

```bash
YSS_STRATEGIC_DESIGN_TEMPLATE_REPO=../yss-strategic-design-harness npm test
```

未完成与模板仓的跨仓验证和正式独立审查前，不得 `npm publish`。
