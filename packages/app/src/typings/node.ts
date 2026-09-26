/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { CanvasNodeType } from '@monopane/canvas';
import {
  WorkflowNodeJSON as FlowNodeJSONDefault,
  WorkflowNodeRegistry as FlowNodeRegistryDefault,
  FreeLayoutPluginContext,
  FlowNodeEntity,
  type WorkflowEdgeJSON,
  WorkflowNodeMeta,
} from '@flowgram.ai/free-layout-editor';
import { IFlowValue } from '@flowgram.ai/form-materials';

import { type JsonSchema } from './json-schema';

/**
 * You can customize the data of the node, and here you can use JsonSchema to define the input and output of the node
 * 你可以自定义节点的 data 业务数据, 这里演示 通过 JsonSchema 来定义节点的输入/输出
 */
export interface FlowNodeJSON extends FlowNodeJSONDefault {
  /**
   * 本项目只使用字符串节点类型（见 CanvasNodeType），
   * 这里覆盖 FlowGram 默认的 `string | number`，以便与 @monopane/canvas 的
   * CanvasNodeJSON 直接互相赋值，无需在导入导出边界做类型断言。
   */
  type: string;
  data: {
    /**
     * Node title
     */
    title?: string;
    /**
     * Inputs data values
     */
    inputsValues?: Record<string, IFlowValue>;
    /**
     * Define the inputs data of the node by JsonSchema
     */
    inputs?: JsonSchema;
    /**
     * Define the outputs data of the node by JsonSchema
     */
    outputs?: JsonSchema;
    /**
     * Rest properties
     */
    [key: string]: any;
  };
  /**
   * 子节点同样收窄为 FlowNodeJSON，避免 FlowGram 默认的 `WorkflowNodeJSON[]`
   * 在向 @monopane/canvas 赋值时又冒出不兼容的 `type: number`。
   */
  blocks?: FlowNodeJSON[];
}

/**
 * You can customize your own node meta
 * 你可以自定义节点的meta
 */
export interface FlowNodeMeta extends WorkflowNodeMeta {
  sidebarDisabled?: boolean;
  nodePanelHidden?: boolean;
  wrapperStyle?: React.CSSProperties;
  onlyInContainer?: CanvasNodeType;
}

/**
 * You can customize your own node registry
 * 你可以自定义节点的注册器
 */
export interface FlowNodeRegistry extends FlowNodeRegistryDefault {
  meta: FlowNodeMeta;
  info?: {
    icon: string;
    /** 节点面板中展示的中文名 */
    label?: string;
    description?: string;
    /** 节点主题强调色（卡片头部着色 / 徽标配色） */
    accent?: string;
  };
  canAdd?: (ctx: FreeLayoutPluginContext) => boolean;
  canDelete?: (ctx: FreeLayoutPluginContext, from: FlowNodeEntity) => boolean;
  onAdd?: (ctx: FreeLayoutPluginContext) => FlowNodeJSON;
}

export interface FlowDocumentJSON {
  nodes: FlowNodeJSON[];
  edges: WorkflowEdgeJSON[];
  /**
   * Global Variable Schema Definition
   * 全局变量的 Schema 定义
   *
   * Warning: In real occasion, it's better to store the schema and value of these global variables in a reliable place, since the value of a variable might be leaked in saved schema.
   * 注意：在真实场景下，全局变量的 Schema 定义和值都应该存储在更可靠的地方，因为全局变量的值可能会泄露在保存的 Schema 中。
   */
  globalVariable?: JsonSchema;
}
