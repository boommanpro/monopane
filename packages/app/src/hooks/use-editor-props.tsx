/**
 * 编辑器配置中心
 */

import { useMemo, type ReactNode } from 'react';

import { debounce } from 'lodash-es';
import { CanvasNodeType } from '@monopane/canvas';
import { createMinimapPlugin } from '@flowgram.ai/minimap-plugin';
import { createFreeStackPlugin } from '@flowgram.ai/free-stack-plugin';
import { createFreeSnapPlugin } from '@flowgram.ai/free-snap-plugin';
import { createFreeNodePanelPlugin } from '@flowgram.ai/free-node-panel-plugin';
import { createFreeLinesPlugin, LineRenderProps } from '@flowgram.ai/free-lines-plugin';
import {
  FreeLayoutProps,
  WorkflowNodeEntity,
  WorkflowSelectService,
} from '@flowgram.ai/free-layout-editor';
import { createFreeGroupPlugin } from '@flowgram.ai/free-group-plugin';
import { createContainerNodePlugin } from '@flowgram.ai/free-container-plugin';
import { createDownloadPlugin } from '@flowgram.ai/export-plugin';

import { canContainNode, onDragLineEnd } from '../utils';
import { FlowNodeRegistry, FlowDocumentJSON } from '../typings';
import { useTheme } from '../theme';
import { simulationService } from '../simulation';
import { shortcuts } from '../shortcuts';
import { CustomService, ValidateService } from '../services';
import { createContextMenuPlugin, createPanelManagerPlugin } from '../plugins';
import { timestampedFilename } from '../export/download';
import { exploreService, findNodeById } from '../explore/service';
import { saveCanvasDocument } from '../data/storage';
import { SelectorBoxPopover } from '../components/selector-box-popover';
import {
  BaseNode,
  CommentRender,
  GroupNodeRender,
  LineAddButton,
  LineLabel,
  NodePanel,
} from '../components';
import { areaViewStore } from '../area-view';

const LineInsideRender = (props: LineRenderProps) => (
  <>
    <LineLabel {...props} />
    <LineAddButton {...props} />
  </>
);

export interface EditorPropsOptions {
  /** 只读模式（只读预览 / 单体 HTML viewer） */
  readonly?: boolean;
  /** 底部工具条内容：编辑器与只读预览使用不同的工具条 */
  layerChildren?: ReactNode;
}

export function useEditorProps(
  initialData: FlowDocumentJSON,
  nodeRegistries: FlowNodeRegistry[],
  options: EditorPropsOptions = {}
): FreeLayoutProps {
  const { readonly = false, layerChildren } = options;
  // 主题预设的快照引用会随切换变化，使小地图等内联色随主题更新
  const themeSnapshot = useTheme();
  return useMemo<FreeLayoutProps>(
    () => ({
      background: true,
      /**
       * 画布相关配置
       */
      playground: {
        /**
         * 阻止 mac 浏览器手势翻页
         */
        preventGlobalGesture: true,
      },
      /**
       * 只读模式：节点不可拖拽、不可编辑、侧栏自动关闭
       */
      readonly,
      twoWayConnection: true,
      enableReadonlyNodeDragging: false,
      initialData,
      nodeRegistries,
      /**
       * 兜底节点注册
       */
      getNodeDefaultRegistry(type) {
        return {
          type,
          meta: {
            defaultExpanded: true,
          },
        };
      },
      fromNodeJSON(node, json) {
        return json;
      },
      toNodeJSON(node, json) {
        return json;
      },
      lineColor: {
        hidden: 'var(--g-workflow-line-color-hidden,transparent)',
        default: 'var(--g-workflow-line-color-default,#4d53e8)',
        drawing: 'var(--g-workflow-line-color-drawing, #5DD6E3)',
        hovered: 'var(--g-workflow-line-color-hover,#37d0ff)',
        selected: 'var(--g-workflow-line-color-selected,#37d0ff)',
        error: 'var(--g-workflow-line-color-error,red)',
        flowing: 'var(--g-workflow-line-color-flowing,#4d53e8)',
      },
      /**
       * 是否允许连线
       */
      canAddLine(ctx, fromPort, toPort) {
        // 不能自环
        if (fromPort.node === toPort.node) {
          return false;
        }
        // 不能跨容器连线
        if (fromPort.node.parent?.id !== toPort.node.parent?.id) {
          return false;
        }
        // 不能连到上游节点（环检测）
        return !fromPort.node.lines.allInputNodes.includes(toPort.node);
      },
      canDeleteLine() {
        return true;
      },
      canDeleteNode() {
        return true;
      },
      /**
       * 是否允许拖入容器（区域容器）
       */
      canDropToNode: (ctx, params) => canContainNode(params.dragNodeType!, params.dropNodeType!),
      canResetLine: () => true,
      onDragLineEnd,
      selectBox: {
        SelectorBoxPopover,
      },
      scroll: {
        enableScrollLimit: false,
      },
      materials: {
        components: {},
        renderDefaultNode: BaseNode,
        renderNodes: {
          [CanvasNodeType.Note]: CommentRender,
        },
      },
      nodeEngine: {
        enable: true,
      },
      /**
       * 历史记录（撤销 / 重做）
       * 注意：必须始终启用。缺省关闭会让依赖 HistoryService 的插件在 postConstruct
       * 阶段拿不到绑定（只读 viewer 会因此白屏）
       */
      history: {
        enable: true,
        enableChangeNode: true,
      },
      /**
       * 内容变化：先合并当前视图回完整文档，再防抖自动暂存。
       * 只认当前挂载画布的事件，避免切换 tab 后旧画布的延迟回调污染完整文档。
       */
      onContentChange: debounce((ctx) => {
        if (ctx.document.disposed) return;
        if (!areaViewStore.isCurrentDocument(ctx.document)) return;
        const full = areaViewStore.mergeCurrentView(ctx.document.toJSON() as FlowDocumentJSON);
        saveCanvasDocument(full);
      }, 1000),
      /**
       * 流动线：模拟执行器或探索演示模式决定
       */
      isFlowingLine: (ctx, line) =>
        exploreService.isFlowingLine(line) || simulationService.isFlowingLine(line),
      shortcuts,
      onBind: ({ bind }) => {
        bind(CustomService).toSelf().inSingletonScope();
        bind(ValidateService).toSelf().inSingletonScope();
      },
      /**
       * 首次渲染完成后：登记当前画布 document（供暂存归属校验），对齐视口，
       * 并解析深链 hash（#node-<id>）定位聚焦节点
       */
      onAllLayersRendered(ctx) {
        areaViewStore.attachDocument(ctx.document);
        ctx.tools.fitView(false);
        const match = window.location.hash.match(/^#node-(.+)$/);
        if (!match) {
          return;
        }
        const nodeId = decodeURIComponent(match[1]);
        const node = findNodeById(ctx, nodeId);
        if (!node) {
          return;
        }
        void ctx.get(WorkflowSelectService).selectNodeAndScrollToView(node);
        exploreService.focus(ctx, nodeId, 'downstream');
      },
      i18n: {
        locale: navigator.language,
        languages: {
          'zh-CN': {
            'Never Remind': '不再提示',
            'Hold {{key}} to drag node out': '按住 {{key}} 可以将节点拖出',
          },
          'en-US': {},
        },
      },
      plugins: () => [
        /**
         * 节点层级排序：便签始终位于普通节点下方
         */
        createFreeStackPlugin({
          sortNodes: (nodes: WorkflowNodeEntity[]) => {
            const noteNodes: WorkflowNodeEntity[] = [];
            const otherNodes: WorkflowNodeEntity[] = [];
            nodes.forEach((node) => {
              if (node.flowNodeType === CanvasNodeType.Note) {
                noteNodes.push(node);
              } else {
                otherNodes.push(node);
              }
            });
            return [...noteNodes, ...otherNodes];
          },
        }),
        /**
         * 连线渲染：连线中点展示标签 + 快捷添加按钮
         */
        createFreeLinesPlugin({
          renderInsideLine: LineInsideRender,
        }),
        createMinimapPlugin({
          disableLayer: true,
          canvasStyle: {
            canvasWidth: 182,
            canvasHeight: 102,
            canvasPadding: 50,
            canvasBackground: themeSnapshot.preset.minimapBg,
            canvasBorderRadius: 10,
            viewportBackground: themeSnapshot.preset.minimapViewport,
            viewportBorderRadius: 4,
            viewportBorderColor: themeSnapshot.preset.minimapViewportBorder,
            viewportBorderWidth: 1,
            viewportBorderDashLength: undefined,
            nodeColor: themeSnapshot.preset.minimapNode,
            nodeBorderRadius: 2,
            nodeBorderWidth: 0.145,
            nodeBorderColor: themeSnapshot.preset.minimapViewportBorder,
            overlayColor: themeSnapshot.preset.minimapOverlay,
          },
        }),
        createDownloadPlugin({
          getFilename: (format) => timestampedFilename('项目文档画布', String(format)),
        }),
        createFreeSnapPlugin({
          edgeColor: '#00B2B2',
          alignColor: '#00B2B2',
          edgeLineWidth: 1,
          alignLineWidth: 1,
          alignCrossWidth: 8,
        }),
        createFreeNodePanelPlugin({
          renderer: NodePanel,
        }),
        createContainerNodePlugin({}),
        createFreeGroupPlugin({
          groupNodeRender: GroupNodeRender,
        }),
        createContextMenuPlugin({}),
        createPanelManagerPlugin({ layerChildren }),
      ],
    }),
    [initialData, nodeRegistries, readonly, layerChildren, themeSnapshot]
  );
}
