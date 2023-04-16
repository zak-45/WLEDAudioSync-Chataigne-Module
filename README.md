![image](https://user-images.githubusercontent.com/121941293/227901678-8f3d1f7c-ae1d-4b85-8199-5b763ec91a5b.png)
# **WLEDAudioSync Module for Chataigne.**
Stream music/audio to WLED Audio reactive.

Real time audio analysis : the real time audio datas are not supposed to be fully accurate but enough for light show creation.

```
- Send your music from any computer to WLED sound reactive LED.

- Should Work on any OS where Chataigne run ( Win/Mac/Linux/Pi ). 

- You only need to have WLED Sound Reactive version installed. 
  No Hardware( micro: analog or digital) required. 

- Use UDP Multicast, so your LED strip can be anywhere.
  adjustable rate let you choose between bandwidth / reactivity

- Send different message version, to different UDP port with different settings at same time
  thanks to Chataigne's Multiple Instances feature. 
  
- Capture audio datas ( snapshot ) and replay them ( replay ). 

- All WLED Sound Reactive effects supported: volume based or FFT based.

- Real time FFT Analysis fully customisable by GUI
  this provide different way for effects customisation.
  
- Real Time Beat and BPM  via OSC
  thanks to https://github.com/DrLuke/aubio-beat-osc
  
- Real time pitch detection : freq / pitch / note / octave
  thanks to Chataigne...

- Message version 1 (V1) and version 2 (V2) included, so can stream even to ESP8266 

```

GitHub: https://github.com/benkuper/Chataigne --> min version 1.9.14b11

For beat / BPM see : https://github.com/DrLuke/aubio-beat-osc

### ***Installation :***

Manual
```
Take all from this repository and 
Copy  to <MyDocuments>\chataigne\modules\WLEDAudioSync.

Nota:
You will need additional step for beat / BPM if you want to use this feature. 
```

For Windows

Download : https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/releases/download/1.0/WLEDAudioSync.exe
```
This will install Chataigne / python module / chataigne module.

Nota : If Chataigne already installed, you can abort its installation. 
       Python need to be installed with pip (required only if want BPM).

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
  Live : use real time audio data, uncheck when want to use the replay feature.
  Audio V1 : V1 message format
  Audio V2 : V2 message format ( to be used mainly )
  Delay : delay in ms before sending audio data. audio data during delay are lost.
  Volume Multiplier : multiply Chataigne volume audio data before sent
  Frequency Magnitude Multiplier : multiply Chataigne FFT Magnitude data before sent
  Take snapshot : This will take audio datas snapshot and save them to file. Used by the replay feature.
  
  Local : send to local IP (127.0.0.1). This will freeze audio data to send.
  Remote Host : MulticastGroup address
  Remote Port : port number to bind
  
  Use BPM : will create corresponding process for Beat via OSC
    if unchecked and aubio-beat-osc process is running, this will kill it.
  Input audio : audio devices detected by aubio-beat-osc list command 
    the one selected will be used when 'Force reload' clicked.
  Script file : script file name for OSC module
    use OSCBPM.js under modules folder.
  Force reload : kill (if running) and create a new aubio-beat-osc process.
  
  Update Rate : frequence to send audio data message to WLED (fps)
    set rate from 1 fps to 1000 (for test stress: dangerous), 50 is recommended.
  
```
![image](https://user-images.githubusercontent.com/121941293/227391790-5bddd576-7fdd-440a-b03e-cc8985c81764.png)

![image](https://user-images.githubusercontent.com/121941293/230686974-c077ef89-51f3-4a71-a101-e385d02b8aa6.png)

```
On Command Tester, Replay / FFT : all WLEDAudioSync available commands

    Replay / Snapshot : provide you the possibility to 'replay' audio data from snapshot with defined duration (max 1500 ms).
        The snapshot is not limited to the played effect, you can change settings and/or effect.
```
![image](https://user-images.githubusercontent.com/121941293/227524093-53dd4caa-0807-4d2f-a673-2ba36b40c21a.png)

![image](https://user-images.githubusercontent.com/121941293/227524612-29fdfaf6-22f0-438d-9aab-433358002675.png)


```
   FFT / WLED : got two choices on how FFT data will be captured. OLD or NEW. 
      / Custom : custom FFT data analysis capture with variable size.
```

![image](https://user-images.githubusercontent.com/121941293/227527086-6d9b9d29-70e2-40ea-8e87-e5b547255a27.png)

![image](https://user-images.githubusercontent.com/121941293/227527270-46aeb219-3c6f-49b4-a337-e613d9f8b410.png)



---

   Let see that on the FFT Analysis Chataigne sound card Module. You can even do any modification you like afterward.   

NEW
![image](https://user-images.githubusercontent.com/121941293/227527762-76316aa2-4284-4c68-b6c2-b217abacf5fe.png)

OLD
![image](https://user-images.githubusercontent.com/121941293/227594966-2d4ab958-761b-42dd-820a-dc676cb6c2b3.png)

Custom / size 0.10
![image](https://user-images.githubusercontent.com/121941293/227595263-a79bf314-5c95-4ee0-90d1-04d3bd7d3b1c.png)


---


Audio Configuration (Win)

For audio control, Voicemeeter is one of the best tools : https://voicemeeter.com/

https://user-images.githubusercontent.com/121941293/227597492-aff9c8a6-5314-4f5f-9825-353296f6ff28.mp4


---

---


Real Time audio analysis


https://user-images.githubusercontent.com/121941293/230689672-cc5d42c5-c94b-488a-aab2-aea43275ef82.mp4


---


### ***Info ***

This module use WLED Audio Sync feature to send data via UDP / Multicast. Message version 1 & 2 are provided.
// On 10/03/2023: Multicast do not work as expected on Chataigne, mainly when more than one network card. Small python utility provided  to bind on UDP port on specified IP address and join the MulticastGroup in case of.

On 26/03/2023:
for ESP8266, old SR WLED fw version required : 0.13.03b3 https://wled-install.github.io/.
Port to the 0.14.xx version is on TO DO list...


