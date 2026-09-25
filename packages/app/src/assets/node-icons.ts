/**
 * 节点图标（内联 SVG data URI，避免额外资源文件，也便于单体 HTML 离线导出）
 */

const svgIcon = (inner: string, color = '#4d53e8'): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">${inner}</svg>`
  )}`;

/** 数据库表 */
export const DB_TABLE_ICON = svgIcon(
  '<path d="M12 2.5C7.3 2.5 3.5 3.9 3.5 5.6v12.8c0 1.7 3.8 3.1 8.5 3.1s8.5-1.4 8.5-3.1V5.6c0-1.7-3.8-3.1-8.5-3.1zm0 2c4.2 0 6.3.9 6.5 1.1-.2.2-2.3 1.1-6.5 1.1S5.7 5.8 5.5 5.6c.2-.2 2.3-1.1 6.5-1.1z"/>'
);

/** 架构组件 */
export const ARCH_COMPONENT_ICON = svgIcon(
  '<path d="M12 2.6 2.8 7.3 12 12l9.2-4.7L12 2.6zM3.4 12.4l8.1 4.1v5L3.4 17.4v-5zm17.2 0v5l-8.1 4.1v-5l8.1-4.1z"/>',
  '#7c5cff'
);

/** 流程起点 */
export const FLOW_START_ICON = svgIcon(
  '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2.2 5.4 6.2 4.6-6.2 4.6V7.4z"/>',
  '#12a150'
);

/** 流程终点 */
export const FLOW_END_ICON = svgIcon(
  '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.5 8.5h7v7h-7v-7z"/>',
  '#12a150'
);

/** 流程步骤 */
export const FLOW_STEP_ICON = svgIcon(
  '<path d="M5 4.5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1zm3 4v2h8v-2H8zm0 4v2h5v-2H8z"/>',
  '#12a150'
);

/** 流程判断 */
export const FLOW_DECISION_ICON = svgIcon(
  '<path d="M12 1.8 22.2 12 12 22.2 1.8 12 12 1.8z"/>',
  '#e08c00'
);

/** 便签 */
export const NOTE_ICON = svgIcon(
  '<path d="M5.5 2.8h13a1 1 0 0 1 1 1v16.4a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1zm2.5 4v1.6h8V6.8H8zm0 3.6v1.6h8V10.4H8zm0 3.6v1.6h5V14H8z"/>',
  '#8a94a6'
);

/** 区域容器（工具栏用图，非节点图标） */
export const AREA_ICON = svgIcon(
  '<path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>',
  '#8a94a6'
);
