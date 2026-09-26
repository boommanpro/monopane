/**
 * PNG 栅格导出（B2）：把矢量 SVG 渲染到离屏画布，支持任意倍率与复制到剪贴板。
 *
 * 与 SVG 导出共用 buildCanvasSvg，保证 PNG / SVG / 分享卡片三种产物视觉一致。
 */

import type { FreeLayoutPluginContext } from '@flowgram.ai/free-layout-editor';

import { buildCanvasSvg } from './svg';
import { downloadBlob, timestampedFilename } from './download';

/** 把当前画布渲染为 PNG Blob，scale 为倍率（1 = 原始尺寸） */
export async function rasterizeCanvas(ctx: FreeLayoutPluginContext, scale = 2): Promise<Blob> {
  const svg = buildCanvasSvg(ctx);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  let image: HTMLImageElement;
  try {
    image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('SVG 渲染失败'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('无法创建画布上下文');
  }
  context.scale(scale, scale);
  context.drawImage(image, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG 生成失败'))),
      'image/png'
    );
  });
}

/** 下载指定倍率的 PNG */
export async function exportCanvasPng(ctx: FreeLayoutPluginContext, scale = 2): Promise<void> {
  const blob = await rasterizeCanvas(ctx, scale);
  downloadBlob(blob, timestampedFilename('项目文档画布', 'png'));
}

/** 复制 PNG 到系统剪贴板 */
export async function copyCanvasPng(ctx: FreeLayoutPluginContext, scale = 2): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard) {
    throw new Error('当前浏览器不支持剪贴板写入');
  }
  const blob = await rasterizeCanvas(ctx, scale);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
