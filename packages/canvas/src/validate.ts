/**
 * 画布文件的校验与序列化
 *
 * 纯函数：不触碰 localStorage / DOM，因此可以在 Node 里直接复用
 * （解析 Skill、CI 校验、单元测试都走这里）。
 */

import { CANVAS_SCHEMA_VERSION, CanvasFileJSON, CanvasNodeType } from './types';
import type { CanvasDocumentJSON, CanvasEdgeJSON, CanvasNodeJSON } from './document';

/** 受支持的节点类型集合 */
const VALID_NODE_TYPES = new Set<string>(Object.values(CanvasNodeType));

export type CanvasValidateResult =
  | { ok: true; document: CanvasDocumentJSON }
  | { ok: false; message: string };

/**
 * 校验外部导入 / 缓存 / Skill 产出的画布数据
 *
 * 校验的是「能不能安全地喂给编辑器」的底线（结构 + 节点类型），
 * 布局规范（网格、区域上限、连线语义）由
 * .trae/skills/project-canvas-gen/scripts/validate-canvas.mjs 做深度自检。
 */
export function validateCanvasFile(input: unknown): CanvasValidateResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, message: '数据不是合法的 JSON 对象' };
  }
  const raw = input as Partial<CanvasFileJSON> & { nodes?: unknown; edges?: unknown };
  if (raw.schemaVersion !== undefined) {
    if (typeof raw.schemaVersion !== 'string') {
      return { ok: false, message: 'schemaVersion 必须是字符串' };
    }
    if (!raw.schemaVersion.startsWith('1.')) {
      return {
        ok: false,
        message: `schemaVersion ${raw.schemaVersion} 与当前应用（${CANVAS_SCHEMA_VERSION}）不兼容`,
      };
    }
  }
  if (!Array.isArray(raw.nodes)) {
    return { ok: false, message: '缺少 nodes 数组' };
  }
  if (raw.edges !== undefined && !Array.isArray(raw.edges)) {
    return { ok: false, message: 'edges 必须是数组' };
  }
  const nodes = raw.nodes as CanvasNodeJSON[];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node || typeof node !== 'object' || !node.id || !node.type) {
      return { ok: false, message: `第 ${index + 1} 个节点缺少 id 或 type` };
    }
    if (!VALID_NODE_TYPES.has(String(node.type))) {
      return {
        ok: false,
        message: `第 ${index + 1} 个节点类型 "${node.type}" 不受支持`,
      };
    }
  }
  return {
    ok: true,
    document: {
      nodes,
      edges: (raw.edges ?? []) as CanvasEdgeJSON[],
    },
  };
}

/**
 * 导出时的文件包装：补上 schemaVersion
 */
export function wrapCanvasFile(document: CanvasDocumentJSON): CanvasFileJSON {
  return {
    schemaVersion: CANVAS_SCHEMA_VERSION,
    nodes: document.nodes,
    edges: document.edges,
  };
}

/**
 * 序列化为可下载 / 可提交的文件内容
 */
export function serializeCanvas(document: CanvasDocumentJSON): string {
  return JSON.stringify(wrapCanvasFile(document), null, 2);
}
