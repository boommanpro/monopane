#!/usr/bin/env node
/**
 * 画布产物自检脚本 —— 校验 Canvas Schema v1.1（见 docs/canvas-schema.md 第 5 节）
 *
 * 用法：node scripts/validate-canvas.mjs <canvas.json>
 * 退出码：0 = 通过（可能有警告），1 = 存在错误
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TYPES = new Set([
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

const CATEGORIES = new Set([
  'frontend',
  'gateway',
  'service',
  'database',
  'cache',
  'queue',
  'storage',
  'thirdparty',
  'other',
]);

const FIELD_FLAGS = new Set(['pk', 'fk', 'unique', 'nullable']);
const RELATIONS = new Set(['1:1', '1:N', 'N:N']);
const EDGE_KINDS = new Set(['db-relation', 'dependency', 'flow']);

/** 区域容器契约（按容器 id / slot）：原点、列数、节点上限、默认标题配色 */
const REGIONS = {
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
    columns: 3,
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

const errors = [];
const warnings = [];
const infos = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const info = (msg) => infos.push(msg);

const file = process.argv[2];
if (!file) {
  console.error('用法：node scripts/validate-canvas.mjs <canvas.json>');
  process.exit(1);
}

let doc;
try {
  doc = JSON.parse(readFileSync(resolve(file), 'utf8'));
} catch (error) {
  console.error(`读取失败：${error.message}`);
  process.exit(1);
}

// 1. 顶层结构
if (doc.schemaVersion !== '1.1') {
  err(`schemaVersion 应为 "1.1"，实际为 ${JSON.stringify(doc.schemaVersion)}`);
}
if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) {
  err('nodes / edges 必须都是数组');
  report();
}
if (!doc.nodes.length) {
  warn('nodes 为空：画布没有任何内容');
}

// 索引
const byId = new Map();
doc.nodes.forEach((node, index) => {
  if (!node || typeof node.id !== 'string' || !node.id) {
    err(`nodes[${index}] 缺少合法 id`);
    return;
  }
  if (byId.has(node.id)) {
    err(`节点 id 重复：${node.id}`);
    return;
  }
  byId.set(node.id, node);
});

// 2. 区域容器
const groups = doc.nodes.filter((node) => node?.type === 'group');
const childRegion = new Map(); // 子节点 id → 区域 slot id
const regionOfSlot = new Map(); // slot id → 区域容器节点

groups.forEach((group) => {
  const spec = REGIONS[group.id];
  if (!spec) {
    err(`未知区域容器 id「${group.id}」，必须是：${Object.keys(REGIONS).join(' / ')}`);
    return;
  }
  regionOfSlot.set(group.id, group);

  if (typeof group.data?.title !== 'string' || !group.data.title.trim()) {
    err(`区域「${group.id}」缺少 data.title（标题自由命名，但必须是非空字符串）`);
  }
  if (!group.data?.color) err(`区域「${group.id}」缺少 data.color`);

  const pos = group.meta?.position;
  if (!pos || pos.x !== spec.origin.x || pos.y !== spec.origin.y) {
    err(
      `区域「${spec.title}」原点应为 {x:${spec.origin.x},y:${
        spec.origin.y
      }}，实际为 ${JSON.stringify(pos)}`
    );
  }
  if (group.meta?.size) {
    warn(`区域「${spec.title}」写了 meta.size，容器尺寸应由引擎自适应，建议删除`);
  }
  if (!Array.isArray(group.data?.blockIDs)) {
    err(`区域「${spec.title}」缺少 data.blockIDs 数组`);
    return;
  }

  group.data.blockIDs.forEach((id) => {
    if (!byId.has(id)) {
      err(`区域「${spec.title}」的 blockIDs 引用了不存在的节点：${id}`);
      return;
    }
    if (childRegion.has(id)) {
      err(`节点 ${id} 同时属于多个区域容器，一个节点只能属于一个容器`);
      return;
    }
    childRegion.set(id, group.id);
  });

  const counted = group.data.blockIDs.filter((id) => byId.get(id)?.type !== 'note').length;
  if (counted > spec.limit) {
    err(`区域「${spec.title}」节点数 ${counted} 超过上限 ${spec.limit}，需要截断并放 note 说明`);
  }
});

if (regionOfSlot.size === 0) {
  err(
    '画布没有任何区域容器，至少需要一个（group-db / group-arch / group-flow / group-runtime / group-seq / group-df）'
  );
}

// 3. 节点字段校验
const startByRegion = new Map();
doc.nodes.forEach((node) => {
  const { id, type } = node;
  if (!TYPES.has(type)) {
    err(`节点 ${id} 的 type「${type}」不合法`);
    return;
  }
  if (type !== 'group' && !childRegion.has(id)) {
    err(`节点 ${id} 不在任何区域容器的 blockIDs 中（会飘在画布上）`);
  }

  const data = node.data ?? {};
  switch (type) {
    case 'db-table': {
      if (!data.title) err(`表节点 ${id} 缺少 data.title`);
      if (!Array.isArray(data.fields) || !data.fields.length) {
        err(`表节点 ${id} 的 data.fields 必须是非空数组`);
        break;
      }
      if (data.fields.length > 20) {
        warn(`表节点 ${id} 有 ${data.fields.length} 个字段，建议截取关键字段并在 comment 里说明`);
      }
      const pkCount = data.fields.filter((f) => f?.flags?.includes('pk')).length;
      if (pkCount === 0) warn(`表节点 ${id} 没有 pk 字段，确认是否符合预期`);
      data.fields.forEach((field, i) => {
        if (!field?.name) err(`表节点 ${id} 的 fields[${i}] 缺少 name`);
        if (!field?.type) err(`表节点 ${id} 的 fields[${i}] 缺少 type`);
        (field?.flags ?? []).forEach((flag) => {
          if (!FIELD_FLAGS.has(flag))
            err(`表节点 ${id} 的字段 ${field.name} 有非法 flags：${flag}`);
        });
      });
      break;
    }
    case 'db-view': {
      if (!data.title) err(`视图节点 ${id} 缺少 data.title`);
      if (data.fields === undefined) break;
      if (!Array.isArray(data.fields)) {
        err(`视图节点 ${id} 的 data.fields 必须是数组`);
        break;
      }
      data.fields.forEach((field, i) => {
        if (!field?.name) err(`视图节点 ${id} 的 fields[${i}] 缺少 name`);
        if (!field?.type) err(`视图节点 ${id} 的 fields[${i}] 缺少 type`);
        (field?.flags ?? []).forEach((flag) => {
          if (!FIELD_FLAGS.has(flag))
            err(`视图节点 ${id} 的字段 ${field.name} 有非法 flags：${flag}`);
        });
      });
      break;
    }
    case 'arch-component': {
      if (!data.title) err(`架构节点 ${id} 缺少 data.title`);
      if (!CATEGORIES.has(data.category)) {
        err(`架构节点 ${id} 的 category「${data.category}」不合法`);
      }
      if (Array.isArray(data.tech) && data.tech.length > 4) {
        warn(`架构节点 ${id} 的 tech 标签超过 4 个，建议只留最重要的`);
      }
      break;
    }
    case 'flow-start':
    case 'flow-end':
    case 'flow-step':
    case 'flow-subprocess':
    case 'flow-parallel':
    case 'flow-delay':
    case 'flow-notify':
    case 'runtime-event':
    case 'runtime-scheduled': {
      if (!data.title) err(`流程节点 ${id} 缺少 data.title`);
      if (type === 'flow-start') {
        const slotId = childRegion.get(id);
        if (slotId) {
          const title = REGIONS[slotId]?.title ?? slotId;
          startByRegion.set(slotId, (startByRegion.get(slotId) ?? 0) + 1);
          if (startByRegion.get(slotId) > 1) err(`区域「${title}」放了多个 flow-start，只能有一个`);
        }
      }
      break;
    }
    case 'flow-decision': {
      if (!data.title) err(`判断节点 ${id} 缺少 data.title`);
      if (data.defaultBranch !== 'yes' && data.defaultBranch !== 'no') {
        err(`判断节点 ${id} 的 defaultBranch 必须是 "yes" 或 "no"`);
      }
      break;
    }
    case 'seq-participant': {
      if (!data.title) err(`参与者节点 ${id} 缺少 data.title`);
      break;
    }
    case 'seq-message': {
      if (!data.title) err(`消息节点 ${id} 缺少 data.title`);
      break;
    }
    case 'df-source':
    case 'df-transform':
    case 'df-store': {
      if (!data.title) err(`数据流节点 ${id} 缺少 data.title`);
      break;
    }
    case 'note': {
      if (typeof data.note !== 'string' || !data.note.trim()) {
        err(`便签节点 ${id} 的 data.note 必须是非空字符串`);
        break;
      }
      // 便签文字溢出启发式：按 CJK 16px 宽 + 行高 24px 估算所需行数，超出尺寸高度则 warn。
      // 校验器无法精确知道渲染高度，这只是防呆提示（经验值：420×320 约可容 120 字）。
      const size = data.size ?? { width: 240, height: 150 };
      const textWidth = [...data.note].reduce(
        (sum, ch) => sum + (ch.codePointAt(0) > 0x2e80 ? 1 : 0.55),
        0
      );
      const charsPerLine = Math.max(1, Math.floor((size.width - 20) / 16));
      const linesNeeded = Math.ceil(textWidth / charsPerLine);
      const linesFitting = Math.max(1, Math.floor((size.height - 12) / 24));
      if (linesNeeded > linesFitting) {
        warn(
          `便签节点 ${id} 约 ${linesNeeded} 行文字超过尺寸 ${size.width}×${size.height} 可容纳的 ${linesFitting} 行，渲染会被截断；建议增大 size（约 420×320 可容 120 字）`
        );
      }
      break;
    }
    case 'group':
      break;
  }

  // 4. 子节点网格坐标
  if (type !== 'group') {
    const pos = node.meta?.position;
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      err(`节点 ${id} 缺少 meta.position`);
    } else {
      if (pos.x % COL_WIDTH !== 0 || pos.y % ROW_HEIGHT !== 0) {
        err(
          `节点 ${id} 坐标 {x:${pos.x},y:${pos.y}} 不符合网格：应满足 x % ${COL_WIDTH} === 0 且 y % ${ROW_HEIGHT} === 0`
        );
      }
      const columns = REGIONS[childRegion.get(id)]?.columns;
      if (columns && pos.x >= columns * COL_WIDTH) {
        warn(`节点 ${id} 超出所在区域的 ${columns} 列范围（x=${pos.x}）`);
      }
      if (pos.x < 0 || pos.y < 0) {
        err(`节点 ${id} 坐标为负，子节点坐标必须相对容器且非负`);
      }
    }
  }
});

// 5. 连线
doc.edges.forEach((edge, index) => {
  const label = edge?.data?.label ?? `${edge?.sourceNodeID} → ${edge?.targetNodeID}`;
  const kind = edge?.data?.kind;
  if (!EDGE_KINDS.has(kind)) err(`edges[${index}]（${label}）的 kind「${kind}」不合法`);

  const source = byId.get(edge?.sourceNodeID);
  const target = byId.get(edge?.targetNodeID);
  if (!source) err(`edges[${index}] 的 sourceNodeID 不存在：${edge?.sourceNodeID}`);
  if (!target) err(`edges[${index}] 的 targetNodeID 不存在：${edge?.targetNodeID}`);
  if (!source || !target) return;

  if (source.id === target.id) err(`连线自环：${source.id}`);
  if (source.type === 'group' || target.type === 'group') {
    err(`连线不能连接区域容器：${label}`);
  }

  const from = childRegion.get(source.id);
  const to = childRegion.get(target.id);
  if (from && to && from !== to) {
    err(`跨区域连线：${source.id}(${from}) → ${target.id}(${to})`);
  }

  if (kind === 'db-relation' && !RELATIONS.has(edge?.data?.relation)) {
    err(`表关联 ${label} 缺少合法的 relation（1:1 / 1:N / N:N）`);
  }
  if (
    (kind === 'flow' || kind === 'dependency') &&
    typeof edge?.data?.label === 'string' &&
    edge.data.label.length > 10
  ) {
    warn(
      `连线 ${label} 的标签 ${edge.data.label.length} 字过长，可能被节点卡片遮挡；建议 ≤ 6-8 字或把语义挪到节点 description`
    );
  }
  if (kind === 'flow' && source.type === 'flow-decision') {
    const port = edge?.sourcePortID;
    if (port !== 'yes' && port !== 'no') {
      err(`判断节点 ${source.id} 的出边缺少 sourcePortID（应为 "yes" 或 "no"）：${label}`);
    }
  }
  if (kind !== 'flow' && edge?.sourcePortID) {
    warn(`非 flow 连线 ${label} 带了 sourcePortID，可能无效`);
  }
});

// 6. 同区域同坐标碰撞：两个子节点若写了相同 (x, y)，渲染会直接叠卡
const posByRegion = new Map();
doc.nodes.forEach((node) => {
  if (node.type === 'group') return;
  const region = childRegion.get(node.id);
  const pos = node.meta?.position;
  if (!region || !pos) return;
  const key = `${region}@${pos.x},${pos.y}`;
  if (!posByRegion.has(key)) posByRegion.set(key, []);
  posByRegion.get(key).push(node.id);
});
for (const [key, ids] of posByRegion) {
  if (ids.length > 1) {
    const [region, pos] = key.split('@');
    warn(
      `同区域坐标碰撞：${ids.join('、')} 都位于区域 ${region} 的 {${pos}}，会叠卡渲染，请错开坐标`
    );
  }
}

// 7. 流程链可达性：flow-start 出发能否到达 flow-end；flow-decision 的 yes/no 出边是否齐全
const flowOutEdges = new Map();
doc.edges.forEach((edge) => {
  if (edge?.data?.kind !== 'flow') return;
  if (!flowOutEdges.has(edge.sourceNodeID)) flowOutEdges.set(edge.sourceNodeID, []);
  flowOutEdges.get(edge.sourceNodeID).push(edge);
});
const flowRegions = new Set(
  doc.nodes
    .filter((node) => node.type === 'flow-start' && childRegion.has(node.id))
    .map((node) => childRegion.get(node.id))
);
for (const region of flowRegions) {
  const regionTitle = REGIONS[region]?.title ?? region;
  const starts = doc.nodes.filter(
    (node) => node.type === 'flow-start' && childRegion.get(node.id) === region
  );
  const ends = doc.nodes.filter(
    (node) => node.type === 'flow-end' && childRegion.get(node.id) === region
  );
  if (!starts.length || !ends.length) continue;
  // BFS：从 flow-start 沿 flow 出边遍历
  const visited = new Set();
  const queue = starts.map((node) => node.id);
  for (const id of queue) visited.add(id);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of flowOutEdges.get(current) ?? []) {
      if (!visited.has(edge.targetNodeID)) {
        visited.add(edge.targetNodeID);
        queue.push(edge.targetNodeID);
      }
    }
  }
  const unreachable = ends.map((node) => node.id).filter((id) => !visited.has(id));
  if (unreachable.length) {
    warn(
      `区域「${regionTitle}」的 flow-end（${unreachable.join(
        '、'
      )}）从 flow-start 出发不可达，请检查连线方向`
    );
  }
}
doc.nodes.forEach((node) => {
  if (node.type !== 'flow-decision') return;
  const outs = flowOutEdges.get(node.id) ?? [];
  if (!outs.length) {
    warn(`判断节点 ${node.id} 没有任何 flow 出边，流程可能在此中断，确认是否符合预期`);
    return;
  }
  const ports = new Set(outs.map((edge) => edge?.sourcePortID));
  for (const port of ['yes', 'no']) {
    if (!ports.has(port)) {
      warn(
        `判断节点 ${node.id} 缺少 "${port}" 分支出边（现有端口：${[...ports].join('/') || '无'}）`
      );
    }
  }
});

// 8. 孤立节点提示（除 note / group 外无任何连线的节点）。
//    按区域语义分级：架构/数据库区域（能力地图、独立表）不连线是正常设计 → info；
//    流程/时序/数据流区域里断链则通常是问题 → warn。
const linked = new Set();
doc.edges.forEach((edge) => {
  linked.add(edge?.sourceNodeID);
  linked.add(edge?.targetNodeID);
});
const islands = doc.nodes.filter(
  (node) => node.type !== 'group' && node.type !== 'note' && !linked.has(node.id)
);
if (islands.length) {
  const infoIslands = islands.filter((node) => {
    const region = childRegion.get(node.id);
    return region === 'group-arch' || region === 'group-db';
  });
  const warnIslands = islands.filter((node) => !infoIslands.includes(node));
  if (warnIslands.length) {
    warn(`以下节点没有任何连线（确认是否符合预期）：${warnIslands.map((n) => n.id).join('、')}`);
  }
  if (infoIslands.length) {
    info(
      `以下节点无连线（位于架构/数据库区域，独立项属正常设计，仅供参考）：${infoIslands
        .map((n) => n.id)
        .join('、')}`
    );
  }
}

report();

function report() {
  const regionStats = [...regionOfSlot.entries()].map(([slotId, group]) => {
    const ids = Array.isArray(group.data?.blockIDs) ? group.data.blockIDs : [];
    const nodes = ids.filter((id) => byId.get(id)?.type !== 'note').length;
    const title =
      typeof group.data?.title === 'string' && group.data.title.trim()
        ? group.data.title
        : REGIONS[slotId]?.title ?? slotId;
    return `${title} ${nodes}/${REGIONS[slotId]?.limit ?? '?'}`;
  });

  console.log(`文件：${resolve(file)}`);
  console.log(`节点 ${doc.nodes?.length ?? 0} 个，连线 ${doc.edges?.length ?? 0} 条`);
  console.log(`区域用量：${regionStats.join('　')}`);
  warnings.forEach((msg) => console.log(`警告：${msg}`));
  infos.forEach((msg) => console.log(`提示：${msg}`));
  errors.forEach((msg) => console.log(`错误：${msg}`));

  if (errors.length) {
    console.log(`\n校验未通过：${errors.length} 个错误、${warnings.length} 个警告`);
    process.exit(1);
  }
  console.log(`\n校验通过：0 个错误、${warnings.length} 个警告`);
  process.exit(0);
}
