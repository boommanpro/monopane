/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { CanvasNodeType } from '@monopane/canvas';
import { type FlowNodeType } from '@flowgram.ai/free-layout-editor';

/**
 * 判断父节点是否可以包含对应子节点
 * Determine whether the parent node can contain the corresponding child node
 *
 * 规则：
 * - 拖到画布根层（没有目标容器）始终允许
 * - 只有「区域容器」可以容纳其它节点
 * - 区域容器之间不能再嵌套
 */
export function canContainNode(
  childNodeType: CanvasNodeType | FlowNodeType,
  parentNodeType?: CanvasNodeType | FlowNodeType
): boolean {
  if (!parentNodeType) {
    return true;
  }
  if (parentNodeType !== CanvasNodeType.Area) {
    return false;
  }
  return childNodeType !== CanvasNodeType.Area;
}
