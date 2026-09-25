# @monopane/app

## 1.0.0

### Major Changes

- 首次发布：基于 FlowGram free-layout 的图编辑器与只读预览应用。

  - 编辑器入口（`/`）：四大区域画布、节点面板、连线、快捷键、内置示例；
  - 只读预览入口（`/viewer/`）：供 GitHub Pages 与单体离线 HTML 复用；
  - 导出：画布 JSON、PNG、无外部依赖的单体离线 HTML；
  - 运行逻辑模拟：按 `flow` 节点与分支条件逐步高亮执行路径。