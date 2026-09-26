/**
 * 画布校验与文档对比（E）
 *
 * - StructureCheckModal：对当前完整文档运行 collectLayoutIssues，列出结构问题
 * - CompareModal：导入一份参考 JSON，与当前文档做结构对比（节点 / 连线增删改）
 */

import { useMemo, useRef, useState } from 'react';

import {
  collectLayoutIssues,
  compareDocuments,
  validateCanvasFile,
  type CanvasNodeJSON,
  type DocumentDiff,
} from '@monopane/canvas';
import { Button, Modal, Typography } from '@douyinfe/semi-ui';

import type { FlowDocumentJSON } from '../../typings';

const nodeLabel = (node: CanvasNodeJSON) => `${node.data?.title ?? node.id}（${node.type}）`;

const issueListStyle: React.CSSProperties = {
  maxHeight: 380,
  overflow: 'auto',
  padding: 0,
  margin: 0,
  listStyle: 'none',
};

/** 画布结构校验弹窗 */
export const StructureCheckModal = ({
  visible,
  onClose,
  document,
}: {
  visible: boolean;
  onClose: () => void;
  document: FlowDocumentJSON;
}) => {
  const issues = useMemo(() => collectLayoutIssues(document), [document]);
  return (
    <Modal title="画布结构校验" visible={visible} onCancel={onClose} footer={null} width={640}>
      {issues.length === 0 ? (
        <div style={{ color: '#12a150', fontWeight: 600 }}>未发现问题，画布符合布局契约。</div>
      ) : (
        <ul style={issueListStyle}>
          {issues.map((issue, index) => (
            <li
              key={index}
              style={{
                padding: '6px 10px',
                marginBottom: 4,
                borderRadius: 6,
                background: 'color-mix(in srgb, #d94848 6%, transparent)',
                color: 'var(--mp-card-title)',
                fontSize: 13,
                lineHeight: '20px',
              }}
            >
              {issue}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

const diffSummary = (diff: DocumentDiff) => [
  { label: '新增节点', value: diff.addedNodes.length, color: '#12a150' },
  { label: '删除节点', value: diff.removedNodes.length, color: '#d94848' },
  { label: '变更节点', value: diff.changedNodes.length, color: '#e08c00' },
  { label: '新增连线', value: diff.addedEdges.length, color: '#12a150' },
  { label: '删除连线', value: diff.removedEdges.length, color: '#d94848' },
];

/** 与参考文档对比弹窗 */
export const CompareModal = ({
  visible,
  onClose,
  currentDocument,
}: {
  visible: boolean;
  onClose: () => void;
  currentDocument: FlowDocumentJSON;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState<FlowDocumentJSON | null>(null);
  const [error, setError] = useState('');

  const diff = useMemo(
    () => (reference ? compareDocuments(reference, currentDocument) : null),
    [reference, currentDocument]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const result = validateCanvasFile(JSON.parse(await file.text()));
      if (!result.ok) {
        setError(`导入失败：${result.message}`);
        setReference(null);
        return;
      }
      setError('');
      setReference(result.document);
    } catch {
      setError('导入失败：文件不是合法的 JSON');
      setReference(null);
    }
  };

  const renderDiffList = (title: string, items: { key: string; text: string }[]) => (
    <div style={{ marginBottom: 10 }}>
      <Typography.Text strong>
        {title}（{items.length}）
      </Typography.Text>
      {items.length > 0 && (
        <ul style={issueListStyle}>
          {items.map((item) => (
            <li
              key={item.key}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                lineHeight: '18px',
                color: 'var(--mp-card-title)',
              }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Modal
      title="与参考文档对比（新增 = 绿 / 删除 = 红 / 变更 = 橙）"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={680}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button theme="solid" onClick={() => inputRef.current?.click()} style={{ marginBottom: 12 }}>
        选择参考 JSON 文件
      </Button>
      {error && <div style={{ color: '#d94848', marginBottom: 8, fontSize: 13 }}>{error}</div>}
      {!reference && !error && (
        <div style={{ color: 'var(--mp-card-title)', opacity: 0.6, fontSize: 13 }}>
          选择一份画布 JSON 作为参考，与当前画布做结构对比。
        </div>
      )}
      {diff && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            {diffSummary(diff).map((item) => (
              <span key={item.label} style={{ fontSize: 13 }}>
                <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>{' '}
                {item.label}
              </span>
            ))}
            <span style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{diff.unchangedCount}</span> 未变更节点
            </span>
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {renderDiffList(
              '新增节点',
              diff.addedNodes.map((node) => ({ key: node.id, text: `+ ${nodeLabel(node)}` }))
            )}
            {renderDiffList(
              '删除节点',
              diff.removedNodes.map((node) => ({ key: node.id, text: `- ${nodeLabel(node)}` }))
            )}
            {renderDiffList(
              '变更节点',
              diff.changedNodes.map((item) => ({
                key: item.id,
                text: `~ ${item.id}：${item.before.data?.title ?? '无'} → ${
                  item.after.data?.title ?? '无'
                }`,
              }))
            )}
            {renderDiffList(
              '新增连线',
              diff.addedEdges.map((edge) => ({
                key: `${edge.sourceNodeID}->${edge.targetNodeID}`,
                text: `+ ${edge.sourceNodeID} → ${edge.targetNodeID}`,
              }))
            )}
            {renderDiffList(
              '删除连线',
              diff.removedEdges.map((edge) => ({
                key: `${edge.sourceNodeID}->${edge.targetNodeID}`,
                text: `- ${edge.sourceNodeID} → ${edge.targetNodeID}`,
              }))
            )}
          </div>
          {diff.addedNodes.length === 0 &&
            diff.removedNodes.length === 0 &&
            diff.changedNodes.length === 0 &&
            diff.addedEdges.length === 0 &&
            diff.removedEdges.length === 0 && (
              <div style={{ color: '#12a150', fontWeight: 600 }}>
                两份文档结构完全一致（{diff.unchangedCount} 个节点）。
              </div>
            )}
        </>
      )}
    </Modal>
  );
};
