/*
 * 卡车装箱
 * 给定目标重量 w 和 n 个集装箱的重量 c，每个最多选一次。
 * 选出总重量恰好为 w、且个数最少的一组，
 * 返回长度为 n 的 0/1 数组：选了第 i 个则 res[i] = 1，否则为 0。
 * 示例：w = 10, c = [1,2,3,9] -> [1,0,0,1]
 * 练习约定：无解返回 [-1]（原题未确认）
 * 注：题意由代码反推，未核实
 */
import java.util.*;

public class Solution {

    public int[] trunkLoad(int w, int[] c) {

        // n为集装箱的数量
        int n = c.length;
        // 返回结果res
        int[] res = new int[n];
        // dp[i][j]表示前i个集装箱，能够取总重量为j的，最小集装箱数，如果无法取得，就记为-1
        int[][] dp = new int[n + 1][w + 1];

        // 初始化dp的0个集装箱和重量为0的情况
        for(int i = 0;i < n;i ++){
            dp[i][0] = 0;// 满足重量0需要0个集装箱
        }
        for(int i = 1;i <= w;i ++){
            dp[0][i] = -1;// -1表示不能满足装重量为i的
        }

        // 更新dp
        for(int i = 1;i <= n;i ++){
            for(int j = 1;j <= w;j ++){
                // 如果当前可以放入
                if(c[i - 1] <= j && dp[i - 1][j - c[i - 1]] != -1){// 条件是当前集装箱重量小于等于需要的重量 并且装了这个重量以后，剩余重量前i-1个可以凑出来
                    if(dp[i - 1][j] != -1){// 考虑是否要进行二者更小值的判断 条件是前i-1个箱子能不能满足重量j
                        dp[i][j] = Math.min(dp[i - 1][j],dp[i - 1][j - c[i - 1]] + 1);
                    }else{// 如果前i-1个箱子不能满足重量j，直接取去除当前箱子以后，前i-1个能够凑出剩余重量时候所需的箱子数量+1
                        dp[i][j] = dp[i - 1][j - c[i - 1]] + 1;
                    }
                }else{// 如果新的最小解法一定是不包含选择当前集装箱属性的，继承前i-1个凑重量j的结果
                    dp[i][j] = dp[i - 1][j];
                }
            }
        }

        // 根据dp更新res
        int weight = w;
        if(dp[n][w] == -1){
            return new int[]{-1};
        }
        for(int i = n;i > 0;i --){
            // 判断是否取第i个集装箱在当前最小方案
            if(c[i - 1] <= weight && i != 0 && dp[i - 1][weight - c[i - 1]] == dp[i][weight] - 1){
                res[i - 1] = 1;
                weight -= c[i - 1];
            }else{
                res[i - 1] = 0;
            }
        }

        return res;

    }

    public static void main(String[] args){

        Scanner sc = new Scanner(System.in);

        System.out.println("请输入目标重量w：");

        int w = sc.nextInt();

        System.out.println("请输入集装箱数量n：");

        int n = sc.nextInt();

        System.out.println("请依次输入" + n + "个集装箱的重量：");

        int[] c = new int[n];

        for(int i = 0;i < n;i ++){
            c[i] = sc.nextInt();
        }

        int[] res = new int[n];

        Solution s = new Solution();

        res = s.trunkLoad(w,c);

        System.out.println(Arrays.toString(res));

        return;

    }

}
