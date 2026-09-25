/**
 * 画布文档的 JSON 结构
 *
 * 这里刻意不引用 `@flowgram.ai/*` 的类型：`@monopane/canvas` 是框架无关的领域层，
 * 既能在浏览器里配合编辑器工作，也能在 Node 里做校验、生成与测试。
 *
 * 结构与 FlowGram 文档格式（`nodes` / `edges` / `meta.position`）保持一致，
 * 因此可以无损地喂给编辑器渲染。
 */

import type { CanvasEdgeData } from './types';

/** 画布坐标点 */
export interface CanvasPoint {
  x: number;
  y: number;
}

/** 画布尺寸 */
export interface CanvasSize {
  width: number;
  height: number;
}

/** 节点 meta：顶层节点为绝对坐标，容器内子节点为相对坐标 */
export interface CanvasNodeMeta {
  position?: CanvasPoint;
  /** 仅 note 节点会显式声明尺寸，其余节点由引擎按内容自适应 */
  size?: CanvasSize;
}

/** 画布节点 */
export interface CanvasNodeJSON {
  id: string;
  /** 节点类型，取值见 `CanvasNodeType` */
  type: string;
  meta?: CanvasNodeMeta;
  /** 各节点类型的业务字段，见 docs/canvas-schema.md 第 3 节 */
  data: Record<string, any>;
  /** 子节点（FlowGram 的嵌套写法；本项目统一用容器的 data.blockIDs 声明归属） */
  blocks?: CanvasNodeJSON[];
  edges?: CanvasEdgeJSON[];
}

/** 画布连线 */
export interface CanvasEdgeJSON {
  sourceNodeID: string;
  targetNodeID: string;
  sourcePortID?: string | number;
  targetPortID?: string | number;
  /** 连线语义，见 docs/canvas-schema.md 第 4 节 */
  data?: CanvasEdgeData;
}

/** 一份完整的画布文档（与编辑器 document.toJSON() 的形状一致） */
export interface CanvasDocumentJSON {
  nodes: CanvasNodeJSON[];
  edges: CanvasEdgeJSON[];
}
