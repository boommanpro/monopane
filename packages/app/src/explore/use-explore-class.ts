/**
 * 探索高亮在 React 中的绑定
 *
 * 通过 useSyncExternalStore 订阅 ExploreService 快照，
 * 结合 nodeClassFrom 推导每个节点的探索高亮 class（focus / reachable / path / dim）。
 */

import { useSyncExternalStore } from 'react';

import { exploreService, nodeClassFrom, type ExploreNodeClass } from './service';

/** 某个节点的探索高亮 class（空串表示不高亮） */
export function useExploreClass(nodeId: string): ExploreNodeClass {
  const snapshot = useSyncExternalStore(exploreService.subscribe, exploreService.getSnapshot);
  return nodeClassFrom(snapshot, nodeId);
}

/** 订阅探索快照（工具栏按钮、搜索面板等使用） */
export function useExploreSnapshot() {
  return useSyncExternalStore(exploreService.subscribe, exploreService.getSnapshot);
}
