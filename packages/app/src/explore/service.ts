/**
 * 探索交互服务（A）：节点搜索定位、上下游可达、路径探查、演示模式
 *
 * 状态通过快照对外暴露（useSyncExternalStore），画布节点/连线据此高亮。
 * 图算法复用 @monopane/canvas 的纯函数（graph.ts）。
 */

import {
  collectReachability,
  findFlowLayerOrder,
  findPathBetween,
  type CanvasDocumentJSON,
  type FlowLayerStep,
  type ReachDirection,
} from '@monopane/canvas';
import {
  FlowNodeFormData,
  type FormModelV2,
  type FreeLayoutPluginContext,
  type WorkflowLineEntity,
  type WorkflowNodeEntity,
} from '@flowgram.ai/free-layout-editor';

/** 画布节点的探索高亮 class（与 styles/index.css 的 .explore-* 对应） */
export type ExploreNodeClass = '' | 'focus' | 'reachable' | 'path' | 'dim';

export interface ExploreSnapshot {
  /** 搜索面板是否打开 */
  panelOpen: boolean;
  /** 当前聚焦节点 */
  focusId?: string;
  /** 聚焦方向（上游 / 下游） */
  direction?: ReachDirection;
  /** 是否路径探查模式 */
  pathMode: boolean;
  /** 路径上的节点（含起点终点） */
  pathNodeIds: string[];
  /** 可达节点（不含焦点） */
  reachableNodeIds: string[];
  /** 需要变暗的节点 */
  dimNodeIds: string[];
  /** 需要高亮的边 key（${from}->${to}） */
  pathEdgeKeys: string[];
  /** 演示模式开关 */
  demo: boolean;
  demoLayerIndex: number;
  demoSteps: FlowLayerStep[];
}

const EMPTY_SNAPSHOT: ExploreSnapshot = {
  panelOpen: false,
  pathMode: false,
  pathNodeIds: [],
  reachableNodeIds: [],
  dimNodeIds: [],
  pathEdgeKeys: [],
  demo: false,
  demoLayerIndex: 0,
  demoSteps: [],
};

/** 从快照推导某个节点的高亮 class */
export function nodeClassFrom(snapshot: ExploreSnapshot, nodeId: string): ExploreNodeClass {
  if (snapshot.demo) {
    const step = snapshot.demoSteps[snapshot.demoLayerIndex];
    return step && step.nodeIds.includes(nodeId) ? 'path' : 'dim';
  }
  if (!snapshot.focusId) {
    return '';
  }
  if (snapshot.pathMode) {
    if (nodeId === snapshot.focusId) {
      return 'focus';
    }
    return snapshot.pathNodeIds.includes(nodeId) ? 'path' : 'dim';
  }
  if (nodeId === snapshot.focusId) {
    return 'focus';
  }
  return snapshot.reachableNodeIds.includes(nodeId) ? 'reachable' : 'dim';
}

export class ExploreService {
  private snapshot: ExploreSnapshot = { ...EMPTY_SNAPSHOT };

  private listeners = new Set<() => void>();

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): ExploreSnapshot => this.snapshot;

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private update(patch: Partial<ExploreSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.emit();
  }

  /** 从实时实体构建图数据（只保留探索算法需要的字段） */
  private buildGraph(ctx: FreeLayoutPluginContext): CanvasDocumentJSON {
    const nodes = ctx.document
      .getAssociatedNodes()
      .map((node) => ({ id: node.id, type: node.flowNodeType }));
    const edges = ctx.document.linesManager
      .getAllLines()
      .map((line) => ({
        sourceNodeID: line.from?.id ?? '',
        targetNodeID: line.to?.id ?? '',
      }))
      .filter((edge) => edge.sourceNodeID && edge.targetNodeID);
    return { nodes, edges } as CanvasDocumentJSON;
  }

  private allNodeIds(ctx: FreeLayoutPluginContext): string[] {
    return ctx.document.getAssociatedNodes().map((node) => node.id);
  }

  public setPanelOpen(open: boolean): void {
    this.update({ panelOpen: open });
  }

  /** 聚焦节点并高亮其上游 / 下游可达 */
  public focus(ctx: FreeLayoutPluginContext, nodeId: string, direction: ReachDirection): void {
    const reach = collectReachability(this.buildGraph(ctx), nodeId, direction);
    const reachableSet = new Set(reach.nodeIds);
    const dim = this.allNodeIds(ctx).filter((id) => id !== nodeId && !reachableSet.has(id));
    this.update({
      focusId: nodeId,
      direction,
      pathMode: false,
      pathNodeIds: [],
      reachableNodeIds: reach.nodeIds,
      dimNodeIds: dim,
      pathEdgeKeys: reach.edgeKeys,
    });
  }

  /** 探查两个节点之间的最短有向路径；找不到返回 false */
  public explorePath(ctx: FreeLayoutPluginContext, fromId: string, toId: string): boolean {
    const path = findPathBetween(this.buildGraph(ctx), fromId, toId);
    if (!path) {
      return false;
    }
    const pathSet = new Set(path.nodeIds);
    const dim = this.allNodeIds(ctx).filter((id) => !pathSet.has(id));
    this.update({
      focusId: toId,
      pathMode: true,
      pathNodeIds: path.nodeIds,
      reachableNodeIds: [],
      dimNodeIds: dim,
      pathEdgeKeys: path.edgeKeys,
    });
    return true;
  }

  public clear(): void {
    this.update({
      focusId: undefined,
      direction: undefined,
      pathMode: false,
      pathNodeIds: [],
      reachableNodeIds: [],
      dimNodeIds: [],
      pathEdgeKeys: [],
    });
  }

  /** 启动演示模式：按层遍历 flow-start 出发的流程；无起点时返回 false */
  public demoStart(ctx: FreeLayoutPluginContext): boolean {
    const steps = findFlowLayerOrder(this.buildGraph(ctx));
    if (steps.length === 0) {
      return false;
    }
    this.update({ demo: true, demoLayerIndex: 0, demoSteps: steps });
    return true;
  }

  public demoStop(): void {
    this.update({ demo: false, demoLayerIndex: 0, demoSteps: [] });
  }

  public demoNext(): void {
    if (!this.snapshot.demo) {
      return;
    }
    const next = Math.min(this.snapshot.demoLayerIndex + 1, this.snapshot.demoSteps.length - 1);
    this.update({ demoLayerIndex: next });
  }

  public isDemoActive(): boolean {
    return this.snapshot.demo;
  }

  /** 当前演示层是否为最后一层 */
  public isDemoLast(): boolean {
    return this.snapshot.demo && this.snapshot.demoLayerIndex >= this.snapshot.demoSteps.length - 1;
  }

  /** 连线是否为探索 / 演示需要流动高亮的线 */
  public isFlowingLine(line: WorkflowLineEntity): boolean {
    if (!this.snapshot.demo) {
      return false;
    }
    const key = `${line.from?.id}->${line.to?.id}`;
    return (this.snapshot.demoSteps[this.snapshot.demoLayerIndex]?.edgeKeys ?? []).includes(key);
  }
}

/** 从画布文档按 id 查找节点实体 */
export function findNodeById(
  ctx: FreeLayoutPluginContext,
  nodeId: string
): WorkflowNodeEntity | undefined {
  return ctx.document.getAllNodes().find((node) => node.id === nodeId);
}

/** 按标题搜索节点（大小写不敏感），排除区域容器 */
export function searchNodes(
  ctx: FreeLayoutPluginContext,
  query: string
): { node: WorkflowNodeEntity; title: string }[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return [];
  }
  return ctx.document
    .getAssociatedNodes()
    .filter((node) => node.flowNodeType !== 'group')
    .map((node) => ({
      node,
      title: String(
        node.getData(FlowNodeFormData).getFormModel<FormModelV2>()?.getValueIn?.('title') ?? ''
      ),
    }))
    .filter((item) => item.title.toLowerCase().includes(keyword))
    .slice(0, 30);
}

export const exploreService = new ExploreService();
