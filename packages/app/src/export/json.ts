/**
 * 导出画布 JSON（带 schemaVersion）
 */

import { serializeCanvas } from '@monopane/canvas';

import type { FlowDocumentJSON } from '../typings';
import { downloadBlob, timestampedFilename } from './download';

export function exportCanvasJson(document: FlowDocumentJSON, filename?: string): void {
  const content = serializeCanvas(document);
  downloadBlob(
    new Blob([content], { type: 'application/json;charset=utf-8' }),
    filename ?? timestampedFilename('项目文档画布', 'json')
  );
}
