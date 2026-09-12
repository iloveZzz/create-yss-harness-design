# 设计系统治理与战略设计适配

## 职责边界

根目录 `DESIGN.md` 是本仓库可被 Agent 和工具直接消费的视觉规范源，定义颜色、排版、布局、圆角、间距和组件视觉变体。共享章节与主模板的同步摘要见 `docs/design/design-system-sync.yaml`。

本文件是中文治理说明，不重新定义颜色、字体、间距或圆角的具体值。实现和原型应引用 `DESIGN.md` 中的 token 名称；`docs/design/tokens/*` 是由维护工具生成的投影，不能手工作为规范源修改。

## 战略设计中的使用方式

战略设计阶段使用该规范完成：

- 产品总体设计、页面地图和低保真结构。
- H2 Vue/Antdv Next 默认原型及 React/AntD 兼容原型的语义 token 映射。
- 交互说明、状态矩阵和原型视觉验证。
- 业务方案交接中的视觉约束与验收引用。

业务状态、用户流程、权限行为、API 影响、业务边界与规则决策和交接字段仍由对应生命周期资产承载，不写入 `DESIGN.md`。

## 原型与运行时边界

H2 高保真原型默认使用 Vue 3 + Antdv Next；React + Ant Design 6.x 只作为显式兼容路线。生产实现仍由下游研发 profile 使用目标仓锁定的 Vue 3 + YSS UI / Ant Design Vue 4.x。原型与生产共享语义 token、状态含义和验收目标，不把任一运行时的实现细节写成跨项目视觉规范。

默认 H2 构建前使用 `yss-antdv-next-design` 获取组件事实；显式 React 兼容路线使用 `yss-antd-design`。构建后统一记录 fact pack、浏览器和无障碍证据。设计系统级预览位于 `preview.html` 与 `preview-dark.html`，不替代产品级原型。

## 维护与验证

修改设计规范时，在 `.template-source/tooling/node` 使用固定版本的 design.md wrapper：

- `lint` 校验 frontmatter、章节顺序、引用和变体命名。
- `export` 生成 `theme.json`、默认/暗色/紧凑 token 与 CSS 变量。
- `drift` 阻断规范源与派生文件之间的未解释漂移。
- `diff` 区分 token、组件状态和治理文案变化。

共享章节变更必须同步主模板并更新同步摘要；战略设计专属治理文案可以只在本仓库修改。发布仍须通过本仓库的模板验证和 CLI 快照验证，生命周期终点保持 `work-unit.strategic-design-handoff`。

## 设计原则

本项目采用该设计系统时，优先遵循四个原则：

| 原则 | 项目解释 |
| --- | --- |
| Natural | 使用用户熟悉的中后台交互模式，不为了新奇牺牲效率 |
| Certain | 页面状态、操作反馈、校验错误、加载和权限状态必须明确 |
| Meaningful | 视觉强调只服务于任务、状态和主操作，避免无信息量装饰 |
| Growing | 支撑从简单表单到复杂表格、详情页、审批流和运营控制台的扩展 |

## Token 基线

### 颜色

| Token | 值 | 用途 |
| --- | --- | --- |
| `colorPrimary` | `#3371ff` | 主按钮、链接、焦点、选中态、激活导航 |
| `colorPrimaryHover` | `#4096ff` | 主色 hover |
| `colorPrimaryActive` | `#0958d9` | 主色 active |
| `colorSuccess` | `#52c41a` | 成功状态 |
| `colorWarning` | `#faad14` | 警告状态 |
| `colorError` | `#f5222d` | 错误状态 |
| `colorInfo` | `#3371ff` | 信息提示 |
| `colorBgLayout` | `#f0f2f5` | 页面背景 |
| `colorBgContainer` | `#ffffff` | 卡片、表格、表单、面板容器 |
| `colorBgElevated` | `#ffffff` | 弹窗、下拉、浮层 |
| `colorText` | `rgba(0, 0, 0, 0.88)` | 主文本 |
| `colorTextSecondary` | `rgba(0, 0, 0, 0.65)` | 次级文本 |
| `colorTextTertiary` | `#8c8c8c` | 说明 / 弱提示 |
| `colorTextQuaternary` | `#bfbfbf` | placeholder / disabled |
| `colorBorder` | `#d9d9d9` | 主边框 |
| `colorBorderSecondary` | `#f0f0f0` | 次级分割线 |

颜色使用规则：

- 主色只表达全局主操作、链接、选中态和焦点态，不作为大面积背景装饰。
- `success`、`warning`、`error`、`info` 只用于功能状态，不与品牌强调混用。
- 预设色板如 `blue`、`purple`、`cyan`、`green`、`magenta`、`red`、`orange`、`yellow`、`volcano`、`geekblue`、`gold`、`lime` 主要用于 Tag、图表和分类可视化；其中 `blue-6` 仍可能是官方 `#1677ff`，不得当作品牌主色。
- 产品代码中不要硬编码 `#ffffff`、`#fafafa` 等表面色，应引用语义 token。
- 主色浅阶 `primary-1` 使用 `color-mix(in srgb, var(--primary-color) 10%, transparent)`，不要对 CSS 变量调用 Less `fade()`。

### 运行时主题变量

默认亮色支持运行时切换。`:root` 中的短名别名必须指向 `--brand-*`，不要再维护第二套色值。

| 运行时别名 | 指向 | 默认值 |
| --- | --- | --- |
| `--primary-color` | `--brand-color-primary` | `#3371ff` |
| `--primary-color-hover` | `--brand-color-primary-hover` | `#4096ff` |
| `--primary-color-active` | `--brand-color-primary-active` | `#0958d9` |
| `--primary-1` | `color-mix(in srgb, var(--primary-color) 10%, transparent)` | 主色 10% 透明 |
| `--primary-7` | `--primary-color-active` | `#0958d9` |
| `--success-color` | `--brand-color-success` | `#52c41a` |
| `--warning-color` | `--brand-color-warning` | `#faad14` |
| `--error-color` | `--brand-color-error` | `#f5222d` |
| `--info-color` | `--brand-color-info` | `#3371ff` |
| `--text-color` | `--brand-color-text` | `rgba(0, 0, 0, 0.88)` |
| `--text-color-secondary` | `--brand-color-text-secondary` | `rgba(0, 0, 0, 0.65)` |
| `--border-color` | `--brand-color-border` | `#d9d9d9` |
| `--border-color-split` | `--brand-color-border-secondary` | `#f0f0f0` |
| `--bg-color` | `--brand-color-bg-layout` | `#f0f2f5` |
| `--bg-color-container` | `--brand-color-bg-container` | `#ffffff` |

切换主题时只改 `--brand-*` 或同步改短名别名；不要在页面里另写一套 Less 变量。

### 排版

| 层级 | 字号 | 字重 | 行高 | 用途 |
| --- | --- | --- | --- | --- |
| `fontSizeHeading1` | 38 | 600 | 1.25 | 大标题，慎用 |
| `fontSizeHeading2` | 32 | 600 | 1.25 | 页面级标题 |
| `fontSizeHeading3` | 26 | 600 | 1.25 | 重要分区标题 |
| `fontSizeHeading4` | 22 | 600 | 1.25 | 分区标题 |
| `fontSizeHeading5` | 18 | 600 | 1.25 | 卡片 / 面板标题 |
| `fontSizeLG` | 18 | 400/600 | 1.571 | 强调正文 |
| `fontSize` | 14 | 400 | 1.571 | 默认正文、控件、表格 |
| `fontSizeSM` | 12 | 400 | 1.571 | 辅助信息、Tag |

字体栈：

```text
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
```

排版规则：

- 中后台产品默认正文使用 14px，以保证信息密度和可扫描性。
- UI 字重优先使用 400 和 600，不使用 700+ 的重粗字作为状态强调。
- 选中 / 激活状态优先通过颜色、边框、下划线和背景表达，不通过突然加粗制造跳动。
- 不把 `Inter` 或其他品牌字体写成强制默认栈；项目若要引入品牌字体，必须先更新本文件和 token 快照。

### 间距与尺寸

| Token | 值 | 用途 |
| --- | --- | --- |
| `sizeXXS` | 4 | 极小间距 |
| `sizeXS` | 8 | 控件内小间距 |
| `sizeSM` | 12 | 紧凑间距 |
| `size` | 16 | 默认模块间距 |
| `sizeMD` | 20 | 中等间距 |
| `sizeLG` | 24 | 卡片内边距 / 分区间距 |
| `sizeXL` | 32 | 页面大分区间距 |
| `sizeXXL` | 48 | 大版块间距 |
| `controlHeight` | 32 | 默认按钮、输入框、选择器高度 |
| `controlHeightLG` | 40 | 大号控件 |
| `controlHeightSM` | 24 | 小号控件 |

布局规则：

- 间距整体落在 4px 网格上。
- 表单、筛选区、工具栏、表格和详情页应优先使用密集但有节奏的布局。
- 不使用任意 magic number；如确需新增尺寸，应先判断是否要扩展 token。

### 布局 token

| Token | 值 | 用途 |
| --- | --- | --- |
| `layoutHeaderHeight` | `64px` | 顶栏高度 |
| `layoutSiderBackground` | `#001529` | 深色侧栏背景 |
| `layoutBodyBackground` | `#f0f2f5` | 与 `colorBgLayout` 对齐的页面背景 |
| `screenXS` | `480px` | 布局断点 |
| `screenSM` | `576px` | 布局断点 |
| `screenMD` | `768px` | 布局断点 |
| `screenLG` | `992px` | 布局断点 |
| `screenXL` | `1200px` | 布局断点 |
| `screenXXL` | `1600px` | 布局断点 |

这些断点用于栅格、隐藏工具类和布局折叠，不替换下方截图验收视口矩阵。

### 圆角

| Token | 值 | 用途 |
| --- | --- | --- |
| `borderRadiusXS` | 2 | 极小元素 |
| `borderRadiusSM` | 4 | 小标签、小控件 |
| `borderRadius` | 6 | 默认控件圆角 |
| `borderRadiusLG` | 8 | 大容器 / 浮层 |

保持“控件圆角小于或等于容器圆角”：默认控件 `6px`，小控件 `4px`，容器 `8px`。实现时以 `docs/design/tokens/tokens.default.json` 为准。

### 动效

| Token | 值 | 用途 |
| --- | --- | --- |
| `motionDurationFast` | `0.1s` | hover、focus、press |
| `motionDurationMid` | `0.2s` | 折叠、淡入淡出、控件内部状态 |
| `motionDurationSlow` | `0.3s` | Modal、Drawer 等表层变化 |
| `motionEaseInOut` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | 默认进出场 |
| `motionEaseOut` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | 出场 / 展开 |

动效规则：

- 动效只服务于状态反馈、层级变化和空间关系，不做装饰性动效。
- 不随意新增 cubic-bezier；优先使用既有 motion token。

## 组件采用规则

| 组件 | 基准规则 |
| --- | --- |
| Button Primary | 每个决策区域只保留一个主按钮，表达最重要动作 |
| Button Default | 次级动作默认使用描边 / 默认按钮，不与主操作争夺注意力 |
| Input / Select | 默认高度 32px，focus 使用主色边框和可见焦点反馈 |
| Card | 用作真实内容容器，默认白底，容器间距清晰；避免卡片套卡片 |
| Modal | 用于阻断式决策或关键表单，不承载复杂多页流程 |
| Menu | 选中态使用淡蓝背景 + 主色文本，保证导航位置明确 |
| Tabs | 激活态使用主色文本 + 2px 下划线，不使用背景填充 |
| Table | 表头使用浅表面色和 600 字重；默认不做斑马纹，hover 再强调行 |
| Tag | 用于分类标签，不用于关键状态或错误提示 |
| Alert | 用于语义反馈，状态由图标、浅色背景和文案共同表达 |
| Badge | 可表达紧凑状态点，但不能替代可读文本 |
| Tooltip | 用于补充解释，黑色反相浮层，位置交给框架处理 |
| Dropdown | hover 使用浅表面色，不单独改变文本颜色 |

## 页面设计倾向

本项目若采用该设计系统，页面应优先呈现为工作台 / 控制台 / 业务操作界面：

- 首屏直接进入实际业务界面，不先做营销落地页。
- 页面布局应利于扫描、筛选、对比和连续操作。
- 表格、筛选区、批量操作、详情面板、抽屉、弹窗和状态提示应保持一致的控件语言。
- 避免大面积渐变、装饰插画、夸张 hero、过多卡片化包装和单色系视觉堆叠。
- 权限不足、只读、空数据、加载中、校验失败、冲突、提交成功等状态必须在设计阶段明确。

## 响应式验收矩阵

来源包要求实现时覆盖以下视口。后续 UI 原型、前端实现和截图验收应至少抽取这些尺寸中的核心断点：

| 名称 | 尺寸 |
| --- | --- |
| mobile compact | 360 × 800 |
| mobile standard | 390 × 844 |
| mobile large | 430 × 932 |
| foldable / small tablet | 600 × 960 |
| tablet portrait | 820 × 1180 |
| tablet landscape | 1024 × 768 |
| laptop | 1366 × 768 |
| desktop | 1440 × 900 |
| wide desktop | 1920 × 1080 |

布局 CSS 断点补充：`480 / 576 / 768 / 992 / 1200 / 1600`。它们用于栅格和显示/隐藏，不替代上表截图验收尺寸。

验收规则：

- 不允许出现横向滚动，除非是明确设计的表格横向滚动容器。
- 工具栏、筛选区和批量操作区在窄屏下应重排或折叠。
- 表格密集场景应明确移动端替代形态，如卡片列表、关键列优先或详情抽屉。
- 文字不得溢出按钮、标签、表头、卡片和弹窗。

## 前端实现建议

如果前端使用 React + Ant Design：

- 使用 `ConfigProvider` 注入 `docs/design/tokens/theme.json` 中的 theme 配置。
- 组件样式优先通过 Ant Design token、component token、CSS variables 或主题算法表达。
- 消息、通知、Modal 静态方法应使用 `App`、hook API 或 context holder，避免主题上下文丢失。
- 暗色模式使用 `darkAlgorithm` 或 `docs/design/tokens/variables.dark.css`，不要手工反转颜色。本轮只同步了暗色的字体栈和圆角 seed；完整暗色色板仍是历史算法结果，启用暗色前应再派生一次。
- 紧凑模式使用 `compactAlgorithm` 或 `docs/design/tokens/tokens.compact.json`，不要逐组件压缩高度。

如果前端不是 Ant Design：

- 先把 `docs/design/tokens/tokens.default.json` 转为项目设计 token，再映射到目标 UI 库。
- 保留组件语义和状态语义，不要只复制颜色。
- 尽量保持 32px 默认控件高度、14px 默认字号、4px 间距网格和三层表面模型。
- 运行时动态换肤使用 `--primary-color` 等短名别名，或直接改 `--brand-*`。

## 设计审查清单

进入 Spec 校准、API 影响分析 / 契约草案或前端实现前，带 UI 的需求应检查：

- 是否引用本文件作为设计系统基线。
- 页面清单、用户主路径、异常路径和权限状态是否明确。
- loading、empty、error、readonly、disabled、no-permission、conflict、success 状态是否齐全。
- 表单字段、筛选条件、表格列、批量操作、详情字段是否能反推 API schema。
- 主操作是否唯一且清楚，次级操作是否降级。
- 是否存在硬编码颜色、任意间距、重复自造控件或与系统冲突的交互。
- 是否覆盖关键响应式断点。
- Codex `$design-qa` 是否按项目覆盖对照主色、错误色、背景、文本、圆角和字体栈。

## 后续落地 TODO

- 将 `docs/design/tokens/theme.json` 接入前端工程主题配置。
- 将 `docs/design/tokens/variables.css` 中的 `--brand-*` 与运行时别名纳入项目 token 管理。
- 如果项目启用暗色模式，用 `darkAlgorithm` 按新 seed 重派生 `docs/design/tokens/tokens.dark.json`，并补充截图验收。
- 如果项目存在高密度表格 / 审批 / 运营台，补充 `docs/design/tokens/tokens.compact.json` 的适用边界。

## Ant Design v6 原型补充基线

本节根据 `antdv6-design.md` 的设计说明提炼，用于高保真原型和后续前端实现，不替代项目 token。

- 先按 `bg-layout`、`bg-container`、`bg-elevated`、文本、边框、状态、圆角和阴影等 semantic token 角色设计，再映射到 `ConfigProvider`、组件 token 或 CSS variables；不得用页面局部色值替代主题层。
- 默认亮色使用 `theme.defaultAlgorithm`；暗色和紧凑密度通过 theme algorithm 切换，禁止手工反色或逐控件压缩。
- 每个决策区域只保留一个 single primary action。保存、提交、审批、发布、导出和重试等动作必须提供 interaction feedback；不可逆或高风险动作使用确认弹窗。
- 对实际字号、图标和背景复核 accessibility contrast。默认 token 不足时，通过种子 token 或组件 token 调整，不引入单页特例色。
