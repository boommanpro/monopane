/**
 * 模拟执行器的 React 绑定
 */

import { useSyncExternalStore } from 'react';

import { SimNodeStatus, SimSpeed, simulationService } from './service';

export function useSimulation(): {
  running: boolean;
  speed: SimSpeed;
  setSpeed: (speed: SimSpeed) => void;
  statusOf: (nodeId: string) => SimNodeStatus;
} {
  const snapshot = useSyncExternalStore(simulationService.subscribe, simulationService.getSnapshot);
  return {
    running: snapshot.running,
    speed: simulationService.getSpeed(),
    setSpeed: simulationService.setSpeed,
    statusOf: (nodeId: string) => snapshot.statuses[nodeId] ?? 'idle',
  };
}

/**
 * 读取单个节点在模拟执行中的状态
 */
export function useSimNodeStatus(nodeId: string): SimNodeStatus {
  const snapshot = useSyncExternalStore(simulationService.subscribe, simulationService.getSnapshot);
  return snapshot.statuses[nodeId] ?? 'idle';
}
