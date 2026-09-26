/**
 * 分享卡片（B3）：画布缩略图 + 标题 + 元信息（节点/连线/区域/日期）合成 PNG 卡片
 */

import type { FreeLayoutPluginContext } from '@flowgram.ai/free-layout-editor';

import type { FlowDocumentJSON } from '../typings';
import { themeStore } from '../theme';
import { rasterizeCanvas } from './raster';
import { downloadBlob, timestampedFilename } from './download';

const CARD_WIDTH = 1280;
const CARD_HEIGHT = 720;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('缩略图渲染失败'));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/** 生成分享卡片 PNG 并触发下载 */
export async function exportShareCard(
  ctx: FreeLayoutPluginContext,
  canvasDocument: FlowDocumentJSON
): Promise<void> {
  const thumbnail = await rasterizeCanvas(ctx, 1);
  const card = await composeShareCard(thumbnail, canvasDocument);
  downloadBlob(card, timestampedFilename('项目文档画布分享卡片', 'png'));
}

export async function composeShareCard(
  thumbnail: Blob,
  canvasDocument: FlowDocumentJSON
): Promise<Blob> {
  const preset = themeStore.getSnapshot().preset;
  const thumb = await loadImage(thumbnail);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const g = canvas.getContext('2d');
  if (!g) {
    throw new Error('无法创建画布上下文');
  }

  // 背景
  g.fillStyle = preset.canvasBg;
  g.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 标题与元信息
  const areaCount = canvasDocument.nodes.filter((node) => node.type === 'group').length;
  const meta = `${canvasDocument.nodes.length} 节点 · ${
    canvasDocument.edges.length
  } 连线 · ${areaCount} 区域 · ${new Date().toLocaleDateString('zh-CN')}`;

  g.fillStyle = preset.cardTitle;
  g.font = '600 40px "PingFang SC", "Microsoft YaHei", sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText('项目文档画布', 60, 84);

  g.fillStyle = `${preset.cardTitle}99`;
  g.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
  g.fillText(meta, 62, 124);

  // 缩略图（等比缩放居中，覆盖 60..1220 x 160..680 区域）
  const areaX = 60;
  const areaY = 160;
  const areaW = CARD_WIDTH - 120;
  const areaH = CARD_HEIGHT - areaY - 40;
  const scale = Math.min(areaW / thumb.naturalWidth, areaH / thumb.naturalHeight);
  const drawW = Math.round(thumb.naturalWidth * scale);
  const drawH = Math.round(thumb.naturalHeight * scale);
  g.drawImage(
    thumb,
    areaX + Math.round((areaW - drawW) / 2),
    areaY + Math.round((areaH - drawH) / 2),
    drawW,
    drawH
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('分享卡片生成失败'))),
      'image/png'
    );
  });
}
