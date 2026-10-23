'use strict';

/**
 * 把种子数据灌进 service（本地调试和测试用）
 * @param {import('./commentService').CommentService} service
 * @param {Array<{ videoId: string, userId: string, content: string, createdAt: string, likeCount?: number }>} items
 */
function loadSeed(service, items) {
  for (const item of items) {
    service.store.insert({
      videoId: String(item.videoId),
      userId: String(item.userId),
      content: item.content,
      createdAt: item.createdAt,
      likeCount: item.likeCount || 0,
    });
  }
}

module.exports = { loadSeed };
