/**
 * 绑定到表单引擎的可复用输入组件（画布节点侧栏编辑器使用）
 */

import { useState } from 'react';

import { DbFieldFlag, DbFieldJSON, hasFlag } from '@monopane/canvas';
import { Field } from '@flowgram.ai/free-layout-editor';
import { Button, Checkbox, Input, Select, TextArea } from '@douyinfe/semi-ui';
import { IconDelete, IconPlus } from '@douyinfe/semi-icons';

import { FormItem } from './form-item';

export function TextField(props: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}): JSX.Element {
  const { name, label, placeholder, required } = props;
  return (
    <Field<string> name={name}>
      {({ field }) => (
        <FormItem name={label} required={required}>
          <Input
            size="small"
            value={field.value ?? ''}
            placeholder={placeholder}
            onChange={field.onChange}
          />
        </FormItem>
      )}
    </Field>
  );
}

export function TextAreaField(props: {
  name: string;
  label: string;
  placeholder?: string;
}): JSX.Element {
  const { name, label, placeholder } = props;
  return (
    <Field<string> name={name}>
      {({ field }) => (
        <FormItem name={label} vertical>
          <TextArea
            autosize={{ minRows: 3, maxRows: 8 }}
            value={field.value ?? ''}
            placeholder={placeholder}
            onChange={field.onChange}
          />
        </FormItem>
      )}
    </Field>
  );
}

export function SelectField(props: {
  name: string;
  label: string;
  options: { label: string; value: string }[];
}): JSX.Element {
  const { name, label, options } = props;
  return (
    <Field<string> name={name}>
      {({ field }) => (
        <FormItem name={label}>
          <Select
            size="small"
            style={{ width: '100%' }}
            value={field.value}
            optionList={options}
            onChange={(value) => field.onChange(value as string)}
          />
        </FormItem>
      )}
    </Field>
  );
}

/**
 * 字符串标签数组编辑器（如技术标签）
 */
export function StringListField(props: {
  name: string;
  label: string;
  placeholder?: string;
}): JSX.Element {
  const { name, label, placeholder } = props;
  const [draft, setDraft] = useState('');
  return (
    <Field<string[] | undefined> name={name}>
      {({ field }) => {
        const list = field.value ?? [];
        const add = () => {
          const value = draft.trim();
          if (!value || list.includes(value)) {
            return;
          }
          field.onChange([...list, value]);
          setDraft('');
        };
        return (
          <FormItem name={label} vertical>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {list.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '1px 6px',
                        fontSize: 12,
                        borderRadius: 4,
                        backgroundColor: 'rgba(77, 83, 232, 0.1)',
                      }}
                    >
                      {item}
                      <IconDelete
                        size="small"
                        style={{ cursor: 'pointer' }}
                        onClick={() => field.onChange(list.filter((_, i) => i !== index))}
                      />
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <Input
                  size="small"
                  value={draft}
                  placeholder={placeholder}
                  onChange={setDraft}
                  onEnterPress={add}
                />
                <Button size="small" icon={<IconPlus />} onClick={add} />
              </div>
            </div>
          </FormItem>
        );
      }}
    </Field>
  );
}

const FLAG_OPTIONS: { flag: DbFieldFlag; label: string }[] = [
  { flag: 'pk', label: '主键' },
  { flag: 'fk', label: '外键' },
  { flag: 'unique', label: '唯一' },
  { flag: 'nullable', label: '可空' },
];

const FLAG_ORDER: DbFieldFlag[] = ['pk', 'fk', 'unique', 'nullable'];

/**
 * 数据库表字段编辑器
 */
export function DbFieldsEditor({ name = 'fields' }: { name?: string }): JSX.Element {
  return (
    <Field<DbFieldJSON[] | undefined> name={name}>
      {({ field }) => {
        const fields = field.value ?? [];
        const update = (next: DbFieldJSON[]) => field.onChange(next);
        const patchField = (index: number, patch: Partial<DbFieldJSON>) =>
          update(fields.map((item, i) => (i === index ? { ...item, ...patch } : item)));
        const toggleFlag = (index: number, flag: DbFieldFlag, checked: boolean) => {
          const current = fields[index]?.flags ?? [];
          const nextFlags = checked
            ? FLAG_ORDER.filter((item) => item === flag || current.includes(item))
            : current.filter((item) => item !== flag);
          patchField(index, { flags: nextFlags });
        };
        return (
          <FormItem name="字段列表" vertical>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid rgba(6, 7, 9, 0.1)',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Input
                      size="small"
                      value={item.name}
                      placeholder="字段名"
                      onChange={(value) => patchField(index, { name: value })}
                    />
                    <Input
                      size="small"
                      value={item.type}
                      placeholder="类型"
                      onChange={(value) => patchField(index, { type: value })}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 12,
                    }}
                  >
                    {FLAG_OPTIONS.map((option) => (
                      <Checkbox
                        key={option.flag}
                        checked={hasFlag(item, option.flag)}
                        onChange={(e) => toggleFlag(index, option.flag, Boolean(e.target.checked))}
                      >
                        {option.label}
                      </Checkbox>
                    ))}
                    <IconDelete
                      style={{ marginLeft: 'auto', cursor: 'pointer' }}
                      onClick={() => update(fields.filter((_, i) => i !== index))}
                    />
                  </div>
                </div>
              ))}
              <Button
                size="small"
                icon={<IconPlus />}
                onClick={() => update([...fields, { name: '', type: '', flags: [] }])}
              >
                添加字段
              </Button>
            </div>
          </FormItem>
        );
      }}
    </Field>
  );
}
