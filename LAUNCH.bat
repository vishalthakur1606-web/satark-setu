@echo off
echo.
echo ========================================
echo   Satark-Setu Dashboard Launcher
echo ========================================
echo.
echo Opening dashboard in your default browser...
echo.
echo Dashboard Features:
echo - Live weather from Open-Meteo API
echo - Official Twitter feeds embedded
echo - Automated news aggregation
echo - 5 Maharashtra cities supported
echo.
echo Press Ctrl+C to close this window after viewing
echo.

start "" "%~dp0index.html"

echo Dashboard opened successfully!
echo.
timeout /t 3 /nobreak >nul
