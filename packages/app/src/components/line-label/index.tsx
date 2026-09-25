/**
 * 连线中点标签：展示 db-relation 的关联类型或 flow / dependency 的自定义标签
 */

import type { CanvasEdgeData } from '@monopane/canvas';
import { LineRenderProps } from '@flowgram.ai/free-lines-plugin';

export const LineLabel = (props: LineRenderProps) => {
  const { line } = props;
  const data = line.lineData as CanvasEdgeData | undefined;
  const text = data?.relation ?? data?.label;
  if (!text) {
    return <></>;
  }
  return (
    <div
      className="canvas-line-label"
      style={{
        transform: `translate(-50%, -50%) translate(${line.center.labelX}px, ${line.center.labelY}px)`,
      }}
    >
      {text}
    </div>
  );
};
