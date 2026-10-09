/**
 * 只读预览（viewer）顶部标题栏：
 * 左侧状态点 + 画布标题 + 规模元信息，中间区域 Tab，右侧主题切换
 *
 * 对齐 archify 的顶部 chrome：接收方打开单体 HTML 即可看到
 * 图的标题、规模与主题入口，而不是一张裸画布
 */

import styled from 'styled-components';
import { IconMoon, IconSun } from '@douyinfe/semi-icons';

import { useTheme } from '../../theme/use-theme';
import { themeStore } from '../../theme';

const HeaderBar = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
  padding: 0 16px;
  flex-shrink: 0;
  background-color: var(--mp-toolbar-bg);
  border-bottom: 1px solid var(--mp-toolbar-border);
  font-family: var(--mp-font-mono);
  z-index: 30;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const PulseDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);
  animation: mp-breathe 2.4s ease-in-out infinite;
  flex-shrink: 0;

  @keyframes mp-breathe {
    0%,
    100% {
      box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(52, 211, 153, 0.08);
    }
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--mp-card-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.span`
  font-size: 11px;
  color: var(--semi-color-text-2);
  white-space: nowrap;
`;

const HeaderCenter = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ThemeButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--mp-toolbar-border);
  background-color: transparent;
  color: var(--semi-color-text-1);
  font-size: 11px;
  font-family: var(--mp-font-mono);
  cursor: pointer;

  &:hover {
    background-color: var(--semi-color-fill-0);
  }
`;

export interface ViewerHeaderProps {
  /** 画布标题（通常为活跃区域名） */
  title: string;
  /** 规模元信息，如「48 节点 · 45 连线」 */
  meta?: string;
  /** 中间区域（区域 Tab 等） */
  center?: React.ReactNode;
}

const THEME_LABEL: Record<string, string> = {
  'follow-system': '主题 · 跟随系统',
  light: '主题 · 浅色',
  dark: '主题 · 深色',
  ocean: '主题 · 深海蓝',
  forest: '主题 · 墨绿',
};

export const ViewerHeader = ({ title, meta, center }: ViewerHeaderProps) => {
  const { presetId, preset } = useTheme();
  const isDark = preset.mode === 'dark';
  return (
    <HeaderBar className="viewer-header">
      <Brand>
        <PulseDot />
        <Title>{title}</Title>
        {meta && <Meta>{meta}</Meta>}
      </Brand>
      <HeaderCenter>{center}</HeaderCenter>
      <HeaderRight>
        <ThemeButton type="button" onClick={() => themeStore.cycle()}>
          {isDark ? <IconMoon size="small" /> : <IconSun size="small" />}
          {THEME_LABEL[presetId] ?? '主题'}
        </ThemeButton>
      </HeaderRight>
    </HeaderBar>
  );
};
