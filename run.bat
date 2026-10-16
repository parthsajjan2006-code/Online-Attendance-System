@echo off
echo ========================================================
echo  Starting Online SAMS Web Server
echo ========================================================

if not exist "bin\com\sams\Main.class" (
    echo Compiling first...
    call build.bat
)

java -cp "lib\mysql-connector-j-26.7.0.jar;bin" com.sams.Main
pause
