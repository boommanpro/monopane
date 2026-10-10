/**
 * 画布就绪信号：FlowGram 画布节点是异步挂载的，
 * 依赖画布内容的 UI（如图例统计）在 onAllLayersRendered 前拿不到数据。
 * onAllLayersRendered 时 bump 版本，订阅方据此重算。
 */

let version = 0;

const listeners = new Set<() => void>();

export const canvasReadyStore = {
  bump(): void {
    version += 1;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getVersion: (): number => version,
};
