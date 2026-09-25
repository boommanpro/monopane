/**
 * 轻量浏览器内模拟执行器
 * Lightweight browser-side simulation runner.
 *
 * 遍历规则（起点识别、出边索引、分支选择）来自 `@monopane/canvas` 的纯函数，
 * 这里只负责用定时器驱动节点状态机：idle -> running -> done，
 * 同时把走过的连线标记为流动线（复用编辑器内置的 isFlowingLine + linesManager）。
 */

import {
  findFlowStarts,
  indexFlowOutEdges,
  pickNextFlowEdges,
  type CanvasDocumentJSON,
  type CanvasEdgeJSON,
  type CanvasNodeJSON,
} from '@monopane/canvas';
import type { WorkflowDocument, WorkflowLineEntity } from '@flowgram.ai/free-layout-editor';

export type SimNodeStatus = 'idle' | 'running' | 'done';

export type SimSpeed = 0.5 | 1 | 2;

export interface SimSnapshot {
  running: boolean;
  /** nodeId -> 状态；未出现的节点视为 idle */
  statuses: Record<string, SimNodeStatus>;
}

/** 单步停留时长（1x 速度下） */
const STEP_DURATION = 900;

/** 安全上限，避免数据中存在环时无限递归 */
const MAX_STEPS = 300;

export class CanvasSimulationService {
  private statuses = new Map<string, SimNodeStatus>();

  private flowingLineKeys = new Set<string>();

  private listeners = new Set<() => void>();

  private snapshot: SimSnapshot = { running: false, statuses: {} };

  private timers: ReturnType<typeof setTimeout>[] = [];

  private speed: SimSpeed = 1;

  private refreshLines?: () => void;

  private stepCount = 0;

  /** 尚未执行完成的节点数，归零代表整轮模拟结束 */
  private pending = 0;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): SimSnapshot => this.snapshot;

  public getSpeed = (): SimSpeed => this.speed;

  public setSpeed = (speed: SimSpeed): void => {
    this.speed = speed;
  };

  public isRunning(): boolean {
    return this.snapshot.running;
  }

  /** 供编辑器 isFlowingLine 使用 */
  public isFlowingLine(line: WorkflowLineEntity): boolean {
    if (this.flowingLineKeys.size === 0) {
      return false;
    }
    const from = line.from?.id;
    const to = line.to?.id;
    if (!from || !to) {
      return false;
    }
    return this.flowingLineKeys.has(this.lineKey(from, to));
  }

  /**
   * 开始模拟执行
   * @returns ok 为 false 时 message 说明原因（无流程起点）
   */
  public start(document: WorkflowDocument): { ok: boolean; message?: string } {
    this.reset();
    /** 编辑器序列化出来的就是本项目的画布文档格式，这里跨过 FlowGram 的类型边界 */
    const json = document.toJSON() as unknown as CanvasDocumentJSON;
    const nodes = json.nodes ?? [];
    const edges = json.edges ?? [];
    const starts = findFlowStarts(nodes);
    if (starts.length === 0) {
      return { ok: false, message: '画布中没有流程起点（flow-start）节点，无法模拟运行' };
    }

    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const outEdges = indexFlowOutEdges(edges);

    this.refreshLines = () => document.linesManager.forceUpdate();
    this.stepCount = 0;
    this.pending = 0;
    this.snapshot = { running: true, statuses: {} };
    this.emit();

    starts.forEach((start, index) => {
      this.visit(start.id, undefined, index * 180, nodesById, outEdges);
    });

    return { ok: true };
  }

  /** 停止执行，保留当前状态 */
  public stop(): void {
    this.clearTimers();
    this.snapshot = { running: false, statuses: { ...this.snapshot.statuses } };
    this.emit();
  }

  /** 停止并清空所有状态 */
  public reset(): void {
    this.clearTimers();
    this.statuses.clear();
    this.flowingLineKeys.clear();
    this.stepCount = 0;
    this.pending = 0;
    this.snapshot = { running: false, statuses: {} };
    this.emit();
  }

  /** 重置后 dispose，用于组件卸载 */
  public dispose(): void {
    this.clearTimers();
    this.listeners.clear();
  }

  private visit(
    nodeId: string,
    previousNodeId: string | undefined,
    delay: number,
    nodesById: Map<string, CanvasNodeJSON>,
    outEdges: Map<string, CanvasEdgeJSON[]>
  ): void {
    if (!this.snapshot.running || this.stepCount >= MAX_STEPS) {
      return;
    }
    this.stepCount += 1;
    this.pending += 1;
    this.pushTimer(
      setTimeout(() => {
        if (!this.snapshot.running) {
          return;
        }
        if (previousNodeId) {
          this.flowingLineKeys.add(this.lineKey(previousNodeId, nodeId));
        }
        this.setStatus(nodeId, 'running');
        const hold = STEP_DURATION / this.speed;
        this.pushTimer(
          setTimeout(() => {
            if (!this.snapshot.running) {
              return;
            }
            this.setStatus(nodeId, 'done');
            const nextEdges = pickNextFlowEdges(nodesById.get(nodeId), outEdges.get(nodeId));
            nextEdges.forEach((edge, index) => {
              this.visit(edge.targetNodeID, nodeId, index * 140, nodesById, outEdges);
            });
            this.pending -= 1;
            /**
             * 所有分支都走到终点后自动结束，让工具栏的「运行中」状态能回到「已完成」
             */
            if (this.pending <= 0) {
              this.snapshot = { running: false, statuses: { ...this.snapshot.statuses } };
              this.emit();
            }
          }, hold)
        );
      }, delay)
    );
  }

  private setStatus(nodeId: string, status: SimNodeStatus): void {
    this.statuses.set(nodeId, status);
    this.snapshot = {
      running: this.snapshot.running,
      statuses: { ...this.snapshot.statuses, [nodeId]: status },
    };
    this.emit();
  }

  private emit(): void {
    this.refreshLines?.();
    this.listeners.forEach((listener) => listener());
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  private pushTimer(timer: ReturnType<typeof setTimeout>): void {
    this.timers.push(timer);
  }

  private lineKey(from: string, to: string): string {
    return `${from}->${to}`;
  }
}

/** 全局单例：供编辑器 isFlowingLine 与节点卡片共同访问 */
export const simulationService = new CanvasSimulationService();
