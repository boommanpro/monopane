/**
 * 两份画布文档的结构对比（纯函数）
 *
 * 用于「校验 / 对比」功能：对比当前画布与内置示例、或与导入的参考文件。
 */

import type { CanvasDocumentJSON, CanvasEdgeJSON, CanvasNodeJSON } from './document';

export interface ChangedNode {
  id: string;
  before: CanvasNodeJSON;
  after: CanvasNodeJSON;
}

export interface DocumentDiff {
  addedNodes: CanvasNodeJSON[];
  removedNodes: CanvasNodeJSON[];
  changedNodes: ChangedNode[];
  addedEdges: CanvasEdgeJSON[];
  removedEdges: CanvasEdgeJSON[];
  /** 两边都存在的节点（含未变与已变） */
  commonCount: number;
  /** 两边一致的节点数 */
  unchangedCount: number;
}

function edgeKey(edge: CanvasEdgeJSON): string {
  return `${edge.sourceNodeID}->${edge.targetNodeID}`;
}

function sameNode(a: CanvasNodeJSON, b: CanvasNodeJSON): boolean {
  return (
    JSON.stringify(a.data ?? {}) === JSON.stringify(b.data ?? {}) &&
    JSON.stringify(a.meta ?? {}) === JSON.stringify(b.meta ?? {})
  );
}

/** 对比两份文档，before 为基准（如内置示例），after 为当前画布 */
export function compareDocuments(
  before: CanvasDocumentJSON,
  after: CanvasDocumentJSON
): DocumentDiff {
  const beforeById = new Map(before.nodes.map((node) => [node.id, node]));
  const afterById = new Map(after.nodes.map((node) => [node.id, node]));

  const addedNodes: CanvasNodeJSON[] = [];
  const removedNodes: CanvasNodeJSON[] = [];
  const changedNodes: ChangedNode[] = [];
  let commonCount = 0;
  let unchangedCount = 0;

  after.nodes.forEach((node) => {
    const prev = beforeById.get(node.id);
    if (!prev) {
      addedNodes.push(node);
      return;
    }
    commonCount += 1;
    if (!sameNode(prev, node)) {
      changedNodes.push({ id: node.id, before: prev, after: node });
    } else {
      unchangedCount += 1;
    }
  });
  before.nodes.forEach((node) => {
    if (!afterById.has(node.id)) {
      removedNodes.push(node);
    }
  });

  const beforeEdgeSet = new Set(before.edges.map(edgeKey));
  const afterEdgeSet = new Set(after.edges.map(edgeKey));
  const addedEdges = after.edges.filter((edge) => !beforeEdgeSet.has(edgeKey(edge)));
  const removedEdges = before.edges.filter((edge) => !afterEdgeSet.has(edgeKey(edge)));

  return {
    addedNodes,
    removedNodes,
    changedNodes,
    addedEdges,
    removedEdges,
    commonCount,
    unchangedCount,
  };
}
