# 🎨 前端研发规范

本文件约定了前端团队在进行业务开发与重构时的通用标准，涵盖架构原则、React / Vue 技术栈最佳实践、数据请求规范、状态管理渲染防抖以及样式自适应规则。

---

## 1. 核心设计原则 (Tech Lead 视点)
为了保障代码的长期可读性与系统可维护性，所有前端代码必须遵循以下黄金法则：

- **严格类型安全（Strict Type Safety）**：
  - 项目启用 TS 严格模式（`strict: true`）。**禁止使用 `any` 声明**或使用 `// @ts-ignore` 绕过编译。
  - 所有网络请求的输入参数（Params/Payload）、后端响应接口数据以及组件属性（Props），都必须声明完备的 `interface` 或 `type`。
- **零魔法值（No Magic Values）**：
  - 严禁在业务逻辑或 UI 条件判断中硬编码魔法数字、状态字符串。
  - 所有此类标识值，必须在 `src/constants/` 下提取为 TypeScript `enum` 或 `const` 常量字典进行统一维护。
- **单一职责原则（Single Responsibility）**：
  - 任何函数、类方法或组件内的逻辑，若代码量**超过 50 行**，或承担了多项独立任务，必须主动拆分为更小的纯函数或独立子模块。
  - 组件文件行数建议控制在 **150 行**以内，超出时应考虑剥离非 UI 交互的复杂计算或子树组件。

---

## 2. 数据请求与异步规范 (Axios & TanStack Query)
项目中所有网络请求统一通过 Axios 发起，并使用 TanStack Query（React Query）进行缓存与生命周期绑定。组件内禁止直接发起原始 AJAX 请求。

### A. Axios 基础单例封装
- 在 `src/services/` 中对 Axios 进行统一封装，创建具有拦截器配置的单例实例。
- **请求拦截器（Request Interceptor）**：自动从本地缓存（如 Cookie / Storage）中提取身份凭证，并在 Header 中添加 `Authorization: Bearer <Token>`。对于 GET 请求，使用工具函数统一对特殊字符或数组类型参数进行序列化。
- **响应拦截器（Response Interceptor）**：
  - 对非 2xx 的 HTTP 状态码进行全局捕获：如遇 `401` 执行清除 Token 并重定向至登录页，`403` 弹出无权限提示，`500` 触发系统异常 Toast。
  - 自动解包响应结构，只返回业务数据层（例如 `return response.data`），使上层消费端类型清晰。

### B. TanStack Query 封装与调用规范
- **禁止在业务组件内直接调用 axios 异步函数**。所有查询与变更，必须提取为独立的 Query/Mutation 自定义 Hooks。
- **Query Key 的工厂化管理**：为避免手动拼写字符串键造成缓存混乱，必须定义全局或模块级 `queryKeys` 工厂管理对象：
  ```typescript
  // 示例：src/pages/Home/queries.ts
  export const chatKeys = {
    all: ['chats'] as const,
    lists: () => [...chatKeys.all, 'list'] as const,
    detail: (chatId: string) => [...chatKeys.lists(), chatId] as const,
  };
  ```
- **数据过滤器（Select 属性）**：使用 `useQuery` 时，若后端数据结构与 UI 展示结构不一致，必须使用 `select` 选项进行数据映射（Data Transform），清洗和精简状态，组件只消费清洗后的精炼数据。
- **异常捕获与重试机制**：
  - 配置合理的 `retry` 策略（例如默认重试 1 次，对 `4xx` 错误不重试）。
  - 使用全局的 `QueryCache` 或 Hook 内部的回调触发异常提示，避免在每个组件中重复书写 UI Toast。

---

## 3. React 规范扩展 (基于 React 18 & Zustand)

### A. 逻辑与视图深度解耦
- **自定义 Hooks 优先**：任何页面组件如果包含复杂的 API 请求、定时器、状态变更等交互逻辑，**必须**将业务逻辑提炼至独立的 Custom Hook 中（如 `useHomeLogic.ts`）。页面组件 (`index.tsx`) 应保持精简，主要负责 UI 布局与事件分发，代码行数严格控制在 100 行内。
- **展示组件与容器组件**：纯 UI 组件应保持为无状态展示组件（Presentational Components），由外部传入 props，保证其在多场景下的极高可复用度。

### B. React Hooks 规范与防陷阱
- **依赖项完整性**：绝对禁止直接忽视 ESLint 的 `react-hooks/exhaustive-deps` 警告。如有必要排除依赖，须在代码中书写行内注释，详述其架构设计原因。
- **引用稳定与闭包陷阱**：对于高频触发的回调，为了避免每次渲染都生成新函数导致子组件无效重绘，同时规避 `useEffect` 里的老旧闭包（Stale Closure），必须使用稳定化工具。
  - *当前项目*：统一采用 `ahooks` 库的 `useMemoizedFn` 对需要保持引用稳定的回调进行包裹，不要手写空依赖的 `useCallback`。
- **杜绝 Effect 同步状态**：严禁通过 `useEffect` 来监听本地状态 A 并派生计算出本地状态 B。这会导致二次渲染并引发数据流混乱。应优先使用**事件流触发**或**计算属性派生**：
  ```typescript
  // 推荐：直接在渲染期计算（派生状态），或使用 useMemo
  const filteredList = useMemo(() => list.filter(item => item.active), [list]);
  ```

### C. 渲染性能优化与 Zustand 最佳实践
- **正确使用 React.memo**：当子组件十分庞大，或者接收大量繁重的 Props 且父组件频繁刷新时，必须对子组件使用 `React.memo` 优化。此时其 Props 中所有的函数类型必须搭配使用 `useCallback` 或 `useMemoizedFn` 维持稳定引用，否则 memo 将失效。
- **列表 Key 唯一性**：渲染循环列表时，必须使用数据源中的全局唯一 ID（如 `item.id`）作为 `key`。**严禁**直接使用 `index` 索引，除非该列表内容是绝对静态、且永远不会执行插入、删除、排序等动态变更的。
- **Zustand 自动浅比对（防重绘 Hook）**：
  为避免每次解构多字段时，繁琐地在组件中手动嵌套 `useShallow`。必须统一在公共 Hooks 目录封装自动浅比对的属性提取工具：
  ```typescript
  import { useShallow } from 'zustand/react/shallow';
  import type { UseBoundStore, StoreApi } from 'zustand';

  /**
   * 自动浅比对并按字段数组提取的 Zustand 选择器 Hook（提供强类型自动提示）
   * @param useStore Zustand 的 Store Hook
   * @param keys 提取字段名数组，受 keyof 约束以保障 IDE 自动补全
   * @returns 仅包含所选字段的子对象 Pick<S, K>
   */
  export function useStoreFields<S, K extends keyof S>(
    useStore: UseBoundStore<StoreApi<S>>,
    keys: K[]
  ): Pick<S, K> {
    return useStore(
      useShallow((state: S) => {
        const result = {} as Pick<S, K>;
        for (const key of keys) {
          result[key] = state[key];
        }
        return result;
      })
    );
  }
  ```
  在业务组件中，凡是从全局 Store 提取多个属性或方法，**必须**使用 `useStoreFields` 以杜绝无关状态更新时的无谓渲染：
  ```typescript
  // 示例：IDE 会在输入数组元素时提供类型补全，且只有 username 或 avatar 变动时本组件才会重绘
  const { username, avatar } = useStoreFields(useUserStore, ['username', 'avatar']);
  ```

---

## 4. Vue 最佳实践 (行业标准)
针对团队可能涉及的 Vue 项目，采用行业标准规范进行约束：

- **响应式属性约束**：Props 和 Emits 必须结合 TypeScript 强类型定义。必须显式定义 `defineProps<IProps>()` 和 `defineEmits<TEmits>()`，保障类型推导完备。
- **Vue Reactivity 准则**：单一基础数据一律使用 `ref`，表单等复杂对象使用 `ref` 或 `reactive` 但不可混用，修改对象属性时应保持原响应式对象的引用不丢失。
- **组件结构规范**：统一采用 **Vue 3 Composition API** 模式的 `<script setup lang="ts">`，并限制单个组件的逻辑规模。

---

## 5. 样式与移动端适配 (UnoCSS / Tailwind)
- **UnoCSS 原子化规范**：样式优先选用 UnoCSS 原子类。禁止使用内联 `style` 描述复杂样式（特殊动画或动态变量除外）。
- **刘海屏与虚拟键适配**：涉及全屏布局或底部操作栏时，必须使用 `pt-safe`、`pb-safe` 适配 iOS/Android 的 `safe-area-inset`。
- **1px 物理像素边框**：在移动端高分屏下，细线边框必须使用 UnoCSS 中的特定边框类（如配合伪元素进行 scale 缩放），禁止使用原生 `border: 1px solid` 导致边框过粗。
- **避免样式魔改**：在调整 Antd Mobile 组件样式时，优先通过 CSS Variables 覆写，禁止直接覆写第三方库底层的哈希 class，防止第三方库升级时样式崩塌。

---

## 6. 模块导入与代码组织
- **路径别名**：一律使用根路径别名 `@/` 引用内部文件，严禁使用超出两层的相对路径（如 `../../../../components`）。
- **循环依赖防护**：模块间解耦，禁止在组件或 Hooks 中引入跨域循环依赖。类型定义必须使用 `import type` 显式导入。
