/**
 * 右上角工具栏样式
 *
 * 布局：编辑器右上角为三行堆叠（.mp-toolbar-stack，见 styles/index.css）：
 *   第一行 图形切换栏（AreaTabs）
 *   第二行 工具栏（CanvasToolbar，默认展开）
 *   第三行 折叠栏（ToolbarSecondary，默认收起，导入 / 导出 / 主题 / 撤销 / 重做）
 * 本文件只负责「行内」的样式，定位交给堆叠容器。
 */

import styled from 'styled-components';

export const ToolbarWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  pointer-events: none;
`;

export const ToolbarBar = styled.div`
  display: flex;
  align-items: center;
  column-gap: 2px;
  height: 40px;
  padding: 0 6px;
  background-color: var(--mp-toolbar-bg);
  border: 1px solid var(--mp-toolbar-border);
  border-radius: 10px;
  box-shadow: var(--mp-card-shadow);
  pointer-events: auto;
`;

/** 收起态的小按钮：默认只露出一个入口，点击展开完整工具栏 */
export const ToolbarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--mp-toolbar-border);
  border-radius: 10px;
  background-color: var(--mp-toolbar-bg);
  box-shadow: var(--mp-card-shadow);
  color: var(--semi-color-text-2);
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    color: var(--semi-color-primary);
    border-color: color-mix(in srgb, var(--semi-color-primary) 40%, var(--mp-toolbar-border));
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;
