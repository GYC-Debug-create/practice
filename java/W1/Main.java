import java.lang.reflect.Array;
import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int m = sc.nextInt();
        int k = sc.nextInt();
        int[] A = new int[n];
        int[] B = new int[m];
        for(int i = 0;i < n;i ++){
            A[i] = sc.nextInt();
        }
        for(int i = 0;i < m;i ++){
            B[i] = sc.nextInt();
        }

        // 最大配对数量
        int count = 0;

        // i/j 分别代表A B当前索引
        int i = 0;
        int j = 0;

        // 对于A B数组进行排序
        Arrays.sort(A);
        Arrays.sort(B);

        while(i < n && j < m){
            if((A[i] - B[j]) <= k && (B[j] - A[i]) <= k){
                count ++;
                i ++;
                j ++;
            }else if((A[i] - B[j]) > k){
                j ++;
            }else if((B[j] - A[i]) > k){
                i ++;
            }
        }

        System.out.print(count);

        return;

    }
}
