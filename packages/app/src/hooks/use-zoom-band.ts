/**
 * 阅读深度（zoom band）：缩放分档控制节点信息密度
 *
 * - map（< 0.45）：概览模式，仅保留卡片标题（描述 / 字段列表 / 标签隐藏）
 * - read（0.45 – 1.4）：默认阅读档，标题 + 徽标 + 描述
 * - full（≥ 1.4）：细读档，全部内容（字段列表等）
 *
 * 通过给 .demo-container 设置 data-zoom-band 属性驱动 CSS 显隐，
 * 需要挂载在 FreeLayoutEditorProvider 内部
 */

import { useEffect } from 'react';

import { useClientContext } from '@flowgram.ai/free-layout-editor';

export type ZoomBand = 'map' | 'read' | 'full';

export function bandOf(zoom: number): ZoomBand {
  if (zoom < 0.45) {
    return 'map';
  }
  return zoom >= 1.4 ? 'full' : 'read';
}

export function useZoomBand(): void {
  const ctx = useClientContext();

  useEffect(() => {
    const apply = (zoom: number) => {
      const band = bandOf(zoom);
      document
        .querySelectorAll('.demo-container')
        .forEach((el) => el.setAttribute('data-zoom-band', band));
    };
    apply(ctx.playground.config.zoom ?? 1);
    const disposable = ctx.playground.onZoom((zoom) => apply(zoom));
    return () => disposable.dispose();
  }, [ctx]);
}
