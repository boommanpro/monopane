/**
 * 节点图标（内联 SVG data URI，避免额外资源文件，也便于单体 HTML 离线导出）
 *
 * 每个节点类型的图标自带主题色（与节点卡片的 accent 强调色一致），
 * 采用「色块 + 白色细节」的双色画法，比单色描边更清晰。
 */

const svgIcon = (inner: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`
  )}`;

/** 数据库表 */
export const DB_TABLE_ICON = svgIcon(
  '<path fill="#4d53e8" d="M12 2.5C7.3 2.5 3.5 3.9 3.5 5.6v12.8c0 1.7 3.8 3.1 8.5 3.1s8.5-1.4 8.5-3.1V5.6c0-1.7-3.8-3.1-8.5-3.1zm0 2c4.2 0 6.3.9 6.5 1.1-.2.2-2.3 1.1-6.5 1.1S5.7 5.8 5.5 5.6c.2-.2 2.3-1.1 6.5-1.1z"/>'
);

/** 数据库视图：表 + 右下角的「观察」圆点 */
export const DB_VIEW_ICON = svgIcon(
  '<path fill="#4d53e8" d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/>' +
    '<path fill="#fff" d="M7 7h10v2H7zM7 11h8v2H7zM7 15h5v2H7z"/>' +
    '<circle cx="17" cy="15.5" r="3" fill="#4d53e8" opacity=".22"/>' +
    '<path fill="#fff" d="M17 14.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"/>'
);

/** 架构组件 */
export const ARCH_COMPONENT_ICON = svgIcon(
  '<path fill="#7c5cff" d="M12 2.6 2.8 7.3 12 12l9.2-4.7L12 2.6zM3.4 12.4l8.1 4.1v5L3.4 17.4v-5zm17.2 0v5l-8.1 4.1v-5l8.1-4.1z"/>'
);

/** 流程起点 */
export const FLOW_START_ICON = svgIcon(
  '<path fill="#12a150" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path fill="#fff" d="M10.2 7.6 16 12l-5.8 4.4V7.6z"/>'
);

/** 流程终点 */
export const FLOW_END_ICON = svgIcon(
  '<path fill="#12a150" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><rect x="8.2" y="8.2" width="7.6" height="7.6" rx="1.4" fill="#fff"/>'
);

/** 流程步骤 */
export const FLOW_STEP_ICON = svgIcon(
  '<path fill="#12a150" d="M5 4.5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z"/><path fill="#fff" d="M8 8.5v2h8v-2H8zm0 4v2h5v-2H8z"/>'
);

/** 流程判断 */
export const FLOW_DECISION_ICON = svgIcon(
  '<path fill="#e08c00" d="M12 1.8 22.2 12 12 22.2 1.8 12 12 1.8z"/><path fill="#fff" d="M12 5.8 18.2 12 12 18.2 5.8 12 12 5.8z"/>'
);

/** 子流程：大容器里套小容器 */
export const FLOW_SUBPROCESS_ICON = svgIcon(
  '<path fill="#0d9488" d="M4 3.5h16A1.5 1.5 0 0 1 21.5 5v14A1.5 1.5 0 0 1 20 20.5H4A1.5 1.5 0 0 1 2.5 19V5A1.5 1.5 0 0 1 4 3.5z"/>' +
    '<rect x="8" y="8" width="8" height="8" rx="1.5" fill="#fff"/>'
);

/** 并行网关：主节点右侧三条并行分支 */
export const FLOW_PARALLEL_ICON = svgIcon(
  '<path fill="#2563eb" d="M3.5 4h10A1.5 1.5 0 0 1 15 5.5v13A1.5 1.5 0 0 1 13.5 20h-10A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4z"/>' +
    '<path fill="#2563eb" d="M17.2 7.4h4v2h-4zM17.2 11h4v2h-4zM17.2 14.6h4v2h-4z"/>'
);

/** 延时等待：时钟 */
export const FLOW_DELAY_ICON = svgIcon(
  '<path fill="#ea580c" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>' +
    '<path fill="#fff" d="M12 6.8v5.4l3.6 2.2.9-1.5-3-1.9V6.8z"/>'
);

/** 通知 / 事件：铃铛 */
export const FLOW_NOTIFY_ICON = svgIcon(
  '<path fill="#d94848" d="M12 2.5A5.5 5.5 0 0 0 6.5 8c0 3.8-1.6 5.3-1.9 6.4-.2.8.4 1.6 1.2 1.6h12.4c.8 0 1.4-.8 1.2-1.6-.3-1.1-1.9-2.6-1.9-6.4A5.5 5.5 0 0 0 12 2.5z"/>' +
    '<path fill="#fff" d="M10 18.2a2 2 0 0 0 4 0z"/>'
);

/** 运行期事件监听：圆内声波 */
export const RUNTIME_EVENT_ICON = svgIcon(
  '<circle cx="12" cy="12" r="9" fill="#0891b2"/>' +
    '<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round">' +
    '<path d="M8.2 10.4a3.5 3.5 0 0 0 0 3.2"/>' +
    '<path d="M6.7 8.9a6 6 0 0 0 0 6.2"/>' +
    '<path d="M15.8 10.4a3.5 3.5 0 0 1 0 3.2"/>' +
    '<path d="M17.3 8.9a6 6 0 0 1 0 6.2"/>' +
    '</g>'
);

/** 运行期定时任务：时钟 + 循环箭头 */
export const RUNTIME_SCHEDULED_ICON = svgIcon(
  '<circle cx="12" cy="12" r="9" fill="#7c3aed"/>' +
    '<path fill="#fff" d="M11.4 6.6h1.2v5.5l3.3 2 .9-1.5-3-1.8V6.6z"/>' +
    '<g fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round">' +
    '<path d="M19.4 10.6a7.6 7.6 0 0 0-8.4-5.6"/>' +
    '<path d="M4.6 13.4a7.6 7.6 0 0 0 8.4 5.6"/>' +
    '</g>'
);

/** 便签 */
export const NOTE_ICON = svgIcon(
  '<path fill="#8a94a6" d="M5.5 2.8h13a1 1 0 0 1 1 1v16.4a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1z"/><path fill="#fff" d="M8 6.8v1.6h8V6.8H8zm0 3.6v1.6h8V10.4H8zm0 3.6v1.6h5V14H8z"/>'
);

/** 时序图·参与者：圆角框内的人物剪影 */
export const SEQ_PARTICIPANT_ICON = svgIcon(
  '<path fill="#0891b2" d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/>' +
    '<circle cx="12" cy="9" r="2.7" fill="#fff"/>' +
    '<path fill="#fff" d="M7.4 16.9a4.6 4.6 0 0 1 9.2 0z"/>'
);

/** 时序图·消息：气泡 + 内容行 */
export const SEQ_MESSAGE_ICON = svgIcon(
  '<path fill="#06b6d4" d="M3.5 5.5A1.5 1.5 0 0 1 5 4h14a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 17h-6.2L9 20.4V17H5A1.5 1.5 0 0 1 3.5 15.5v-10z"/>' +
    '<path fill="#fff" d="M7 8.4h10v1.6H7zm0 3h7v1.6H7z"/>'
);

/** 数据流图·数据源：数据桶 + 向外箭头 */
export const DF_SOURCE_ICON = svgIcon(
  '<path fill="#6366f1" d="M12 3C7.6 3 4 4.3 4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3z"/>' +
    '<path fill="none" stroke="#fff" stroke-width="1.3" d="M4.2 6.1c0 1.7 3.5 3 7.8 3s7.8-1.3 7.8-3"/>' +
    '<g stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<path d="M12 12.2v3.4M10.2 13.6 12 15.4l1.8-1.8"/>' +
    '</g>'
);

/** 数据流图·转换：漏斗 */
export const DF_TRANSFORM_ICON = svgIcon(
  '<path fill="#818cf8" d="M4 4.2h16l-6.3 7v7l-3.4-1.7v-5.3L4 4.2z"/>' +
    '<path fill="#fff" d="M8 7h8l-3 3.5v2.2l-1.5-.8V10.5L8 7z" opacity=".85"/>'
);

/** 数据流图·存储：仓储柜 + 数据行 */
export const DF_STORE_ICON = svgIcon(
  '<path fill="#4f46e5" d="M3 4.5h18v4.2H3zM5.4 10.3h13.2v9.6H5.4z"/>' +
    '<path fill="#fff" d="M7 12.4h10v1.6H7zm0 3h7v1.6H7z"/>'
);

/** 区域容器（工具栏用图，非节点图标） */
export const AREA_ICON = svgIcon(
  '<path fill="#8a94a6" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>'
);
