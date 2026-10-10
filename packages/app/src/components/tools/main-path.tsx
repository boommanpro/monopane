/**
 * 主路径按钮（viewer / 编辑器工具条）：高亮 flow-start → flow-end 的快乐路径
 *
 * 主路径推导：decision 按 defaultBranch，其余节点按距终点最近出边；
 * 高亮时路径节点保持、其余节点变暗、路径连线流动（复用 explore pathMode）
 */

import { useState } from 'react';

import styled from 'styled-components';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Tooltip } from '@douyinfe/semi-ui';

import { exploreService } from '../../explore/service';

const Button = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 10px;
  margin: 0 2px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  color: ${(props) => (props.$active ? 'var(--g-workflow-line-color-default)' : 'inherit')};
  background-color: ${(props) => (props.$active ? 'rgba(77, 83, 232, 0.08)' : 'transparent')};

  &:hover {
    background-color: var(--semi-color-fill-0);
  }
`;

export const MainPathToggle = () => {
  const ctx = useClientContext();
  const [active, setActive] = useState(false);

  const toggle = () => {
    if (active) {
      exploreService.clear();
      setActive(false);
      return;
    }
    if (exploreService.highlightMainPath(ctx)) {
      setActive(true);
    }
  };

  return (
    <Tooltip content="主路径：高亮从入口到完成的快乐路径（再点关闭）" position="top">
      <Button $active={active} onClick={toggle} role="button" aria-pressed={active}>
        主路径
      </Button>
    </Tooltip>
  );
};
