@echo off
Rem this is the cmd file for WrtmgcSRV
Rem need to be adapted depend on the running OS, this one is for Win
Rem 3 optionals params: 1 for server PORT, 2 for OSC server ip address, 3 for OSC server port

if "%1"=="kill" GOTO :kill

set SRVPORT=%1
set OSCADDR=%2
set OSCPORT=%3

set NODE_ENV=production
start "Node JS server for RTMGC" /MIN /D "%USERPROFILE%\Documents\Chataigne\xtra\" WrtmgcSRV-win.exe /B /I

IF "%~1" == "" set SRVPORT=8000
start chrome "https://localhost:%SRVPORT%/WLEDAudioSyncRTMGC/"

GOTO end

:kill

taskkill /F /FI "WINDOWTITLE eq Node JS server for RTMGC"

:end
exit
