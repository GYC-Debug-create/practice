# TeamMatch 讲稿

> 2026-10-19 写。路径简写同 `简历核对.md`：`BE` = 后端 `src\main\java\com\teammatch`，`TEST` = 后端 `src\test\java\com\teammatch`，`FE` = 小程序 `miniprogram`，`PKG` = `D:\work\求职\项目\TeamMatch\TeamMatch_打包_2026-10-12`。
> 带 **【待你补】** 的地方，是只有你本人能回答的，写完后我会按你的回答补进来。
> 措辞按 `skill.md` 第五节：说「AI 辅助开发」；说「框架层面借助 AI，设计和把关由我负责」。
> **和简历有出入的两处（复核没有 FOR UPDATE、「恢复计分」不是评价状态）已经按真实代码改成口径，见下文第三节；不要照简历原句念。**

---

## 一、2 分钟项目概述（口述稿）

> 我做的是 TeamMatch，一个校园组队和互评平台，是大三下《专业课程综合实训 IV》的小组项目，四个人，十六周。
>
> 它解决的问题是：同学想组队做项目，但不知道队友靠不靠谱；做完以后，好队友和甩锅的人也没有记录。所以主线是——找项目、组队、做项目、结项互评、信誉分变化，信誉分再反过来影响下一次组队。
>
> 三端：学生用**微信小程序**，管理员用 **Vue 3 + Element Plus** 的 Web 管理端，后端是 **Spring Boot 3 + MyBatis-Plus + MySQL**，图片放阿里云 OSS，Redis 只用来存邮箱验证码。
>
> 我是**组长**。需求分析、竞品、需求文档、数据库设计、开发文档、分工和进度、代码审查是我负责的；代码以 AI 辅助为主，框架层面借助 AI，设计和把关由我负责。
>
> 个人负责的后端是**互评、信誉分、申诉恢复**三块：学生结项后互评；评分按规则折算成信誉分，写进一张流水表；评价异常会挂起等管理员复核；被评价的人可以申诉，通过后追加一条反向流水把分数恢复。这三块的难点不在业务多复杂，而在**一致性**：同一个人不能评两次、三张表要同进同退、重复点击不能多加分。我是用唯一索引、事务、行锁和条件更新来保证的。

要点核对：「四个人」→ 后端 git 作者 4 人（`git shortlog -sne`）；「十六周」→ `PKG\02_需求\转换稿_md\04_TeamMatch项目进度说明_总控源.md:112`；技术栈 → 后端 `pom.xml:11,22,61,68`；Redis 只做验证码 → `BE/service/impl/AuthServiceImpl.java:229,243-244,260`。

---

## 二、「提交一次互评」完整调用链（边画边讲）

```
小程序 evaluation 页「提交评价」按钮 bindtap=handleSubmit   FE/pages/evaluation/evaluation.wxml:122-126
   │  防重复点击：submitting / submitted 标志                   FE/pages/evaluation/evaluation.js:248
   ▼
teamService.submitEvaluation → wx.request POST /api/m5/evaluations，头带 Bearer token   FE/utils/team-service.js:531-547
   ▼
EvaluationController.submitEvaluation                          BE/controller/EvaluationController.java:126-133
   │  评价人 id 只取 token，不信请求体：dto.setEvaluatorId(userId)
   ▼
EvaluationSubmitServiceImpl.submit  @Transactional             BE/service/impl/EvaluationSubmitServiceImpl.java:61
   ├─ 1 资格校验（自评/重复/双方是项目成员/互评窗口）           EvaluationEligibilityService.java:157-190
   ├─ 2 内容校验（评分 1-5、违规词、5 分要正向标签、1-2 分要负向标签且评语≥20 字）  EvaluationValidationService.java:29-70
   │      ── 到这里还没写库，失败直接返回 ──
   ├─ 3 INSERT evaluation（唯一索引兜底）→ 冲突 = 已评价        EvaluationSubmitServiceImpl.java:86-95
   ├─ 4 INSERT evaluation_tag                                   :104-106
   ├─ 5 信誉分计算：四维均分 → 八区间映射 → 同项目累计 ±10 封顶  CreditCalculationServiceImpl.java:21-35 / CreditRuleServiceImpl.java:41-86
   ├─ 6 异常检测：评价人评完全部队友，且整体全低分(≤2)或全满分(=5)  AnomalyDetectionService.java:40-75
   └─ 7 分支
        ├ 正常：INSERT credit_change(effective=1) + UPDATE user.credit_score = credit_score + delta   :125-135 → UserMapper.java:36-37
        └ 异常：把该评价人在本项目的全部评价置 pending_review，已生效的流水置 effective=0 并反向扣回，新流水 effective=0   :149-207
```

**讲的顺序**：先说「校验在前、写库在后」，再说「写库这几步在一个事务里」，最后说「唯一索引是最后一道闸」。

---

## 三、简历 5 条技术点（四层）

### 技术点 1　防重复互评：唯一索引兜底

| 层 | 内容 | 落点 |
|---|---|---|
| **1 做了什么** | 「一个学生对一个队友，在一个项目里只能评一次。我在 `evaluation` 表上建了联合唯一索引 `(project_id, evaluator_id, target_id)`。并发提交时，数据库只放行一个，另一个抛 `DuplicateKeyException`，我捕获后返回 `ALREADY_EVALUATED`，前端弹『您已评价过该成员』，不会是 500。」 | `SQL:252`；`EvaluationSubmitServiceImpl.java:90-95`；`ReasonCode.java:63` |
| **2 为什么 / 备选** | ① **先查再插**：代码里也有（`EvaluationEligibilityService.java:164-166`），但两个请求同时过了「没评过」的判断就都会插入，只能提前拦，不能兜底。② **应用层 `synchronized`**：多实例部署就失效。③ **Redis `SET NX` 锁**：多一个依赖，还要处理锁过期、客户端挂了、异常时不知道有没有加上锁；而这个约束本来就是数据本身的性质，放在数据库里最自然。设计文档第 8.3 节写的就是「用数据库唯一约束兜底幂等性和重复提交」（`PKG\03_详细设计\系统详细设计_V2.1_最新_2026-05-27.md:804-808`）。 | 同上 |
| **3 坏了怎么办** | 两个请求同时过了预检查 → 都 `INSERT` → 第二个事务在唯一索引上等第一个提交，然后报 `DuplicateKey` → 被捕获，返回「已评价」，且**不写流水、不改分**（单测断言 `verify(..., never())`）。这个 catch 在 `@Transactional` 内，异常被吞掉、返回的是 `Result.fail`，事务正常提交；因为 Step 3 之前只有校验、没有写操作，提交的是个空事务，没有副作用。前端侧再加一层：按钮 `submitting` 标志防连点（`evaluation.js:248`）。 | `TEST/service/EvaluationSubmitServiceTest.java:704-724`；`FE/pages/evaluation/evaluation.js:248` |
| **4 怎么证明** | 单测：mock 插入时抛 `DuplicateKeyException`，断言返回 `ALREADY_EVALUATED` 且不写标签、流水、分数。手工流程：`test-flows.md:107`「同一对再提交 → 提示 ALREADY_EVALUATED」。**如实说：真并发没压测过，DB 唯一索引的行为是 MySQL 保证的。** | `PKG\06_测试与用户手册\测试证据_evidence\quality\test-flows.md:107` |

**易错点**：前端提示是靠后端 `message` 透传（`team-service.js:60-62` 不认字符串 code → reject，页面 `evaluation.js:263` 取 `err.message`），`409` 那条分支在这条路径上不会命中。被问「前端怎么区分」时说「靠后端返回的业务错误码和文案」。

### 技术点 2　写路径一致：同一事务

| 层 | 内容 | 落点 |
|---|---|---|
| **1 做了什么** | 「提交互评要写三类数据：评价记录、信誉分流水、用户的信誉分。我把它们放在同一个 `@Transactional` 里，任何一步失败整体回滚。复核通过更是三张表一起改：评价状态、流水的生效标志、用户分数。」 | 提交：`EvaluationSubmitServiceImpl.java:61`；复核：`BE/service/impl/EvaluationReviewServiceImpl.java:36,105,112,119` |
| **2 为什么 / 备选** | 信誉分是用户看得见的账本，不能出现「有流水没加分」或「加了分没流水」。备选是**先写评价、再异步算信誉分**（消息队列 / 定时任务）：最终一致，但要处理重试、重复消费，还要有补偿。项目设计时明确 P0 不引入 MQ、定时任务、分布式锁（`PKG\03_详细设计\...V2.1_最新_2026-05-27.md:781-791`），单库同事务最简单。`user.credit_score` 定位是缓存，DDL 注释写明由有效流水推导（`SQL:30`），所以账本是流水表。 | 设计文档同上 |
| **3 坏了怎么办** | ① 落库后任何一步失败，**抛异常**触发回滚：`rollbackFor = Exception.class`，插入行数不是 1 就 `throw new BusinessException`（`EvaluationSubmitServiceImpl.java:129-132` 一带）。② **关键坑**：`@Transactional` 只对异常回滚，`Result.fail` 不会回滚。所以申诉处理里，`AppealRestoreService.restore` 返回失败时，调用方要主动把它转成异常，否则申诉状态已改、分数没恢复：`AppealServiceImpl.java:297-301`。③ 事务注解放在 Service 实现类的 public 方法上，Controller 通过代理调用，不是类内自调用，所以生效；`handleNormal` 等 private 方法在同一事务里执行，不需要再加注解。 | `AppealServiceImpl.java:229,297-301` |
| **4 怎么证明** | 单测：`credit_change` 插入失败抛 `BusinessException`、`updateCreditScore` 返回 0 抛 `BusinessException`。**如实说：这是 Mockito 层验证「抛异常」，没有在真实 MySQL 上验证回滚。** | `TEST/service/EvaluationSubmitServiceTest.java:554-590`；`AppealRestoreServiceTest.java:328-362` |

### 技术点 3　并发与幂等（口径已改，别念简历原句）

| 层 | 内容 | 落点 |
|---|---|---|
| **1 做了什么** | 「**申诉恢复**这条链路，事务里先 `SELECT … FOR UPDATE` 锁住那条评价，再判断状态：评价被判无效就拒绝；原评价的信誉流水没生效就按『跳过』成功返回；已经有恢复流水就返回『已恢复』；都不是，才追加一条反向流水并回写分数。所以重复点击不会加两次分。**复核**这条链路没用 `FOR UPDATE`，用的是条件更新，在下一条讲。」 | `AppealRestoreServiceImpl.java:70-71,83-87,102-108,110-118,121-137` |
| **2 为什么 / 备选** | 申诉恢复要先读多处状态（评价状态、原流水、是否已恢复）再决定写不写，是「读 → 判断 → 写」，所以用**悲观锁**把评价行锁住，读写之间别人进不来。备选：① 乐观锁版本号：要加 `version` 列，冲突时要重试，这里的业务是「冲突就跳过 / 已恢复」，不需要重试；② Redis 分布式锁：P0 单实例不需要，也不想让账本一致性依赖 Redis 可用。设计文档 8.7 的 D-11/D-13 就是这么定的：「事务内 SELECT FOR UPDATE 锁定 evaluation 行」。 | `PKG\03_详细设计\...V2.1_最新_2026-05-27.md:887-891` |
| **3 坏了怎么办** | 重复请求被**四层**拦：① 申诉状态不是 `pending` 就直接拒绝「申诉已处理」（`AppealServiceImpl.java:238-240`）；② 恢复事务里的 `FOR UPDATE` + 原流水 `effective` 检查 + 已有恢复流水检查（上表）；③ 流水表唯一索引 `uk_credit_change_source_user_type (source_type, source_id, user_id, change_type)` 兜底（`SQL:300`）；④ 恢复流水 `change_type='appeal_restore'`，和原评价流水 `evaluation` 的唯一键不冲突。**我自己推演、没压测的一个细节**：MySQL 默认 `REPEATABLE READ`，仓库里没有改隔离级别（`isolation` 全仓 0 命中）。第二个事务在 `FOR UPDATE` 上等第一个提交，之后第 7 步那条普通 `SELECT`（`findAppealRestoreExists`，`CreditChangeMapper.java:81-88`）读的是事务开始时的快照，看不到对方刚提交的恢复流水。后果是它会走到插入，被唯一索引拦住、抛 `DuplicateKeyException` 回滚——**不会二次加分，但返回的是异常，不是『已恢复』**。要改成真正幂等：这条检查改成锁定读，或者捕获 `DuplicateKeyException` 当作已恢复。 | `SQL:300`；`CreditChangeMapper.java:81-88` |
| **4 怎么证明** | 单测：已存在恢复流水 → `alreadyRestored=true`（`AppealRestoreServiceTest.java:181-205`）；原流水 `effective=0` → `skipped`（`:206-226`）；`kept_no_credit` / `pending_review` 状态跳过（`:386-421`）。**真并发没压测，第 3 层的快照推演也没有实测。** | `TEST/service/AppealRestoreServiceTest.java` |

### 技术点 4　状态流转与条件更新；测试

| 层 | 内容 | 落点 |
|---|---|---|
| **1 做了什么** | 「评价有四个状态：`normal` 正常计分、`pending_review` 待复核、`voided` 判为无效、`kept_no_credit` 保留但不计分。只有 `pending_review` 能被管理员复核，往另外三个状态走。复核时我用一条条件 SQL：`UPDATE evaluation SET status=? WHERE id=? AND status='pending_review'`，影响行数不是 1 就说明已经被别人处理过，抛冲突异常、整个事务回滚。」 | `Evaluation.java:16-19`；`EvaluationMapper.java:85-88`；`EvaluationReviewServiceImpl.java:57-60,105-109,128-132,139-143` |
| **2 为什么 / 备选** | 状态机单字段、一条 SQL 就能同时「判断 + 修改」，赢的拿到 1，输的拿到 0，不需要额外的锁和版本列，是三种方案里最轻的。对比：乐观锁要加 `version` 列并在每次更新带版本；悲观锁要多一次 `SELECT FOR UPDATE`，持锁时间更长。同样模式设计文档在退出投票里也用（`...V2.1_最新_2026-05-27.md:876-885`：`UPDATE exit_vote SET status='closed' WHERE id=? AND status='voting'`，仅 `rowsAffected=1` 的事务执行副作用）。复核和申诉不会同时碰同一条评价，是靠入口约束：`pending_review` 的评价不开放申诉（`AppealServiceImpl.java:111-128` 里 `STATUS_PENDING_REVIEW` 直接抛「待复核中的评价暂不可申诉」）。 | 同上 |
| **3 坏了怎么办** | 两个管理员同时点「通过」：一个更新到 1 行，另一个更新到 0 行 → `BusinessException(STATUS_CONFLICT)` → 回滚，不会重复加分；流水侧还有第二道守卫 `... AND effective = 0`（`CreditChangeMapper.java:55-57`，调用处 `EvaluationReviewServiceImpl.java:112-116`）。**这是 `UPDATE` 的当前读行为**：`UPDATE` 读的是最新已提交版本，所以不受快照影响，比「先 `SELECT` 判断再 `UPDATE`」安全。 | 同上 |
| **4 怎么证明** | 单测：重复 approve → `STATUS_CONFLICT` 且不重复加分（`TEST/service/EvaluationReviewServiceTest.java:400-415`）；更新返回 0 → 抛异常（`:473-490`）。git 作者是我：`36736ce`、`dfeecfb`、`17e1b3d`、`8cc2ca3`。**如实说：「参与测试用例编写」= 三个核心 Service 共 71 个单测（24 + 28 + 19）；接口验证 = 手工测试流程 + Controller 层 MockMvc 测试；没有真并发压测。【待你补：接口验证你亲手做了什么】** | `PKG\06_测试与用户手册\测试证据_evidence\quality\test-flows.md` |

### 技术点 5　组长

| 层 | 内容 | 落点 |
|---|---|---|
| **1 做了什么** | 需求拆分：立项建议书 → 功能设计文档（我独立写的第一版）→ 系统详细设计 V2.1 冻结。分工：6 个模块（前端 2、后端 4），194 个任务，写到任务表里。进度：用任务表 + 源码审查盘点，2026-05-27 盘点时整体完成率 54%（103/194）。Code Review：走 Gerrit，定了评审标准。 | `PKG\02_需求\转换稿_md\04_TeamMatch项目进度说明_总控源.md:124`；`PKG\01_分工\任务进度表-源码审查版-20260527.xlsx`（汇总页） |
| **2 为什么 / 备选** | 课程考核看过程不只看结果：开发过程 30%、质量保证 30%、实现结果 40%（总控源 `:50-53`），所以流程、分工、测试、评审证据必须同步产出。评审标准定的原则是「基底好就给过；安全漏洞、公共契约破坏、V2.1 冻结规则冲突一个不放过；其余记录后补」，结论只分「阶段性通过 / 暂不通过」不打分，避免变成对组员的审判。 | `PKG\05_项目源码\shixun12_backend\AGENTS.md:185-200` |
| **3 坏了怎么办** | 5 月 27 日的源码审查发现：4 位后端代码都写完了，但**从没和前端联调过**——前端 17 个请求函数的 URL、成功码、鉴权都没对齐，联调就绪度接近 0。仓库里有契约类文件：`PKG\01_分工\V5_发布候选版_任务分配CSV\强耦合对齐.csv`、设计文档 reasonCode 统一枚举（8.4 节，`...V2.1_最新_2026-05-27.md:810-840`）。**【待你补：联调是你怎么推动的、花了多久、改了什么】** | `PKG\01_分工\任务进度表-源码审查版-20260527.xlsx`（第 3 个工作表 #1、#2、#8） |
| **4 怎么证明** | 任务表、审查表、后端 120 次提交里我 66 次、Gerrit 的 `Change-Id`、`docs\m5\M5-*_REVIEW_ISSUES.md` 四份审查记录（第六节）。 | 见第六节 |

---

## 四、项目过程（选题 → 需求 → 数据库 → 分工 → 进度 → 联调测试）

| 阶段 | 做了什么 | 证据 |
|---|---|---|
| 选题 | **【待你补：为什么选组队 + 互评这个题】** | — |
| 需求 / 竞品 | 竞品分析了 CATME（学术组队评估，需学校付费）、TEAMMATES（开源互评，无组队功能）、赛氪（竞赛信息平台，组队功能简陋）；定位「移动优先、零门槛注册、组队 + 互评闭环」。注意这份立项书在打包目录里标注为「旧口径参考」，以 V2.1 为准。 | `PKG\02_需求\转换稿_md\02_TeamMatch_产品立项建议书_V6.2_旧口径参考.md:132-150` |
| 需求文档 | 立项建议书 → 功能设计文档（第一版 2026-04-09 发群，第 5 周）→ 收意见冻结 | 总控源 `:112,124` |
| 数据库设计 | 17 张表，按外键依赖定建表顺序；统一 `schema.sql` 为基线；`M5_DB.md` 写互评与信誉三表。关键设计：互评唯一索引、流水表唯一索引、`credit_score` 作缓存 | `PKG\03_详细设计\...V2.1_最新_2026-05-27.md:818-841`（8.6 节建表顺序）；`PKG\04_数据库设计\M5_DB.md` |
| 开发文档 | 系统详细设计 V2.1（含冻结规则、P0 不做清单、reasonCode 枚举、并发协议） | 同上 `:781-891` |
| 分工 | M1~M6 六个模块，194 个任务，每个任务有前置依赖、工时、验收标准 | `PKG\01_分工\V5_发布候选版_任务分配CSV\总览.csv` |
| 进度 | 16 周计划；后端提交节奏：4 月 3 次、5 月 75 次、6 月 39 次，之后到 10 月只有整理提交 | 后端 `git log` 按月统计（架构文档 1.1 节） |
| 联调测试 | 源码审查发现联调就绪度近 0 → 对齐契约 → 补测试；测试证据包含手工流程、演示脚本；QA 脚本 | `PKG\06_测试与用户手册\测试证据_evidence\quality\test-flows.md`、`demo-script.md` |

---

## 五、项目通用追问（真题对应）

| 追问 | 答法（全部基于仓库证据） |
|---|---|
| **这个是你从头搭建的吗？你具体负责哪些部分**（E） | 「小组项目，四个人。选题、需求、数据库设计、开发文档、分工和审查由我负责。代码以 AI 辅助为主。个人负责后端互评、信誉分、申诉恢复三块，这三块的提交和单测在 git 里是我的账号。前端和其他后端模块是组员写的，我做审查和联调把关。」 |
| **项目背景 / 难点 / 怎么解决**（D、E、B） | 难点不是功能多，是**信誉账本的一致性**：重复评价、三表同进同退、复核和申诉不能双倍恢复。对应第三节。另一个难点是**联调**：4 个后端写完后从没联调过，靠冻结契约和逐项对齐。 |
| **下游服务挂了，对业务有什么影响**（D） | 互评 / 信誉 / 申诉恢复这条核心链路只依赖 MySQL 和进程内服务，不调外部服务（`EvaluationSubmitServiceImpl` 里只有 Mapper 和本地 Service）。外部依赖有三个：**Redis**（只存邮箱验证码，`AuthServiceImpl.java:243-244`）挂了，邮箱验证码发不出，影响注册 / 绑定邮箱，不影响互评；**OSS**（头像、申诉证据，`OssServiceImpl.java:73-92`）挂了，上传失败、已有图片取不到，文字流程还能走；**微信 / Gitee 登录**挂了，对应登录方式不可用。**MySQL 挂了是全挂**，没做主从和降级。 |
| **并发 / 用户规模**（D） | **未找到证据**：仓库和文档里没有真实用户量、QPS、压测数据。如实说：「这是课程实训项目，部署在一台阿里云 ECS 上（设计文档技术栈 `...V2.1_最新_2026-05-27.md:5`），设计目标是 P0 单实例，并发保护靠数据库约束和事务，没有压测过。」**【待你补：有没有真实使用过、大概多少人】** |
| **监控 / 异常处理 / 指标思路**（D） | 现有的：统一返回 `Result + ReasonCode`（`BE/common/Result.java`、`ReasonCode.java`）；认证异常用 `@RestControllerAdvice` 统一处理（`BE/config/AuthExceptionHandler.java:28`）；关键分支有 `log.info/warn/error`（例 `EvaluationSubmitServiceImpl.java:92`）；有 `HealthController` 健康检查；M6 负责 Jenkins 配置和部署脚本（设计文档 `...V2.1_最新_2026-05-27.md:913`）。**未找到证据**：Prometheus / 告警 / 链路追踪。如果要做：先加接口耗时、错误码分布、`credit_change` 与 `user.credit_score` 对账差值（设计里 T-106 对账脚本被列为 P1 暂缓，没做）。 |
| **设计一个用户头像上传模块**（D） | **后端（项目里真做了）**：`POST /api/files/upload?category=avatar`（`FileUploadController.java:31-33`）；校验大小 ≤ 5MB（`OssServiceImpl.java:30`，`application.yml` multipart 5MB）、类型白名单 jpg/png（`:33-36`）；服务端生成对象 key（含分类、用户 id、UUID，`:73`）上传 OSS；库里存相对路径，读取时现签带过期时间的链接（`:89-92,108`）。**前端**：选图 → 压缩 / 裁剪 → 上传 → 预览，失败重试。**没做的**：图片内容安全审核、CDN、客户端直传（STS）。 |
| **出于节约成本做的需求**（H） | 设计文档里「P0 降级」就是：不做消息系统，用「未读角标聚合接口」实时 count 代替（`...V2.1_最新_2026-05-27.md:793-797`）；不做 MQ / 定时任务 / 分布式锁，用事务 + 唯一索引（`:781-791`）；排行榜允许离线脚本或手工维护数据，不做定时爬取（`:799-802`）。 |

---

## 六、怎么用 AI 开发、怎么把关

### 6.1 仓库里已经有的证据（不用回忆，可以直接讲）

| 做法 | 证据 |
|---|---|
| **多工具分工**：规划工具只做业务理解、任务拆解、写 prompt，不改仓库；实现工具读仓库、写代码、写测试，但**先列出拟改文件和理由，等我确认**；另一个工具**只读审查**；**我本人**做最终决策、看 `git diff`、跑测试、执行 `git add/commit/push` | `PKG\05_项目源码\shixun12_backend\AI_CONTEXT_INDEX.md:9-14` |
| **硬约束**：AI 不得执行任何 Git 写操作；每次只做一个小业务闭环；写业务代码必须同步写 JUnit；未经确认不得建业务文件、不得改 `schema.sql`；M5 不得越界实现 M3/M4/M6 | `AI_CONTEXT_INDEX.md:18-25` |
| **给 AI 的输入是文件，不是临时口述**：`AGENTS.md` 里按任务类型写死读取路径（开发某模块 → 先读 V2.1 冻结规则、再读工作令、再读 `CONTEXT/TODO`）；有 `M5_WORK_ORDER.md`、`docs\m5\M5_CONTEXT.md / M5_TODO.md / M5_TEST_PLAN.md`、`IMPLEMENT_LOG.md` | `AGENTS.md:5-38`；`docs\m5\` 目录 |
| **审查标准写成文件**：通过标准、必须阻塞的问题、三段式输出（阶段性成果 / 必须现在处理 / 记录后补） | `AGENTS.md:185-200,244-262` |
| **多 AI 交叉审查**：第一轮两个 AI 各自只拿 diff 和规范、互不知道对方；第二轮只抛具体分歧点，不传结论，避免锚定效应；最后由发起人裁量 | `AGENTS.md:325-350` |
| **Gerrit 审查 SOP**：用 Change-Id 查 change number → `ls-remote` → `fetch` → `diff` → 按标准检查 → 输出结论 | `docs\review\gerrit-review-rules.md:75-86` |

对应到面试口径：「框架层面借助 AI，设计和把关由我负责」——设计 = V2.1 冻结规则和并发协议；把关 = 审查标准、AI 不碰 Git、人看 diff 再提交。这和你在用友实习里的「总控 + 干活 + 任务书 + 抽查验收 + 产出不直接进仓库」是同一套思路，可以串起来讲。

### 6.2 Code Review 里发现的真实问题（有记录，三个都能追到修复提交）

> 来源：`PKG\05_项目源码\shixun12_backend\docs\m5\M5-*_REVIEW_ISSUES.md`，审查日期 2026-05-11，每份有提交哈希和 Change-Id。

| # | 发现的问题 | 为什么是问题 | 怎么修 | 证据 |
|---|---|---|---|---|
| **A** | **异常评价规则口径被改了**（M5-4，P0）：冻结规则是「评价人**覆盖全部队友**后，整体均分 ≤2 或 =5 才挂起」，AI 实现成了「**单条**评价四维里有两个 ≤2 就挂起」 | 只评了一个队友就被误挂起；**单测通过，是因为测试把错口径固化成了预期** | 改成评价人维度的批量检测：覆盖全部应评价队友后，才按每条均分判断，返回受影响的评价 id 批量挂起 | 审查：`M5-4_REVIEW_ISSUES.md:15-45`；修复：`cf86fa0`「对齐 M5-4 异常评价检测 V2.1」；代码：`AnomalyDetectionService.java:40-75` |
| **B** | **低分评语没校验 ≥20 字**（M5-2，P0）：实现只判断非空，`需要改进` 这种也通过 | 冻结规则要求 1/2 分必须附 ≥20 字说明；测试也把过宽口径当成通过场景 | 加长度校验 | 审查：`M5-2_REVIEW_ISSUES.md:17-42`；修复：`e0bdc52`「对齐 M5-2 互评内容校验 V2.1」；代码：`EvaluationValidationService.java:162-168`（`comment.trim().length() < 20`） |
| **C** | **信誉分计算读了两次累计值**（M5-3，P1）：`existingProjectDelta` 读一次，封顶函数内部又读一次 | 两次读之间如果有并发写入，封顶结果和展示的累计值不是同一快照 | 拆成纯函数 `calculateCappedDeltaFromExisting`，编排层只读一次；新增 10 个纯函数测试 | 审查：`M5-3_REVIEW_ISSUES.md:21-44`；修复：`bf4556c`；代码：`CreditRuleServiceImpl.java:75-86`、`CreditCalculationServiceImpl.java:28-35` |
| 备选 D | **互评窗口过期没有触发项目懒关闭**（M5-1，P0）；`reasonCode` 不符合冻结契约（M5-1，P0） | 互评窗口到期后状态不更新；前端按冻结 reasonCode 判断会对不上 | 查询资格时发现过期就 `updateStatusToEvalClosed` | 审查：`M5-1_REVIEW_ISSUES.md:19,61`；修复：`49a00a3`；代码：`EvaluationEligibilityService.java:77-79` |
| 备选 E | **复核重复加分、异常挂起误伤恢复流水、重复提交暴露未知异常**（三合一收口） | ① 异常挂起查询会把 `appeal_restore` 流水也置失效；② 并发复核可重复更新 `user.credit_score`；③ 唯一键冲突没映射成业务码 | ① 查询加 `change_type='evaluation'`；② 条件更新 `updateReviewIfPending` + `updateEffectiveToTrue`；③ 捕获 `DuplicateKeyException` | 提交 `8cc2ca3`（2026-05-15，114 个相关测试通过）；`CreditChangeMapper.java:20`；`EvaluationSubmitServiceTest.java:652-653` |
| 备选 F | 5-27 源码审查：前端 `submitEvaluation` 传嵌套 `scores`，后端要平铺的 `communicationScore` 等 | 联调必然 400 | 前端请求函数按后端字段展平 | `任务进度表-源码审查版-20260527.xlsx` 第 3 表 #6；`FE/utils/team-service.js:536-546`（现已展平） |

**挑哪两个讲**：A（口径被 AI 改了 + 测试把错固化）最能说明「为什么需要把关」；C 最能接到并发话题，面试官可能追问「那你加锁了吗」——如实回答：**审查建议里提了「配合唯一约束 / 行锁策略」（`M5-3_REVIEW_ISSUES.md:44`），最终实现里封顶的读-算-写没有加锁（`CreditRuleServiceImpl.java:53-65`），因为 P0 单实例、同一人同一项目被同时评价的窗口很小；要补的话对 `user` 行加锁或把累计放进同一条 SQL。**

### 6.3 【待你回忆】这几个问题只有你能答

1. **一次典型开发（比如申诉恢复 M5-7）**：你给 AI 的第一条输入是什么？是整个设计文档还是只给了某一节？拆成了几步？一共来回几轮？
2. **上面 A~F 里，哪几个是你发现的？** 是你读 diff 看出来的，还是另一个 AI 审查出来的，还是测试 / 联调暴露的？审查记录是谁写的？
3. **你自己手写 / 手改的是哪几处？** 例如事务边界、唯一索引、`FOR UPDATE` 这几个关键决策是你定的，还是 AI 建议你确认的？
4. **Gerrit / Jenkins 实际用起来了吗？** 提交里有 `Change-Id` 能证明走了 Gerrit；Jenkins 是跑通了还是只写了配置？
5. **「接口验证」你亲手做了什么？** Postman / 小程序真机 / 管理端点一遍？
6. **选题动机**和**团队里四个人是怎么对应 M1~M6 的**（你是哪几个模块）？
7. **有没有真实用户使用过？** 多少人？（影响「用户规模」一题怎么答）
