# @monopane/canvas

## 1.0.0

### Major Changes

- 首次发布：确立四大区域（数据库结构 / 项目架构 / 代码流程 / 项目运行逻辑）的数据契约。

  - `CanvasDocumentJSON` / `CanvasNodeJSON` / `CanvasEdgeJSON`：与 FlowGram 文档格式保持结构一致；
  - `CanvasNodeType`：8 种节点类型（db-table、arch-component、flow-start、flow-end、flow-step、flow-decision、note、area）；
  - `AREAS` / `findAreaByTitle` / `findAreaById`：区域锚点、调色板与容量上限；
  - `validateCanvasFile` / `wrapCanvasFile` / `serializeCanvas`：结构校验与文件包装（补齐 `schemaVersion`）；
  - `findFlowStarts` / `indexFlowOutEdges` / `pickNextFlowEdges`：运行逻辑模拟的分支选择；
  - `defaultCanvasData`：内置虚构电商示例。