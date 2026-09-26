/**
 * 数据流图节点注册：df-source（数据源）/ df-transform（转换）/ df-store（存储）
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import { CardSection, Muted, TypeBadge } from '../shared/styles';
import { createNodeFormMeta } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import { TextField } from '../../form-components/field-inputs';
import { DF_SOURCE_ICON, DF_STORE_ICON, DF_TRANSFORM_ICON } from '../../assets/node-icons';

const DF_SOURCE_ACCENT = '#6366f1';
const DF_TRANSFORM_ACCENT = '#818cf8';
const DF_STORE_ACCENT = '#4f46e5';

const DfCard = ({ accent, badge }: { accent: string; badge: string }) => (
  <CardSection>
    <TypeBadge $color={accent}>{badge}</TypeBadge>
    <Field<string | undefined> name="comment">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const DfSidebar = ({ titleLabel }: { titleLabel: string }) => (
  <CardSection>
    <TextField name="title" label={titleLabel} required placeholder={`输入${titleLabel}`} />
    <TextField name="comment" label="说明" placeholder="补充说明 / 口径描述" />
  </CardSection>
);

/** 通过工厂生成数据流节点注册表，减少重复代码 */
function createDfRegistry(options: {
  type: CanvasNodeType;
  label: string;
  description: string;
  icon: string;
  accent: string;
  badge: string;
  defaultTitle: string;
  titleLabel: string;
}): FlowNodeRegistry {
  const { type, label, description, icon, accent, badge, defaultTitle, titleLabel } = options;
  return {
    type,
    info: { icon, accent, label, description },
    meta: {
      defaultPorts: [{ type: 'input' }, { type: 'output' }],
      size: { width: 360, height: 140 },
    },
    formMeta: createNodeFormMeta(
      () => <DfCard accent={accent} badge={badge} />,
      () => <DfSidebar titleLabel={titleLabel} />
    ),
    onAdd() {
      return {
        id: `${type}_${nanoid(5)}`,
        type,
        data: { title: defaultTitle, comment: '' },
      };
    },
  };
}

export const DfSourceNodeRegistry = createDfRegistry({
  type: CanvasNodeType.DfSource,
  label: '数据源',
  description: '数据流的源头：业务系统 / 事件流 / 上游库表',
  icon: DF_SOURCE_ICON,
  accent: DF_SOURCE_ACCENT,
  badge: '数据源',
  defaultTitle: '数据源',
  titleLabel: '数据源名',
});

export const DfTransformNodeRegistry = createDfRegistry({
  type: CanvasNodeType.DfTransform,
  label: '数据转换',
  description: '清洗 / 聚合 / 加工等数据处理步骤',
  icon: DF_TRANSFORM_ICON,
  accent: DF_TRANSFORM_ACCENT,
  badge: '数据转换',
  defaultTitle: '数据转换',
  titleLabel: '转换步骤名',
});

export const DfStoreNodeRegistry = createDfRegistry({
  type: CanvasNodeType.DfStore,
  label: '数据存储',
  description: '数据落库目标：数据仓库 / 数仓表 / 报表库',
  icon: DF_STORE_ICON,
  accent: DF_STORE_ACCENT,
  badge: '数据存储',
  defaultTitle: '数据存储',
  titleLabel: '存储名',
});
