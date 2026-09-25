/**
 * 流程模拟的纯函数部分
 *
 * 从所有 flow-start 节点出发、按 kind 为 flow 的连线做遍历所需的遍历规则，
 * 全部与编辑器实例解耦，便于单测与在 Node 侧复用。
 * 定时器驱动与画布状态更新留在 packages/app 的 CanvasSimulationService。
 */

import { CanvasNodeType, type FlowDecisionNodeData } from './types';
import type { CanvasEdgeJSON, CanvasNodeJSON } from './document';

/** 参与模拟执行的连线语义 */
export const SIM_FLOW_KIND = 'flow';

/** 找出所有流程起点（区域容器内的 flow-start 节点） */
export function findFlowStarts(nodes: CanvasNodeJSON[]): CanvasNodeJSON[] {
  return nodes.filter((node) => node.type === CanvasNodeType.FlowStart);
}

/**
 * 按 sourceNodeID 归组 flow 出边
 *
 * 未标注 kind 的连线按 flow 处理（与编辑器内的连线语义保持一致）。
 */
export function indexFlowOutEdges(edges: CanvasEdgeJSON[]): Map<string, CanvasEdgeJSON[]> {
  const outEdges = new Map<string, CanvasEdgeJSON[]>();
  edges
    .filter((edge) => (edge.data?.kind ?? SIM_FLOW_KIND) === SIM_FLOW_KIND)
    .forEach((edge) => {
      const list = outEdges.get(edge.sourceNodeID) ?? [];
      list.push(edge);
      outEdges.set(edge.sourceNodeID, list);
    });
  return outEdges;
}

/**
 * 选择下一步走向
 *
 * - 判断节点：按 data.defaultBranch 选择对应分支，分支缺失时退回第一条出边
 * - 其余节点：走全部出边（多条出边即并行分支）
 */
export function pickNextFlowEdges(
  node: CanvasNodeJSON | undefined,
  edges: CanvasEdgeJSON[] | undefined
): CanvasEdgeJSON[] {
  if (!edges || edges.length === 0) {
    return [];
  }
  if (node?.type !== CanvasNodeType.FlowDecision) {
    return edges;
  }
  const branch = (node.data as FlowDecisionNodeData | undefined)?.defaultBranch ?? 'yes';
  const matched = edges.filter((edge) => (edge.data?.branch ?? 'yes') === branch);
  return matched.length > 0 ? matched : edges.slice(0, 1);
}
