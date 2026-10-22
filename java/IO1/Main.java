import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        int n = sc.nextInt();

        long count = 0;

        for(int i = 0;i < n;i ++){
            int temp = sc.nextInt();
            count += temp;
        }

        System.out.print(count);

        return;

        
    }
}
