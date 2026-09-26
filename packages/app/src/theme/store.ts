/**
 * 主题状态管理
 *
 * - localStorage 持久化当前预设（follow-system / light / dark / ocean / forest）
 * - 应用预设时把预设值写入 <html> 的 CSS 变量（驱动 FlowGram 与自绘组件），
 *   并切换 Semi 的 body[theme-mode]
 * - 跟随系统模式监听 prefers-color-scheme，自动在深浅之间切换
 */

import { findPreset, type ThemePreset } from './themes';

const STORAGE_KEY = 'monopane-theme';
const FOLLOW_SYSTEM = 'follow-system';

export interface ThemeSnapshot {
  /** 当前选中的预设 id；'follow-system' 表示跟随系统 */
  presetId: string;
  /** 实际生效的预设 */
  preset: ThemePreset;
}

function systemPresetId(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && (stored === FOLLOW_SYSTEM || findPreset(stored).id === stored)
      ? stored
      : FOLLOW_SYSTEM;
  } catch {
    return FOLLOW_SYSTEM;
  }
}

/** 把预设值映射为 CSS 变量并写到 <html> */
function applyVars(preset: ThemePreset): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', preset.mode);
  root.setAttribute('data-preset', preset.id);
  if (preset.mode === 'dark') {
    document.body.setAttribute('theme-mode', 'dark');
  } else {
    document.body.removeAttribute('theme-mode');
  }
  const vars: Record<string, string> = {
    '--g-editor-background': preset.canvasBg,
    '--g-selection-background': preset.selection,
    '--g-playground-selectBox-background': preset.selectBoxBackground,
    '--g-playground-select-hover-background': preset.selectBoxBackground,
    '--g-workflow-port-color-primary': preset.portPrimary,
    '--g-workflow-port-color-secondary': preset.portSecondary,
    '--g-workflow-line-color-default': preset.lineDefault,
    '--g-workflow-line-color-drawing': preset.lineDrawing,
    '--g-workflow-line-color-hover': preset.lineHover,
    '--g-workflow-line-color-selected': preset.lineSelected,
    '--g-workflow-line-color-flowing': preset.lineFlowing,
    '--mp-card-bg': preset.cardBg,
    '--mp-card-border': preset.cardBorder,
    '--mp-card-shadow': preset.cardShadow,
    '--mp-card-title': preset.cardTitle,
    '--mp-card-selected-border': preset.cardSelectedBorder,
    '--mp-field-bg': preset.fieldBg,
    '--mp-field-row-border': preset.fieldRowBorder,
    '--mp-toolbar-bg': preset.toolbarBg,
    '--mp-toolbar-border': preset.toolbarBorder,
    '--mp-note-bg': preset.noteBg,
    '--mp-note-outline': preset.noteOutline,
    '--mp-note-focus-bg': preset.noteFocusBg,
    '--mp-note-focus-outline': preset.noteFocusOutline,
    '--mp-minimap-bg': preset.minimapBg,
    '--mp-minimap-viewport': preset.minimapViewport,
    '--mp-minimap-viewport-border': preset.minimapViewportBorder,
    '--mp-minimap-node': preset.minimapNode,
    '--mp-minimap-overlay': preset.minimapOverlay,
  };
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
}

export class ThemeStore {
  private presetId = readStored();

  private listeners = new Set<() => void>();

  private systemQuery?: MediaQueryList;

  private snapshot: ThemeSnapshot = {
    presetId: this.presetId,
    preset: this.resolve(this.presetId),
  };

  private resolve(presetId: string): ThemePreset {
    return findPreset(presetId === FOLLOW_SYSTEM ? systemPresetId() : presetId);
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): ThemeSnapshot => this.snapshot;

  public getPresetId(): string {
    return this.presetId;
  }

  /** 启动：应用当前预设并开始跟随系统（如需） */
  public init(): void {
    this.apply();
    this.systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemQuery.addEventListener('change', () => {
      if (this.presetId === FOLLOW_SYSTEM) {
        this.apply();
      }
    });
  }

  public setPreset(presetId: string): void {
    this.presetId = presetId;
    try {
      window.localStorage.setItem(STORAGE_KEY, presetId);
    } catch {
      /* localStorage 不可用时仅内存生效 */
    }
    this.apply();
  }

  /** 在「跟随系统 → 浅色 → 深色 → 深海蓝 → 墨绿」之间循环 */
  public cycle(): void {
    const order = ['follow-system', 'light', 'dark', 'ocean', 'forest'];
    const next = order[(order.indexOf(this.presetId) + 1) % order.length];
    this.setPreset(next);
  }

  private apply(): void {
    this.snapshot = {
      presetId: this.presetId,
      preset: this.resolve(this.presetId),
    };
    applyVars(this.snapshot.preset);
    this.listeners.forEach((listener) => listener());
  }
}

export const themeStore = new ThemeStore();
