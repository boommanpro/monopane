/**
 * 第三行折叠工具栏（右上角）：默认收起，展开后提供文件类与系统类操作
 *   - 撤销 / 重做
 *   - 导入画布 JSON
 *   - 导出（JSON / PNG / 分享卡片 / SVG / 离线 HTML）
 *   - 主题切换
 *   - 更多（探索高亮 / 恢复示例 / 清空画布 / 演示 / 结构校验 / 文档对比）
 */

import { useEffect, useRef, useState } from 'react';

import { validateCanvasFile } from '@monopane/canvas';
import { useClientContext, usePlayground, useService } from '@flowgram.ai/free-layout-editor';
import { FlowDownloadFormat, FlowDownloadService } from '@flowgram.ai/export-plugin';
import { Divider, Dropdown, IconButton, Toast, Tooltip } from '@douyinfe/semi-ui';
import {
  IconImport,
  IconMore,
  IconMoon,
  IconRedo,
  IconSave,
  IconSun,
  IconUndo,
} from '@douyinfe/semi-icons';

import type { FlowDocumentJSON } from '../typings';
import { THEME_PRESETS, themeStore, useTheme } from '../theme';
import { simulationService } from '../simulation';
import {
  copyCanvasPng,
  exportCanvasHtml,
  exportCanvasImage,
  exportCanvasJson,
  exportCanvasPng,
  exportCanvasSvg,
  exportShareCard,
} from '../export';
import { exploreService, useExploreSnapshot, useSelectedNodes } from '../explore';
import { clearCanvasDocument, getDefaultCanvasDocument } from '../data/storage';
import { CompareModal, StructureCheckModal } from '../components/canvas-audit';
import { areaViewStore } from '../area-view';
import { HiddenFileInput, ToolbarBar, ToolbarToggle, ToolbarWrap } from './styles';

/** 主题菜单项：跟随系统置顶，其余按预设定义顺序 */
const THEME_MENU: { id: string; label: string }[] = [
  { id: 'follow-system', label: '跟随系统' },
  ...THEME_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
];

export const ToolbarSecondary = () => {
  const ctx = useClientContext();
  const playground = usePlayground();
  const downloadService = useService(FlowDownloadService);
  const { presetId, preset } = useTheme();
  const exploreSnapshot = useExploreSnapshot();
  const selectedNodes = useSelectedNodes();
  const selectedNode = selectedNodes[0];
  const demoActive = exploreSnapshot.demo;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [structureVisible, setStructureVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  // 弹窗内展示的完整文档：在打开时（事件回调里）计算一次并缓存，
  // 避免在渲染期调用 mergeFull()（它会变更分区 store 并通知订阅者，造成无限重渲染）。
  const [structureDoc, setStructureDoc] = useState<FlowDocumentJSON>({ nodes: [], edges: [] });
  const [compareDoc, setCompareDoc] = useState<FlowDocumentJSON>({ nodes: [], edges: [] });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 有下拉菜单打开时不自动收起，避免打断菜单操作
  const menuOpenRef = useRef(false);
  useEffect(() => {
    menuOpenRef.current = exportVisible || moreVisible || themeVisible;
  }, [exportVisible, moreVisible, themeVisible]);

  // 点击工具栏外部时收起（有下拉菜单打开时除外）
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (menuOpenRef.current) {
        return;
      }
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [expanded]);

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
    // 清掉 URL hash（避免指向已不存在的区域），不新增历史记录
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
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

  /** 主路径高亮开关（入口 → 完成的快乐路径） */
  const handleMainPathToggle = () => {
    if (exploreSnapshot.pathMode) {
      exploreService.clear();
      return;
    }
    const ok = exploreService.highlightMainPath(ctx);
    if (!ok) {
      Toast.warning({ content: '当前内容没有流程起点（flow-start），无法推导主路径' });
    }
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
    <ToolbarWrap className="canvas-secondary-tools" ref={wrapRef}>
      {expanded ? (
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

          <Dropdown
            trigger="custom"
            position="bottomRight"
            visible={themeVisible}
            onClickOutSide={() => setThemeVisible(false)}
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
            onClickOutSide={() => setMoreVisible(false)}
            render={
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    handleFocusDirection('upstream');
                  }}
                >
                  上游可达高亮
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    handleFocusDirection('downstream');
                  }}
                >
                  下游可达高亮
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    exploreService.clear();
                  }}
                >
                  清除探索高亮
                </Dropdown.Item>
                <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
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
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    handleDemoToggle();
                  }}
                >
                  {demoActive ? '停止演示（按层推进）' : '演示流程（按层推进）'}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    handleMainPathToggle();
                  }}
                >
                  {exploreSnapshot.pathMode ? '关闭主路径高亮' : '主路径高亮（入口 → 完成）'}
                </Dropdown.Item>
                <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    setStructureDoc(mergeFull());
                    setStructureVisible(true);
                  }}
                >
                  画布结构校验
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    setMoreVisible(false);
                    setCompareDoc(mergeFull());
                    setCompareVisible(true);
                  }}
                >
                  导入文档对比
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Tooltip content="更多">
              <IconButton
                type="tertiary"
                theme="borderless"
                icon={<IconMore />}
                onClick={() => setMoreVisible(true)}
              />
            </Tooltip>
          </Dropdown>
        </ToolbarBar>
      ) : (
        <ToolbarToggle title="展开工具栏" onClick={() => setExpanded(true)}>
          <IconMore size="small" />
        </ToolbarToggle>
      )}

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
      />

      <StructureCheckModal
        visible={structureVisible}
        onClose={() => setStructureVisible(false)}
        document={structureDoc}
      />
      <CompareModal
        visible={compareVisible}
        onClose={() => setCompareVisible(false)}
        currentDocument={compareDoc}
      />
    </ToolbarWrap>
  );
};
