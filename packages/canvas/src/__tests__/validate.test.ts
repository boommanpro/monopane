/**
 * Schema 校验与序列化
 */

import { describe, expect, it } from 'vitest';

import { serializeCanvas, validateCanvasFile, wrapCanvasFile } from '../validate';
import { CANVAS_SCHEMA_VERSION, CanvasNodeType } from '../types';
import { defaultCanvasData } from '../default-canvas';

const minimalDocument = {
  nodes: [
    {
      id: 'group-db',
      type: CanvasNodeType.Area,
      meta: { position: { x: 0, y: 0 } },
      data: { title: '数据库结构与关联', color: 'Blue', blockIDs: ['db-user'] },
    },
    {
      id: 'db-user',
      type: CanvasNodeType.DbTable,
      meta: { position: { x: 0, y: 0 } },
      data: { title: 'user', fields: [{ name: 'id', type: 'bigint' }] },
    },
  ],
  edges: [],
};

describe('validateCanvasFile', () => {
  it('接受没有 schemaVersion 的裸文档', () => {
    const result = validateCanvasFile(minimalDocument);
    expect(result.ok).toBe(true);
  });

  it('接受 1.x 的 schemaVersion', () => {
    const result = validateCanvasFile({ ...minimalDocument, schemaVersion: '1.0' });
    expect(result.ok).toBe(true);
  });

  it('拒绝不兼容的 schemaVersion', () => {
    const result = validateCanvasFile({ ...minimalDocument, schemaVersion: '2.0' });
    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining('与当前应用'),
    });
  });

  it('拒绝非对象、缺少 nodes、edges 非数组', () => {
    expect(validateCanvasFile(null).ok).toBe(false);
    expect(validateCanvasFile('{}').ok).toBe(false);
    expect(validateCanvasFile({}).ok).toBe(false);
    expect(validateCanvasFile({ nodes: [], edges: {} }).ok).toBe(false);
  });

  it('拒绝缺少 id / type 或类型不受支持的节点', () => {
    expect(validateCanvasFile({ nodes: [{ type: 'note' }] })).toEqual({
      ok: false,
      message: '第 1 个节点缺少 id 或 type',
    });
    expect(validateCanvasFile({ nodes: [{ id: 'x', type: 'unknown-node' }] })).toEqual({
      ok: false,
      message: '第 1 个节点类型 "unknown-node" 不受支持',
    });
  });

  it('edges 缺省时补为空数组', () => {
    const result = validateCanvasFile({ nodes: [] });
    expect(result.ok && result.document.edges).toEqual([]);
  });
});

describe('wrapCanvasFile / serializeCanvas', () => {
  it('包装时补上当前 schemaVersion', () => {
    expect(wrapCanvasFile(minimalDocument).schemaVersion).toBe(CANVAS_SCHEMA_VERSION);
  });

  it('序列化结果可被反序列化回等价文档（JSON 往返）', () => {
    const content = serializeCanvas(defaultCanvasData);
    const parsed = JSON.parse(content);
    expect(parsed.schemaVersion).toBe(CANVAS_SCHEMA_VERSION);

    const validated = validateCanvasFile(parsed);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    // 往返后节点与连线数量、顺序、内容都保持一致
    expect(validated.document.nodes).toEqual(defaultCanvasData.nodes);
    expect(validated.document.edges).toEqual(defaultCanvasData.edges);
  });

  it('序列化结果带缩进，便于人工 review', () => {
    expect(serializeCanvas(minimalDocument)).toContain('\n  "nodes"');
  });
});
