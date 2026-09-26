/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import styled from 'styled-components';

export const Header = styled.div<{ $accent?: string }>`
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  column-gap: 8px;
  border-radius: 8px 8px 0 0;
  cursor: move;

  background: ${({ $accent }) =>
    $accent
      ? `linear-gradient(color-mix(in srgb, ${$accent} 9%, #ffffff), color-mix(in srgb, ${$accent} 2%, #fafafa))`
      : 'linear-gradient(#f2f2ff 0%, rgb(251, 251, 251) 100%)'};
  overflow: hidden;

  padding: 8px;
`;

export const Title = styled.div`
  font-size: 20px;
  flex: 1;
  width: 0;
`;

export const Icon = styled.img<{ $accent?: string }>`
  width: 24px;
  height: 24px;
  scale: 0.8;
  border-radius: 4px;
  ${({ $accent }) =>
    $accent &&
    `background-color: color-mix(in srgb, ${$accent} 12%, #ffffff);
     padding: 2px;
     box-sizing: border-box;`}
`;

export const Operators = styled.div`
  display: flex;
  align-items: center;
  column-gap: 4px;
`;
