@echo off
rem MYRACLE setup for Windows. Double-click this file. It runs setup.ps1 (which checks
rem for Node.js, installs it if needed, then installs the packages).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
pause
