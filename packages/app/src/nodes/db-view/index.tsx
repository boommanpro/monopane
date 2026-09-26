/**
 * 数据库视图节点：字段列表与表节点一致，用于表达只读投影 / 报表维度
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType, DbFieldJSON } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import { CardSection, Muted, TypeBadge } from '../shared/styles';
import { createNodeFormMeta, SimStatusBanner } from '../shared';
import { DbFieldRows } from '../db-table';
import { FlowNodeRegistry } from '../../typings';
import { DbFieldsEditor, TextField } from '../../form-components/field-inputs';
import { DB_VIEW_ICON } from '../../assets/node-icons';

const DB_VIEW_ACCENT = '#4d53e8';

const DbViewCard = () => (
  <CardSection>
    <SimStatusBanner />
    <TypeBadge $color={DB_VIEW_ACCENT}>数据库视图</TypeBadge>
    <DbFieldRows />
    <Field<string | undefined> name="comment">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const DbViewSidebar = () => (
  <CardSection>
    <TextField name="title" label="视图名" required placeholder="如 v_order_overview" />
    <TextField name="comment" label="说明" placeholder="该视图面向的查询 / 报表场景" />
    <DbFieldsEditor />
  </CardSection>
);

export const DbViewNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.DbView,
  info: {
    icon: DB_VIEW_ICON,
    accent: DB_VIEW_ACCENT,
    label: '数据库视图',
    description: '数据库视图：只读投影 / 报表维度，字段列表同表节点',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 360,
      height: 260,
    },
  },
  formMeta: createNodeFormMeta(
    () => <DbViewCard />,
    () => <DbViewSidebar />
  ),
  onAdd() {
    return {
      id: `db_view_${nanoid(5)}`,
      type: CanvasNodeType.DbView,
      data: {
        title: 'v_new_view',
        comment: '',
        fields: [{ name: 'id', type: 'bigint', flags: ['pk'] }],
      },
    };
  },
};

/** 供内置示例复用的空视图字段模板 */
export const DB_VIEW_DEFAULT_FIELDS: DbFieldJSON[] = [
  { name: 'id', type: 'bigint', flags: ['pk'] },
];
