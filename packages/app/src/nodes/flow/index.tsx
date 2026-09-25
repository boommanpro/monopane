/**
 * 流程类节点注册：flow-start / flow-end / flow-step / flow-decision
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType } from '@monopane/canvas';

import { createNodeFormMeta } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import {
  FLOW_DECISION_ICON,
  FLOW_END_ICON,
  FLOW_START_ICON,
  FLOW_STEP_ICON,
} from '../../assets/node-icons';
import { FlowBranchField, FlowCard, FlowSidebar } from './shared';

export const FlowStartNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.FlowStart,
  info: {
    icon: FLOW_START_ICON,
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
