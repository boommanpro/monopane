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
import { ViewerTools } from './toolbar/viewer-tools';
import { nodeRegistries } from './nodes';
import { useEditorProps } from './hooks';
import { getDefaultCanvasDocument } from './data/storage';

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

export const Viewer = () => {
  const initialData = useMemo(() => resolveInitialData(), []);
  const layerChildren = useMemo(() => <ViewerTools />, []);
  const editorProps = useEditorProps(initialData, nodeRegistries, {
    readonly: true,
    layerChildren,
  });

  return (
    <FreeLayoutEditorProvider {...editorProps}>
      <div className="demo-container">
        <DockedPanelLayer>
          <EditorRenderer className="demo-editor" />
        </DockedPanelLayer>
      </div>
    </FreeLayoutEditorProvider>
  );
};
