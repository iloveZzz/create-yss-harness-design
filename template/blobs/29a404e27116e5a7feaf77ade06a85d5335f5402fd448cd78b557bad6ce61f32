# create-yss-harness-design 使用说明

本 CLI 创建、接管和同步 `harness.business-ddd-strategy-handoff` 的治理资产。运行前用 `--version`、`--help` 和 `npm view create-yss-harness-design version` 区分当前源码、已安装程序与 npm 已发布版本。

## 命令

```sh
create-yss-harness-design init --target-dir ./new-project --project-name 我的项目 --business-domain 业务领域
create-yss-harness-design attach --target-dir ./existing-project
create-yss-harness-design attach --target-dir ./existing-project --apply
create-yss-harness-design doctor --target-dir ./new-project --json
create-yss-harness-design diff --target-dir ./new-project --json
create-yss-harness-design sync --target-dir ./new-project --plan --prune
create-yss-harness-design sync --target-dir ./new-project --apply --prune
create-yss-harness-design recover --target-dir ./new-project
create-yss-harness-design recover --target-dir ./new-project --apply
create-yss-harness-design update --dry-run
```

init 只接受不存在或空目录。attach/sync 默认预览，`--apply` 才写入；`--plan` 适用于 attach/sync，`--prune` 只适用于 sync。`--plan`、`--dry-run` 与 `--apply` 互斥。diff、doctor 和 recover 默认只读；recover 只恢复未完成事务。update/upgrade 只更新 CLI，不同步项目。

## 身份、同步和恢复

本家族 metadata 是 `.yss-harness-design.json`。异族、多重身份、损坏 metadata、未知 profile、symlink、gitlink 或越界路径在写入前拒绝，`--force` 不能绕过。

普通 sync 保留退出分发文件。`sync --apply --prune` 只删除仍与可信旧 baseline 内容及 mode 相同的文件；本地修改和证据不足的旧文件保留并报告。战略治理冲突不能 force 覆盖。

文件、生成技能锁和 metadata 属于同一事务。失败自动恢复；中断事务先运行 recover，应用恢复后重新预览。成功后的撤销使用项目保存的 Git 基线或事务备份，不存在历史 rollback 命令。

README、根 `CONTEXT.md`、业务资产和批准由项目维护；sync 不把旧内容重新解释为当前决定。实例操作使用包内固定模板快照，不会运行时拉取模板仓。候选包需核对 `template.snapshot.json` 的 commit、来源状态和摘要。

项目工作方式见[战略设计子项目用户手册](战略设计子项目用户手册.md)。CLI 源码构建和发布说明见 CLI 仓库 README。
