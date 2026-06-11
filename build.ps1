$env:JAVA_HOME = "d:\github\MCS\jdk21.0.11_10"
$env:ANDROID_HOME = "d:\github\MCS\android-sdk"
$env:ANDROID_SDK_ROOT = "d:\github\MCS\android-sdk"
$env:PATH = "d:\github\MCS\jdk21.0.11_10\bin;$env:PATH"

Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host ""
Write-Host "Testing Java..."
& java -version
Write-Host ""

Set-Location "d:\github\MCS\android"
Write-Host "Building APK..."
Write-Host ""

# Run gradlew.bat using Start-Process to avoid blocking
$process = Start-Process -FilePath ".\gradlew.bat" -ArgumentList "assembleDebug" -NoNewWindow -Wait -PassThru

Write-Host ""
Write-Host "Exit code: $($process.ExitCode)"
Write-Host ""

if ($process.ExitCode -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

# List APK files
$apkFiles = Get-ChildItem -Path "app\build\outputs\apk" -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue
if ($apkFiles) {
    Write-Host ""
    Write-Host "APK files found:"
    $apkFiles | ForEach-Object { Write-Host "  $($_.FullName)" }
}

Read-Host "Press Enter to exit"
