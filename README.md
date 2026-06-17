# MCS (Multi-Level Commission Split Settlement System)

> 多级抽成分账系统 - 一个用于陪玩/礼物团队的派单佣金计算工具

[![Version](https://img.shields.io/badge/version-2.13-blue.svg)]()
[![Android](https://img.shields.io/badge/platform-Android-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-orange.svg)]()

## 项目简介

MCS 是一个专注于陪玩、礼物/选送等业务的**派单抽成计算工具**。
系统支持两种业务类型：普陪和礼物/选送，每种类型都有独立的抽成规则和计算方式。

## 核心功能

### 📋 普陪模式
- 派单信息录入（接待、陪陪、老板、类型、时长、单价）
- 时长计算（整数时长、x.5 时长）
- 折扣支持（自动计算折后总价）
- 加价功能（深夜加价、自定义加价理由）
- 团内点单支持
- 多级抽成（团抽、派抽/接抽、邀请人抽成）

### 🎁 礼物/选送模式
- 类型选择（选送/礼物）
- 份数自动读取（从陪陪字段以空格分割）
- 单价抽成判断（单价>10 时才计算抽成）
- 智能到手价（无抽成=单价，有抽成=总价÷份数）

### 🛠️ 通用功能
- **一键复制**：多层复制策略，支持手动复制备选
- **抽成规则弹窗**：内置完整的抽成规则说明
- **响应式设计**：适配手机屏幕

## 抽成规则

### 普陪类型

| 条件 | 团抽 | 派抽 | 接抽 | 邀请人抽 |
|------|------|------|------|----------|
| 无邀请人 | 5% | - | 15% | - |
| 有邀请人 | 5% | 7.5% | 7.5% | 7.5% |

### 礼物/选送类型

| 条件 | 团抽 | 派抽 | 接抽 | 邀请人抽 |
|------|------|------|------|----------|
| 单价 > 10，无邀请人 | 10% | - | 10% | - |
| 单价 > 10，有邀请人 | 10% | 5% | 5% | 5% |
| 单价 ≤ 10 | 0% | 0% | 0% | 0% |

### 时长计算公式

- **整数时长**：`总价 = 时长 × 单价`
- **x.5 时长**：`总价 = 整数部分 × 单价 + 单价÷2 + 2`

### 到手价计算

- **普陪**：`到手价 = 总价 - 团抽 - 派抽/接抽 - 邀请人抽`
- **礼物/选送无抽成**：`到手价 = 单价`
- **礼物/选送有抽成**：`到手价 = 抽后总价 ÷ 份数`

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript（纯前端，无需后端）
- **移动端封装**：Capacitor 6.x
- **构建工具**：Gradle 8.x
- **开发环境**：JDK 21 + Android SDK 34

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17 或 JDK 21
- Android SDK (API 34)
- Gradle 8.x

### 开发模式

```bash
# 同步资源到 Android 项目
npx cap sync android

# 构建 APK
cd android
./gradlew assembleDebug
```

### 构建 Android APK

**方式一：使用批处理脚本（推荐）**
```bash
双击 构建APK.bat
```

**方式二：手动构建**
```bash
# 1. 同步前端资源
Copy-Item "www\index.html" "android\app\src\main\assets\public\index.html" -Force

# 2. 构建 APK
cd android
$env:JAVA_HOME="path\to\jdk"
.\gradlew.bat assembleDebug
```

**方式三：使用 PowerShell 脚本**
```powershell
.\构建APK.ps1
```

构建完成后，APK 文件位于：
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## 版本管理

### 版本配置文件

版本信息存储在 `version.json` 文件中：

```json
{
  "version": "2.13",
  "versionCode": 20
}
```

### 版本发布流程

1. 修改 `version.json` 中的版本号
2. 执行构建脚本
3. 将生成的 APK 重命名为 `MCS For Android Vx.x.apk`
4. 保存到 `releases/` 目录

### 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 发布历史

| 版本 | 日期 | 更新说明 |
|------|------|----------|
| V2.13 | 2026-06-17 | 修复普陪模块抽成条件判断错误 |
| V2.12 | 2026-06-17 | 修复礼物模块有邀请人时抽成计算错误 |
| V2.11 | 2026-06-17 | 邀请人字段始终显示，礼物模块邀请人抽为0时显示为空 |
| V2.10 | 2026-06-17 | 修正礼物/选送到手价计算逻辑 |
| V2.9 | 2026-06-17 | 完善代码注释（文件/段落/函数/行注释） |
| V2.8 | 2026-06-17 | 添加文件头注释和函数注释 |
| V2.7 | 2026-06-17 | 份数不显示在结果页面 |
| V2.6 | 2026-06-17 | 份数不显示在复制内容中 |
| V2.5 | 2026-06-17 | 礼物/选送抽成基于单价，份数自动读取 |
| V2.4 | 2026-06-16 | 礼物/选送分区改造 |
| V2.3 | 2026-06-16 | 派抽/接抽互斥显示逻辑修复 |
| V2.2 | 2026-06-16 | 深夜+5仅作备注 |
| V2.1 | 2026-06-16 | 普陪和礼物抽成规则分别 |
| V2.0 | 2026-06-16 | 新增首页导航 |
| V1.4 | 2026-06-11 | 备注为空时不显示短横杠 |
| V1.3 | 2026-06-11 | 时长计算规则 |
| V1.2 | 2026-06-11 | 时长输入验证 |
| V1.1 | 2026-06-11 | 一键复制优化 |
| V1.0 | 2026-06-11 | 初始版本 |

详细的更新日志请查看 [CHANGELOG.md](CHANGELOG.md)

## 项目结构

```
MCS/
├── www/                                # 前端源码
│   └── index.html                      # 主页面（包含所有逻辑）
├── android/                            # Android 项目（Capacitor）
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/          # 同步的前端文件
│   │   │   └── java/                   # Android 原生代码
│   │   └── build.gradle
│   └── build.gradle
├── releases/                           # 发布的 APK 文件
│   ├── MCS For Android V1.1.apk
│   ├── MCS For Android V1.2.apk
│   ├── ...
│   └── MCS For Android V2.9.apk
├── version.json                        # 版本配置文件
├── CHANGELOG.md                        # 更新日志
├── README.md                           # 项目说明
├── 构建APK.bat                        # Windows 构建脚本
└── 构建APK.ps1                        # PowerShell 构建脚本
```

## 开发说明

### 代码结构

`www/index.html` 包含完整的应用代码：

1. **HTML 结构**：表单、按钮、结果展示
2. **CSS 样式**：使用 CSS3 实现现代化 UI
3. **JavaScript 逻辑**：
   - `navigateTo()` - 页面导航
   - `calculate()` - 核心计算函数
   - `copyResult()` - 复制结果
   - `updateTotalPrice()` - 自动计算总价
   - `validateDuration()` - 时长验证
   - `autoQuantityFromCompanion()` - 份数自动读取

### 注释规范

代码遵循详细的注释规范：
- **文件注释**：包含作者、版本、日期、变更历史
- **段落注释**：分隔不同的功能模块
- **函数注释**：JSDoc 风格，说明功能、参数、返回值
- **行内注释**：解释关键逻辑和复杂代码

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

[MIT License](LICENSE)

## 作者

戒者有八
