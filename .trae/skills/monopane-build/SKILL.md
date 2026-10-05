---
name: 'monopane-build'
description: '把任意输入（代码仓库、网站、产品文档、直接贴的文本）解析成「项目文档画布」JSON（Canvas Schema v1.1），并构建为可离线双击打开的单体 HTML。最终展示形式是 monopane 画布效果。当用户想可视化理解一个项目 / 产品 / 网站的结构与运行逻辑，或说「分析项目生成画布」「给这个仓库生成项目文档」「generate canvas for this repo」「把这个项目的数据库/架构/流程画出来」「分析这个网站」时调用；输入可以是本地仓库路径、GitHub URL、网站 URL、产品文档或直接贴的文本。'
---

# 项目文档画布生成器（monopane-build）

把**任意输入**解析成符合 `docs/canvas-schema.md`（Canvas Schema v1.1）的单一 JSON 文件。
该 JSON 可被「项目文档画布」Web 应用直接导入，渲染为一张带小地图的自由画布，并可打成**可离线双击打开的单体 HTML**。

- 数据契约（唯一权威）：`docs/canvas-schema.md`
- 领域层实现：`packages/canvas/src`（`types.ts` 定义节点类型，`document.ts` 定义文档结构，`validate.ts` 提供 `validateCanvasFile`）
- 应用侧校验兜底：`packages/app/src/data/storage.ts` 调用 `@monopane/canvas` 的 `validateCanvasFile`
- 自检脚本：`scripts/validate-canvas.mjs`

## 运行环境（先读）

本 skill 位于 **monopane 仓库**内（`.trae/skills/monopane-build/`）。下文中所有 shell 命令都以 **monopane 仓库根目录**为工作目录，或直接把路径换成绝对路径执行：

- 仓库根 `$REPO_ROOT` = 本 skill 文件 `SKILL.md` 向上 3 级目录（含 `.git` 与 `pnpm-workspace.yaml` 的那一层）；
- 执行前先确认：`cd "$REPO_ROOT"` 可用、且 `node_modules` 已安装（`pnpm install`）；
- **不要**在临时目录里跑这些命令——相对路径（`.trae/...`、`packages/app/...`）都以仓库根为基准。

> 为什么这样：如果你 clone 目标仓库到 `$TMPDIR` 后在那里执行，`node .trae/...`、`node packages/app/...` 会找不到文件而失败。所有校验 / 构建脚本都假设以 monopane 仓库根为 cwd。

## 何时调用

- 「分析这个项目生成画布」/「生成项目文档画布」/「generate canvas for this repo」
- 用户给出本地仓库路径、GitHub URL、**网站 URL**（如 `https://scriptcat.org/zh-CN`）、产品文档 / PRD，或直接贴一段文本，希望在画布上理解「能做什么、怎么运行、有哪些发展方向」
- 需要为项目补齐 ER 图 / 架构图 / 流程图 / 运行逻辑图
- 用户只是想知道内容摘要时**不要**调用本 skill；本 skill 的产出是画布（JSON + 单体 HTML）。

不适用：仅需要文字说明、或只想看单个文件的场景。

## 输入（不限类型）

1. **本地仓库路径**：直接用，先确认目录存在且是仓库根（含 `.git` 或语言清单文件）。
2. **GitHub URL**：若本地无该仓库，clone 到临时目录：
   ```bash
   git clone --depth 1 <url> "$TMPDIR/<repo-name>"
   ```
   解析完成后可保留（用户可能要求二次分析），不要 `rm -rf` 用户已存在的目录。
   > 注意：GitHub URL 必须是**代码仓库地址**（`https://github.com/owner/repo`）；网站官网首页不是仓库，无法 clone。
3. **网站 URL**：用浏览器 / 网页抓取读取公开页面内容（功能介绍、文档、架构说明）。抓不到全部内容时，基于可读到的页面 + 通用领域知识推断，并在产物 `note` 里说明依据。
4. **产品文档 / PRD / 文章**：用户直接提供的文本或文件路径，作为主要素材。
5. 什么都没有时，先问用户要输入。

**技术栈优先级**：Node.js/TypeScript、Python、Java、Go 优先做深度解析；其他栈同样支持，但按通用启发式降级处理。

## 两种模式（先定模式，再走对应工作流）

| 模式                      | 适用输入                         | 区域语义                                                                         |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| **A 代码仓库模式**        | 本地仓库路径 / GitHub URL        | 数据库结构与关联、项目架构、代码流程、项目运行逻辑（可扩展时序图 / 数据流图）    |
| **B 网站 / 产品文档模式** | 网站 URL / 产品文档 / PRD / 文本 | 区域标题自由命名，按内容组织：如「能做什么」「怎么运行」「发展方向」「关键交互」 |

- 输入是代码仓库 → 走**模式 A**（下面「工作流：模式 A」）。
- 输入是网站、文档或文本 → 走**模式 B**（下面「工作流：模式 B」）。
- 混合输入（既给仓库又给文档）→ 以信息量大的为准，另一份作为补充素材。
- 两种模式**共用同一份数据契约**：区域容器按 **slot id**（`group-db` / `group-arch` / `group-flow` / `group-runtime` / `group-seq` / `group-df`）识别，`data.title` 与 `data.color` 允许自定义（标题自由命名，必须是非空字符串）；不需要的区域可以不建容器。

## 工作流：模式 A（代码仓库模式，固定八步，必须逐条执行）

### 1. 项目概览

读清单文件判断语言 / 框架 / 构建方式：
`package.json`、`pnpm-workspace.yaml`、`pyproject.toml` / `requirements.txt`、`go.mod`、`pom.xml` / `build.gradle`、`Cargo.toml`、`composer.json`。
同时看：目录顶层结构、`docker-compose.yml`、`Dockerfile`、`*.env.example`、README 的架构章节。

### 2. 数据库结构 → 区域「数据库结构与关联」（左上）

按优先级扫描 DDL 与 ORM 模型：

| 技术栈  | 扫描目标                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| 通用    | `**/*.sql`、`migrations/**`、`schema.sql`                                                                   |
| Node/TS | `schema.prisma`、`@Entity()` / `@Column()`（TypeORM）、`sequelize.define`、`drizzle` schema、Knex migration |
| Python  | Django `models.Model`、SQLAlchemy `__tablename__` / `declarative_base`、Alembic `versions/**`               |
| Java    | JPA `@Entity` / `@Table` / `@JoinColumn`、MyBatis `*.xml` resultMap                                         |
| Go      | GORM `gorm:"..."` tag、`AutoMigrate`、`*.sql`                                                               |

提取：表名、字段（名/类型/可空/注释）、主键、唯一键、外键，以及表间关联方向与基数（1:1 / 1:N / N:N）。
存在数据库视图（`CREATE VIEW`、ORM 中的只读投影 / 报表维度）时，用 `db-view` 节点表达，`fields` 结构与 `db-table` 一致（可选）。
找不到任何 DDL/ORM 时，跳过该区域所有表/视图节点，改放一个 `note` 说明「未发现显式数据库定义」。

### 3. 项目架构 → 区域「项目架构」（右上）

- 目录分层 → `category`（`frontend` / `gateway` / `service` / `database` / `cache` / `queue` / `storage` / `thirdparty` / `other`）
- 依赖清单 → `tech` 标签（最多 4 个，取最重要的）
- 服务间依赖（HTTP client 调用、RPC、import 跨模块）→ `dependency` 连线
- 排布方向：前端 → 网关 → 服务 → 数据，逐层向下

### 4. 代码流程 → 区域「代码流程」（左下）

从入口出发追踪主链路：路由注册 → controller / handler → service → repository / dao。

- 每个关键跳转一个 `flow-step`；条件分支用 `flow-decision`（必须给 `defaultBranch`）
- 起点 `flow-start`（每区域至多一个），终点 `flow-end`
- 内聚逻辑封装用 `flow-subprocess`；并行分支用 `flow-parallel`；等待外部回调 / 定时触发用 `flow-delay`；发通知 / 领域事件用 `flow-notify`
- 连线 `kind: "flow"`，`flow-decision` 的出边必须带 `sourcePortID: "yes" | "no"`；分支可用 `branch` 重复标记
- 选**一条**最能代表项目的主流程，不要把所有接口都画上

### 5. 运行逻辑 → 区域「项目运行逻辑」（右下）

启动流程（bootstrap / main / DI 装配 / 中间件注册）与一次请求的生命周期（鉴权 → 限流 → 参数校验 → 业务 → 持久化 → 响应）。
事件监听、定时任务等运行期行为用 `runtime-event` / `runtime-scheduled` 表达。

### 6. 生成 JSON

按下方「布局与格式」写出 `<项目名>-canvas.json`。**坐标必须按规范计算**，不要凭感觉写。

### 7. 自检（必须执行，不得跳过）

在仓库根执行（见「运行环境」）：

```bash
cd "$REPO_ROOT"
node .trae/skills/monopane-build/scripts/validate-canvas.mjs <产物路径>
```

脚本报错必须修完再交付。脚本通过后，再用 `docs/canvas-schema.md` 第 5 节清单人工复核一遍语义问题（表关联方向、分支端口、是否漏了必填字段）。

### 8. 构建单体 HTML（交付时默认执行）

校验通过后用构建脚本把画布 JSON 打成**可离线双击打开的单体 HTML**（JS / CSS / 字体全部内联，不依赖外部网络）：

```bash
cd "$REPO_ROOT"
node packages/app/scripts/build-standalone.mjs <产物路径> [<输出.html>]
```

- 输出路径省略时，与 JSON 同目录、同名 `.html`；
- 脚本会自动生成 viewer 模板（若缺失），**无需**手动预构建；若仍失败，按报错提示处理；
- 构建成功后**必须自检产物**：确认输出文件已生成、体积合理（MB 级），并抽查开头含 `window.__CANVAS_DATA__` 注入数据；
- 交付时同时给出 JSON 与 HTML 两个产物路径。

> 应用内「导出离线 HTML」走的是同一套模板与注入逻辑（`src/export/standalone-html.ts`），产物与 CLI 一致。

## 工作流：模式 B（网站 / 产品文档模式）

输入是网站、产品文档、PRD 或直接贴的文本时，按下面五步组织画布。产出契约（slot id、网格、节点类型、自检、构建）与模式 A 完全相同，**只需**在区域语义上换一套。

### B1. 提炼内容骨架

把素材拆成几大主题，映射到区域 slot（`data.title` 自由命名，不必用默认标题）：

| slot id         | 代码仓库默认标题 | 产品文档常见自定义标题（举例）              |
| --------------- | ---------------- | ------------------------------------------- |
| `group-db`      | 数据库结构与关联 | 数据结构 / 信息架构（无数据库可省略该区域） |
| `group-arch`    | 项目架构         | 能做什么（能力地图 / 功能总览）             |
| `group-flow`    | 代码流程         | 核心流程（用户旅程 / 业务流转）             |
| `group-runtime` | 项目运行逻辑     | 怎么运行（部署形态 / 技术实现 / 工作机制）  |
| `group-seq`     | 时序图           | 关键交互（一次完整使用的时序）              |
| `group-df`      | 数据流图         | 数据流转（数据从哪来到哪去）                |

- 至少建一个区域；只保留信息量足够支撑 3 个以上节点的主题，主题太多时合并或截断。
- 拿不准的推断标注出来：在相应区域放一个 `note` 写「依据 XX 页面/文档推断」。

### B2. 组节点

- 「能做什么」区：每个核心能力一个 `arch-component`（`category` 用 `frontend` / `service` / `thirdparty` / `other` 等），按能力分组排列，依赖关系用 `dependency` 连线。
- 「核心流程」区：主线用 `flow-start` → `flow-step` → `flow-end`，分支用 `flow-decision`（带 `defaultBranch`）。
- 「怎么运行」区：部署组件、运行环境用 `arch-component`；事件 / 定时行为用 `runtime-event` / `runtime-scheduled`。
- 「关键交互」区：参与方用 `seq-participant`，一次交互消息用 `seq-message` 按 `flow` 连线。
- 「数据流转」区：`df-source` → `df-transform` → `df-store` 串联。
- 跨主题的引用关系用 `note` 写说明，不要跨区域连线。

### B3. 生成 JSON

按下方「布局与格式」写出 `<名称>-canvas.json`。区域容器用上述 slot id，标题/配色自定义。

### B4. 自检（必须执行，不得跳过）

```bash
cd "$REPO_ROOT"
node .trae/skills/monopane-build/scripts/validate-canvas.mjs <产物路径>
```

脚本报错必须修完再交付；再用 `docs/canvas-schema.md` 第 5 节清单人工复核语义。

### B5. 构建单体 HTML（交付时默认执行）

```bash
cd "$REPO_ROOT"
node packages/app/scripts/build-standalone.mjs <产物路径> [<输出.html>]
```

构建成功后**必须自检产物**（文件已生成、体积合理、含 `window.__CANVAS_DATA__` 注入），交付时同时给出 JSON 与 HTML 两个路径。

## 布局与格式

### 文件结构

```json
{
  "schemaVersion": "1.1",
  "nodes": [
    /* ... */
  ],
  "edges": [
    /* ... */
  ]
}
```

### 区域容器（坐标是绝对坐标，写死在容器 `meta.position`）

区域容器按 **slot id** 识别（`group-db` / `group-arch` / `group-flow` / `group-runtime` / `group-seq` / `group-df`）。`data.title` 与 `data.color` **允许自定义**（标题自由命名，必须是非空字符串），下表中的标题/配色是代码仓库模式的默认值；不需要的区域可以不建容器。

| slot id         | 默认 `data.title` | 默认 `data.color` | 原点                |
| --------------- | ----------------- | ----------------- | ------------------- |
| `group-db`      | 数据库结构与关联  | `Blue`            | `{x:0, y:0}`        |
| `group-arch`    | 项目架构          | `Violet`          | `{x:5600, y:0}`     |
| `group-flow`    | 代码流程          | `Green`           | `{x:0, y:5600}`     |
| `group-runtime` | 项目运行逻辑      | `Orange`          | `{x:5600, y:5600}`  |
| `group-seq`     | 时序图            | `Cyan`            | `{x:0, y:11200}`    |
| `group-df`      | 数据流图          | `Indigo`          | `{x:5600, y:11200}` |

容器节点形如（模式 B 中 `title` 可换成「能做什么」等自定义标题）：

```json
{
  "id": "group-db",
  "type": "group",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": {
    "parentID": "root",
    "title": "数据库结构与关联",
    "color": "Blue",
    "blockIDs": ["db-user", "db-order"]
  }
}
```

容器**不要**写 `meta.size`（引擎按子节点包围盒自适应）。

### 子节点网格（相对容器坐标）

```
x = col * 460   y = row * 380
```

列数上限 / 填充顺序 / 节点数上限（自定义标题时仍按 slot 的列数/上限约束）：

| slot id         | 列数 | 填充顺序             | 上限 |
| --------------- | ---- | -------------------- | ---- |
| `group-db`      | 3    | 表名字母序           | 12   |
| `group-arch`    | 4    | 分层从上到下         | 16   |
| `group-flow`    | 3    | 按流向               | 20   |
| `group-runtime` | 3    | 启动 → 请求响应      | 12   |
| `group-seq`     | 4    | 按时间线从上到下     | 12   |
| `group-df`      | 4    | 数据源 → 转换 → 存储 | 12   |

超出上限就截断：只保留最重要的节点，并在同区域放一个 `note` 说明省略了多少个。
`note` 不计入上限，坐标同样按网格落位。

### 节点类型（20 类，`type` 字段取值）

| type                | data 必填                                                                          | 端口                      |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------- |
| `db-table`          | `title`、`fields[]`（`name`/`type` 必填，`flags` ∈ `pk`/`fk`/`unique`/`nullable`） | 左 in / 右 out            |
| `db-view`           | `title`（数据库视图，`fields[]` 可选）                                             | 左 in / 右 out            |
| `arch-component`    | `title`、`category`                                                                | 左 in / 右 out            |
| `flow-start`        | `title`                                                                            | 仅右 out                  |
| `flow-end`          | `title`                                                                            | 仅左 in                   |
| `flow-step`         | `title`                                                                            | 左 in / 右 out            |
| `flow-decision`     | `title`、`defaultBranch` ∈ `yes`/`no`                                              | 左 in / 右 out `yes`+`no` |
| `flow-subprocess`   | `title`（子流程，封装内聚逻辑）                                                    | 左 in / 右 out            |
| `flow-parallel`     | `title`（并行网关，模拟执行时全部出边都走）                                        | 左 in / 右 out            |
| `flow-delay`        | `title`（延时等待，等外部回调 / 定时触发）                                         | 左 in / 右 out            |
| `flow-notify`       | `title`（通知 / 领域事件发送）                                                     | 左 in / 右 out            |
| `runtime-event`     | `title`（运行期事件监听，如 HTTP / 领域事件接入点）                                | 左 in / 右 out            |
| `runtime-scheduled` | `title`（运行期定时任务，如心跳、指标上报、定时对账）                              | 左 in / 右 out            |
| `seq-participant`   | `title`（时序图参与者，`comment` 可选）                                            | 左 in / 右 out            |
| `seq-message`       | `title`（时序图消息，`description` 可选）                                          | 左 in / 右 out            |
| `df-source`         | `title`（数据源，`comment` 可选）                                                  | 左 in / 右 out            |
| `df-transform`      | `title`（数据转换，`comment` 可选）                                                | 左 in / 右 out            |
| `df-store`          | `title`（数据存储，`comment` 可选）                                                | 左 in / 右 out            |
| `note`              | `note`（纯文本）                                                                   | 无                        |
| `group`             | `title`、`color`、`blockIDs`                                                       | 无                        |

可选字段：`db-table.comment`、`db-view.comment`（`db-view.fields[]` 可选，结构与 `db-table.fields` 一致）、`arch-component.tech[]`（≤4）、`arch-component.description`（≤40 字）、`flow-*.description`、`seq-participant.comment`、`seq-message.description`、`df-*.comment`、`note.size`（默认 240×150）。

扩展节点说明：

- 流程扩展：`flow-subprocess`（子流程，把一段内聚逻辑封装起来）、`flow-parallel`（并行网关，模拟执行时全部出边都走）、`flow-delay`（延时等待，等待外部回调 / 定时触发）、`flow-notify`（通知 / 领域事件发送），与 `flow-step` 共用 `data.title` + `data.description`，按 `flow` 连线。
- 运行期：`runtime-event`（运行期事件监听，如 HTTP / 领域事件接入点）、`runtime-scheduled`（运行期定时任务，如心跳、指标上报、定时对账），与流程节点共用 `data.title` + `data.description`，按 `flow` 连线，通常放在「项目运行逻辑」区域。
- 时序图：代码仓库中出现**跨模块调用链**、**请求-响应交互**、**事件通知**等时序关系时，用 `seq-participant` 表达参与方、`seq-message` 表达一次交互消息，消息流按 `flow` 连线。
- 数据流图：出现**数据采集 → 清洗/聚合 → 落库**这类流转时，用 `df-source`（数据源）→ `df-transform`（转换处理）→ `df-store`（存储）串联，数据流按 `flow` 连线。
- 扩展节点同样放进某个区域容器，遵守网格坐标与连线约束。

### 连线

```json
{
  "sourceNodeID": "db-user",
  "targetNodeID": "db-order",
  "data": { "kind": "db-relation", "relation": "1:N", "label": "user.id → order.user_id" }
}
```

| `kind`        | 用途     | 额外要求                                                                    |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `db-relation` | 表关联   | `relation` ∈ `1:1`/`1:N`/`N:N`                                              |
| `dependency`  | 架构依赖 | `label` 可选                                                                |
| `flow`        | 流程走向 | `flow-decision` 出边必须带 `sourcePortID`；`branch` ∈ `yes`/`no` 可重复标记 |

硬约束：**无自环**、**不跨区域连线**、连线方向即数据/控制流方向。

### id 命名

`<类型前缀>-<业务名>`，小写短横线：`db-user`、`arch-gateway`、`flow-start-order`、`note-db-truncated`。
同一文件内 id 必须唯一；容器的 `blockIDs` 与节点 id 必须能对上，且一个子节点只能属于一个容器。

## 输出（交付物 = JSON + 单体 HTML，HTML 是默认必备）

1. **画布 JSON**：写到用户指定位置；未指定则写到**被分析项目的当前目录**下 `<repo-name>-canvas.json`。
2. **单体 HTML**（同目录同名 `.html`，第 8 步构建）：默认必须产出，供直接双击打开 / 当附件发送；构建失败时必须修复重试，不允许只交付 JSON 就算完成（除非用户明确只要 JSON）。
3. 交付时给出：两个产物路径、各区域节点/连线数量、被截断的内容（若有）。
4. 提示用户：HTML 可直接打开；JSON 可在画布应用里点「导入画布 JSON」继续编辑（在线版：https://boommanpro.github.io/monopane/ ），之后可导出 PNG / 离线 HTML 分享。

## 常见坑

- **坐标算错**：子节点是**相对容器**坐标；`x % 460 === 0 && y % 380 === 0`，不要写零散数值。
- **忘了 `blockIDs`**：节点写在 `nodes` 里但没进任何容器的 `blockIDs`，就会孤零零飘在画布上。
- **`flow-decision` 出边漏 `sourcePortID`**：会导致连线挂不到 `yes`/`no` 端口，导入后线错位。
- **`flow-start` 放了多个**：一个区域只留一个，模拟执行从它出发。
- **字段列表过长**：单表字段超过 8 个时卡片内部滚动，无需额外占位；但字段超过 20 个建议只留关键字段 + `comment` 说明。
- **把整个仓库都画上**：节点上限是防噪声的硬约束，宁可截断 + `note` 说明，也不要塞满。
