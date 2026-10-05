#!/usr/bin/env node
/**
 * 把画布 JSON 构建成「可离线双击打开」的单体 HTML
 *
 * 用法：
 *   node packages/app/scripts/build-standalone.mjs <input.json> [output.html]
 *
 * 流程：
 *   1. 读取并校验画布 JSON（结构 + 节点类型，与 validateCanvasFile 的底线一致）；
 *   2. 读取 viewer 单体模板（public/viewer-template.html）；模板是构建产物、不入库，
 *      缺失或格式异常时脚本会自动执行 MODE=viewer 构建生成，无需手动预构建；
 *   3. 把 `window.__CANVAS_DATA__ = null;` 占位替换为真实数据，写出自包含 HTML。
 *
 * 输出默认与输入同目录，扩展名换成 .html。
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** 仓库根（pnpm workspace 根，pnpm --filter 在此执行）；ROOT 是 packages/app，再向上两级 */
const REPO_ROOT = resolve(ROOT, '..', '..');
const TEMPLATE_FILE = join(ROOT, 'public', 'viewer-template.html');
/** @monopane/canvas 的构建产物入口；dist 不入库（见 .gitignore），fresh clone 后必须先生成 */
const CANVAS_DIST_ENTRY = join(REPO_ROOT, 'packages', 'canvas', 'dist', 'index.js');
/** 必须与 src/export/standalone-html.ts 的 DATA_PLACEHOLDER 保持一致 */
const DATA_PLACEHOLDER = 'window.__CANVAS_DATA__ = null;';

/** 受支持的节点类型集合（与 packages/canvas/src/types.ts 的 CanvasNodeType 一致） */
const VALID_NODE_TYPES = new Set([
  'db-table',
  'db-view',
  'arch-component',
  'flow-start',
  'flow-end',
  'flow-step',
  'flow-decision',
  'flow-subprocess',
  'flow-parallel',
  'flow-delay',
  'flow-notify',
  'runtime-event',
  'runtime-scheduled',
  'seq-participant',
  'seq-message',
  'df-source',
  'df-transform',
  'df-store',
  'note',
  'group',
]);

function fail(message) {
  console.error(`[build-standalone] ${message}`);
  process.exit(1);
}

const [inputPath, outputArg] = process.argv.slice(2);
if (!inputPath) {
  console.error('用法：node packages/app/scripts/build-standalone.mjs <input.json> [output.html]');
  process.exit(1);
}
const inputFile = resolve(inputPath);
if (!existsSync(inputFile)) {
  fail(`输入文件不存在：${inputFile}`);
}

/** 读取并校验画布 JSON（结构底线校验，深度语义校验由 skill 的 validate-canvas.mjs 负责） */
function loadCanvasData(file) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`输入不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!raw || typeof raw !== 'object') {
    fail('画布数据不是 JSON 对象');
  }
  if (raw.schemaVersion !== undefined && typeof raw.schemaVersion !== 'string') {
    fail('schemaVersion 必须是字符串');
  }
  if (!Array.isArray(raw.nodes)) {
    fail('缺少 nodes 数组');
  }
  for (const [index, node] of raw.nodes.entries()) {
    if (!node || typeof node !== 'object' || !node.id || !node.type) {
      fail(`第 ${index + 1} 个节点缺少 id 或 type`);
    }
    if (!VALID_NODE_TYPES.has(String(node.type))) {
      fail(`第 ${index + 1} 个节点类型 "${node.type}" 不受支持`);
    }
  }
  if (raw.edges !== undefined && !Array.isArray(raw.edges)) {
    fail('edges 必须是数组');
  }
  return {
    schemaVersion: raw.schemaVersion ?? '1.1',
    nodes: raw.nodes,
    edges: raw.edges ?? [],
  };
}

/**
 * 确保 @monopane/canvas 的构建产物存在。viewer 构建（rsbuild）会解析 `@monopane/canvas`
 * 的 `main` → `./dist/index.js`，而 dist 不入库，fresh clone 后缺失时直接 build:viewer
 * 会报 `Module not found: Can't resolve '@monopane/canvas'`，因此必须先补建。
 */
function ensureCanvasBuilt() {
  if (existsSync(CANVAS_DIST_ENTRY)) {
    return;
  }
  console.log('[build-standalone] 检测到 @monopane/canvas 未构建（dist 缺失），先自动构建...');
  try {
    execSync('pnpm --filter @monopane/canvas build', { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch (error) {
    fail(
      '自动构建 @monopane/canvas 失败，请手动执行 pnpm --filter @monopane/canvas build 后重试：' +
        (error instanceof Error ? error.message : String(error))
    );
  }
  if (!existsSync(CANVAS_DIST_ENTRY)) {
    fail('自动构建后 @monopane/canvas 的 dist 仍缺失，请手动执行 pnpm --filter @monopane/canvas build');
  }
}

/**
 * 确保 viewer 单体模板可用。模板是构建产物（gitignore 不入库），缺失或格式异常时
 * 自动执行 MODE=viewer 构建生成，避免调用方必须先手动 build:viewer。
 */
function ensureTemplate() {
  if (existsSync(TEMPLATE_FILE)) {
    const existing = readFileSync(TEMPLATE_FILE, 'utf8');
    if (existing.includes(DATA_PLACEHOLDER)) {
      return;
    }
  }
  console.log('[build-standalone] 离线模板缺失或格式异常，自动执行 viewer 构建生成中...');
  // viewer 构建依赖 @monopane/canvas 的 dist，先确保它存在
  ensureCanvasBuilt();
  try {
    execSync('pnpm build:viewer', { cwd: ROOT, stdio: 'inherit' });
  } catch (error) {
    fail(
      '自动生成模板失败，请确认 @monopane/canvas 已构建（pnpm --filter @monopane/canvas build）' +
        '后重试 pnpm --filter @monopane/app build:viewer：' +
        (error instanceof Error ? error.message : String(error))
    );
  }
  if (
    !existsSync(TEMPLATE_FILE) ||
    !readFileSync(TEMPLATE_FILE, 'utf8').includes(DATA_PLACEHOLDER)
  ) {
    fail('自动生成模板后仍未就绪，请手动执行 pnpm --filter @monopane/app build:viewer');
  }
}

ensureTemplate();
const template = readFileSync(TEMPLATE_FILE, 'utf8');

const canvasData = loadCanvasData(inputFile);
const payload = JSON.stringify(canvasData).replace(/</g, '\\u003c');
/**
 * 用函数形式替换：数据里可能包含 $& / $' 等字符，直接传字符串会被当成替换模式
 */
const html = template.replace(DATA_PLACEHOLDER, () => `window.__CANVAS_DATA__ = ${payload};`);

/** 自检：占位符必须被真实数据替换掉，残留说明注入失败，产物不可用 */
if (html.includes(DATA_PLACEHOLDER)) {
  fail('数据注入失败：产物中仍残留占位符 ' + DATA_PLACEHOLDER);
}

const outputFile = outputArg
  ? resolve(outputArg)
  : join(dirname(inputFile), `${basename(inputFile, extname(inputFile))}.html`);
writeFileSync(outputFile, html, 'utf8');

const nodeCount = canvasData.nodes.length;
const edgeCount = canvasData.edges.length;
console.log(
  `[build-standalone] 已生成 ${outputFile}` +
    `（节点 ${nodeCount} + 连线 ${edgeCount}，${(html.length / 1024).toFixed(0)} KB）`
);
