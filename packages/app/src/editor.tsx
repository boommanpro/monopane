/**
 * 项目文档自由画布编辑器
 */

import { useMemo } from 'react';

import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { CanvasToolbar } from './toolbar';
import { themeStore } from './theme';
import { nodeRegistries } from './nodes';
import { useEditorProps } from './hooks';
import { loadCanvasDocument } from './data/storage';
import { AreaTabs, areaViewStore, resolveAreaIdFromPath, useAreaView } from './area-view';

/** 首次加载：应用持久化的主题预设（含跟随系统模式） */
themeStore.init();

/** 首次加载：初始化分区视图状态（模块加载时执行一次，避免渲染期副作用）。
 *  有 URL path（如 /group-flow）时直接打开对应区域，否则默认首个有内容的区域 */
areaViewStore.resetWith(loadCanvasDocument(), resolveAreaIdFromPath() ?? undefined);

export const Editor = () => {
  const { viewVersion } = useAreaView();
  // 当前 tab 的视图文档：viewVersion 变化 → 画布整体重建，走初始化路径自动居中
  const viewData = useMemo(() => areaViewStore.getViewDocument(), [viewVersion]);
  const editorProps = useEditorProps(viewData, nodeRegistries, {});

  return (
    <FreeLayoutEditorProvider key={`canvas-${viewVersion}`} {...editorProps}>
      <div className="demo-container">
        <CanvasToolbar />
        <AreaTabs />
        <DockedPanelLayer>
          <EditorRenderer className="demo-editor" />
        </DockedPanelLayer>
      </div>
    </FreeLayoutEditorProvider>
  );
};
