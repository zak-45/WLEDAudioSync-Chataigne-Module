@echo off
Rem this is the cmd file for RTMMD
Rem need to be adapted depend on the running OS, this one is for Win
Rem will receive these parameters on entry  " "+showScreen+" " + verbose  or 'kill' 
Rem which will give " Y Y" for example

if "%1"=="kill" GOTO :kill

if exist "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTMood\" GOTO :folder

start "WLEDAudioSyncRTMood from Chataigne" /HIGH /D "%USERPROFILE%\Documents\Chataigne\xtra\" WLEDAudioSyncRTMood-Windows.exe -sc %1 -v %2

GOTO :end

:folder

start "WLEDAudioSyncRTMood from Chataigne" /HIGH /D "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTMood\" WLEDAudioSyncRTMood-Windows.exe -sc %1 -v %2

GOTO :end

:kill 

taskkill /F /FI "WINDOWTITLE eq WLEDAudioSyncRTMood from Chataigne"

:end

exit