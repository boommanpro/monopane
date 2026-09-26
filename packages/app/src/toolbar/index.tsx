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
  IconAscend,
  IconClear,
  IconDescend,
  IconImport,
  IconLock,
  IconMoon,
  IconMore,
  IconPlay,
  IconPlayCircle,
  IconRedo,
  IconRefresh,
  IconSave,
  IconSearch,
  IconSetting,
  IconStop,
  IconSun,
  IconUndo,
  IconUnlock,
} from '@douyinfe/semi-icons';

import type { FlowDocumentJSON } from '../typings';
import { THEME_PRESETS, themeStore, useTheme } from '../theme';
import { simulationService, useSimulation, type SimSpeed } from '../simulation';
import {
  exportCanvasHtml,
  exportCanvasImage,
  exportCanvasJson,
  exportCanvasPng,
  copyCanvasPng,
  exportCanvasSvg,
  exportShareCard,
} from '../export';
import {
  exploreService,
  ExploreSearchModal,
  useExploreSnapshot,
  useSelectedNodes,
} from '../explore';
import { clearCanvasDocument, getDefaultCanvasDocument } from '../data/storage';
import { FitView } from '../components/tools/fit-view';
import { CompareModal, StructureCheckModal } from '../components/canvas-audit';
import { areaViewStore, useAreaView } from '../area-view';
import { HiddenFileInput, ToolbarBar, ToolbarToggle, ToolbarWrap } from './styles';

const SPEED_OPTIONS: { label: string; value: SimSpeed }[] = [
  { label: '0.5x 慢速', value: 0.5 },
  { label: '1x 常速', value: 1 },
  { label: '2x 快速', value: 2 },
];

/** 主题菜单项：跟随系统置顶，其余按预设定义顺序 */
const THEME_MENU: { id: string; label: string }[] = [
  { id: 'follow-system', label: '跟随系统' },
  ...THEME_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
];

export const CanvasToolbar = () => {
  const ctx = useClientContext();
  const playground = usePlayground();
  const refresh = useRefresh();
  const downloadService = useService(FlowDownloadService);
  const { running, speed, setSpeed } = useSimulation();
  const { canRun } = useAreaView();
  const { presetId, preset } = useTheme();
  const exploreSnapshot = useExploreSnapshot();
  const selectedNodes = useSelectedNodes();
  const selectedNode = selectedNodes[0];
  const demoActive = exploreSnapshot.demo;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speedVisible, setSpeedVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [structureVisible, setStructureVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 工具栏自动收缩：默认收起为小按钮，悬停展开、移出自动收起
  const [collapsed, setCollapsed] = useState(true);
  const collapseTimer = useRef<number | null>(null);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = speedVisible || exportVisible || moreVisible || themeVisible;
  }, [speedVisible, exportVisible, moreVisible, themeVisible]);

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

  // 演示模式：定时推进一层，到最后一层停止计时（高亮保留，可手动停止）
  useEffect(() => {
    if (!demoActive) {
      return;
    }
    const timer = window.setInterval(() => {
      exploreService.demoNext();
      if (exploreService.isDemoLast()) {
        window.clearInterval(timer);
      }
    }, 900);
    return () => window.clearInterval(timer);
  }, [demoActive]);

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

  const handleExportSvg = () => {
    exportCanvasSvg(ctx);
    Toast.success({ content: '已导出画布 SVG 矢量图' });
  };

  /** 导出指定倍率的矢量渲染 PNG（与 SVG 视觉一致） */
  const handleExportPngScale = async (scale: number) => {
    try {
      await exportCanvasPng(ctx, scale);
      Toast.success({ content: `已导出画布 PNG（${scale}x）` });
    } catch {
      Toast.error({ content: '导出 PNG 失败，请重试' });
    }
  };

  const handleCopyPng = async () => {
    try {
      await copyCanvasPng(ctx, 2);
      Toast.success({ content: '已复制画布 PNG 到剪贴板' });
    } catch (error) {
      Toast.error({
        content: error instanceof Error ? error.message : '复制 PNG 失败，请重试',
      });
    }
  };

  const handleExportShareCard = async () => {
    try {
      await exportShareCard(ctx, mergeFull());
      Toast.success({ content: '已导出分享卡片' });
    } catch (error) {
      Toast.error({
        content: error instanceof Error ? error.message : '导出分享卡片失败',
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

  /** 高亮选中节点的上游 / 下游可达 */
  const handleFocusDirection = (direction: 'upstream' | 'downstream') => {
    if (!selectedNode) {
      Toast.warning({ content: '请先选中一个节点' });
      return;
    }
    exploreService.focus(ctx, selectedNode.id, direction);
  };

  /** 演示模式开关 */
  const handleDemoToggle = () => {
    if (demoActive) {
      exploreService.demoStop();
      return;
    }
    const ok = exploreService.demoStart(ctx);
    if (!ok) {
      Toast.warning({ content: '当前内容没有流程起点（flow-start），无法演示' });
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

            <Tooltip content="搜索节点（Ctrl+K）">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconSearch />}
                onClick={() => exploreService.setPanelOpen(!exploreSnapshot.panelOpen)}
              />
            </Tooltip>
            <Tooltip content="上游可达高亮">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconDescend />}
                onClick={() => handleFocusDirection('upstream')}
              />
            </Tooltip>
            <Tooltip content="下游可达高亮">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconAscend />}
                onClick={() => handleFocusDirection('downstream')}
              />
            </Tooltip>
            <Tooltip content="清除探索高亮">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconClear />}
                onClick={() => exploreService.clear()}
              />
            </Tooltip>
            <Tooltip content={demoActive ? '停止演示' : '演示流程（按层推进）'}>
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={demoActive ? <IconStop /> : <IconPlayCircle />}
                onClick={handleDemoToggle}
              />
            </Tooltip>

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
                    导出 PNG 图片（高清截图）
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setExportVisible(false);
                      void handleExportPngScale(1);
                    }}
                  >
                    导出 PNG 1x（矢量渲染）
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setExportVisible(false);
                      void handleExportPngScale(2);
                    }}
                  >
                    导出 PNG 2x（矢量渲染）
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setExportVisible(false);
                      void handleCopyPng();
                    }}
                  >
                    复制 PNG 到剪贴板
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setExportVisible(false);
                      void handleExportShareCard();
                    }}
                  >
                    导出分享卡片
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setExportVisible(false);
                      handleExportSvg();
                    }}
                  >
                    导出 SVG 矢量图
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
              visible={themeVisible}
              onClickOutSide={() => {
                setThemeVisible(false);
                scheduleCollapse();
              }}
              render={
                <Dropdown.Menu>
                  {THEME_MENU.map((item) => (
                    <Dropdown.Item
                      key={item.id}
                      active={item.id === presetId}
                      onClick={() => {
                        themeStore.setPreset(item.id);
                        setThemeVisible(false);
                      }}
                    >
                      {item.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              }
            >
              <Tooltip content="切换主题">
                <IconButton
                  type="tertiary"
                  theme="borderless"
                  icon={preset.mode === 'dark' ? <IconMoon /> : <IconSun />}
                  onClick={() => setThemeVisible(true)}
                />
              </Tooltip>
            </Dropdown>
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
                  <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
                  <Dropdown.Item
                    onClick={() => {
                      setMoreVisible(false);
                      setStructureVisible(true);
                    }}
                  >
                    画布结构校验
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setMoreVisible(false);
                      setCompareVisible(true);
                    }}
                  >
                    导入文档对比
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

      <ExploreSearchModal />

      <StructureCheckModal
        visible={structureVisible}
        onClose={() => setStructureVisible(false)}
        document={mergeFull()}
      />
      <CompareModal
        visible={compareVisible}
        onClose={() => setCompareVisible(false)}
        currentDocument={mergeFull()}
      />
    </ToolbarWrap>
  );
};
