# create-yss-harness-design

候选版本 **0.7.1**，共享内核 **0.2.0**。创建、接入和同步本家族治理资产，模板与内核均随包分发，实例操作离线运行。来源 commit、摘要及 `committed` / `working-tree` 状态分别记录在模板快照和内核锁中；开发候选不表示已发布 npm。

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

init 只接受不存在或空目录；已有项目使用 attach。attach/sync 默认预览，`--apply` 才写入。diff、doctor 和 recover 默认只读，不生成 metadata、技能锁、Git 或状态目录。recover 仅恢复未完成事务，不提供成功事务的历史 rollback。update/upgrade 仅更新程序，不同步实例；源码、npx 和未知安装方式输出指引，不自动降级。

`--plan` 适用于 attach/sync；`--prune` 仅适用于 sync。`--plan`、`--dry-run` 与 `--apply` 互斥。`--json` 只控制格式，stdout 为一个 schemaVersion 1 JSON 对象，日志走 stderr。普通差异与警告退出码 0；冲突、非法参数、身份错误、校验失败及无法恢复退出码 1。错误返回 code/message，计划含 changes、conflicts、summary、prunable、pruned、retainedRemoved。doctor 返回逐项 checks 和处理建议。

初始化参数包括 `--project-name`、`--business-domain`、`--team-size`、`--issue-tracker local-markdown|github|gitlab`、`--git-init` 和示例文档开关。init 缺少必需参数时仅在 TTY 进入交互；JSON 或非交互环境缺参直接报错。sync 不接受重新设置项目变量的参数。

## 文件与恢复

已有 README、`CONTEXT.md` 与战略设计业务资产保留。README 不持续受管；`.gitignore` 仅更新家族专属区块并保留区块外字节，区块排除 `.yss-harness-state/`。不完整或重复标记阻断同步。

普通 sync 保留退出分发文件及基线。`--prune --apply` 仅删除旧所有权可信、当前内容和 mode 与基线一致的可清理文件；本地修改、用户文件及证据不足的文件保留并报告。force 不放宽删除条件。项目新增技能必须显式登记，不自动接管未知技能。

文件、生成技能锁和 metadata 属于同一事务。Context、profile、技能锁和投影校验通过才提交；失败恢复原文件。备份保留在 `.yss-harness-state/design/transactions/<id>/`。发现中断事务先运行 recover；兼容的 sync --apply 也会先恢复并返回，需要重新预览再同步。恢复遇到后续修改或损坏备份时保留恢复清单，不覆盖修改。

战略 CLI 支持已有 metadata v1 实例：预览只报告迁移，首次 `sync --apply` 在事务内转换为 v2；批准记录和业务方案不迁移、不覆盖。缺少旧 mode 或所有权证据的退出分发文件保留。战略治理冲突须人工合并，不能 force 覆盖。历史 metadata 登记的 `scripts/instantiate-harness` 保留原文件并退出管理，doctor 给出人工清理提示；新实例不分发该脚本。

三家族之间以及本体/旧 dev 身份之间禁止自动转换。业务源码、构建文件、批准证据、Git、gitlink、嵌套仓库和越界路径均受保护。生成治理资产不会创建远程仓、Tracker 或业务运行时代码。

模板内的[战略设计用户手册](https://github.com/iloveZzz/yss-harness-design-agent/blob/main/docs/user-guide/战略设计子项目用户手册.md)说明本仓操作主线；[CLI 使用说明](https://github.com/iloveZzz/yss-harness-design-agent/blob/main/docs/user-guide/CLI使用说明.md)说明实例侧命令和恢复语义。

## 维护与安装验收

```sh
pnpm sync-core <本体仓库> <完整提交或WORKTREE>
pnpm sync-template <本家族模板仓库> <完整提交或WORKTREE>
pnpm test
pnpm verify-bundle
npm pack
```

同步脚本必须显式指定来源。WORKTREE 仅用于开发验收；固定交付使用完整 40 位提交。`--check` 只验证分发来源是否一致。普通测试不重建仓库模板，prepack 仅检查已准备快照；构建回归在临时副本执行。不要手改 vendor、模板 blobs 或来源锁。

测试通过后在干净目录安装生成 tgz，再执行 init、attach、doctor、diff、sync、prune 与 recover 验收。Git 提交/推送、固定版本发布验证和 npm publish 分别授权。
