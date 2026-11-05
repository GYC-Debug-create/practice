# ② Linux 排查

> 出处：N4、N6、N11、N12、N13（真人面 5 篇），N1（AI 面），N7（运维面）。编号见 `../面经原帖.md`。

## 追问链（真题）

1. Linux 怎么看 CPU 和内存（N4、N11、N13）
2. 大日志怎么快速看最新一段（N6）
3. 怎么实时看新增的日志（N6、N1）
4. 已知 requestId，怎么筛出相关日志（N6）
5. 看最后 500 行、按关键字过滤、tail 有哪些参数（N12）
6. top 里看磁盘 IO 看哪个字段（N13）
7. 怎么排查网络问题（N11）
8. 内存使用接近 100%，能说明内存不够吗（N7，运维岗）

## 大纲

| 场景 | 命令 | 要点 |
|---|---|---|
| 整机 CPU / 内存 | `top`、`free -h` | `top` 里按 `1` 看每个核，按 `P` / `M` 排序；`free` 看 `available`，不看 `free` |
| 内存接近 100% | `free -h` | `buff/cache` 可以回收，`available` 才是还能用的内存 |
| 某个 Java 进程 CPU 高 | `top -Hp <pid>` → `printf '%x'` → `jstack <pid> \| grep <十六进制线程号>` | 先找到最耗 CPU 的线程，再到线程栈里定位代码 |
| 看最新一段日志 | `tail -n 500 app.log` | 不要用 `cat` 打开大文件 |
| 实时看新增日志 | `tail -f app.log` | 日志会轮转时用 `tail -F` |
| 按关键字筛 | `grep requestId app.log`、`tail -f app.log \| grep requestId` | `grep -C 5` 连上下文一起显示 |
| 磁盘 IO | `top` 里 `wa` 字段；`iostat -x` | `wa` 是 CPU 等待 IO 的时间占比；`iostat` 看 `%util`、`await` |
| 磁盘空间 | `df -h`、`du -sh *` | |
| 网络 | `ss -tnlp`（或 `netstat -anp`）、`ping`、`telnet` / `curl` | 先看端口在不在监听，再测连通 |

## 一句话骨架

CPU 和内存用 `top` / `free`，日志用 `tail` 加 `grep`，IO 看 `wa` 和 `iostat`，网络用 `ss` 加连通性测试。

## 易错点

- 把 `free` 列当成剩余可用内存
- 只知道 `tail -f`，不知道日志轮转时要用 `-F`

## 自测

- 口述「Java 进程 CPU 飙高」的完整排查四步
- 一条命令写出：实时看日志，只显示含某个 requestId 的行
