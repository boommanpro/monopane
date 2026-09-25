/**
 * 流程类节点（flow-start / flow-end / flow-step / flow-decision）共享的卡片与侧栏
 */

import type { ReactNode } from 'react';

import { FlowBranch } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';

import { BranchHint, CardSection, Muted } from '../shared/styles';
import { SimStatusBanner } from '../shared';
import { SelectField, TextAreaField, TextField } from '../../form-components/field-inputs';

export function FlowCard({ withBranchHint = false }: { withBranchHint?: boolean }): JSX.Element {
  return (
    <CardSection>
      <SimStatusBanner />
      <Field<string | undefined> name="description">
        {({ field }) => (field.value ? <Muted>{field.value}</Muted> : <></>)}
      </Field>
      {withBranchHint && (
        <Field<FlowBranch | undefined> name="defaultBranch">
          {({ field }) => (
            <BranchHint>模拟执行默认分支：{field.value === 'no' ? '否' : '是'}</BranchHint>
          )}
        </Field>
      )}
    </CardSection>
  );
}

export function FlowSidebar({ extra }: { extra?: ReactNode }): JSX.Element {
  return (
    <CardSection>
      <TextField name="title" label="标题" required placeholder="这一步做什么" />
      <TextAreaField
        name="description"
        label="说明"
        placeholder="补充执行细节，如接口、参数、边界条件"
      />
      {extra}
    </CardSection>
  );
}

export const FLOW_BRANCH_OPTIONS = [
  { label: '是（yes 分支）', value: 'yes' },
  { label: '否（no 分支）', value: 'no' },
];

export function FlowBranchField(): JSX.Element {
  return <SelectField name="defaultBranch" label="默认分支" options={FLOW_BRANCH_OPTIONS} />;
}
