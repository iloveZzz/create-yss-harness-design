# CLI 维护入口

本仓是模板工具链薄包，不生成产品 Spec / Ticket。公共实现权威位于综合模板 `.template-source/cli-core/`；`vendor/cli-core/` 和 `template/` 只通过同步脚本生成。修改身份时先更新来源 profile。开发验收允许显式 WORKTREE，固定发布需完整提交。验证使用 `pnpm test`、`pnpm verify-bundle`，测试结束后才执行 `npm pack`。npm 发布和旧入口退役独立执行发布流程。
