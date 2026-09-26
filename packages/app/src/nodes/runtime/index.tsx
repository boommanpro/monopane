/**
 * 运行期节点注册：runtime-event（事件监听）/ runtime-scheduled（定时任务）
 *
 * 与流程节点共用同一套「标题 + 说明 + 类型徽标」的卡片形态，直接复用 flow 工厂。
 */

import { CanvasNodeType } from '@monopane/canvas';

import { createFlowTypeRegistry } from '../flow';
import { RUNTIME_EVENT_ICON, RUNTIME_SCHEDULED_ICON } from '../../assets/node-icons';

export const RuntimeEventNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.RuntimeEvent,
  label: '事件监听',
  description: '监听外部或领域事件后触发处理：标题 + 说明',
  icon: RUNTIME_EVENT_ICON,
  accent: '#0891b2',
  badge: '事件监听',
  defaultTitle: '监听领域事件',
});

export const RuntimeScheduledNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.RuntimeScheduled,
  label: '定时任务',
  description: '按周期定时执行的逻辑：标题 + 说明',
  icon: RUNTIME_SCHEDULED_ICON,
  accent: '#7c3aed',
  badge: '定时任务',
  defaultTitle: '定时任务',
});
