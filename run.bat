@echo off
echo Starting Moodify...

:: Start Backend in a new window
start cmd /k "cd backend && python app.py"

:: Wait a moment for server to initialize
timeout /t 2 /nobreak > nul

:: Open Frontend in default browser
start "" "frontend/index.html"

echo Backend started in new window and Frontend opened in browser.
exit
