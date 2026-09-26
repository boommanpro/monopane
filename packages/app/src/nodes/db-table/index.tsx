/**
 * 数据库表节点
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType, DbFieldJSON, hasFlag } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import {
  CardSection,
  FieldList,
  FieldName,
  FieldRow,
  FieldType,
  FlagTag,
  Muted,
} from '../shared/styles';
import { createNodeFormMeta, SimStatusBanner } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import { DbFieldsEditor, TextField } from '../../form-components/field-inputs';
import { DB_TABLE_ICON } from '../../assets/node-icons';

/** 字段列表渲染（表节点与视图节点共用） */
export function DbFieldRows(): JSX.Element {
  return (
    <Field<DbFieldJSON[] | undefined> name="fields">
      {({ field }) => {
        const fields = field.value ?? [];
        if (fields.length === 0) {
          return <Muted>暂无字段</Muted>;
        }
        return (
          <FieldList>
            {fields.map((item, index) => (
              <FieldRow key={`${item.name}-${index}`}>
                {hasFlag(item, 'pk') && <FlagTag $tone="pk">PK</FlagTag>}
                {hasFlag(item, 'fk') && <FlagTag $tone="fk">FK</FlagTag>}
                {hasFlag(item, 'unique') && <FlagTag $tone="unique">UQ</FlagTag>}
                <FieldName>{item.name || '(未命名字段)'}</FieldName>
                <FieldType>
                  {item.type}
                  {hasFlag(item, 'nullable') ? ' · 可空' : ''}
                </FieldType>
              </FieldRow>
            ))}
          </FieldList>
        );
      }}
    </Field>
  );
}

const DbTableCard = () => (
  <CardSection>
    <SimStatusBanner />
    <DbFieldRows />
    <Field<string | undefined> name="comment">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const DbTableSidebar = () => (
  <CardSection>
    <TextField name="title" label="表名" required placeholder="如 order_item" />
    <TextField name="comment" label="说明" placeholder="该表的业务用途" />
    <DbFieldsEditor />
  </CardSection>
);

export const DbTableNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.DbTable,
  info: {
    icon: DB_TABLE_ICON,
    accent: '#4d53e8',
    label: '数据库表',
    description: '数据库表：表名 + 字段列表（主键 / 外键 / 唯一 / 可空），左右端口用于表达表关联',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 360,
      height: 300,
    },
  },
  formMeta: createNodeFormMeta(
    () => <DbTableCard />,
    () => <DbTableSidebar />
  ),
  onAdd() {
    return {
      id: `db_${nanoid(5)}`,
      type: CanvasNodeType.DbTable,
      data: {
        title: 'new_table',
        comment: '',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'] },
          { name: 'created_at', type: 'datetime', flags: [] },
        ],
      },
    };
  },
};

/** 供工具栏 / 面板复用的空表模板常量 */
export const DB_TABLE_DEFAULT_FIELDS: DbFieldJSON[] = [
  { name: 'id', type: 'bigint', flags: ['pk'] },
];
