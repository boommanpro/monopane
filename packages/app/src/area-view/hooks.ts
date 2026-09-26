/**
 * 分区视图的 React 绑定
 */

import { useSyncExternalStore } from 'react';

import { areaViewStore, type AreaViewSnapshot } from './store';

export function useAreaView(): AreaViewSnapshot {
  return useSyncExternalStore(areaViewStore.subscribe, areaViewStore.getSnapshot);
}
