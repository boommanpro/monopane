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

// ---------------------------------------------------------------------------
// 流程区拓扑布局（对齐 archify workflow 的「列 = 拓扑 rank、主路径直线、分支下挂」）
// ---------------------------------------------------------------------------

export interface FlowGridPosition {
  col: number;
  row: number;
}

export interface FlowTopologyLayout {
  /** 节点 id → 网格坐标（col = 拓扑层，row = 与主路径的偏离深度） */
  grid: Map<string, FlowGridPosition>;
  /** 主路径节点 id（有序，从 flow-start 出发到 flow-end） */
  mainPath: string[];
  /** 拓扑层数（max col + 1） */
  levelCount: number;
  /** 无法分层（处于环中）的节点，按输入顺序回退占位 */
  cyclic: string[];
}

/**
 * 推导主路径：从 flow-start 出发贪心选边——
 * decision 节点优先走 data.defaultBranch 对应的出边（按 sourcePortID 匹配），
 * 其余节点走「距 flow-end 最近」的出边（逆向 BFS 距离作启发）。
 */
export function findMainFlowPath(document: CanvasDocumentJSON): string[] {
  const nodes = document.nodes ?? [];
  const index = indexDirectedEdges(document.edges ?? []);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const start = nodes.find((node) => node.type === 'flow-start');
  if (!start) {
    return [];
  }
  const end = nodes.find((node) => node.type === 'flow-end');

  // 逆向 BFS：每个节点到 flow-end 的最短跳数（终点自身为 0）
  const distToEnd = new Map<string, number>();
  if (end) {
    distToEnd.set(end.id, 0);
    const queue = [end.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of index.in.get(current) ?? []) {
        const prev = edge.sourceNodeID;
        if (!distToEnd.has(prev)) {
          distToEnd.set(prev, distToEnd.get(current)! + 1);
          queue.push(prev);
        }
      }
    }
  }

  const path: string[] = [start.id];
  const visited = new Set<string>([start.id]);
  let cursor: string = start.id;
  for (let guard = 0; guard < nodes.length + 1; guard++) {
    const outs = index.out.get(cursor) ?? [];
    if (outs.length === 0) break;
    const node = byId.get(cursor);
    let next: string | undefined;
    if (node?.type === 'flow-decision' && node.data?.defaultBranch) {
      next = outs.find((edge) => edge.sourcePortID === node.data?.defaultBranch)?.targetNodeID;
    }
    if (!next) {
      // 距终点最近者优先；无距离信息（走不到 end）时退化为第一条出边
      const ranked = [...outs].sort(
        (a, b) =>
          (distToEnd.get(a.targetNodeID) ?? Infinity) - (distToEnd.get(b.targetNodeID) ?? Infinity)
      );
      next = ranked[0]?.targetNodeID;
    }
    if (!next || visited.has(next)) break;
    path.push(next);
    visited.add(next);
    if (end && next === end.id) break;
    cursor = next;
  }
  return path;
}

/**
 * 流程区拓扑布局：
 * 1. Kahn 分层（col = 最长路径深度，flow-start 在第 0 列）
 * 2. 主路径节点全部占 row 0，形成一条水平直线（故事线）
 * 3. 其余节点按到主路径的无向 BFS 距离下挂（一级分支 row 1，二级 row 2…）
 * 4. 同格冲突时向下顺延
 * 环内节点不参与分层（cyclic 返回），由调用方回退处理。
 */
export function layoutFlowByTopology(document: CanvasDocumentJSON): FlowTopologyLayout {
  const nodes = document.nodes ?? [];
  const nodeIds = nodes.map((node) => node.id);
  const idSet = new Set(nodeIds);
  const flowEdges = (document.edges ?? []).filter(
    (edge) =>
      edge.data?.kind === 'flow' && idSet.has(edge.sourceNodeID) && idSet.has(edge.targetNodeID)
  );
  const index = indexDirectedEdges(flowEdges);

  // Kahn 拓扑 + 最长路径分层
  const level = new Map<string, number>();
  const indegree = new Map<string, number>(
    nodeIds.map((id) => [id, index.in.get(id)?.length ?? 0])
  );
  const queue = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  queue.forEach((id) => level.set(id, 0));
  const processed: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    processed.push(current);
    for (const edge of index.out.get(current) ?? []) {
      const next = edge.targetNodeID;
      level.set(next, Math.max(level.get(next) ?? 0, (level.get(current) ?? 0) + 1));
      const remain = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remain);
      if (remain === 0) queue.push(next);
    }
  }
  const cyclic = nodeIds.filter((id) => !level.has(id));

  const mainPath = findMainFlowPath(document);

  // 无向 BFS：其余节点到主路径的距离（决定 row）
  const undirected = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    const list = undirected.get(a) ?? [];
    list.push(b);
    undirected.set(a, list);
  };
  flowEdges.forEach((edge) => {
    link(edge.sourceNodeID, edge.targetNodeID);
    link(edge.targetNodeID, edge.sourceNodeID);
  });
  const depth = new Map<string, number>(mainPath.map((id) => [id, 0]));
  let frontier = [...mainPath];
  while (frontier.length > 0) {
    const next: string[] = [];
    frontier.forEach((id) => {
      for (const neighbor of undirected.get(id) ?? []) {
        if (!depth.has(neighbor)) {
          depth.set(neighbor, depth.get(id)! + 1);
          next.push(neighbor);
        }
      }
    });
    frontier = next;
  }

  // 网格分配：主路径优先，其余按（col, 深度）放置，冲突向下顺延
  const grid = new Map<string, FlowGridPosition>();
  const occupied = new Set<string>();
  const place = (id: string, col: number, row: number) => {
    let r = row;
    while (occupied.has(`${col},${r}`)) r += 1;
    occupied.add(`${col},${r}`);
    grid.set(id, { col, row: r });
  };
  mainPath.forEach((id) => {
    if (level.has(id)) place(id, level.get(id)!, 0);
  });
  nodes.forEach((node) => {
    if (grid.has(node.id) || !level.has(node.id)) return;
    // 无主路径（缺 flow-start）时 depth 为空，按第 0 行起顺序放置
    place(node.id, level.get(node.id)!, depth.get(node.id) ?? 0);
  });
  // 环内节点回退：从 (0, 最大行+1) 起顺序占位
  let fallbackRow = Math.max(0, ...Array.from(grid.values()).map((p) => p.row)) + 1;
  cyclic.forEach((id) => {
    place(id, 0, fallbackRow);
    fallbackRow += 1;
  });

  const levelCount = Math.max(0, ...Array.from(grid.values()).map((p) => p.col)) + 1;
  return { grid, mainPath, levelCount, cyclic };
}
