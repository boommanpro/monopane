# monopane

**中文** | [English](./README.en.md)

> 把任意代码仓库解析成一张「项目文档画布」——数据库结构、项目架构、代码流程、项目运行逻辑，一张图讲清楚。

[![CI](https://github.com/boommanpro/monopane/actions/workflows/ci.yml/badge.svg)](https://github.com/boommanpro/monopane/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/boommanpro/monopane/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/boommanpro/monopane/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](./package.json)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](./pnpm-workspace.yaml)

monopane 是一个基于 [FlowGram](https://flowgram.ai/) free-layout 引擎的自由画布应用。它把「读懂一个陌生仓库」这件事拆成四个固定区域，用一套稳定的 JSON 契约描述，再渲染成一张可以自由拖拽、缩放、导出的画布。配合同仓库里的解析 Skill，可以让 AI 直接读代码产出这张画布。

## 在线演示

| 入口     | 地址                                          | 说明                                                   |
| -------- | --------------------------------------------- | ------------------------------------------------------ |
| 编辑器   | https://boommanpro.github.io/monopane/        | 完整编辑能力：拖拽、连线、属性表单、导入导出、模拟运行 |
| 只读预览 | https://boommanpro.github.io/monopane/viewer/ | 去掉一切编辑入口，适合当作项目文档页直接分享给同事     |

打开后默认加载内置示例（一个虚构电商仓库）。点右上角的「导入画布 JSON」换成你自己的。

## 四大区域

画布是一张自由大画布，被划分为四个固定区域，每个区域由一个分组容器承载：

| 区域             | 回答的问题                             | 主要节点                                                  | 连线语义      |
| ---------------- | -------------------------------------- | --------------------------------------------------------- | ------------- |
| 数据库结构与关联 | 有哪些表？字段、主键、外键、表间关系？ | `db-table`                                                | `db-relation` |
| 项目架构         | 分了哪些层？模块之间谁依赖谁？         | `arch-component`                                          | `dependency`  |
| 代码流程         | 一次核心请求/任务是怎么走完的？        | `flow-start` / `flow-step` / `flow-end` / `flow-decision` | `flow`        |
| 项目运行逻辑     | 进程怎么启动？请求生命周期长什么样？   | `flow-start` / `flow-step` / `flow-end`                   | `flow`        |

区域的原点、网格（列宽 460 / 行高 380）、节点数上限都由数据契约固定下来，因此任何一次生成结果都能被机器校验，而不是「看着差不多」。完整规则见 [docs/canvas-schema.md](./docs/canvas-schema.md)。

## 功能

### 画布编辑

- 基于 FlowGram free-layout：自由拖拽、多选、分组容器、自动吸附对齐、小地图导航
- 8 类节点，每类都有对应的属性表单（侧栏），改完即时生效
- 完整快捷键：复制 / 粘贴 / 剪切 / 删除 / 全选 / 分组 / 折叠 / 缩放
- 画布内容实时写入浏览器 `localStorage`，刷新不丢；可随时「恢复内置示例」或「清空画布」

### 导出

| 格式      | 用途                                                            |
| --------- | --------------------------------------------------------------- |
| JSON      | 带 `schemaVersion` 的完整画布文件，可再次导入继续编辑，也可入库 |
| PNG       | 直接贴进周报、Wiki、Issue                                       |
| 离线 HTML | **单体文件**，JS / CSS / 字体全部内联，双击即可离线浏览与缩放   |

离线 HTML 的产物不依赖任何外部 `script` / `link`，可以直接当附件发给别人。

### 运行逻辑模拟

工具栏的播放按钮会沿着 `flow` 连线逐步高亮执行路径：遇到 `flow-decision` 节点时按分支条件选择 `yes` / `no` 出边，并支持 0.5x / 1x / 2x 速度。可用来验证「我画的流程真的走得通吗」。

### 解析 Skill

仓库内的 [.trae/skills/project-canvas-gen](./.trae/skills/project-canvas-gen/SKILL.md) 把「读仓库 → 产出画布 JSON」固化成了可复用的流程：先扫 DDL / ORM 找表结构，再按目录分层建架构，然后追主链路画流程，最后用脚本自检。产物示例见 [examples/](./examples)：

- [monopane-canvas.json](./examples/monopane-canvas.json)：本仓库自己的画布
- [spring-boot-realworld-canvas.json](./examples/spring-boot-realworld-canvas.json)：一个 Java + SQLite 的真实后端项目

## 快速开始

### 环境要求

- Node.js >= 20（CI 使用 22）
- pnpm（版本由根 `package.json` 的 `packageManager` 锁定，建议 `corepack enable`）

### 安装与启动

```bash
git clone https://github.com/boommanpro/monopane.git
cd monopane
pnpm install
pnpm dev
```

`pnpm dev` 会先构建 `@monopane/canvas`（应用依赖它的类型与运行时），再启动编辑器开发服务器。

### 常用命令

| 命令                                | 作用                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                          | 构建 canvas 包并启动编辑器（`MODE=app` 开发模式）           |
| `pnpm build`                        | 构建全部包：先 viewer 后编辑器，产出 `dist` + `dist-viewer` |
| `pnpm typecheck`                    | 全仓 `tsc --noEmit`                                         |
| `pnpm lint` / `pnpm lint:fix`       | ESLint 检查 / 自动修复                                      |
| `pnpm format` / `pnpm format:check` | Prettier 格式化 / 校验                                      |
| `pnpm test` / `pnpm test:watch`     | Vitest 单测 / 监听模式                                      |
| `pnpm changeset`                    | 记录一条版本变更                                            |
| `pnpm clean`                        | 清理全部构建产物                                            |

> 导出「离线 HTML」依赖 `packages/app/public/viewer-template.html`。它是构建产物、不入库，全新 clone 后先跑一次 `pnpm --filter @monopane/app build:viewer` 生成模板即可。

## 项目结构

```text
monopane/
├── packages/
│   ├── canvas/                       @monopane/canvas —— 框架无关的领域层
│   │   └── src/
│   │       ├── types.ts              节点类型、字段标记、连线语义
│   │       ├── document.ts           画布文档的 JSON 结构
│   │       ├── constants.ts          区域原点、网格、容量上限
│   │       ├── validate.ts           结构校验、文件包装、序列化
│   │       ├── simulation.ts         运行逻辑模拟的分支选择
│   │       ├── default-canvas.ts     内置示例画布
│   │       └── __tests__/            不变量断言与 examples/ 回归
│   └── app/                          @monopane/app —— React + FlowGram 应用
│       ├── src/
│       │   ├── app.tsx               编辑器入口
│       │   ├── app-viewer.tsx        只读预览入口
│       │   ├── editor.tsx            编辑器组件
│       │   ├── viewer.tsx            只读预览组件
│       │   ├── nodes/                8 类节点的注册与渲染
│       │   ├── components/           节点面板、侧栏、工具条、便签、分组等
│       │   ├── toolbar/              顶部工具栏与预览工具条
│       │   ├── export/               JSON / PNG / 离线 HTML 导出
│       │   ├── simulation/           模拟运行的状态机与 hooks
│       │   ├── data/storage.ts       localStorage 加载与暂存
│       │   ├── plugins/              右键菜单、面板管理
│       │   └── shortcuts/            键盘快捷键
│       ├── scripts/                  离线 HTML 模板生成
│       └── rsbuild.config.ts         双入口构建配置
├── docs/
│   ├── canvas-schema.md              数据契约（唯一权威）
│   └── design/                       设计文档归档
├── examples/                         Skill 产出的真实画布样本
└── .trae/skills/project-canvas-gen/  解析 Skill 与自检脚本
```

**职责边界**：跨端复用的逻辑（类型、区域常量、校验、模拟分支、内置示例）一律放在 `packages/canvas`，它不引入任何 React / `@flowgram.ai` 依赖，因此既能在浏览器里配合编辑器工作，也能在 Node 里被 Skill、CI 和单测直接调用；只有渲染与交互留在 `packages/app`。

## 数据契约

[docs/canvas-schema.md](./docs/canvas-schema.md) 是这个项目的唯一权威数据契约：Skill 按它产出，应用按它加载与渲染，单测按它断言。改动契约需要同时更新：

1. `packages/canvas/src/` 下的类型与逻辑；
2. `packages/canvas/src/__tests__/invariants.ts` 的布局断言；
3. `.trae/skills/project-canvas-gen/scripts/validate-canvas.mjs` 的深度校验；
4. 一条 changeset。

## 部署到 GitHub Pages

[deploy-pages.yml](./.github/workflows/deploy-pages.yml) 在每次推送到 `main` 后自动构建并发布双入口站点：

```text
https://<owner>.github.io/<repo>/          ← packages/app/dist        （编辑器）
https://<owner>.github.io/<repo>/viewer/   ← packages/app/dist-viewer （只读预览）
```

构建时通过环境变量 `ASSET_PREFIX=/<repo>/` 注入部署前缀（工作流里从仓库名推导，fork 后无需改配置）。首次部署前需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

本地复现同样的产物：

```bash
ASSET_PREFIX=/monopane/ pnpm --filter @monopane/app build:all
mkdir -p _site/viewer
cp -R packages/app/dist/. _site/
cp -R packages/app/dist-viewer/. _site/viewer/
touch _site/.nojekyll
```

## 技术栈

| 层       | 选型                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| 画布引擎 | [`@flowgram.ai/free-layout-editor`](https://www.npmjs.com/package/@flowgram.ai/free-layout-editor) 1.0.15 及官方插件 |
| 前端     | React 18、TypeScript 5、styled-components 5、Less                                                                    |
| UI 组件  | [Semi Design](https://semi.design/)（`@douyinfe/semi-ui`）                                                           |
| 构建     | Rsbuild（Rspack）双入口：`MODE=app` / `MODE=viewer`                                                                  |
| 领域层   | 纯 TypeScript，零框架依赖                                                                                            |
| 质量门禁 | Vitest、ESLint 9（flat config）、Prettier                                                                            |
| 仓库     | pnpm workspaces + changesets                                                                                         |
| CI / CD  | GitHub Actions（`ci.yml` + `deploy-pages.yml`）                                                                      |

## Roadmap

- [ ] 画布内搜索与定位节点
- [ ] 数据库区域按关联关系自动布局
- [ ] 只读预览支持通过 URL 加载远端画布 JSON
- [ ] 导出 SVG
- [ ] 解析 Skill 支持更多语言栈（目前 Node/TS、Python、Java、Go 为深度解析）

## 已知限制

- **手势交互无法自动化验证**：节点拖拽移动与端口拖拽连线依赖 `@use-gesture/react`，无头浏览器环境下不可靠，需要人工确认；
- **内置示例无法一屏总览**：四个区域间距较大且最小缩放有限制，需要用小地图或缩小视口浏览；
- 画布数据存在浏览器 `localStorage`，换设备不会同步，重要产物请导出 JSON 或离线 HTML。

## 贡献

欢迎提 Issue 与 PR，请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与[行为准则](./CODE_OF_CONDUCT.md)。安全问题请通过 [Security Advisory](https://github.com/boommanpro/monopane/security/advisories/new) 私密上报。

## 许可

[MIT](./LICENSE)。项目的部分脚手架代码派生自 [FlowGram.AI](https://github.com/bytedance/flowgram.ai)（MIT），相关文件保留了原始的版权声明。
