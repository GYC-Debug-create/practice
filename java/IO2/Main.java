import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String s = sc.nextLine();
        s = s.replace(" ", "");
        System.out.println(n);
        System.out.print(s);
        return;
    }
}
