/**
 * 画布有向图的探索算法（纯函数，无编辑器依赖）
 *
 * 供「探索交互」使用：
 * - collectReachability：上下游可达集合（BFS）
 * - findPathBetween：两节点间的最短有向路径
 * - findFlowLayerOrder：演示模式的按层遍历顺序
 *
 * 边 key 统一为 `${sourceNodeID}->${targetNodeID}`，与 simulation 的 lineKey 一致。
 */

import type { CanvasDocumentJSON, CanvasEdgeJSON } from './document';

export type ReachDirection = 'upstream' | 'downstream';

export interface ReachResult {
  /** 可达节点 id（不含起点） */
  nodeIds: string[];
  /** 连通的边 key */
  edgeKeys: string[];
}

export interface PathResult {
  /** 路径节点 id（含起点与终点） */
  nodeIds: string[];
  /** 路径边 key */
  edgeKeys: string[];
}

export function edgeKey(source: string, target: string): string {
  return `${source}->${target}`;
}

/** 按 source / target 双向索引边 */
export interface DirectedIndex {
  out: Map<string, CanvasEdgeJSON[]>;
  in: Map<string, CanvasEdgeJSON[]>;
}

export function indexDirectedEdges(edges: CanvasEdgeJSON[]): DirectedIndex {
  const index: DirectedIndex = { out: new Map(), in: new Map() };
  edges.forEach((edge) => {
    const outList = index.out.get(edge.sourceNodeID) ?? [];
    outList.push(edge);
    index.out.set(edge.sourceNodeID, outList);
    const inList = index.in.get(edge.targetNodeID) ?? [];
    inList.push(edge);
    index.in.set(edge.targetNodeID, inList);
  });
  return index;
}

/**
 * 从起点出发，沿有向边收集上游（入边方向）或下游（出边方向）的全部可达节点与边。
 * 环安全：BFS + visited 集合。
 */
export function collectReachability(
  document: CanvasDocumentJSON,
  startId: string,
  direction: ReachDirection,
  limit = 500
): ReachResult {
  const index = indexDirectedEdges(document.edges ?? []);
  const edgesByDir = direction === 'downstream' ? index.out : index.in;
  const visitedNodes = new Set<string>([startId]);
  const visitedEdges = new Set<string>();
  const queue = [startId];
  let guard = 0;

  while (queue.length > 0 && guard < limit) {
    guard += 1;
    const current = queue.shift()!;
    for (const edge of edgesByDir.get(current) ?? []) {
      const key =
        direction === 'downstream'
          ? edgeKey(current, edge.targetNodeID)
          : edgeKey(edge.sourceNodeID, current);
      const next = direction === 'downstream' ? edge.targetNodeID : edge.sourceNodeID;
      visitedEdges.add(key);
      if (!visitedNodes.has(next)) {
        visitedNodes.add(next);
        queue.push(next);
      }
    }
  }

  return {
    nodeIds: Array.from(visitedNodes).filter((id) => id !== startId),
    edgeKeys: Array.from(visitedEdges),
  };
}

/**
 * 在起点与终点之间寻找最短有向路径（BFS），
 * 找不到（终点不在起点下游）时返回 null。
 */
export function findPathBetween(
  document: CanvasDocumentJSON,
  fromId: string,
  toId: string,
  limit = 500
): PathResult | null {
  if (fromId === toId) {
    return { nodeIds: [fromId], edgeKeys: [] };
  }
  const index = indexDirectedEdges(document.edges ?? []);
  const parent = new Map<string, string>();
  const parentEdge = new Map<string, string>();
  const visited = new Set<string>([fromId]);
  const queue = [fromId];
  let guard = 0;

  while (queue.length > 0 && guard < limit) {
    guard += 1;
    const current = queue.shift()!;
    for (const edge of index.out.get(current) ?? []) {
      const next = edge.targetNodeID;
      if (visited.has(next)) {
        continue;
      }
      visited.add(next);
      parent.set(next, current);
      parentEdge.set(next, edgeKey(current, next));
      if (next === toId) {
        const nodeIds = [toId];
        const edgeKeys: string[] = [];
        let cursor: string | undefined = toId;
        while (cursor && cursor !== fromId) {
          const prev = parent.get(cursor);
          const key = parentEdge.get(cursor);
          if (!prev || !key) break;
          nodeIds.unshift(prev);
          edgeKeys.unshift(key);
          cursor = prev;
        }
        return { nodeIds, edgeKeys };
      }
      queue.push(next);
    }
  }
  return null;
}

export interface FlowLayerStep {
  nodeIds: string[];
  edgeKeys: string[];
}

/**
 * 演示模式用的按层遍历顺序：从所有 flow-start 出发，逐层 BFS 出边。
 * 每一层包含该步抵达的节点与进入这些节点的边。
 */
export function findFlowLayerOrder(document: CanvasDocumentJSON): FlowLayerStep[] {
  const nodes = document.nodes ?? [];
  const starts = nodes.filter((node) => node.type === 'flow-start');
  if (starts.length === 0) {
    return [];
  }
  const index = indexDirectedEdges(document.edges ?? []);
  const visited = new Set<string>(starts.map((node) => node.id));
  let frontier = starts.map((node) => node.id);
  const steps: FlowLayerStep[] = [];

  while (frontier.length > 0) {
    const nextIds: string[] = [];
    const edgeKeys: string[] = [];
    frontier.forEach((nodeId) => {
      for (const edge of index.out.get(nodeId) ?? []) {
        edgeKeys.push(edgeKey(nodeId, edge.targetNodeID));
        if (!visited.has(edge.targetNodeID)) {
          visited.add(edge.targetNodeID);
          nextIds.push(edge.targetNodeID);
        }
      }
    });
    if (nextIds.length > 0) {
      steps.push({ nodeIds: nextIds, edgeKeys });
    }
    frontier = nextIds;
  }
  return steps;
}
