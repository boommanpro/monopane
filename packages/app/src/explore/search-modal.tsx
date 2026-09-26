/**
 * 探索搜索面板（A）：Ctrl/Cmd+K 打开，按标题搜索节点并定位 / 高亮上下游 / 探查路径
 *
 * 面板自身订阅探索快照（panelOpen 开关），动作直接调用 ExploreService。
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import styled from 'styled-components';
import {
  useClientContext,
  useService,
  WorkflowSelectService,
} from '@flowgram.ai/free-layout-editor';
import { Button, Input, Toast, Typography } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { useNodeFormPanel } from '../plugins/panel-manager-plugin/hooks';
import { useExploreSnapshot } from './use-explore-class';
import { exploreService, findNodeById, searchNodes } from './service';

const Panel = styled.div`
  position: absolute;
  top: 64px;
  right: 16px;
  z-index: 21;
  width: 340px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: var(--mp-toolbar-bg);
  border: 1px solid var(--mp-toolbar-border);
  border-radius: 12px;
  box-shadow: var(--mp-card-shadow);
  pointer-events: auto;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--mp-field-row-border);
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: color-mix(in srgb, var(--semi-color-primary) 6%, transparent);
  }
`;

const ResultTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const ResultActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ExploreSearchModal = () => {
  const ctx = useClientContext();
  const selectService = useService(WorkflowSelectService);
  const { open: openNodeFormPanel } = useNodeFormPanel();
  const snapshot = useExploreSnapshot();
  const open = snapshot.panelOpen;

  const [query, setQuery] = useState('');
  const [pathStartId, setPathStartId] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K 开合，Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        exploreService.setPanelOpen(!exploreService.getSnapshot().panelOpen);
      } else if (e.key === 'Escape' && exploreService.getSnapshot().panelOpen) {
        exploreService.setPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 打开时聚焦输入框，重置路径起点
  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setPathStartId(undefined);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => (open ? searchNodes(ctx, query) : []), [open, query, ctx]);

  /** 点击结果：定位并打开表单面板，收起搜索面板 */
  const locate = (nodeId: string) => {
    const node = findNodeById(ctx, nodeId);
    if (node) {
      void selectService.selectNodeAndScrollToView(node);
      openNodeFormPanel({ nodeId });
    }
    exploreService.setPanelOpen(false);
  };

  /** 高亮该节点的上游 / 下游可达 */
  const focusDirection = (nodeId: string, direction: 'upstream' | 'downstream') => {
    exploreService.focus(ctx, nodeId, direction);
    exploreService.setPanelOpen(false);
  };

  /** 设为路径起点 */
  const setAsStart = (nodeId: string) => {
    setPathStartId(nodeId);
    Toast.info({ content: '已设为路径起点，请再点击某结果的「设为终点」' });
  };

  /** 设为路径终点并探查 */
  const setAsEnd = (nodeId: string) => {
    if (!pathStartId) {
      Toast.warning({ content: '请先点击某结果的「设为起点」' });
      return;
    }
    const ok = exploreService.explorePath(ctx, pathStartId, nodeId);
    if (!ok) {
      Toast.error({ content: '起点到终点之间不存在有向路径' });
      return;
    }
    exploreService.setPanelOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <Panel>
      <Input
        ref={inputRef as never}
        prefix={<IconSearch />}
        placeholder="搜索节点标题，回车定位首条"
        value={query}
        onChange={setQuery}
        onEnterPress={() => {
          const first = results[0];
          if (first) {
            locate(first.node.id);
          }
        }}
        showClear
      />
      {results.length === 0 ? (
        <Typography.Text type="tertiary" style={{ padding: '12px 4px' }}>
          {query ? '没有匹配的节点' : '输入关键词搜索画布节点'}
        </Typography.Text>
      ) : (
        <ResultList>
          {results.map((item) => {
            const registry = item.node.getNodeRegistry();
            const info = (registry.info ?? {}) as {
              icon?: string;
              label?: string;
            };
            return (
              <ResultItem key={item.node.id} onClick={() => locate(item.node.id)}>
                <ResultTitle>
                  {info.icon && (
                    <img src={info.icon} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
                  )}
                  <Typography.Text strong ellipsis={{ showTooltip: true }} style={{ minWidth: 0 }}>
                    {item.title}
                  </Typography.Text>
                </ResultTitle>
                <ResultActions>
                  <Button
                    size="small"
                    theme="borderless"
                    onClick={(e) => {
                      e.stopPropagation();
                      focusDirection(item.node.id, 'upstream');
                    }}
                  >
                    上游高亮
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    onClick={(e) => {
                      e.stopPropagation();
                      focusDirection(item.node.id, 'downstream');
                    }}
                  >
                    下游高亮
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    active={pathStartId === item.node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsStart(item.node.id);
                    }}
                  >
                    设为起点
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsEnd(item.node.id);
                    }}
                  >
                    设为终点
                  </Button>
                </ResultActions>
              </ResultItem>
            );
          })}
        </ResultList>
      )}
    </Panel>
  );
};
