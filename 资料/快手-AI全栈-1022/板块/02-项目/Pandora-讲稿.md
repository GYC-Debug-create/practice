# Pandora 前端讲稿（2 分钟）

> 2026-10-19 写。源码只读；`本地启动\` 目录没有读、没有引用。
> 路径简写：`W` = `D:\work\求职\项目\Pandora\源码\pandora-work-system\web`，`B` = `...\pandora-work-system\backend\src\main\java\com\lei\springbootpractice4`。
> 带 **【待你补】** 的地方只有你本人能答。

## 一、先说清楚的事实（避免说错）

| 简历 / 口径里的说法 | 代码里的实际情况 |
|---|---|
| 请求层封装（Token、401） | **有**，在 `W/src/utils/request.js`，见下表 |
| Pinia 持久化 | **有，但是手写的，不是插件**：`W/src/store/log.js`、`theme.js` 自己读写 `localStorage`；`package.json` 依赖里没有 `pinia-plugin-persistedstate` |
| **Token 存在哪** | **不在 Pinia 里，在 `sessionStorage`**（`W/src/utils/auth.js:6,9-11,22-30`）。不要说「Token 放 Pinia 持久化」 |
| 路由守卫 | **有**，`W/src/router/index.js:59-78`，只判断 token 存不存在 |
| 接口对齐 | 有，例：`W/src/api/user.js:30-54` 把页面参数名映射成后端参数名 |
| 谁写的 | Pandora 仓库提交：你的账号 41 次，另外两位组员 26 + 5 次，另有一次在本机提交（`12e9811`，2026-10-13，「整改：开启 JWT 鉴权，修复分页筛选、统计、日志导出等问题」）。`git shortlog -sn HEAD` |

**【待你补】** `12e9811` 那次整改是你做的吗、做了什么？它写了「开启 JWT 鉴权」，说明在那之前后端鉴权没有完全开；这条如果被问到「安全是怎么做的」要能讲。

## 二、2 分钟口述稿

> Pandora 是课程实训做的企业内部管理系统，Vue 3 管理端，页面有用户管理、公司十大事项、仪表盘，仪表盘里有操作日志，可以导出。后端是 Spring Boot，用 JWT 鉴权（Web 端专用登录接口我也写过）；前端的几块基础设施是我负责的，下面讲四件事。
>
> **第一，请求层封装。** 所有接口都走一个 axios 实例，超时 10 秒。请求拦截器从 sessionStorage 里取 token，有就加到 `Authorization: Bearer` 头上。响应拦截器成功时直接返回 `response.data`，页面拿到的就是业务数据，不用每处再解包。
>
> **第二，401。** 我把 401 分成两种：**没带 token 的 401 是登录失败**，统一提示「账号或密码错误」；**带了 token 的 401 是会话过期**，清掉本地会话、弹一个提示、跳回登录页。有个细节：页面一次会并发好几个请求，token 过期时会同时回来好几个 401，所以我加了一个 `isHandlingUnauthorized` 标志，只弹一次。另外退出登录接口自己也可能返回 401，我给请求加了 `skipAuthHandler` 标记让它不走全局处理。
>
> **第三，路由守卫。** `beforeEach` 里看 sessionStorage 有没有 token：没有就只能去登录页，有就不让再回登录页。它只判断「有没有」，不判断「有没有过期」，过期由上一条的 401 拦截器兜底。
>
> **第四，Pinia 持久化。** 操作日志和主题两个 store，状态变化时写 localStorage，页面刷新后初始化时读回来。日志有保留期，过期自动清理，还能导出 CSV 和 JSON，CSV 按 RFC 4180 转义。请求层里要记「会话过期」日志，但请求层和 store 互相引用容易循环依赖，所以我是在 `main.js` 里把 `addLog` 函数注入给请求层。
>
> 接口对齐方面，页面用的参数名和后端不一样，我在 api 层统一做映射，页面不用关心后端字段名。

## 三、代码位置（行号已重新核对）

| 点 | 文件:行 | 原文 / 要点 |
|---|---|---|
| axios 实例、超时 | `W/src/utils/request.js:10-11,22-25` | `REQUEST_TIMEOUT = 10000`；`axios.create({ baseURL: '', timeout })` |
| **Token 注入** | `request.js:28-35` | `config.headers['Authorization'] = 'Bearer ' + token` |
| **响应解包** | `request.js:42-45` | `response => { return response.data }` |
| 错误信息提取 | `request.js:49-52` | 字符串直接用，否则取 `data.message \|\| data.error \|\| error.message` |
| **401：跳过标记** | `request.js:56-58` | `if (error.config?.skipAuthHandler) { return Promise.reject(error) }` |
| **401：登录失败 vs 过期** | `request.js:61-71` | `isLoginRequest = !error.config?.headers?.['Authorization']`；是 → `ElMessage('账号或密码错误')` |
| **401：会话过期** | `request.js:72-96` | 防重入 `isHandlingUnauthorized`（`:73-77`）→ 记日志（`:79-81`）→ `clearSession()`（`:84`）→ `ElMessageBox.alert('会话已过期，请重新登录')` → `window.location.href = '/login'`（`:87-94`） |
| 其他错误 / 网络错误 | `request.js:98-126` | `ElMessage` 5 秒；断网分支 `error.request` → 「网络错误，无法连接到服务器」并写日志 |
| 日志函数注入 | `request.js:13-20`；`W/src/main.js:40-42` | `setLogStore(logStore.addLog)`，注释：避免循环依赖 |
| **Token 存取** | `W/src/utils/auth.js:6-30` | `sessionStorage`，key `admin-token` / `user-info`；`setSession`、`clearSession` |
| 登录成功保存会话 | `W/src/views/login/index.vue:211` | `setSession(token, userData)` |
| **路由守卫** | `W/src/router/index.js:59-78` | 有 token：去 `/login` 就 `next({ path: '/' })`；无 token：非 `/login` 就 `next({ path: '/login' })` |
| 退出登录 | `W/src/layout/index.vue:134-147`；`W/src/api/user.js:17-28` | 先 `logout()` 让后端把 token 加入黑名单，**失败也继续清本地会话**，再 `clearSession()`、跳登录页；`logout` 带 `skipAuthHandler: true` |
| **Pinia 持久化（日志）** | `W/src/store/log.js:6,32-53,62-76` | `STORAGE_KEY = 'system_logs'`；初始化 `loadLogsFromStorage`；`addLog` 里 `saveToStorage()`；`:56-59` 按保留期清理 |
| 日志导出 CSV | `log.js:17-21,93-103` | RFC 4180：每格用双引号包裹，内部双引号写成两个；`downloadFile` 加 BOM（`:113-115`） |
| **Pinia 持久化（主题）** | `W/src/store/theme.js:5,22-29,39-47` | `pandora-theme`；没保存过就取系统偏好 `prefers-color-scheme` |
| 接口对齐 | `W/src/api/user.js:30-54` | `pageNum → current`、`pageSize → size`、`name → username`、`role → roleName`；空字符串条件不传 |
| 开发代理 | `W/vite.config.js:31-38` | `/api` → `http://127.0.0.1:8080` |
| 后端 401 来源 | `B/config/JwtRequestFilter.java:30-32,57,79` | 注释写明 401 由 `SecurityConfig` 的入口统一返回；登录路径放行；从 `Authorization: Bearer xxx` 取 token |

## 四、可能被追问的点（准备好）

| 追问 | 答法 |
|---|---|
| 为什么 401 要分「有无 token」 | 登录接口本身不带 token，它返回 401 就是账号密码错，如果也走「会话过期 → 跳登录页」，用户在登录页输错密码会被弹「会话已过期」，很怪。所以用请求头里有没有 `Authorization` 来区分（`request.js:61`）。**局限**：这是用「有没有 token」推断，不是后端给的明确错误码。更稳的做法是后端返回区分的错误码，前端按码处理 |
| 为什么 token 放 sessionStorage 不放 localStorage | `sessionStorage` 关掉标签页就清掉，管理端不希望登录态长期留在浏览器里。代价：新开标签页要重新登录。**两者都能被 XSS 读到**，要防的话得用 HttpOnly Cookie，这个项目没做 |
| 路由守卫只判断有无 token，安全吗 | 前端守卫只是体验层，不是安全层——真正的权限在后端：`JwtRequestFilter` 校验 token，管理员才有 `ROLE_ADMIN`（`B/config/JwtRequestFilter.java:30,116`）。前端守卫只是不让没登录的人看到空页面。**局限**：不校验过期、不校验角色；token 过期是第一个请求返回 401 时才被发现 |
| 守卫里为什么直接读 `sessionStorage.getItem('admin-token')` | 这是个小不一致：`auth.js` 开头注释说 key 统一放这里避免散落（`auth.js:1-4`），但路由守卫里把 key 硬编码了（`router/index.js:60`）。要改就换成 `getToken()`。被问到如实说「当时没统一」 |
| 并发多个 401 怎么处理 | `isHandlingUnauthorized` 标志位（`request.js:15,73-77`）。注释写明**不在 `finally` 里复位**：整页跳转后脚本重新加载，标志自然复位；提前复位会让跳转前陆续返回的 401 再弹窗（`:91-92`） |
| Pinia 为什么手写持久化 | 日志 store 需要自己的保留期清理和导出，状态结构简单，手写十几行就够，没必要加一个插件。**如实说**：插件（`pinia-plugin-persistedstate`）能少写样板代码，新项目会用 |
| Token 刷新（refresh token） | **项目里没有**，未找到证据。过期了就跳登录页。要做的话：登录返回 access + refresh，401 时用 refresh 换新 access 并重放失败的请求，同时只允许一个刷新请求在途 |
| 登录请求的密码字段 | 字段名叫 `passwordHash`，但前端传的是用户输入的原文（`login/index.vue:203` `passwordHash: loginForm.value.password`），**前端没有做哈希**。传输安全靠 HTTPS（后端有 `B/config/HttpsConfig.java`，提交 `badbff0`「login接口改为https协议」）。后端怎么存密码我没有看。被问到如实说，不要说「前端加密了」 |
| 有没有测试 | `package.json` 里装了 `vitest` 和 `@vue/test-utils`，但 `W/src` 下**未找到测试文件**。如实说没有写 |

## 五、还讲不清 / 没把握

| 点 | 说明 |
|---|---|
| `12e9811` 整改提交的内容 | 只看了提交标题，没有逐行读 diff，口径等你补 |
| 后端 `SecurityConfig` 的 401 返回细节 | 只读了 `JwtRequestFilter` 的注释，没读 `SecurityConfig` |
| 后端密码存储方式 | 没看 |
| 「接口对齐」你具体对齐了哪些接口 | 只确认了 `user.js` 里有参数映射，其余 `companyMatters.js`、`department.js`、`role.js` 没有逐个核对 |
