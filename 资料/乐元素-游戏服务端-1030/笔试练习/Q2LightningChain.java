/*
 * 第 2 题：闪电链判断（练习版）
 *
 * 来源：调研报告-1023.md 第 47 行，2025 U3D 客户端笔经（牛客）
 *   原题只留下题名和「编程/判定」，完整约束没有公开。
 *   下面的题干是按游戏里常见的闪电链技能改编的练习版，不是原题，练的是「按规则模拟」。
 *
 * 题目：
 *   地图上有 n 只怪物，编号 1 ~ n（注意：编号从 1 开始），第 i 只在整数坐标 (xi, yi)。
 *   闪电先击中编号为 s 的怪物，然后开始弹跳，最多弹 K 次。每次弹跳的规则：
 *     1. 只能跳到「还没被击中」且与当前怪物欧氏距离 <= R 的怪物
 *     2. 有多只可选时，跳到距离最近的；距离相同选编号小的
 *     3. 没有可选的怪物，闪电提前结束
 *   输出被击中的顺序，并判断编号为 t 的怪物有没有被击中。
 *
 * 输入：
 *   第一行 5 个整数 n R K s t
 *   接下来 n 行，每行两个整数 xi yi
 * 输出：
 *   第一行：被击中的怪物编号，按击中顺序，空格隔开（包括 s）
 *   第二行：t 被击中输出 YES，否则输出 NO
 *
 * 样例 1
 *   输入：
 *     5 3 3 1 5
 *     0 0
 *     2 0
 *     2 2
 *     5 2
 *     9 9
 *   输出：
 *     1 2 3 4
 *     NO
 *   说明：1→2 距离² 4；2→3 距离² 4；3→4 距离² 9 = R²，刚好能跳；已经弹了 3 次，结束
 *
 * 样例 2
 *   输入：
 *     3 2 5 1 3
 *     0 0
 *     1 0
 *     -1 0
 *   输出：
 *     1 2 3
 *     YES
 *   说明：从 1 出发，2 和 3 距离一样，选编号小的 2
 *
 * 数据范围：1 <= n <= 2000，0 <= K <= n，|xi|, |yi|, R <= 10^9
 *
 * 考点：模拟；比较距离用平方，不开根号（避免浮点误差）
 *
 * 自检：
 *   - 坐标到 10^9，差值平方会超 int，要用 long
 *   - 输入编号从 1 开始，数组下标别错位
 *   - K = 0 时只输出 s
 *   - 牛客 ACM 模式提交时类名要改成 Main
 */

import java.util.*;

public class Q2LightningChain
{
    public static void main(String[] args){

        Scanner sc = new Scanner(System.in);

        // 第一行 5 个整数 n R K s t
        // n怪物数量 R闪电距离 K闪电次数上限 s先击中的怪物编号 t判断其是否被击中
        int n = sc.nextInt();
        int R = sc.nextInt();
        int K = sc.nextInt();
        int s = sc.nextInt();
        int t = sc.nextInt();

        // 已经弹跳的次数（不包括初始命中的 s）
        int cnt = 0;

        // 输入n行坐标
        int[][] location = new int[n][2];

        // 存储击中的怪物编号
        List<Integer> hit = new ArrayList<>();

        // 存储每一个怪物的坐标
        for(int i = 0;i < n;i ++){
        int x = sc.nextInt();
        int y = sc.nextInt();
        location[i][0] = x;
        location[i][1] = y;
        }

        // 记录每一个怪物是否被击中，数组下标对应怪物编号 - 1
        int[] monster = new int[n];
        int current = s - 1;
        monster[current] = 1;
        hit.add(s);
        Q2LightningChain solver = new Q2LightningChain();
        
        // 最多弹跳 K 次；每次命中后更新当前怪物
        while(cnt < K){
            int next = solver.next_hit(location, monster, R, current, n);
            // 没有符合条件的未命中怪物，闪电提前结束
            if(next == -1){
                break;
            }
            monster[next] = 1;
            current = next;
            hit.add(next + 1);
            cnt++;
        }

        // 按击中顺序输出怪物编号
        for(int i = 0; i < hit.size(); i++){
            if(i > 0){
                System.out.print(" ");
            }
            System.out.print(hit.get(i));
        }
        System.out.println();
        System.out.println(monster[t - 1] == 1 ? "YES" : "NO");

    }


    // 返回下一个怪物的数组下标；没有候选时返回 -1
    public int next_hit(int[][] location, int[] monster, int R, int current, int n){
        int res = -1;
        long res_dis = Long.MAX_VALUE;
        int cur_x = location[current][0];
        int cur_y = location[current][1];
        long radiusSquared = (long) R * R;
        for(int i = 0;i < n;i ++){
            // i 和 current 都是从 0 开始的数组下标
            if(monster[i] == 0){
                long dx = (long) cur_x - location[i][0];
                long dy = (long) cur_y - location[i][1];
                long dis = dx * dx + dy * dy;
                // 同距离时保留先遍历到的较小编号
                if(dis <= radiusSquared && dis < res_dis){
                    res = i;
                    res_dis = dis;
                }
            }
        }
        return res;
    }


}

