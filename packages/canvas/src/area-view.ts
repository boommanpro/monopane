/**
 * 分区视图（内容类型 Tab）的纯函数
 *
 * 完整画布文档按四大区域切成「视图」：
 * - 单个区域的视图 = 该区域容器 + 其子节点 + 顶层散置节点 + 区域内部连线
 * - 编辑发生在视图上，合并（mergeAreaSlice）负责把视图内容写回完整文档，
 *   其他区域的节点原样保留，不参与当前视图的编辑。
 *
 * 与 simulation.ts 一样，这里不依赖任何编辑器实例，便于单测。
 */

import type { CanvasDocumentJSON, CanvasEdgeJSON, CanvasNodeJSON } from './document';
import { AREAS } from './constants';

/** 标准区域容器节点 id 集合 */
const AREA_GROUP_IDS = new Set(AREAS.map((area) => area.id));

/** 区域内容概要（用于生成 tab 列表） */
export interface AreaSummary {
  /** 区域容器节点 id */
  areaId: string;
  /** 区域标题 */
  title: string;
  /** 区域配色名（与 AreaSpec.color 一致） */
  color: string;
  /** 区域内子节点数量（含便签） */
  nodeCount: number;
}

function nodeMap(nodes: CanvasNodeJSON[]): Map<string, CanvasNodeJSON> {
  return new Map(nodes.map((node) => [node.id, node]));
}

/** 读取容器节点声明的子节点 id（容忍脏数据） */
function blockIDsOf(node: CanvasNodeJSON | undefined): string[] {
  const ids = node?.data?.blockIDs;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

/** 汇总「有内容」的区域，按 AREAS 顺序返回 */
export function listAreaSummaries(document: CanvasDocumentJSON): AreaSummary[] {
  const byId = nodeMap(document.nodes);
  return AREAS.map((area) => {
    const members = blockIDsOf(byId.get(area.id)).filter((id) => byId.has(id));
    return {
      areaId: area.id,
      title: area.title,
      color: area.color,
      nodeCount: members.length,
    };
  }).filter((summary) => summary.nodeCount > 0);
}

/**
 * 过滤出单个区域的视图文档：
 * - 保留目标区域容器与其子节点
 * - 隐藏其他区域容器与其子节点
 * - 保留不属于任何区域的顶层散置节点（含自定义 group、便签）
 * - 只保留两端都在视图内的连线
 */
export function filterDocumentToArea(
  document: CanvasDocumentJSON,
  areaId: string
): CanvasDocumentJSON {
  const byId = nodeMap(document.nodes);
  const hiddenMembers = new Set<string>();
  AREAS.forEach((area) => {
    if (area.id !== areaId) {
      blockIDsOf(byId.get(area.id)).forEach((id) => hiddenMembers.add(id));
    }
  });

  const nodes = document.nodes.filter((node) => {
    if (node.id === areaId) {
      return true;
    }
    if (AREA_GROUP_IDS.has(node.id) || hiddenMembers.has(node.id)) {
      return false;
    }
    return true;
  });
  const ids = new Set(nodes.map((node) => node.id));
  const edges = document.edges.filter(
    (edge) => ids.has(edge.sourceNodeID) && ids.has(edge.targetNodeID)
  );
  return { nodes, edges };
}

/**
 * 把某个区域的视图合并回完整文档：
 * - 视图中出现的节点一律以视图为准（新增 / 修改 / 移出容器）
 * - 视图中被删除的活动区域子节点、散置节点不会从完整文档复活
 * - 其他区域的容器与子节点原样保留
 * - 视图内部连线以视图为准，其余连线保留两端都存在的
 */
export function mergeAreaSlice(
  full: CanvasDocumentJSON,
  areaId: string,
  slice: CanvasDocumentJSON
): CanvasDocumentJSON {
  const sliceIds = new Set(slice.nodes.map((node) => node.id));
  const fullById = nodeMap(full.nodes);
  const oldMembers = new Set(blockIDsOf(fullById.get(areaId)));
  const otherAreaMembers = new Set<string>();
  AREAS.forEach((area) => {
    if (area.id !== areaId) {
      blockIDsOf(fullById.get(area.id)).forEach((id) => otherAreaMembers.add(id));
    }
  });

  const nodes: CanvasNodeJSON[] = [
    ...slice.nodes,
    ...full.nodes.filter((node) => {
      // 视图中出现的节点以视图为准
      if (sliceIds.has(node.id)) {
        return false;
      }
      // 活动区域容器：视图里有就以视图为准，没有（被删除/解散）则移除
      if (node.id === areaId) {
        return false;
      }
      // 活动区域里被删除的旧子节点
      if (oldMembers.has(node.id)) {
        return false;
      }
      // 其他区域容器与子节点：隐藏区域，完整保留
      if (AREA_GROUP_IDS.has(node.id) || otherAreaMembers.has(node.id)) {
        return true;
      }
      // 散置节点：视图是唯一事实来源（视图始终包含全部散置节点）
      return false;
    }),
  ];

  const ids = new Set(nodes.map((node) => node.id));
  const edges: CanvasEdgeJSON[] = [
    ...slice.edges.filter((edge) => ids.has(edge.sourceNodeID) && ids.has(edge.targetNodeID)),
    ...full.edges.filter(
      (edge) =>
        ids.has(edge.sourceNodeID) &&
        ids.has(edge.targetNodeID) &&
        !(sliceIds.has(edge.sourceNodeID) && sliceIds.has(edge.targetNodeID))
    ),
  ];
  return { nodes, edges };
}
