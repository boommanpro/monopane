/**
 * 画布节点注册表
 */

import { FlowNodeRegistry } from '../typings';
import { NoteNodeRegistry } from './note';
import { GroupNodeRegistry } from './group';
import {
  FlowDecisionNodeRegistry,
  FlowEndNodeRegistry,
  FlowStartNodeRegistry,
  FlowStepNodeRegistry,
} from './flow';
import { DbTableNodeRegistry } from './db-table';
import { ArchComponentNodeRegistry } from './arch-component';

export const nodeRegistries: FlowNodeRegistry[] = [
  DbTableNodeRegistry,
  ArchComponentNodeRegistry,
  FlowStartNodeRegistry,
  FlowStepNodeRegistry,
  FlowDecisionNodeRegistry,
  FlowEndNodeRegistry,
  NoteNodeRegistry,
  GroupNodeRegistry,
];
