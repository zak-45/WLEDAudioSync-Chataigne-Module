@echo off
Rem this is the cmd file for WLEDAudioSync portable version
Rem Windows only

Rem Create necessary working directory (Chataigne.exe will create it anyway)
if not exist %USERPROFILE%\Documents\Chataigne\modules mkdir %USERPROFILE%\Documents\Chataigne\modules
Rem Create necessary working directory 
if not exist %USERPROFILE%\Documents\Chataigne\xtra mkdir %USERPROFILE%\Documents\Chataigne\xtra


rem Move modules to %USERPROFILE%\Documents\Chataigne\modules
if not exist %USERPROFILE%\Documents\Chataigne\modules\WLEDAudioSync move Chataigne\modules\WLEDAudioSync %USERPROFILE%\Documents\Chataigne\modules\WLEDAudioSync

rem Move xtra\WLEDAudioSyncMCast to %USERPROFILE%\Documents\Chataigne\xtra
if not exist %USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast move xtra\WLEDAudioSyncMCast %USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncMCast

rem Move xtra\WLEDAudioSyncRTBeat to USERPROFILE%\Documents\Chataigne\xtra
if not exist %USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTBeat move xtra\WLEDAudioSyncRTBeat %USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTBeat

start "WLEDAudioSync" /B /MIN /D Chataigne  chataigne.exe -f "%cd%\Chataigne\RealTime.noisette"