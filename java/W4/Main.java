/*
 * W4：防御塔与路径可达（按笔经描述改编，不是已核实的原题）
 *
 * 地图是 R 行 C 列的网格，坐标从 0 开始。有 n 座防御塔，
 * 每座塔给出中心坐标 x、y 和半径 r。
 *
 * 格子 (i, j) 满足下面条件时，被防御塔覆盖，不能走：
 * (i - x)² + (j - y)² <= r²
 *
 * 只能上下左右移动。给出起点 (sx, sy) 和终点 (tx, ty)，
 * 判断是否能从起点走到终点。
 * 起点或终点被覆盖时输出 NO；能到达输出 YES，否则输出 NO。
 *
 * 输入：
 * 第一行：R C n
 * 接下来 n 行：x y r
 * 最后一行：sx sy tx ty
 *
 * 范围：1 <= R, C <= 500；0 <= n <= 50；0 <= r <= 50
 *
 * 测试 1：
 * 3 3 1
 * 1 1 0
 * 0 0 2 2
 * 输出：YES
 *
 * 测试 2：
 * 3 3 1
 * 1 1 1
 * 0 0 2 2
 * 输出：NO
 *
 * 测试 3：
 * 1 1 0
 * 0 0 0 0
 * 输出：YES
 */

import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int R = sc.nextInt();
        int C = sc.nextInt();
        int n = sc.nextInt();
        // 防御塔list
        List<guard> g = new ArrayList<>();
        // 获取全部防御塔坐标 半径
        for(int i = 0;i < n;i ++){
            int x = sc.nextInt();
            int y = sc.nextInt();
            int r = sc.nextInt();
            g.add(new guard(x,y,r));
        }
        // 创建map 0表示还可以走 1表示北方与他覆盖或者已走过
        int[][] map = new int[R][C];
        // 先将防御塔覆盖的设置为1
        guard_play(map,g);
        // 获取起点终点
        int sx = sc.nextInt();
        int sy = sc.nextInt();
        int ex = sc.nextInt();
        int ey = sc.nextInt();

        boolean res = have_way(map,sx,sy,ex,ey);

        System.out.println(res ? "YES" : "NO");

        return;

    }
    // 防御塔类 包含坐标 半径 获取方法
    public static class guard {
        int x;
        int y;
        int r;
        // 有参构建方法
        guard(int x,int y,int r){
            this.x = x;
            this.y = y;
            this.r = r;
        }
        // 获取防御塔信息
        Integer get_x(){
            return x;
        }
        Integer get_y(){
            return y;
        }
        Integer get_r(){
            return r;
        }

    }

    // 防御塔覆盖处理map
    public static void guard_play(int[][] map,List<guard> g){
        // 遍历防御塔
        for(guard cur : g){
            int x = cur.get_x();
            int y = cur.get_y();
            int r = cur.get_r();

            // 只遍历防御塔可能覆盖到的范围，并把范围裁剪到 map 边界内
            int rowStart = Math.max(0, x - r);
            int rowEnd = Math.min(map.length - 1, x + r);
            int colStart = Math.max(0, y - r);
            int colEnd = Math.min(map[0].length - 1, y + r);

            for(int i = rowStart; i <= rowEnd; i ++){
                for(int j = colStart; j <= colEnd; j ++){
                    int dx = i - x;
                    int dy = j - y;
                    if(dx * dx + dy * dy <= r * r){
                        map[i][j] = 1;
                    }
                }
            }
        }
        return ;
    }

    // 判断上下左右有没有路 没有就返回NO
    public static boolean have_way(int[][] map,int sx,int sy,int ex,int ey){
        // 越界了，当前方向走不通
        if(sx < 0 || sx >= map.length || sy < 0 || sy >= map[0].length){
            return false;
        }

        // 塔覆盖的格子或已经走过的格子，当前方向走不通
        if(map[sx][sy] == 1){
            return false;
        }

        // 到达终点
        if(sx == ex && sy == ey){
            return true;
        }

        // 标记为已访问，避免之后走回头路
        map[sx][sy] = 1;

        // 任意一个方向能到终点，就说明存在路径
        return have_way(map, sx - 1, sy, ex, ey)
                || have_way(map, sx + 1, sy, ex, ey)
                || have_way(map, sx, sy - 1, ex, ey)
                || have_way(map, sx, sy + 1, ex, ey);
    }

}
