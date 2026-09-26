/**
 * 探索算法（graph.ts）单元测试
 */

import { describe, expect, it } from 'vitest';

import {
  collectReachability,
  findFlowLayerOrder,
  findPathBetween,
  type CanvasDocumentJSON,
} from '../index';

const DOC: CanvasDocumentJSON = {
  nodes: [
    { id: 'start', type: 'flow-start', data: {} },
    { id: 'a', type: 'node', data: {} },
    { id: 'b', type: 'node', data: {} },
    { id: 'c', type: 'node', data: {} },
    { id: 'end', type: 'flow-end', data: {} },
    { id: 'isolated', type: 'node', data: {} },
  ],
  edges: [
    { sourceNodeID: 'start', targetNodeID: 'a' },
    { sourceNodeID: 'a', targetNodeID: 'b' },
    { sourceNodeID: 'a', targetNodeID: 'c' },
    { sourceNodeID: 'c', targetNodeID: 'b' },
    { sourceNodeID: 'b', targetNodeID: 'end' },
  ],
};

describe('collectReachability', () => {
  it('收集下游全部可达节点与边', () => {
    const result = collectReachability(DOC, 'a', 'downstream');
    expect(result.nodeIds.sort()).toEqual(['b', 'c', 'end']);
    expect(result.edgeKeys).toContain('a->b');
    expect(result.edgeKeys).toContain('a->c');
    expect(result.edgeKeys).toContain('c->b');
    expect(result.edgeKeys).toContain('b->end');
  });

  it('收集上游全部可达节点与边', () => {
    const result = collectReachability(DOC, 'end', 'upstream');
    expect(result.nodeIds.sort()).toEqual(['a', 'b', 'c', 'start']);
    expect(result.edgeKeys).toContain('start->a');
    expect(result.edgeKeys).toContain('c->b');
  });

  it('环安全：不会重复收集', () => {
    const result = collectReachability(DOC, 'a', 'downstream');
    expect(new Set(result.nodeIds).size).toBe(result.nodeIds.length);
  });

  it('孤立节点无上下游', () => {
    expect(collectReachability(DOC, 'isolated', 'downstream').nodeIds).toEqual([]);
    expect(collectReachability(DOC, 'isolated', 'upstream').nodeIds).toEqual([]);
  });
});

describe('findPathBetween', () => {
  it('找到最短有向路径', () => {
    const path = findPathBetween(DOC, 'start', 'end');
    expect(path?.nodeIds).toEqual(['start', 'a', 'b', 'end']);
    expect(path?.edgeKeys).toEqual(['start->a', 'a->b', 'b->end']);
  });

  it('起点与终点相同返回单节点路径', () => {
    expect(findPathBetween(DOC, 'a', 'a')).toEqual({ nodeIds: ['a'], edgeKeys: [] });
  });

  it('终点不可达时返回 null', () => {
    expect(findPathBetween(DOC, 'end', 'start')).toBeNull();
  });
});

describe('findFlowLayerOrder', () => {
  it('从 flow-start 按层推进', () => {
    const steps = findFlowLayerOrder(DOC);
    expect(steps.map((s) => s.nodeIds)).toEqual([['a'], ['b', 'c'], ['end']]);
  });

  it('没有 flow-start 时返回空', () => {
    const noStart: CanvasDocumentJSON = {
      nodes: [{ id: 'x', type: 'node', data: {} }],
      edges: [],
    };
    expect(findFlowLayerOrder(noStart)).toEqual([]);
  });
});
