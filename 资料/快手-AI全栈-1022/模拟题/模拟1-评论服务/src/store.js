'use strict';

/**
 * 内存存储。线上是 MySQL，这里简化成 Map。
 */
class Store {
  constructor() {
    this.comments = new Map();
    this.nextId = 1;
  }

  insert(data) {
    const id = String(this.nextId++);
    const comment = { id, ...data };
    this.comments.set(id, comment);
    return comment;
  }

  get(id) {
    return this.comments.get(String(id)) || null;
  }

  all() {
    return Array.from(this.comments.values());
  }
}

module.exports = { Store };
