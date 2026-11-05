# ⑥ JVM

> 出处：N2（OOM 调优、jstack）、N6（JDK 8 默认 GC）、N11（泄漏和溢出、G1 对比 CMS）、N12（泄漏例子、检测工具）、N13（泄漏和溢出、ThreadLocal）。编号见 `../面经原帖.md`。

## 追问链（真题）

1. 内存泄漏和内存溢出的区别和联系（N11、N12、N13）
2. 内存泄漏的典型例子；Java 里哪些操作会导致泄漏和溢出（N12、N13）
3. ThreadLocal 为什么会泄漏，怎么避免（N13）
4. 还有哪些场景会导致内存溢出（N13）
5. 怎么排查；用什么检测工具；怎么开启泄漏检测（N11、N12）
6. OOM 怎么调优；jstack 怎么用、输出怎么看（N2）
7. JDK 8 默认用哪个 GC（N6）
8. G1 的原理，相比 CMS 有什么优势（N11）

## 大纲

1. **运行时内存区域**：堆、虚拟机栈、本地方法栈、方法区（JDK 8 起叫元空间）、程序计数器；前两个和程序计数器是线程私有的，堆和方法区是线程共享的
2. **泄漏和溢出**：
   - 泄漏：对象已经不用了，但还被引用着，GC 回收不掉
   - 溢出：申请内存时空间不够，抛出 OOM
   - 联系：泄漏积累下去最终会溢出；但溢出不一定是泄漏造成的，也可能就是数据量大，或者内存配置太小
3. **泄漏的典型例子**：静态集合只加不删；线程池里用了 ThreadLocal 却不 `remove`；连接或流没关闭；监听器没注销；缓存没设过期
4. **ThreadLocal 泄漏**：每个 Thread 持有一个 ThreadLocalMap，key 是 ThreadLocal 的弱引用，value 是强引用 → key 被回收后 value 还在；线程池里的线程一直不结束，value 就一直回收不掉 → 用完在 `finally` 里 `remove`
5. **OOM 的几种**：`Java heap space`（堆）、`Metaspace`（动态生成的类太多）、`StackOverflowError`（递归太深）、`unable to create new native thread`（线程太多）、`Direct buffer memory`（直接内存）
6. **排查**：
   - 加 `-XX:+HeapDumpOnOutOfMemoryError`，OOM 时自动导出堆；也可以用 `jmap -dump` 手动导出
   - 用 MAT 看大对象和引用链，找出谁一直引用着它
   - 用 `jstat -gcutil` 看 GC 的频率和各区占用
   - 用 `jstack` 看线程状态、死锁、阻塞
   - CPU 高：`top -Hp` 找线程 → 线程号转十六进制 → 到 `jstack` 输出里查
   - 「怎么开启泄漏检测」：原帖没有说明上下文，**不确定**面试官问的是哪个工具。可以答上面的自动导出堆加监控堆曲线；如果用 Netty，它有 `ResourceLeakDetector`
7. **对象分配和 GC**：新对象分在 Eden → Minor GC 后存活的进 Survivor → 年龄到阈值晋升老年代；大对象直接进老年代；用可达性分析（从 GC Roots 出发）判断对象是否存活
8. **回收算法**：标记-清除（会产生碎片）、复制（新生代用）、标记-整理（老年代用）
9. **JDK 8 默认 GC**：Parallel Scavenge + Parallel Old，吞吐量优先；JDK 9 开始默认改成 G1
10. **CMS 和 G1**：
    - CMS：老年代并发标记-清除，停顿短；缺点是会产生碎片和浮动垃圾，JDK 14 已移除
    - G1：把堆分成很多 Region，优先回收垃圾最多的 Region（Garbage First 的由来）；可以用 `-XX:MaxGCPauseMillis` 设停顿目标；整体是标记-整理，Region 之间是复制，不产生碎片

## 一句话骨架

泄漏是「该回收的回收不掉」，溢出是「要的时候不够」，泄漏积累会溢出；排查就是导出堆用 MAT 找引用链，配合 jstat、jstack；JDK 8 默认 Parallel，G1 靠分 Region 实现停顿可控。

## 易错点

- 说 JDK 8 默认 GC 是 G1（错，是 Parallel）
- 把泄漏和溢出说成一回事

## 自测

- 用 ThreadLocal 讲清一个完整的泄漏过程
- 口述线上 OOM 的排查步骤
