@echo off
setlocal
echo ==========================================
echo       Moodify - Professional Setup
echo ==========================================
echo 1. Checking dependencies...
python -m pip install -r backend/requirements.txt --quiet

echo 2. Starting Moodify Backend...
:: Start Backend in a new window
start "Moodify Backend" cmd /k "cd backend && python app.py"

echo 3. Waiting for server to initialize...
timeout /t 3 /nobreak > nul

echo 4. Opening Frontend in your browser...
start "" "http://localhost:5000"

echo.
echo Setup Complete! 
echo If the browser didn't open automatically, please visit http://localhost:5000
echo ==========================================
exit
