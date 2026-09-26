/**
 * 流程类节点注册：flow-start / flow-end / flow-step / flow-decision
 * 以及扩充的 flow-subprocess / flow-parallel / flow-delay / flow-notify
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import { CardSection, Muted, TypeBadge } from '../shared/styles';
import { createNodeFormMeta } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import {
  FLOW_DECISION_ICON,
  FLOW_DELAY_ICON,
  FLOW_END_ICON,
  FLOW_NOTIFY_ICON,
  FLOW_PARALLEL_ICON,
  FLOW_START_ICON,
  FLOW_STEP_ICON,
  FLOW_SUBPROCESS_ICON,
} from '../../assets/node-icons';
import { FlowBranchField, FlowCard, FlowSidebar } from './shared';

export const FlowStartNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.FlowStart,
  info: {
    icon: FLOW_START_ICON,
    accent: '#12a150',
    label: '流程起点',
    description: '流程的起点，模拟执行从这里出发；只有输出端口',
  },
  meta: {
    defaultPorts: [{ type: 'output' }],
    size: {
      width: 360,
      height: 140,
    },
  },
  formMeta: createNodeFormMeta(
    () => <FlowCard />,
    () => <FlowSidebar />
  ),
  onAdd() {
    return {
      id: `flow_start_${nanoid(5)}`,
      type: CanvasNodeType.FlowStart,
      data: {
        title: '流程起点',
        description: '',
      },
    };
  },
};

export const FlowEndNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.FlowEnd,
  info: {
    icon: FLOW_END_ICON,
    accent: '#12a150',
    label: '流程终点',
    description: '流程的结束节点；只有输入端口',
  },
  meta: {
    defaultPorts: [{ type: 'input' }],
    size: {
      width: 360,
      height: 140,
    },
  },
  formMeta: createNodeFormMeta(
    () => <FlowCard />,
    () => <FlowSidebar />
  ),
  onAdd() {
    return {
      id: `flow_end_${nanoid(5)}`,
      type: CanvasNodeType.FlowEnd,
      data: {
        title: '流程终点',
        description: '',
      },
    };
  },
};

export const FlowStepNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.FlowStep,
  info: {
    icon: FLOW_STEP_ICON,
    accent: '#12a150',
    label: '流程步骤',
    description: '流程中的一个处理步骤：标题 + 说明',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 360,
      height: 160,
    },
  },
  formMeta: createNodeFormMeta(
    () => <FlowCard />,
    () => <FlowSidebar />
  ),
  onAdd() {
    return {
      id: `flow_step_${nanoid(5)}`,
      type: CanvasNodeType.FlowStep,
      data: {
        title: '流程步骤',
        description: '',
      },
    };
  },
};

export const FlowDecisionNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.FlowDecision,
  info: {
    icon: FLOW_DECISION_ICON,
    accent: '#e08c00',
    label: '判断分支',
    description: '条件判断节点，右侧有「是 / 否」两个输出端口，可配置模拟执行的默认分支',
  },
  meta: {
    defaultPorts: [
      { type: 'input' },
      { type: 'output', portID: 'yes', offset: { x: 0, y: -14 } },
      { type: 'output', portID: 'no', offset: { x: 0, y: 14 } },
    ],
    size: {
      width: 360,
      height: 180,
    },
  },
  formMeta: createNodeFormMeta(
    () => <FlowCard withBranchHint />,
    () => <FlowSidebar extra={<FlowBranchField />} />
  ),
  onAdd() {
    return {
      id: `flow_decision_${nanoid(5)}`,
      type: CanvasNodeType.FlowDecision,
      data: {
        title: '判断条件？',
        description: '',
        defaultBranch: 'yes',
      },
    };
  },
};

/** 派生流程节点的通用配置（子流程 / 并行 / 延时 / 通知等） */
interface FlowTypeOptions {
  type: CanvasNodeType;
  label: string;
  description: string;
  icon: string;
  accent: string;
  /** 卡片上的类型徽标文案 */
  badge: string;
  defaultTitle: string;
  size?: { width: number; height: number };
}

/** 带类型徽标的流程卡片（描述 + 徽标，其余字段与 FlowCard 一致） */
function FlowTypeCard({ badge, accent }: { badge: string; accent: string }): JSX.Element {
  return (
    <CardSection>
      <TypeBadge $color={accent}>{badge}</TypeBadge>
      <Field<string | undefined> name="description">
        {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
      </Field>
    </CardSection>
  );
}

/** 通过工厂生成派生流程节点注册表，减少重复代码 */
export function createFlowTypeRegistry(options: FlowTypeOptions): FlowNodeRegistry {
  const { type, label, description, icon, accent, badge, defaultTitle, size } = options;
  return {
    type,
    info: { icon, accent, label, description },
    meta: {
      defaultPorts: [{ type: 'input' }, { type: 'output' }],
      size: size ?? { width: 360, height: 160 },
    },
    formMeta: createNodeFormMeta(
      () => <FlowTypeCard badge={badge} accent={accent} />,
      () => <FlowSidebar />
    ),
    onAdd() {
      return {
        id: `${type}_${nanoid(5)}`,
        type,
        data: {
          title: defaultTitle,
          description: '',
        },
      };
    },
  };
}

export const FlowSubprocessNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.FlowSubprocess,
  label: '子流程',
  description: '把一段内聚逻辑封装成子流程：标题 + 说明',
  icon: FLOW_SUBPROCESS_ICON,
  accent: '#0d9488',
  badge: '子流程',
  defaultTitle: '子流程',
});

export const FlowParallelNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.FlowParallel,
  label: '并行网关',
  description: '多个分支并行执行，模拟运行时全部出边都会走到',
  icon: FLOW_PARALLEL_ICON,
  accent: '#2563eb',
  badge: '并行网关',
  defaultTitle: '并行网关',
});

export const FlowDelayNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.FlowDelay,
  label: '延时等待',
  description: '等待外部回调或定时触发后再继续：标题 + 说明',
  icon: FLOW_DELAY_ICON,
  accent: '#ea580c',
  badge: '延时等待',
  defaultTitle: '延时等待',
});

export const FlowNotifyNodeRegistry = createFlowTypeRegistry({
  type: CanvasNodeType.FlowNotify,
  label: '通知 / 事件',
  description: '发送通知或领域事件：标题 + 说明',
  icon: FLOW_NOTIFY_ICON,
  accent: '#d94848',
  badge: '通知 / 事件',
  defaultTitle: '发送通知',
});
