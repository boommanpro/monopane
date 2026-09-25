/**
 * 便签节点（复用脚手架的富文本便签实现）
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType } from '@monopane/canvas';

import { FlowNodeRegistry } from '../../typings';
import { NOTE_ICON } from '../../assets/node-icons';

export const NoteNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.Note,
  info: {
    icon: NOTE_ICON,
    label: '便签',
    description: '自由文字说明，可拖拽缩放，不参与连线',
  },
  meta: {
    sidebarDisabled: true,
    defaultPorts: [],
    renderKey: CanvasNodeType.Note,
    size: {
      width: 240,
      height: 150,
    },
  },
  formMeta: {
    render: () => <></>,
  },
  getInputPoints: () => [],
  getOutputPoints: () => [],
  onAdd() {
    return {
      id: `note_${nanoid(5)}`,
      type: CanvasNodeType.Note,
      data: {
        size: {
          width: 240,
          height: 150,
        },
        note: '双击编辑便签内容',
      },
    };
  },
};
