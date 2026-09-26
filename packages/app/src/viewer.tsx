/**
 * 只读画布预览
 *
 * 两种使用方式：
 * 1. `MODE=viewer` 构建出的 viewer 页面（单体 HTML 导出的模板）
 * 2. 页面中通过 window.__CANVAS_DATA__ 注入数据，未注入时回退内置示例
 */

import { useMemo } from 'react';

import { validateCanvasFile } from '@monopane/canvas';
import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import type { FlowDocumentJSON } from './typings';
import { themeStore } from './theme';
import { nodeRegistries } from './nodes';
import { useEditorProps } from './hooks';
import { getDefaultCanvasDocument } from './data/storage';
import { AreaTabs, areaViewStore, resolveAreaIdFromPath, useAreaView } from './area-view';

function resolveInitialData(): FlowDocumentJSON {
  const injected = window.__CANVAS_DATA__;
  if (injected) {
    const result = validateCanvasFile(injected);
    if (result.ok) {
      return result.document;
    }
    console.warn('[canvas-viewer] 注入的画布数据不合法，已回退内置示例：', result.message);
  }
  return getDefaultCanvasDocument();
}

/** 首次加载：应用持久化的主题预设（含跟随系统模式） */
themeStore.init();

/** 首次加载：初始化分区视图状态（模块加载时执行一次，避免渲染期副作用） */
areaViewStore.resetWith(resolveInitialData(), resolveAreaIdFromPath() ?? undefined);

export const Viewer = () => {
  // 与编辑器一致的分区视图逻辑：只读模式下同样按内容类型分页展示
  const { viewVersion } = useAreaView();
  const viewData = useMemo(() => areaViewStore.getViewDocument(), [viewVersion]);
  const editorProps = useEditorProps(viewData, nodeRegistries, {
    readonly: true,
  });

  return (
    <FreeLayoutEditorProvider key={`canvas-${viewVersion}`} {...editorProps}>
      <div className="demo-container">
        <AreaTabs />
        <DockedPanelLayer>
          <EditorRenderer className="demo-editor" />
        </DockedPanelLayer>
      </div>
    </FreeLayoutEditorProvider>
  );
};
