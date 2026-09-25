/**
 * 生成「单体 HTML 导出」所用的模板文件
 *
 * 输入：dist-viewer（MODE=viewer 的构建产物）
 * 输出：public/viewer-template.html
 *   - 所有 JS chunk / CSS / 静态资源全部内联
 *   - 在第一段应用脚本前插入确定性的数据占位脚本
 *
 * 运行时由 src/export/standalone-html.ts 读取该模板，
 * 把 `window.__CANVAS_DATA__ = null;` 替换为真实画布数据后下载。
 *
 * 说明：异步 chunk 以 JSONP 片段的形式内联在入口脚本**之前**。
 * 入口脚本里的 rspack 运行时会回放这些已入队的 chunk 并标记为「已加载」，
 * 因此运行时的动态 import 不会再发起网络请求，离线双击即可正常渲染。
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(ROOT, 'dist-viewer');
const OUTPUT_FILE = join(ROOT, 'public', 'viewer-template.html');

/**
 * 必须与 rsbuild.config.ts 的 assetPrefix 推导保持一致：
 * 部署到 <ASSET_PREFIX>/viewer/ 时，产物里的 URL 会带上这个前缀，
 * 但内联时需要按 dist-viewer 的相对路径去磁盘上找文件。
 */
const ASSET_PREFIX = process.env.ASSET_PREFIX?.trim() || '/';
const VIEWER_ASSET_PREFIX =
  ASSET_PREFIX === '/' ? '/' : `${ASSET_PREFIX.replace(/\/?$/, '/')}viewer/`;

/** 把产物 URL 还原成 dist-viewer 下的相对路径 */
function toDistFile(url) {
  let clean = url.replace(/^\/+/, '');
  const prefix = VIEWER_ASSET_PREFIX.replace(/^\/+/, '');
  if (prefix && clean.startsWith(prefix)) {
    clean = clean.slice(prefix.length);
  }
  return clean;
}

/** 解析静态资源引用：以 / 开头视为产物根，否则相对引用它的文件 */
function resolveAsset(url, baseDir) {
  if (url.startsWith('/')) {
    return join(DIST_DIR, toDistFile(url));
  }
  return resolve(baseDir, url);
}

/** 必须与 src/export/standalone-html.ts 中的 DATA_PLACEHOLDER 保持一致 */
const DATA_PLACEHOLDER = 'window.__CANVAS_DATA__ = null;';

const INDEX_HTML = join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

/** 递归收集产物目录下的文件 */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    if (statSync(fullPath).isDirectory()) {
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function toDistRelative(filePath) {
  return relative(DIST_DIR, filePath).split(sep).join('/');
}

function toDataUri(filePath) {
  if (!existsSync(filePath)) {
    return undefined;
  }
  const mime = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;
}

/** 把 CSS 中的相对 url(...) 资源内联为 data URI */
function inlineCssUrls(css, cssDir) {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, url) => {
    if (/^(data:|https?:|\/\/)/.test(url)) {
      return match;
    }
    const dataUri = toDataUri(resolveAsset(url, cssDir));
    return dataUri ? `url(${dataUri})` : match;
  });
}

/** 把 HTML 中剩余的资源引用内联为 data URI */
function inlineHtmlAssets(html) {
  return html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, url) => {
    if (/^(data:|https?:|\/\/|#)/.test(url)) {
      return match;
    }
    // JS / CSS 由专门的步骤内联，这里只处理图片、字体等静态资源
    if (/\.(js|css)$/.test(url)) {
      return match;
    }
    const dataUri = toDataUri(resolveAsset(url, DIST_DIR));
    return dataUri ? `${attribute}="${dataUri}"` : match;
  });
}

if (!existsSync(INDEX_HTML)) {
  console.error(`[viewer-template] 未找到 ${INDEX_HTML}，请先执行 MODE=viewer 的构建`);
  process.exit(1);
}

const allFiles = walk(DIST_DIR);
const cssFiles = allFiles.filter((file) => extname(file) === '.css');
const jsFiles = allFiles.filter((file) => extname(file) === '.js');

let html = readFileSync(INDEX_HTML, 'utf8');

/**
 * 1. 收集 HTML 中通过 <script src> 引用的 JS，并保留其原有顺序
 * （默认切分策略下会有多个初始 chunk：lib-react / 应用 vendor / 入口，入口通常最后）
 * 其余未被引用的 JS 即为异步 chunk（JSONP 片段）。
 */
const referencedScripts = [];
{
  const re = /<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    referencedScripts.push(toDistFile(match[1]));
  }
}
if (!referencedScripts.length) {
  console.error('[viewer-template] 未在产物 HTML 中找到 <script src>，模板生成失败');
  process.exit(1);
}
const missingScripts = referencedScripts.filter((file) => !existsSync(join(DIST_DIR, file)));
if (missingScripts.length) {
  console.error(`[viewer-template] 产物缺少脚本文件：${missingScripts.join(', ')}`);
  process.exit(1);
}
const asyncScripts = jsFiles
  .map(toDistRelative)
  .filter((file) => !referencedScripts.includes(file))
  .sort();

/**
 * 2. 样式：移除原有 link，按「入口 CSS 优先」的顺序全部内联。
 * 异步 CSS chunk 提前内联是安全的（同属一个应用），可避免运行时再请求。
 */
const entryCssHref = (html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/) ?? [])[1];
const entryCss = entryCssHref ? toDistFile(entryCssHref) : undefined;
const orderedCss = [entryCss, ...cssFiles.map(toDistRelative).filter((f) => f !== entryCss)]
  .filter(Boolean)
  .sort((a, b) => (a === entryCss ? -1 : b === entryCss ? 1 : a.localeCompare(b)));

html = html.replace(/<link[^>]*href="[^"]+\.css"[^>]*>/g, '');
const cssTags = orderedCss
  .map((file) => {
    const cssPath = join(DIST_DIR, file);
    /**
     * data-href 是 rspack 运行时查找「样式是否已存在」的锚点，取值必须与运行时计算的
     * URL（__webpack_require__.p + 相对路径）完全一致，否则会重新插入 <link> 去请求
     * <assetPrefix>/static/css/async/*.css，离线场景直接失效。
     */
    return `<style data-href="${VIEWER_ASSET_PREFIX}${file}">${inlineCssUrls(
      readFileSync(cssPath, 'utf8'),
      dirname(cssPath)
    )}</style>`;
  })
  .join('');
html = html.replace('</head>', () => `${cssTags}</head>`);

/** 3. 内联 HTML 中剩余的静态资源引用（图标、字体等），必须在脚本内联之前完成 */
html = inlineHtmlAssets(html);

/** 4. 内联脚本：数据占位 + 全部异步 chunk 注入到首个脚本位置，其余 <script src> 按原位替换 */
const inlineCode = (file) =>
  `<script>${readFileSync(file, 'utf8').replace(/<\/script>/g, '<\\/script>')}</script>`;

/**
 * 顺序是关键：数据占位与异步 chunk 必须排在**所有初始 chunk（含入口）之前**。
 *
 * rspack 运行时的 JSONP 初始化会回放数组中已存在的 chunk：
 *   `(a=self.webpackChunk_X=self.webpackChunk_X||[]).forEach(s.bind(null,0))`
 * 因此先执行的异步 chunk 会在运行时安装时被补齐登记（写入模块表并标记为「已加载」），
 * 随后入口启动阶段的动态 import 直接命中缓存，不再请求 /static/js/async/*.js。
 *
 * 若把异步 chunk 放在入口之后，入口启动时的 `__webpack_require__.e` 会先注册 promise
 * 并发起网络请求（离线场景必然失败），导致 ChunkLoadError 与 DI 绑定缺失。
 */
const preludeTags = [
  `<script>${DATA_PLACEHOLDER}</script>`,
  ...asyncScripts.map((file) => inlineCode(join(DIST_DIR, file))),
].join('');

let preludeInjected = false;
/** 注意：替换内容含压缩后的 JS，必须使用函数形式，避免 $& / $' 等替换模式被解释 */
html = html.replace(/<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/g, (_full, url) => {
  const code = inlineCode(join(DIST_DIR, toDistFile(url)));
  if (preludeInjected) {
    return code;
  }
  preludeInjected = true;
  return preludeTags + code;
});

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, html, 'utf8');
console.log(
  `[viewer-template] 已生成 ${OUTPUT_FILE}` +
    `（初始脚本 ${referencedScripts.length} + 异步 chunk ${asyncScripts.length} + CSS ${
      orderedCss.length
    }，${(html.length / 1024).toFixed(0)} KB）`
);
