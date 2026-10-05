/**
 * 顶部工具栏（右上角第二行）：只展示与当前画布内容相关的工具
 *   - 搜索节点
 *   - 模拟运行 / 重置运行状态 / 速度
 *   - 只读切换（绑定到 URL querystring：?readonly=1）
 * 默认展开；文件类操作（导入/导出/主题/撤销/重做）在 ToolbarSecondary（第三行）。
 */

import { useEffect, useState } from 'react';

import { useClientContext, usePlayground, useRefresh } from '@flowgram.ai/free-layout-editor';
import { Divider, Dropdown, IconButton, Toast, Tooltip } from '@douyinfe/semi-ui';
import {
  IconLock,
  IconPlay,
  IconRefresh,
  IconSearch,
  IconStop,
  IconUnlock,
} from '@douyinfe/semi-icons';

import type { FlowDocumentJSON } from '../typings';
import { simulationService, useSimulation, type SimSpeed } from '../simulation';
import { exploreService, useExploreSnapshot, ExploreSearchModal } from '../explore';
import { areaViewStore, useAreaView } from '../area-view';
import { ToolbarBar, ToolbarWrap } from './styles';

const SPEED_OPTIONS: { label: string; value: SimSpeed }[] = [
  { label: '0.5x 慢速', value: 0.5 },
  { label: '1x 常速', value: 1 },
  { label: '2x 快速', value: 2 },
];

export const CanvasToolbar = () => {
  const ctx = useClientContext();
  const playground = usePlayground();
  const refresh = useRefresh();
  const { running, speed, setSpeed } = useSimulation();
  const { canRun } = useAreaView();
  const exploreSnapshot = useExploreSnapshot();

  const [speedVisible, setSpeedVisible] = useState(false);
  const [readonly, setReadonly] = useState(Boolean(playground.config.readonly));

  // 首次加载：URL querystring 带 ?readonly=1 时进入只读模式（刷新后保持）。
  // 工具栏随画布重建（viewVersion 变化）会重新挂载，因此只需在挂载时执行一次。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('readonly') === '1' && !playground.config.readonly) {
      playground.config.readonly = true;
      setReadonly(true);
      refresh();
    }
  }, []);

  // 只读状态同步：外部（如快捷键/脚本）改动 playground.config 时跟随
  useEffect(() => {
    setReadonly(Boolean(playground.config.readonly));
  }, [playground.config.readonly]);

  const handleRun = () => {
    // 运行前先合并当前视图，让运行依据完整内容判定
    areaViewStore.mergeCurrentView(ctx.document.toJSON() as FlowDocumentJSON);
    const result = simulationService.start(ctx.document);
    if (!result.ok) {
      Toast.warning({ content: result.message ?? '无法开始模拟运行' });
    }
  };

  const handleToggleReadonly = () => {
    const next = !playground.config.readonly;
    playground.config.readonly = next;
    setReadonly(next);
    // 只读状态绑定到 URL querystring：刷新 / 分享链接后保持
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set('readonly', '1');
    } else {
      url.searchParams.delete('readonly');
    }
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    refresh();
  };

  return (
    <ToolbarWrap className="canvas-toolbar">
      <ToolbarBar>
        <Tooltip content="搜索节点（Ctrl+K）">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconSearch />}
            onClick={() => exploreService.setPanelOpen(!exploreSnapshot.panelOpen)}
          />
        </Tooltip>

        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />

        {running ? (
          <Tooltip content="停止模拟">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconStop />}
              onClick={() => simulationService.stop()}
            />
          </Tooltip>
        ) : (
          <Tooltip
            content={canRun ? '模拟运行逻辑' : '当前内容没有流程起点（flow-start），无法模拟运行'}
          >
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconPlay />}
              disabled={!canRun}
              onClick={handleRun}
            />
          </Tooltip>
        )}
        <Tooltip content="重置运行状态">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconRefresh />}
            onClick={() => simulationService.reset()}
          />
        </Tooltip>
        <Dropdown
          trigger="custom"
          position="bottomRight"
          visible={speedVisible}
          onClickOutSide={() => setSpeedVisible(false)}
          render={
            <Dropdown.Menu>
              {SPEED_OPTIONS.map((option) => (
                <Dropdown.Item
                  key={option.value}
                  active={option.value === speed}
                  onClick={() => {
                    setSpeed(option.value);
                    setSpeedVisible(false);
                  }}
                >
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          }
        >
          <IconButton
            type="tertiary"
            theme="borderless"
            onClick={() => setSpeedVisible(true)}
            style={{ width: 40, fontSize: 12 }}
          >
            {speed}x
          </IconButton>
        </Dropdown>

        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />

        <Tooltip content={readonly ? '切换到编辑模式' : '切换到只读预览'}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={readonly ? <IconLock /> : <IconUnlock />}
            onClick={handleToggleReadonly}
          />
        </Tooltip>
      </ToolbarBar>

      <ExploreSearchModal />
    </ToolbarWrap>
  );
};
