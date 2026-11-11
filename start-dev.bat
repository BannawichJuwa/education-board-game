@echo off
rem Starts the whole system on this computer:
rem   window 1 - Spring Boot backend  http://localhost:8080  (API + database)
rem   window 2 - React frontend       http://localhost:3000  (open this in the browser)
rem Login and Register need BOTH windows to be running.

cd /d "%~dp0"

where mvn >nul 2>nul || set "PATH=%USERPROFILE%\tools\apache-maven-3.9.9\bin;%PATH%"
where mvn >nul 2>nul || (echo Maven not found. Install Maven or edit the path in start-dev.bat & pause & exit /b 1)
if not exist node_modules (echo Installing frontend packages... & call npm install --legacy-peer-deps)

start "Education Board Game - backend (8080)" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run"
start "Education Board Game - frontend (3000)" cmd /k "cd /d "%~dp0" && npm run dev"

echo Wait until the backend window shows "Started EduboardApplication", then open http://localhost:3000
timeout /t 25 >nul
start http://localhost:3000
