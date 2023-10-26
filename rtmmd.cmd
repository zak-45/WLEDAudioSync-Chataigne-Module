@echo off
Rem this is the cmd file for RTMMD
Rem need to be adapted depend on the running OS, this one is for Win
Rem will receive these parameters on entry  " "+showScreen+" " + verbose  or 'kill' 
Rem which will give " Y Y" for example

if "%1"=="kill" GOTO :kill

start "WLEDAudioSyncRTMood from Chataigne" /HIGH /D "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTMood\" WLEDAudioSyncRTMood-Windows.exe -sc %1 -v %2

:kill 

taskkill /F /FI "WINDOWTITLE eq WLEDAudioSyncRTMood from Chataigne"

:end

exit