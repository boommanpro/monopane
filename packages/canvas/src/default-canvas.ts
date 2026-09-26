/**
 * 「项目画布」内置示例数据
 *
 * 主题：虚构电商项目「ShopEasy」——覆盖 数据库结构 / 项目架构 / 代码流程 / 运行逻辑 四大区域。
 * 数据契约见 docs/canvas-schema.md，类型定义见 ./types.ts 与 ./document.ts。
 *
 * 网格规则：子节点坐标相对所属容器，x = col * 460，y = row * 380。
 */

import type { CanvasDocumentJSON } from './document';

export const defaultCanvasData: CanvasDocumentJSON = {
  nodes: [
    // ======================= 区域容器 =======================
    {
      id: 'group-db',
      type: 'group',
      meta: { position: { x: 0, y: 0 } },
      data: {
        parentID: 'root',
        title: '数据库结构与关联',
        color: 'Blue',
        blockIDs: [
          'db-coupon',
          'db-inventory',
          'db-order',
          'db-order-item',
          'db-payment',
          'db-product',
          'db-refund',
          'db-user',
          'db-user-address',
          'db-user-coupon',
          'db-order-view',
          'note-db',
        ],
      },
    },
    {
      id: 'group-arch',
      type: 'group',
      meta: { position: { x: 5600, y: 0 } },
      data: {
        parentID: 'root',
        title: '项目架构',
        color: 'Violet',
        blockIDs: [
          'arch-web',
          'arch-admin',
          'arch-miniapp',
          'note-arch',
          'arch-gateway',
          'arch-thirdpay',
          'arch-bff',
          'arch-order-svc',
          'arch-product-svc',
          'arch-pay-svc',
          'arch-mysql',
          'arch-redis',
          'arch-kafka',
          'arch-oss',
        ],
      },
    },
    {
      id: 'group-flow',
      type: 'group',
      meta: { position: { x: 0, y: 5600 } },
      data: {
        parentID: 'root',
        title: '代码流程',
        color: 'Green',
        blockIDs: [
          'flow-order-start',
          'flow-param-validate',
          'flow-idem-check',
          'flow-idem-hit',
          'flow-stock-lock',
          'flow-stock-decision',
          'flow-stock-fail',
          'flow-coupon-verify',
          'flow-amount-calc',
          'flow-create-order',
          'flow-create-payment',
          'flow-order-cache',
          'flow-event-publish',
          'flow-response',
          'flow-order-end',
          'flow-pay-delay',
          'flow-parallel-post',
          'flow-subprocess-settle',
          'note-flow',
        ],
      },
    },
    {
      id: 'group-runtime',
      type: 'group',
      meta: { position: { x: 5600, y: 5600 } },
      data: {
        parentID: 'root',
        title: '项目运行逻辑',
        color: 'Orange',
        blockIDs: [
          'rt-boot-start',
          'rt-db-pool',
          'rt-register',
          'rt-ready',
          'rt-req-in',
          'rt-auth-decision',
          'rt-route',
          'rt-handle-decision',
          'rt-respond',
          'rt-error-log',
          'rt-reject',
          'rt-req-end',
          'note-runtime',
        ],
      },
    },

    // ======================= 数据库结构区（3 列） =======================
    {
      id: 'db-coupon',
      type: 'db-table',
      meta: { position: { x: 0, y: 0 } },
      data: {
        title: 'coupon',
        comment: '优惠券模板表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'code', type: 'varchar(32)', flags: ['unique'], comment: '券模板编码' },
          { name: 'name', type: 'varchar(128)', comment: '券名称' },
          { name: 'type', type: 'tinyint', comment: '类型：1 满减 2 折扣 3 立减' },
          { name: 'discount_value', type: 'decimal(10,2)', comment: '优惠值（金额或折扣）' },
          { name: 'min_amount', type: 'decimal(10,2)', comment: '使用门槛金额' },
          { name: 'total_count', type: 'int', comment: '发行总量' },
          { name: 'expired_at', type: 'datetime', comment: '过期时间' },
        ],
      },
    },
    {
      id: 'db-inventory',
      type: 'db-table',
      meta: { position: { x: 460, y: 0 } },
      data: {
        title: 'inventory',
        comment: '商品库存表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'product_id', type: 'bigint', flags: ['fk'], comment: '商品 ID' },
          { name: 'warehouse_code', type: 'varchar(32)', comment: '仓库编码' },
          { name: 'available_qty', type: 'int', comment: '可售库存' },
          { name: 'locked_qty', type: 'int', comment: '预占库存' },
          { name: 'version', type: 'int', comment: '乐观锁版本号' },
          { name: 'updated_at', type: 'datetime', comment: '更新时间' },
        ],
      },
    },
    {
      id: 'db-order',
      type: 'db-table',
      meta: { position: { x: 920, y: 0 } },
      data: {
        title: 'order',
        comment: '订单主表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'order_no', type: 'varchar(32)', flags: ['unique'], comment: '对外订单号' },
          { name: 'user_id', type: 'bigint', flags: ['fk'], comment: '下单用户 ID' },
          {
            name: 'coupon_id',
            type: 'bigint',
            flags: ['fk', 'nullable'],
            comment: '使用的券模板 ID',
          },
          { name: 'status', type: 'tinyint', comment: '状态：1 待支付 2 已支付 3 已取消' },
          { name: 'total_amount', type: 'decimal(10,2)', comment: '订单总额' },
          { name: 'pay_amount', type: 'decimal(10,2)', comment: '应付金额' },
          { name: 'created_at', type: 'datetime', comment: '创建时间' },
        ],
      },
    },
    {
      id: 'db-order-item',
      type: 'db-table',
      meta: { position: { x: 0, y: 380 } },
      data: {
        title: 'order_item',
        comment: '订单明细表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'order_id', type: 'bigint', flags: ['fk'], comment: '订单 ID' },
          { name: 'product_id', type: 'bigint', flags: ['fk'], comment: '商品 ID' },
          { name: 'product_name', type: 'varchar(200)', comment: '下单时商品名快照' },
          { name: 'price', type: 'decimal(10,2)', comment: '成交单价' },
          { name: 'quantity', type: 'int', comment: '购买数量' },
          { name: 'subtotal', type: 'decimal(10,2)', comment: '小计金额' },
        ],
      },
    },
    {
      id: 'db-payment',
      type: 'db-table',
      meta: { position: { x: 460, y: 380 } },
      data: {
        title: 'payment',
        comment: '支付流水表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'payment_no', type: 'varchar(64)', flags: ['unique'], comment: '支付流水号' },
          { name: 'order_id', type: 'bigint', flags: ['fk'], comment: '订单 ID' },
          { name: 'channel', type: 'tinyint', comment: '渠道：1 微信 2 支付宝 3 银行卡' },
          { name: 'amount', type: 'decimal(10,2)', comment: '支付金额' },
          { name: 'status', type: 'tinyint', comment: '状态：0 待支付 1 成功 2 失败' },
          { name: 'paid_at', type: 'datetime', flags: ['nullable'], comment: '支付完成时间' },
          { name: 'created_at', type: 'datetime', comment: '创建时间' },
        ],
      },
    },
    {
      id: 'db-product',
      type: 'db-table',
      meta: { position: { x: 920, y: 380 } },
      data: {
        title: 'product',
        comment: '商品主表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'sku', type: 'varchar(64)', flags: ['unique'], comment: '商品编码' },
          { name: 'name', type: 'varchar(200)', comment: '商品名称' },
          { name: 'category_code', type: 'varchar(32)', comment: '类目编码' },
          { name: 'description', type: 'text', comment: '商品详情' },
          { name: 'price', type: 'decimal(10,2)', comment: '标准售价' },
          { name: 'status', type: 'tinyint', comment: '状态：1 上架 0 下架' },
          { name: 'created_at', type: 'datetime', comment: '创建时间' },
        ],
      },
    },
    {
      id: 'db-refund',
      type: 'db-table',
      meta: { position: { x: 0, y: 760 } },
      data: {
        title: 'refund',
        comment: '退款单表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'refund_no', type: 'varchar(64)', flags: ['unique'], comment: '退款单号' },
          { name: 'order_id', type: 'bigint', flags: ['fk'], comment: '订单 ID' },
          { name: 'payment_id', type: 'bigint', flags: ['fk'], comment: '原支付流水 ID' },
          { name: 'amount', type: 'decimal(10,2)', comment: '退款金额' },
          { name: 'reason', type: 'varchar(255)', flags: ['nullable'], comment: '退款原因' },
          { name: 'status', type: 'tinyint', comment: '状态：0 处理中 1 成功 2 驳回' },
          { name: 'created_at', type: 'datetime', comment: '创建时间' },
        ],
      },
    },
    {
      id: 'db-user',
      type: 'db-table',
      meta: { position: { x: 460, y: 760 } },
      data: {
        title: 'user',
        comment: '用户主表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'username', type: 'varchar(64)', flags: ['unique'], comment: '登录名' },
          { name: 'email', type: 'varchar(128)', flags: ['unique'], comment: '登录邮箱' },
          { name: 'password_hash', type: 'varchar(255)', comment: '密码哈希' },
          { name: 'phone', type: 'varchar(32)', flags: ['unique', 'nullable'], comment: '手机号' },
          { name: 'status', type: 'tinyint', comment: '状态：1 正常 0 冻结' },
          { name: 'created_at', type: 'datetime', comment: '注册时间' },
          { name: 'updated_at', type: 'datetime', comment: '更新时间' },
        ],
      },
    },
    {
      id: 'db-user-address',
      type: 'db-table',
      meta: { position: { x: 920, y: 760 } },
      data: {
        title: 'user_address',
        comment: '用户收货地址表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'user_id', type: 'bigint', flags: ['fk'], comment: '所属用户 ID' },
          { name: 'receiver', type: 'varchar(64)', comment: '收货人' },
          { name: 'phone', type: 'varchar(32)', comment: '联系电话' },
          { name: 'province', type: 'varchar(64)', comment: '省' },
          { name: 'city', type: 'varchar(64)', comment: '市' },
          { name: 'detail', type: 'varchar(255)', comment: '详细地址' },
          { name: 'is_default', type: 'tinyint', comment: '是否默认：1 是 0 否' },
        ],
      },
    },
    {
      id: 'db-user-coupon',
      type: 'db-table',
      meta: { position: { x: 0, y: 1140 } },
      data: {
        title: 'user_coupon',
        comment: '用户领券记录表',
        fields: [
          { name: 'id', type: 'bigint', flags: ['pk'], comment: '主键' },
          { name: 'user_id', type: 'bigint', flags: ['fk'], comment: '用户 ID' },
          { name: 'coupon_id', type: 'bigint', flags: ['fk'], comment: '券模板 ID' },
          { name: 'order_id', type: 'bigint', flags: ['fk', 'nullable'], comment: '核销订单 ID' },
          { name: 'status', type: 'tinyint', comment: '状态：0 未使用 1 已使用 2 已过期' },
          { name: 'claimed_at', type: 'datetime', comment: '领取时间' },
          { name: 'used_at', type: 'datetime', flags: ['nullable'], comment: '核销时间' },
        ],
      },
    },
    {
      id: 'db-order-view',
      type: 'db-view',
      meta: { position: { x: 920, y: 1140 } },
      data: {
        title: 'v_order_overview',
        comment: '订单概览视图，供运营报表直接查询',
        fields: [
          { name: 'order_id', type: 'bigint', flags: ['pk'], comment: '订单 ID' },
          { name: 'order_no', type: 'varchar(32)', comment: '订单号' },
          { name: 'user_id', type: 'bigint', comment: '用户 ID' },
          { name: 'status', type: 'tinyint', comment: '订单状态' },
          { name: 'pay_amount', type: 'decimal(10,2)', comment: '实付金额' },
          { name: 'created_at', type: 'datetime', comment: '下单时间' },
        ],
      },
    },
    {
      id: 'note-db',
      type: 'note',
      meta: { position: { x: 460, y: 1140 } },
      data: {
        size: { width: 360, height: 220 },
        note:
          '数据库为电商交易主库，采用 MySQL 8.0 InnoDB，按 user_id 分 16 库。\n' +
          '金额统一 decimal(10,2)，时间统一 datetime。\n' +
          'order.status 与 payment.status 由 Kafka 事件驱动最终一致。\n' +
          '本区共 10 张核心表，已覆盖订单履约主链路。',
      },
    },

    // ======================= 项目架构区（4 列） =======================
    {
      id: 'arch-web',
      type: 'arch-component',
      meta: { position: { x: 0, y: 0 } },
      data: {
        title: 'Web 商城前端',
        category: 'frontend',
        tech: ['React 18', 'TypeScript', 'Vite'],
        description: '面向消费者的商城站点，负责商品浏览、下单与支付收银台',
      },
    },
    {
      id: 'arch-admin',
      type: 'arch-component',
      meta: { position: { x: 460, y: 0 } },
      data: {
        title: '运营后台',
        category: 'frontend',
        tech: ['Vue 3', 'Element Plus', 'Pinia'],
        description: '商品、库存、订单与优惠券的运营管理界面',
      },
    },
    {
      id: 'arch-miniapp',
      type: 'arch-component',
      meta: { position: { x: 920, y: 0 } },
      data: {
        title: '小程序端',
        category: 'frontend',
        tech: ['Taro', 'React', 'Webpack'],
        description: '微信小程序入口，复用商城核心下单能力',
      },
    },
    {
      id: 'note-arch',
      type: 'note',
      meta: { position: { x: 1380, y: 0 } },
      data: {
        size: { width: 360, height: 220 },
        note:
          '架构分层：前端 → 网关 → 服务 → 数据。\n' +
          '所有外部流量经 API 网关统一鉴权与限流。\n' +
          'BFF 负责聚合订单、商品与用户服务数据。\n' +
          '服务间通过 Kafka 异步解耦，缓存命中率目标 90%。',
      },
    },
    {
      id: 'arch-gateway',
      type: 'arch-component',
      meta: { position: { x: 0, y: 380 } },
      data: {
        title: 'API 网关',
        category: 'gateway',
        tech: ['Nginx', 'Spring Cloud Gateway'],
        description: '统一入口，负责路由转发、鉴权校验与限流熔断',
      },
    },
    {
      id: 'arch-thirdpay',
      type: 'arch-component',
      meta: { position: { x: 460, y: 380 } },
      data: {
        title: '第三方支付渠道',
        category: 'thirdparty',
        tech: ['微信支付', '支付宝'],
        description: '外部支付通道，回调通知支付结果至支付服务',
      },
    },
    {
      id: 'arch-bff',
      type: 'arch-component',
      meta: { position: { x: 920, y: 380 } },
      data: {
        title: 'BFF 聚合层',
        category: 'service',
        tech: ['Node.js', 'GraphQL'],
        description: '面向端的接口聚合层，裁剪字段并编排下游服务调用',
      },
    },
    {
      id: 'arch-order-svc',
      type: 'arch-component',
      meta: { position: { x: 0, y: 760 } },
      data: {
        title: '订单服务',
        category: 'service',
        tech: ['Java 17', 'Spring Boot', 'gRPC'],
        description: '负责订单创建、状态流转与履约编排',
      },
    },
    {
      id: 'arch-product-svc',
      type: 'arch-component',
      meta: { position: { x: 460, y: 760 } },
      data: {
        title: '商品服务',
        category: 'service',
        tech: ['Java 17', 'Spring Boot'],
        description: '商品信息、库存预占与价格计算',
      },
    },
    {
      id: 'arch-pay-svc',
      type: 'arch-component',
      meta: { position: { x: 920, y: 760 } },
      data: {
        title: '支付服务',
        category: 'service',
        tech: ['Java 17', 'Spring Boot', 'RabbitMQ'],
        description: '支付单管理、渠道对接与对账',
      },
    },
    {
      id: 'arch-mysql',
      type: 'arch-component',
      meta: { position: { x: 0, y: 1140 } },
      data: {
        title: '交易主库',
        category: 'database',
        tech: ['MySQL 8.0', 'InnoDB', 'ShardingSphere'],
        description: '订单、用户与商品的核心关系型存储',
      },
    },
    {
      id: 'arch-redis',
      type: 'arch-component',
      meta: { position: { x: 460, y: 1140 } },
      data: {
        title: '缓存集群',
        category: 'cache',
        tech: ['Redis 7', 'Cluster'],
        description: '热点商品与订单详情缓存，支撑高并发读',
      },
    },
    {
      id: 'arch-kafka',
      type: 'arch-component',
      meta: { position: { x: 920, y: 1140 } },
      data: {
        title: '事件总线',
        category: 'queue',
        tech: ['Kafka', 'ZooKeeper'],
        description: '承载订单、支付与库存领域事件的异步分发',
      },
    },
    {
      id: 'arch-oss',
      type: 'arch-component',
      meta: { position: { x: 1380, y: 1140 } },
      data: {
        title: '对象存储',
        category: 'storage',
        tech: ['MinIO', 'S3 协议'],
        description: '存储商品图片与订单对账单导出文件',
      },
    },

    // ======================= 代码流程区（3 列，创建订单主流程） =======================
    {
      id: 'flow-order-start',
      type: 'flow-start',
      meta: { position: { x: 0, y: 0 } },
      data: {
        title: '接收创建订单请求',
        description: 'POST /api/orders，携带 SKU、数量与幂等 token',
      },
    },
    {
      id: 'flow-param-validate',
      type: 'flow-step',
      meta: { position: { x: 460, y: 0 } },
      data: {
        title: '参数与签名校验',
        description: '校验 SKU 合法性、数量大于 0 与签名有效性',
      },
    },
    {
      id: 'flow-idem-check',
      type: 'flow-decision',
      meta: { position: { x: 920, y: 0 } },
      data: {
        title: '幂等 token 是否已存在？',
        description: '查询 Redis 中该 token 的订单映射',
        defaultBranch: 'no',
      },
    },
    {
      id: 'flow-idem-hit',
      type: 'flow-step',
      meta: { position: { x: 0, y: 380 } },
      data: {
        title: '读取既有订单',
        description: '命中幂等记录，跳过创建直接返回原订单',
      },
    },
    {
      id: 'flow-stock-lock',
      type: 'flow-step',
      meta: { position: { x: 460, y: 380 } },
      data: {
        title: '锁定商品库存',
        description: '调用商品服务以乐观锁预占可售库存',
      },
    },
    {
      id: 'flow-stock-decision',
      type: 'flow-decision',
      meta: { position: { x: 920, y: 380 } },
      data: {
        title: '库存是否充足？',
        description: '依据库存服务返回的可售数量判断',
        defaultBranch: 'yes',
      },
    },
    {
      id: 'flow-stock-fail',
      type: 'flow-end',
      meta: { position: { x: 0, y: 760 } },
      data: {
        title: '返回库存不足',
        description: '释放已预占库存并向用户提示缺货',
      },
    },
    {
      id: 'flow-coupon-verify',
      type: 'flow-step',
      meta: { position: { x: 460, y: 760 } },
      data: {
        title: '校验并核销优惠券',
        description: '校验券状态与门槛，锁定并核销用户券',
      },
    },
    {
      id: 'flow-amount-calc',
      type: 'flow-step',
      meta: { position: { x: 920, y: 760 } },
      data: {
        title: '计算订单应付金额',
        description: '商品小计 + 运费 - 优惠金额',
      },
    },
    {
      id: 'flow-create-order',
      type: 'flow-step',
      meta: { position: { x: 0, y: 1140 } },
      data: {
        title: '落库创建订单',
        description: '写入 order 与 order_item，生成订单号',
      },
    },
    {
      id: 'flow-create-payment',
      type: 'flow-step',
      meta: { position: { x: 460, y: 1140 } },
      data: {
        title: '创建待支付单',
        description: '写入 payment 并生成支付流水号',
      },
    },
    {
      id: 'flow-order-cache',
      type: 'flow-step',
      meta: { position: { x: 920, y: 1140 } },
      data: {
        title: '缓存订单详情',
        description: '写入 Redis，TTL 30 分钟',
      },
    },
    {
      id: 'flow-event-publish',
      type: 'flow-notify',
      meta: { position: { x: 0, y: 1520 } },
      data: {
        title: '发送订单创建事件',
        description: '向 Kafka 投递 order.created 事件',
      },
    },
    {
      id: 'flow-response',
      type: 'flow-step',
      meta: { position: { x: 460, y: 1520 } },
      data: {
        title: '返回订单号与支付参数',
        description: '响应客户端并唤起收银台',
      },
    },
    {
      id: 'flow-order-end',
      type: 'flow-end',
      meta: { position: { x: 920, y: 1520 } },
      data: {
        title: '创建订单完成',
        description: '订单进入待支付状态',
      },
    },
    {
      id: 'flow-pay-delay',
      type: 'flow-delay',
      meta: { position: { x: 0, y: 1900 } },
      data: {
        title: '等待支付结果回调',
        description: '支付服务异步回调后继续，超时 15 分钟自动关单',
      },
    },
    {
      id: 'flow-parallel-post',
      type: 'flow-parallel',
      meta: { position: { x: 460, y: 1900 } },
      data: {
        title: '并行处理后续任务',
        description: '对账核销、库存回补与消息推送并行执行',
      },
    },
    {
      id: 'flow-subprocess-settle',
      type: 'flow-subprocess',
      meta: { position: { x: 920, y: 1900 } },
      data: {
        title: '对账子流程',
        description: '核对支付流水与订单金额，异常则触发告警',
      },
    },
    {
      id: 'note-flow',
      type: 'note',
      meta: { position: { x: 0, y: 2280 } },
      data: {
        size: { width: 360, height: 220 },
        note:
          '创建订单主流程：入口 → 参数校验 → 幂等判断 → 库存预占 → 优惠核销 → 金额计算 → 落库 → 支付单 → 缓存 → 事件 → 响应。\n' +
          '两个判断节点：幂等 token 命中走「是」分支直接返回，库存不足走「否」分支终止。\n' +
          '订单创建完成后异步等待支付回调，随后并行执行对账、库存回补等后续任务。\n' +
          '失败路径均需回滚已预占的库存与优惠券。',
      },
    },

    // ======================= 运行逻辑区（3 列，启动 + 请求生命周期） =======================
    {
      id: 'rt-boot-start',
      type: 'flow-start',
      meta: { position: { x: 0, y: 0 } },
      data: {
        title: '进程启动',
        description: '加载环境变量、配置中心配置与启动参数',
      },
    },
    {
      id: 'rt-db-pool',
      type: 'flow-step',
      meta: { position: { x: 460, y: 0 } },
      data: {
        title: '初始化连接池',
        description: '创建 MySQL 连接池与 Redis 集群连接并探活',
      },
    },
    {
      id: 'rt-register',
      type: 'runtime-scheduled',
      meta: { position: { x: 920, y: 0 } },
      data: {
        title: '注册服务并定时上报心跳',
        description: '向注册中心上报地址，按 10s 周期发送心跳与指标',
      },
    },
    {
      id: 'rt-ready',
      type: 'flow-step',
      meta: { position: { x: 0, y: 380 } },
      data: {
        title: '监听端口就绪',
        description: '监听 8080 端口，进入可接收流量状态',
      },
    },
    {
      id: 'rt-req-in',
      type: 'runtime-event',
      meta: { position: { x: 460, y: 380 } },
      data: {
        title: '监听 HTTP 请求事件',
        description: '网关转发请求，容器触发请求到达事件进入处理链',
      },
    },
    {
      id: 'rt-auth-decision',
      type: 'flow-decision',
      meta: { position: { x: 920, y: 380 } },
      data: {
        title: '鉴权是否通过？',
        description: '校验 JWT 签名与接口权限',
        defaultBranch: 'yes',
      },
    },
    {
      id: 'rt-route',
      type: 'flow-step',
      meta: { position: { x: 0, y: 760 } },
      data: {
        title: '路由匹配与参数绑定',
        description: '匹配 Controller 并反序列化请求体',
      },
    },
    {
      id: 'rt-handle-decision',
      type: 'flow-decision',
      meta: { position: { x: 460, y: 760 } },
      data: {
        title: '业务处理是否成功？',
        description: '捕获业务异常与校验失败',
        defaultBranch: 'yes',
      },
    },
    {
      id: 'rt-respond',
      type: 'flow-step',
      meta: { position: { x: 920, y: 760 } },
      data: {
        title: '序列化响应结果',
        description: '成功返回 200，异常返回错误码',
      },
    },
    {
      id: 'rt-error-log',
      type: 'flow-step',
      meta: { position: { x: 0, y: 1140 } },
      data: {
        title: '记录异常并上报监控',
        description: '写入错误日志并上报 Prometheus 指标',
      },
    },
    {
      id: 'rt-reject',
      type: 'flow-end',
      meta: { position: { x: 460, y: 1140 } },
      data: {
        title: '返回 401 未授权',
        description: '鉴权失败，拒绝请求并记录审计日志',
      },
    },
    {
      id: 'rt-req-end',
      type: 'flow-end',
      meta: { position: { x: 920, y: 1140 } },
      data: {
        title: '响应写回并结束请求',
        description: '返回响应体并释放请求上下文资源',
      },
    },
    {
      id: 'note-runtime',
      type: 'note',
      meta: { position: { x: 0, y: 1520 } },
      data: {
        size: { width: 360, height: 220 },
        note:
          '运行逻辑分两段：进程启动（配置加载 → 连接池 → 注册 → 就绪）与请求生命周期（接入 → 鉴权 → 路由 → 处理 → 响应）。\n' +
          '鉴权失败直接 401 终止；业务异常先落监控日志再写回响应。\n' +
          '全链路通过 Trace ID 串联，指标由 Prometheus 采集。',
      },
    },
  ],

  edges: [
    // ======================= 数据库表关联（db-relation） =======================
    {
      sourceNodeID: 'db-user',
      targetNodeID: 'db-order',
      data: { kind: 'db-relation', relation: '1:N', label: 'user.id → order.user_id' },
    },
    {
      sourceNodeID: 'db-user',
      targetNodeID: 'db-user-address',
      data: { kind: 'db-relation', relation: '1:N', label: 'user.id → user_address.user_id' },
    },
    {
      sourceNodeID: 'db-user',
      targetNodeID: 'db-user-coupon',
      data: { kind: 'db-relation', relation: '1:N', label: 'user.id → user_coupon.user_id' },
    },
    {
      sourceNodeID: 'db-coupon',
      targetNodeID: 'db-user-coupon',
      data: { kind: 'db-relation', relation: '1:N', label: 'coupon.id → user_coupon.coupon_id' },
    },
    {
      sourceNodeID: 'db-coupon',
      targetNodeID: 'db-order',
      data: { kind: 'db-relation', relation: '1:N', label: 'coupon.id → order.coupon_id' },
    },
    {
      sourceNodeID: 'db-product',
      targetNodeID: 'db-inventory',
      data: { kind: 'db-relation', relation: '1:N', label: 'product.id → inventory.product_id' },
    },
    {
      sourceNodeID: 'db-product',
      targetNodeID: 'db-order-item',
      data: { kind: 'db-relation', relation: '1:N', label: 'product.id → order_item.product_id' },
    },
    {
      sourceNodeID: 'db-order',
      targetNodeID: 'db-order-item',
      data: { kind: 'db-relation', relation: '1:N', label: 'order.id → order_item.order_id' },
    },
    {
      sourceNodeID: 'db-order',
      targetNodeID: 'db-payment',
      data: { kind: 'db-relation', relation: '1:N', label: 'order.id → payment.order_id' },
    },
    {
      sourceNodeID: 'db-order',
      targetNodeID: 'db-refund',
      data: { kind: 'db-relation', relation: '1:N', label: 'order.id → refund.order_id' },
    },
    {
      sourceNodeID: 'db-payment',
      targetNodeID: 'db-refund',
      data: { kind: 'db-relation', relation: '1:N', label: 'payment.id → refund.payment_id' },
    },
    {
      sourceNodeID: 'db-user-coupon',
      targetNodeID: 'db-order',
      data: { kind: 'db-relation', relation: '1:1', label: 'user_coupon.order_id → order.id' },
    },

    // ======================= 架构依赖（dependency） =======================
    {
      sourceNodeID: 'arch-web',
      targetNodeID: 'arch-gateway',
      data: { kind: 'dependency', label: 'HTTPS 调用统一入口' },
    },
    {
      sourceNodeID: 'arch-admin',
      targetNodeID: 'arch-gateway',
      data: { kind: 'dependency', label: '后台管理接口经网关转发' },
    },
    {
      sourceNodeID: 'arch-miniapp',
      targetNodeID: 'arch-gateway',
      data: { kind: 'dependency', label: '小程序请求经网关接入' },
    },
    {
      sourceNodeID: 'arch-gateway',
      targetNodeID: 'arch-bff',
      data: { kind: 'dependency', label: '鉴权通过后转发至聚合层' },
    },
    {
      sourceNodeID: 'arch-bff',
      targetNodeID: 'arch-order-svc',
      data: { kind: 'dependency', label: 'gRPC 调用订单服务' },
    },
    {
      sourceNodeID: 'arch-bff',
      targetNodeID: 'arch-product-svc',
      data: { kind: 'dependency', label: 'gRPC 调用商品服务' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-product-svc',
      data: { kind: 'dependency', label: '下单时预占库存' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-pay-svc',
      data: { kind: 'dependency', label: '创建支付单' },
    },
    {
      sourceNodeID: 'arch-pay-svc',
      targetNodeID: 'arch-thirdpay',
      data: { kind: 'dependency', label: '调用第三方支付渠道' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-mysql',
      data: { kind: 'dependency', label: '读写订单库' },
    },
    {
      sourceNodeID: 'arch-product-svc',
      targetNodeID: 'arch-mysql',
      data: { kind: 'dependency', label: '读写商品与库存' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-redis',
      data: { kind: 'dependency', label: '缓存订单详情' },
    },
    {
      sourceNodeID: 'arch-product-svc',
      targetNodeID: 'arch-redis',
      data: { kind: 'dependency', label: '缓存热点商品' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-kafka',
      data: { kind: 'dependency', label: '投递订单领域事件' },
    },
    {
      sourceNodeID: 'arch-pay-svc',
      targetNodeID: 'arch-kafka',
      data: { kind: 'dependency', label: '投递支付结果事件' },
    },
    {
      sourceNodeID: 'arch-order-svc',
      targetNodeID: 'arch-oss',
      data: { kind: 'dependency', label: '导出订单对账单' },
    },

    // ======================= 代码流程（flow，创建订单） =======================
    {
      sourceNodeID: 'flow-order-start',
      targetNodeID: 'flow-param-validate',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-param-validate',
      targetNodeID: 'flow-idem-check',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-idem-check',
      targetNodeID: 'flow-idem-hit',
      sourcePortID: 'yes',
      data: { kind: 'flow', branch: 'yes', label: 'token 已存在' },
    },
    {
      sourceNodeID: 'flow-idem-check',
      targetNodeID: 'flow-stock-lock',
      sourcePortID: 'no',
      data: { kind: 'flow', branch: 'no', label: 'token 不存在' },
    },
    {
      sourceNodeID: 'flow-idem-hit',
      targetNodeID: 'flow-response',
      data: { kind: 'flow', label: '返回既有订单' },
    },
    {
      sourceNodeID: 'flow-stock-lock',
      targetNodeID: 'flow-stock-decision',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-stock-decision',
      targetNodeID: 'flow-coupon-verify',
      sourcePortID: 'yes',
      data: { kind: 'flow', branch: 'yes', label: '库存充足' },
    },
    {
      sourceNodeID: 'flow-stock-decision',
      targetNodeID: 'flow-stock-fail',
      sourcePortID: 'no',
      data: { kind: 'flow', branch: 'no', label: '库存不足' },
    },
    {
      sourceNodeID: 'flow-coupon-verify',
      targetNodeID: 'flow-amount-calc',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-amount-calc',
      targetNodeID: 'flow-create-order',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-create-order',
      targetNodeID: 'flow-create-payment',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-create-payment',
      targetNodeID: 'flow-order-cache',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-order-cache',
      targetNodeID: 'flow-event-publish',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-event-publish',
      targetNodeID: 'flow-response',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-response',
      targetNodeID: 'flow-order-end',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'flow-order-end',
      targetNodeID: 'flow-pay-delay',
      data: { kind: 'flow', label: '异步等待支付回调' },
    },
    {
      sourceNodeID: 'flow-pay-delay',
      targetNodeID: 'flow-parallel-post',
      data: { kind: 'flow', label: '支付成功后并行处理' },
    },
    {
      sourceNodeID: 'flow-parallel-post',
      targetNodeID: 'flow-subprocess-settle',
      data: { kind: 'flow', label: '对账子流程' },
    },

    // ======================= 运行逻辑（flow，启动 + 请求生命周期） =======================
    {
      sourceNodeID: 'rt-boot-start',
      targetNodeID: 'rt-db-pool',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'rt-db-pool',
      targetNodeID: 'rt-register',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'rt-register',
      targetNodeID: 'rt-ready',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'rt-ready',
      targetNodeID: 'rt-req-in',
      data: { kind: 'flow', label: '服务就绪后接入流量' },
    },
    {
      sourceNodeID: 'rt-req-in',
      targetNodeID: 'rt-auth-decision',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'rt-auth-decision',
      targetNodeID: 'rt-route',
      sourcePortID: 'yes',
      data: { kind: 'flow', branch: 'yes', label: '鉴权通过' },
    },
    {
      sourceNodeID: 'rt-auth-decision',
      targetNodeID: 'rt-reject',
      sourcePortID: 'no',
      data: { kind: 'flow', branch: 'no', label: '鉴权失败' },
    },
    {
      sourceNodeID: 'rt-route',
      targetNodeID: 'rt-handle-decision',
      data: { kind: 'flow' },
    },
    {
      sourceNodeID: 'rt-handle-decision',
      targetNodeID: 'rt-respond',
      sourcePortID: 'yes',
      data: { kind: 'flow', branch: 'yes', label: '处理成功' },
    },
    {
      sourceNodeID: 'rt-handle-decision',
      targetNodeID: 'rt-error-log',
      sourcePortID: 'no',
      data: { kind: 'flow', branch: 'no', label: '处理失败' },
    },
    {
      sourceNodeID: 'rt-error-log',
      targetNodeID: 'rt-respond',
      data: { kind: 'flow', label: '记录异常后返回错误码' },
    },
    {
      sourceNodeID: 'rt-respond',
      targetNodeID: 'rt-req-end',
      data: { kind: 'flow' },
    },
  ],
};
