/**
 * 流程区拓扑布局：列 = 拓扑层，主路径 row 0 直线，分支按 BFS 深度下挂
 */

import { describe, expect, it } from 'vitest';

import { CanvasNodeType } from '../types';
import type { CanvasDocumentJSON, CanvasEdgeJSON, CanvasNodeJSON } from '../document';
import { findMainFlowPath, layoutFlowByTopology } from '../graph';

const node = (id: string, type: string, data: Record<string, unknown> = {}): CanvasNodeJSON => ({
  id,
  type,
  data,
});

const flow = (
  sourceNodeID: string,
  targetNodeID: string,
  sourcePortID?: string
): CanvasEdgeJSON => ({
  sourceNodeID,
  targetNodeID,
  sourcePortID,
  data: { kind: 'flow' },
});

const doc = (nodes: CanvasNodeJSON[], edges: CanvasEdgeJSON[]): CanvasDocumentJSON => ({
  nodes,
  edges,
});

describe('findMainFlowPath', () => {
  it('线性链路返回全部节点', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('a', CanvasNodeType.FlowStep),
        node('end', CanvasNodeType.FlowEnd),
      ],
      [flow('start', 'a'), flow('a', 'end')]
    );
    expect(findMainFlowPath(document)).toEqual(['start', 'a', 'end']);
  });

  it('decision 按 defaultBranch 选出边', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('d', CanvasNodeType.FlowDecision, { defaultBranch: 'no' }),
        node('yes-path', CanvasNodeType.FlowStep),
        node('no-path', CanvasNodeType.FlowStep),
        node('end', CanvasNodeType.FlowEnd),
      ],
      [
        flow('start', 'd'),
        flow('d', 'yes-path', 'yes'),
        flow('d', 'no-path', 'no'),
        flow('yes-path', 'end'),
        flow('no-path', 'end'),
      ]
    );
    expect(findMainFlowPath(document)).toEqual(['start', 'd', 'no-path', 'end']);
  });

  it('非 decision 节点优先走距终点更近的出边', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('detour', CanvasNodeType.FlowStep),
        node('mid', CanvasNodeType.FlowStep),
        node('main', CanvasNodeType.FlowStep),
        node('end', CanvasNodeType.FlowEnd),
      ],
      [
        flow('start', 'detour'),
        flow('start', 'main'),
        flow('detour', 'mid'),
        flow('mid', 'end'),
        flow('main', 'end'),
      ]
    );
    expect(findMainFlowPath(document)).toEqual(['start', 'main', 'end']);
  });

  it('没有 flow-start 时返回空', () => {
    const document = doc([node('a', CanvasNodeType.FlowStep)], []);
    expect(findMainFlowPath(document)).toEqual([]);
  });
});

describe('layoutFlowByTopology', () => {
  it('主路径占 row 0 一条直线，层为列', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('a', CanvasNodeType.FlowStep),
        node('b', CanvasNodeType.FlowStep),
        node('end', CanvasNodeType.FlowEnd),
      ],
      [flow('start', 'a'), flow('a', 'b'), flow('b', 'end')]
    );
    const result = layoutFlowByTopology(document);
    expect(result.mainPath).toEqual(['start', 'a', 'b', 'end']);
    expect(result.grid.get('start')).toEqual({ col: 0, row: 0 });
    expect(result.grid.get('a')).toEqual({ col: 1, row: 0 });
    expect(result.grid.get('b')).toEqual({ col: 2, row: 0 });
    expect(result.grid.get('end')).toEqual({ col: 3, row: 0 });
    expect(result.levelCount).toBe(4);
    expect(result.cyclic).toEqual([]);
  });

  it('分支节点下挂（row ≥ 1），汇合列不冲突', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('d', CanvasNodeType.FlowDecision, { defaultBranch: 'yes' }),
        node('yes', CanvasNodeType.FlowStep),
        node('no', CanvasNodeType.FlowStep),
        node('end', CanvasNodeType.FlowEnd),
      ],
      [
        flow('start', 'd'),
        flow('d', 'yes', 'yes'),
        flow('d', 'no', 'no'),
        flow('yes', 'end'),
        flow('no', 'end'),
      ]
    );
    const result = layoutFlowByTopology(document);
    expect(result.grid.get('yes')).toEqual({ col: 2, row: 0 });
    // no 分支与 yes 同层，row 0 被占 → 顺延 row 1
    expect(result.grid.get('no')).toEqual({ col: 2, row: 1 });
  });

  it('孤立节点（无边）放第 0 列、深度行', () => {
    const document = doc(
      [node('lonely', CanvasNodeType.FlowStep), node('a', CanvasNodeType.FlowStep)],
      []
    );
    const result = layoutFlowByTopology(document);
    expect(result.cyclic).toEqual([]);
    expect(result.grid.get('lonely')).toEqual({ col: 0, row: 0 });
    expect(result.grid.get('a')).toEqual({ col: 0, row: 1 });
  });

  it('环内节点进入 cyclic 回退区，不阻塞其余分层', () => {
    const document = doc(
      [
        node('start', CanvasNodeType.FlowStart),
        node('end', CanvasNodeType.FlowEnd),
        node('x', CanvasNodeType.FlowStep),
        node('y', CanvasNodeType.FlowStep),
      ],
      [flow('start', 'end'), flow('x', 'y'), flow('y', 'x')]
    );
    const result = layoutFlowByTopology(document);
    expect(result.cyclic.sort()).toEqual(['x', 'y']);
    expect(result.grid.get('start')).toEqual({ col: 0, row: 0 });
    expect(result.grid.get('end')).toEqual({ col: 1, row: 0 });
  });
});
