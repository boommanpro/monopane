/**
 * 分区视图状态管理
 *
 * 完整文档（full）始终保存在内存里，每个 tab 对应一个独立的「视图」文档，
 * 由 Editor/Viewer 以独立的画布实例展示（key = viewVersion，切换即重建画布，自动居中）。
 *
 * 编辑发生在视图上；合并（mergeAreaSlice）负责把视图写回完整文档，
 * 因此切 tab / 暂存 / 导出都不会丢其他区域的内容。
 *
 * 内容类型与 URL path 绑定：`/` 默认展示首个有内容的区域，
 * `/{区域id}`（如 /group-flow）直接打开对应区域，方便把链接嵌入其他位置。
 *
 * 「是否可模拟运行」（canRun）始终基于编辑器当前展示的内容计算：
 * 当前内容里没有 flow-start 节点时，运行按钮不可用。
 */

import {
  filterDocumentToArea,
  findAreaById,
  findFlowStarts,
  listAreaSummaries,
  mergeAreaSlice,
  type AreaSummary,
  type CanvasDocumentJSON,
} from '@monopane/canvas';

/** tab 展示信息 */
export interface AreaTabInfo {
  key: string;
  title: string;
  /** 区域配色名（Semi 色板名） */
  color?: string;
}

/** 供 React 消费的快照 */
export interface AreaViewSnapshot {
  /** tab 列表（有内容的区域数 >= 2 时才非空） */
  tabs: AreaTabInfo[];
  /** 当前激活的区域 id（无 tab 时为 null） */
  activeKey: string | null;
  /** 当前内容是否存在 flow-start 节点（决定运行按钮是否可用） */
  canRun: boolean;
  /** 视图版本：视图文档每次变化 +1，画布以其为 key 整体重建 */
  viewVersion: number;
}

type ViewMode = { kind: 'full' } | { kind: 'area'; areaId: string };

export interface SwitchOptions {
  /** 切换后是否同步更新 URL path（浏览器后退触发的切换应传 false） */
  pushUrl?: boolean;
}

/** 从当前 URL path 解析目标区域 id（如 /group-flow → group-flow），无匹配返回 null */
export function resolveAreaIdFromPath(): string | null {
  const segment = window.location.pathname.split('/').filter(Boolean)[0] ?? '';
  if (!segment) {
    return null;
  }
  return findAreaById(segment) ? segment : null;
}

export class AreaViewStore {
  private full: CanvasDocumentJSON = { nodes: [], edges: [] };

  private mode: ViewMode = { kind: 'full' };

  /** 当前视图文档（交给画布展示的切片 / 完整文档） */
  private view: CanvasDocumentJSON = { nodes: [], edges: [] };

  private viewVersion = 0;

  private snapshot: AreaViewSnapshot = {
    tabs: [],
    activeKey: null,
    canRun: false,
    viewVersion: 0,
  };

  private listeners = new Set<() => void>();

  /** 当前挂载画布的 document（用于识别防抖暂存是否来自旧画布） */
  private currentDocument: unknown = null;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): AreaViewSnapshot => this.snapshot;

  /** 当前视图文档（给 Editor/Viewer 作画布 initialData） */
  public getViewDocument = (): CanvasDocumentJSON => this.view;

  /** 画布挂载完成时登记其 document */
  public attachDocument = (document: unknown): void => {
    this.currentDocument = document;
  };

  /** 该 document 是否属于当前挂载的画布 */
  public isCurrentDocument = (document: unknown): boolean => this.currentDocument === document;

  /**
   * 初始化 / 整体替换文档（首次加载、导入、恢复示例、清空画布）
   * 视图变化 → viewVersion +1 → 画布整体重建
   * @param preferredAreaId 优先展示的区域 id（来自 URL path），无内容或缺失时回退到首个区域
   */
  public resetWith(full: CanvasDocumentJSON, preferredAreaId?: string): CanvasDocumentJSON {
    this.full = full;
    const areas = listAreaSummaries(full);
    if (areas.length > 0) {
      const areaIds = new Set(areas.map((area) => area.areaId));
      const areaId =
        preferredAreaId && areaIds.has(preferredAreaId) ? preferredAreaId : areas[0].areaId;
      this.mode = { kind: 'area', areaId };
      this.view = filterDocumentToArea(full, areaId);
    } else {
      this.mode = { kind: 'full' };
      this.view = full;
    }
    this.viewVersion += 1;
    this.recompute(this.view);
    return this.view;
  }

  /**
   * 把编辑器当前内容合并进完整文档（暂存 / 导出前调用）
   * 不改变当前视图，viewVersion 不变
   * @returns 合并后的完整文档
   */
  public mergeCurrentView(editorDoc: CanvasDocumentJSON): CanvasDocumentJSON {
    this.full =
      this.mode.kind === 'area'
        ? mergeAreaSlice(this.full, this.mode.areaId, editorDoc)
        : editorDoc;
    this.recompute(editorDoc);
    return this.full;
  }

  /**
   * 切换 tab（区域）
   * 先把当前视图合并回完整文档，再生成目标视图；viewVersion +1 → 画布重建
   * @param target 目标区域 id
   * @param editorDoc 编辑器当前内容（切换前先合并，避免丢编辑）
   * @returns 目标视图文档；无需切换时返回 null
   */
  public switchView(
    target: string,
    editorDoc: CanvasDocumentJSON,
    options?: SwitchOptions
  ): CanvasDocumentJSON | null {
    if (target === this.snapshot.activeKey) {
      return null;
    }
    // 先把当前视图合并回完整文档
    this.full =
      this.mode.kind === 'area'
        ? mergeAreaSlice(this.full, this.mode.areaId, editorDoc)
        : editorDoc;
    this.mode = { kind: 'area', areaId: target };
    this.view = filterDocumentToArea(this.full, target);
    this.viewVersion += 1;
    this.recompute(this.view);
    if (options?.pushUrl !== false) {
      window.history.pushState(null, '', `/${target}`);
    }
    return this.view;
  }

  private recompute(canRunDoc: CanvasDocumentJSON): void {
    const areas = listAreaSummaries(this.full);
    const areaSet = new Map(areas.map((area) => [area.areaId, area]));
    // 激活的区域即使被清空也保留 tab，避免编辑中 tab 突然消失
    if (this.mode.kind === 'area' && !areaSet.has(this.mode.areaId)) {
      const spec = findAreaById(this.mode.areaId);
      areaSet.set(this.mode.areaId, {
        areaId: this.mode.areaId,
        title: spec?.title ?? this.mode.areaId,
        color: spec?.color ?? 'Gray',
        nodeCount: 0,
      });
    }
    const tabs = areaSet.size >= 2 ? Array.from(areaSet.values()).map(toTabInfo) : [];
    this.snapshot = {
      tabs,
      activeKey: this.mode.kind === 'area' ? this.mode.areaId : null,
      canRun: findFlowStarts(canRunDoc.nodes).length > 0,
      viewVersion: this.viewVersion,
    };
    this.listeners.forEach((listener) => listener());
  }
}

function toTabInfo(area: AreaSummary): AreaTabInfo {
  return { key: area.areaId, title: area.title, color: area.color };
}

/** 全局单例：编辑器 / viewer / 工具栏共同访问 */
export const areaViewStore = new AreaViewStore();
