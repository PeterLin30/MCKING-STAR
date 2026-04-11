@echo off
title MCKING-STAR LAUNCHER
color 0B

echo ===================================================
echo     MENGHIDUPKAN SERVER MCKING-STAR...
echo ===================================================
echo.

:: 1. Menyalakan Backend
echo [1] Menyalakan Backend Server...
start "MCKING-STAR BACKEND" cmd /k "cd C:\Users\ASUS\Documents\mckingstar-PPLT\backend && npx nodemon server.js"

:: 2. Menyalakan Frontend (Asumsi ada di folder 'frontend')
echo [2] Menyalakan Frontend Web...
:: HAPUS tulisan 'frontend' di bawah ini jika React-mu tidak di dalam folder frontend
start "MCKING-STAR FRONTEND" cmd /k "cd C:\Users\ASUS\Documents\mckingstar-PPLT\frontend && npm run dev"

echo.
echo Selesai! Launcher ini akan menutup dalam 3 detik...
timeout /t 3 >nul
exit