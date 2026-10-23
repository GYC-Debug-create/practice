# 模拟 1：短视频评论服务（改造已有代码）

> 形式参照 Meta AI-enabled coding：给一个已有的小项目，分关卡往下做。
> **限时 60 分钟**，可以用任何 AI 编码工具。关卡按顺序做，后一关建立在前一关上。
> 做不完很正常，按过了几关算进度。

## 背景

这是一个短视频评论服务的简化版：内存存储，没有 HTTP 层，直接调用 `CommentService` 的方法。
代码是同事留下的，能跑，但有 bug，功能也不全。

```
src/
  index.js            对外导出
  commentService.js   业务逻辑
  store.js            内存存储
  seed.js             灌种子数据
  errors.js           错误类型
data/seed.json        种子数据
test/run.js           测试运行器（零依赖）
test/*.test.js        测试
```

运行测试：`node test/run.js`（Node 16 及以上，无需 npm install）

## 硬性约定（评估会跑一套隐藏测试，按这里的约定调用）

- 从 `src/index.js` 导出 `CommentService` 和所有错误类型
- `new CommentService({ store?, now?, sensitiveWords? })`：`now()` 返回毫秒时间戳，测试会注入
- `loadSeed(service, items)`（`src/seed.js`）签名不要改
- 所有评论的 `createdAt` 都是**毫秒时间戳数字**
- 出错时抛异常，异常对象带 `code`：参数错误 `400`，不存在 `404`，无权限 `403`
- 分页的 `page` 从 1 开始，返回结构统一为 `{ total, page, pageSize, items }`

---

## 关 1：修 bug（建议 10 分钟）

现有测试有几条是红的。找出原因并修好，**不许改测试**。

## 关 2：点赞和回复（建议 20 分钟）

**2.1 点赞**

- `likeComment(commentId, userId)`：同一用户重复点赞只算一次，返回当前点赞数
- `unlikeComment(commentId, userId)`：取消点赞，没点过就什么都不变，返回当前点赞数
- `listComments(videoId, { viewerId })`：传了 `viewerId` 时，每条评论带 `liked: true/false`；不传时都是 `false`

**2.2 回复（楼中楼，只展示两层）**

- `addComment({ videoId, userId, content, parentId })`：带 `parentId` 就是回复
  - 回复根评论：`rootId = 根评论 id`
  - 回复「回复」：`rootId` 仍然归到最上面的根评论，`parentId` 保持为被回复的那条
  - 每条评论都有 `parentId`、`rootId`、`replyToUserId` 三个字段；根评论这三个都是 `null`；回复的 `replyToUserId` 是被回复那条的作者
  - `parentId` 不存在 → 404；被回复的评论和 `videoId` 不在同一个视频 → 400
- `listComments` 只返回根评论，`total` 只算根评论；每条根评论带：
  - `replyCount`：回复总数
  - `replies`：最早的 2 条回复，按时间正序
- 新增 `listReplies(rootId, { page, pageSize })`：某条根评论下的全部回复，按时间正序分页

## 关 3：边界和删除（建议 15 分钟）

- 内容去掉首尾空白后再保存；去掉后长度必须在 1~500 之间（按字符数算，一个 emoji 算 1 个），否则 400；`content` 不是字符串也是 400
- 敏感词：构造函数传入 `sensitiveWords: string[]`，内容里出现的敏感词替换成**等长**的 `*`，不区分大小写
- 新增 `deleteComment(commentId, userId)`，成功返回 `true`
  - 只能删自己的，否则 403；评论不存在或已删除 → 404
  - 删除**没有回复**的根评论：从列表消失，`total` 减一
  - 删除**有回复**的根评论：列表里保留占位，`deleted: true`，`content` 显示为 `该评论已删除`，`userId` 为 `null`，回复照常显示
  - 删除回复：从 `replies` 和 `replyCount` 里去掉
  - 已删除的评论不能点赞、不能回复（404）
- 分页参数：`page` 必须是 ≥1 的整数，`pageSize` 必须是 1~50 的整数，否则 400（`listComments` 和 `listReplies` 都要校验）

## 关 4：热评和性能（建议 15 分钟）

**4.1 热评排序**

`listComments(videoId, { sort: 'hot' })`，默认 `sort` 是 `'time'`（时间倒序）。

```
热度 = (点赞数 + 2 × 回复数) / (发布至今的小时数 + 2) ^ 1.5
```

- 小时数 = `(now() - createdAt) / 3600000`，不取整
- 热度降序；热度相同时按发布时间倒序
- 同样支持分页

**4.2 性能**

单个视频 10 万条根评论、其他视频再 10 万条的情况下，按时间排序翻任意一页，平均耗时要在 **1ms 以内**。

**4.3 口述题（不写代码，把思路写进过程记录）**

线上评论量到了亿级，存在 MySQL + Redis：时间排序和热评排序分别怎么存、怎么查？点赞怎么防重复、怎么扛住热点视频的并发？

---

## 交付

- 代码（建议每过一关 commit 一次）
- 你自己补的测试
- `过程记录.md`：每关开始、结束的时间点，中间做过的关键决定，发现 AI 写错的地方
