# 🤖 AI Bot 规范与技能中心

本目录（`.ai-workspace`）是为本项目及开发团队量身定制的研发规范与技能指令集，旨在提升代码质量并为 AI 代理（Agent）提供精准的上下文指导，保障交付代码的健壮度与系统可维护性。

## 📁 规范与技能导航

- 📘 **[全局规范 (rules/global.md)](./rules/global.md)**：包含 Git 提交规范（Conventional Commits 细则）、项目核心业务术语以及凭据防泄露等安全红线底线。
- 🎨 **[前端规范 (rules/frontend.md)](./rules/frontend.md)**：包含 React / Vue 技术栈最佳实践，包括强类型定义、数据请求（Axios + TanStack Query Hooks）、全局状态防重绘机制与 UnoCSS 自适应样式准则。
- ⚡ **[前端页面开发技能 (skills/frontend-page-development/SKILL.md)](./skills/frontend-page-development/SKILL.md)**：针对标准前端页面开发 SOP。

---

## 📦 模块化安装与使用指南

该仓库已被打包为通用的 npm 工具包，您可以在其他项目中轻松一键同步这套 Rules 和 Skills。

### 1. 安装规范包

在您的目标项目根目录下安装（推荐作为开发依赖）：

```bash
npm install @luojz/ai-workspace-cli --save-dev
```

### 2. 同步与初始化规范

在目标项目根目录下运行以下同步命令：

```bash
npx ai-workspace init
```

*   **同步结构**：CLI 会 1:1 自动在目标项目下创建 `.ai-workspace/rules/` 和 `.ai-workspace/skills/` 并拷贝相应规范文件。
*   **重复同步**：当文件没有被修改过，再次运行同步时，会自动静默跳过无变化的规范（通过 MD5 哈希校验）。

### 🔄 冲突解决与自动备份

当升级本规范包且重新在目标项目中同步时：
*   如果目标项目本地的规则文件已经被修改过，CLI 会在覆盖前**触发警告交互提示**。
*   如果您确认覆盖，您的本地旧文件会被**自动备份**至 `.ai-workspace/.backup/<时间戳>/` 目录下，随后用新版本覆盖，确保个性化配置绝不丢失。