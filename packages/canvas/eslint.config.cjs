/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

// 该包为 `"type": "module"`，ESLint 配置文件需用 .cjs 扩展名才能使用 require/__dirname
const { defineFlatConfig } = require('@flowgram.ai/eslint-config');

module.exports = defineFlatConfig({
  preset: 'node',
  packageRoot: __dirname,
  rules: {
    'no-console': 'off',
  },
});
