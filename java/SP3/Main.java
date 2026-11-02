/*
 * 替换元素使数组严格递增
 * 每步选下标 i <= j（分别在 arr1、arr2 范围内），执行 arr1[i] = arr2[j]。
 * 求让 arr1 严格递增的最少操作次数，做不到输出 -1；本来就严格递增输出 0。
 * 范围：两个数组长度 1~100，元素 0~10^6
 * 练习用输入格式（原题是核心代码模式，这里改成 ACM 练 Main 型）：
 *   第一行：两个数组的长度 n m
 *   第二行：arr1 的 n 个数
 *   第三行：arr2 的 m 个数
 * 输出：最少操作次数
 * 示例（输入 -> 输出，「/」表示换行）：
 *   5 4 / 1 5 3 6 7 / 1 3 2 4 -> 1（5 换成 arr2[2] = 2）
 *   5 4 / 1 5 3 6 7 / 1 6 3 3 -> -1
 *   3 1 / 1 2 3 / 5           -> 0（本来就严格递增）
 *   3 1 / 1 2 0 / 5           -> -1（0 在下标 2，arr2 没有下标 >= 2 的数可用）
 *   3 4 / 5 4 3 / 1 2 6 6     -> 2（5、4 换成 arr2[0] = 1、arr2[1] = 2）
 */
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int m = sc.nextInt();
        int[] arr1 = new int[n];
        int[] arr2 = new int[m];
        for(int i = 0;i < n;i ++){
            arr1[i] = sc.nextInt();
        }
        for(int i = 0;i < m;i ++){
            arr2[i] = sc.nextInt();
        }

        // dp动态规划 dp[i][j]表示arr1第i+1个换成arr2第j个以后 对应的最少操作次数
        // dp[i][m]表示第i个不替换
        int[][] dp = new int[n][m + 1];

        // 初始化dp 
        for(int i = 0;i < m;i ++){// 第1个自成一个组，本身是符合要求的，因此替换为 1 次，保留为 0 次
            dp[0][i] = 1;
        }
        dp[0][m] = 0;

        // 更新dp dp[i][j]的值
        for(int i = 1;i < n;i ++){
            for(int j = i;j < m;j ++)
            // 更新dp[i][j]
            {
                // 当前的结尾值
                int cur = arr2[j];
                // 应该填入dp[i][j]的值
                int res = -1;
                // 在i-1个里面寻找，结尾值小于cur的里面，最小的操作数
                for(int t = i - 1;t < m;t ++){
                    if(arr2[t] < cur){
                        if(res == -1){
                            res = dp[i - 1][t] + 1;
                        }else{
                            res = Math.min(res,dp[i - 1][t] + 1);
                        }
                    }
                    if(res != -1){
                        dp[i][j] = res;
                    }else{
                        
                    }
                }
            }
        }

        // 更新dp[i][m]的值，也就是不替换末尾值的

        
        return;

    }
}
