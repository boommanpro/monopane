/**
 * 导出可离线双击打开的单体 HTML
 *
 * 原理：取 viewer 构建产物模板（JS/CSS 已内联），把其中的占位脚本
 * `window.__CANVAS_DATA__ = null;` 替换为真实画布数据，得到一个自包含文件。
 */

import { wrapCanvasFile } from '@monopane/canvas';

import type { FlowDocumentJSON } from '../typings';
import { downloadBlob, timestampedFilename } from './download';

/** 模板文件的访问地址（public 目录，dev 与 build 均可访问） */
const TEMPLATE_URL = 'viewer-template.html';

/** 与 scripts/build-viewer-template.mjs 约定的占位标记 */
const DATA_PLACEHOLDER = 'window.__CANVAS_DATA__ = null;';

export async function exportCanvasHtml(
  document: FlowDocumentJSON,
  filename?: string
): Promise<void> {
  const response = await fetch(TEMPLATE_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(
      '未找到离线预览模板，请先执行 `pnpm --filter @monopane/app build:viewer` 生成模板'
    );
  }
  const template = await response.text();
  if (!template.includes(DATA_PLACEHOLDER)) {
    throw new Error(
      '离线预览模板格式不正确，请重新执行 `pnpm --filter @monopane/app build:viewer`'
    );
  }
  const payload = JSON.stringify(wrapCanvasFile(document)).replace(/</g, '\\u003c');
  /**
   * 用函数形式替换：数据里可能包含 $& / $' 等字符，直接传字符串会被当成替换模式
   */
  const html = template.replace(DATA_PLACEHOLDER, () => `window.__CANVAS_DATA__ = ${payload};`);
  downloadBlob(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    filename ?? timestampedFilename('项目文档画布', 'html')
  );
}
