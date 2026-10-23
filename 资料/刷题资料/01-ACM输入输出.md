# ACM 输入输出（Java）

## 一、选哪个

| | Scanner | BufferedReader |
|---|---|---|
| 速度 | 慢，大约 1e5 个数以上可能超时（经验值） | 快 |
| 坑 | `nextInt()` 后接 `nextLine()` 会读到空串 | `readLine()` 读到末尾返回 `null`，要判空 |

**结论：统一用下面的 BufferedReader 模板。**

## 二、模板

```java
import java.io.*;
import java.util.*;

public class Main {                      // 类名必须是 Main，不写 package
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    // 读下一个 token，自动跨行；读到输入末尾返回 null
    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) {
            String line = br.readLine();
            if (line == null) return null;
            st = new StringTokenizer(line);
        }
        return st.nextToken();
    }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        // 在这里写题
        out.flush();                     // 忘了这行就没有输出
    }
}
```

## 三、四种读法

```java
// 1. 先读 n，再读 n 个数（不管分几行）
int n = nextInt();
int[] a = new int[n];
for (int i = 0; i < n; i++) a[i] = nextInt();

// 2. 一行数字，不知道有几个
String[] p = br.readLine().trim().split("\\s+");

// 3. 读到输入结束（多组数据）
String line;
while ((line = br.readLine()) != null) {
    line = line.trim();
    if (line.isEmpty()) continue;        // 跳过空行
    // 处理这一行
}

// 4. 读一整行字符串（中间有空格）
String s = br.readLine();
```

## 四、常见的坑

| 坑 | 怎么避免 |
|---|---|
| 读完数字再读整行 | 用本模板没问题：`next()` 把当前行整行读进 `st`，之后 `br.readLine()` 读的是下一行。前提是当前行的 token 已经读完 |
| 行首有空格，`split` 多出空串 | 先 `trim()` 再 `split("\\s+")` |
| 输入是 `[1,2,3]` 或 `1,2,3` | 去掉方括号，按逗号 `split`，每段 `trim()`；注意空数组 `[]` |
| 求和、相乘溢出 | 用 `long` |
| 输出很多行 | 用 `out.println`，最后 `flush` |
| `Arrays.asList(int[])` | 得到的是 `List<int[]>`，不是 `List<Integer>` |
| `List<Integer>` 转 `int[]` | `list.stream().mapToInt(Integer::intValue).toArray()` |
| 截取数组 | `Arrays.copyOfRange(a, from, to)`，左闭右开；能传下标范围就不要复制 |
| `Integer` 比较 | 用 `equals`，`==` 超过 127 会出错 |

`[1,2,3]` 格式的读法：

```java
String s = br.readLine().trim();
s = s.substring(1, s.length() - 1);      // 去掉方括号
int[] nums = s.trim().isEmpty() ? new int[0]
        : Arrays.stream(s.split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();
```

---

## IO-1 每行求和

输入有若干行，每行有不定个数的整数，用空格分隔，空格数量不固定。对每个**非空行**输出这一行的和；空行跳过、不输出。整数绝对值 ≤ 2×10⁹。

```
输入 1：
1 2 3
4 5
输出：
6
9
```

```
输入 2（边界：行首行尾空格、中间空行、需要 long）：
   10   20  

2000000000 2000000000
输出：
30
4000000000
```

```
输入 3（边界：只有一个数，没有结尾换行）：
7
输出：
7
```

## IO-2 数字和整行混读

第一行一个整数 n；接下来给出 n 个整数，**可能分成几行**；最后一行是一个英文句子，单词之间可能有多个空格，首尾也可能有空格。输出两行：n 个数的最大值，以及句子的单词数。

```
输入 1：
3
1 5 2
hello world
输出：
5
2
```

```
输入 2（边界：负数、多空格、首尾空格）：
1
-7
   I   love    java  
输出：
-7
3
```

```
输入 3（数字跨行）：
4
1 2
3 4
a
输出：
4
1
```
