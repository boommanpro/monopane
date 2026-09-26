/**
 * 四大区域契约与网格常量
 *
 * 这里是「区域怎么摆」的唯一代码化来源：
 * - docs/canvas-schema.md 第 2 节（数据契约文档）
 * - .trae/skills/project-canvas-gen（解析 Skill 的产出规范）
 * - packages/canvas/src/__tests__（不变量测试）
 * 三者必须与本文件保持一致。
 */

/** 子节点网格：列宽 = 节点卡宽 360 + 间距 100 */
export const GRID_COLUMN_WIDTH = 460;

/** 子节点网格：行高 */
export const GRID_ROW_HEIGHT = 380;

/** 单个区域的排布契约 */
export interface AreaSpec {
  /** 区域容器节点 id */
  id: string;
  /** 区域容器标题（data.title） */
  title: string;
  /** 区域容器配色（data.color） */
  color: string;
  /** 区域容器绝对原点（meta.position） */
  origin: { x: number; y: number };
  /** 子节点列数上限 */
  columns: number;
  /** 子节点数量上限（不含 note） */
  limit: number;
  /** 区域内填充顺序说明 */
  fillOrder: string;
}

/** 四大区域：左上数据库、右上架构、左下流程、右下运行逻辑；第二行左侧时序图、右侧数据流图 */
export const AREAS: readonly AreaSpec[] = [
  {
    id: 'group-db',
    title: '数据库结构与关联',
    color: 'Blue',
    origin: { x: 0, y: 0 },
    columns: 3,
    limit: 12,
    fillOrder: '按表名字母序，逐行填充',
  },
  {
    id: 'group-arch',
    title: '项目架构',
    color: 'Violet',
    origin: { x: 5600, y: 0 },
    columns: 4,
    limit: 16,
    fillOrder: '按分层从上到下（前端 → 网关 → 服务 → 数据）',
  },
  {
    id: 'group-flow',
    title: '代码流程',
    color: 'Green',
    origin: { x: 0, y: 5600 },
    columns: 3,
    limit: 20,
    fillOrder: '从入口开始按流向顺序',
  },
  {
    id: 'group-runtime',
    title: '项目运行逻辑',
    color: 'Orange',
    origin: { x: 5600, y: 5600 },
    columns: 3,
    limit: 12,
    fillOrder: '从启动到请求响应顺序',
  },
  {
    id: 'group-seq',
    title: '时序图',
    color: 'Cyan',
    origin: { x: 0, y: 11200 },
    columns: 4,
    limit: 12,
    fillOrder: '参与者放左侧列，消息按时间顺序自上而下、自左向右',
  },
  {
    id: 'group-df',
    title: '数据流图',
    color: 'Indigo',
    origin: { x: 5600, y: 11200 },
    columns: 4,
    limit: 12,
    fillOrder: '按数据流向排列：数据源 → 转换处理 → 数据存储',
  },
] as const;

/** 按容器标题查找区域契约 */
export function findAreaByTitle(title: unknown): AreaSpec | undefined {
  return AREAS.find((area) => area.title === title);
}

/** 按容器 id 查找区域契约 */
export function findAreaById(id: unknown): AreaSpec | undefined {
  return AREAS.find((area) => area.id === id);
}
