/**
 * 布局不变量检查（供「画布校验」功能与测试共同使用）
 *
 * 把 docs/canvas-schema.md 第 2、5 节的清单变成可执行断言：
 * 区域容器契约（原点 / blockIDs / 上限）、子节点网格坐标、节点字段必填、连线语义。
 * 返回空数组代表完全合规。
 */

import { CanvasNodeType } from './types';
import type { CanvasDocumentJSON, CanvasNodeJSON } from './document';
import { findAreaById, GRID_COLUMN_WIDTH, GRID_ROW_HEIGHT } from './constants';

const VALID_TYPES = new Set<string>(Object.values(CanvasNodeType));

/** 收集一份画布文档中所有违反布局契约的地方 */
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

  /** 子节点 id -> 所属区域 slot id */
  const childArea = new Map<string, string>();
  const groupBySlot = new Map<string, CanvasNodeJSON>();
  const startCountByArea = new Map<string, number>();

  /** 报错时优先显示文档自定义标题，缺失则回退契约默认标题 */
  const regionLabel = (slotId: string): string => {
    const group = groupBySlot.get(slotId);
    const title = group?.data?.title;
    if (typeof title === 'string' && title) return title;
    return findAreaById(slotId)?.title ?? slotId;
  };

  // ---- 区域容器 ----
  // 区域按容器 id（slot）识别，标题 / 配色由文档决定（产品文档模式可自定义）。
  // 注意：不要求「全部区域都存在」——用户可以在编辑器中清空 / 删除某个区域，
  // 全区域完整性只在内置示例与 Skill 产出侧做校验。
  nodes
    .filter((node) => node.type === CanvasNodeType.Area)
    .forEach((group) => {
      const area = findAreaById(group.id);
      if (!area) {
        issues.push(`未知区域容器 id「${group.id}」`);
        return;
      }
      if (groupBySlot.has(area.id)) {
        issues.push(`区域容器重复：${area.id}`);
      }
      groupBySlot.set(area.id, group);

      const position = group.meta?.position;
      if (position?.x !== area.origin.x || position?.y !== area.origin.y) {
        issues.push(
          `区域「${regionLabel(group.id)}」原点应为 {x:${area.origin.x},y:${
            area.origin.y
          }}，实际为 ${JSON.stringify(position)}`
        );
      }

      const blockIDs: unknown = group.data?.blockIDs;
      if (!Array.isArray(blockIDs)) {
        issues.push(`区域「${regionLabel(group.id)}」缺少 data.blockIDs 数组`);
        return;
      }
      blockIDs.forEach((id: string) => {
        if (!byId.has(id)) {
          issues.push(`区域「${regionLabel(group.id)}」的 blockIDs 引用了不存在的节点：${id}`);
          return;
        }
        const owner = childArea.get(id);
        if (owner) {
          issues.push(`节点 ${id} 同时属于「${regionLabel(owner)}」与「${regionLabel(group.id)}」`);
          return;
        }
        childArea.set(id, area.id);
      });

      const counted = blockIDs.filter((id: string) => byId.get(id)?.type !== CanvasNodeType.Note);
      if (counted.length > area.limit) {
        issues.push(
          `区域「${regionLabel(group.id)}」节点数 ${counted.length} 超过上限 ${area.limit}`
        );
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
    const areaId = childArea.get(node.id);
    if (!areaId) {
      issues.push(`节点 ${node.id} 不在任何区域容器的 blockIDs 中`);
      return;
    }
    const area = findAreaById(areaId)!;

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
      issues.push(`节点 ${node.id} 超出区域「${regionLabel(areaId)}」的 ${area.columns} 列范围`);
    }

    const data = node.data ?? {};
    const needTitle = (label: string) => {
      if (!data.title) issues.push(`${label}节点 ${node.id} 缺少 data.title`);
    };
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
        const next = (startCountByArea.get(areaId) ?? 0) + 1;
        startCountByArea.set(areaId, next);
        if (next > 1) issues.push(`区域「${regionLabel(areaId)}」放了多个 flow-start`);
        break;
      }
      case CanvasNodeType.FlowEnd:
      case CanvasNodeType.FlowStep:
      case CanvasNodeType.DbView:
      case CanvasNodeType.SeqParticipant:
      case CanvasNodeType.SeqMessage:
      case CanvasNodeType.DfSource:
      case CanvasNodeType.DfTransform:
      case CanvasNodeType.DfStore:
        needTitle('节点');
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
