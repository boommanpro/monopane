/**
 * 节点强调色解析：卡片描边 / 图标 / 图例 / 阴影共用同一语义色
 *
 * - 默认取节点注册表的 info.accent
 * - 架构组件进一步按 category（前端 / 网关 / 业务服务…）细分取色，
 *   使同类组件在视觉上自然聚簇
 */

import { CanvasNodeType } from '@monopane/canvas';
import {
  FlowNodeFormData,
  FormModelV2,
  type FlowNodeEntity,
} from '@flowgram.ai/free-layout-editor';

import { ARCH_CATEGORIES } from '../arch-component';
import { FlowNodeRegistry } from '../../typings';

export const DEFAULT_ACCENT = '#4d53e8';

/** 运行时读取节点业务字段（form 引擎托管值） */
function nodeFieldValue(node: FlowNodeEntity, field: string): string | undefined {
  const formModel = node.getData(FlowNodeFormData).getFormModel<FormModelV2>();
  const value = formModel?.getValueIn(field);
  return typeof value === 'string' ? value : undefined;
}

/** 解析节点语义强调色（不含区域容器 group / 便签 note 的特殊渲染） */
export function resolveNodeAccent(node: FlowNodeEntity): string {
  const registry = node.getNodeRegistry<FlowNodeRegistry>();
  let accent = registry?.info?.accent;
  if (node.flowNodeType === CanvasNodeType.ArchComponent) {
    const category = nodeFieldValue(node, 'category');
    accent = ARCH_CATEGORIES[category as keyof typeof ARCH_CATEGORIES]?.color || accent;
  }
  return accent || DEFAULT_ACCENT;
}

/**
 * 图例分组 key：普通节点按类型、架构组件按 category 细分，
 * 与 NodeWrapper 的 data-legend-key 属性一一对应（图例点击过滤用）
 */
export function legendKeyOf(node: FlowNodeEntity): string {
  if (node.flowNodeType === CanvasNodeType.ArchComponent) {
    const category = nodeFieldValue(node, 'category');
    return `arch-${category || 'other'}`;
  }
  return `type-${node.flowNodeType}`;
}
