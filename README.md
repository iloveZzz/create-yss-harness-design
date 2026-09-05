# create-yss-harness-design

当前版本：`0.3.0`，模板固定到 `dd1ec2dbaf3ce6da528607519ef2d0888b78dbb4`。该版本新增视觉基线 schema、模板和验证合同，并加强原型证据与战略设计交接约束。

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
