## 这个 PR 做了什么

<!-- 一句话说明意图，以及为什么需要它 -->

## 改动类型

- [ ] fix：修复问题
- [ ] feat：新增功能
- [ ] refactor：重构（不改变外部行为）
- [ ] docs：文档
- [ ] chore：构建 / CI / 依赖

## 影响范围

- [ ] `packages/canvas`（数据契约 / 校验 / 模拟 / 内置示例）
- [ ] `packages/app`（编辑器 / 只读预览 / 导出）
- [ ] 构建与部署（rsbuild / GitHub Actions）
- [ ] 解析 Skill 与文档

## 怎么验证

<!-- 列出你实际执行过的命令和手工步骤 -->

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- [ ] 涉及画布视觉时，已确认只读预览（`/viewer/`）与离线 HTML 导出表现一致
- [ ] 涉及拖拽 / 连线等手势交互时，已人工验证（无头环境无法覆盖）

## 数据契约

- [ ] 本次没有改动 `docs/canvas-schema.md` 描述的契约
- [ ] 改动了契约，并已同步 `packages/canvas/src/__tests__/invariants.ts`、`.trae/skills/project-canvas-gen/scripts/validate-canvas.mjs`，且附上了 changeset（`pnpm changeset`）

## 截图 / 录屏

<!-- UI 改动请附上；无则删除本节 -->
