import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        // 数字栈
        Deque<Integer> numStack = new ArrayDeque<>();
        // 字符串栈
        Deque<StringBuilder> strStack = new ArrayDeque<>();
        // 当前正在构建的字符串
        StringBuilder current = new StringBuilder();
        // 如果有多位数字使用number
        int number = 0;

        for(int i = 0;i < s.length();i ++){
            char cur = s.charAt(i);

            // 如果是数字
            if(cur >= '0' && cur <= '9'){
                number = number * 10 + (cur - '0');
            }else if(cur == '('){// 如果是左括号
                numStack.push(number);
                strStack.push(current);
                number = 0;
                current = new StringBuilder();
            }else if(cur == ')'){// 如果是右括号
                int repeat = numStack.pop();
                StringBuilder previous = strStack.pop();
                String part = current.toString();
                for(int j = 0;j < repeat;j ++){
                    previous.append(part);
                }
                current = previous;
            }else{// 字符情况
                current.append(cur);
            }

        }

        System.out.println(current);
    }
}
