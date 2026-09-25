/**
 * 内置示例画布必须满足全部布局契约
 */

import { describe, expect, it } from 'vitest';

import { CanvasNodeType } from '../types';
import { defaultCanvasData } from '../default-canvas';
import { AREAS, GRID_COLUMN_WIDTH, GRID_ROW_HEIGHT } from '../constants';
import { collectLayoutIssues } from './invariants';

describe('内置示例画布', () => {
  it('满足 docs/canvas-schema.md 的全部布局契约', () => {
    expect(collectLayoutIssues(defaultCanvasData)).toEqual([]);
  });

  it('四个区域的原点与文档契约一致，且彼此不重叠', () => {
    expect(AREAS.map((area) => area.origin)).toEqual([
      { x: 0, y: 0 },
      { x: 5600, y: 0 },
      { x: 0, y: 5600 },
      { x: 5600, y: 5600 },
    ]);
    // 区域之间至少空出一个网格列 / 行，避免容器在视觉上贴在一起
    const [leftTop, rightTop, leftBottom] = AREAS;
    expect(rightTop.origin.x - leftTop.origin.x).toBeGreaterThanOrEqual(GRID_COLUMN_WIDTH);
    expect(leftBottom.origin.y - leftTop.origin.y).toBeGreaterThanOrEqual(GRID_ROW_HEIGHT);
  });

  it('四大区域都有内容，且都带一个区域说明便签', () => {
    const notesByArea = new Map<string, number>();
    defaultCanvasData.nodes
      .filter((node) => node.type === CanvasNodeType.Area)
      .forEach((group) => {
        const blockIDs: string[] = group.data.blockIDs;
        const notes = blockIDs.filter(
          (id) =>
            defaultCanvasData.nodes.find((node) => node.id === id)?.type === CanvasNodeType.Note
        );
        notesByArea.set(group.data.title, notes.length);
      });
    expect([...notesByArea.keys()].sort()).toEqual(AREAS.map((area) => area.title).sort());
    AREAS.forEach((area) => {
      expect(notesByArea.get(area.title) ?? 0).toBeGreaterThan(0);
    });
  });
});
