# **WLEDAudioSync Module for Chataigne.**
Stream music/audio to WLED Audio reactive. 

Send your music from any computer to WLED sound reactive LED. 
Should Work on any OS where Chataigne run ( Win/Mac/Linux/Pi )

GitHub: https://github.com/benkuper/Chataigne --> min version 1.9.14b11


### ***Installation :***

Manual
```
Take all from this repository and 
Copy  to <MyDocuments>\chataigne\modules\WLEDAudioSync.
```


### ***Use it :***

```
Open  Chataigne.

Go to Modules, right click, Protocol/Community Modules, WLEDAudioSync.
```
![image](https://user-images.githubusercontent.com/121941293/227391581-d8341ed8-aeb0-4507-9ab9-d0bdd89a4c07.png)


```
On Inspector:
  Multicast Mode: need to be checked
  IP Address to bind: select the computer IP address if more than one.
  Send Test Message: if more than one network interface and had trouble to send data to MulticastGroup, click on it to send a test message.
  Audio V1 : V1 message format
  Audio V2 : V2 message format ( to be used mainly )
  Delay : delay in ms before sending audio data
  Volume Multiplier : multiply Chataigne volume audio data before sent
  frequency Magnitude Multiplier : multiply Chataigne FFT Magnitude data before sent
  Take snapshot : This will take audio data snapshot and save them to file. Used by the replay feature.
  Local : send to local IP (127.0.0.1). This will freeze audio data to send.
  Remote Host : MulticastGroup address
  Remote Port : port number to bind

  
```
![image](https://user-images.githubusercontent.com/121941293/227391790-5bddd576-7fdd-440a-b03e-cc8985c81764.png)


```
On Command Tester, Replay / FFT : all WLEDAudioSync available commands
```





### ***Info ***

This module use WLED Audio Sync feature to send data via UDP / Multicast. Message version 1 & 2 are provided.
// On 10/03/2023: Multicast do not work as expected on Chataigne, mainly when more than one network card. Small python utility provided  to bind on UDP port on specified IP address and join the MulticastGroup in case of.


