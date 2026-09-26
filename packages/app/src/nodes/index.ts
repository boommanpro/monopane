/**
 * 画布节点注册表
 */

import { FlowNodeRegistry } from '../typings';
import { RuntimeEventNodeRegistry, RuntimeScheduledNodeRegistry } from './runtime';
import { NoteNodeRegistry } from './note';
import { GroupNodeRegistry } from './group';
import {
  FlowDecisionNodeRegistry,
  FlowDelayNodeRegistry,
  FlowEndNodeRegistry,
  FlowNotifyNodeRegistry,
  FlowParallelNodeRegistry,
  FlowStartNodeRegistry,
  FlowStepNodeRegistry,
  FlowSubprocessNodeRegistry,
} from './flow';
import { DbViewNodeRegistry } from './db-view';
import { DbTableNodeRegistry } from './db-table';
import { ArchComponentNodeRegistry } from './arch-component';

export const nodeRegistries: FlowNodeRegistry[] = [
  DbTableNodeRegistry,
  DbViewNodeRegistry,
  ArchComponentNodeRegistry,
  FlowStartNodeRegistry,
  FlowStepNodeRegistry,
  FlowDecisionNodeRegistry,
  FlowSubprocessNodeRegistry,
  FlowParallelNodeRegistry,
  FlowDelayNodeRegistry,
  FlowNotifyNodeRegistry,
  FlowEndNodeRegistry,
  RuntimeEventNodeRegistry,
  RuntimeScheduledNodeRegistry,
  NoteNodeRegistry,
  GroupNodeRegistry,
];
