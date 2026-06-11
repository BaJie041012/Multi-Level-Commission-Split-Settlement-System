$env:JAVA_HOME = "d:\github\MCS\jdk21.0.11_10"
$env:ANDROID_HOME = "d:\github\MCS\android-sdk"
$env:ANDROID_SDK_ROOT = "d:\github\MCS\android-sdk"

Write-Host "=== MCS 打包工具 v1.0 ==="
Write-Host ""

# 读取版本配置
$versionFile = "d:\github\MCS\version.json"
if (Test-Path $versionFile) {
    $versionConfig = Get-Content $versionFile | ConvertFrom-Json
    $version = $versionConfig.version
    $versionCode = $versionConfig.versionCode
} else {
    $version = "1.0"
    $versionCode = 1
}

Write-Host "当前版本: MSC For Android V$version"
Write-Host ""

Write-Host "[1/4] 检查环境..."
& java -version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Java 不可用"
    Read-Host "按任意键退出..."
    exit 1
}
Write-Host "OK"

Write-Host "[2/4] 同步网页资源..."
Copy-Item "d:\github\MCS\www\index.html" "d:\github\MCS\android\app\src\main\assets\public\index.html" -Force
Write-Host "OK"

Write-Host "[3/4] 构建 APK..."
Set-Location "d:\github\MCS\android"
& .\gradlew.bat assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "错误: 构建失败！"
    Read-Host "按任意键退出..."
    exit 1
}
Write-Host "OK"

Write-Host "[4/4] 重命名并保存 APK..."
$sourceApk = "d:\github\MCS\android\app\build\outputs\apk\debug\app-debug.apk"
$outputDir = "d:\github\MCS\releases"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$targetApk = "$outputDir\MCS For Android V$version.apk"

Copy-Item $sourceApk $targetApk -Force
Write-Host "APK 已保存到: $targetApk"

Write-Host ""
Write-Host "=== 构建完成 ==="
Write-Host "版本: MSC For Android V$version"
Write-Host "APK: $targetApk"
Write-Host ""

# 询问是否更新版本号
$updateVersion = Read-Host "是否更新版本号? (y/N)"
if ($updateVersion -eq "y" -or $updateVersion -eq "Y") {
    $newVersion = Read-Host "输入新版本号 (如 1.2): "
    if ($newVersion) {
        $newVersionCode = $versionCode + 1
        $newConfig = @{
            version = $newVersion
            versionCode = $newVersionCode
        } | ConvertTo-Json
        Set-Content -Path $versionFile -Value $newConfig
        Write-Host "版本已更新为: V$newVersion"
    }
}

Read-Host "按任意键退出..."
