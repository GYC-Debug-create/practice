# TeamMatch 项目延伸八股

> 2026-10-19 写。每题：**答案要点（≤5 行）** + **落到 TeamMatch 的代码**。
> 路径简写同 `简历核对.md`：`BE` = 后端 `src\main\java\com\teammatch`，`TEST` = 后端 `src\test\java\com\teammatch`，`SQL` = 后端 `src\main\resources\sql\schema.sql`（与 `sql\schema.sql` 行号一致），`PKG` = `D:\work\求职\项目\TeamMatch\TeamMatch_打包_2026-10-12`，`DESIGN` = `D:\work\求职\项目\TeamMatch\TeamMatch_打包_2026-10-12\03_详细设计\系统详细设计_V2.1_最新_2026-05-27.md`。
> **项目里没有的技术（MQ、Redis 锁、乐观锁、定时任务）明说「项目里没有」**，按原理答，再给一句「要上我会怎么做」。
> 真题来源标注沿用 `板块\02-项目.md`；`真题\03`、`真题\04` 的题目未核实原文。

## 题目覆盖表

| # | 真题 / 任务书要求 | 来源 | 本文位置 | 状态 |
|---|---|---|---|---|
| 1 | MySQL 索引怎么优化？InnoDB 索引数据结构；唯一索引、联合索引、最左前缀、索引失效 | B 二 | 第 1 题 | 已准备 |
| 2 | Spring 事务为什么不生效（@Transactional 失效场景），原理，传播行为 | 牛客二面凉经 09-21（未核实） | 第 2 题 | 已准备 |
| 3 | SELECT FOR UPDATE、隔离级别、MVCC、间隙锁、死锁 | 补充范围（`板块\06`）；A1 一面问过可重复读（未核实） | 第 3 题 | 已准备 |
| 4 | 条件更新 vs 乐观锁 vs 悲观锁，为什么这么选 | 任务书 | 第 4 题 | 已准备 |
| 5 | MQ 消费怎么保证幂等；两个消息同时查同一个 task 怎么防并发；分布式下怎么处理；一锁二判三更新 | C | 第 5 题 | 已准备 |
| 6 | Redis NX 锁：服务挂了 TTL 很长怎么办；抛异常不知道是否上锁怎么办；为什么 TeamMatch 不用 Redis 锁 | A 二 | 第 6 题 | 已准备 |
| 7 | 深分页怎么优化？游标能跳页吗 | C | 第 7 题 | 已准备 |
| 8 | 项目里没有的技术怎么答 | 任务书 | 第 8 题 | 已准备 |

---

## 第 1 题　索引：数据结构、唯一索引、联合索引、最左前缀、失效、优化

**答案要点**
1. InnoDB 索引是 **B+ 树**：非叶子节点只存键和指针，单个节点能放很多键，三到四层就能放几千万行；叶子节点之间有双向链表，范围查询顺着链表扫。不用二叉树 / 红黑树（太高，IO 次数多）、不用 B 树（非叶子存数据，扇出小，范围扫描不顺）、不用哈希（不支持范围和排序）。
2. **聚簇索引**：主键索引的叶子存整行数据；**二级索引**叶子存主键值，查到后要再去主键树拿整行（回表）；查询列都在二级索引里则**覆盖索引**，不回表。
3. **唯一索引** = 带唯一约束的二级索引。插入时先检查是否冲突，冲突报错 1062，Spring 转成 `DuplicateKeyException`。可以用来做幂等兜底。
4. **联合索引的最左前缀**：索引 `(a, b, c)` 按 a、再 b、再 c 排序，所以能用在 `a`、`a,b`、`a,b,c` 的条件上，单独用 `b` 或 `c` 用不上。`WHERE` 里条件的书写顺序无所谓（优化器会重排），关键是**有没有最左那一列**。范围条件（`>`、`<`、`BETWEEN`）之后的列无法再用索引做过滤。
5. **失效场景**：对索引列用函数或运算；隐式类型转换（字符串列用数字比较）；`LIKE '%x'` 左模糊；`OR` 的一边没有索引；跳过最左列；优化器判断全表扫更便宜。**怎么优化**：先 `EXPLAIN` 看 `type / key / rows / Extra`；建合适的联合索引并让高选择性的列在前；尽量覆盖索引；避免 `SELECT *`；删冗余索引。

**落到 TeamMatch**
| 点 | 代码 / 表 |
|---|---|
| 唯一索引 | `evaluation` 的 `uk_project_evaluator_target (project_id, evaluator_id, target_id)`：`SQL:252`。冲突在 `BE/service/impl/EvaluationSubmitServiceImpl.java:90-95` 被捕获 |
| 联合唯一索引当查询索引 | 预检查 SQL `SELECT * FROM evaluation WHERE evaluator_id=? AND target_id=? AND project_id=? LIMIT 1`（`BE/mapper/EvaluationMapper.java:32`）三个列都是等值，命中这个联合唯一索引，一行定位；`WHERE` 里列的顺序和索引顺序不一致也没关系 |
| 最左前缀 + 冗余索引 | `idx_evaluation_project_evaluator (project_id, evaluator_id)`（`SQL:254`）是 `uk_project_evaluator_target` 的最左前缀，**功能上是冗余的**。如实说：建表时没有删，数据量小没有影响；要优化就删掉它 |
| 低区分度索引 | `idx_evaluation_status (status)`（`SQL:255`）：状态只有 4 个取值，单独几乎不会被优化器选中 |
| 流水表索引 | `credit_change`：`uk_credit_change_source_user_type`（`SQL:300`）、`idx_credit_change_user_effective (user_id, effective, created_at)`（`SQL:301`）、`idx_credit_change_user_project (user_id, project_id, change_type)`（`SQL:302`）。封顶计算按 `user_id + project_id + change_type='evaluation' + effective=1` 查，命中 `idx_credit_change_user_project`（`BE/m4/service/impl/CreditRuleServiceImpl.java:53-60`） |
| 一个可以改进的点 | 流水列表 `WHERE user_id=? ORDER BY created_at DESC`（`BE/controller/CreditController.java:108-115`）：索引是 `(user_id, effective, created_at)`，中间夹着 `effective`，查询没有对它加等值条件，`created_at` 排序用不上索引顺序，要 filesort。单用户数据量小所以没有问题；要优化就加 `(user_id, created_at)` |

---

## 第 2 题　@Transactional 原理和失效场景

**答案要点**
1. **原理**：Spring AOP 给 Bean 生成代理（接口用 JDK 动态代理，类用 CGLIB），调用经过 `TransactionInterceptor`：取连接 → `setAutoCommit(false)` → 执行目标方法 → 正常就提交、抛异常按规则回滚。连接绑定在当前线程上（`ThreadLocal`），所以同一个线程里的多次 Mapper 调用共用一个连接、一个事务。
2. **回滚规则**：默认只对 `RuntimeException` 和 `Error` 回滚，**受检异常不回滚**，要写 `rollbackFor = Exception.class`。
3. **失效场景**：① **自调用**（同一个类里 `this.xxx()`，不经过代理）；② **方法不是 public**（Spring 5 及以前，基于接口或 CGLIB 的代理都只处理 public；Spring 6 起基于类的代理支持 protected / 包可见方法，private 仍然不行）；③ **异常被 `catch` 吞掉**，或抛的是受检异常没配 `rollbackFor`；④ 对象不是 Spring 管理的（自己 `new`）；⑤ `final` / `static` 方法（CGLIB 无法覆盖）；⑥ 多线程：新线程拿不到原事务的连接；⑦ 引擎不支持事务（MyISAM）；⑧ 传播行为设置不当。
4. **传播行为**：`REQUIRED`（默认，有事务就加入，没有就新建）；`REQUIRES_NEW`（挂起外层，新开事务，内层提交与否不受外层回滚影响）；`NESTED`（外层事务里的保存点，内层回滚不影响外层）；`SUPPORTS` / `NOT_SUPPORTED` / `NEVER` / `MANDATORY` 不常用。
5. **事务里不要做的事**：远程调用、长耗时操作（连接占用、锁持有时间变长）。

**落到 TeamMatch**
| 点 | 代码 |
|---|---|
| 注解放在哪 | Service 实现类的 public 方法上，不放 Controller：`EvaluationSubmitServiceImpl.java:61`、`EvaluationReviewServiceImpl.java:36`、`AppealRestoreServiceImpl.java:45`、`AppealServiceImpl.java:58,229`；全仓 32 处 `@Transactional`，Controller 里 0 处 |
| 回滚规则 | 核心链路都写 `rollbackFor = Exception.class`。项目里没有用 `Propagation`（全仓 `Propagation` / `REQUIRES_NEW` / `NESTED` 0 命中），全部是默认 `REQUIRED` |
| 自调用会不会失效 | `submit` 内部的 `handleNormal`、`insertTags` 等是 **private 方法**，没有注解，也不需要：它们就跑在 `submit` 开启的事务里。**会踩坑的写法**是类里一个没注解的 public 方法去调另一个有注解的方法，注解不生效。本项目核心链路没有这种写法 |
| 跨 Bean 加入同一事务 | `AppealServiceImpl.handleAppeal`（`:229`）→ `appealRestoreService.restore`（`:297`）是**两个不同的 Bean**，经过代理，`REQUIRED` 加入外层事务，所以申诉状态更新、流水、分数同进同退 |
| 「异常被吞」的真实例子 | ① `submit` 里 `catch (DuplicateKeyException)` 后 `return Result.fail`（`EvaluationSubmitServiceImpl.java:90-95`）：事务不回滚、正常提交，但此前没有写操作，所以是安全的。② `Result.fail` **不会触发回滚**，所以 `AppealServiceImpl.java:297-301` 把 `restore` 返回的失败重新转成 `BusinessException` 抛出，让申诉状态一起回滚 |
| 事务和异步的关系 | `TechProfileServiceImpl.java:199` 注释：「此方法无 @Transactional，保证 @Async 在事务外执行」，项目里考虑过事务与异步线程的边界 |

---

## 第 3 题　SELECT FOR UPDATE、隔离级别、MVCC、间隙锁、死锁

**答案要点**
1. **`SELECT … FOR UPDATE`** 是**当前读**（读最新已提交版本），并对读到的行加 **X 锁**，持有到事务结束。RR 下：主键或唯一索引**等值命中存在的行** → 只加记录锁；范围条件或等值但不存在 → 加间隙锁 / 临键锁。
2. **四个隔离级别**：读未提交、读已提交（RC）、可重复读（RR，InnoDB 默认）、串行化。对应脏读、不可重复读、幻读三类问题。
3. **MVCC**：每行有隐藏的事务 id 和回滚指针，旧版本放在 undo log 形成版本链；**快照读**（普通 `SELECT`）用 ReadView 判断哪个版本可见。RC 每次 `SELECT` 生成新 ReadView；RR 在事务里**第一次**快照读时生成，之后复用，所以可重复。**当前读**（`FOR UPDATE`、`UPDATE`、`INSERT`）读最新版本，不看 ReadView。
4. **间隙锁 / 临键锁**：RR 下锁一个索引区间，防止别的事务往里插入，用来防幻读。
5. **死锁**：两个事务各持一把锁、互相等对方的。InnoDB 检测到后回滚代价小的那个，报 1213。**应对**：固定加锁顺序、缩短事务、减少锁范围、死锁时重试。

**落到 TeamMatch**
| 点 | 代码 / 推演 |
|---|---|
| 用了 `FOR UPDATE` 的地方 | 申诉恢复：`AppealRestoreServiceImpl.java:70-71` → `EvaluationMapper.java:97` `SELECT * FROM evaluation WHERE id = #{id} FOR UPDATE`。条件是**主键等值且行存在**，只锁这一行，不锁间隙，不影响别的评价。另一处是退出投票 `ExitVoteServiceImpl.java:255` |
| 隔离级别 | 仓库里没有配置隔离级别（`isolation` 全仓 0 命中），用的是 MySQL 默认 RR |
| **快照读 vs 当前读在项目里的影响（我阅读代码推演的，没有实测）** | ① 复核用 `UPDATE … WHERE id=? AND status='pending_review'`（`EvaluationMapper.java:85-88`），`UPDATE` 是当前读，读到最新已提交的状态，所以并发的后到者拿到 0 行，安全。② 申诉恢复第 7 步的幂等检查是普通 `SELECT`（`CreditChangeMapper.java:81-88`），是快照读：第二个事务在 `FOR UPDATE` 上等第一个提交后，这条 `SELECT` 看的仍然是事务开始时的快照，看不到对方刚提交的恢复流水，会继续走到插入；是 `uk_credit_change_source_user_type`（`SQL:300`）拦住它，抛 `DuplicateKeyException`、回滚。**结果：不会二次加分，但会返回异常而不是「已恢复」。** 修法：把这条检查改成锁定读，或者捕获 `DuplicateKeyException` 当作已恢复 |
| 死锁怎么避免 | 三条链路写表顺序一致，都是 **evaluation → credit_change → user**：提交 `EvaluationSubmitServiceImpl.java:86-95→129→134`；复核 `EvaluationReviewServiceImpl.java:105→112→119`；申诉恢复 `AppealRestoreServiceImpl.java:71→131→137`（申诉恢复前面多一步更新 `appeal` 行，`AppealServiceImpl.java:254`）。**没有找到死锁重试逻辑的证据** |
| 唯一键并发插入的已知问题 | 多个事务同时插入同一个唯一键：第一个持有锁，后面的等待；若第一个回滚，多个等待者会同时尝试拿锁，有死锁风险（MySQL 已知行为）。项目里重复提交走的是「第一个成功、其余报冲突」，没有遇到过，也没有专门处理 |

---

## 第 4 题　条件更新 vs 乐观锁（版本号）vs 悲观锁

| | 做法 | 优点 | 缺点 | 适用 |
|---|---|---|---|---|
| **条件更新** | `UPDATE … SET … WHERE id=? AND status=旧值`，看影响行数 | 一条 SQL 同时判断和修改；不用加列；不用显式持锁 | 只能判断这一行当前的字段值；失败要自己决定怎么处理 | 状态机流转、扣库存（`stock>=n`）、一次性操作 |
| **乐观锁** | 表加 `version` 列，`UPDATE … SET …, version=version+1 WHERE id=? AND version=?` | 不持锁，读多写少时吞吐高 | 加列；冲突要重试；冲突多时反复失败 | 一个对象被多个字段、多个流程修改，且冲突少 |
| **悲观锁** | `SELECT … FOR UPDATE` 先锁后判断后更新 | 逻辑直观，「读 → 判断 → 写」之间别人进不来 | 持锁时间长，会阻塞；有死锁风险 | 要先读多处状态再决定写不写；冲突多 |

**TeamMatch 怎么选的**
- 复核：**条件更新**。状态单字段、结果只有「抢到 / 没抢到」：`EvaluationMapper.java:85-88`，调用处 `EvaluationReviewServiceImpl.java:105,128,139`，`!= 1` 就抛 `STATUS_CONFLICT`（`:107-109`）。流水侧 `CreditChangeMapper.java:55-57` `AND effective = 0`。
- 申诉恢复：**悲观锁**。要先读评价状态、原流水是否生效、是否已有恢复流水，再决定写不写：`AppealRestoreServiceImpl.java:70-137`。设计文档就是这么定的（`DESIGN:887-891`）。
- 分数更新：**SQL 原子自增** `credit_score = credit_score + #{delta}`（`BE/mapper/UserMapper.java:36-37`），本身不会丢更新。
- 乐观锁：**项目里没有**（`@Version`、`version` 列 0 命中）。要加：给 `user` 加 `version`，但封顶是「读累计 → 算 → 写」，冲突时要重试整个计算，不如直接对 `user` 行加锁。
- **如实说的缺口**：信誉分封顶的读-算-写没有保护（`CreditRuleServiceImpl.java:53-65` 普通读，`EvaluationSubmitServiceImpl.java:134` 写），同一人同一项目被两人同时评价时封顶可能少算一次。`申诉处理`（`AppealServiceImpl.java:238-254`）和`撤销处罚`（`PenaltyServiceImpl.java:129-137`）也是先读状态再 `updateById`，没有 `WHERE status=` 条件。

---

## 第 5 题　幂等：MQ 重复消费、一锁二判三更新、并发与分布式

**答案要点**
1. **为什么会重复**：MQ 通常是「至少一次」投递，消费者处理完没来得及 ack、或者 ack 丢了，就会重投。所以**消费端必须自己幂等**。
2. **方案**：① **唯一索引 / 去重表**：用消息 id 或业务唯一键，重复插入直接冲突；② **状态机条件更新**：`UPDATE … WHERE status=旧值`，只有一个能成功；③ **先查再写**：必须配合锁，否则有竞态；④ **Redis `SET NX` 去重 key**（带过期，过期后失效）；⑤ HTTP 接口用幂等 token。
3. **一锁二判三更新**：先**锁**住这条记录（行锁 / 分布式锁）→ 再**判断**状态（是不是已经处理过、是不是合法状态）→ 才**更新**。顺序不能反：不先锁就判断，两个线程会同时通过判断。
4. **两个消息同时查同一个 task 怎么防并发**：单库下用 `SELECT … FOR UPDATE` 或条件更新 `UPDATE task SET status='done' WHERE id=? AND status='pending'`。**多实例部署也是有效的**，因为锁在数据库里、不在进程里。只有跨库 / 跨服务才需要分布式锁，或者用本地消息表 + 唯一键。
5. **幂等 ≠ 加锁**：锁只负责并发时别重复执行；幂等要保证「再来一次结果一样」，所以锁之外还要有判断和唯一约束兜底。

**落到 TeamMatch（项目里没有 MQ，用的是同样的思路）**
| 一锁二判三更新 | `AppealRestoreServiceImpl.java` |
|---|---|
| **锁** | `:70-71` `selectByIdForUpdate(appeal.getTargetId())` |
| **判** | `:83-87` 评价已判无效 → 拒绝；`:102-108` 原流水 `effective=0` → 跳过并成功返回；`:110-118` 已有 `appeal_restore` 流水 → 返回「已恢复」 |
| **更新** | `:121-134` 插入反向流水；`:137` 回写 `user.credit_score` |
| 兜底 | 唯一索引 `uk_credit_change_source_user_type`（`SQL:300`）；申诉状态检查 `AppealServiceImpl.java:238-240` |

- 重复互评：唯一索引 `uk_project_evaluator_target`（`SQL:252`）+ 冲突映射（`EvaluationSubmitServiceImpl.java:90-95`）。
- **项目里没有 MQ**（`pom.xml` 无 RabbitMQ / Kafka 依赖；设计文档 `DESIGN:781-791` 明确 P0 不做消息队列）。
- **如果要上 MQ**（例如评价提交后异步通知 / 刷新排行榜）：消费端以业务唯一键 `(source_type, source_id, user_id, change_type)` 做去重，直接复用已有的 `uk_credit_change_source_user_type`；消费逻辑里按「判断状态再条件更新」写；失败重试 + 死信队列；消息体带业务 id，不带结果。

---

## 第 6 题　Redis 分布式锁（SET NX + TTL）的三个问题；为什么 TeamMatch 用数据库锁

**答案要点**
1. **基本写法**：`SET key value NX PX ttl`（一条命令原子完成「不存在才设置 + 过期时间」）；value 放**唯一标识**（请求 id）；释放时要先比较 value 再删除（用 Lua 脚本保证原子），避免误删别人的锁。
2. **问题一：服务挂了，TTL 设得很长怎么办**：锁要等到 TTL 到期才释放，期间所有人被卡住。→ TTL 不能随便设大，按业务耗时估计、略放宽；业务耗时不确定就用**看门狗续期**（Redisson：默认 30 秒，持锁期间每 10 秒续期）——进程挂了续期也就停了，锁最多再活一个看门狗周期，而不是一个很长的固定 TTL。反过来 TTL 太短，业务没跑完锁就过期、被别人拿到，所以**正确性不能只靠锁**，数据库层要有唯一约束 / 条件更新兜底。
3. **问题二：抛异常（超时 / 网络错误），不知道有没有加上锁**：客户端不知道命令是否已在服务端执行。→ 用唯一 value，异常后**按自己的 value 做比较删除**（不会误删别人的）；或先 `GET` 看 value 是不是自己；业务上仍要幂等，因为这一次也可能没拿到锁就继续执行了。
4. **问题三：主从切换锁丢失**：主节点写入锁后宕机，从节点还没同步就被提升为主，别人又能拿到锁（Redlock 对此有争议）。强一致场景不依赖它。
5. **为什么 TeamMatch 用数据库锁，不用 Redis 锁**：① 要保护的数据本来就在 MySQL，**行锁和事务绑定**，事务提交、回滚、连接断开锁自动释放，没有 TTL 问题；② Redis 锁和 MySQL 事务是**两个系统**，不能原子：先放锁后提交的窗口里别人能进来；③ P0 单实例、尽量少依赖（`DESIGN:781-791`）；④ 项目里 Redis 只用来存邮箱验证码（`AuthServiceImpl.java:243-244`），账本一致性不应该依赖它的可用性。

**落到 TeamMatch**
- **项目里没有 Redis 锁**：`Redisson` / `RLock` / `setIfAbsent` / `SETNX` / `分布式锁` 全仓 0 命中。
- Redis 用法：`AuthServiceImpl.java:229` 发送频率限制 `hasKey`、`:243-244` 验证码 10 分钟过期、60 秒发送间隔、`:250-251` 失败时删除。
- **如果要上**（多实例部署后）：用 Redisson `RLock` + 看门狗做**性能侧的互斥**，减少数据库行锁争用；**正确性仍由数据库兜底**——唯一索引、条件更新保留不动。

---

## 第 7 题　深分页

**答案要点**
1. **问题**：`LIMIT offset, size` 要先扫描并丢弃前 `offset` 行，offset 越大越慢，在二级索引上还要回表。
2. **优化**：① **游标 / 键集分页（seek）**：`WHERE id < 上一页最后的 id ORDER BY id DESC LIMIT n`，走索引范围查找，耗时与页数无关；排序列不唯一时用 `(created_at, id)` 复合游标；② **延迟关联**：先在覆盖索引上取出 id，再用 id 回表；③ 限制最大页数，不让用户跳到末页；④ 搜索类场景用 `search_after`。
3. **游标能跳页吗**：**不能直接跳**，只能上一页 / 下一页。要跳页的折中：缓存每页的边界游标；或者「游标 + 小范围 offset」；或者业务上改成无限滚动。

**落到 TeamMatch**
- 信誉流水列表 `GET /api/m5/credit/changes`：**项目里是内存分页，不是 SQL 分页，而且是有意选的**。`BE/controller/CreditController.java:117` `creditChangeMapper.selectList(wrapper)` 把该用户的流水**全部取出**，`:122-127` 用 `subList` 截取一页；`pageSize` 上限 100（`:39`）。
- **为什么这么选**：开发前的只读确认发现项目没有配置 MyBatis-Plus 分页插件（全仓 `PaginationInnerInterceptor` / `MybatisPlusInterceptor` 0 命中），所以不用 `selectPage`，改 `selectList + Java 内存分页`；计划里写明「若未来数据量扩大，再单独引入分页插件或 Mapper 级物理分页」（`PKG\05_项目源码\shixun12_backend\docs\m5\M5-8B_PLAN.md:8,114,121,346`）。
- 能这么做的前提：单个用户的流水条数很少。数据量大了就不行。
- **发现的关联问题（我没有运行验证）**：用户列表 `UserController.java:57`、项目列表 `ProjectController.java:54` 用的是 `selectPage` / `page(new Page<>(...))`。没有分页插件时，MyBatis-Plus 3.5.5 不会给 SQL 加 `LIMIT`，这两个接口是否真的分页，需要在运行环境确认。被问到只说「我读代码发现了，没跑过」。
- **改法**：注册 `MybatisPlusInterceptor` + `PaginationInnerInterceptor`，信誉流水改用 `selectPage`，或改成 `(created_at, id)` 游标；索引补 `(user_id, created_at)`（见第 1 题）。
- 互评列表同理：`GET /api/m5/evaluations/received`（`EvaluationController.java:155`）未找到分页实现的证据。

---

## 第 8 题　项目里没有用到的技术怎么答

| 技术 | 项目里 | 原理要点（一句） | 如果要上我会怎么做 |
|---|---|---|---|
| **消息队列** | **没有**（`DESIGN:781-791` 明确 P0 不做） | 解耦、削峰、异步；至少一次投递，消费端要幂等 | 评价提交后的通知 / 榜单刷新走 MQ；消费以 `(source_type, source_id, user_id, change_type)` 去重；失败重试 + 死信队列 |
| **Redis 分布式锁** | **没有** | `SET NX PX` + 唯一 value + Lua 释放；看门狗续期 | 多实例后作为性能侧互斥；DB 唯一索引 / 条件更新保留作正确性兜底 |
| **乐观锁（version）** | **没有** | `WHERE version=?`，冲突重试 | 给被多流程修改的行（如 `user`）加 `version`；信誉分封顶改成「读 + 条件写 + 重试」 |
| **定时任务** | **没有**（`@Scheduled` 0 命中；用「懒检查」代替：查询时发现互评窗口过期就改状态，`EvaluationEligibilityService.java:77-79`） | 到点触发，要考虑多实例重复执行 | 加 `@Scheduled` 做窗口到期关闭和 `credit_score` 对账；多实例时用分布式调度锁 |
| **限流** | **未找到证据** | 令牌桶 / 漏桶 / 滑动窗口 | 网关层限流；业务层用 Redis 令牌桶 |
| **幂等 token（HTTP）** | **没有**（互评提交靠唯一索引） | 先发 token，提交时消费一次 | 对不带业务唯一键的接口用 |

---

## 还讲不清 / 没把握

| 题 | 说明 |
|---|---|
| 第 3 题「快照读看不到恢复流水」的推演 | 是读代码 + 按 InnoDB 规则推出来的，**没有在 MySQL 上实测**。面试时说「我推演过，没压测」，不要说「测过」 |
| 第 2 题「Spring 6 对非 public 方法的支持」 | 版本边界要说清：Spring 5 及以前只处理 public；Spring 6 的类代理支持 protected / 包可见。被追问就说「Boot 3.2.5 对应 Spring 6.1，但我们的事务方法都是 public，没依赖这个差异」 |
| 第 7 题互评列表是否分页 | `received` 接口未找到分页证据，没有逐行读 |
