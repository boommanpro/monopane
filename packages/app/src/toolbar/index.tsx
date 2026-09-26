/**
 * 顶部工具栏（右上角）：运行逻辑模拟、撤销重做、适配视口、导入导出、只读切换
 */

import { useEffect, useRef, useState } from 'react';

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
  IconImport,
  IconLock,
  IconMore,
  IconPlay,
  IconRedo,
  IconRefresh,
  IconSave,
  IconSetting,
  IconStop,
  IconUndo,
  IconUnlock,
} from '@douyinfe/semi-icons';

import type { FlowDocumentJSON } from '../typings';
import { simulationService, useSimulation, type SimSpeed } from '../simulation';
import { exportCanvasHtml, exportCanvasImage, exportCanvasJson } from '../export';
import { clearCanvasDocument, getDefaultCanvasDocument } from '../data/storage';
import { FitView } from '../components/tools/fit-view';
import { areaViewStore, useAreaView } from '../area-view';
import { HiddenFileInput, ToolbarBar, ToolbarToggle, ToolbarWrap } from './styles';

const SPEED_OPTIONS: { label: string; value: SimSpeed }[] = [
  { label: '0.5x 慢速', value: 0.5 },
  { label: '1x 常速', value: 1 },
  { label: '2x 快速', value: 2 },
];

export const CanvasToolbar = () => {
  const ctx = useClientContext();
  const playground = usePlayground();
  const refresh = useRefresh();
  const downloadService = useService(FlowDownloadService);
  const { running, speed, setSpeed } = useSimulation();
  const { canRun } = useAreaView();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speedVisible, setSpeedVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 工具栏自动收缩：默认收起为小按钮，悬停展开、移出自动收起
  const [collapsed, setCollapsed] = useState(true);
  const collapseTimer = useRef<number | null>(null);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = speedVisible || exportVisible || moreVisible;
  }, [speedVisible, exportVisible, moreVisible]);

  useEffect(
    () => () => {
      if (collapseTimer.current !== null) {
        window.clearTimeout(collapseTimer.current);
      }
    },
    []
  );

  const handleMouseEnter = () => {
    if (collapseTimer.current !== null) {
      window.clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setCollapsed(false);
  };

  const scheduleCollapse = () => {
    if (collapseTimer.current !== null) {
      window.clearTimeout(collapseTimer.current);
    }
    collapseTimer.current = window.setTimeout(() => setCollapsed(true), 300);
  };

  const handleMouseLeave = () => {
    // 有下拉菜单打开时不自动收起，避免打断菜单悬停
    if (menuOpenRef.current) {
      return;
    }
    scheduleCollapse();
  };

  useEffect(() => {
    const disposable = ctx.history.undoRedoService.onChange(() => {
      setCanUndo(ctx.history.canUndo());
      setCanRedo(ctx.history.canRedo());
    });
    return () => disposable.dispose();
  }, [ctx]);

  const readonly = playground.config.readonly;

  /** 用一份新文档替换当前画布：重置分区视图，画布随 viewVersion 重建并自动居中 */
  const applyDocument = (document: FlowDocumentJSON, message: string) => {
    simulationService.reset();
    areaViewStore.resetWith(document);
    window.history.pushState(null, '', '/');
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

  /** 导出时先合并当前视图，确保其他区域的内容不丢失 */
  const mergeFull = (): FlowDocumentJSON =>
    areaViewStore.mergeCurrentView(ctx.document.toJSON() as FlowDocumentJSON);

  const handleExportJson = () => {
    exportCanvasJson(mergeFull());
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
      await exportCanvasHtml(mergeFull());
      Toast.success({ content: '已导出离线 HTML，双击即可查看' });
    } catch (error) {
      Toast.error({
        content: error instanceof Error ? error.message : '导出离线 HTML 失败',
      });
    }
  };

  const handleRun = () => {
    // 运行前先合并当前视图，让运行依据完整内容判定
    mergeFull();
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
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {collapsed ? (
          <ToolbarToggle title="展开工具栏" onClick={() => setCollapsed(false)}>
            <IconSetting size="small" />
          </ToolbarToggle>
        ) : (
          <ToolbarBar>
            <Tooltip content="撤销">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconUndo />}
                disabled={!canUndo || readonly}
                onClick={() => ctx.history.undo()}
              />
            </Tooltip>
            <Tooltip content="重做">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconRedo />}
                disabled={!canRedo || readonly}
                onClick={() => ctx.history.redo()}
              />
            </Tooltip>
            <FitView />
            <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
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
              <Tooltip
                content={
                  canRun ? '模拟运行逻辑' : '当前内容没有流程起点（flow-start），无法模拟运行'
                }
              >
                <IconButton
                  type="tertiary"
                  theme="borderless"
                  icon={<IconPlay />}
                  disabled={!canRun}
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
              onClickOutSide={() => {
                setSpeedVisible(false);
                scheduleCollapse();
              }}
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
              onClickOutSide={() => {
                setExportVisible(false);
                scheduleCollapse();
              }}
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
              onClickOutSide={() => {
                setMoreVisible(false);
                scheduleCollapse();
              }}
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
        )}
      </div>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
      />
    </ToolbarWrap>
  );
};
