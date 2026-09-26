/**
 * 分区视图（内容类型 Tab）的切片与合并
 */

import { describe, expect, it } from 'vitest';

import type { CanvasDocumentJSON, CanvasEdgeJSON, CanvasNodeJSON } from '../document';
import { defaultCanvasData } from '../default-canvas';
import { filterDocumentToArea, listAreaSummaries, mergeAreaSlice } from '../area-view';

const groupNode = (id: string, blockIDs: string[]): CanvasNodeJSON => ({
  id,
  type: 'group',
  data: { title: id, blockIDs },
});

const node = (id: string, type = 'flow-step'): CanvasNodeJSON => ({
  id,
  type,
  data: { title: id },
});

const edge = (sourceNodeID: string, targetNodeID: string): CanvasEdgeJSON => ({
  sourceNodeID,
  targetNodeID,
});

/** 两个区域 + 若干散置节点的最小文档 */
function buildDocument(): CanvasDocumentJSON {
  return {
    nodes: [
      groupNode('group-db', ['db-a', 'db-b']),
      node('db-a', 'db-table'),
      node('db-b', 'db-table'),
      groupNode('group-flow', ['flow-s', 'flow-e']),
      node('flow-s', 'flow-start'),
      node('flow-e', 'flow-end'),
      node('stray'),
    ],
    edges: [edge('db-a', 'db-b'), edge('flow-s', 'flow-e'), edge('stray', 'db-a')],
  };
}

describe('listAreaSummaries', () => {
  it('只返回有内容的区域，且按 AREAS 顺序', () => {
    const summaries = listAreaSummaries(buildDocument());
    expect(summaries.map((item) => item.areaId)).toEqual(['group-db', 'group-flow']);
    expect(summaries[0].nodeCount).toBe(2);
  });

  it('内置示例所有区域都有内容', () => {
    expect(listAreaSummaries(defaultCanvasData).map((item) => item.areaId)).toEqual([
      'group-db',
      'group-arch',
      'group-flow',
      'group-runtime',
      'group-seq',
      'group-df',
    ]);
  });

  it('blockIDs 引用的节点缺失时不计入数量', () => {
    const doc: CanvasDocumentJSON = {
      nodes: [groupNode('group-db', ['missing', 'db-a']), node('db-a', 'db-table')],
      edges: [],
    };
    expect(listAreaSummaries(doc)[0].nodeCount).toBe(1);
  });
});

describe('filterDocumentToArea', () => {
  it('只保留目标区域容器、子节点、散置节点与内部连线', () => {
    const view = filterDocumentToArea(buildDocument(), 'group-db');
    expect(view.nodes.map((item) => item.id).sort()).toEqual(['db-a', 'db-b', 'group-db', 'stray']);
    expect(view.edges).toEqual([edge('db-a', 'db-b'), edge('stray', 'db-a')]);
  });

  it('其他区域的成员不会出现在视图里', () => {
    const view = filterDocumentToArea(defaultCanvasData, 'group-db');
    const ids = new Set(view.nodes.map((item) => item.id));
    expect(ids.has('group-db')).toBe(true);
    expect(ids.has('db-user')).toBe(true);
    expect(ids.has('group-arch')).toBe(false);
    expect(ids.has('arch-web')).toBe(false);
    // 连线两端都必须在视图内
    view.edges.forEach((item) => {
      expect(ids.has(item.sourceNodeID)).toBe(true);
      expect(ids.has(item.targetNodeID)).toBe(true);
    });
  });
});

describe('mergeAreaSlice', () => {
  it('视图中的修改合并回完整文档，其他区域原样保留', () => {
    const full = buildDocument();
    const view = filterDocumentToArea(full, 'group-db');
    // 模拟编辑：db-b 改标题、新增 db-c
    view.nodes[2].data.title = '改名后的 db-b';
    view.nodes.push(node('db-c', 'db-table'));
    view.edges.push(edge('db-a', 'db-c'));

    const merged = mergeAreaSlice(full, 'group-db', view);
    const byId = new Map(merged.nodes.map((item) => [item.id, item]));
    expect(byId.get('db-b')?.data.title).toBe('改名后的 db-b');
    expect(byId.has('db-c')).toBe(true);
    expect(byId.has('group-flow')).toBe(true);
    expect(byId.has('flow-s')).toBe(true);
    expect(merged.edges).toContainEqual(edge('flow-s', 'flow-e'));
    expect(merged.edges).toContainEqual(edge('db-a', 'db-c'));
  });

  it('视图中删除的节点不会从完整文档复活', () => {
    const full = buildDocument();
    const view = filterDocumentToArea(full, 'group-db');
    // 模拟删除 db-b（同时从容器的 blockIDs 里移除）
    view.nodes = view.nodes.filter((item) => item.id !== 'db-b');
    const group = view.nodes.find((item) => item.id === 'group-db')!;
    group.data.blockIDs = ['db-a'];

    const merged = mergeAreaSlice(full, 'group-db', view);
    expect(merged.nodes.map((item) => item.id)).not.toContain('db-b');
    // 其他区域不受影响
    expect(merged.nodes.map((item) => item.id)).toContain('flow-s');
  });

  it('视图中删除的散置节点同样不复活', () => {
    const full = buildDocument();
    const view = filterDocumentToArea(full, 'group-db');
    view.nodes = view.nodes.filter((item) => item.id !== 'stray');
    view.edges = view.edges.filter((item) => item.sourceNodeID !== 'stray');

    const merged = mergeAreaSlice(full, 'group-db', view);
    expect(merged.nodes.map((item) => item.id)).not.toContain('stray');
  });

  it('视图内被删除的连线不会从完整文档复活', () => {
    const full = buildDocument();
    const view = filterDocumentToArea(full, 'group-db');
    view.edges = view.edges.filter((item) => item.sourceNodeID !== 'db-a');

    const merged = mergeAreaSlice(full, 'group-db', view);
    expect(merged.edges).not.toContainEqual(edge('db-a', 'db-b'));
    // 跨到散置节点的连线两端都在，保留
    expect(merged.edges).toContainEqual(edge('stray', 'db-a'));
  });

  it('先过滤再合并是幂等的', () => {
    const full = defaultCanvasData;
    const view = filterDocumentToArea(full, 'group-flow');
    const merged = mergeAreaSlice(full, 'group-flow', view);
    expect(merged.nodes.map((item) => item.id).sort()).toEqual(
      full.nodes.map((item) => item.id).sort()
    );
    const keyOf = (item: CanvasEdgeJSON) => `${item.sourceNodeID}->${item.targetNodeID}`;
    expect(merged.edges.map(keyOf).sort()).toEqual(full.edges.map(keyOf).sort());
  });
});
