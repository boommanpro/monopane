/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import styled from 'styled-components';
import { IconInfoCircle } from '@douyinfe/semi-icons';

export const NodeWrapperStyle = styled.div`
  align-items: flex-start;
  background-color: var(--mp-card-bg);
  border: 1px solid var(--mp-card-border);
  border-radius: 8px;
  box-shadow: var(--mp-card-shadow);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  width: 360px;
  height: auto;

  &.selected {
    border: 1px solid var(--mp-card-selected-border);
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
