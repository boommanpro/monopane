#!/usr/bin/env node
/**
 * monopane-build 技能的画布工具链 CLI
 *
 * 把「画布 JSON 怎么写」里的机械约束全部下沉为代码，agent 只负责分析内容：
 *   init     生成骨架：区域容器、原点、默认标题/配色按契约写好
 *   layout   自动布局：子节点不用写坐标，按 blockIDs 顺序行优先填充网格；
 *            支持 data.slot 提示自动归区，缺失的区域容器自动补建
 *   validate 深度校验（委托 validate-canvas.mjs，交付唯一门槛）
 *   build    构建离线单体 HTML（委托 packages/app/scripts/build-standalone.mjs），
 *            构建完自动执行注入等价性核对
 *   check    单独执行「JSON ↔ HTML 注入数据」等价性核对
 *
 * 区域契约与 packages/canvas/src/constants.ts、scripts/validate-canvas.mjs 保持一致（同步修改）。
 *
 * 用法：node canvas.mjs <command> ...
 * 所有命令均可在任意 cwd 下执行：脚本自行向上查找 pnpm-workspace.yaml 定位仓库根。
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const VALIDATE_SCRIPT = join(SCRIPT_DIR, 'validate-canvas.mjs');

/** 区域契约（slot id → 原点/列数/上限/默认标题配色），与 constants.ts 同步 */
const AREAS = {
  'group-db': {
    title: '数据库结构与关联',
    color: 'Blue',
    origin: { x: 0, y: 0 },
    columns: 3,
    limit: 12,
  },
  'group-arch': {
    title: '项目架构',
    color: 'Violet',
    origin: { x: 5600, y: 0 },
    columns: 4,
    limit: 16,
  },
  'group-flow': {
    title: '代码流程',
    color: 'Green',
    origin: { x: 0, y: 5600 },
    columns: 14,
    limit: 20,
  },
  'group-runtime': {
    title: '项目运行逻辑',
    color: 'Orange',
    origin: { x: 5600, y: 5600 },
    columns: 3,
    limit: 12,
  },
  'group-seq': {
    title: '时序图',
    color: 'Cyan',
    origin: { x: 0, y: 11200 },
    columns: 4,
    limit: 12,
  },
  'group-df': {
    title: '数据流图',
    color: 'Indigo',
    origin: { x: 5600, y: 11200 },
    columns: 4,
    limit: 12,
  },
};
const COL_WIDTH = 460;
const ROW_HEIGHT = 380;
/** init --areas 的简写 */
const AREA_ALIASES = {
  db: 'group-db',
  arch: 'group-arch',
  flow: 'group-flow',
  runtime: 'group-runtime',
  seq: 'group-seq',
  df: 'group-df',
};

function fail(message) {
  console.error(`[canvas] ${message}`);
  process.exit(1);
}

/** 从脚本位置向上查找 pnpm-workspace.yaml 定位仓库根 */
function findRepoRoot() {
  let dir = SCRIPT_DIR;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  fail(
    '无法定位 monopane 仓库根（向上未找到 pnpm-workspace.yaml）。请在 monopane 仓库内使用本脚本。'
  );
}

function usage() {
  console.log(`用法：node canvas.mjs <command> [args]

命令：
  init <output.json> [--areas db,arch,flow,runtime,seq,df] [--title <slot>=<标题>]... [--force]
      生成画布骨架。默认建 db/arch/flow/runtime 四个区域（代码仓库模式）；
      --all 等价于 --areas 全量；--title 自定义区域标题（如 --title flow=核心流程）。
  layout <canvas.json>
      自动布局（已有 meta.position 的不动）：
      flow 区域按拓扑分层——列 = 流程深度、主路径一条直线（row 0）、分支按深度下挂；
      其余区域按 blockIDs 顺序行优先填充网格。
      子节点可写 data.slot: "group-flow" 代替手工填 blockIDs，缺失的区域容器自动补建。
  validate <canvas.json>
      深度校验（结构、字段、连线、启发式防呆），交付唯一门槛。
  build <canvas.json> [output.html]
      构建离线单体 HTML，完成后自动核对注入数据与 JSON 的等价性。
  check <canvas.json> <output.html>
      单独执行等价性核对：比对 HTML 内 window.__CANVAS_DATA__ 与输入 JSON 的节点/连线。`);
}

function loadDoc(file) {
  const raw = JSON.parse(readFileSync(resolve(file), 'utf8'));
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.nodes)) {
    fail(`${file} 不是合法的画布 JSON（缺少 nodes 数组）`);
  }
  return raw;
}

function saveDoc(file, doc) {
  writeFileSync(resolve(file), `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
}

function resolveSlot(token) {
  const slot = AREA_ALIASES[token] ?? token;
  if (!AREAS[slot]) {
    fail(
      `未知区域「${token}」，可用：${Object.keys(AREA_ALIASES).join(
        ' / '
      )} 或完整 slot id（${Object.keys(AREAS).join(' / ')}）`
    );
  }
  return slot;
}

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

function cmdInit(args) {
  const output = args[0];
  if (!output || output.startsWith('--')) fail('init 需要 <output.json> 参数');
  if (existsSync(resolve(output)) && !args.includes('--force')) {
    fail(`文件已存在：${output}（确认覆盖请加 --force）`);
  }

  let areaTokens = ['db', 'arch', 'flow', 'runtime'];
  const titles = new Map();
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') areaTokens = Object.keys(AREA_ALIASES);
    else if (arg === '--areas') {
      const next = args[++i];
      if (!next) fail('--areas 需要逗号分隔的区域列表');
      areaTokens = next
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (arg === '--title') {
      const next = args[++i];
      if (!next || !next.includes('=')) fail('--title 需要 <slot>=<标题> 形式');
      const eq = next.indexOf('=');
      titles.set(resolveSlot(next.slice(0, eq)), next.slice(eq + 1));
    } else if (arg === '--force') {
      // 已处理
    } else {
      fail(`init 无法识别的参数：${arg}`);
    }
  }

  const nodes = areaTokens.map((token) => {
    const slot = resolveSlot(token);
    const spec = AREAS[slot];
    return {
      id: slot,
      type: 'group',
      meta: { position: { ...spec.origin } },
      data: {
        parentID: 'root',
        title: titles.get(slot) ?? spec.title,
        color: spec.color,
        blockIDs: [],
      },
    };
  });

  saveDoc(output, { schemaVersion: '1.1', nodes, edges: [] });
  console.log(`[canvas] 骨架已生成：${resolve(output)}`);
  console.log(
    `[canvas] 区域：${nodes
      .map((n) => `${n.data.title}(${n.id} @${n.meta.position.x},${n.meta.position.y})`)
      .join('、')}`
  );
  console.log(
    '[canvas] 下一步：在 nodes 里添加子节点与连线（不写坐标、不动容器），然后执行 layout。'
  );
}

// ---------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------

/**
 * 流程区拓扑布局（与 packages/canvas/src/graph.ts 的 layoutFlowByTopology 同步）：
 * 1. Kahn 分层：col = 最长路径深度（flow-start 第 0 列）
 * 2. 主路径（decision 按 defaultBranch、其余按距 flow-end 最近）全部占 row 0，一条水平直线
 * 3. 其余节点按到主路径的无向 BFS 距离下挂（一级分支 row 1，二级 row 2…）
 * 4. 同格冲突向下顺延；环内节点回退顺序占位
 */
function layoutFlowGrid(children, edges, report) {
  const byId = new Map(children.map((node) => [node.id, node]));
  const idSet = new Set(children.map((node) => node.id));
  const flowEdges = edges.filter(
    (edge) =>
      edge?.data?.kind === 'flow' && idSet.has(edge.sourceNodeID) && idSet.has(edge.targetNodeID)
  );
  const out = new Map();
  const inn = new Map();
  for (const edge of flowEdges) {
    if (!out.has(edge.sourceNodeID)) out.set(edge.sourceNodeID, []);
    out.get(edge.sourceNodeID).push(edge);
    if (!inn.has(edge.targetNodeID)) inn.set(edge.targetNodeID, []);
    inn.get(edge.targetNodeID).push(edge);
  }

  // Kahn 拓扑 + 最长路径分层
  const level = new Map();
  const indegree = new Map(children.map((node) => [node.id, inn.get(node.id)?.length ?? 0]));
  const queue = children.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((n) => n.id);
  queue.forEach((id) => level.set(id, 0));
  while (queue.length) {
    const current = queue.shift();
    for (const edge of out.get(current) ?? []) {
      const next = edge.targetNodeID;
      level.set(next, Math.max(level.get(next) ?? 0, (level.get(current) ?? 0) + 1));
      const remain = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remain);
      if (remain === 0) queue.push(next);
    }
  }
  const cyclic = children.filter((node) => !level.has(node.id)).map((n) => n.id);
  if (cyclic.length) {
    report.push(`警告：flow 区域存在环（${cyclic.join('、')}），环内节点按顺序回退占位`);
  }

  // 主路径推导
  const mainPath = [];
  const startNode = children.find((node) => node?.type === 'flow-start');
  if (startNode) {
    const endNode = children.find((node) => node?.type === 'flow-end');
    const distToEnd = new Map();
    if (endNode) {
      distToEnd.set(endNode.id, 0);
      const bfs = [endNode.id];
      while (bfs.length) {
        const current = bfs.shift();
        for (const edge of inn.get(current) ?? []) {
          const prev = edge.sourceNodeID;
          if (!distToEnd.has(prev)) {
            distToEnd.set(prev, distToEnd.get(current) + 1);
            bfs.push(prev);
          }
        }
      }
    }
    const visited = new Set([startNode.id]);
    mainPath.push(startNode.id);
    let cursor = startNode.id;
    for (let guard = 0; guard <= children.length; guard++) {
      const outs = out.get(cursor) ?? [];
      if (!outs.length) break;
      const node = byId.get(cursor);
      let next;
      if (node?.type === 'flow-decision' && node.data?.defaultBranch) {
        next = outs.find((edge) => edge.sourcePortID === node.data?.defaultBranch)?.targetNodeID;
      }
      if (!next) {
        const ranked = [...outs].sort(
          (a, b) =>
            (distToEnd.get(a.targetNodeID) ?? Infinity) -
            (distToEnd.get(b.targetNodeID) ?? Infinity)
        );
        next = ranked[0]?.targetNodeID;
      }
      if (!next || visited.has(next)) break;
      mainPath.push(next);
      visited.add(next);
      if (endNode && next === endNode.id) break;
      cursor = next;
    }
  }

  // 无向 BFS：到主路径的距离
  const undirected = new Map();
  const link = (a, b) => {
    if (!undirected.has(a)) undirected.set(a, []);
    undirected.get(a).push(b);
  };
  for (const edge of flowEdges) {
    link(edge.sourceNodeID, edge.targetNodeID);
    link(edge.targetNodeID, edge.sourceNodeID);
  }
  const depth = new Map(mainPath.map((id) => [id, 0]));
  let frontier = [...mainPath];
  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      for (const neighbor of undirected.get(id) ?? []) {
        if (!depth.has(neighbor)) {
          depth.set(neighbor, depth.get(id) + 1);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  // 网格分配（跳过已有坐标的节点；同格向下顺延）
  const occupied = new Set();
  const grid = new Map();
  const place = (id, col, row) => {
    let r = row;
    while (occupied.has(`${col},${r}`)) r += 1;
    occupied.add(`${col},${r}`);
    grid.set(id, { col, row: r });
  };
  for (const child of children) {
    const pos = child.meta?.position;
    if (pos && pos.x % COL_WIDTH === 0 && pos.y % ROW_HEIGHT === 0 && pos.x >= 0 && pos.y >= 0) {
      occupied.add(`${pos.x / COL_WIDTH},${pos.y / ROW_HEIGHT}`);
    }
  }
  mainPath.forEach((id) => {
    if (level.has(id)) place(id, level.get(id), 0);
  });
  for (const child of children) {
    if (grid.has(child.id) || !level.has(child.id)) continue;
    place(child.id, level.get(child.id), depth.get(child.id) ?? 0);
  }
  let fallbackRow = Math.max(0, ...Array.from(grid.values()).map((p) => p.row)) + 1;
  for (const id of cyclic) {
    place(id, 0, fallbackRow);
    fallbackRow += 1;
  }
  return { grid, mainPath };
}

function cmdLayout(file) {
  if (!file) fail('layout 需要 <canvas.json> 参数');
  const doc = loadDoc(file);
  const groups = doc.nodes.filter((node) => node?.type === 'group');
  const bySlot = new Map(groups.map((group) => [group.id, group]));

  for (const group of groups) {
    if (!AREAS[group.id])
      fail(`未知区域容器 id「${group.id}」，必须是：${Object.keys(AREAS).join(' / ')}`);
  }

  // 归区：已在 blockIDs 里的直接登记；带 data.slot 提示的自动接线；都没有则报错
  const childRegion = new Map();
  for (const group of groups) {
    for (const id of group.data?.blockIDs ?? []) childRegion.set(id, group.id);
  }
  let rewired = 0;
  const created = [];
  const unplaced = [];
  for (const node of doc.nodes) {
    if (!node || node.type === 'group') continue;
    const hint = node.data?.slot;
    if (childRegion.has(node.id)) {
      if (hint && hint !== childRegion.get(node.id)) {
        console.log(
          `[canvas] 提示：${node.id} 的 data.slot(${hint}) 与实际容器(${childRegion.get(
            node.id
          )})不一致，以实际容器为准`
        );
      }
      if (hint !== undefined) delete node.data.slot;
      continue;
    }
    if (hint === undefined) {
      unplaced.push(node.id);
      continue;
    }
    const slot = resolveSlot(hint);
    let group = bySlot.get(slot);
    if (!group) {
      const spec = AREAS[slot];
      group = {
        id: slot,
        type: 'group',
        meta: { position: { ...spec.origin } },
        data: { parentID: 'root', title: spec.title, color: spec.color, blockIDs: [] },
      };
      doc.nodes.push(group);
      bySlot.set(slot, group);
      created.push(slot);
    }
    group.data.blockIDs.push(node.id);
    childRegion.set(node.id, slot);
    delete node.data.slot;
    rewired++;
  }
  if (unplaced.length) {
    fail(
      `以下节点既不在任何容器的 blockIDs 里，也没有 data.slot 提示：${unplaced.join('、')}。` +
        `请把它们加进某区域的 data.blockIDs，或给节点加 data.slot（如 "group-flow"）`
    );
  }

  const allGroups = groups.concat(created.map((slot) => bySlot.get(slot)));
  const reports = [];
  let assigned = 0;

  // 布点：flow 区域按拓扑分层（列 = 流程深度，主路径直线，分支下挂）；其余区域行优先
  for (const group of allGroups) {
    const spec = AREAS[group.id];
    const children = (group.data?.blockIDs ?? [])
      .map((id) => doc.nodes.find((n) => n?.id === id))
      .filter(Boolean);

    if (group.id === 'group-flow' && children.some((child) => !child.meta?.position)) {
      const { grid, mainPath } = layoutFlowGrid(children, doc.edges ?? [], reports);
      for (const child of children) {
        if (child.meta?.position) continue;
        const cell = grid.get(child.id);
        if (!cell) continue;
        child.meta = {
          ...(child.meta ?? {}),
          position: { x: cell.col * COL_WIDTH, y: cell.row * ROW_HEIGHT },
        };
        assigned++;
      }
      reports.push(
        `flow 区域拓扑布局：${grid.size} 节点分层完成，主路径 ${mainPath.length} 步（${
          mainPath[0] ?? '-'
        } → ${mainPath[mainPath.length - 1] ?? '-'}）`
      );
      continue;
    }

    const occupied = new Set();
    for (const child of children) {
      const pos = child.meta?.position;
      if (!pos) continue;
      if (pos.x % COL_WIDTH !== 0 || pos.y % ROW_HEIGHT !== 0 || pos.x < 0 || pos.y < 0) {
        console.log(
          `[canvas] 警告：${child.id} 保留了不在网格上的手工坐标 {x:${pos.x},y:${pos.y}}，validate 将会报错`
        );
        continue;
      }
      occupied.add(`${pos.x / COL_WIDTH},${pos.y / ROW_HEIGHT}`);
    }
    let cursor = { col: 0, row: 0 };
    for (const child of children) {
      if (child.meta?.position) continue;
      while (occupied.has(`${cursor.col},${cursor.row}`)) {
        cursor.col++;
        if (cursor.col >= spec.columns) {
          cursor.col = 0;
          cursor.row++;
        }
      }
      child.meta = {
        ...(child.meta ?? {}),
        position: { x: cursor.col * COL_WIDTH, y: cursor.row * ROW_HEIGHT },
      };
      occupied.add(`${cursor.col},${cursor.row}`);
      cursor.col++;
      if (cursor.col >= spec.columns) {
        cursor.col = 0;
        cursor.row++;
      }
      assigned++;
    }
  }

  saveDoc(file, doc);
  const stats = allGroups.map((group) => {
    const ids = group.data?.blockIDs ?? [];
    const count = ids.filter((id) => doc.nodes.find((n) => n?.id === id)?.type !== 'note').length;
    return `${group.data?.title ?? group.id} ${count}/${AREAS[group.id]?.limit ?? '?'}`;
  });
  if (created.length) console.log(`[canvas] 自动补建区域容器：${created.join('、')}`);
  if (rewired) console.log(`[canvas] 按 data.slot 自动归区 ${rewired} 个节点`);
  console.log(`[canvas] 已分配坐标 ${assigned} 个（手工坐标保持不变）`);
  reports.forEach((line) => console.log(`[canvas] ${line}`));
  console.log(`[canvas] 区域用量：${stats.join('　')}`);
  console.log('[canvas] 下一步：node canvas.mjs validate ' + file);
}

// ---------------------------------------------------------------------------
// validate / build / check
// ---------------------------------------------------------------------------

function cmdValidate(file) {
  if (!file) fail('validate 需要 <canvas.json> 参数');
  const result = spawnSync(process.execPath, [VALIDATE_SCRIPT, file], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

function cmdBuild(file, outputArg) {
  if (!file) fail('build 需要 <canvas.json> 参数');
  const repoRoot = findRepoRoot();
  const buildScript = join(repoRoot, 'packages', 'app', 'scripts', 'build-standalone.mjs');
  if (!existsSync(buildScript)) fail(`构建脚本不存在：${buildScript}`);
  const result = spawnSync(
    process.execPath,
    [buildScript, file, ...(outputArg ? [outputArg] : [])],
    {
      stdio: 'inherit',
    }
  );
  if (result.status !== 0) fail('构建失败（见上方日志）');

  const htmlPath = outputArg ? resolve(outputArg) : resolve(file).replace(/\.[^.]+$/, '.html');
  console.log('[canvas] 构建完成，自动执行等价性核对...');
  const ok = checkEquivalence(file, htmlPath);
  process.exit(ok ? 0 : 1);
}

/** 从 HTML 中提取 window.__CANVAS_DATA__ = {...}（字符串感知的花括号配对） */
function extractInjectedData(html) {
  const MARK = 'window.__CANVAS_DATA__ = ';
  const markAt = html.indexOf(MARK);
  if (markAt === -1) return null;
  let i = markAt + MARK.length;
  while (i < html.length && html[i] !== '{') i++;
  if (i >= html.length) return null;
  const start = i;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

function checkEquivalence(file, htmlPath) {
  const input = loadDoc(file);
  const expectedNodes = input.nodes;
  const expectedEdges = input.edges ?? [];

  if (!existsSync(htmlPath)) fail(`HTML 产物不存在：${htmlPath}`);
  const html = readFileSync(htmlPath, 'utf8');
  const injectedRaw = extractInjectedData(html);
  if (!injectedRaw) {
    fail(`等价性核对失败：${htmlPath} 中找不到 window.__CANVAS_DATA__ 注入数据（注入可能失败）`);
  }
  let injected;
  try {
    injected = JSON.parse(injectedRaw);
  } catch (error) {
    fail(`等价性核对失败：注入数据不是合法 JSON（${error.message}）`);
  }

  const problems = [];
  const compare = (label, expected, actual) => {
    if (JSON.stringify(expected) === JSON.stringify(actual)) return;
    problems.push(label);
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      problems.push(`  ${label} 结构异常`);
      return;
    }
    if (expected.length !== actual.length) {
      problems.push(`  ${label} 数量不一致：JSON ${expected.length} vs HTML ${actual.length}`);
    }
    const byId = new Map(actual.filter((item) => item && item.id).map((item) => [item.id, item]));
    for (const item of expected) {
      if (!item?.id) continue;
      const mirror = byId.get(item.id);
      if (!mirror) {
        problems.push(`  ${label} 缺少：${item.id}`);
      } else if (JSON.stringify(item) !== JSON.stringify(mirror)) {
        problems.push(`  ${label} 内容不一致：${item.id}`);
      }
    }
  };
  compare('节点', expectedNodes, injected.nodes);
  compare('连线', expectedEdges, injected.edges ?? []);

  const size = (html.length / 1024).toFixed(0);
  if (html.length < 100 * 1024) {
    problems.push(`  HTML 体积 ${size} KB 明显偏小，可能模板未内联完整`);
  }

  console.log(
    `[canvas] 产物：${htmlPath}（${size} KB，节点 ${injected.nodes?.length ?? '?'} + 连线 ${
      injected.edges?.length ?? '?'
    }）`
  );
  if (problems.length) {
    console.error('[canvas] 等价性核对未通过：');
    problems.forEach((p) => console.error(`[canvas] ${p}`));
    return false;
  }
  console.log('[canvas] 等价性核对通过：HTML 注入数据与 JSON 完全一致');
  return true;
}

function cmdCheck(file, htmlPath) {
  if (!file || !htmlPath) fail('check 需要 <canvas.json> <output.html> 两个参数');
  process.exit(checkEquivalence(file, htmlPath) ? 0 : 1);
}

// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);
switch (command) {
  case 'init':
    cmdInit(args);
    break;
  case 'layout':
    cmdLayout(args[0]);
    break;
  case 'validate':
    cmdValidate(args[0]);
    break;
  case 'build':
    cmdBuild(args[0], args[1] && !args[1].startsWith('--') ? args[1] : undefined);
    break;
  case 'check':
    cmdCheck(args[0], args[1]);
    break;
  case 'help':
  case undefined:
    usage();
    break;
  default:
    fail(`未知命令「${command}」\n\n${usage()}`);
}
