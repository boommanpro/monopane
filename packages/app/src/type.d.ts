/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.module.less';

declare global {
  interface Window {
    /**
     * 单体 HTML 导出时由模板注入的画布数据
     * 见 packages/app/src/export/standalone-html.ts 与 packages/app/scripts/build-viewer-template.mjs
     */
    __CANVAS_DATA__?: unknown;
  }
}

export {};
