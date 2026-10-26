@echo off
title Membina Pemasang Windows SmartDash FAMA

echo ======================================================================
echo    LEMBAGA PEMASARAN PERTANIAN PERSEKUTUAN (FAMA)
echo    Kompilasi Pemasang Asli Windows (Setup-SmartDash-FAMA.exe)
echo ======================================================================
echo.

set CSC_EXE=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC_EXE%" set CSC_EXE=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe

if not exist "%CSC_EXE%" (
    echo [RALAT] Pengkompil C# csc.exe tidak dijumpai dalam Windows.
    exit /b 1
)

echo Menggunakan pengkompil: %CSC_EXE%
echo.

echo Mengkompilasi Pemasang Asli: Setup-SmartDash-FAMA.exe...
"%CSC_EXE%" /nologo /target:winexe /win32icon:"%~dp0icons\fama.ico" /out:"%~dp0Setup-SmartDash-FAMA.exe" "%~dp0src-installer\SetupWizard.cs"
if %errorlevel% neq 0 (
    echo [RALAT] Gagal mengkompilasi Setup-SmartDash-FAMA.exe
    exit /b 1
)

echo.
echo ======================================================================
echo    PEMASANG WINDOWS BERJAYA DIHASILKAN!
echo ======================================================================
echo.
echo Fail Pemasang Rasmi:
echo   %~dp0Setup-SmartDash-FAMA.exe
echo.
exit /b 0
