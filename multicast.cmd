@echo off
Rem this is the cmd file for multicast
Rem need to be adapted depend on the running OS, this one is for Win
Rem will receive these parameters on entry " --ip " + myIP + " --group " + multicastIP + " --port " + uDPPort
Rem which will give " --ip 127.0.0.1 --group 239.0.0.1 --port 19899" for example

if exist "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast\" GOTO :folder

%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast-Windows.exe %1 %2 %3 %4 %5 %6

GOTO :end

:folder

%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast\WLEDAudioSyncMCast-Windows.exe %1 %2 %3 %4 %5 %6 
if exist "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast-Windows.exe " del "%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast-Windows.exe"

GOTO :end

:end

exit