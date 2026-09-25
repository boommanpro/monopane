/**
 * @monopane/canvas
 *
 * 「项目文档画布」的框架无关核心：
 * - 数据契约与类型（types / document）
 * - 四大区域与网格常量（constants）
 * - Schema 校验与序列化（validate）
 * - 内置示例画布（default-canvas）
 * - 流程模拟的遍历规则（simulation）
 *
 * 契约文档见 docs/canvas-schema.md。
 */

export * from './types';
export * from './document';
export * from './constants';
export * from './validate';
export * from './simulation';
export { defaultCanvasData } from './default-canvas';
