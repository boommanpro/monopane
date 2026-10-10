/**
 * 画布图例（左下角）：色点 + 名称 + 计数徽章
 *
 * - 按节点类型统计；架构组件按 category 细分（前端 / 网关 / 业务服务…）
 * - 点击图例项过滤：非该类节点淡化，再次点击恢复
 * - 需要挂载在 FreeLayoutEditorProvider 内部（读取画布 document）
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import styled from 'styled-components';
import { CanvasNodeType } from '@monopane/canvas';
import { useClientContext } from '@flowgram.ai/free-layout-editor';

import { canvasReadyStore } from '../../services/canvas-ready-store';
import { legendKeyOf, resolveNodeAccent } from '../../nodes/shared/accent';
import { ARCH_CATEGORIES } from '../../nodes/arch-component';
import { nodeRegistries } from '../../nodes';

interface LegendItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

const LegendWrap = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  max-width: min(680px, calc(100% - 200px));
  padding: 8px 12px;
  border-radius: 10px;
  background-color: var(--mp-toolbar-bg);
  border: 1px solid var(--mp-toolbar-border);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  font-family: var(--mp-font-mono);
`;

const LegendTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--semi-color-text-2);
  margin-right: 2px;
`;

const LegendItemBtn = styled.button<{ $active: boolean; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.$active ? props.$color : 'transparent')};
  background-color: ${(props) => (props.$active ? `${props.$color}14` : 'transparent')};
  font-size: 11px;
  line-height: 16px;
  color: var(--mp-card-title);
  cursor: pointer;

  &:hover {
    background-color: ${(props) => `${props.$color}14`};
  }
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background-color: ${(props) => props.$color};
  box-shadow: 0 0 0 2px ${(props) => `${props.$color}2e`};
`;

const LegendCount = styled.span`
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  min-width: 14px;
  text-align: center;
  padding: 0 3px;
  border-radius: 7px;
  color: var(--semi-color-text-2);
  background-color: var(--semi-color-fill-0);
`;

/** 类型 key → 展示名（arch-* 直接取 ARCH_CATEGORIES label） */
function typeLabelOf(key: string): string {
  const type = key.slice('type-'.length);
  const registry = nodeRegistries.find((item) => item.type === type);
  return registry?.info?.label ?? type;
}

export const CanvasLegend = () => {
  const ctx = useClientContext();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [filterKey, setFilterKey] = useState<string | null>(null);
  // 画布节点是异步挂载的：onAllLayersRendered 时 bump 版本，此处据此重算统计
  const readyVersion = useSyncExternalStore(
    canvasReadyStore.subscribe,
    canvasReadyStore.getVersion
  );

  // 统计当前画布的节点类型（排除区域容器 group；其余类型都计入）
  const items = useMemo<LegendItem[]>(() => {
    const labelByKey = new Map<string, string>();
    const colorByKey = new Map<string, string>();
    const countByKey = new Map<string, number>();
    const order: string[] = [];
    ctx.document.getAllNodes().forEach((node) => {
      if (node.flowNodeType === CanvasNodeType.Area) {
        return;
      }
      const key = legendKeyOf(node);
      if (!labelByKey.has(key)) {
        labelByKey.set(
          key,
          key.startsWith('arch-')
            ? ARCH_CATEGORIES[key.slice('arch-'.length) as keyof typeof ARCH_CATEGORIES]?.label ??
                '其他'
            : typeLabelOf(key)
        );
        colorByKey.set(key, resolveNodeAccent(node));
        order.push(key);
      }
      countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
    });
    return order
      .map((key) => ({
        key,
        label: labelByKey.get(key)!,
        color: colorByKey.get(key)!,
        count: countByKey.get(key) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }, [ctx, readyVersion]);

  // 过滤：给 DOM 中非匹配节点加淡化 class（区域容器不参与）
  useEffect(() => {
    const root = wrapRef.current?.closest('.demo-container');
    const wrappers = root?.querySelectorAll<HTMLElement>('.mp-node-wrapper');
    wrappers?.forEach((el) => {
      el.classList.toggle('mp-legend-dim', !!filterKey && el.dataset.legendKey !== filterKey);
    });
  }, [filterKey, items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <LegendWrap className="canvas-legend" ref={wrapRef}>
      <LegendTitle>图例</LegendTitle>
      {items.map((item) => (
        <LegendItemBtn
          key={item.key}
          type="button"
          $active={filterKey === item.key}
          $color={item.color}
          onClick={() => setFilterKey(filterKey === item.key ? null : item.key)}
        >
          <LegendDot $color={item.color} />
          {item.label}
          <LegendCount>{item.count}</LegendCount>
        </LegendItemBtn>
      ))}
    </LegendWrap>
  );
};
