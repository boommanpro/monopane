/**
 * 顶部工具栏样式（右上角）
 */

import styled from 'styled-components';

export const ToolbarWrap = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
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

/** 收起态的小按钮：默认只露出一个入口，悬停 / 点击展开完整工具栏 */
export const ToolbarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  color: var(--semi-color-text-2);
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    color: var(--semi-color-primary);
    border-color: color-mix(in srgb, var(--semi-color-primary) 40%, rgba(68, 83, 130, 0.25));
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;
