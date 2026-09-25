/**
 * 画布文档的浏览器端持久化
 *
 * 校验与序列化逻辑在 `@monopane/canvas`（框架无关，可在 Node 侧复用），
 * 本文件只负责 localStorage 读写与内置示例的深拷贝。
 */

import { defaultCanvasData, validateCanvasFile, wrapCanvasFile } from '@monopane/canvas';

import type { FlowDocumentJSON } from '../typings';

const STORAGE_KEY = 'monopane-canvas-doc-v1';

/**
 * 内置示例画布（深拷贝，避免被编辑污染）
 *
 * 示例数据来自框架无关的 canvas 包，这里是跨包的类型边界。
 */
export function getDefaultCanvasDocument(): FlowDocumentJSON {
  return JSON.parse(JSON.stringify(defaultCanvasData)) as FlowDocumentJSON;
}

/**
 * 读取画布文档：优先 localStorage 缓存，缓存损坏时回退内置示例
 */
export function loadCanvasDocument(): FlowDocumentJSON {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const result = validateCanvasFile(JSON.parse(cached));
      if (result.ok) {
        return result.document as FlowDocumentJSON;
      }
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultCanvasDocument();
}

/**
 * 暂存画布文档
 */
export function saveCanvasDocument(document: FlowDocumentJSON): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapCanvasFile(document)));
  } catch {
    // 忽略本地暂存失败（隐私模式、超配额等），不影响编辑
  }
}

/**
 * 清除本地暂存
 */
export function clearCanvasDocument(): void {
  localStorage.removeItem(STORAGE_KEY);
}
