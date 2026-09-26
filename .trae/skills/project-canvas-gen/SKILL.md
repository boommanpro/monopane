---
name: 'project-canvas-gen'
description: '把任意代码仓库解析成「项目文档画布」JSON：数据库 ER、项目架构、代码流程、运行逻辑四区域，可直接导入画布应用查看。当用户说「分析项目生成画布」「给这个仓库生成项目文档」「generate canvas for this repo」「把这个项目的数据库/架构/流程画出来」，或提供了一个本地项目路径 / GitHub URL 想可视化时调用。'
---

# 项目文档画布生成器（project-canvas-gen）

把一个代码仓库解析成符合 `docs/canvas-schema.md`（Canvas Schema v1.1）的单一 JSON 文件。
该 JSON 可被「项目文档画布」Web 应用直接导入，渲染为一张带小地图的自由画布。

- 数据契约（唯一权威）：`docs/canvas-schema.md`
- 领域层实现：`packages/canvas/src`（`types.ts` 定义节点类型，`document.ts` 定义文档结构，`validate.ts` 提供 `validateCanvasFile`）
- 应用侧校验兜底：`packages/app/src/data/storage.ts` 调用 `@monopane/canvas` 的 `validateCanvasFile`
- 自检脚本：`scripts/validate-canvas.mjs`

## 何时调用

- 「分析这个项目生成画布」/「生成项目文档画布」/「generate canvas for this repo」
- 用户给出本地仓库路径，或 GitHub URL（如 `https://github.com/owner/repo`），希望在画布上理解项目
- 需要为项目补齐 ER 图 / 架构图 / 流程图 / 运行逻辑图

不适用：仅需要文字说明、或只想看单个文件的场景。

## 输入

1. **本地路径**：直接用，先确认目录存在且是仓库根（含 `.git` 或语言清单文件）。
2. **GitHub URL**：若本地无该仓库，clone 到临时目录：
   ```bash
   git clone --depth 1 <url> "$TMPDIR/<repo-name>"
   ```
   解析完成后可保留（用户可能要求二次分析），不要 `rm -rf` 用户已存在的目录。
3. 两者都缺时，先问用户要路径或 URL。

**技术栈优先级**：Node.js/TypeScript、Python、Java、Go 优先做深度解析；其他栈同样支持，但按通用启发式降级处理。

## 工作流（固定七步，必须逐条执行）

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
找不到任何 DDL/ORM 时，跳过该区域所有表节点，改放一个 `note` 说明「未发现显式数据库定义」。

### 3. 项目架构 → 区域「项目架构」（右上）

- 目录分层 → `category`（`frontend` / `gateway` / `service` / `database` / `cache` / `queue` / `storage` / `thirdparty` / `other`）
- 依赖清单 → `tech` 标签（最多 4 个，取最重要的）
- 服务间依赖（HTTP client 调用、RPC、import 跨模块）→ `dependency` 连线
- 排布方向：前端 → 网关 → 服务 → 数据，逐层向下

### 4. 代码流程 → 区域「代码流程」（左下）

从入口出发追踪主链路：路由注册 → controller / handler → service → repository / dao。

- 每个关键跳转一个 `flow-step`；条件分支用 `flow-decision`（必须给 `defaultBranch`）
- 起点 `flow-start`（每区域至多一个），终点 `flow-end`
- 连线 `kind: "flow"`，`flow-decision` 的出边必须带 `sourcePortID: "yes" | "no"`
- 选**一条**最能代表项目的主流程，不要把所有接口都画上

### 5. 运行逻辑 → 区域「项目运行逻辑」（右下）

启动流程（bootstrap / main / DI 装配 / 中间件注册）与一次请求的生命周期（鉴权 → 限流 → 参数校验 → 业务 → 持久化 → 响应）。

### 6. 生成 JSON

按下方「布局与格式」写出 `<项目名>-canvas.json`。**坐标必须按规范计算**，不要凭感觉写。

### 7. 自检（必须执行，不得跳过）

```bash
node .trae/skills/project-canvas-gen/scripts/validate-canvas.mjs <产物路径>
```

脚本报错必须修完再交付。脚本通过后，再用 `docs/canvas-schema.md` 第 5 节清单人工复核一遍语义问题（表关联方向、分支端口、是否漏了必填字段）。

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

### 四大区域容器（坐标是绝对坐标，写死在容器 `meta.position`）

| 区域   | 容器 `data.title` | `data.color` | 原点               |
| ------ | ----------------- | ------------ | ------------------ |
| 数据库 | 数据库结构与关联  | `Blue`       | `{x:0, y:0}`       |
| 架构   | 项目架构          | `Violet`     | `{x:5600, y:0}`    |
| 流程   | 代码流程          | `Green`      | `{x:0, y:5600}`    |
| 运行   | 项目运行逻辑      | `Orange`     | `{x:5600, y:5600}` |

容器节点形如：

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

列数上限 / 填充顺序 / 节点数上限：

| 区域             | 列数 | 填充顺序        | 上限 |
| ---------------- | ---- | --------------- | ---- |
| 数据库结构与关联 | 3    | 表名字母序      | 12   |
| 项目架构         | 4    | 分层从上到下    | 16   |
| 代码流程         | 3    | 按流向          | 20   |
| 项目运行逻辑     | 3    | 启动 → 请求响应 | 12   |

超出上限就截断：只保留最重要的节点，并在同区域放一个 `note` 说明省略了多少个。
`note` 不计入上限，坐标同样按网格落位。

### 节点类型（12 类，`type` 字段取值）

| type             | data 必填                                                                          | 端口                      |
| ---------------- | ---------------------------------------------------------------------------------- | ------------------------- |
| `db-table`       | `title`、`fields[]`（`name`/`type` 必填，`flags` ∈ `pk`/`fk`/`unique`/`nullable`） | 左 in / 右 out            |
| `arch-component` | `title`、`category`                                                                | 左 in / 右 out            |
| `flow-start`     | `title`                                                                            | 仅右 out                  |
| `flow-end`       | `title`                                                                            | 仅左 in                   |
| `flow-step`      | `title`                                                                            | 左 in / 右 out            |
| `flow-decision`  | `title`、`defaultBranch` ∈ `yes`/`no`                                              | 左 in / 右 out `yes`+`no` |
| `seq-participant`| `title`（时序图参与者，`comment` 可选）                                            | 左 in / 右 out            |
| `seq-message`    | `title`（时序图消息，`description` 可选）                                          | 左 in / 右 out            |
| `df-source`      | `title`（数据源，`comment` 可选）                                                  | 左 in / 右 out            |
| `df-transform`   | `title`（数据转换，`comment` 可选）                                                | 左 in / 右 out            |
| `df-store`       | `title`（数据存储，`comment` 可选）                                                | 左 in / 右 out            |
| `note`           | `note`（纯文本）                                                                   | 无                        |
| `group`          | `title`、`color`、`blockIDs`                                                       | 无                        |

可选字段：`db-table.comment`、`arch-component.tech[]`（≤4）、`arch-component.description`（≤40 字）、`flow-*.description`、`seq-participant.comment`、`seq-message.description`、`df-*.comment`、`note.size`（默认 240×150）。

时序图 / 数据流图（新图种）说明：
- 时序图：代码仓库中出现**跨模块调用链**、**请求-响应交互**、**事件通知**等时序关系时，用 `seq-participant` 表达参与方、`seq-message` 表达一次交互消息，消息流按 `flow` 连线。
- 数据流图：出现**数据采集 → 清洗/聚合 → 落库**这类流转时，用 `df-source`（数据源）→ `df-transform`（转换处理）→ `df-store`（存储）串联，数据流按 `flow` 连线。
- 新图种节点同样放进某个区域容器，遵守网格坐标与连线约束。

### 连线

```json
{
  "sourceNodeID": "db-user",
  "targetNodeID": "db-order",
  "data": { "kind": "db-relation", "relation": "1:N", "label": "user.id → order.user_id" }
}
```

| `kind`        | 用途     | 额外要求                                  |
| ------------- | -------- | ----------------------------------------- |
| `db-relation` | 表关联   | `relation` ∈ `1:1`/`1:N`/`N:N`            |
| `dependency`  | 架构依赖 | `label` 可选                              |
| `flow`        | 流程走向 | `flow-decision` 出边必须带 `sourcePortID` |

硬约束：**无自环**、**不跨区域连线**、连线方向即数据/控制流方向。

### id 命名

`<类型前缀>-<业务名>`，小写短横线：`db-user`、`arch-gateway`、`flow-start-order`、`note-db-truncated`。
同一文件内 id 必须唯一；容器的 `blockIDs` 与节点 id 必须能对上，且一个子节点只能属于一个容器。

## 输出

- 文件写到用户指定位置；未指定则写到**被分析项目的当前目录**下 `<repo-name>-canvas.json`
- 交付时给出：文件路径、各区域节点/连线数量、被截断的内容（若有）
- 提示用户：在画布应用里点「导入画布 JSON」即可查看（在线版：https://boommanpro.github.io/monopane/ ），之后可导出 PNG / 离线 HTML 分享

## 常见坑

- **坐标算错**：子节点是**相对容器**坐标；`x % 460 === 0 && y % 380 === 0`，不要写零散数值。
- **忘了 `blockIDs`**：节点写在 `nodes` 里但没进任何容器的 `blockIDs`，就会孤零零飘在画布上。
- **`flow-decision` 出边漏 `sourcePortID`**：会导致连线挂不到 `yes`/`no` 端口，导入后线错位。
- **`flow-start` 放了多个**：一个区域只留一个，模拟执行从它出发。
- **字段列表过长**：单表字段超过 8 个时卡片内部滚动，无需额外占位；但字段超过 20 个建议只留关键字段 + `comment` 说明。
- **把整个仓库都画上**：节点上限是防噪声的硬约束，宁可截断 + `note` 说明，也不要塞满。
