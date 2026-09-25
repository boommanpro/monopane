/**
 * 导出画布图片（复用 FlowGram 内置的 export-plugin）
 */

import { FlowDownloadFormat, FlowDownloadService } from '@flowgram.ai/export-plugin';

/**
 * 下载整张画布为 PNG
 * 文件名的生成规则在 createDownloadPlugin 的 getFilename 中统一定义
 */
export async function exportCanvasImage(
  service: FlowDownloadService,
  format: FlowDownloadFormat = FlowDownloadFormat.PNG
): Promise<void> {
  await service.download({ format });
}
