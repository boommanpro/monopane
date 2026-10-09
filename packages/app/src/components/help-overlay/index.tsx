/**
 * 快捷键与阅读指南面板：按 ?（Shift + /）呼出 / Esc 关闭
 *
 * viewer 与编辑器通用；编辑器额外列出编辑快捷键
 */

import { useEffect, useState } from 'react';

import styled from 'styled-components';

const OverlayMask = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(2px);
`;

const Panel = styled.div`
  width: min(560px, calc(100vw - 48px));
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  padding: 20px 24px;
  border-radius: 14px;
  background-color: var(--mp-toolbar-bg);
  border: 1px solid var(--mp-toolbar-border);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  font-family: var(--mp-font-mono);
`;

const PanelTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--mp-card-title);
`;

const PanelHint = styled.p`
  margin: 0 0 14px;
  font-size: 11px;
  color: var(--semi-color-text-2);
`;

const GroupTitle = styled.div`
  margin: 12px 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--semi-color-text-2);
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--mp-card-title);
`;

const READ_ROWS: Array<[string, string]> = [
  ['平移画布', '拖拽空白处 / 触摸板双指'],
  ['缩放', 'Ctrl + 滚轮 / 触摸板双指开合'],
  ['适配视图', '工具栏 FitView'],
  ['搜索节点', 'Ctrl + K'],
  ['节点上下游高亮', '单击节点（下游高亮，其余淡化）'],
  ['图例过滤', '点击左下角图例项'],
  ['切换区域', '顶部区域 Tab / URL hash #/group-<area>'],
  ['深链聚焦节点', '#focus=<节点id>'],
  ['阅读深度', '缩小到 45% 以下仅显示标题，放大到 140% 以上显示全部'],
  ['本指南', '?'],
];

const EDIT_ROWS: Array<[string, string]> = [
  ['撤销 / 重做', 'Ctrl + Z / Ctrl + Shift + Z'],
  ['复制 / 粘贴 / 剪切', 'Ctrl + C / V / X'],
  ['删除 / 全选', 'Delete / Ctrl + A'],
  ['成组 / 解组', 'Ctrl + G / Ctrl + Shift + G'],
  ['折叠 / 展开', 'Ctrl + +/-（数字键盘）'],
  ['放大 / 缩小', 'Ctrl + +/-'],
];

export const HelpOverlay = ({ readonly = false }: { readonly?: boolean }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement | null;
        // 输入框内不拦截
        if (target && /^(input|textarea|select)$/i.test(target.tagName)) {
          return;
        }
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <OverlayMask className="help-overlay" onClick={() => setOpen(false)}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <PanelTitle>画布阅读指南</PanelTitle>
        <PanelHint>按 ? 开关本面板，Esc 关闭</PanelHint>
        <GroupTitle>浏览</GroupTitle>
        {READ_ROWS.map(([label, key]) => (
          <Row key={label}>
            <span>{label}</span>
            <span>{key}</span>
          </Row>
        ))}
        {!readonly && (
          <>
            <GroupTitle>编辑</GroupTitle>
            {EDIT_ROWS.map(([label, key]) => (
              <Row key={label}>
                <span>{label}</span>
                <span>{key}</span>
              </Row>
            ))}
          </>
        )}
      </Panel>
    </OverlayMask>
  );
};
