# LifeManager (个人生活管理系统)

LifeManager 是一个基于 Electron + React 的桌面应用程序，旨在帮助用户高效管理个人生活、任务和专注时间。它结合了任务管理、番茄钟专注、每日总结和数据统计等功能，助您实现个人成长与高效生活。

## ✨ 主要功能 (Features)

### 1. 📅 每日总结 (Daily Summary)
-   记录每日主要关注点和成就。
-   回顾一天的活动，支持补录遗漏的专注记录。
-   可视化展示当天的专注时长分布。

### 2. ✅ 任务管理 (Task Manager)
-   创建、编辑和删除待办事项。
-   支持任务优先级排序和分类。
-   直观的任务列表，帮助您保持条理。

### 3. ⏱️ 专注时钟 (Focus Timer)
-   内置番茄钟功能，帮助您保持专注。
-   支持自定义专注时长。
-   实时记录专注时间，自动同步到数据统计。

### 4. 📊 数据统计 (Statistics)
-   多维度数据可视化图表。
-   分析您的时间投入和任务完成情况。
-   帮助您发现时间管理中的不足并进行优化。

## 🛠️ 技术栈 (Tech Stack)

本项目采用现代化的前端技术栈构建：

-   **核心框架:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **构建工具:** [Vite](https://vitejs.dev/)
-   **桌面应用框架:** [Electron](https://www.electronjs.org/)
-   **UI 组件库:** [Ant Design 5](https://ant.design/)
-   **图标库:** [React Icons](https://react-icons.github.io/react-icons/)
-   **图表库:** [Recharts](https://recharts.org/)
-   **本地数据库:** [LowDB](https://github.com/typicode/lowdb)
-   **动画库:** [Framer Motion](https://www.framer.com/motion/)
-   **日期处理:** [Day.js](https://day.js.org/)

## 🚀 快速开始 (Getting Started)

### 环境要求
-   Node.js (推荐 v18+)
-   npm 或 yarn

### 安装依赖

```bash
npm install
# 或者
yarn install
```

### 启动开发环境

```bash
npm run dev
# 或者
yarn dev
```

此命令将同时启动 Vite 开发服务器和 Electron 窗口。

### 打包应用

```bash
npm run build
# 或者
yarn build
```

打包后的文件将生成在 `dist` 和 `dist-electron` 目录下，安装包位于 `release` 目录。

## 📂 项目结构

```
lifemanager/
├── electron/          # Electron 主进程相关代码
│   ├── main.ts        # 主进程入口
│   ├── preload.ts     # 预加载脚本
│   └── db.ts          # 本地数据库逻辑
├── src/               # React 渲染进程代码
│   ├── components/    # 通用组件
│   ├── pages/         # 页面组件 (每日总结, 任务管理等)
│   ├── services/      # 业务逻辑服务层
│   ├── utils/         # 工具函数
│   ├── assets/        # 静态资源
│   └── App.tsx        # 应用根组件
├── public/            # 公共静态文件
└── ...
```

## 📝 更新日志 (Changelog)

### [Unreleased]
-   **新增功能**: 在"今日专注"面板头部添加了"补录"按钮，支持手动添加遗漏的专注记录。
-   **组件优化**: 创建了 `SupplementaryFocusModal` 组件，统一了跨页面的手动记录逻辑。
-   **服务层**: 新增 `addSupplementaryRecord` 服务函数，确保数据验证和存储的一致性。

---

Copyright © 2026 Claude Code. All rights reserved.
