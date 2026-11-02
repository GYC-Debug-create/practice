/*
 * 相邻位交换
 * 给定正整数 n，最多交换一次十进制表示中相邻的两位，
 * 返回能得到的、大于 n 的最大整数；不存在返回 -1。
 * 示例：1234 -> 2134，4321 -> -1
 * 注：题意由代码反推，「最多一次」「取最大」未核实
 */

import java.util.*;

public class Solution {
    public int getResult(int n) {
        int res = 0;

        // 首先将输入的数从低到高存储到list
        List<Integer> list = new ArrayList<>();
        while(n > 0){
            list.add(n % 10);
            n /= 10;
        }

        // 然后逐个从末尾往前比较
        for(int i = list.size() - 1;i > 0;i --){
            // 如果低位比高位更高
            if(list.get(i) < list.get(i - 1)){
                // 更换两个的位置然后输出
                int temp = list.get(i);
                list.set(i,list.get(i - 1));
                list.set(i - 1,temp);
                // 计算现在的list对应的输出
                for(int j = list.size() - 1;j >= 0;j --){
                    res *= 10;
                    res += list.get(j);
                }
                return res;
            }
        }

        return -1;
    }
    
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        System.out.println("输入数字：");

        int n = sc.nextInt();

        Solution s = new Solution();

        int res = s.getResult(n);

        System.out.println(res);

        return;

    }

}
