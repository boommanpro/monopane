/**
 * 当前选中节点（响应式）
 *
 * 订阅 WorkflowSelectService 的选中变化，供工具栏的上下游高亮使用。
 */

import { useEffect, useState } from 'react';

import {
  useService,
  WorkflowSelectService,
  type WorkflowNodeEntity,
} from '@flowgram.ai/free-layout-editor';

export function useSelectedNodes(): WorkflowNodeEntity[] {
  const selectService = useService(WorkflowSelectService);
  const [selected, setSelected] = useState<WorkflowNodeEntity[]>(selectService.selectedNodes);

  useEffect(() => {
    const disposable = selectService.onSelectionChanged(() => {
      setSelected(selectService.selectedNodes);
    });
    return () => disposable.dispose();
  }, [selectService]);

  return selected;
}
