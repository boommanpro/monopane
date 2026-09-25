/**
 * 项目文档自由画布编辑器
 */

import { useMemo } from 'react';

import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { CanvasToolbar } from './toolbar';
import { nodeRegistries } from './nodes';
import { useEditorProps } from './hooks';
import { loadCanvasDocument } from './data/storage';
import { CanvasTools } from './components/tools';

export const Editor = () => {
  const initialData = useMemo(() => loadCanvasDocument(), []);
  const layerChildren = useMemo(() => <CanvasTools />, []);
  const editorProps = useEditorProps(initialData, nodeRegistries, { layerChildren });

  return (
    <FreeLayoutEditorProvider {...editorProps}>
      <div className="demo-container">
        <CanvasToolbar />
        <DockedPanelLayer>
          <EditorRenderer className="demo-editor" />
        </DockedPanelLayer>
      </div>
    </FreeLayoutEditorProvider>
  );
};
