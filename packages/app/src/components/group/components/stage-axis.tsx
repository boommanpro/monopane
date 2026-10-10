/**
 * 流程区阶段轴：在 group-flow 容器顶部按列渲染「阶段 N」标题
 *
 * - 列来自子节点包围盒 x 坐标去重（拓扑布局保证每列 x 唯一）
 * - 随容器一起渲染，自动跟随画布缩放平移
 * - 标签按当前 zoom 反向补偿（限制 1 ~ 2.2 倍）：总览缩小时标签在屏幕上
 *   仍保持可读，细读放大时不超过原始字号
 */

import { useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';
import { usePlayground, type WorkflowNodeEntity } from '@flowgram.ai/free-layout-editor';

const AXIS_TOP = 34;

const Axis = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: ${AXIS_TOP}px;
  height: 0;
  display: flex;
  pointer-events: none;
  z-index: 2;
`;

const StageLabel = styled.div`
  position: absolute;
  transform: translateX(-50%) scale(var(--mp-stage-scale, 1));
  transform-origin: top center;
  font-family: var(--mp-font-mono);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--mp-card-title) 80%, transparent);
  white-space: nowrap;
  padding: 2px 10px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--mp-card-bg) 88%, transparent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &::after {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-left: 7px;
    vertical-align: 1px;
    background-color: color-mix(in srgb, var(--mp-card-title) 45%, transparent);
  }
`;

/** 收集容器子节点的去重列 x（相对容器坐标），按升序返回 */
function columnCenters(node: WorkflowNodeEntity): { x: number; label: string }[] {
  const xs = new Set<number>();
  node.children?.forEach((child) => {
    const bounds = child.transform.bounds;
    if (bounds && Number.isFinite(bounds.x)) {
      xs.add(Math.round(bounds.x));
    }
  });
  return Array.from(xs)
    .sort((a, b) => a - b)
    .map((x, index) => ({ x: x + 180, label: `阶段 ${index + 1}` }));
}

export const GroupStageAxis = ({
  node,
  revision = 0,
}: {
  node: WorkflowNodeEntity;
  /** 容器宽度（上层 nodeSize），变化时触发列重算 */
  revision?: number;
}) => {
  const playground = usePlayground();
  const [zoom, setZoom] = useState(playground.config.zoom ?? 1);

  useEffect(() => {
    const disposable = playground.onZoom((value) => setZoom(value));
    return () => disposable.dispose();
  }, [playground]);

  const stages = useMemo(
    () => (node.id === 'group-flow' ? columnCenters(node) : []),
    // 列 x 来自子节点包围盒；容器宽度 / 子节点数变化时重算
    [node, node.children?.length, revision]
  );

  if (stages.length < 2) {
    return null;
  }

  // 缩小时补偿放大（屏幕字号恒定），放大超过 1:1 后不再缩小
  const scale = Math.min(Math.max(1 / zoom, 1), 2.9);

  return (
    <Axis className="workflow-group-stage-axis">
      {stages.map((stage) => (
        <StageLabel key={stage.x} style={{ left: stage.x, ['--mp-stage-scale' as string]: scale }}>
          {stage.label}
        </StageLabel>
      ))}
    </Axis>
  );
};
