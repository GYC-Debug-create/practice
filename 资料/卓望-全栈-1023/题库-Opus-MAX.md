# 卓望 全栈开发工程师（北京）AI 面题库 · Opus-MAX 版

> 整理日期：2026-10-26　｜　用途：牛客 AI 面（岗位专业能力问答，约 30 分钟）2 天冲刺，兼顾后续真人技术面

## 0. 使用说明

**出题规律（来自 3 篇卓望 AI 面真题）**
- 形式：自我介绍 + 9~14 道技术问答，不问项目，会顺着回答追问一层。
- 领域顺序固定：Java 基础 → JVM → 框架 → 前端 JS → 大模型基础 → Web 安全 → Linux → MySQL → Agent。
- 题目从题库里抽，两篇只撞 1 道 → 按「领域」备，不按「原题」背。

**标记含义**

| 列 | 取值 | 含义 |
|---|---|---|
| 类型 | 原题 | 3 篇真题里出现过的题 |
| 类型 | 同点变体 | 和原题同一知识点、换个问法 |
| 类型 | 领域高频 | 该领域在 JavaGuide、小林 coding、牛客高频题里的常见题 |
| 优先级 | S | 原题 + 原题的直接变体，必背 |
| 优先级 | A | 领域内最高频，AI 面最容易抽到 |
| 优先级 | B | 其他高频，扫一遍留印象 |
| 层级 | 定义 → 原理 → 方案 → 本质原因 | 逐级加深；标的是这道题至少要讲到的那一层 |

**原题收录**
- 清单按分号拆分为 29 条不重复题目，全部收录并标「原题」；括号里的追问写进「可能的追问」列，答案要点里一并覆盖。
- Linux「实时查看日志」3 篇都考，只收 1 行。
- 3 道要讲到本质原因的题：MYSQL-01 主从延迟、JVM-03 GC 算法、SEC-02 XSS 白名单。

**答题节奏（AI 面）**
- 每题 60~90 秒：先说结论句（答案要点第一行）→ 2~3 个要点 → 一个场景或例子收尾。
- 追问一般往「为什么」「边界情况」「怎么解决」走，每题的追问列要一起备。

**2 天冲刺安排**

| 时间 | 内容 |
|---|---|
| 第 1 天上午 | 9 个领域全部 S 题，逐题口述 |
| 第 1 天下午 | 9 个领域全部 A 题 |
| 第 2 天上午 | B 题扫一遍 + S 题的追问再过一遍 |
| 第 2 天下午 | 按固定领域顺序，每个领域随机抽 1~2 题，计时模拟一场完整面试 |

**编号前缀**

| 领域 | 前缀 | 领域（真人面补充） | 前缀 |
|---|---|---|---|
| Java 基础 | JAVA | Vue | VUE |
| JVM | JVM | Redis | REDIS |
| 框架（Spring / MyBatis） | FW | 消息队列 | MQ |
| 前端 JS | JS | Java 并发 | JUC |
| 大模型基础 | LLM | Spring Boot | SB |
| Web 安全 | SEC | 设计模式 | DP |
| Linux | LNX | 计算机网络 | NET |
| MySQL | MYSQL | | |
| Agent | AGT | | |

---

## 1. Java 基础（19 题｜S 8 · A 5 · B 6）

| 领域 | 编号 | 题目 | 类型（原题 / 同点变体 / 领域高频） | 优先级（S / A / B） | 要懂到哪一层（定义 / 原理 / 方案 / 本质原因） | 可能的追问（1~2 个） | 答案要点（≤ 5 行，先一句话结论） |
|---|---|---|---|---|---|---|---|
| Java 基础 | JAVA-01 | 抽象类和接口怎么选？ | 原题 | S | 方案 | ① JDK 8 接口有了 default 方法，抽象类还有什么不可替代？<br>② 一个类能同时继承抽象类、实现多个接口吗？ | **结论：表达"是什么"、要共享状态和公共代码 → 抽象类；表达"能做什么"、要多实现、做契约 → 接口。**<br>① 抽象类：单继承；可有构造器、实例变量、任意访问修饰符的方法；适合模板方法（父类定流程，子类填步骤）。<br>② 接口：可多实现；字段默认 public static final；JDK 8 起可有 default / static 方法，JDK 9 起可有 private 方法。<br>③ 本质差别：接口没有实例状态和构造器，抽象类有，所以要共享状态只能用抽象类。<br>④ 常见组合：接口定契约 + 抽象类做骨架实现，如 List → AbstractList → ArrayList。 |
| Java 基础 | JAVA-02 | 静态代码块、实例代码块、构造方法的执行顺序？ | 原题 | S | 原理 | ① 静态代码块执行几次？什么时候触发？<br>② 静态变量赋值和静态代码块谁先执行？ | **结论：静态代码块 → 实例代码块 → 构造方法；静态块只在类初始化时执行一次，后两者每次 new 都执行。**<br>① 静态代码块属于类初始化（`<clinit>`），首次主动使用类时触发：new、调用静态方法、读写非常量静态字段、Class.forName。<br>② 实例代码块编译后被插入每个构造方法中、`super()` 之后、构造方法体之前，所以总在构造方法体前执行。<br>③ 同一级别（静态变量赋值与静态块、实例变量赋值与实例块）按源码书写顺序执行。 |
| Java 基础 | JAVA-03 | Java 的 IO 模型有哪些？BIO、NIO、AIO 的区别？ | 原题 | S | 原理 | ① 高并发短连接场景下 BIO 有什么问题？<br>② Netty 为什么基于 NIO 而不用 AIO？ | **结论：BIO 同步阻塞、一个连接一个线程；NIO 同步非阻塞、一个线程通过 Selector 管多个连接；AIO 异步非阻塞、内核完成读写后回调。**<br>① BIO（java.io）：accept、read 都阻塞，线程在等数据时什么也做不了。<br>② NIO（JDK 1.4）：Channel + Buffer + Selector，基于 IO 多路复用（Linux 下是 epoll）。<br>③ AIO（JDK 7，NIO.2）：完成后回调 CompletionHandler；Linux 下 JDK 用 epoll 模拟，性能没有优势，Netty 因此不用。<br>④ 高并发短连接下 BIO：每个连接都要创建、销毁线程，线程开销和上下文切换远大于处理请求本身；线程一多就耗尽内存或排队，线程池只能限流，改变不了"一个线程只能等一个连接"。 |
| Java 基础 | JAVA-04 | JDK 8 以后接口也能写方法实现，和抽象类还有什么本质区别？ | 同点变体 | S | 原理 | ① 两个接口有同名 default 方法，实现类怎么办？<br>② 接口为什么不能有构造方法？ | **结论：区别在"状态"——接口仍然不能有实例字段和构造器，default 方法只能组合其他方法写行为，不能持有状态。**<br>① 接口字段永远是 public static final 常量；抽象类可以有普通成员变量，并在构造器里初始化。<br>② default 方法是为了接口演进（JDK 8 给 Collection 加 stream() 而不破坏旧实现类），不是为了替代抽象类。<br>③ 同名 default 冲突：实现类必须重写该方法，可用 `A.super.method()` 指定调用哪个接口的版本。<br>④ 接口没有实例状态要初始化，所以没有构造器。 |
| Java 基础 | JAVA-05 | 父类和子类都有静态块、实例块、构造方法，new 子类时的完整顺序？ | 同点变体 | S | 原理 | ① 第二次 new 子类，顺序有什么变化？<br>② 父类构造方法里调用被子类重写的方法，会发生什么？ | **结论：父类静态块 → 子类静态块 → 父类实例块 → 父类构造方法 → 子类实例块 → 子类构造方法。**<br>① 类初始化先父后子，所以两个静态块最先执行；静态部分只执行一次，第二次 new 只剩后 4 步。<br>② 子类构造方法第一行隐式调用 `super()`，父类实例块和构造方法跑完才轮到子类。<br>③ 坑：父类构造方法里调用被重写的方法，实际执行子类版本，此时子类字段还是默认值（0 / null）。 |
| Java 基础 | JAVA-06 | 同步 / 异步、阻塞 / 非阻塞分别指什么？ | 同点变体 | S | 原理 | ① NIO 是同步还是异步？<br>② IO 多路复用属于哪一种？ | **结论：阻塞 / 非阻塞看"数据没准备好时线程是否被挂起"；同步 / 异步看"数据从内核拷到用户空间这一步是不是调用者自己做"。**<br>① 一次读操作分两段：等待数据就绪 → 内核把数据拷贝到用户空间。<br>② BIO：两段都由线程阻塞等待，同步阻塞。<br>③ NIO：Channel 设为非阻塞，线程阻塞在 select() 上统一等多个连接，就绪后自己 read，整体是同步非阻塞；IO 多路复用仍属同步 IO。<br>④ AIO：两段都交给内核，完成后通知应用，异步非阻塞。 |
| Java 基础 | JAVA-07 | NIO 的 Channel、Buffer、Selector 分别是什么？ | 同点变体 | S | 原理 | ① Buffer 的 flip() 做了什么？<br>② 什么是零拷贝？ | **结论：Channel 是双向数据通道，Buffer 是读写必经的缓冲区，Selector 是多路复用器，让一个线程监听多个 Channel 的就绪事件。**<br>① Channel：双向（BIO 的 Stream 单向），可设非阻塞，如 SocketChannel、ServerSocketChannel、FileChannel。<br>② Buffer：核心字段 capacity / position / limit；flip() 把写模式切成读模式（limit = position，position = 0）。<br>③ Selector：Channel 注册 ACCEPT / CONNECT / READ / WRITE 事件，select() 返回就绪的 SelectionKey，线程只处理就绪连接。<br>④ 零拷贝：FileChannel.transferTo 底层走 sendfile，省掉用户态和内核态之间的数据拷贝。 |
| Java 基础 | JAVA-08 | select、poll、epoll 有什么区别？ | 同点变体 | S | 原理 | ① epoll 的 LT 和 ET 模式区别？<br>② 为什么连接多、活跃少时 epoll 优势最大？ | **结论：三者都是 IO 多路复用；select / poll 每次都要把全部 fd 拷进内核并线性扫描，epoll 只返回就绪的 fd，开销只和活跃连接数相关。**<br>① select：fd 集合是位图，默认上限 1024，每次调用拷贝 + 遍历，O(n)。<br>② poll：用 pollfd 数组，没有 1024 上限，仍是每次拷贝 + 遍历，O(n)。<br>③ epoll：epoll_ctl 把 fd 注册进内核红黑树（只拷一次），数据就绪时回调把 fd 放进就绪链表，epoll_wait 只取就绪链表。<br>④ LT（水平触发，默认）：没读完下次还通知；ET（边缘触发）：状态变化才通知一次，必须循环读到 EAGAIN。 |
| Java 基础 | JAVA-09 | HashMap 的底层原理？JDK 7 和 JDK 8 有什么区别？ | 领域高频 | A | 原理 | ① 为什么链表长度到 8 才转红黑树？<br>② put 的完整流程？ | **结论：数组 + 链表，JDK 8 起链表过长转红黑树；用 key 的 hash 定位数组下标，冲突的元素挂在同一个桶里。**<br>① put：hash = h ^ (h >>> 16)（高位参与运算，减少冲突）→ 下标 (n - 1) & hash → 空桶直接放；否则遍历链表 / 树，key 相同就覆盖，不同就插入 → size 超阈值扩容。<br>② JDK 7：数组 + 链表，头插法；JDK 8：数组 + 链表 + 红黑树，尾插法。<br>③ 树化条件：链表长度达到 8 且数组长度 ≥ 64（不足 64 先扩容）；树节点 ≤ 6 时退回链表。<br>④ 选 8：hash 均匀时单个桶达到 8 个节点的概率约亿分之六（泊松分布），树化只是极端冲突时的兜底。 |
| Java 基础 | JAVA-10 | HashMap 容量为什么是 2 的幂？怎么扩容？为什么线程不安全？ | 领域高频 | A | 原理 | ① JDK 7 并发扩容为什么会死循环？<br>② 需要线程安全时用什么？ | **结论：2 的幂让 (n - 1) & hash 等价于取模且更快、分布均匀；扩容时容量翻倍；多线程 put 会丢数据，JDK 7 还会因头插法形成环形链表。**<br>① 默认容量 16、负载因子 0.75，size 超过 容量 × 0.75 就扩容为 2 倍。<br>② JDK 8 扩容不重算 hash：看 hash & oldCap 是 0 还是 1，节点要么留在原下标，要么移到"原下标 + oldCap"。<br>③ 线程不安全：两个线程同时往同一个空桶写会互相覆盖；++size 不是原子操作。<br>④ JDK 7 头插法在并发扩容时会把链表顺序反转形成环，之后 get 死循环；JDK 8 改尾插解决成环，但丢数据仍在 → 用 ConcurrentHashMap。 |
| Java 基础 | JAVA-11 | == 和 equals 的区别？为什么重写 equals 必须重写 hashCode？ | 领域高频 | A | 原理 | ① hashCode 相同，equals 一定为 true 吗？<br>② String 的 equals 怎么实现？ | **结论：== 对基本类型比值、对引用比地址；equals 默认也比地址，重写后比内容；hashCode 必须和 equals 保持一致，否则 HashMap / HashSet 会出错。**<br>① 约定：equals 为 true → hashCode 必须相等；hashCode 相等 → equals 不一定为 true（哈希冲突）。<br>② 只重写 equals：两个内容相同的对象 hashCode 不同，落到 HashMap 的不同桶，HashSet 存两份、get 取不到。<br>③ String.equals：先比地址，再比类型和长度，最后逐个字符比较。 |
| Java 基础 | JAVA-12 | String、StringBuilder、StringBuffer 的区别？String 为什么不可变？ | 领域高频 | A | 原理 | ① `new String("abc")` 创建了几个对象？<br>② 循环里用 + 拼接字符串为什么慢？ | **结论：String 不可变；StringBuilder 可变、线程不安全、最快；StringBuffer 可变、方法加 synchronized、线程安全。**<br>① 不可变的实现：类是 final，底层数组 private final 且不提供修改方法；JDK 8 是 char[]，JDK 9 起改为 byte[] + coder（Latin-1 字符串省一半内存）。<br>② 不可变的好处：能放进字符串常量池复用、hashCode 可缓存、天然线程安全、适合做 HashMap 的 key。<br>③ `new String("abc")`：常量池里还没有 "abc" 时创建 2 个（常量池 1 个 + 堆 1 个），已有则 1 个。<br>④ 循环里 + 拼接：每轮都生成新 String（JDK 8 编译成 new StringBuilder().append()，JDK 9 起用 invokedynamic），要在循环外用一个 StringBuilder。 |
| Java 基础 | JAVA-13 | 反射是什么？原理和应用场景？ | 领域高频 | A | 原理 | ① 反射为什么慢？<br>② 反射能访问 private 成员吗？ | **结论：反射是在运行时通过 Class 对象拿到类的构造器、字段、方法并调用，框架靠它做到"不写死类名也能创建对象、调用方法"。**<br>① 获取 Class：类名.class、对象.getClass()、Class.forName("全限定名")。<br>② 原理：类加载后 JVM 在方法区（JDK 8 起为元空间）保存类元数据，堆里的 Class 对象是访问入口。<br>③ 场景：Spring 创建 Bean 与依赖注入、注解解析、JDK 动态代理、MyBatis 结果映射、JSON 序列化。<br>④ 慢：要做访问检查、参数装箱成数组，JIT 难内联；setAccessible(true) 可访问 private，JDK 9+ 模块系统下跨模块访问受限。 |
| Java 基础 | JAVA-14 | 重载和重写的区别？ | 领域高频 | B | 定义 | ① 只有返回值不同算重载吗？<br>② 重写对访问权限和异常有什么限制？ | **结论：重载是同一个类里方法名相同、参数列表不同，编译期确定调用哪个；重写是子类重新实现父类方法，运行期按实际对象类型调用（多态）。**<br>① 重载：参数个数、类型、顺序至少一个不同；只有返回值不同会编译报错。<br>② 重写"两同两小一大"：方法名、参数列表相同；返回值类型、抛出的异常 ≤ 父类；访问权限 ≥ 父类。<br>③ private、static、final 方法不能被重写；子类写同名 static 方法叫隐藏，不是重写。 |
| Java 基础 | JAVA-15 | Java 的异常体系？checked 和 unchecked 异常的区别？ | 领域高频 | B | 原理 | ① try 里 return 了，finally 还执行吗？<br>② finally 里写 return 会怎样？ | **结论：Throwable 分为 Error（JVM 级严重错误，如 OutOfMemoryError，程序不处理）和 Exception；Exception 又分 checked（编译期强制处理）和 unchecked（RuntimeException 及其子类）。**<br>① checked：IOException、SQLException，必须 try-catch 或 throws；unchecked：NullPointerException、IllegalArgumentException，编译器不强制。<br>② try 里 return，finally 照样执行（System.exit 或 JVM 崩溃除外）；返回值在 finally 前已暂存，finally 里改基本类型变量不影响返回结果。<br>③ finally 里 return 会覆盖 try 的返回值并吞掉异常，《阿里巴巴 Java 开发手册》明确禁止。<br>④ 关联：Spring 事务默认只在 RuntimeException 和 Error 时回滚。 |
| Java 基础 | JAVA-16 | Integer 缓存池和自动装箱、拆箱？ | 领域高频 | B | 原理 | ① `Integer a = 127, b = 127`，a == b 吗？换成 128 呢？<br>② 自动拆箱什么时候抛 NPE？ | **结论：自动装箱调用 Integer.valueOf()，-128 ~ 127 返回缓存对象，超出范围每次 new 新对象；所以 127 用 == 为 true，128 为 false。**<br>① 装箱调用 valueOf()，拆箱调用 intValue()，都由编译器自动插入。<br>② 缓存上限可用 -XX:AutoBoxCacheMax 调大；Byte、Short、Long、Character 也有缓存，Float、Double 没有。<br>③ 包装类之间比较一律用 equals。<br>④ NPE：值为 null 的 Integer 参与运算或赋给 int；三目运算符混用包装类和基本类型时也会触发拆箱。 |
| Java 基础 | JAVA-17 | Java 是值传递还是引用传递？ | 领域高频 | B | 原理 | ① 方法里修改传入对象的属性，外面能看到吗？<br>② 方法里让参数指向新对象呢？ | **结论：Java 只有值传递；传对象时传的是引用的副本（地址值的拷贝）。**<br>① 方法内通过副本修改对象属性，外部可见，因为两个引用指向同一个对象。<br>② 方法内让参数指向新对象，只改了副本，外部引用不变——这正是"不是引用传递"的证据。<br>③ 经典例子：swap(Integer a, Integer b) 换不了外部两个变量的值。 |
| Java 基础 | JAVA-18 | 泛型是什么？什么是类型擦除？ | 领域高频 | B | 原理 | ① `List<String>` 和 `List<Integer>` 的 getClass() 相等吗？<br>② 为什么不能 `new T()`？ | **结论：泛型只在编译期做类型检查，编译后类型参数被擦除成上界（默认 Object），运行时 JVM 不知道具体类型参数。**<br>① 好处：编译期类型安全，省去手动强转。<br>② 擦除的后果：`List<String>` 和 `List<Integer>` 运行时是同一个 Class；不能 `new T()`、不能创建泛型数组、不能 `instanceof List<String>`。<br>③ 编译器在取值处自动插入强转，并生成桥接方法保证多态。<br>④ 通配符 PECS：`<? extends T>` 适合读（生产者），`<? super T>` 适合写（消费者）。 |
| Java 基础 | JAVA-19 | ArrayList 和 LinkedList 的区别？ | 领域高频 | B | 原理 | ① ArrayList 怎么扩容？<br>② LinkedList 中间插入一定比 ArrayList 快吗？ | **结论：ArrayList 是动态数组，随机访问 O(1)；LinkedList 是双向链表，随机访问 O(n)；绝大多数场景用 ArrayList。**<br>① ArrayList 扩容：JDK 8 起无参构造先给空数组，首次 add 扩到 10，之后每次扩为原来的 1.5 倍（Arrays.copyOf 拷贝）。<br>② LinkedList 插入删除节点本身 O(1)，但先要遍历到位置 O(n)；ArrayList 中间插入要搬移元素，但 System.arraycopy 快且对 CPU 缓存友好，多数情况反而更快。<br>③ 两者都线程不安全；读多写少的并发场景用 CopyOnWriteArrayList。 |

<!-- APPEND-HERE -->
