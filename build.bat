@echo off
echo ========================================================
echo  Compiling Online SAMS (Student Attendance Management System)
echo ========================================================

if not exist "bin" mkdir bin

dir /s /b src\*.java > sources.txt
javac -cp "lib\mysql-connector-j-26.7.0.jar;." -d bin @sources.txt
set BUILD_STATUS=%ERRORLEVEL%
del sources.txt

if %BUILD_STATUS% equ 0 (
    echo [SUCCESS] Backend compiled successfully into bin\ folder!
) else (
    echo [ERROR] Compilation failed. Please check errors above.
    pause
    exit /b %BUILD_STATUS%
)
