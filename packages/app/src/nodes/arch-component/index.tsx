/**
 * 架构组件节点
 */

import { nanoid } from 'nanoid';
import { ArchCategory, CanvasNodeType } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';
import { Tag } from '@douyinfe/semi-ui';

import { CardSection, CategoryBadge, Muted, TagList } from '../shared/styles';
import { createNodeFormMeta, SimStatusBanner } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import {
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
} from '../../form-components/field-inputs';
import { ARCH_COMPONENT_ICON } from '../../assets/node-icons';

export const ARCH_CATEGORIES: Record<ArchCategory, { label: string; color: string }> = {
  frontend: { label: '前端', color: '#4d53e8' },
  gateway: { label: '网关', color: '#0d9488' },
  service: { label: '业务服务', color: '#7c5cff' },
  database: { label: '数据库', color: '#b8860b' },
  cache: { label: '缓存', color: '#d94848' },
  queue: { label: '消息队列', color: '#c2410c' },
  storage: { label: '对象存储', color: '#0369a1' },
  thirdparty: { label: '第三方', color: '#64748b' },
  other: { label: '其他', color: '#8a94a6' },
};

export const ARCH_CATEGORY_OPTIONS = (Object.keys(ARCH_CATEGORIES) as ArchCategory[]).map(
  (key) => ({
    label: ARCH_CATEGORIES[key].label,
    value: key,
  })
);

const ArchComponentCard = () => (
  <CardSection>
    <SimStatusBanner />
    <Field<ArchCategory | undefined> name="category">
      {({ field }) => {
        const category = ARCH_CATEGORIES[field.value ?? 'other'] ?? ARCH_CATEGORIES.other;
        return <CategoryBadge $color={category.color}>{category.label}</CategoryBadge>;
      }}
    </Field>
    <Field<string[] | undefined> name="tech">
      {({ field }) => {
        const tech = field.value ?? [];
        if (tech.length === 0) {
          return <></>;
        }
        return (
          <TagList>
            {tech.map((item, index) => (
              <Tag key={`${item}-${index}`} size="small" type="light" color="blue">
                {item}
              </Tag>
            ))}
          </TagList>
        );
      }}
    </Field>
    <Field<string | undefined> name="description">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const ArchComponentSidebar = () => (
  <CardSection>
    <TextField name="title" label="组件名" required placeholder="如 订单服务" />
    <SelectField name="category" label="类别" options={ARCH_CATEGORY_OPTIONS} />
    <StringListField name="tech" label="技术标签" placeholder="回车添加，如 Redis" />
    <TextAreaField name="description" label="组件说明" placeholder="该组件承担的职责" />
  </CardSection>
);

export const ArchComponentNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.ArchComponent,
  info: {
    icon: ARCH_COMPONENT_ICON,
    label: '架构组件',
    description: '架构组件：类别 + 技术标签 + 说明，用于表达项目分层与技术栈',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 360,
      height: 200,
    },
  },
  formMeta: createNodeFormMeta(
    () => <ArchComponentCard />,
    () => <ArchComponentSidebar />
  ),
  onAdd() {
    return {
      id: `arch_${nanoid(5)}`,
      type: CanvasNodeType.ArchComponent,
      data: {
        title: '新组件',
        category: 'service',
        tech: [],
        description: '',
      },
    };
  },
};
