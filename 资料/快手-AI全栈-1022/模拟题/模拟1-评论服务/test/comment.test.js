'use strict';

const assert = require('assert');
const { CommentService } = require('../src');
const { loadSeed } = require('../src/seed');
const seed = require('../data/seed.json');

function fixedClock(start = Date.parse('2026-10-20T12:00:00+08:00')) {
  let t = start;
  return () => (t += 1000);
}

test('新增评论后能查到', () => {
  const s = new CommentService({ now: fixedClock() });
  const c = s.addComment({ videoId: 'v1', userId: 'u1', content: '好看' });
  const r = s.listComments('v1');
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.items[0] && r.items[0].id, c.id);
});

test('分页：第 1 页是最新的，第 3 页是剩下的', () => {
  const s = new CommentService({ now: fixedClock() });
  for (let i = 1; i <= 25; i++) {
    s.addComment({ videoId: 'v1', userId: `u${i}`, content: `评论${i}` });
  }
  const p1 = s.listComments('v1', { page: 1, pageSize: 10 });
  assert.strictEqual(p1.items.length, 10);
  assert.strictEqual(p1.items[0].content, '评论25');
  const p3 = s.listComments('v1', { page: 3, pageSize: 10 });
  assert.strictEqual(p3.items.length, 5);
  assert.strictEqual(p3.items[4].content, '评论1');
});

test('种子数据按发布时间倒序', () => {
  const s = new CommentService({ now: fixedClock() });
  loadSeed(s, JSON.parse(JSON.stringify(seed)));
  const r = s.listComments('v100');
  assert.strictEqual(r.total, 6);
  assert.strictEqual(r.items[0] && r.items[0].content, '已三连');
});

test('点赞数加一', () => {
  const s = new CommentService({ now: fixedClock() });
  const c = s.addComment({ videoId: 'v1', userId: 'u1', content: '好看' });
  assert.strictEqual(s.likeComment(c.id, 'u2'), 1);
});

test('评论不存在时点赞报 404', () => {
  const s = new CommentService({ now: fixedClock() });
  assert.throws(() => s.likeComment('404', 'u1'), (e) => e.code === 404);
});
