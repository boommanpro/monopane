/**
 * 连线中点标签：展示 db-relation 的关联类型或 flow / dependency 的自定义标签。
 * 标签文字色跟随连线语义色（db-relation 琥珀 / dependency 紫 / flow 绿），
 * 配白底垫与等宽字体，保证交叉处可读。
 */

import type { CanvasEdgeData } from '@monopane/canvas';
import { LineRenderProps } from '@flowgram.ai/free-lines-plugin';

/** edge kind → CSS 变量（与主题预设联动） */
const EDGE_LABEL_COLOR: Record<string, string> = {
  'db-relation': 'var(--mp-edge-db-relation)',
  dependency: 'var(--mp-edge-dependency)',
  flow: 'var(--mp-edge-flow)',
};

export const LineLabel = (props: LineRenderProps) => {
  const { line } = props;
  const data = line.lineData as CanvasEdgeData | undefined;
  const text = data?.relation ?? data?.label;
  if (!text) {
    return <></>;
  }
  const color = (data?.kind && EDGE_LABEL_COLOR[data.kind]) || 'var(--mp-card-title)';
  return (
    <div
      className="canvas-line-label"
      style={
        {
          transform: `translate(-50%, -50%) translate(${line.center.labelX}px, ${line.center.labelY}px)`,
          '--mp-label-color': color,
        } as React.CSSProperties
      }
    >
      {text}
    </div>
  );
};
