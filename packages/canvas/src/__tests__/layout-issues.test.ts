/**
 * 布局不变量检查（layout-issues）：
 * 区域按容器 slot id 识别，标题/配色允许自定义（产品文档模式）。
 */

import { describe, expect, it } from 'vitest';

import type { CanvasDocumentJSON, CanvasNodeJSON } from '../document';
import { collectLayoutIssues } from './invariants';

const groupNode = (
  id: string,
  blockIDs: string[],
  title: string,
  position: { x: number; y: number }
): CanvasNodeJSON => ({
  id,
  type: 'group',
  meta: { position },
  data: { parentID: 'root', title, color: 'Blue', blockIDs },
});

const node = (
  id: string,
  type = 'flow-step',
  position = { x: 0, y: 0 },
  extra: Record<string, unknown> = {}
): CanvasNodeJSON => ({
  id,
  type,
  meta: { position },
  data: { title: id, category: 'service', ...extra },
});

describe('collectLayoutIssues 区域识别', () => {
  it('区域按 slot id 识别，自定义标题不报错', () => {
    const doc: CanvasDocumentJSON = {
      nodes: [
        groupNode('group-arch', ['arch-a', 'arch-b'], '能做什么', { x: 5600, y: 0 }),
        node('arch-a', 'arch-component'),
        node('arch-b', 'arch-component', { x: 460, y: 0 }),
      ],
      edges: [],
    };
    expect(collectLayoutIssues(doc)).toEqual([]);
  });

  it('未知区域容器 id 被报告', () => {
    const doc: CanvasDocumentJSON = {
      nodes: [groupNode('group-fake', ['a'], '自定义区域', { x: 0, y: 0 }), node('a')],
      edges: [],
    };
    const issues = collectLayoutIssues(doc);
    expect(issues.some((issue) => issue.includes('未知区域容器 id「group-fake」'))).toBe(true);
  });

  it('不要求全部区域都存在，只有出现的区域会被校验', () => {
    const doc: CanvasDocumentJSON = {
      nodes: [
        groupNode('group-db', ['db-a'], '数据库结构与关联', { x: 0, y: 0 }),
        node('db-a', 'db-table', { x: 0, y: 0 }, { fields: [{ name: 'id', type: 'bigint' }] }),
        groupNode('group-flow', ['flow-s'], '代码流程', { x: 0, y: 5600 }),
        node('flow-s', 'flow-start', { x: 0, y: 0 }),
      ],
      edges: [],
    };
    // 缺少 group-arch / group-runtime / group-seq / group-df 不报错
    expect(collectLayoutIssues(doc)).toEqual([]);
  });

  it('每个区域至多一个 flow-start（自定义标题时仍按 slot 计数）', () => {
    const doc: CanvasDocumentJSON = {
      nodes: [
        groupNode('group-flow', ['flow-s1', 'flow-s2'], '整体流程', { x: 0, y: 5600 }),
        node('flow-s1', 'flow-start'),
        node('flow-s2', 'flow-start', { x: 460, y: 0 }),
      ],
      edges: [],
    };
    const issues = collectLayoutIssues(doc);
    expect(issues.some((issue) => issue.includes('区域「整体流程」放了多个 flow-start'))).toBe(
      true
    );
  });
});
