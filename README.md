# practice

手写 Java / JS 算法练习。仓库里只有两类东西：

- **我自己写的代码**：`.java`、`.js`
- **说明文档**：`.md`

测试输入、编译产物不进仓库，由 `.gitignore` 白名单保证。题目和练习 prompt 不放在仓库里，单独存放。

## 目录

```
practice/
├─ README.md          本文件：目录、约定、做题记录
├─ PROGRESS.md        当前进度、下次起点、重做清单
├─ AGENTS.md          给 AI 看的协作规则（红线、陪练流程、代码约定、Git）
├─ CLAUDE.md          引用 AGENTS.md，让 Claude Code 也读到同一套规则
├─ 模板/
│  ├─ Main.java       Java ACM 起手模板
│  └─ main.js         JS（Node）ACM 起手模板
├─ java/              Java 代码，一题一个文件夹
└─ js/                JS 代码，一题一个文件夹
```

## 代码放哪

| 模式 | 位置 | 说明 |
|---|---|---|
| ACM（Java） | `java/<题号>/Main.java` | 类名必须是 `Main`，所以一题一个文件夹，例如 `java/W3/Main.java` |
| LeetCode（Java） | `java/<题号>/Solution.java` | 只写核心函数时用 |
| ACM（JS） | `js/<题号>/main.js` | 例如 `js/W3/main.js` |

题号去掉横杠：`W-3` → `W3`，`H-7` → `H7`；LeetCode 题用 `LC198` 这种写法。重做直接覆盖，旧版本留在 Git 历史里。

## 怎么练

1. 从 `模板/` 复制起手文件到对应题号的文件夹
2. 用记事本写，不开自动补全；命令行编译运行：

```
cd java/W3
javac -encoding UTF-8 Main.java
java Main < in.txt
```

```
cd js/W3
node main.js < in.txt
```

**Windows 上必须加 `-encoding UTF-8`**：`javac` 默认按 GBK 读源文件，代码里有中文注释就会报"编码 GBK 的不可映射字符"。在线判题平台一般不用加。

`in.txt`、`Main.class` 只留在本地，不会被提交。

## 本地环境提醒

- Java 8：不要用 `var`、`List.of()`、`stream().toList()`、`String.isBlank()`
- 在线平台的 Java 版本可能更高，但按 Java 8 写最保险

## 做题记录

当前阶段和下次练习起点见 [PROGRESS.md](PROGRESS.md)。这里只记录完成情况，不存放题面。

| 题号 | 题目 | 语言 | 解法 | 复杂度（时间 / 额外空间） | 结果（独立 / 提示后 / 看答案） | 日期 | 易错点 | 验证 |
|---|---|---|---|---|---|---|---|---|
| IO1 | n 个整数求和 | Java | Scanner 逐个读取，long 累加，不保存数组 | O(n) / O(1) | 提示后 | 2026-10-22 | 创建数组漏 new；总和用 int 会溢出；只累加时无需数组 | 本地 9/9 通过，非在线判题结果 |
