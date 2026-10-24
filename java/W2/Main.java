import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();
        int t = sc.nextInt();
        // 换行
        sc.nextLine();
        int[] nums = new int[n];
        for(int i = 0;i < n;i ++){
            nums[i] = sc.nextInt();
        }
        // 求长度恰好为k的连续子数组数量,每一个数都严格大于t
        // 满足的字数组数量
        int res = 0;
        // 维护当前遍历的子数组长度
        int cur_len = 0;
        // 遍历一遍
        for(int i = 0;i < n;i ++){
            if(nums[i] > t){
                cur_len ++;
            }else{
                if(cur_len >= k){// 如果不满足条件,该区间就应该加入到结果中
                    res = res + cur_len - k + 1;
                }
                cur_len = 0;
            }
        }

        if(cur_len >= k){
        res = res + cur_len - k + 1;
        }
        System.out.print(res);

        return;

    }
}
