/*
 * 第 3 题：挖金矿（练习版）
 *
 * 来源：调研报告-1023.md 第 48 行，2025 U3D 客户端笔经（牛客）
 *   原题只留下题名，作者注明是 DP，完整约束没有公开。
 *   下面用的是「挖金矿」最常见的版本（本质是 0-1 背包），不是原题。
 *
 * 题目：
 *   有 n 座金矿和 W 个工人。第 i 座金矿需要 pi 个工人才能挖，挖完得到 gi 克金子。
 *   每座金矿要么全挖、要么不挖，不能只挖一部分；一个工人只能挖一座矿。
 *   问最多能得到多少金子。
 *
 * 输入：
 *   第一行两个整数 n W
 *   接下来 n 行，每行两个整数 pi gi
 * 输出：一个整数，最多能得到的金子数
 *
 * 样例 1
 *   输入：
 *     5 10
 *     5 400
 *     5 500
 *     3 200
 *     4 300
 *     3 350
 *   输出：
 *     900
 *   说明：挖第 1、2 座，5 + 5 = 10 个工人，400 + 500 = 900
 *
 * 样例 2
 *   输入：
 *     1 3
 *     4 100
 *   输出：
 *     0
 *
 * 数据范围：1 <= n <= 100，1 <= W <= 10^4，1 <= pi <= 10^4，1 <= gi <= 10^9
 *
 * 考点：0-1 背包；先写二维 dp[i][w]，再压成一维（压成一维时 w 要倒序遍历，想清楚为什么）
 * 追问（网格版）：n×m 网格每格有金子，从左上走到右下、只能向右或向下，最多能拿多少？
 *
 * 自检：
 *   - gi 到 10^9，加起来会超 int，dp 用 long
 *   - 牛客 ACM 模式提交时类名要改成 Main
 */
import java.util.*;

public class Q3GoldMine
{
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        // n金矿 W工人
        int n = sc.nextInt();
        int W = sc.nextInt();
        // 每个金矿需要p个人，得到g克金子
        int[][] gold = new int[n][2];
        for(int i = 0;i < n;i ++){
            gold[i][0] = sc.nextInt();// 人数
            gold[i][1] = sc.nextInt();// 金子数
        }

        Q3GoldMine solver = new Q3GoldMine();
        System.out.println(solver.get_max(n, W, gold));
    }

    // 返回最多使用 W 个工人时，前 n 座金矿能得到的最大金子数
    public long get_max(int n, int W, int[][] gold){
        long[][] dp = new long[n + 1][W + 1];

        // dp[i][w]：只考虑前 i 座矿、最多使用 w 个工人时的最大金子数
        for(int i = 1; i <= n; i++){
            int workers = gold[i - 1][0];
            int value = gold[i - 1][1];

            for(int w = 0; w <= W; w++){
                // 不挖第 i 座矿
                dp[i][w] = dp[i - 1][w];

                // 工人足够时，比较挖与不挖
                if(w >= workers){
                    dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - workers] + value);
                }
            }
        }

        return dp[n][W];
    }
}
