@echo off
setlocal enabledelayedexpansion
title Pemasang SmartDash FAMA ke Windows Desktop

cls
echo ======================================================================
echo    LEMBAGA PEMASARAN PERTANIAN PERSEKUTUAN (FAMA)
echo    SmartDash FAMA - Penjejakan Arahan Ketua Pengarah (KP)
echo    Pemasang Aplikasi Windows Desktop / Laptop (Windows 10 / 11)
echo ======================================================================
echo.

:: 1. Semak Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [RALAT] Node.js tidak dijumpai dalam PATH Windows anda.
    echo Sila pasang Node.js terlebih dahulu dari: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/3] Memeriksa kebergantungan sistem...
echo       - Node.js dikesan: Berjaya.

echo.
echo [2/3] Menjana Pintasan Aplikasi Windows Desktop ^& Menu Start...
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0create-shortcuts.ps1"

echo.
echo [3/3] Pengesahan Pemasangan...
echo       - Pintasan Desktop: "%USERPROFILE%\Desktop\SmartDash FAMA.lnk"
echo       - Menu Start:       "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartDash FAMA\SmartDash FAMA.lnk"
echo       - Ikon Rasmi:       "%~dp0icons\fama.ico"
echo       - Mod Tetingkap:    Bebas (Standalone Native Windows App)

echo.
echo ======================================================================
echo    TAHNIAH! Pemasangan SmartDash FAMA ke Windows Berjaya!
echo ======================================================================
echo Anda kini boleh melancarkan SmartDash FAMA bila-bila masa:
echo  1. Klik dua kali ikon "SmartDash FAMA" pada Desktop anda, ATAU
echo  2. Cari "SmartDash FAMA" dalam Menu Start Windows anda.
echo.
set /p launchNow="Adakah anda ingin melancarkan SmartDash FAMA sekarang? (Y/N): "
if /i "%launchNow%"=="Y" (
    echo Melancarkan SmartDash FAMA...
    wscript "%~dp0launch-desktop.vbs"
)
exit /b 0
