# LifeManager 项目深度分析报告

## 1. 项目背景与目标
**LifeManager** 是一款旨在帮助用户进行个人成长与生活管理的桌面应用程序。该项目集成了每日总结、任务管理、专注时钟和数据统计四大核心功能，致力于通过数字化手段提升用户的自我管理效率与生活质量。

## 2. 目录结构说明
项目核心代码位于 `lifemanager` 目录下，采用标准的 Electron + React 项目结构：

```
lifemanager/
├── dist-electron/      # Electron 主进程编译输出目录
├── electron/           # Electron 主进程源码
│   ├── main.ts         # 主进程入口，负责窗口创建与生命周期管理
│   ├── preload.ts      # 预加载脚本，暴露 IPC 接口给渲染进程
│   └── db.ts           # 本地数据库初始化与 IPC 处理器
├── src/                # React 渲染进程源码
│   ├── assets/         # 静态资源
│   ├── pages/          # 业务页面组件
│   │   ├── DailySummary.tsx  # 每日总结
│   │   ├── TaskManager.tsx   # 任务管理
│   │   ├── FocusTimer.tsx    # 专注时钟
│   │   └── Statistics.tsx    # 数据统计
│   ├── services/       # 前端服务层
│   │   └── db.ts       # 封装对 Electron 的 IPC 调用
│   ├── types/          # TypeScript 类型定义
│   ├── App.tsx         # 应用根组件与路由逻辑
│   └── main.tsx        # React 入口文件
├── release/            # 打包构建输出目录
├── package.json        # 项目依赖与脚本配置
└── vite.config.ts      # Vite 构建配置
```

## 3. 关键技术选型与版本

| 类别 | 技术/库 | 版本 | 用途 |
| :--- | :--- | :--- | :--- |
| **核心框架** | Electron | ^40.1.0 | 跨平台桌面应用容器 |
| | React | ^19.2.0 | 用户界面构建库 |
| | TypeScript | ~5.9.3 | 静态类型检查 |
| **构建工具** | Vite | ^7.2.4 | 高性能前端构建工具 |
| | Electron Builder | ^26.4.0 | 应用打包与分发工具 |
| **UI 组件库** | Ant Design | ^6.2.2 | 企业级 UI 设计语言与组件库 |
| | Framer Motion | ^12.29.2 | 动画库 |
| | React Icons | ^5.5.0 | 图标库 |
| **数据存储** | LowDB | ^7.0.1 | 轻量级本地 JSON 数据库 |
| **工具库** | Day.js | ^1.11.19 | 日期时间处理 |
| | Hello Pangea DnD | ^18.0.1 | 拖拽交互库 |
| | Recharts | ^3.7.0 | 图表绘制 |
| | UUID | ^11.1.0 | 唯一标识符生成 |

## 4. 核心模块职责与交互流程

### 4.1 核心模块
1.  **每日总结 (DailySummary)**: 提供日记记录、明日计划功能，作为用户每日复盘的入口。
2.  **任务管理 (TaskManager)**: 支持任务的创建、分类（学习、生活、习惯）、状态流转（待办、进行中、已完成）及拖拽排序。
3.  **专注时钟 (FocusTimer)**: 提供番茄钟或自定义计时功能，记录专注时长与标签。
4.  **数据统计 (Statistics)**: 可视化展示任务完成情况、习惯打卡记录及专注时长分布。

### 4.2 交互流程 (IPC)
项目采用 Electron 推荐的 ContextBridge 模式进行安全的 IPC 通信：
1.  **渲染进程 (Frontend)**: 通过 `window.electronAPI` 调用 `dbRead`, `dbWrite`, `dbUpdate` 方法。
2.  **预加载脚本 (Preload)**: 将 IPC 调用暴露给全局 `window` 对象，实现隔离。
3.  **主进程 (Backend)**: 监听 `ipcMain` 事件，操作 `LowDB` 读写本地 `db.json` 文件，并将结果返回前端。

## 5. 编译、构建与部署

### 5.1 环境要求
- Node.js (推荐 LTS 版本)
- npm 或 yarn

### 5.2 构建命令
项目在 `package.json` 中定义了以下关键脚本：

- **开发模式**: `npm run dev` - 启动 Vite 开发服务器并同时拉起 Electron 窗口。
- **生产构建**: `npm run build` - 执行 TypeScript 编译、Vite 构建及 Electron Builder 打包。
  - 构建产物位于 `release/` 目录。
  - Windows 平台默认生成 NSIS 安装包 (`.exe`)。

## 6. 测试策略与覆盖率
**现状**:
- **单元测试**: 目前项目**缺失**任何形式的自动化测试（如 Jest, Vitest）。
- **集成测试**: 无。
- **Linting**: 配置了 ESLint 进行代码规范检查。

**建议**:
- 引入 Vitest 对核心工具函数和 Hooks 进行单元测试。
- 使用 Playwright 或 Electron 自带的测试工具进行端到端 (E2E) 测试，确保主流程稳定性。

## 7. 已知缺陷与风险列表

1.  **数据持久化风险**:
    - 依赖单文件 `db.json` 存储所有数据。随着使用时间增长，文件体积变大，读写性能会显著下降。
    - 缺乏事务支持，若在写入时程序崩溃，可能导致 JSON 文件损坏（数据丢失）。
2.  **类型定义重复**:
    - `src/types/index.ts` 与 `electron/db.ts` 中存在重复的接口定义（如 `Task`, `Habit`）。一旦修改一处而遗忘另一处，会导致运行时错误或编译失败。
3.  **安全性**:
    - `electron/main.ts` 中设置了 `sandbox: false`，虽然方便了文件读写，但降低了应用的沙箱隔离安全性。
4.  **错误处理**:
    - 前端 `services/db.ts` 在检测不到 Electron API 时仅打印警告并返回空数据，缺乏用户友好的错误提示或降级策略。

## 8. 性能瓶颈与优化建议

### 性能瓶颈
- **文件 I/O**: 每次数据更新都会触发整个 JSON 文件的重写，对于高频操作（如专注时钟的秒级更新、拖拽排序）可能导致卡顿。
- **渲染性能**: 随着任务列表变长，若未使用虚拟列表 (Virtual List)，React 渲染开销会增大。

### 优化建议
1.  **数据库升级**: 建议迁移至 `SQLite` (如 `better-sqlite3`) 或 `PouchDB`，支持增量更新和更强的数据一致性。
2.  **状态管理**: 引入 React Query 或 Redux Toolkit 管理服务端状态，减少不必要的 IPC 通信频率。
3.  **代码复用**: 使用 Monorepo 工具 (如 Nx 或 Turbo) 或简单的 workspace 配置来共享类型定义文件，消除重复代码。

## 9. 后续迭代规划
1.  **数据同步**: 引入云端同步功能，支持多设备数据互通。
2.  **增强统计**: 增加周/月/年维度的深度报表分析。
3.  **插件系统**: 允许用户自定义习惯图标、主题色或专注白噪音。

---

## 快速上手指南 (Quick Start)

新成员请按照以下步骤在 10 分钟内完成环境搭建与运行：

### 1. 克隆项目与安装依赖
打开终端（Terminal），进入项目根目录：

```powershell
cd lifemanager
npm install
```

### 2. 启动开发环境
执行以下命令启动应用：

```powershell
npm run dev
```
*此时应自动弹出 LifeManager 应用窗口。*

### 3. 构建生产包 (可选)
若需验证打包流程：

```powershell
npm run build
```
*打包完成后，检查 `release/` 目录下的安装包。*
