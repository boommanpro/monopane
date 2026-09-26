/**
 * SVG 矢量导出：把当前视图渲染为纯矢量内联 SVG（路径 + 文本，可被 Illustrator 等工具编辑）
 *
 * 与 PNG 导出一致，基于当前视图的实时画布实体取精确的节点边界，
 * 颜色取当前主题预设的具体值（SVG 不使用 CSS 变量，保证独立可看）。
 */

import { CanvasNodeType, type CanvasEdgeData } from '@monopane/canvas';
import {
  FlowNodeFormData,
  FlowNodeTransformData,
  type FormModelV2,
  type FreeLayoutPluginContext,
  type WorkflowLineEntity,
  type WorkflowNodeEntity,
} from '@flowgram.ai/free-layout-editor';

import { themeStore } from '../theme';
import { nodeRegistries } from '../nodes';
import { downloadBlob, timestampedFilename } from './download';

/** 导出画布 SVG 并触发下载 */
export function exportCanvasSvg(ctx: FreeLayoutPluginContext): void {
  const content = buildCanvasSvg(ctx);
  downloadBlob(
    new Blob([content], { type: 'image/svg+xml;charset=utf-8' }),
    timestampedFilename('项目文档画布', 'svg')
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 截断长文本，保留省略号 */
function clampText(value: unknown, max = 22): string {
  const text = String(value ?? '').trim() || '未命名';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function buildCanvasSvg(ctx: FreeLayoutPluginContext): string {
  const preset = themeStore.getSnapshot().preset;
  const nodes: WorkflowNodeEntity[] = ctx.document.getAssociatedNodes();
  const lines: WorkflowLineEntity[] = ctx.document.linesManager.getAllLines();

  const boundsOf = (node: WorkflowNodeEntity): Bounds | undefined => {
    const bounds = node.getData(FlowNodeTransformData).bounds;
    return bounds && bounds.width > 0 && bounds.height > 0 ? bounds : undefined;
  };

  const titleOf = (node: WorkflowNodeEntity): string =>
    String(node.getData(FlowNodeFormData).getFormModel<FormModelV2>()?.getValueIn?.('title') ?? '');

  const registryByType = new Map(nodeRegistries.map((registry) => [registry.type, registry]));

  /** 收集全部节点边界，计算整幅范围（含 60px 留白） */
  const boxes: { bounds: Bounds; node: WorkflowNodeEntity }[] = [];
  nodes.forEach((node) => {
    const bounds = boundsOf(node);
    if (bounds) {
      boxes.push({ bounds, node });
    }
  });
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  boxes.forEach(({ bounds }) => {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  if (boxes.length === 0) {
    return '';
  }
  const pad = 60;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;

  /** 世界坐标 → SVG 画布坐标 */
  const px = (x: number) => x - minX;
  const py = (y: number) => y - minY;

  /** 渲染单个节点 */
  const renderNode = (bounds: Bounds, node: WorkflowNodeEntity): string => {
    const x = px(bounds.x);
    const y = py(bounds.y);
    const w = bounds.width;
    const h = bounds.height;
    const title = escapeXml(clampText(titleOf(node)));

    // 便签：黄色虚线框 + 文本
    if (node.flowNodeType === CanvasNodeType.Note) {
      return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${preset.noteBg}" stroke="${
        preset.noteOutline
      }" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="${x + 10}" y="${y + h / 2 + 4}" font-size="12" fill="${
        preset.cardTitle
      }" font-family="PingFang SC, Microsoft YaHei, sans-serif">${title}</text>`;
    }

    // 区域容器：虚线外框 + 左上角标题
    if (node.flowNodeType === CanvasNodeType.Area) {
      return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${
        preset.lineDefault
      }" stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="6 4"/>
      <text x="${x + 14}" y="${y + 22}" font-size="13" font-weight="600" fill="${
        preset.cardTitle
      }" font-family="PingFang SC, Microsoft YaHei, sans-serif">${title}</text>`;
    }

    // 普通卡片：圆角矩形 + 左侧强调色条 + 标题
    const accent = registryByType.get(node.flowNodeType)?.info?.accent ?? preset.selection;
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${preset.cardBg}" stroke="${
      preset.cardBorder
    }" stroke-width="1"/>
      <rect x="${x}" y="${y}" width="4" height="${h}" rx="2" fill="${accent}"/>
      <text x="${x + 14}" y="${y + h / 2 + 4}" font-size="13" font-weight="600" fill="${
      preset.cardTitle
    }" font-family="PingFang SC, Microsoft YaHei, sans-serif">${title}</text>`;
  };

  /** 渲染连线：横向或纵向的三阶贝塞尔 */
  const renderLine = (line: WorkflowLineEntity): string => {
    const from = line.from ? boundsOf(line.from) : undefined;
    const to = line.to ? boundsOf(line.to) : undefined;
    if (!from || !to) {
      return '';
    }
    const sx = px(from.x + from.width / 2);
    const sy = py(from.y + from.height / 2);
    const tx = px(to.x + to.width / 2);
    const ty = py(to.y + to.height / 2);
    const dx = tx - sx;
    const dy = ty - sy;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const c = (horizontal ? dx : dy) * 0.5;
    const d = horizontal
      ? `M ${sx} ${sy} C ${sx + c} ${sy}, ${tx - c} ${ty}, ${tx} ${ty}`
      : `M ${sx} ${sy} C ${sx} ${sy + c}, ${tx} ${ty - c}, ${tx} ${ty}`;

    const data = line.lineData as CanvasEdgeData | undefined;
    const label = data?.relation ?? data?.label;
    const labelPart = label
      ? (() => {
          const text = escapeXml(String(label));
          const labelX = px(line.center.labelX);
          const labelY = py(line.center.labelY);
          const textWidth = text.length * 7 + 12;
          return `
      <rect x="${labelX - textWidth / 2}" y="${
            labelY - 9
          }" width="${textWidth}" height="18" rx="4" fill="${preset.cardBg}" stroke="${
            preset.cardBorder
          }" stroke-width="1"/>
      <text x="${labelX}" y="${labelY + 3}" text-anchor="middle" font-size="11" fill="${
            preset.cardTitle
          }" font-family="PingFang SC, Microsoft YaHei, sans-serif">${text}</text>`;
        })()
      : '';

    return `
      <path d="${d}" fill="none" stroke="${preset.lineDefault}" stroke-width="1.5" stroke-linecap="round"/>${labelPart}`;
  };

  const nodeParts = boxes.map(({ bounds, node }) => renderNode(bounds, node)).join('');
  const lineParts = lines.map(renderLine).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(maxX - minX)}" height="${Math.round(
    maxY - minY
  )}" viewBox="0 0 ${Math.round(maxX - minX)} ${Math.round(maxY - minY)}">
  <rect x="0" y="0" width="${Math.round(maxX - minX)}" height="${Math.round(maxY - minY)}" fill="${
    preset.canvasBg
  }"/>
  ${lineParts}
  ${nodeParts}
</svg>`;
}
