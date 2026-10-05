---
'@monopane/canvas': minor
'@monopane/app': minor
---

区域识别从「按标题匹配」改为「按容器 slot id 匹配」，`group` 容器的 `data.title` / `data.color` 允许自定义（产品文档模式：如「能做什么」「怎么运行」），不再要求全部区域都存在；`listAreaSummaries` 与画布校验的错误提示优先展示文档自定义标题。
