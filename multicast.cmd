@echo off
Rem this is the cmd file for multicast
Rem need to be adapted depend on the running OS, this one is for Win
Rem will receive these parameters on entry " --ip " + myIP + " --group " + multicastIP + " --port " + uDPPort
Rem which will give " --ip 127.0.0.1 --group 239.0.0.1 --port 19899" for example


"%USERPROFILE%\Documents\Chataigne\Python\WPy64-39100\python-3.9.10.amd64\python.exe" "%USERPROFILE%\Documents\Chataigne\modules\WLEDAudioSync\multicast_msg.py" %1 %2 %3 %4 %5 %6