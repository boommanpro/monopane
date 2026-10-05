---
name: 'monopane-build'
description: '把任意输入（代码仓库、网站、产品文档、直接贴的文本）解析成「项目文档画布」JSON（Canvas Schema v1.1），并构建为可离线双击打开的单体 HTML。最终展示形式是 monopane 画布效果。当用户想可视化理解一个项目 / 产品 / 网站的结构与运行逻辑，或说「分析项目生成画布」「给这个仓库生成项目文档」「generate canvas for this repo」「把这个项目的数据库/架构/流程画出来」「分析这个网站」时调用；输入可以是本地仓库路径、GitHub URL、网站 URL、产品文档或直接贴的文本。'
---

# 项目文档画布生成器（monopane-build）

把**任意输入**（代码仓库 / 网站 / 产品文档 / 直接贴的文本）解析成符合 **Canvas Schema v1.1** 的画布 JSON，并构建为可离线双击打开的单体 HTML。

- 数据契约唯一权威：`docs/canvas-schema.md`。**节点字段、连线语义、坐标规则不需要背**——骨架由 `init` 生成、坐标由 `layout` 计算、合法性由 `validate` 把关，照脚本报错修即可。
- 领域层实现：`packages/canvas/src`；应用侧兜底校验：`packages/app/src/data/storage.ts`。

## 工具链（唯一入口，先读）

所有命令走 `scripts/canvas.mjs`。脚本自行向上定位 monopane 仓库根，**在任意 cwd 下执行均可**；但仓库本身需要先就绪：fresh clone 时执行 `git clone --depth 1 https://github.com/boommanpro/monopane.git && cd monopane && pnpm install`（依赖缺失时脚本会自动补建 `@monopane/canvas`）。

| 命令                                                | 作用                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `init <out.json> [--areas ...] [--title slot=标题]` | 生成骨架：区域容器、原点、默认标题、配色按契约写好。默认建 db/arch/flow/runtime 四区域，`--all` 全量                            |
| `layout <file>`                                     | 自动布局：子节点**不用写坐标**，按 blockIDs 顺序行优先填网格；节点可写 `data.slot` 代替手工填 blockIDs，缺失的区域容器自动补建 |
| `validate <file>`                                   | 深度校验（契约 + 启发式防呆），**交付唯一门槛**，报错必须修完                                                                 |
| `build <file> [<out.html>]`                         | 构建离线单体 HTML，并**自动核对**注入数据与 JSON 等价                                                                          |
| `check <file> <html>`                               | 单独执行等价性核对                                                                                                            |

标准流程（固定五步）：

```bash
S=<本 skill 目录>/scripts/canvas.mjs
node "$S" init <产物>.json      # 1. 骨架
# 2. 编辑 JSON：只写「子节点 + 连线」，不写坐标、不改区域容器
node "$S" layout <产物>.json    # 3. 归区 + 自动算坐标
node "$S" validate <产物>.json  # 4. 校验，报错必须修完
node "$S" build <产物>.json     # 5. 构建 HTML（含等价性核对）
```

## 输入与模式

输入四类：

1. **本地仓库路径**：直接用，先确认是仓库根。
2. **GitHub URL**：本地没有就 clone 到临时目录（`git clone --depth 1`），不要删用户已存在的目录。注意官网首页不是仓库，无法 clone。
3. **网站 URL**：抓取公开页面；**优先找页面里的 GitHub / 文档入口**，能找到源码就 clone、以源码为准补充架构事实，官网只做能力与定位素材。抓不到的基于可读页面 + 领域知识推断，并放 `note` 注明依据。
4. **产品文档 / PRD / 文本**：作为主要素材。

什么都没有时，先问用户要输入。用户只想看文字摘要时不要调用本 skill。

| 模式           | 输入              | 区域语义                                                        |
| -------------- | ----------------- | --------------------------------------------------------------- |
| **A 代码仓库** | 仓库 / GitHub URL | 固定四区域：数据库结构与关联、项目架构、代码流程、项目运行逻辑  |
| **B 网站/文档** | 网站 / PRD / 文本 | 标题自由命名，按内容组织（能做什么、怎么运行、发展方向…）       |

两种模式共用同一契约与工具链，区别只在区域标题与内容组织（`init --title` 或直接改容器的 `data.title`）。混合输入以信息量大的为主。

## 模式 A：分析步骤

1. **概览**：读语言清单（`package.json` / `pyproject.toml` / `go.mod` / `pom.xml` / `Cargo.toml` 等）+ 顶层目录 + `docker-compose.yml` / README 架构章节。
2. **数据库区域**：扫 DDL 与 ORM——通用 `**/*.sql`、`migrations/`；Node/TS 的 Prisma / TypeORM / Sequelize / Drizzle；Python 的 Django models / SQLAlchemy / Alembic；Java 的 JPA / MyBatis；Go 的 GORM。提取表、字段、主外键、表间基数（1:1 / 1:N / N:N）；数据库视图用 `db-view`。完全找不到就只放一个 `note` 说明。
3. **架构区域**：目录分层 → `category`；依赖清单 → `tech` 标签（≤4）；服务间调用 / 跨模块 import → `dependency` 连线；按「前端 → 网关 → 服务 → 数据」分层排。
4. **代码流程区域**：从入口追**一条**最能代表项目的主链路（路由 → controller → service → dao），关键跳转一个 `flow-step`；条件分支用 `flow-decision`（出边带 `sourcePortID: "yes" | "no"`）。**不要把所有接口都画上**。
5. **运行逻辑区域**：启动装配（bootstrap / main / DI / 中间件）+ 一次请求生命周期（鉴权 → 校验 → 业务 → 持久化 → 响应）；定时 / 事件行为用 `runtime-scheduled` / `runtime-event`。
6. 出现跨模块调用链 / 请求-响应交互时建 `group-seq`（`seq-participant` + `seq-message`）；出现数据采集 → 清洗 → 落库流转时建 `group-df`（`df-source` → `df-transform` → `df-store`）。

## 模式 B：组织方法

- 先定**受众**：面向非技术人员时，节点标题用生活化比喻、description 放真实术语对照（如「联络员 · 负责转发消息（Service Worker）」），区域标题带编号引导阅读（「1 · 先认识它」）。
- 主题 → 区域映射：能力地图 → `group-arch`；核心流程 / 路线图 → `group-flow`（路线图用 start → step × N → end 表达成一条路径，参考 `examples/website-product-canvas.json`）；部署形态 / 工作机制 → `group-runtime`；关键交互 → `group-seq`；数据流转 → `group-df`；数据结构 / 信息架构 → `group-db`（无则省略）。
- 只保留信息量够支撑 3 个以上节点的主题，主题太多就合并或截断；跨主题的引用关系用 `note` 写说明，**不要跨区域连线**。

## 交付

1. **JSON + HTML 双产物**：`build` 默认必做，失败要修复重试；不允许只交 JSON 就算完成（除非用户明确只要 JSON）。
2. 输出位置：仓库输入写到**被分析项目根目录** `<repo-name>-canvas.json`；网站 / 文档 / 文本输入写到**当前工作目录**。
3. 汇报：两个产物路径、各区域节点数（validate / build 输出里有）、被截断的内容（若有）。
4. 提示用户：HTML 双击即开；JSON 可在画布应用里「导入画布 JSON」继续编辑（在线版 https://boommanpro.github.io/monopane/ ），再导出 PNG / 离线 HTML 分享。

## 常见坑（脚本管不到、需要人判断的部分）

- **选材克制**：节点上限是防噪声硬约束（validate 会报错），宁可截断 + `note` 说明省略了多少，也不要塞满；主流程只选一条。
- **连线 label ≤ 6–8 字**，超长语义挪进节点 `description`（validate 会对 >10 字 warn）。
- **长便签主动给 `size`**：默认 240×150 约容 3–4 行，420×320 约容 120 字（validate 会按行数 warn）。
- **时序图排布**：参与者多、互发消息时，让 blockIDs 顺序为「参与者在前、消息按时间线在后」，layout 会按此行优先铺开，避免对角长线。
- **id 命名**：`<类型前缀>-<业务名>`、小写短横线（`db-user`、`arch-gateway`、`note-db-truncated`），文件内唯一。
