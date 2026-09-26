/**
 * 主题预设定义（C1 深浅主题 + C2 多视觉预设）
 *
 * 每个预设通过 CSS 变量驱动：
 * - FlowGram 画布 / 连线 / 端口色（--g-*）
 * - 本项目节点卡片 / 工具栏 / 便签 / 小地图（--mp-*）
 * - Semi 组件暗色由 ThemeStore 切换 body[theme-mode]
 */

export interface ThemePreset {
  /** 预设 id，用于 localStorage 持久化 */
  id: string;
  /** 预设展示名 */
  label: string;
  /** Semi 明暗模式 */
  mode: 'light' | 'dark';
  /** 画布底色 */
  canvasBg: string;
  /** 选区 / 主色 */
  selection: string;
  lineDefault: string;
  lineDrawing: string;
  lineHover: string;
  lineSelected: string;
  lineFlowing: string;
  portPrimary: string;
  portSecondary: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardTitle: string;
  cardSelectedBorder: string;
  fieldBg: string;
  fieldRowBorder: string;
  toolbarBg: string;
  toolbarBorder: string;
  noteBg: string;
  noteOutline: string;
  noteFocusBg: string;
  noteFocusOutline: string;
  minimapBg: string;
  minimapViewport: string;
  minimapViewportBorder: string;
  minimapNode: string;
  minimapOverlay: string;
  selectBoxBackground: string;
}

export const LIGHT_THEME: ThemePreset = {
  id: 'light',
  label: '浅色',
  mode: 'light',
  canvasBg: '#f2f3f5',
  selection: '#4d53e8',
  lineDefault: '#4d53e8',
  lineDrawing: '#5dd6e3',
  lineHover: '#37d0ff',
  lineSelected: '#37d0ff',
  lineFlowing: '#4d53e8',
  portPrimary: '#4d53e8',
  portSecondary: '#9197f1',
  cardBg: '#ffffff',
  cardBorder: 'rgba(6, 7, 9, 0.15)',
  cardShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.02)',
  cardTitle: '#1c1f23',
  cardSelectedBorder: '#4e40e5',
  fieldBg: '#ffffff',
  fieldRowBorder: 'rgba(6, 7, 9, 0.06)',
  toolbarBg: '#ffffff',
  toolbarBorder: 'rgba(68, 83, 130, 0.25)',
  noteBg: '#fffbed',
  noteOutline: '#f2b600',
  noteFocusBg: '#fff3ea',
  noteFocusOutline: '#ff811a',
  minimapBg: 'rgba(242, 243, 245, 1)',
  minimapViewport: 'rgba(255, 255, 255, 1)',
  minimapViewportBorder: 'rgba(6, 7, 9, 0.10)',
  minimapNode: 'rgba(0, 0, 0, 0.10)',
  minimapOverlay: 'rgba(255, 255, 255, 0.55)',
  selectBoxBackground: 'rgba(141, 144, 231, 0.1)',
};

export const DARK_THEME: ThemePreset = {
  id: 'dark',
  label: '深色',
  mode: 'dark',
  canvasBg: '#101114',
  selection: '#6d73ff',
  lineDefault: '#6d73ff',
  lineDrawing: '#4dd4e3',
  lineHover: '#38bdf8',
  lineSelected: '#38bdf8',
  lineFlowing: '#6d73ff',
  portPrimary: '#6d73ff',
  portSecondary: '#8b8fd8',
  cardBg: '#1c1e24',
  cardBorder: 'rgba(255, 255, 255, 0.14)',
  cardShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.35)',
  cardTitle: '#e6e8eb',
  cardSelectedBorder: '#6d73ff',
  fieldBg: '#141519',
  fieldRowBorder: 'rgba(255, 255, 255, 0.07)',
  toolbarBg: '#1c1e24',
  toolbarBorder: 'rgba(255, 255, 255, 0.14)',
  noteBg: '#2f2a14',
  noteOutline: '#d4a017',
  noteFocusBg: '#332b18',
  noteFocusOutline: '#ff9f43',
  minimapBg: 'rgba(28, 30, 36, 1)',
  minimapViewport: 'rgba(255, 255, 255, 0.06)',
  minimapViewportBorder: 'rgba(255, 255, 255, 0.16)',
  minimapNode: 'rgba(255, 255, 255, 0.16)',
  minimapOverlay: 'rgba(0, 0, 0, 0.35)',
  selectBoxBackground: 'rgba(109, 115, 255, 0.16)',
};

/** 深海蓝（暗色） */
export const OCEAN_THEME: ThemePreset = {
  ...DARK_THEME,
  id: 'ocean',
  label: '深海蓝',
  canvasBg: '#0b1322',
  selection: '#5c8cff',
  lineDefault: '#5c8cff',
  lineDrawing: '#37c8e8',
  lineHover: '#4cc3ff',
  lineSelected: '#4cc3ff',
  lineFlowing: '#5c8cff',
  portPrimary: '#5c8cff',
  portSecondary: '#7ea6ff',
  cardBg: '#15203a',
  cardBorder: 'rgba(122, 162, 247, 0.22)',
  cardTitle: '#e2ebff',
  cardSelectedBorder: '#5c8cff',
  fieldBg: '#101a30',
  fieldRowBorder: 'rgba(160, 190, 255, 0.10)',
  toolbarBg: '#15203a',
  toolbarBorder: 'rgba(122, 162, 247, 0.25)',
  noteBg: '#1c2a24',
  noteOutline: '#3aa97c',
  noteFocusBg: '#1e3128',
  noteFocusOutline: '#4cc98f',
  minimapBg: 'rgba(21, 32, 58, 1)',
  minimapViewport: 'rgba(170, 200, 255, 0.10)',
  minimapViewportBorder: 'rgba(160, 190, 255, 0.22)',
  minimapNode: 'rgba(160, 190, 255, 0.20)',
  minimapOverlay: 'rgba(0, 0, 0, 0.35)',
  selectBoxBackground: 'rgba(92, 140, 255, 0.16)',
};

/** 墨绿（暗色） */
export const FOREST_THEME: ThemePreset = {
  ...DARK_THEME,
  id: 'forest',
  label: '墨绿',
  canvasBg: '#0d130f',
  selection: '#3fbf6f',
  lineDefault: '#3fbf6f',
  lineDrawing: '#38d9a9',
  lineHover: '#4ade80',
  lineSelected: '#4ade80',
  lineFlowing: '#3fbf6f',
  portPrimary: '#3fbf6f',
  portSecondary: '#7ccfa0',
  cardBg: '#16231b',
  cardBorder: 'rgba(120, 220, 160, 0.20)',
  cardTitle: '#e2f4e9',
  cardSelectedBorder: '#3fbf6f',
  fieldBg: '#101b14',
  fieldRowBorder: 'rgba(160, 230, 190, 0.10)',
  toolbarBg: '#16231b',
  toolbarBorder: 'rgba(120, 220, 160, 0.22)',
  noteBg: '#232b1a',
  noteOutline: '#b7c44f',
  noteFocusBg: '#2a331c',
  noteFocusOutline: '#d8e25a',
  minimapBg: 'rgba(22, 35, 27, 1)',
  minimapViewport: 'rgba(190, 240, 205, 0.10)',
  minimapViewportBorder: 'rgba(160, 230, 190, 0.22)',
  minimapNode: 'rgba(190, 240, 205, 0.20)',
  minimapOverlay: 'rgba(0, 0, 0, 0.35)',
  selectBoxBackground: 'rgba(63, 191, 111, 0.16)',
};

export const THEME_PRESETS: ThemePreset[] = [LIGHT_THEME, DARK_THEME, OCEAN_THEME, FOREST_THEME];

export function findPreset(id: string | null): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? LIGHT_THEME;
}
