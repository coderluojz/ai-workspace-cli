---
name: frontend-page-development
description: "在项目中开发或重构前端页面的标准操作指南。指导包括接口定义、TanStack Query 状态封装、逻辑钩子抽取、UnoCSS UI 编写等全生命周期的 SOP 流程。"
risk: low
source: local
date_added: "2026-06-12"
---

# ⚡ 前端页面开发技能规范

本技能定义了在 React/Vue 项目中标准开发一个前端页面所需的完整 SOP（标准作业程序）流程，AI 代理或开发人员必须严格按此阶段顺序执行，以确保产出的页面符合团队的技术架构和可维护性标准。

---

## 1. 核心开发工作流 (Core Development Workflow)

### 阶段一：定义类型契约 (Types First)
在新页面或新模块动工之前，必须首先建立数据契约：
1. 在页面同级目录或共享类型目录下，创建 `types.ts`。
2. 声明所有 API 交互的数据类型：`IPaginationRequest`、`IQueryResponse`、`IPayload`。
3. 声明组件的 Props 和 State 类型。
4. **禁止**：先写代码，后补类型；**绝对禁止**使用 `any` 作为类型的妥协方案。

### 阶段二：数据请求与 Hook 封装
禁止将 API 异步函数暴露在组件层：
1. 在 `src/services/` 或页面专属 `queries.ts` 中，编写 Axios 请求函数。
2. 使用 TanStack Query 封装 `useQuery` / `useMutation` 自定义 Hook。
3. 必须配置唯一的 `queryKeys` 工厂对象，用于多环境缓存和无效化刷新。
4. 必须使用 `select` 数据转换器对后端原始数据进行清洗。

### 阶段三：提取 Custom Hook（逻辑与视图彻底解耦）
将组件的复杂副作用和交互逻辑从视图中剥离：
1. 新建 `hooks/usePageLogic.ts`（以 React 为例）封装本地 State 与 queries。
2. 编写表单联动、列表筛选、状态流转的交互逻辑。
3. **闭包防护**：凡是向外暴露的交互事件回调，必须使用 `ahooks` 的 `useMemoizedFn` 进行稳定化包装。
4. **日志规范**：异步请求捕获异常时，必须打印出携带当前操作上下文信息的 `console.error`。

### 阶段四：UI 渲染与 UnoCSS 布局组装
编写只含 UI 排布与事件触发的轻量组件：
1. 页面主入口 `index.tsx`（或 Vue 中的组件）引用 `usePageLogic`。
2. 使用 UnoCSS 原子类进行样式排布，杜绝写死像素和内联 style。
3. 遵循单一职责，如果局部 DOM（如抽屉弹窗、表格行等）超过 50 行，必须拆分到同级目录下的 `components/` 文件夹中。
4. 循环渲染必须绑定数据流中唯一的业务 ID 作为 React `key` 或 Vue `:key`。

---

## 2. 交互与状态控制规范 (UX & Robustness SOP)

在阶段四编写 UI 时，必须显式对以下场景进行规范化控制，以保障移动端/网页端的用户交互体验。

### A. 四大状态（Loading, Empty, Error, Success）的完备处理
每个数据驱动的页面必须完整处理四个阶段，不能留下状态空白：
- **Loading（加载中）**：
  - 数据获取期间，页面核心交互区域禁止呈空白态或卡死。
  - 应使用 **骨架屏 (Skeleton)** 或 loading 遮罩层进行占位，改善视觉反馈。
- **Empty（空数据）**：
  - 当数据接口返回空数组或空对象时，必须显示符合当前业务场景的 Empty 插画与提示文字（例如：“暂无聊天记录，点击下方发送新消息”），并提供可选的快速操作按钮。
- **Error（错误降级）**：
  - 网络请求失败（如 500、断网等）或 React 组件发生渲染崩溃时，必须有降级 UI。
  - 核心操作组件最外层必须用 `ErrorBoundary` 包裹，并在页面报错区域提供“重新加载”或“点击重试”的重试通道。
- **Success（渲染成功）**：
  - 正常渲染主视图，避免数据突变造成的局部视图剧烈闪烁。

### B. 输入与操作防抖（Debounce）
- 当页面中存在根据用户输入实时进行接口检索（如智能联想、搜索框、范围滑块等）的交互时，**必须**引入防抖机制。
- 使用 `ahooks` 中的 `useDebounceFn` 或是自定义防抖，统一配置 300ms 左右的延迟，防止用户高频打字导致的后台接口拥堵与性能回退。

### C. 多环境与自适应适配
- 涉及到域名、网关、外部跳转的参数配置，一律不得在代码中写死，必须从 `vite.config` 转发或使用 `import.meta.env.VITE_` 形式获取。
- 移动端排版优先使用 UnoCSS 自带的 `pt-safe`、`pb-safe` 适配 iOS/Android 的刘海屏与系统底层安全区。
