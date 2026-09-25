/**
 * 只读 viewer 入口（用于生成单体 HTML 导出的模板）
 */

import { createRoot } from 'react-dom/client';
import { unstableSetCreateRoot } from '@flowgram.ai/form-materials';

import { Viewer } from './viewer';

unstableSetCreateRoot(createRoot);

const app = createRoot(document.getElementById('root')!);

app.render(<Viewer />);
