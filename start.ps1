# PowerShell launcher for Online SAMS

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Online SAMS (Student Attendance Management System)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

Write-Host "[1/2] Compiling Java backend..." -ForegroundColor Yellow
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.java" | ForEach-Object { '"' + $_.FullName.Replace('\', '/') + '"' }
$files | Out-File -FilePath "sources.txt" -Encoding ascii
javac -cp "lib/mysql-connector-j-26.7.0.jar;." -d bin "@sources.txt"
$buildSuccess = $LASTEXITCODE -eq 0
Remove-Item sources.txt -ErrorAction SilentlyContinue

if (-not $buildSuccess) {
    Write-Host "[ERROR] Compilation failed. Please fix Java errors." -ForegroundColor Red
    exit 1
}

Write-Host "[2/2] Launching Web Server on port 8080..." -ForegroundColor Green
java -cp "lib/mysql-connector-j-26.7.0.jar;bin" com.sams.Main
