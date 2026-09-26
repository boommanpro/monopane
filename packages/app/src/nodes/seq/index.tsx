/**
 * 时序图节点注册：seq-participant（参与者）/ seq-message（消息）
 */

import { nanoid } from 'nanoid';
import { CanvasNodeType } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import { CardSection, Muted, TypeBadge } from '../shared/styles';
import { createNodeFormMeta } from '../shared';
import { FlowNodeRegistry } from '../../typings';
import { TextField } from '../../form-components/field-inputs';
import { SEQ_MESSAGE_ICON, SEQ_PARTICIPANT_ICON } from '../../assets/node-icons';

const SEQ_PARTICIPANT_ACCENT = '#0891b2';
const SEQ_MESSAGE_ACCENT = '#06b6d4';

const CommentCard = ({ accent, badge }: { accent: string; badge: string }) => (
  <CardSection>
    <TypeBadge $color={accent}>{badge}</TypeBadge>
    <Field<string | undefined> name="comment">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const CommentSidebar = ({ label }: { label: string }) => (
  <CardSection>
    <TextField name="title" label={label} required placeholder={`输入${label}`} />
    <TextField name="comment" label="说明" placeholder="补充说明 / 职责描述" />
  </CardSection>
);

/** 消息节点：schema 中为 description 字段 */
const MessageCard = ({ accent }: { accent: string }) => (
  <CardSection>
    <TypeBadge $color={accent}>消息</TypeBadge>
    <Field<string | undefined> name="description">
      {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
    </Field>
  </CardSection>
);

const MessageSidebar = () => (
  <CardSection>
    <TextField name="title" label="消息名" required placeholder="输入消息名" />
    <TextField name="description" label="消息说明" placeholder="该消息携带的内容 / 触发条件" />
  </CardSection>
);

export const SeqParticipantNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.SeqParticipant,
  info: {
    icon: SEQ_PARTICIPANT_ICON,
    accent: SEQ_PARTICIPANT_ACCENT,
    label: '参与者',
    description: '时序图中的参与方（角色 / 系统 / 服务），自上而下传递消息',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: { width: 360, height: 140 },
  },
  formMeta: createNodeFormMeta(
    () => <CommentCard accent={SEQ_PARTICIPANT_ACCENT} badge="参与者" />,
    () => <CommentSidebar label="参与者名" />
  ),
  onAdd() {
    return {
      id: `seq_participant_${nanoid(5)}`,
      type: CanvasNodeType.SeqParticipant,
      data: { title: '新参与者', comment: '' },
    };
  },
};

export const SeqMessageNodeRegistry: FlowNodeRegistry = {
  type: CanvasNodeType.SeqMessage,
  info: {
    icon: SEQ_MESSAGE_ICON,
    accent: SEQ_MESSAGE_ACCENT,
    label: '消息',
    description: '参与者之间的一次交互消息（调用 / 响应 / 事件）',
  },
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: { width: 360, height: 140 },
  },
  formMeta: createNodeFormMeta(
    () => <MessageCard accent={SEQ_MESSAGE_ACCENT} />,
    () => <MessageSidebar />
  ),
  onAdd() {
    return {
      id: `seq_message_${nanoid(5)}`,
      type: CanvasNodeType.SeqMessage,
      data: { title: '发送消息', description: '' },
    };
  },
};
