/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from 'react';

import {
  createPanelManagerPlugin as create,
  PanelFactory,
} from '@flowgram.ai/panel-manager-plugin';

import { NodeFormPanel, NodeFormPanelProps } from '../../components/sidebar/node-form-panel';
import { ProblemPanel } from '../../components/problem-panel/problem-panel';
import { PanelType } from './constants';

const nodeFormPanelFactory: PanelFactory<NodeFormPanelProps> = {
  key: PanelType.NodeFormPanel,
  defaultSize: 500,
  maxSize: 800,
  minSize: 300,
  render: (props: NodeFormPanelProps) => <NodeFormPanel {...props} />,
};

const problemPanelFactory: PanelFactory<void> = {
  key: PanelType.ProblemPanel,
  defaultSize: 200,
  render: () => <ProblemPanel />,
};

/**
 * @param layerChildren 底部工具条内容（编辑器与只读预览使用不同的工具条）
 */
export const createPanelManagerPlugin = (options: { layerChildren?: ReactNode } = {}) =>
  create({
    factories: [nodeFormPanelFactory, problemPanelFactory],
    layerProps: {
      children: options.layerChildren,
    },
  });
