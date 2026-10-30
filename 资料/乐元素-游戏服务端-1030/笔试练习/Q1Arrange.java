/*
 * 第 1 题：莱萌鸡和紫咪小鹰排列（练习版）
 *
 * 来源：调研报告-1023.md 第 46 行，2025 U3D 客户端笔经（牛客）
 *   原题只留下题名和「编程/排列」，完整约束没有公开。
 *   下面的题干是按题名改编的练习版，不是原题，练的是「回溯 + 剪枝」。
 *
 * 题目：
 *   有 a 只莱萌鸡（记作 A）和 b 只紫咪小鹰（记作 B），同种动物之间没有区别。
 *   把它们排成一排，要求任意两只紫咪小鹰不能相邻。
 *   输出所有合法排列，按字典序（A < B）从小到大。
 *
 * 输入：一行两个整数 a b
 * 输出：第一行输出合法排列的个数 cnt；接下来 cnt 行，每行一个排列
 *
 * 样例 1
 *   输入：
 *     2 2
 *   输出：
 *     3
 *     ABAB
 *     BAAB
 *     BABA
 *
 * 样例 2
 *   输入：
 *     1 3
 *   输出：
 *     0
 *
 * 数据范围：0 <= a, b <= 8
 *
 * 考点：回溯；「上一个放的是 B 就不能再放 B」的剪枝；先放 A 再放 B 自然就是字典序
 * 追问：只要个数、a 和 b 到 10^5 时怎么算？（提示：B 插进 a+1 个空位）
 *
 * 自检：
 *   - a 或 b 为 0 的边界
 *   - 牛客 ACM 模式提交时类名要改成 Main
 */
import java.util.*;

public class Q1Arrange 
{

    public static void main(String[] args){
        Q1Arrange solver = new Q1Arrange();
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // 输出的总数
        int cnt = 0;
        // 存储合法的排列

        // 前一个是否为B，初始化为false
        boolean B = false;

        solver.dfs(a,b,B);

        cnt = solver.res.size();

        System.out.println(cnt);

        for(int i = 0;i < cnt;i ++){
            System.out.println(solver.res.get(i));
        }

        return;
        
    }

    // dfs函数
    public void dfs (int a,int b,boolean B){

        // 不可能的状态1
        if(B == true && a < b){
            return;
        }

        // 不可能的状态2
        if(B == false && a < b - 1){
            return;
        }

        // 如果A B都放完了 得到一个完整的答案
        if(a == 0 && b == 0){
            res.add(path.toString());
            return;
        }

        // 优先放A
        if(a > 0){
            path.append('A');
            dfs(a-1,b,false);
            // 撤销放A的操作
            path.deleteCharAt(path.length() - 1);
        }

        // 撤销后放B
        if(B == false && b > 0){
            path.append('B');
            dfs(a,b-1,true);
            // 撤销放B的操作
            path.deleteCharAt(path.length() - 1);
        }

    }

    // 成员变量path，当前前缀
    StringBuilder path = new StringBuilder();

    // 成员变量res，存储结果
    List<String> res = new ArrayList<>();

}


