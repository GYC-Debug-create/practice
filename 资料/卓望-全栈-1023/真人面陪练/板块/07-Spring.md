# ⑦ Spring

> 出处：N4（事务、注入方式）、N5（单例 Bean、IoC / DI）、N11、N12（自动配置、代理）、N15（readOnly）、N2（Spring Boot 加载、静态资源、换容器）、N1（AI 面：循环依赖）。编号见 `../面经原帖.md`。

## 追问链（真题）

**A 容器**
1. IoC 和 DI 分别是什么，两者是什么关系（N5）
2. 容器和 Bean 存在哪里；怎么理解单例 Bean 和容器（N5）
3. 单例 Bean 的成员变量存 userId 会出什么问题 → 怎么避免（N5）
4. Bean 的实例化和属性填充（N5）
5. Spring 注入 Bean 有哪些方式（N4）
6. 循环依赖，哪些场景解决不了（N1）

**B 事务**
7. Spring 怎么管理事务；了解 `@Transactional` 吗（N4）
8. 同一个类里用 `this` 调用 `@Transactional` 方法，代理会生效吗（N4）
9. `readOnly` 的作用，以及不适合用的场景（N15）

**C AOP**
10. JDK 动态代理和 CGLIB 的区别、优缺点、应用场景（N12）

**D Spring Boot**
11. 自动装配 / 自动配置是怎么实现的（N11、N12）
12. `@Conditional` 怎么做到按需加载（N12）
13. Spring Boot 的加载顺序（ImportSelector 相关）；静态资源怎么加载；从 Tomcat 换到其他容器要注意哪些参数（N2）

## 大纲

1. **根问题**：对象由谁创建、依赖由谁装配。IoC 是思想，把创建和装配的控制权交给容器；DI 是实现方式，由容器把依赖注入进来
2. **Bean 存在哪**：单例 Bean 存在 `DefaultSingletonBeanRegistry` 的 `singletonObjects` 里，这是一个 ConcurrentHashMap（beanName → 实例），对象本身在堆上
3. **生命周期**：实例化（反射调用构造器）→ 属性填充（注入依赖）→ Aware 回调 → BeanPostProcessor 前置处理 → 初始化（`@PostConstruct`、`afterPropertiesSet`、`init-method`）→ BeanPostProcessor 后置处理（AOP 代理在这一步生成）→ 使用 → 销毁
4. **单例和线程安全**（这是「容器里只有一个实例」带来的结果）：所有请求线程共用同一个 Bean → 成员变量存 userId 会被别的请求覆盖，导致串号 → 改成局部变量或方法参数、用 ThreadLocal（记得 `remove`）、或者改成 `@Scope("request")` / prototype
5. **注入方式**：构造器注入（推荐：依赖可以是 final、不会为空、方便测试）、setter 注入、字段 `@Autowired`；`@Autowired` 按类型注入，`@Resource` 按名称注入
6. **循环依赖**：用三级缓存（`singletonObjects`、`earlySingletonObjects`、`singletonFactories`）解决单例 + setter / 字段注入的情况；**解决不了**：构造器注入形成的循环、prototype Bean 的循环。Spring Boot 2.6 起默认禁止循环依赖
7. **事务原理**：`@Transactional` 基于 AOP 代理 → 代理对象开启事务 → 调用目标方法 → 提交或回滚
8. **事务失效**（这是「事务靠代理」带来的结果）：
   - `this` 调用绕过了代理
   - 方法不是 public
   - 异常被自己 catch 吞掉了
   - 默认只回滚 RuntimeException 和 Error，受检异常要配 `rollbackFor`
   - 类没被 Spring 管理
   - 数据库引擎不支持事务
   - 解决 `this` 调用：注入自己、用 `AopContext.currentProxy()`、把方法拆到另一个 Bean
9. **传播行为**：默认 REQUIRED（有事务就加入，没有就新建）；REQUIRES_NEW 总是新建；NESTED 是嵌套事务（保存点）
10. **readOnly**：告诉框架和数据库这是只读事务，可以做优化（例如 Hibernate 不做脏检查、可以路由到从库），并且事务内多次读取的结果一致；不适合的场景：方法里有写操作
11. **JDK 动态代理和 CGLIB**：JDK 代理基于接口（`Proxy` + `InvocationHandler`），只能代理接口里的方法；CGLIB 生成目标类的子类，不能代理 final 类和 final 方法；Spring Boot 2.x 默认用 CGLIB
12. **自动配置**：`@SpringBootApplication` 包含 `@EnableAutoConfiguration` → 它 `@Import` 了 `AutoConfigurationImportSelector` → 读取 `META-INF/spring.factories`（2.7 起是 `AutoConfiguration.imports`）里列出的配置类 → 再用 `@ConditionalOnClass`、`@ConditionalOnMissingBean`、`@ConditionalOnProperty` 判断是否生效
13. **换容器**：排除 `spring-boot-starter-tomcat`，引入 undertow 或 jetty 的 starter；`server.port` 这类通用配置不用改，`server.tomcat.*` 这类 Tomcat 专属参数要换成对应容器的
14. **静态资源**：默认从 `classpath:/static`、`/public`、`/resources`、`/META-INF/resources` 加载

## 一句话骨架

IoC 是把创建和装配交给容器，DI 是容器注入依赖的方式；容器里单例只有一份，所以不能存请求级状态；事务和 AOP 都靠代理，绕过代理（比如 `this` 调用）就失效。

## 易错点

- 把 IoC 和 DI 说成同一个东西，说不出两者的关系
- 只背了「this 调用会失效」，讲不出背后的原因是代理

## 自测

- 用「单例 Bean 存 userId」这一个例子，串讲 IoC、单例、线程安全
- 说出 4 种事务失效的情况，并分别说明原因
