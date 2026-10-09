/**
 * 连线语义分色：按 edge kind（db-relation / dependency / flow）锁定连线颜色
 *
 * - 通过 WorkflowLineEntity.lockedColor 实现逐线着色（优先级高于主题默认色）
 * - 颜色来自当前主题预设，主题切换 / 画布内容变化后重新应用
 * - viewer 与编辑器共用：onAllLayersRendered 与 onContentChange 时调用 attach
 */

import type { CanvasEdgeData, CanvasEdgeKind } from '@monopane/canvas';
import type { FreeLayoutPluginContext } from '@flowgram.ai/free-layout-editor';

import { themeStore } from '../theme';

/** 当前绑定的画布上下文（主题切换时对该画布重新着色） */
let currentCtx: FreeLayoutPluginContext | undefined;
let unsubscribeTheme: (() => void) | undefined;

/** edge kind → 主题预设语义色（运行时取实值，跟随主题切换） */
function edgeColorMap(): Partial<Record<CanvasEdgeKind, string>> {
  const preset = themeStore.getSnapshot().preset;
  return {
    'db-relation': preset.edgeDbRelation,
    dependency: preset.edgeDependency,
    flow: preset.edgeFlow,
  };
}

/** 给当前画布的全部连线应用语义色 */
function applyToDocument(ctx: FreeLayoutPluginContext): void {
  if (ctx.document.disposed) {
    return;
  }
  const colors = edgeColorMap();
  ctx.document.linesManager.getAllLines().forEach((line) => {
    const kind = (line.lineData as CanvasEdgeData | undefined)?.kind;
    const color = kind ? colors[kind] : undefined;
    if (color) {
      line.lockedColor = color;
    }
  });
}

/**
 * 绑定画布并应用语义色：
 * - 立即着色一次；订阅主题变化，切换预设后对同一画布重新着色
 */
export function attachEdgeSemanticColors(ctx: FreeLayoutPluginContext): void {
  currentCtx = ctx;
  applyToDocument(ctx);
  if (!unsubscribeTheme) {
    unsubscribeTheme = themeStore.subscribe(() => {
      if (currentCtx && !currentCtx.document.disposed) {
        applyToDocument(currentCtx);
      }
    });
  }
}

/** 内容变化后补充着色（新增连线尚未锁定语义色时） */
export function refreshEdgeSemanticColors(ctx: FreeLayoutPluginContext): void {
  applyToDocument(ctx);
}
