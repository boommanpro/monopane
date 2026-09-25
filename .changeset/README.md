# Changesets

本目录由 [changesets](https://github.com/changesets/changesets) 管理。

## 当前策略

`@monopane/*` 各包均为 `private`，**不会发布到 npm**。changesets 在这里只承担两件事：

1. 记录每次改动的版本意图（major / minor / patch）；
2. 通过 `pnpm version-packages` 汇总生成各包的 `CHANGELOG.md`。

## 常用命令

```bash
pnpm changeset          # 交互式生成一条 changeset
pnpm version-packages   # 消费全部 changeset，升版本 + 写 CHANGELOG
```

## 什么时候需要写 changeset

- 改动了 `@monopane/canvas` 的对外 API（类型、校验规则、常量、默认数据）→ 必须写；
- 改动了 `docs/canvas-schema.md` 描述的数据契约 → 必须写，并在描述里注明兼容性影响；
- 纯应用层 UI 调整、文档修正、CI 调整 → 可以不写。
