# 画布 Schema 契约（Canvas Schema v1.1）

本文件是「项目画布」的**唯一数据契约**：解析 Skill（`.trae/skills/project-canvas-gen`）按它产出数据，Web 应用按它加载与渲染。任何字段变更都必须同步修改本文件与 `packages/canvas/src/types.ts`、`packages/canvas/src/document.ts`，并递增 `schemaVersion`。

## 1. 文件格式

一次画布导出 / 导入的完整文件内容：

```json
{
  "schemaVersion": "1.1",
  "nodes": [
    /* 节点数组，见第 3 节 */
  ],
  "edges": [
    /* 连线数组，见第 4 节 */
  ]
}
```

- `schemaVersion`：必填，当前为 `"1.1"`。应用校验 `major` 版本，不匹配时拒绝导入。
- `nodes` / `edges`：与 FlowGram 文档格式一致；`nodes` 为**扁平数组**，容器归属通过容器的 `data.blockIDs` 表达。
- 兼容性：导入时也接受不含 `schemaVersion` 的裸 FlowGram 文档（视为 `1.x`），导出时始终带 `schemaVersion`。

## 2. 区域布局规范

画布是**一张自由大画布**，划分为四个区域。每个区域由一个 `group` 容器节点承载，区域内所有节点都是该容器的子节点。

### 2.1 区域容器

| 区域         | 容器标题         | 容器 `data.color` | 容器绝对原点 `meta.position` |
| ------------ | ---------------- | ----------------- | ---------------------------- |
| 数据库结构区 | 数据库结构与关联 | `Blue`            | `{ "x": 0, "y": 0 }`         |
| 项目架构区   | 项目架构         | `Violet`          | `{ "x": 5600, "y": 0 }`      |
| 代码流程区   | 代码流程         | `Green`           | `{ "x": 0, "y": 5600 }`      |
| 运行逻辑区   | 项目运行逻辑     | `Orange`          | `{ "x": 5600, "y": 5600 }`   |

容器节点 JSON 形如：

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

> 容器尺寸由引擎按子节点包围盒 + 内边距自动计算，**不要**手写 `meta.size`。

### 2.2 子节点网格

子节点坐标**相对所属容器**。统一按网格落位：

```
x = col * 460
y = row * 380
```

- 列宽 460（节点卡宽 360 + 间距 100），行高 380。
- 每个区域的列数上限与推荐排布：

| 区域             | 列数 | 填充顺序                                    | 节点数上限 |
| ---------------- | ---- | ------------------------------------------- | ---------- |
| 数据库结构与关联 | 3    | 按表名字母序，逐行填充                      | 12         |
| 项目架构         | 4    | 按分层从上到下（前端 → 网关 → 服务 → 数据） | 16         |
| 代码流程         | 3    | 从入口开始按流向顺序                        | 20         |
| 项目运行逻辑     | 3    | 从启动到请求响应顺序                        | 12         |

- 超出上限时必须截断：只保留最重要的节点，并在同区域放一个 `note` 节点说明被省略的数量。
- 每张数据库表的高度由字段数决定（引擎自适应）。网格行高 380 可容纳 ≤ 8 个字段的表；字段数 > 8 时卡片内部滚动，不需要额外占位。

### 2.3 区域内的便签

允许在每个区域容器内放 `note` 节点补充说明，坐标同样按 2.2 网格落位，`note` 不计入节点数上限。

## 3. 节点类型

通用节点结构（FlowGram 格式）：

```json
{
  "id": "唯一 id，建议 `<类型前缀>-<业务名>`，如 db-user",
  "type": "见下表",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": {
    /* 各类型的业务字段 */
  }
}
```

> `meta.position`：顶层节点为绝对坐标，容器内子节点为相对坐标。

### 3.1 `db-table` 数据库表

```json
{
  "id": "db-user",
  "type": "db-table",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": {
    "title": "user",
    "comment": "用户主表",
    "fields": [
      { "name": "id", "type": "bigint", "flags": ["pk"], "comment": "主键" },
      { "name": "email", "type": "varchar(128)", "flags": ["unique"], "comment": "登录邮箱" },
      { "name": "tenant_id", "type": "bigint", "flags": ["fk", "nullable"] }
    ]
  }
}
```

- `title`：必填，表名（建议保留数据库真实命名风格，如 `snake_case`）。
- `comment`：可选，表说明。
- `fields`：必填，数组，顺序即展示顺序。建议主键在首、外键紧随。
- `fields[].name` / `fields[].type`：必填。
- `fields[].flags`：可选，取值 `pk`（主键）、`fk`（外键）、`unique`（唯一）、`nullable`（可空）。
- `fields[].comment`：可选。
- 端口：左侧 `input`、右侧 `output`，由引擎默认提供，无需声明。

### 3.2 `arch-component` 架构组件

```json
{
  "id": "arch-gateway",
  "type": "arch-component",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": {
    "title": "API 网关",
    "category": "gateway",
    "tech": ["Nginx", "Spring Cloud Gateway"],
    "description": "统一入口，负责鉴权、限流与路由转发"
  }
}
```

- `title`：必填，组件名。
- `category`：必填，取值见下表（决定图标与配色）。
- `tech`：可选，技术标签数组，最多 4 个。
- `description`：可选，一句话说明，建议 ≤ 40 字。

| category     | 含义            |
| ------------ | --------------- |
| `frontend`   | 前端 / 客户端   |
| `gateway`    | 网关 / 接入层   |
| `service`    | 业务服务        |
| `database`   | 数据库          |
| `cache`      | 缓存            |
| `queue`      | 消息队列        |
| `storage`    | 对象存储 / 文件 |
| `thirdparty` | 第三方服务      |
| `other`      | 其他            |

端口：左侧 `input`、右侧 `output`。

### 3.3 `flow-start` / `flow-end` / `flow-step` / `flow-decision` 流程节点

四者共用 `data.title` + `data.description`；`flow-decision` 额外有 `data.defaultBranch`。

```json
{
  "id": "flow-req-start",
  "type": "flow-start",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": { "title": "收到创建订单请求", "description": "POST /api/orders" }
}
```

```json
{
  "id": "flow-stock-check",
  "type": "flow-decision",
  "meta": { "position": { "x": 460, "y": 0 } },
  "data": {
    "title": "库存是否充足？",
    "description": "调用库存服务查询可售库存",
    "defaultBranch": "yes"
  }
}
```

- `flow-start`：必填，每个流程/区域至多一个（模拟执行从此出发）。端口：仅右侧 `output`。
- `flow-end`：可选，流程终点。端口：仅左侧 `input`。
- `flow-step`：普通步骤。端口：左右各一。
- `flow-decision`：判断节点。端口：左侧 `input`，右侧两个输出端口 `yes` / `no`（连线需通过 `sourcePortID` 指定）。
- `defaultBranch`：必填，取值 `yes` / `no`，用于浏览器内模拟执行时选择分支。

> 派生流程节点（与 `flow-step` 共用 `data.title` + `data.description`，端口左右各一，按 `flow` 连线）：
>
> - `flow-subprocess`：子流程，把一段内聚逻辑封装起来。
> - `flow-parallel`：并行网关，模拟执行时全部出边都会走到。
> - `flow-delay`：延时等待，等待外部回调 / 定时触发。
> - `flow-notify`：通知 / 领域事件发送。

### 3.4 `db-view` 数据库视图

```json
{
  "id": "db-order-view",
  "type": "db-view",
  "meta": { "position": { "x": 920, "y": 1140 } },
  "data": {
    "title": "v_order_overview",
    "comment": "订单概览视图",
    "fields": [{ "name": "order_id", "type": "bigint", "flags": ["pk"] }]
  }
}
```

- `title`：必填，视图名（建议 `v_` 前缀）。
- `comment`：可选，视图说明。
- `fields`：可选，字段数组，结构与 `db-table.fields` 完全一致。
- 端口：左侧 `input`、右侧 `output`。

### 3.5 `runtime-event` / `runtime-scheduled` 运行期节点

与流程节点共用 `data.title` + `data.description`，端口左右各一，按 `flow` 连线：

```json
{
  "id": "rt-req-in",
  "type": "runtime-event",
  "meta": { "position": { "x": 460, "y": 380 } },
  "data": { "title": "监听 HTTP 请求事件", "description": "容器触发请求到达事件" }
}
```

- `runtime-event`：运行期事件监听（如 HTTP / 领域事件接入点）。
- `runtime-scheduled`：运行期定时任务（心跳、指标上报、定时对账等）。

### 3.6 `note` 便签

```json
{
  "id": "note-1",
  "type": "note",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": {
    "size": { "width": 240, "height": 150 },
    "note": "本区域由 Prisma schema 自动生成"
  }
}
```

- `note`：必填，纯文本，支持换行。
- `size`：可选，默认 `240 × 150`。
- 无端口，不参与连线。

### 3.7 `group` 区域容器

见 2.1。仅用于四大区域，容器不可嵌套，子节点通过 `blockIDs` 声明。

### 3.8 `seq-participant` / `seq-message` 时序图节点

用于表达**系统交互时序**（谁在什么时候调用谁）。`seq-participant` 是参与者（角色 / 系统 / 服务），`seq-message` 是参与者之间的一次交互消息。

```json
{
  "id": "seq-participant-user",
  "type": "seq-participant",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": { "title": "用户", "comment": "终端用户" }
}
```

```json
{
  "id": "seq-message-submit-order",
  "type": "seq-message",
  "meta": { "position": { "x": 460, "y": 0 } },
  "data": { "title": "提交订单请求", "description": "POST /api/orders" }
}
```

- `seq-participant`：`title` 必填，参与者名；`comment` 可选，参与者说明。
- `seq-message`：`title` 必填，消息名；`description` 可选，消息内容 / 触发条件（**注意：是 `description` 不是 `comment`**）。
- 端口：两者左右各一（`input` + `output`），消息流按 `flow` 连线，方向即消息走向。

### 3.9 `df-source` / `df-transform` / `df-store` 数据流图节点

用于表达**数据流转**（数据从哪来、经过哪些处理、落到哪）。三者共用 `data.title` + `data.comment`：

```json
{
  "id": "df-source-kafka",
  "type": "df-source",
  "meta": { "position": { "x": 0, "y": 0 } },
  "data": { "title": "Kafka 用户行为流", "comment": "埋点实时上报" }
}
```

```json
{
  "id": "df-transform-aggregate",
  "type": "df-transform",
  "meta": { "position": { "x": 460, "y": 0 } },
  "data": { "title": "按日聚合", "comment": "窗口 1 天，输出 DWD 明细" }
}
```

```json
{
  "id": "df-store-dws",
  "type": "df-store",
  "meta": { "position": { "x": 920, "y": 0 } },
  "data": { "title": "DWS 汇总表", "comment": "按维度汇总，供报表查询" }
}
```

- `df-source`：数据源（业务系统 / 事件流 / 上游库表），`title` 必填。
- `df-transform`：数据转换 / 处理（清洗、聚合、加工），`title` 必填。
- `df-store`：数据存储（数仓表 / 报表库），`title` 必填。
- `comment`：三者均可选，补充说明 / 口径描述。
- 端口：三者左右各一（`input` + `output`），数据流按 `flow` 连线，方向即数据流向。

## 4. 连线语义

```json
{
  "sourceNodeID": "db-user",
  "targetNodeID": "db-order",
  "data": { "kind": "db-relation", "relation": "1:N", "label": "user.id → order.user_id" }
}
```

| `kind`        | 语义     | 端口要求                                                 | 标签                                                |
| ------------- | -------- | -------------------------------------------------------- | --------------------------------------------------- |
| `db-relation` | 表关联   | 默认端口（输出 → 输入）                                  | `relation` 取 `1:1` / `1:N` / `N:N`，渲染在连线中点 |
| `dependency`  | 架构依赖 | 默认端口                                                 | `label` 为依赖说明（可选）                          |
| `flow`        | 流程走向 | `flow-decision` 出边必须带 `sourcePortID: "yes" \| "no"` | `branch` 可重复标记分支；`label` 为条件说明         |

约束：

- 不允许自环（同一节点连自己）。
- 不允许跨区域连线（四个区域之间不连线）。
- 连线方向即数据 / 控制流方向，箭头由引擎渲染。
- 每个区域内部的连线数量建议 ≤ 节点数 × 1.5，避免噪声。

## 5. 校验清单（Skill 输出前自检）

1. `schemaVersion` = `"1.1"`，`nodes` / `edges` 均为数组。
2. 每个区域容器存在且 `meta.position` 等于 2.1 表格中的原点。
3. 所有子节点 id 出现在其所属容器的 `data.blockIDs` 中，且不出现在其他容器的 `blockIDs` 中。
4. 子节点坐标满足 `x % 460 === 0 && y % 380 === 0`。
5. 节点 `type` 属于第 3 节列出的节点类型之一。
6. 每个节点 `data` 的必填字段齐全（`db-table.fields`、`arch-component.category`、`flow-decision.defaultBranch` 等）。
7. `flow-decision` 的出边都带 `sourcePortID`。
8. 无自环、无跨区域连线。
9. 各区域节点数不超过上限（见 2.2），超出已截断并留 `note` 说明。

## 6. 版本演进

- `1.0`：初始版本，四大区域 + 7 类节点 + 3 类连线。（2026-09-25）
- `1.1`：扩展节点类型：`db-view`、`flow-subprocess` / `flow-parallel` / `flow-delay` / `flow-notify`、`runtime-event` / `runtime-scheduled`。（2026-09-26）
