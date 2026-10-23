'use strict';

// 用法：node 模拟1-隐藏测试.js <你的项目目录>
const path = require('path');
const assert = require('assert');

const projectDir = path.resolve(process.argv[2] || '.');
const { CommentService } = require(path.join(projectDir, 'src'));
const { loadSeed } = require(path.join(projectDir, 'src', 'seed'));

const SEED = [
  { videoId: 'v100', userId: 'u1', content: '第一！', createdAt: '2026-10-01T08:00:00+08:00', likeCount: 12 },
  { videoId: 'v100', userId: 'u2', content: '这个转场怎么做的', createdAt: '2026-10-01T09:30:00+08:00', likeCount: 3 },
  { videoId: 'v100', userId: 'u3', content: 'BGM 叫什么', createdAt: '2026-10-01T08:45:00+08:00', likeCount: 40 },
  { videoId: 'v200', userId: 'u1', content: '打卡', createdAt: '2026-10-02T10:00:00+08:00', likeCount: 0 },
  { videoId: 'v100', userId: 'u4', content: '已三连', createdAt: '2026-10-02T21:15:00+08:00', likeCount: 1 },
  { videoId: 'v100', userId: 'u5', content: '求教程', createdAt: '2026-10-01T23:59:00+08:00', likeCount: 7 },
  { videoId: 'v200', userId: 'u6', content: '前排', createdAt: '2026-10-02T09:00:00+08:00', likeCount: 2 },
  { videoId: 'v100', userId: 'u6', content: '拍得真好', createdAt: '2026-10-02T07:20:00+08:00', likeCount: 5 },
];

const HOUR = 3600 * 1000;
const BASE = Date.parse('2026-10-20T12:00:00+08:00');

function svc(options = {}) {
  const c = { t: BASE };
  c.now = () => c.t;
  const s = new CommentService({ now: c.now, ...options });
  const add = (videoId, userId, content, extra = {}) => {
    c.t += 1000;
    return s.addComment({ videoId, userId, content, ...extra });
  };
  return { s, c, add };
}

function expectCode(fn, code) {
  let err;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  assert.ok(err, `应抛出 code=${code} 的错误，实际没有抛错`);
  assert.strictEqual(err.code, code, `应抛出 code=${code}，实际 code=${err.code}（${err.message}）`);
}

const contents = (items) => items.map((i) => i.content);

const tests = [];
const T = (stage, name, fn) => tests.push({ stage, name, fn });

// ---------------- 关 1 ----------------

T(1, '种子数据按发布时间倒序', () => {
  const { s } = svc();
  loadSeed(s, JSON.parse(JSON.stringify(SEED)));
  const r = s.listComments('v100');
  assert.strictEqual(r.total, 6);
  assert.deepStrictEqual(contents(r.items), ['已三连', '拍得真好', '求教程', '这个转场怎么做的', 'BGM 叫什么', '第一！']);
});

T(1, '分页从第 1 页开始', () => {
  const { s, add } = svc();
  for (let i = 1; i <= 25; i++) add('v1', `u${i}`, `评论${i}`);
  const p1 = s.listComments('v1', { page: 1, pageSize: 10 });
  assert.strictEqual(p1.total, 25);
  assert.strictEqual(p1.items[0].content, '评论25');
  const p3 = s.listComments('v1', { page: 3, pageSize: 10 });
  assert.deepStrictEqual(contents(p3.items), ['评论5', '评论4', '评论3', '评论2', '评论1']);
  assert.strictEqual(s.listComments('v1', { page: 4, pageSize: 10 }).items.length, 0);
});

T(1, 'createdAt 统一为毫秒数字', () => {
  const { s, add } = svc();
  loadSeed(s, JSON.parse(JSON.stringify(SEED)));
  add('v100', 'u9', '新评论');
  for (const item of s.listComments('v100').items) {
    assert.strictEqual(typeof item.createdAt, 'number', `${item.content} 的 createdAt 是 ${typeof item.createdAt}`);
  }
});

// ---------------- 关 2 ----------------

T(2, '同一用户重复点赞只算一次', () => {
  const { s, add } = svc();
  const c = add('v1', 'u1', '好看');
  s.likeComment(c.id, 'u2');
  s.likeComment(c.id, 'u2');
  assert.strictEqual(s.likeComment(c.id, 'u3'), 2);
});

T(2, '取消点赞', () => {
  const { s, add } = svc();
  const c = add('v1', 'u1', '好看');
  s.likeComment(c.id, 'u2');
  s.likeComment(c.id, 'u3');
  assert.strictEqual(s.unlikeComment(c.id, 'u2'), 1);
  assert.strictEqual(s.unlikeComment(c.id, 'u2'), 1, '重复取消不应再减');
  assert.strictEqual(s.unlikeComment(c.id, 'u9'), 1, '没点过赞的人取消不应减');
});

T(2, '列表标出我是否点过赞', () => {
  const { s, add } = svc();
  const c1 = add('v1', 'u1', 'a');
  const c2 = add('v1', 'u1', 'b');
  s.likeComment(c1.id, 'u9');
  const items = s.listComments('v1', { viewerId: 'u9' }).items;
  assert.strictEqual(items.find((i) => i.id === c1.id).liked, true);
  assert.strictEqual(items.find((i) => i.id === c2.id).liked, false);
  for (const i of s.listComments('v1').items) assert.strictEqual(i.liked, false);
});

T(2, '点赞不存在的评论报 404', () => {
  const { s } = svc();
  expectCode(() => s.likeComment('999999', 'u1'), 404);
});

T(2, '回复根评论', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  assert.ok(root.parentId == null && root.rootId == null && root.replyToUserId == null, '根评论的 parentId/rootId/replyToUserId 应为 null');
  const r = add('v1', 'u2', '回复', { parentId: root.id });
  assert.strictEqual(r.rootId, root.id);
  assert.strictEqual(r.parentId, root.id);
  assert.strictEqual(r.replyToUserId, 'u1');
  const list = s.listComments('v1');
  assert.strictEqual(list.total, 1, 'total 只算根评论');
  assert.strictEqual(list.items[0].replyCount, 1);
});

T(2, '回复的回复归到根评论下', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  const r1 = add('v1', 'u2', 'r1', { parentId: root.id });
  const r2 = add('v1', 'u3', 'r2', { parentId: r1.id });
  assert.strictEqual(r2.rootId, root.id);
  assert.strictEqual(r2.parentId, r1.id);
  assert.strictEqual(r2.replyToUserId, 'u2');
  assert.strictEqual(s.listComments('v1').items[0].replyCount, 2);
  assert.strictEqual(s.listReplies(root.id).total, 2);
});

T(2, '根评论带最早 2 条回复', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  add('v1', 'u2', 'a', { parentId: root.id });
  add('v1', 'u3', 'b', { parentId: root.id });
  add('v1', 'u4', 'c', { parentId: root.id });
  const item = s.listComments('v1').items[0];
  assert.strictEqual(item.replyCount, 3);
  assert.deepStrictEqual(contents(item.replies), ['a', 'b']);
});

T(2, '回复列表按时间正序分页', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  for (let i = 1; i <= 5; i++) add('v1', `u${i}`, `r${i}`, { parentId: root.id });
  const p2 = s.listReplies(root.id, { page: 2, pageSize: 2 });
  assert.strictEqual(p2.total, 5);
  assert.deepStrictEqual(contents(p2.items), ['r3', 'r4']);
});

T(2, '回复不存在的评论报 404', () => {
  const { add } = svc();
  expectCode(() => add('v1', 'u1', 'x', { parentId: '999999' }), 404);
});

T(2, '跨视频回复报 400', () => {
  const { add } = svc();
  const root = add('v1', 'u1', '根');
  expectCode(() => add('v2', 'u2', 'x', { parentId: root.id }), 400);
});

// ---------------- 关 3 ----------------

T(3, '内容去掉首尾空白后保存', () => {
  const { add } = svc();
  assert.strictEqual(add('v1', 'u1', '  你好  ').content, '你好');
});

T(3, '空内容、纯空白、非字符串报 400', () => {
  const { add } = svc();
  expectCode(() => add('v1', 'u1', ''), 400);
  expectCode(() => add('v1', 'u1', '   \n '), 400);
  expectCode(() => add('v1', 'u1', 123), 400);
});

T(3, '长度上限 500（按字符数，emoji 算 1 个）', () => {
  const { add } = svc();
  add('v1', 'u1', 'a'.repeat(500));
  add('v1', 'u1', '😀'.repeat(500));
  expectCode(() => add('v1', 'u1', 'a'.repeat(501)), 400);
});

T(3, '敏感词替换成等长星号，不区分大小写', () => {
  const { add } = svc({ sensitiveWords: ['傻瓜', 'spam'] });
  assert.strictEqual(add('v1', 'u1', '你这个傻瓜 SPAM spam').content, '你这个** **** ****');
});

T(3, '只能删除自己的评论', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  expectCode(() => s.deleteComment(root.id, 'u2'), 403);
  expectCode(() => s.deleteComment('999999', 'u1'), 404);
});

T(3, '删除没有回复的根评论：从列表消失', () => {
  const { s, add } = svc();
  const a = add('v1', 'u1', 'a');
  add('v1', 'u2', 'b');
  assert.strictEqual(s.deleteComment(a.id, 'u1'), true);
  const r = s.listComments('v1');
  assert.strictEqual(r.total, 1);
  assert.deepStrictEqual(contents(r.items), ['b']);
  expectCode(() => s.deleteComment(a.id, 'u1'), 404);
});

T(3, '删除有回复的根评论：保留占位', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  add('v1', 'u2', '回复', { parentId: root.id });
  s.deleteComment(root.id, 'u1');
  const r = s.listComments('v1');
  assert.strictEqual(r.total, 1);
  const item = r.items[0];
  assert.strictEqual(item.deleted, true);
  assert.strictEqual(item.content, '该评论已删除');
  assert.strictEqual(item.userId, null);
  assert.strictEqual(item.replyCount, 1);
  assert.deepStrictEqual(contents(item.replies), ['回复']);
});

T(3, '删除回复：回复数减一', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  const r1 = add('v1', 'u2', 'r1', { parentId: root.id });
  add('v1', 'u3', 'r2', { parentId: root.id });
  s.deleteComment(r1.id, 'u2');
  const item = s.listComments('v1').items[0];
  assert.strictEqual(item.replyCount, 1);
  assert.deepStrictEqual(contents(item.replies), ['r2']);
  assert.strictEqual(s.listReplies(root.id).total, 1);
});

T(3, '已删除的评论不能点赞、不能回复', () => {
  const { s, add } = svc();
  const a = add('v1', 'u1', 'a');
  s.deleteComment(a.id, 'u1');
  expectCode(() => s.likeComment(a.id, 'u2'), 404);
  expectCode(() => add('v1', 'u2', 'x', { parentId: a.id }), 404);
});

T(3, '分页参数不合法报 400', () => {
  const { s, add } = svc();
  const root = add('v1', 'u1', '根');
  expectCode(() => s.listComments('v1', { page: 0 }), 400);
  expectCode(() => s.listComments('v1', { page: -1 }), 400);
  expectCode(() => s.listComments('v1', { pageSize: 0 }), 400);
  expectCode(() => s.listComments('v1', { pageSize: 51 }), 400);
  expectCode(() => s.listComments('v1', { pageSize: 1.5 }), 400);
  expectCode(() => s.listReplies(root.id, { pageSize: 51 }), 400);
  s.listComments('v1', { page: 1, pageSize: 50 });
});

// ---------------- 关 4 ----------------

function hotFixture() {
  const { s, c, add } = svc();
  const at = (h) => (c.t = BASE + h * HOUR);
  at(10);
  const B = add('v1', 'uB', 'B');
  for (let i = 0; i < 10; i++) s.likeComment(B.id, `b${i}`);
  at(15);
  const D = add('v1', 'uD', 'D');
  add('v1', 'x1', 'D-r1', { parentId: D.id });
  add('v1', 'x2', 'D-r2', { parentId: D.id });
  s.likeComment(D.id, 'd0');
  at(19);
  const A = add('v1', 'uA', 'A');
  for (let i = 0; i < 3; i++) s.likeComment(A.id, `a${i}`);
  at(20);
  add('v1', 'uC', 'C');
  at(20);
  return s;
}

T(4, '热度排序', () => {
  // A: 3/3^1.5≈0.577  D: 5/7^1.5≈0.270  B: 10/12^1.5≈0.241  C: 0
  const s = hotFixture();
  assert.deepStrictEqual(contents(s.listComments('v1', { sort: 'hot' }).items), ['A', 'D', 'B', 'C']);
  assert.deepStrictEqual(contents(s.listComments('v1').items), ['C', 'A', 'D', 'B'], '默认仍按时间倒序');
});

T(4, '热度排序支持分页', () => {
  const s = hotFixture();
  assert.deepStrictEqual(contents(s.listComments('v1', { sort: 'hot', page: 2, pageSize: 2 }).items), ['B', 'C']);
});

T(4, '热度相同按发布时间倒序', () => {
  const { s, c, add } = svc();
  c.t = BASE;
  add('v1', 'u1', 'X');
  c.t = BASE + HOUR;
  add('v1', 'u2', 'Y');
  c.t = BASE + 2 * HOUR;
  assert.deepStrictEqual(contents(s.listComments('v1', { sort: 'hot' }).items), ['Y', 'X']);
});

T(4, '性能：20 万条评论，按时间翻页平均 < 1ms', () => {
  const { s, c } = svc();
  for (let i = 0; i < 100000; i++) {
    c.t += 10;
    s.addComment({ videoId: 'big', userId: `u${i % 1000}`, content: `c${i}` });
    c.t += 10;
    s.addComment({ videoId: 'other', userId: 'u1', content: `o${i}` });
  }
  const p1 = s.listComments('big', { page: 1, pageSize: 20 });
  assert.strictEqual(p1.total, 100000);
  assert.strictEqual(p1.items[0].content, 'c99999');
  assert.strictEqual(s.listComments('big', { page: 100, pageSize: 20 }).items[0].content, `c${99999 - 99 * 20}`);
  for (let i = 0; i < 5; i++) s.listComments('big', { page: 1, pageSize: 20 });
  const N = 50;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < N; i++) s.listComments('big', { page: 1 + (i % 100), pageSize: 20 });
  const avg = Number(process.hrtime.bigint() - t0) / 1e6 / N;
  console.log(`      （平均 ${avg.toFixed(3)}ms）`);
  assert.ok(avg < 1, `平均 ${avg.toFixed(2)}ms，超过 1ms`);
});

// ---------------- 运行 ----------------

(async () => {
  const stats = {};
  for (const t of tests) {
    const st = (stats[t.stage] = stats[t.stage] || { pass: 0, total: 0 });
    st.total++;
    try {
      await t.fn();
      st.pass++;
      console.log(`  ✓ [关${t.stage}] ${t.name}`);
    } catch (e) {
      console.log(`  ✗ [关${t.stage}] ${t.name}\n      ${e && e.message}`);
    }
  }
  console.log('\n关卡汇总：');
  for (const [stage, st] of Object.entries(stats)) {
    console.log(`  关${stage}：${st.pass}/${st.total}${st.pass === st.total ? '  ✅ 通关' : ''}`);
  }
})();
