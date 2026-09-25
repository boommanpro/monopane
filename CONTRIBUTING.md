# 贡献指南

感谢你愿意为 monopane 出一份力。这份文档说明本地怎么跑、代码放在哪、以及提交前需要满足哪些门禁。

## 开发环境

| 依赖    | 版本要求                                     | 说明                                  |
| ------- | -------------------------------------------- | ------------------------------------- |
| Node.js | >= 20（CI 使用 22）                          | 根 `package.json` 的 `engines` 已声明 |
| pnpm    | 由根 `package.json` 的 `packageManager` 锁定 | 建议通过 `corepack enable` 启用       |

```bash
git clone https://github.com/boommanpro/monopane.git
cd monopane
pnpm install
pnpm dev          # 先构建 @monopane/canvas，再启动编辑器 http://localhost:3000
```

## 项目结构

```
monopane/
├── packages/
│   ├── canvas/         @monopane/canvas —— 框架无关的数据契约与领域逻辑
│   └── app/            @monopane/app    —— React + FlowGram 编辑器与只读预览
├── docs/               数据契约与设计文档
├── examples/           示例画布 JSON
└── .trae/skills/       把代码仓库解析成画布 JSON 的 Skill
```

**职责边界**：跨端复用的逻辑（类型、区域常量、校验、模拟分支、内置示例）一律放进 `packages/canvas`，不要引入 `@flowgram.ai/*` 或 React 依赖；只有渲染与交互留在 `packages/app`。

## 提交前的门禁

CI 会依次执行以下命令，本地请先自行跑通：

```bash
pnpm format:check   # Prettier
pnpm lint           # ESLint（可用 pnpm lint:fix 自动修复）
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest
pnpm build          # 双入口构建
```

修改数据契约（`docs/canvas-schema.md`、`packages/canvas/src`）时，必须同步更新：

1. `packages/canvas/src/__tests__/invariants.ts` 中的布局断言；
2. `.trae/skills/project-canvas-gen/scripts/validate-canvas.mjs` 中的深度校验；
3. 一条 changeset：`pnpm changeset`。

## 分支与提交

- 从 `main` 切出分支，命名建议 `feat/xxx`、`fix/xxx`、`docs/xxx`；
- 提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/)：`feat(canvas): ...`、`fix(app): ...`；
- 一次性提交聚焦一件事，避免把格式化与逻辑改动混在同一个 commit 里。

## Pull Request

- 描述里写清「为什么改」以及「怎么验证」，UI 改动请附截图或录屏；
- 涉及画布视觉的改动，请同时说明在只读预览（`/viewer/`）与离线 HTML 导出下的表现；
- 维护者会在 CI 通过后 review，请留意 review 意见并保持分支同步 `main`。

## 已知限制

- 节点拖拽移动与端口拖拽连线依赖 `@use-gesture/react`，无法在无头浏览器中自动化验证，需要人工确认；
- 单体离线 HTML 依赖 `packages/app/public/viewer-template.html`，全新 clone 后需先执行一次 `pnpm --filter @monopane/app build:viewer` 才能导出（该文件是构建产物，不入库）。

## 许可

提交代码即表示同意以 [MIT License](./LICENSE) 授权。本项目的部分脚手架代码派生自 [FlowGram.AI](https://github.com/bytedance/flowgram.ai)（MIT），相关文件保留了原始的版权声明，请勿删除。
