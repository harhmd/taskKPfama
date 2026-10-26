@echo off
title Nyahpasang SmartDash FAMA dari Windows Desktop

cls
echo ======================================================================
echo    LEMBAGA PEMASARAN PERTANIAN PERSEKUTUAN (FAMA)
echo    Nyahpasang Pintasan SmartDash FAMA dari Windows Desktop
echo ======================================================================
echo.

set /p confirm="Adakah anda pasti ingin membuang pintasan SmartDash FAMA? (Y/N): "
if /i not "%confirm%"=="Y" exit /b 0

del /f /q "%USERPROFILE%\Desktop\SmartDash FAMA.lnk" 2>nul
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartDash FAMA" 2>nul

echo.
echo ======================================================================
echo Pintasan pada Desktop dan Menu Start telah berjaya dipadam.
echo Fail projek dan data sistem kekal selamat dalam direktori ini.
echo ======================================================================
echo.
pause
