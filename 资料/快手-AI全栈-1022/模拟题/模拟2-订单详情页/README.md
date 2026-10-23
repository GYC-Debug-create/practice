# 模拟 2：电商订单详情页（从零做全栈）

> 形式参照美团 / 蚂蚁的 AI Coding：只给需求文档和数据，从零做一个能跑的前后端项目。
> **限时 90 分钟**，可以用任何 AI 编码工具，技术栈不限。
> 评估会跑一套接口验收脚本，所以**接口约定必须严格照下面写**。

## 背景

用户在 App 里点开一个订单，看到订单详情页：状态、收货地址、商品、金额明细、订单进度，以及按当前状态能点的按钮（取消订单、确认收货等）。

订单数据在 `data/orders.json`，服务启动时读进内存即可，不需要数据库。

## 一、后端

### 1. 运行约定

- 一条命令启动，写在你的 README 里
- 端口读环境变量 `PORT`，默认 `3000`
- **当前时间**：如果设置了环境变量 `MOCK_NOW`（ISO 时间字符串），服务端的「当前时间」就**固定**为这个值（不往前走）；没设置就用真实时间
- 金额全部以**分**为单位的整数，接口也返回分

### 2. 业务规则

**状态**

| status | statusText | 可用操作 actions |
|---|---|---|
| `PENDING_PAYMENT` | 待付款 | `["PAY", "CANCEL"]` |
| `PAID` | 待发货 | `["CANCEL"]` |
| `SHIPPED` | 待收货 | `["CONFIRM_RECEIPT", "VIEW_LOGISTICS"]` |
| `COMPLETED` | 已完成 | `["BUY_AGAIN"]` |
| `CANCELLED` | 已取消 | `["BUY_AGAIN"]` |

**超时未支付**：待付款订单从 `createdAt` 起 30 分钟内要支付。超过 30 分钟还没付的，查询时就按「已取消」返回，`statusText` 为 `已取消（超时未支付）`，取消时间记为下单时间 + 30 分钟。

**金额**

- 商品总额 `itemsTotal` = Σ 单价 × 数量
- 运费 `deliveryFee`：商品总额满 49 元（4900 分）免运费，否则 6 元（600 分）
- 优惠 `discount`（只作用于商品总额，不减运费）：
  - `FULL_REDUCTION`：商品总额 ≥ `threshold` 时减 `amount`
  - `DISCOUNT`：打 `rate` 折（如 0.9 表示九折，最多两位小数），优惠额 = 商品总额 × (1 − rate)，**按分向下取整**，且不超过 `maxAmount`
  - 优惠不能超过商品总额
- 实付 `payable` = 商品总额 − 优惠 + 运费

**收货人手机号**：返回时脱敏为 `138****5678`（保留前 3 位和后 4 位）

**订单进度 timeline**：按时间正序排列下单、支付、发货、完成、取消这些发生过的节点

| status | 对应字段 |
|---|---|
| `CREATED` | `createdAt` |
| `PAID` | `paidAt` |
| `SHIPPED` | `shippedAt` |
| `COMPLETED` | `completedAt` |
| `CANCELLED` | 取消时间 |

### 3. 接口

**查询详情** `GET /api/orders/:id`

```json
{
  "id": "O1001",
  "status": "PENDING_PAYMENT",
  "statusText": "待付款",
  "payRemainingSeconds": 1200,
  "items": [
    { "skuId": "A100", "name": "保温杯 500ml", "price": 1990, "quantity": 2, "subtotal": 3980 }
  ],
  "amounts": { "itemsTotal": 4970, "deliveryFee": 0, "discount": 500, "payable": 4470 },
  "address": { "name": "张三", "phone": "138****5678", "detail": "北京市海淀区上地西路 6 号" },
  "timeline": [
    { "status": "CREATED", "text": "订单已提交", "time": "2026-10-20T12:00:00+08:00" }
  ],
  "actions": ["PAY", "CANCEL"]
}
```

- `payRemainingSeconds`：只有待付款时是剩余秒数，其他状态为 `null`
- `timeline[].text` 文案自定，`time` 是 ISO 时间字符串
- 订单不存在：`404`，`{ "code": "ORDER_NOT_FOUND", "message": "..." }`

**取消订单** `POST /api/orders/:id/cancel`

- 只有待付款、待发货可以取消；成功返回 `200` 和更新后的订单详情（结构同上），取消时间为当前时间
- 其他状态（包括已取消、超时取消）：`409`，`{ "code": "ORDER_CANNOT_CANCEL", "message": "..." }`
- 订单不存在：`404`

**确认收货** `POST /api/orders/:id/confirm-receipt`

- 只有待收货可以确认；成功返回 `200` 和更新后的订单详情，完成时间为当前时间
- 其他状态：`409`，`{ "code": "ORDER_CANNOT_CONFIRM", "message": "..." }`
- 订单不存在：`404`

## 二、前端

访问 `http://localhost:3000/orders/:id` 打开订单详情页（由同一个服务托管；如果前端单独起，在你的 README 里写明地址）。框架不限。

**必做**

- 展示：状态、收货信息、商品列表、金额明细（元，保留两位小数）、订单进度
- 按 `actions` 显示按钮；「取消订单」「确认收货」调用接口，成功后刷新页面数据；其他按钮点了提示「功能开发中」即可
- 订单不存在、接口出错时有提示，不白屏
- 手机宽度（375px）下正常显示

**加分**

- 待付款时显示倒计时，每秒走；走到 0 自动刷新
- 按钮点击后防重复提交
- 取消前二次确认

## 三、交付

- 源码 + 你的 README（怎么启动、前端地址）
- 测试：至少覆盖金额计算
- `过程记录.md`：时间点、关键决定、发现 AI 写错的地方
- 前端截图：至少待付款、待收货、已取消三种状态各一张
