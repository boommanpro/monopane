/**
 * 流程模拟的遍历规则
 */

import { describe, expect, it } from 'vitest';

import { CanvasNodeType } from '../types';
import { findFlowStarts, indexFlowOutEdges, pickNextFlowEdges } from '../simulation';
import type { CanvasEdgeJSON, CanvasNodeJSON } from '../document';

const node = (id: string, type: string, data: Record<string, unknown> = {}): CanvasNodeJSON => ({
  id,
  type,
  data,
});

const edge = (
  sourceNodeID: string,
  targetNodeID: string,
  data?: CanvasEdgeJSON['data'],
  sourcePortID?: string
): CanvasEdgeJSON => ({ sourceNodeID, targetNodeID, data, sourcePortID });

describe('findFlowStarts', () => {
  it('只识别 flow-start 节点', () => {
    const starts = findFlowStarts([
      node('a', CanvasNodeType.FlowStep),
      node('b', CanvasNodeType.FlowStart),
      node('c', CanvasNodeType.FlowEnd),
      node('d', CanvasNodeType.FlowStart),
    ]);
    expect(starts.map((item) => item.id)).toEqual(['b', 'd']);
  });

  it('没有起点时返回空数组', () => {
    expect(findFlowStarts([node('a', CanvasNodeType.FlowStep)])).toEqual([]);
  });
});

describe('indexFlowOutEdges', () => {
  it('只索引 flow 语义的连线（缺省 kind 视为 flow）', () => {
    const out = indexFlowOutEdges([
      edge('a', 'b', { kind: 'flow' }),
      edge('a', 'c'),
      edge('c', 'd', { kind: 'dependency' }),
      edge('d', 'e', { kind: 'db-relation', relation: '1:N' }),
    ]);
    expect(out.get('a')?.map((item) => item.targetNodeID)).toEqual(['b', 'c']);
    expect(out.has('c')).toBe(false);
    expect(out.has('d')).toBe(false);
  });
});

describe('pickNextFlowEdges', () => {
  const yesEdge = edge('d', 'yes-target', { kind: 'flow', branch: 'yes' }, 'yes');
  const noEdge = edge('d', 'no-target', { kind: 'flow', branch: 'no' }, 'no');

  it('普通节点走全部出边（并行分支）', () => {
    const edges = [yesEdge, noEdge];
    expect(pickNextFlowEdges(node('s', CanvasNodeType.FlowStep), edges)).toBe(edges);
  });

  it('判断节点按 defaultBranch 选分支', () => {
    expect(
      pickNextFlowEdges(node('d', CanvasNodeType.FlowDecision, { defaultBranch: 'no' }), [
        yesEdge,
        noEdge,
      ]).map((item) => item.targetNodeID)
    ).toEqual(['no-target']);
  });

  it('判断节点未标注 defaultBranch 时按 yes 兜底', () => {
    expect(
      pickNextFlowEdges(node('d', CanvasNodeType.FlowDecision), [yesEdge, noEdge]).map(
        (item) => item.targetNodeID
      )
    ).toEqual(['yes-target']);
  });

  it('分支连线缺失时退回第一条出边，避免模拟中断', () => {
    const fallback = edge('d', 'only-target', { kind: 'flow', branch: 'no' }, 'no');
    expect(
      pickNextFlowEdges(node('d', CanvasNodeType.FlowDecision, { defaultBranch: 'yes' }), [
        fallback,
      ])
    ).toEqual([fallback]);
  });

  it('没有出边或节点不存在时返回空数组', () => {
    expect(pickNextFlowEdges(node('s', CanvasNodeType.FlowStep), undefined)).toEqual([]);
    expect(pickNextFlowEdges(node('s', CanvasNodeType.FlowStep), [])).toEqual([]);
    expect(pickNextFlowEdges(undefined, [yesEdge])).toEqual([yesEdge]);
  });
});
