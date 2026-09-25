/**
 * 顶部工具栏：文档标题、运行逻辑模拟、导入导出、只读切换
 */

import { useRef, useState } from 'react';

import { validateCanvasFile } from '@monopane/canvas';
import {
  useClientContext,
  usePlayground,
  useRefresh,
  useService,
} from '@flowgram.ai/free-layout-editor';
import { FlowDownloadFormat, FlowDownloadService } from '@flowgram.ai/export-plugin';
import { Divider, Dropdown, IconButton, Toast, Tooltip } from '@douyinfe/semi-ui';
import {
  IconArticle,
  IconImport,
  IconLock,
  IconMore,
  IconPlay,
  IconRefresh,
  IconSave,
  IconStop,
  IconUnlock,
} from '@douyinfe/semi-icons';

import type { FlowDocumentJSON } from '../typings';
import { simulationService, useSimulation, type SimSpeed } from '../simulation';
import { exportCanvasHtml, exportCanvasImage, exportCanvasJson } from '../export';
import { clearCanvasDocument, getDefaultCanvasDocument } from '../data/storage';
import { HiddenFileInput, ToolbarBar, ToolbarHint, ToolbarTitle, ToolbarWrap } from './styles';

const SPEED_OPTIONS: { label: string; value: SimSpeed }[] = [
  { label: '0.5x 慢速', value: 0.5 },
  { label: '1x 常速', value: 1 },
  { label: '2x 快速', value: 2 },
];

export interface CanvasToolbarProps {
  title?: string;
}

export const CanvasToolbar = ({ title = '项目文档画布' }: CanvasToolbarProps) => {
  const ctx = useClientContext();
  const playground = usePlayground();
  const refresh = useRefresh();
  const downloadService = useService(FlowDownloadService);
  const { running, speed, setSpeed } = useSimulation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speedVisible, setSpeedVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);

  const readonly = playground.config.readonly;

  /** 用一份新文档替换当前画布 */
  const applyDocument = (document: FlowDocumentJSON, message: string) => {
    simulationService.reset();
    ctx.document.fromJSON(document);
    ctx.tools.fitView(false);
    Toast.success({ content: message });
  };

  const handleImport = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const result = validateCanvasFile(JSON.parse(await file.text()));
      if (!result.ok) {
        Toast.error({ content: `导入失败：${result.message}` });
        return;
      }
      applyDocument(result.document, `已导入 ${file.name}`);
    } catch {
      Toast.error({ content: '导入失败：文件不是合法的 JSON' });
    }
  };

  const handleExportJson = () => {
    exportCanvasJson(ctx.document.toJSON() as FlowDocumentJSON);
    Toast.success({ content: '已导出画布 JSON' });
  };

  const handleExportPng = async () => {
    try {
      await exportCanvasImage(downloadService, FlowDownloadFormat.PNG);
      Toast.success({ content: '已导出画布 PNG' });
    } catch {
      Toast.error({ content: '导出 PNG 失败，请重试' });
    }
  };

  const handleExportHtml = async () => {
    try {
      await exportCanvasHtml(ctx.document.toJSON() as FlowDocumentJSON);
      Toast.success({ content: '已导出离线 HTML，双击即可查看' });
    } catch (error) {
      Toast.error({
        content: error instanceof Error ? error.message : '导出离线 HTML 失败',
      });
    }
  };

  const handleRun = () => {
    const result = simulationService.start(ctx.document);
    if (!result.ok) {
      Toast.warning({ content: result.message ?? '无法开始模拟运行' });
    }
  };

  const handleToggleReadonly = () => {
    playground.config.readonly = !playground.config.readonly;
    refresh();
  };

  const handleRestoreDefault = () => {
    clearCanvasDocument();
    applyDocument(getDefaultCanvasDocument(), '已恢复内置示例');
  };

  const handleClearCanvas = () => {
    clearCanvasDocument();
    applyDocument({ nodes: [], edges: [] }, '画布已清空');
  };

  return (
    <ToolbarWrap className="canvas-toolbar">
      <ToolbarBar>
        <ToolbarTitle>
          <IconArticle />
          {title}
        </ToolbarTitle>
        {readonly && <ToolbarHint>只读预览中</ToolbarHint>}
      </ToolbarBar>

      <ToolbarBar>
        {running ? (
          <Tooltip content="停止模拟">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconStop />}
              onClick={() => simulationService.stop()}
            />
          </Tooltip>
        ) : (
          <Tooltip content="模拟运行逻辑">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconPlay />}
              onClick={handleRun}
            />
          </Tooltip>
        )}
        <Tooltip content="重置运行状态">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconRefresh />}
            onClick={() => simulationService.reset()}
          />
        </Tooltip>
        <Dropdown
          trigger="custom"
          position="bottomRight"
          visible={speedVisible}
          onClickOutSide={() => setSpeedVisible(false)}
          render={
            <Dropdown.Menu>
              {SPEED_OPTIONS.map((option) => (
                <Dropdown.Item
                  key={option.value}
                  active={option.value === speed}
                  onClick={() => {
                    setSpeed(option.value);
                    setSpeedVisible(false);
                  }}
                >
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          }
        >
          <IconButton
            type="tertiary"
            theme="borderless"
            onClick={() => setSpeedVisible(true)}
            style={{ width: 40, fontSize: 12 }}
          >
            {speed}x
          </IconButton>
        </Dropdown>

        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />

        <Tooltip content="导入画布 JSON">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconImport />}
            disabled={readonly}
            onClick={handleImport}
          />
        </Tooltip>
        <Dropdown
          trigger="custom"
          position="bottomRight"
          visible={exportVisible}
          onClickOutSide={() => setExportVisible(false)}
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => {
                  setExportVisible(false);
                  handleExportJson();
                }}
              >
                导出 JSON（可再次导入编辑）
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  setExportVisible(false);
                  void handleExportPng();
                }}
              >
                导出 PNG 图片
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  setExportVisible(false);
                  void handleExportHtml();
                }}
              >
                导出离线 HTML（双击可看）
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Tooltip content="导出">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconSave />}
              onClick={() => setExportVisible(true)}
            />
          </Tooltip>
        </Dropdown>

        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />

        <Tooltip content={readonly ? '切换到编辑模式' : '切换到只读预览'}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={readonly ? <IconLock /> : <IconUnlock />}
            onClick={handleToggleReadonly}
          />
        </Tooltip>
        <Dropdown
          trigger="custom"
          position="bottomRight"
          visible={moreVisible}
          onClickOutSide={() => setMoreVisible(false)}
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => {
                  setMoreVisible(false);
                  handleRestoreDefault();
                }}
              >
                恢复内置示例
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  setMoreVisible(false);
                  handleClearCanvas();
                }}
              >
                清空画布
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconMore />}
            onClick={() => setMoreVisible(true)}
          />
        </Dropdown>
      </ToolbarBar>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
      />
    </ToolbarWrap>
  );
};
