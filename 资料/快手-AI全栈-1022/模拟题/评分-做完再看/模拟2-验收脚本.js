'use strict';

// 用法：
//   1. 用 MOCK_NOW=2026-10-20T12:10:00+08:00 启动你的服务（每次跑脚本前重启，脚本会改订单状态）
//   2. node 模拟2-验收脚本.js [服务地址，默认 http://localhost:3000] [前端地址，默认 <服务地址>/orders/O1001]
const http = require('http');
const assert = require('assert');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const FRONT = process.argv[3] || `${BASE}/orders/O1001`;
const NOW = Date.parse('2026-10-20T12:10:00+08:00');

function request(method, url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (raw += d));
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch (e) {
          body = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('请求超时')));
    if (method === 'POST') req.write('{}');
    req.end();
  });
}

const get = (id) => request('GET', `${BASE}/api/orders/${id}`);
const post = (id, action) => request('POST', `${BASE}/api/orders/${id}/${action}`);

function expectStatus(res, code) {
  assert.strictEqual(res.status, code, `HTTP 状态应为 ${code}，实际 ${res.status}：${JSON.stringify(res.body).slice(0, 200)}`);
}

function expectAmounts(o, itemsTotal, deliveryFee, discount, payable) {
  assert.deepStrictEqual(
    { ...o.amounts },
    { itemsTotal, deliveryFee, discount, payable },
    `金额应为 ${JSON.stringify({ itemsTotal, deliveryFee, discount, payable })}，实际 ${JSON.stringify(o.amounts)}`,
  );
}

const sameSet = (a, b, label) =>
  assert.deepStrictEqual([...(a || [])].sort(), [...b].sort(), `${label}应为 ${JSON.stringify(b)}，实际 ${JSON.stringify(a)}`);

const timelineStatuses = (o) => (o.timeline || []).map((t) => t.status);

function expectTimelineOrdered(o) {
  const times = (o.timeline || []).map((t) => Date.parse(t.time));
  assert.ok(times.every((t) => !Number.isNaN(t)), 'timeline 的 time 应是合法时间');
  for (let i = 1; i < times.length; i++) assert.ok(times[i - 1] <= times[i], 'timeline 应按时间正序');
}

const checks = [];
const C = (group, name, fn) => checks.push({ group, name, fn });

// ---------- 查询 ----------

C('必做', '待付款订单 O1001：状态、倒计时、按钮', async () => {
  const r = await get('O1001');
  expectStatus(r, 200);
  const o = r.body;
  assert.strictEqual(o.status, 'PENDING_PAYMENT');
  assert.strictEqual(o.statusText, '待付款');
  assert.ok(Math.abs(o.payRemainingSeconds - 1200) <= 1, `payRemainingSeconds 应为 1200，实际 ${o.payRemainingSeconds}`);
  sameSet(o.actions, ['PAY', 'CANCEL'], 'actions ');
  sameSet(timelineStatuses(o), ['CREATED'], 'timeline ');
});

C('必做', 'O1001 商品小计和金额（满减 + 免运费）', async () => {
  const o = (await get('O1001')).body;
  assert.deepStrictEqual(o.items.map((i) => i.subtotal), [3980, 990]);
  expectAmounts(o, 4970, 0, 500, 4470);
});

C('必做', '手机号脱敏', async () => {
  const o = (await get('O1001')).body;
  assert.strictEqual(o.address && o.address.phone, '138****5678');
});

C('必做', 'O1002 超时未支付按已取消返回', async () => {
  const o = (await get('O1002')).body;
  assert.strictEqual(o.status, 'CANCELLED');
  assert.ok(String(o.statusText).includes('超时'), `statusText 应含「超时」，实际 ${o.statusText}`);
  assert.strictEqual(o.payRemainingSeconds, null);
  sameSet(o.actions, ['BUY_AGAIN'], 'actions ');
  const last = o.timeline[o.timeline.length - 1];
  assert.strictEqual(last.status, 'CANCELLED');
  assert.strictEqual(Date.parse(last.time), Date.parse('2026-10-20T12:00:00+08:00'), '取消时间应为下单 + 30 分钟');
});

C('必做', 'O1002 金额（不满减 + 收运费）', async () => {
  expectAmounts((await get('O1002')).body, 3500, 600, 0, 4100);
});

C('必做', 'O1003 待发货：折扣封顶', async () => {
  const o = (await get('O1003')).body;
  assert.strictEqual(o.status, 'PAID');
  assert.strictEqual(o.statusText, '待发货');
  sameSet(o.actions, ['CANCEL'], 'actions ');
  sameSet(timelineStatuses(o), ['CREATED', 'PAID'], 'timeline ');
  expectTimelineOrdered(o);
  expectAmounts(o, 12900, 0, 1500, 11400);
});

C('必做', 'O1004 待收货：九折金额精确到分', async () => {
  const o = (await get('O1004')).body;
  assert.strictEqual(o.status, 'SHIPPED');
  assert.strictEqual(o.statusText, '待收货');
  sameSet(o.actions, ['CONFIRM_RECEIPT', 'VIEW_LOGISTICS'], 'actions ');
  sameSet(timelineStatuses(o), ['CREATED', 'PAID', 'SHIPPED'], 'timeline ');
  expectAmounts(o, 1000, 600, 100, 1500);
});

C('必做', 'O1005 已完成：优惠不超过商品总额', async () => {
  const o = (await get('O1005')).body;
  assert.strictEqual(o.status, 'COMPLETED');
  sameSet(o.actions, ['BUY_AGAIN'], 'actions ');
  expectAmounts(o, 500, 600, 500, 600);
});

C('必做', '订单不存在返回 404', async () => {
  const r = await get('O9999');
  expectStatus(r, 404);
  assert.strictEqual(r.body && r.body.code, 'ORDER_NOT_FOUND');
});

// ---------- 操作 ----------

C('必做', '待收货不能取消（409）', async () => {
  const r = await post('O1004', 'cancel');
  expectStatus(r, 409);
  assert.strictEqual(r.body && r.body.code, 'ORDER_CANNOT_CANCEL');
});

C('必做', '超时取消的订单不能再取消（409）', async () => {
  expectStatus(await post('O1002', 'cancel'), 409);
});

C('必做', '取消待发货订单 O1003', async () => {
  const r = await post('O1003', 'cancel');
  expectStatus(r, 200);
  assert.strictEqual(r.body.status, 'CANCELLED');
  sameSet(r.body.actions, ['BUY_AGAIN'], 'actions ');
  const last = r.body.timeline[r.body.timeline.length - 1];
  assert.strictEqual(last.status, 'CANCELLED');
  assert.strictEqual(Date.parse(last.time), NOW, '取消时间应为当前时间（MOCK_NOW）');
  assert.strictEqual((await get('O1003')).body.status, 'CANCELLED', '再查一次应是已取消');
  expectStatus(await post('O1003', 'cancel'), 409);
});

C('必做', '确认收货 O1004', async () => {
  const r = await post('O1004', 'confirm-receipt');
  expectStatus(r, 200);
  assert.strictEqual(r.body.status, 'COMPLETED');
  sameSet(r.body.actions, ['BUY_AGAIN'], 'actions ');
  sameSet(timelineStatuses(r.body), ['CREATED', 'PAID', 'SHIPPED', 'COMPLETED'], 'timeline ');
  const again = await post('O1004', 'confirm-receipt');
  expectStatus(again, 409);
  assert.strictEqual(again.body && again.body.code, 'ORDER_CANNOT_CONFIRM');
});

C('必做', '操作不存在的订单返回 404', async () => {
  expectStatus(await post('O9999', 'cancel'), 404);
  expectStatus(await post('O9999', 'confirm-receipt'), 404);
});

C('必做', '前端页面可访问', async () => {
  const r = await request('GET', FRONT);
  expectStatus(r, 200);
  assert.ok(String(r.headers['content-type']).includes('text/html'), `content-type 应为 text/html，实际 ${r.headers['content-type']}`);
});

C('加分', '并发取消 O1001：5 个请求只有 1 个成功', async () => {
  const rs = await Promise.all([1, 2, 3, 4, 5].map(() => post('O1001', 'cancel')));
  const codes = rs.map((r) => r.status);
  assert.strictEqual(codes.filter((c) => c === 200).length, 1, `应只有 1 个 200，实际 ${codes.join(',')}`);
  assert.strictEqual(codes.filter((c) => c === 409).length, 4, `其余应为 409，实际 ${codes.join(',')}`);
});

// ---------- 运行 ----------

(async () => {
  const stats = {};
  for (const c of checks) {
    const st = (stats[c.group] = stats[c.group] || { pass: 0, total: 0 });
    st.total++;
    try {
      await c.fn();
      st.pass++;
      console.log(`  ✓ [${c.group}] ${c.name}`);
    } catch (e) {
      console.log(`  ✗ [${c.group}] ${c.name}\n      ${e && e.message}`);
    }
  }
  console.log('\n汇总：');
  for (const [g, st] of Object.entries(stats)) console.log(`  ${g}：${st.pass}/${st.total}`);
})();
