# Multi-Level Commission Split Settlement System (MCS)

一个用于陪玩/陪聊团队的**派单佣金计算工具**，支持多级佣金分成规则自动计算。

## 功能介绍

- **派单信息录入**：接待、陪陪、老板、类型、时长、单价等
- **自动计算总价**：根据时长和单价自动计算，支持手动输入
- **折扣支持**：输入折扣自动计算折后价格
- **加价功能**：支持深夜加价、自定义加价理由
- **多级佣金分成**：
  - 团抽（团队提成）
  - 派抽（派单人员提成）
  - 接抽（接待人员提成）
  - 邀请人抽成（邀请人拉板进团时平分抽成）
- **团内点单**：支持团内点单模式（派抽转团长）
- **一键复制结果**：计算结果一键复制到剪贴板
- **抽成规则查看**：内置抽成规则说明弹窗

## 抽成规则

| 类型 | 条件 | 团抽 | 派抽 | 接抽 |
|------|------|------|------|------|
| 普通陪玩 | 10r 及以下 | 0% | 0% | 0% |
| 普通陪玩 | 10r 以上 | 5% | 15% | 0% |
| 有邀请人 | 10r 以上 | 5% | 7.5% | 7.5% |
| 团内点单 | - | - | 转团长 | 无 |

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript（纯前端，无需后端）
- **构建工具**：Vite
- **移动端封装**：Capacitor（打包为 Android APK）

## 快速开始

### 开发模式

```bash
npm install
npm run dev
```

### 构建 Android APK

```bash
npm run build
npm run android
```

或使用 PowerShell 脚本：

```powershell
.\构建APK.ps1
```

## 发布版本

| 版本 | 下载 |
|------|------|
| V1.4 | [下载 APK](https://github.com/BaJie041012/Multi-Level-Commission-Split-Settlement-System/releases/tag/v1.4.0) |
| V1.3 | [下载 APK](https://github.com/BaJie041012/Multi-Level-Commission-Split-Settlement-System/releases/tag/v1.3) |
| V1.2 | [下载 APK](https://github.com/BaJie041012/Multi-Level-Commission-Split-Settlement-System/releases/tag/v1.2) |
| V1.1 | [下载 APK](https://github.com/BaJie041012/Multi-Level-Commission-Split-Settlement-System/releases/tag/v1.1) |

查看所有 [Releases](https://github.com/BaJie041012/Multi-Level-Commission-Split-Settlement-System/releases)

## 项目结构

```
MCS/
├── www/                    # 前端源码
│   └── index.html          # 主页面（派单表单）
├── android/                # Android 项目（Capacitor）
├── releases/               # 发布的 APK 文件
├── package.json            # 项目配置
├── capacitor.config.json   # Capacitor 配置
└── build.ps1               # 构建脚本
```

## 许可证

[LICENSE](LICENSE)
