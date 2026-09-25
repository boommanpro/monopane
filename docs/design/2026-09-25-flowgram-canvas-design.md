# 项目画布（Flowgram Canvas）设计文档

> **归档说明**：本文是立项时的设计文档，记录的是项目改名为 **monopane** 并拆分为 pnpm monorepo 之前的状态。文中出现的 `flowgram-diagram/` 目录结构与扁平的 `src/` 路径均已过时，当前的目录结构与命令请以 [README.md](../../README.md) 为准；数据契约本身未变，仍以 [docs/canvas-schema.md](../canvas-schema.md) 为唯一权威。

- 日期：2026-09-25
- 状态：设计评审通过，待实施
- 技术基座：FlowGram free-layout（React 18 + TypeScript + Rsbuild + Semi Design）

## 1. 背景与目标

构建一个基于 FlowGram free-layout 的自由画布 Web 应用，用于承载并分享项目的技术全景内容：

1. 数据库结构与关联关系（ER 图）
2. 项目架构图
3. 代码流程图
4. 项目运行逻辑

同时提供一个 TRAE 解析 Skill：输入任意项目仓库，自动分析并生成符合画布 Schema 的初始数据，实现「代码仓库 → 画布」的自动化，团队任何人使用该 Skill 即可为自己的项目生成画布。

## 2. 已确认的关键决策

| 决策点     | 结论                                                                  |
| ---------- | --------------------------------------------------------------------- |
| 内容来源   | 专用解析 Skill 分析项目仓库，生成 canvas JSON 后导入应用              |
| Skill 输入 | 本地路径 + GitHub URL（无本地代码时自动 clone 到临时目录）            |
| 技术栈范围 | 优先支持 Node.js/TS、Python、Java、Go（Skill 为 AI 驱动解析，不限栈） |
| 画布组织   | 单张自由大画布，四大区域 group 分组 + 小地图导航                      |
| 分享方式   | 只读预览模式、导出 PNG、导出/导入 JSON、导出单体 HTML（双击即看）     |
| 运行逻辑   | 静态文档 + 浏览器内模拟执行双支持，不连真实服务端                     |
| 默认数据   | 内置虚构示例项目（四区域内容齐全）                                    |
| 实现方案   | A + a：官方 free-layout 脚手架改造 + 自研轻量拓扑模拟执行器           |
| 界面语言   | 中文                                                                  |

## 3. 总体架构

三个交付物 + 一个核心契约：

```
┌── 契约: docs/canvas-schema.md（画布 Schema 规范）───────┐
│                                                        │
│  [项目仓库] ──② 解析 Skill──> canvas-data.json ──导入──┼──> ③ Web 应用
│                                                        │     编辑 · 只读预览
│                                                        │     模拟执行
│                                                        │     PNG / JSON / 单体HTML 导出
└────────────────────────────────────────────────────────┘
```

1. **画布 Schema 规范**（契约）：定义节点类型、端口、连线语义、坐标布局规范。Skill 按它产出，应用按它加载。
2. **解析 Skill**（`project-canvas-gen`）：输入项目仓库 → 输出符合规范的 canvas JSON。
3. **Web 应用**：FlowGram free-layout 脚手架改造，负责编辑、预览、模拟与所有分享导出。

## 4. Web 应用设计

### 4.1 节点类型体系（替换 demo 工作流节点）

| 节点类型         | 用途     | 设计要点                                                                                                                          |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `db-table`       | 数据库表 | 表名 + 字段列表（名称/类型，PK/FK/唯一/可空图标）；左右端口（`in`/`out`）供关联线连接；高度按字段数自适应（有上限，超出内部滚动） |
| `arch-component` | 架构组件 | 类别（前端/网关/服务/数据库/缓存/队列/存储/第三方）图标 + 技术标签 + 描述                                                         |
| `flow-start`     | 流程起点 | 流程类区域用；模拟执行遍历起点                                                                                                    |
| `flow-end`       | 流程终点 | —                                                                                                                                 |
| `flow-step`      | 流程步骤 | 标题 + 描述                                                                                                                       |
| `flow-decision`  | 判断分支 | 双输出端口（是/否），带默认分支配置                                                                                               |
| `note`           | 便签注释 | 自由文字说明                                                                                                                      |
| `group`          | 区域容器 | 四大区域分组节点（标题 + 配色区分），复用 free-group-plugin                                                                       |

### 4.2 连线语义

| 连线类型      | 语义     | 说明                               |
| ------------- | -------- | ---------------------------------- |
| `db-relation` | 表关联   | 线上标注 1:1 / 1:N / N:N           |
| `dependency`  | 架构依赖 | 组件间依赖方向                     |
| `flow`        | 流程走向 | 可带条件标签；模拟执行按其拓扑遍历 |

### 4.3 顶部工具栏

- 只读 / 编辑模式切换（编辑器 `readonly` prop）
- 导入 JSON（文件选择）
- 导出 JSON（当前画布完整数据，含 schemaVersion）
- 导出 PNG（对齐内容后截图导出）
- 导出单体 HTML
- 模拟运行 / 停止（速度可调：0.5x / 1x / 2x）
- 恢复内置示例 / 清空画布

### 4.4 模拟执行器（自研轻量）

- 从所有 `flow-start` 节点出发，按 `flow` 连线做拓扑遍历（`setTimeout` 驱动，纯前端）
- 节点状态机：`idle → running（高亮脉冲动画）→ done（完成标记）`
- 连线流动动画标记当前路径；`flow-decision` 按节点配置的默认分支选择走向
- 支持停止与重置；作用于画布上一切流程类节点（「代码流程」与「运行逻辑」区域）
- 静态文档形态 = 不触发模拟运行的普通浏览态，两种形态天然并存

### 4.5 导出能力

**PNG 导出**：视口对齐全部内容后截图（html-to-image 方案，按倍率导出高清图）。

**JSON 导入/导出**：画布完整数据往返一致，作为 Skill 产物与人工编辑的通用载体。

**单体 HTML 导出**（重点）：

- 构建期：额外构建只读 viewer 入口，产物后处理脚本将 JS/CSS/图标字体全部内联，生成 `viewer-template.html` 单文件模板（数据占位符 `window.__CANVAS_DATA__ = null`），打包进应用
- 运行时：导出时读取模板，将当前画布 JSON 注入占位符（做好转义），触发下载
- 产物特性：双击打开即可缩放/平移/小地图浏览，完全只读、完全离线、无需网络字体

### 4.6 数据流与自动暂存

- 首次打开 → 加载内置示例数据（虚构电商项目，四区域齐全）
- 编辑中 `onContentChange` 防抖自动暂存 localStorage，防刷新丢失；提供「恢复示例」重置入口
- 导入 JSON → 校验通过后整体替换画布
- 导出产物（PNG/JSON/HTML）基于当前画布实时数据

### 4.7 目录结构（改造后）

```
flowgram-diagram/
├── docs/
│   ├── superpowers/specs/2026-09-25-flowgram-canvas-design.md   # 本文档
│   └── canvas-schema.md                                        # Schema 契约（Skill 依据）
├── .trae/skills/
│   └── project-canvas-gen/       # 解析 Skill（TRAE Skill，随仓库管理）
│       ├── SKILL.md              # 工作流定义
│       └── scripts/validate-canvas.mjs  # 产物自检脚本
├── scripts/
│   └── build-viewer-template.mjs  # viewer 产物内联为单文件模板
└── src/
    ├── app.tsx                    # 应用入口（含工具栏与编辑器挂载）
    ├── editor.tsx                 # 编辑器组件
    ├── nodes/                     # 自定义节点注册与渲染
    │   ├── db-table/
    │   ├── arch-component/
    │   ├── flow-start/ flow-end/ flow-step/ flow-decision/
    │   ├── note/
    │   └── group/
    ├── simulation/                # 轻量模拟执行器
    ├── export/                    # png.ts / json.ts / standalone-html.ts
    ├── toolbar/                   # 顶部工具栏组件（Semi Design）
    ├── types/canvas.ts            # Schema 类型定义
    └── data/default-canvas.json   # 内置示例数据
```

## 5. 画布 Schema 契约要点

- 基于 FlowGram 文档格式（blocks + edges），顶层带 `schemaVersion` 字段便于演进
- 节点 `type` 与应用注册的自定义节点一一对应
- 坐标布局规范（Skill 自动布图依据，同时是人类阅读的视觉分区）：
  - 数据库结构区：左上（x ∈ [0, 4000), y ∈ [0, 3000)）
  - 项目架构区：右上（x ∈ [4500, ∞), y ∈ [0, 3000)）
  - 代码流程区：左下（x ∈ [0, 4000), y ∈ [3500, ∞)）
  - 运行逻辑区：右下（x ∈ [4500, ∞), y ∈ [3500, ∞)）
  - 各区域所有节点置于同名 `group` 容器内，区域内网格排布
- 完整字段定义（各节点表单结构、端口方向、连线标签枚举）在实施时于 `docs/canvas-schema.md` 中固化，作为 Skill 与应用共同遵循的唯一规范

## 6. 解析 Skill 设计

- 名称：`project-canvas-gen`；用 skill-creator 规范创建；代码随本仓库管理，安装到个人技能目录即可在 TRAE 中使用并分享给团队
- 触发方式：「分析项目生成画布」/「generate canvas for this repo」等
- 输入：本地仓库路径 或 GitHub URL（自动 clone 到临时目录）
- 分析流程（Skill 内编排为固定工作流）：
  1. **项目概览**：语言/框架/构建配置（package.json、pyproject.toml、go.mod、pom.xml 等）
  2. **数据库结构**：识别 SQL DDL / Prisma / TypeORM / SQLAlchemy / Django models / GORM / MyBatis，提取表、字段、类型、主外键、索引与表间关联
  3. **项目架构**：目录分层、模块依赖、技术栈组件 → `arch-component` 图
  4. **代码流程**：入口追踪（路由 → handler → service → repository）→ 流程节点链
  5. **运行逻辑**：启动流程、请求生命周期 → 流程图
  6. **生成**：按 Schema 契约（含坐标规范）输出 `<项目名>-canvas.json`
- 质量自检清单（Skill 输出前强制执行）：必填字段齐全、端口方向正确、坐标符合区域规范、单区域节点数上限（防噪声）、超长字段列表截断规则

## 7. 错误处理

- 导入 JSON 时做 Schema 校验（schemaVersion + 节点类型合法性），失败用 Semi Toast 给出明确错误定位
- Skill 产物在输出前自检（见第 6 节清单），应用侧再兜底校验
- 单体 HTML 导出：模板缺失时禁用入口并提示；画布数据 > 10MB 时给出体积警告
- localStorage 暂存数据损坏时自动回退内置示例并提示

## 8. 验收标准

- [x] 浏览器实测：底部「Add Node」真实点击弹出节点面板（8 类节点、面板完整位于视口内），选择「数据库表」后画布节点数 58 → 59；Esc 关闭面板；编辑节点属性（右侧属性面板）正常；只读模式切换正常；模拟运行/停止正常（按钮 aria-label play ↔ stop）
- [ ] 浏览器实测（未能自动化验证）：节点拖拽移动、端口拖拽连线。两者均为上游框架内置行为（`@use-gesture/react` + `WorkflowDragService`），本项目未改动其代码路径；自动化环境无法提供真实鼠标拖拽，合成的 PointerEvent 不能驱动 use-gesture，故不作为缺陷证据
- [x] PNG 导出清晰完整；JSON 导入导出往返一致
- [x] 单体 HTML 双击打开可正常缩放平移浏览（离线）
- [x] Skill 对 2 个真实仓库（`spring-boot-realworld-example-app`、本项目自身）跑通，产物（48 / 43 节点）均被应用无错加载
- [x] 项目构建通过（`npm run build:all` + `npx tsc --noEmit`），无 console 报错
- [x] 内置示例覆盖四区域，布局符合坐标规范

## 9. 范围外（Out of Scope）

- 后端服务与在线链接分享（URL 分享需服务端存储，本期不做）
- 多人实时协作
- 真实服务端执行（模拟执行为浏览器内演示）
- 画布历史版本管理
