/**
 * 区域容器节点：承载四大区域的分组
 */

import {
  FlowNodeBaseType,
  FlowNodeTransformData,
  PositionSchema,
  WorkflowNodeEntity,
  nanoid,
} from '@flowgram.ai/free-layout-editor';

import { FlowNodeRegistry } from '../../typings';
import { AREA_ICON } from '../../assets/node-icons';

let index = 0;

export const GroupNodeRegistry: FlowNodeRegistry = {
  type: FlowNodeBaseType.GROUP,
  info: {
    icon: AREA_ICON,
    label: '区域容器',
    description: '用于承载一个区域（如数据库结构、项目架构）的分组容器，可拖拽移动',
  },
  meta: {
    renderKey: FlowNodeBaseType.GROUP,
    defaultPorts: [],
    isContainer: true,
    disableSideBar: true,
    size: {
      width: 1000,
      height: 700,
    },
    padding: () => ({
      top: 60,
      bottom: 40,
      left: 40,
      right: 40,
    }),
    selectable(node: WorkflowNodeEntity, mousePos?: PositionSchema): boolean {
      if (!mousePos) {
        return true;
      }
      const transform = node.getData<FlowNodeTransformData>(FlowNodeTransformData);
      return !transform.bounds.contains(mousePos.x, mousePos.y);
    },
    expandable: false,
  },
  formMeta: {
    render: () => <></>,
  },
  onAdd() {
    return {
      type: FlowNodeBaseType.GROUP,
      id: `group_${nanoid(5)}`,
      meta: {
        position: {
          x: 0,
          y: 0,
        },
      },
      data: {
        color: 'Blue',
        title: `区域_${++index}`,
      },
    };
  },
};
