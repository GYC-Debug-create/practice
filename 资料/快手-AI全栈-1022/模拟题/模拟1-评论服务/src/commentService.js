'use strict';

const { Store } = require('./store');
const { ValidationError, NotFoundError } = require('./errors');

const DEFAULT_PAGE_SIZE = 20;

class CommentService {
  /**
   * @param {object} [options]
   * @param {Store} [options.store]
   * @param {() => number} [options.now] 返回毫秒时间戳，测试时可注入
   */
  constructor({ store = new Store(), now = () => Date.now() } = {}) {
    this.store = store;
    this.now = now;
  }

  addComment({ videoId, userId, content }) {
    if (!videoId || !userId) {
      throw new ValidationError('videoId 和 userId 必填');
    }
    if (typeof content !== 'string' || content.length === 0) {
      throw new ValidationError('content 不能为空');
    }
    return this.store.insert({
      videoId: String(videoId),
      userId: String(userId),
      content,
      createdAt: this.now(),
      likeCount: 0,
    });
  }

  /**
   * 某个视频下的评论，按发布时间倒序分页
   * @param {string} videoId
   * @param {{ page?: number, pageSize?: number }} [options] page 从 1 开始
   */
  listComments(videoId, { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
    const comments = this.store
      .all()
      .filter((c) => c.videoId === String(videoId))
      .sort((a, b) => b.createdAt - a.createdAt);
    const start = page * pageSize;
    return {
      total: comments.length,
      page,
      pageSize,
      items: comments.slice(start, start + pageSize),
    };
  }

  likeComment(commentId, userId) {
    const comment = this.store.get(commentId);
    if (!comment) {
      throw new NotFoundError('评论不存在');
    }
    comment.likeCount += 1;
    return comment.likeCount;
  }
}

module.exports = { CommentService };
