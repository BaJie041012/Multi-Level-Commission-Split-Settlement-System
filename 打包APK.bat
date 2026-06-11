@echo off
chcp 65001 >nul
echo ========================================
echo    MCS 应用自动打包工具
echo    版本: MSC For Android V1.0
echo ========================================
echo.

set PROJECT_DIR=%~dp0
set ANDROID_SDK=%PROJECT_DIR%android-sdk
set NODE_DIR=%PROJECT_DIR%nodejs-portable\node-v20.14.0-win-x64
set JDK_DIR=%PROJECT_DIR%jdk-21

:: 检查 Node.js
if exist "%NODE_DIR%\node.exe" (
    echo [OK] Node.js 已存在
    goto :check_jdk
)

echo [下载] Node.js...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.14.0/node-v20.14.0-win-x64.zip' -OutFile '%PROJECT_DIR%nodejs-portable\node.zip' -UseBasicParsing"
echo [解压] Node.js...
powershell -Command "Expand-Archive -Path '%PROJECT_DIR%nodejs-portable\node.zip' -DestinationPath '%PROJECT_DIR%nodejs-portable' -Force"

:check_jdk
:: 检查 JDK
if exist "%JDK_DIR%\bin\java.exe" (
    echo [OK] JDK 已存在
    goto :check_sdk
)

echo [下载] JDK 21...
echo 请访问以下网址下载 JDK 21:
echo https://adoptium.net/temurin21/
echo 下载 Windows x64 JDK .zip 版本
echo 将解压后的文件夹重命名为 "jdk-21" 放在此目录
echo.
echo 或者访问:
echo https://github.com/adoptium/temurin21-binaries/releases
echo 下载 OpenJDK21U-jdk_x64_windows_hotspot_*.zip
echo.
echo 下载完成后，解压到 %PROJECT_DIR% 并将文件夹命名为 "jdk-21"
echo.
pause
exit /b 1

:check_sdk
:: 设置 JDK 环境变量
set JAVA_HOME=%JDK_DIR%
set PATH=%JAVA_HOME%\bin;%PATH%

:: 检查 Android SDK
if exist "%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
    echo [OK] Android SDK 命令行工具已存在
    goto :setup_sdk
)

echo [下载] Android SDK 命令行工具...
powershell -Command "Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%ANDROID_SDK%\cmdline-tools.zip' -UseBasicParsing"
echo [解压] Android SDK...
powershell -Command "Expand-Archive -Path '%ANDROID_SDK%\cmdline-tools.zip' -DestinationPath '%ANDROID_SDK%\temp' -Force"
powershell -Command "New-Item -ItemType Directory -Force -Path '%ANDROID_SDK%\cmdline-tools\latest'"
powershell -Command "Move-Item '%ANDROID_SDK%\temp\*' '%ANDROID_SDK%\cmdline-tools\latest\'"

:setup_sdk
:: 设置 Android SDK 环境变量
set ANDROID_HOME=%ANDROID_SDK%
set ANDROID_SDK_ROOT=%ANDROID_SDK%
set PATH=%NODE_DIR%;%ANDROID_SDK%\cmdline-tools\latest\bin;%ANDROID_SDK%\platform-tools;%PATH%

:: 接受许可证并安装必要的 SDK 组件
echo [安装] Android SDK 组件...
echo y | "%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
"%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

:: 安装 npm 依赖
echo [安装] npm 依赖...
cd /d %PROJECT_DIR%
call "%NODE_DIR%\npm.cmd" install

:: 初始化 Capacitor
if not exist "capacitor.config.json" (
    echo [初始化] Capacitor...
    call "%NODE_DIR%\npx.cmd" cap init MCS com.mcs.app --web-dir=www
)

:: 添加 Android 平台
if not exist "android" (
    echo [添加] Android 平台...
    call "%NODE_DIR%\npx.cmd" cap add android
)

:: 同步到 Android
echo [同步] 网页到 Android...
call "%NODE_DIR%\npx.cmd" cap sync android

:: 构建 APK
echo [构建] APK...
cd /d %PROJECT_DIR%\android
call gradlew assembleDebug

echo.
echo ========================================
echo    构建完成！
echo ========================================
echo APK 位置: %PROJECT_DIR%android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
