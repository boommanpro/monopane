/**
 * 内容类型 Tab 栏：按区域切换画布视图，并与 URL path 绑定
 *
 * - 0 或 1 个有内容的区域：不渲染，单页直接展示
 * - >= 2 个有内容的区域：渲染各区域 tab（无「全部」tab）
 * 切换时先把当前视图合并回完整文档，然后由 store 的 viewVersion 变化
 * 触发画布整体重建（Editor 以新视图文档重建，走初始化路径自动居中）。
 * URL path（/group-flow 等）与当前区域一一对应，可直接嵌入外部链接。
 */

import { useEffect } from 'react';

import { useClientContext } from '@flowgram.ai/free-layout-editor';

import type { FlowDocumentJSON } from '../typings';
import { simulationService } from '../simulation';
import { AreaTabButton, AreaTabDot, AreaTabsBar, AreaTabsWrap } from './styles';
import { areaViewStore, resolveAreaIdFromPath } from './store';
import { useAreaView } from './hooks';

/** 区域配色名 → 色点颜色（与 groupColors 的 400 色阶保持一致） */
const AREA_DOT_COLORS: Record<string, string> = {
  Blue: '#60a5fa',
  Violet: '#a78bfa',
  Green: '#4ade80',
  Orange: '#fb923c',
};

export const AreaTabs = () => {
  const ctx = useClientContext();
  const { tabs, activeKey } = useAreaView();

  // 浏览器前进/后退改变 URL path 时同步切换区域（不重复 push history）
  useEffect(() => {
    const handlePopState = () => {
      const areaId = resolveAreaIdFromPath();
      if (!areaId || areaId === areaViewStore.getSnapshot().activeKey) {
        return;
      }
      areaViewStore.switchView(areaId, ctx.document.toJSON() as FlowDocumentJSON, {
        pushUrl: false,
      });
      simulationService.reset();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [ctx]);

  if (tabs.length === 0) {
    return null;
  }

  const handleSelect = (key: string) => {
    if (key === activeKey) {
      return;
    }
    // 先把当前视图合并回完整文档，再切换到目标视图
    const switched = areaViewStore.switchView(key, ctx.document.toJSON() as FlowDocumentJSON);
    if (!switched) {
      return;
    }
    // 旧内容的运行状态一并清掉；画布由 viewVersion 变化触发整体重建并自动居中
    simulationService.reset();
  };

  return (
    <AreaTabsWrap className="area-tabs">
      <AreaTabsBar>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <AreaTabButton
              key={tab.key}
              type="button"
              $active={active}
              onClick={() => handleSelect(tab.key)}
            >
              <AreaTabDot $color={(tab.color && AREA_DOT_COLORS[tab.color]) ?? '#9ca3af'} />
              {tab.title}
            </AreaTabButton>
          );
        })}
      </AreaTabsBar>
    </AreaTabsWrap>
  );
};
