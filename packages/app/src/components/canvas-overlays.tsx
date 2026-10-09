/**
 * 画布内叠加层（需 FreeLayoutEditorProvider 上下文）：
 * - 阅读深度分档（data-zoom-band）
 * - 左下角图例（类型过滤）
 * - ? 键阅读指南
 */

import { useZoomBand } from '../hooks/use-zoom-band';
import { CanvasLegend } from './legend';
import { HelpOverlay } from './help-overlay';

export const CanvasOverlays = ({ readonly = false }: { readonly?: boolean }) => {
  useZoomBand();
  return (
    <>
      <CanvasLegend />
      <HelpOverlay readonly={readonly} />
    </>
  );
};
