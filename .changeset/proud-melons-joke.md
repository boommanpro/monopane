---
'@monopane/canvas': minor
'@monopane/app': minor
---

流程区对标 archify workflow 场景：拓扑分层布局（列 = 流程深度、主路径一条水平直线、异常分支自动下挂，flow-start 第 0 列、decision 按 defaultBranch 推导主路径）、容器顶部「阶段 N」轴（随缩放反向补偿保持可读）、viewer 底部工具条回归（缩放/适配/主路径/小地图）、「主路径」一键高亮（路径连线流动）、初始视图阅读档下限（fitView 低于 0.55 时改用 0.6）。契约变更：group-flow 列数 3 → 14（拓扑分层需要横向多列），canvas.mjs layout 对 flow 区域启用拓扑算法
