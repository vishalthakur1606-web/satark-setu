# Satark-Setu Quick Launcher
# This script helps you run the dashboard without Node.js

Write-Host "🚀 Satark-Setu Dashboard Launcher" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    
    Write-Host "`n📡 Starting local server..." -ForegroundColor Yellow
    Write-Host "Dashboard will be available at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Gray
    
    # Start Python server
    python -m http.server 8000
    
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Red
    Write-Host "`nAlternative options:" -ForegroundColor Yellow
    Write-Host "1. Open index.html directly in your browser (double-click)" -ForegroundColor White
    Write-Host "2. Install Python from python.org and run this script again" -ForegroundColor White
    Write-Host "3. Use any other HTTP server (e.g., npx serve if Node.js is installed)" -ForegroundColor White
}
