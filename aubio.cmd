@echo off
Rem this is the cmd file for aubio-beat-osc
Rem need to be adapted depend on the running OS, this one is for Win
Rem will receive these parameters on entry 	" beat -c " + OSCIP + " " + root.modules.osc.parameters.oscInput.localPort.get() + ' "/WLEDAudioSync/beat/BPM"' + 
Rem							" -d " + aubioDevices[i].value +
Rem							" -b " + aubioBuffer;
Rem which will give " beat -c 127.0.0.1 12000 /WLEDAudioSync/beat/BPM -d 1 -b 128" for example


"%USERPROFILE%\Documents\Chataigne\xtra\WLEDAudioSyncRTBeat-Windows.exe" %1 %2 %3 %4 %5 %6 %7 %8 %9

