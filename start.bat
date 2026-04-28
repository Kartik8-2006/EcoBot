@echo off
echo ========================================
echo        Starting EcoBot Application
echo ========================================

echo.
echo [1/3] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Installing React dependencies...
call npm install

echo.
echo [3/3] Starting Backend + Frontend...
echo.
echo  Backend  --^>  http://localhost:8000
echo  Frontend --^>  http://localhost:3000
echo.

start "EcoBot Backend" cmd /k "uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
start "EcoBot Frontend" cmd /k "npm start"

echo Both servers are starting...
echo Open http://localhost:3000 in your browser.
pause
