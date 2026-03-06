@echo off
echo.
echo ========================================
echo    Quick Backend Connection Check
echo ========================================
echo.
echo Testing backend at http://192.168.31.66:8000
echo.

curl -s http://192.168.31.66:8000/health

echo.
echo.
echo If you see JSON with "status":"ok" above, backend is accessible!
echo.
pause
