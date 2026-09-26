/**
 * 主题的 React 绑定
 */

import { useSyncExternalStore } from 'react';

import { themeStore, type ThemeSnapshot } from './store';

export function useTheme(): ThemeSnapshot {
  return useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot);
}
