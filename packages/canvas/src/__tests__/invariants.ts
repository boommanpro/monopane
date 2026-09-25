/**
 * 布局不变量检查（测试专用）
 *
 * 把 docs/canvas-schema.md 第 2、5 节的清单变成可执行的断言，
 * 用于校验内置示例与 examples/ 下的真实产物。
 */

import { CanvasNodeType } from '../types';
import type { CanvasDocumentJSON, CanvasNodeJSON } from '../document';
import { AREAS, findAreaByTitle, GRID_COLUMN_WIDTH, GRID_ROW_HEIGHT } from '../constants';

const VALID_TYPES = new Set<string>(Object.values(CanvasNodeType));

/** 收集一份画布文档中所有违反布局契约的地方，返回空数组代表完全合规 */
export function collectLayoutIssues(document: CanvasDocumentJSON): string[] {
  const issues: string[] = [];
  const nodes = document.nodes ?? [];
  const edges = document.edges ?? [];
  const byId = new Map<string, CanvasNodeJSON>();

  nodes.forEach((node) => {
    if (byId.has(node.id)) {
      issues.push(`节点 id 重复：${node.id}`);
      return;
    }
    byId.set(node.id, node);
  });

  /** 子节点 id -> 所属区域标题 */
  const childArea = new Map<string, string>();
  const groupByTitle = new Map<string, CanvasNodeJSON>();
  const startCountByArea = new Map<string, number>();

  // ---- 区域容器 ----
  nodes
    .filter((node) => node.type === CanvasNodeType.Area)
    .forEach((group) => {
      const area = findAreaByTitle(group.data?.title);
      if (!area) {
        issues.push(`未知区域容器标题「${group.data?.title}」`);
        return;
      }
      if (groupByTitle.has(area.title)) {
        issues.push(`区域容器重复：${area.title}`);
      }
      groupByTitle.set(area.title, group);

      const position = group.meta?.position;
      if (position?.x !== area.origin.x || position?.y !== area.origin.y) {
        issues.push(
          `区域「${area.title}」原点应为 {x:${area.origin.x},y:${
            area.origin.y
          }}，实际为 ${JSON.stringify(position)}`
        );
      }

      const blockIDs: unknown = group.data?.blockIDs;
      if (!Array.isArray(blockIDs)) {
        issues.push(`区域「${area.title}」缺少 data.blockIDs 数组`);
        return;
      }
      blockIDs.forEach((id: string) => {
        if (!byId.has(id)) {
          issues.push(`区域「${area.title}」的 blockIDs 引用了不存在的节点：${id}`);
          return;
        }
        const owner = childArea.get(id);
        if (owner) {
          issues.push(`节点 ${id} 同时属于「${owner}」与「${area.title}」`);
          return;
        }
        childArea.set(id, area.title);
      });

      const counted = blockIDs.filter((id: string) => byId.get(id)?.type !== CanvasNodeType.Note);
      if (counted.length > area.limit) {
        issues.push(`区域「${area.title}」节点数 ${counted.length} 超过上限 ${area.limit}`);
      }
    });

  AREAS.forEach((area) => {
    if (!groupByTitle.has(area.title)) {
      issues.push(`缺少区域容器「${area.title}」`);
    }
  });

  // ---- 子节点 ----
  nodes.forEach((node) => {
    if (!VALID_TYPES.has(String(node.type))) {
      issues.push(`节点 ${node.id} 的 type「${node.type}」不合法`);
      return;
    }
    if (node.type === CanvasNodeType.Area) {
      return;
    }
    const areaTitle = childArea.get(node.id);
    if (!areaTitle) {
      issues.push(`节点 ${node.id} 不在任何区域容器的 blockIDs 中`);
      return;
    }
    const area = findAreaByTitle(areaTitle)!;

    const position = node.meta?.position;
    if (!position) {
      issues.push(`节点 ${node.id} 缺少 meta.position`);
      return;
    }
    if (position.x % GRID_COLUMN_WIDTH !== 0 || position.y % GRID_ROW_HEIGHT !== 0) {
      issues.push(
        `节点 ${node.id} 坐标 {x:${position.x},y:${position.y}} 不符合 x % ${GRID_COLUMN_WIDTH} / y % ${GRID_ROW_HEIGHT} 的网格`
      );
    }
    if (position.x < 0 || position.y < 0) {
      issues.push(`节点 ${node.id} 坐标为负`);
    }
    if (position.x >= area.columns * GRID_COLUMN_WIDTH) {
      issues.push(`节点 ${node.id} 超出区域「${areaTitle}」的 ${area.columns} 列范围`);
    }

    const data = node.data ?? {};
    switch (node.type) {
      case CanvasNodeType.DbTable:
        if (!data.title) issues.push(`表节点 ${node.id} 缺少 data.title`);
        if (!Array.isArray(data.fields) || data.fields.length === 0) {
          issues.push(`表节点 ${node.id} 的 data.fields 必须是非空数组`);
        }
        break;
      case CanvasNodeType.ArchComponent:
        if (!data.title) issues.push(`架构节点 ${node.id} 缺少 data.title`);
        if (!data.category) issues.push(`架构节点 ${node.id} 缺少 data.category`);
        break;
      case CanvasNodeType.FlowDecision:
        if (!data.title) issues.push(`判断节点 ${node.id} 缺少 data.title`);
        if (data.defaultBranch !== 'yes' && data.defaultBranch !== 'no') {
          issues.push(`判断节点 ${node.id} 的 defaultBranch 必须是 "yes" 或 "no"`);
        }
        break;
      case CanvasNodeType.FlowStart: {
        if (!data.title) issues.push(`流程节点 ${node.id} 缺少 data.title`);
        const next = (startCountByArea.get(areaTitle) ?? 0) + 1;
        startCountByArea.set(areaTitle, next);
        if (next > 1) issues.push(`区域「${areaTitle}」放了多个 flow-start`);
        break;
      }
      case CanvasNodeType.FlowEnd:
      case CanvasNodeType.FlowStep:
        if (!data.title) issues.push(`流程节点 ${node.id} 缺少 data.title`);
        break;
      case CanvasNodeType.Note:
        if (typeof data.note !== 'string' || !data.note.trim()) {
          issues.push(`便签节点 ${node.id} 的 data.note 应是非空字符串`);
        }
        break;
      default:
        break;
    }
  });

  // ---- 连线 ----
  edges.forEach((edge, index) => {
    const source = byId.get(edge.sourceNodeID);
    const target = byId.get(edge.targetNodeID);
    if (!source) issues.push(`edges[${index}] 的 sourceNodeID 不存在：${edge.sourceNodeID}`);
    if (!target) issues.push(`edges[${index}] 的 targetNodeID 不存在：${edge.targetNodeID}`);
    if (!source || !target) return;

    if (source.id === target.id) issues.push(`连线自环：${source.id}`);
    if (source.type === CanvasNodeType.Area || target.type === CanvasNodeType.Area) {
      issues.push(`连线不能连接区域容器：${sourceNodeLabel(source, target)}`);
    }

    const from = childArea.get(source.id);
    const to = childArea.get(target.id);
    if (from && to && from !== to) {
      issues.push(`跨区域连线：${source.id}(${from}) → ${target.id}(${to})`);
    }

    const kind = edge.data?.kind;
    if (kind === 'db-relation' && !edge.data?.relation) {
      issues.push(`表关联 ${source.id} → ${target.id} 缺少 relation`);
    }
    if (kind === 'flow' && source.type === CanvasNodeType.FlowDecision) {
      const port = edge.sourcePortID;
      if (port !== 'yes' && port !== 'no') {
        issues.push(`判断节点 ${source.id} 的出边缺少 sourcePortID（yes / no）`);
      }
    }
  });

  return issues;
}

function sourceNodeLabel(source: CanvasNodeJSON, target: CanvasNodeJSON): string {
  return `${source.id} → ${target.id}`;
}
