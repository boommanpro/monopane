/**
 * 画布节点卡片的共享样式
 */

import styled from 'styled-components';

import type { SimNodeStatus } from '../../simulation';

export const CardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

export const FieldList = styled.div`
  max-height: 276px;
  overflow-y: auto;
  border: 1px solid var(--mp-field-row-border);
  border-radius: 6px;
  background-color: var(--mp-field-bg);
`;

export const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 18px;
  border-bottom: 1px solid var(--mp-field-row-border);

  &:last-child {
    border-bottom: none;
  }
`;

export const FieldName = styled.span`
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-weight: 600;
  color: var(--mp-card-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FieldType = styled.span`
  margin-left: auto;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  color: var(--semi-color-text-2);
  white-space: nowrap;
`;

export const FlagTag = styled.span<{ $tone: 'pk' | 'fk' | 'unique' | 'null' }>`
  flex-shrink: 0;
  font-size: 10px;
  line-height: 14px;
  padding: 0 4px;
  border-radius: 3px;
  font-weight: 600;
  color: ${(props) => {
    switch (props.$tone) {
      case 'pk':
        return '#b8860b';
      case 'fk':
        return '#4d53e8';
      case 'unique':
        return '#12a150';
      default:
        return '#8a94a6';
    }
  }};
  background-color: ${(props) => {
    switch (props.$tone) {
      case 'pk':
        return 'rgba(184, 134, 11, 0.12)';
      case 'fk':
        return 'rgba(77, 83, 232, 0.12)';
      case 'unique':
        return 'rgba(18, 161, 80, 0.12)';
      default:
        return 'rgba(138, 148, 166, 0.14)';
    }
  }};
`;

export const Muted = styled.div`
  font-size: 12px;
  line-height: 18px;
  color: var(--semi-color-text-2);
  word-break: break-word;
  white-space: pre-wrap;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const CategoryBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: 11px;
  line-height: 16px;
  padding: 1px 6px;
  border-radius: 4px;
  color: ${(props) => props.$color};
  background-color: ${(props) => `${props.$color}1f`};
`;

/** 节点类型徽标（如「并行网关」「延时等待」），配色跟随节点强调色 */
export const TypeBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  padding: 1px 6px;
  border-radius: 4px;
  color: ${(props) => props.$color};
  background-color: ${(props) => `${props.$color}1f`};
`;

export const SimBanner = styled.div<{ $status: SimNodeStatus }>`
  display: ${(props) => (props.$status === 'idle' ? 'none' : 'flex')};
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
  color: ${(props) => (props.$status === 'running' ? '#4d53e8' : '#12a150')};
`;

export const SimDot = styled.span<{ $status: SimNodeStatus }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: currentColor;
  animation: ${(props) =>
    props.$status === 'running' ? 'sim-pulse 1s ease-in-out infinite' : 'none'};
`;

export const BranchHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  color: var(--semi-color-text-2);
`;
