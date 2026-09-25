/**
 * examples/ 下的真实产物必须满足与内置示例同样的契约
 *
 * 这些文件是解析 Skill 对真实仓库跑出来的结果，作为端到端回归样本保留。
 */

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { validateCanvasFile } from '../validate';
import { type CanvasDocumentJSON } from '../document';
import { collectLayoutIssues } from './invariants';

const EXAMPLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../examples');

const exampleFiles = readdirSync(EXAMPLES_DIR).filter((name) => name.endsWith('.json'));

describe('examples/ 产物', () => {
  it('至少保留一份真实仓库的产物样本', () => {
    expect(exampleFiles.length).toBeGreaterThan(0);
  });

  it.each(exampleFiles)('%s 通过 Schema 校验', (name) => {
    const raw = JSON.parse(readFileSync(join(EXAMPLES_DIR, name), 'utf8'));
    const result = validateCanvasFile(raw);
    expect(result.ok, result.ok ? '' : result.message).toBe(true);
  });

  it.each(exampleFiles)('%s 满足布局契约', (name) => {
    const document = JSON.parse(
      readFileSync(join(EXAMPLES_DIR, name), 'utf8')
    ) as CanvasDocumentJSON;
    expect(collectLayoutIssues(document)).toEqual([]);
  });
});
