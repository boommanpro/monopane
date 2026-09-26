/**
 * 内容类型 Tab 栏样式（右上角）
 */

import styled from 'styled-components';

export const AreaTabsWrap = styled.div`
  position: absolute;
  top: 64px;
  right: 16px;
  z-index: 19;
  pointer-events: none;
`;

export const AreaTabsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 38px;
  padding: 0 4px;
  background-color: #fff;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  pointer-events: auto;
`;

export const AreaTabButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 7px;
  background: ${(props) => (props.$active ? 'rgba(77, 83, 232, 0.08)' : 'transparent')};
  color: ${(props) => (props.$active ? '#1c1f23' : 'rgba(28, 31, 35, 0.65)')};
  font-size: 13px;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(28, 31, 35, 0.05);
  }
`;

export const AreaTabDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
`;
