@echo off
title FAMA e-Surat & Arahan DG Platform
echo ======================================================================
echo    LEMBAGA PEMASARAN PERTANIAN PERSEKUTUAN (FAMA)
echo    FAMA e-Surat & Arahan DG - Correspondence & Task Tracking Platform
echo ======================================================================
echo.
echo Memulakan Pelayan Tempatan Node.js (Port 9091)...
start "" http://localhost:9091
node server.js
pause
