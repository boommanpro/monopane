/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { defineConfig } from '@rsbuild/core';

/**
 * MODE=viewer 时构建只读 viewer，产物用于生成单体 HTML 导出模板
 */
const isViewer = process.env.MODE === 'viewer';

/**
 * 部署根路径。GitHub Pages 的项目站点挂在 /<repo>/ 下，CI 会传入 /monopane/。
 * 本地开发与预览保持默认的 / 即可。
 */
const assetPrefix = process.env.ASSET_PREFIX?.trim() || '/';

/**
 * 只读预览部署在 <assetPrefix>viewer/ 下，因此需要独立前缀，
 * 否则两套产物的 static/ 目录会互相覆盖。
 * 本地（assetPrefix 为 /）保持根路径，便于直接预览 dist-viewer。
 */
const viewerAssetPrefix = assetPrefix === '/' ? '/' : `${assetPrefix.replace(/\/?$/, '/')}viewer/`;

export default defineConfig({
  plugins: [pluginReact(), pluginLess()],
  source: {
    entry: {
      index: isViewer ? './src/app-viewer.tsx' : './src/app.tsx',
    },
    /**
     * support inversify @injectable() and @inject decorators
     */
    decorators: {
      version: 'legacy',
    },
  },
  html: {
    title: isViewer ? '项目文档画布（预览）' : '项目文档画布',
    /**
     * 单文件产物：模板生成脚本需要按固定文件名定位 JS / CSS
     */
    ...(isViewer ? { inject: 'body' as const } : {}),
  },
  output: isViewer
    ? {
        /**
         * viewer 产物不带 hash，便于模板生成脚本按文件名内联
         */
        filenameHash: false,
        assetPrefix: viewerAssetPrefix,
        /**
         * 与编辑器产物隔离，避免互相覆盖
         */
        distPath: {
          root: 'dist-viewer',
        },
      }
    : {
        assetPrefix,
      },
  tools: {
    rspack: {
      /**
       * ignore warnings from @coze-editor/editor/language-typescript
       */
      ignoreWarnings: [/Critical dependency: the request of a dependency is an expression/],
    },
  },
});
