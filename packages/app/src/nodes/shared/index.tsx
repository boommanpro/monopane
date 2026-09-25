/**
 * 画布节点共享能力：模拟状态条 + 表单渲染骨架
 */

import type { ReactNode } from 'react';

import { FormMeta, ValidateTrigger, useCurrentEntity } from '@flowgram.ai/free-layout-editor';

import { useSimNodeStatus } from '../../simulation';
import { useIsSidebar } from '../../hooks';
import { FormContent, FormHeader } from '../../form-components';
import { SimBanner, SimDot } from './styles';

/**
 * 模拟执行状态提示：idle 时不渲染
 */
export function SimStatusBanner(): JSX.Element | null {
  const node = useCurrentEntity();
  const status = useSimNodeStatus(node.id);
  if (status === 'idle') {
    return null;
  }
  return (
    <SimBanner $status={status}>
      <SimDot $status={status} />
      {status === 'running' ? '运行中' : '已完成'}
    </SimBanner>
  );
}

/**
 * 所有画布节点共用的表单骨架：
 * - 画布上（非侧栏）渲染 card
 * - 侧栏中渲染 sidebar 编辑表单
 */
export function createNodeFormMeta(card: () => ReactNode, sidebar: () => ReactNode): FormMeta {
  const render = () => {
    const isSidebar = useIsSidebar();
    return (
      <>
        <FormHeader />
        <FormContent>{isSidebar ? sidebar() : card()}</FormContent>
      </>
    );
  };

  return {
    render,
    validateTrigger: ValidateTrigger.onChange,
    validate: {
      title: ({ value }: { value?: string }) => (value ? undefined : '标题不能为空'),
    },
  };
}
