/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import styled from 'styled-components';
import { IconInfoCircle } from '@douyinfe/semi-icons';

/**
 * 节点卡片（贴纸式）：
 * 描边 / 投影 / 选中光晕全部由 --mp-node-accent 驱动，
 * 与节点图标、图例色点共享同一语义色。
 * 注意 border 拆成三条独立声明：shorthand 内的 color-mix()
 * 含逗号，部分 CSS 处理器会解析失败
 */
export const NodeWrapperStyle = styled.div`
  align-items: flex-start;
  background-color: var(--mp-card-bg);
  border-width: 2px;
  border-style: solid;
  border-color: color-mix(in srgb, var(--mp-node-accent, #4d53e8) 58%, transparent);
  border-radius: 10px;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--mp-node-accent, #4d53e8) 14%, transparent),
    0 8px 20px color-mix(in srgb, var(--mp-node-accent, #4d53e8) 12%, transparent);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  width: 360px;
  height: auto;

  &.selected {
    border-width: 2.5px;
    border-color: var(--mp-node-accent, #4d53e8);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--mp-node-accent, #4d53e8) 20%, transparent),
      0 10px 24px color-mix(in srgb, var(--mp-node-accent, #4d53e8) 20%, transparent);
  }
`;

export const ErrorIcon = () => (
  <IconInfoCircle
    style={{
      position: 'absolute',
      color: 'red',
      left: -6,
      top: -6,
      zIndex: 1,
      background: 'var(--mp-card-bg)',
      borderRadius: 8,
    }}
  />
);
