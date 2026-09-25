/**
 * 顶部工具栏样式
 */

import styled from 'styled-components';

export const ToolbarWrap = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
  z-index: 20;
`;

export const ToolbarBar = styled.div`
  display: flex;
  align-items: center;
  column-gap: 2px;
  height: 40px;
  padding: 0 6px;
  background-color: #fff;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  pointer-events: auto;
`;

export const ToolbarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1c1f23;
`;

export const ToolbarHint = styled.span`
  padding: 0 8px;
  font-size: 12px;
  color: rgba(28, 31, 35, 0.55);
`;

export const HiddenFileInput = styled.input`
  display: none;
`;
