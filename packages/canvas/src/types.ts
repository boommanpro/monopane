/**
 * 画布数据 Schema 契约（解析 Skill 与应用共同遵循的唯一规范）
 * Canvas data schema contract, shared by the parsing skill and the application.
 *
 * 详细说明见 docs/canvas-schema.md
 */

export const CANVAS_SCHEMA_VERSION = '1.0';

/**
 * 画布节点类型，与 packages/app/src/nodes 中注册的节点一一对应
 */
export enum CanvasNodeType {
  /** 数据库表 */
  DbTable = 'db-table',
  /** 架构组件 */
  ArchComponent = 'arch-component',
  /** 流程起点 */
  FlowStart = 'flow-start',
  /** 流程终点 */
  FlowEnd = 'flow-end',
  /** 流程步骤 */
  FlowStep = 'flow-step',
  /** 流程判断分支 */
  FlowDecision = 'flow-decision',
  /** 便签注释 */
  Note = 'note',
  /** 区域容器 */
  Area = 'group',
}

/**
 * 字段标记：主键 / 外键 / 唯一 / 可空
 */
export type DbFieldFlag = 'pk' | 'fk' | 'unique' | 'nullable';

export interface DbFieldJSON {
  /** 字段名 */
  name: string;
  /** 字段类型，如 varchar(64)、bigint、text */
  type: string;
  /** 字段标记 */
  flags?: DbFieldFlag[];
  /** 字段说明 */
  comment?: string;
}

export interface DbTableNodeData {
  /** 表名 */
  title: string;
  /** 表说明 */
  comment?: string;
  /** 字段列表 */
  fields: DbFieldJSON[];
}

/**
 * 架构组件类别
 */
export type ArchCategory =
  | 'frontend'
  | 'gateway'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'thirdparty'
  | 'other';

export interface ArchComponentNodeData {
  /** 组件名 */
  title: string;
  /** 组件类别 */
  category: ArchCategory;
  /** 技术标签，如 React、PostgreSQL */
  tech?: string[];
  /** 组件说明 */
  description?: string;
}

export interface FlowNodeData {
  /** 步骤标题 */
  title: string;
  /** 步骤说明 */
  description?: string;
}

export type FlowBranch = 'yes' | 'no';

export interface FlowDecisionNodeData extends FlowNodeData {
  /** 模拟执行时默认走的分支 */
  defaultBranch: FlowBranch;
}

export interface NoteNodeData {
  /** 便签正文 */
  note?: string;
  /** 便签尺寸 */
  size?: {
    width: number;
    height: number;
  };
}

/**
 * 连线语义
 */
export type CanvasEdgeKind = 'db-relation' | 'dependency' | 'flow';

export type DbRelationType = '1:1' | '1:N' | 'N:N';

export interface CanvasEdgeData {
  /** 连线语义 */
  kind: CanvasEdgeKind;
  /** 线上展示的文本 */
  label?: string;
  /** kind 为 db-relation 时的关联类型 */
  relation?: DbRelationType;
  /** kind 为 flow 时的分支标记 */
  branch?: FlowBranch;
}

/**
 * 可被导入 / 导出的画布文件格式
 */
export interface CanvasFileJSON {
  schemaVersion: string;
  nodes: unknown[];
  edges: unknown[];
  globalVariable?: unknown;
}

/**
 * 判断一个字段标记是否存在
 */
export function hasFlag(field: DbFieldJSON, flag: DbFieldFlag): boolean {
  return Boolean(field.flags?.includes(flag));
}
