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

  it('每个区域的原点与文档契约一致，且彼此不重叠', () => {
    // 全部区域容器必须存在且原点与契约一致（内置示例是完整画布）
    const areaContainers = new Map(
      defaultCanvasData.nodes
        .filter((node) => node.type === CanvasNodeType.Area)
        .map((group) => [group.data.title, group.meta?.position])
    );
    AREAS.forEach((area) => {
      expect(areaContainers.get(area.title), `缺少区域容器「${area.title}」`).toEqual({
        x: area.origin.x,
        y: area.origin.y,
      });
    });
    // 任意两个区域的原点间距不小于一个网格列 / 行，避免容器在视觉上贴在一起
    for (let i = 0; i < AREAS.length; i += 1) {
      for (let j = i + 1; j < AREAS.length; j += 1) {
        const gapX = Math.abs(AREAS[i].origin.x - AREAS[j].origin.x);
        const gapY = Math.abs(AREAS[i].origin.y - AREAS[j].origin.y);
        expect(gapX === 0 || gapX >= GRID_COLUMN_WIDTH).toBe(true);
        expect(gapY === 0 || gapY >= GRID_ROW_HEIGHT).toBe(true);
      }
    }
  });

  it('每个区域都有内容，且都带一个区域说明便签', () => {
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
