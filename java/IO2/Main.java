import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for(int i = 0;i < n;i ++){
            nums[i] = sc.nextInt();
        }
        int max = get_max(nums);
        sc.nextLine();
        String s = sc.nextLine();
        int count = get_count(s);
        System.out.println(max);
        System.out.println(count);
    }
    public static Integer get_max(int[] nums){
        int res = nums[0];
        for(int num : nums){
            if(num >= res){
                res = num;
            }
        }
        return res;
    }
    public static Integer get_count(String s){
        int count = 0;
        // 0表示刚刚不是空格,1表示是
        int is_block = 1;
        for(int i = 0;i < s.length();i ++){
            char str = s.charAt(i);
            // 如果不是空格且前一个为0
            if(str != ' ' && is_block == 1){
                count ++;
                is_block = 0;
            }else if(str == ' ' && is_block == 0){
                is_block = 1;
            }
        }
        return count;
    }
}
