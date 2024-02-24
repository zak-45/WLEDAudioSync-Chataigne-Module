[![image](https://user-images.githubusercontent.com/121941293/283798323-94bb9a2c-65b0-4d98-a483-e49d4d9b0eb1.png)](http://benjamin.kuperberg.fr/chataigne/en) **+** ![image](https://user-images.githubusercontent.com/121941293/227901678-8f3d1f7c-ae1d-4b85-8199-5b763ec91a5b.png) **=**
# **WLEDAudioSync Module for Chataigne.**

## Stream music/audio datas to WLED Audio reactive.

**Real time audio analysis** : the real time audio datas are not supposed to be fully accurate for scientific works but enough for light show creation.
See : https://youtu.be/YtS6dwke0LE

**Real Time Beat/ BPM** sent to OSC

**Real Time Music Genre Classification** sent to OSC : get real-time music genre predictions based on the analysed audio stream.

**Real Time Music Mood Detection** sent to OSC: set Colors based on the music mood.

_Should work on any OS where Chataigne is running._

***This can be used with or without WLED device***
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

- Message version 1 (V1) and version 2 (V2) included, so can stream even to ESP8266 

- Real time FFT Analysis fully customisable by GUI
  this provide different way for effects customisation.

- Real time pitch detection : freq / pitch / note / octave
  thanks to Chataigne...

- Real Time audio analysis :
  thanks to https://friture.org/

- Real Time Beat and BPM  send data via OSC
  thanks to https://github.com/DrLuke/aubio-beat-osc

- Real Time Music Genre Classification send data via OSC  
  thanks to Essentia.js https://mtg.github.io/essentia.js/

- Real Time Music Mood Detection send data via OSC
  thanks to : https://github.com/tyiannak/color_your_music_mood

```

For Chataigne : http://benjamin.kuperberg.fr/chataigne/en#download --> min version 1.9.17b10

For beat / BPM see : https://github.com/zak-45/WLEDAudioSyncRTBeat

For Friture see : https://friture.org/

For RMTGC see: https://github.com/zak-45/WLEDAudioSyncRTMGC

For RTMMD see: https://github.com/zak-45/WLEDAudioSyncRTMood

---

## ***Installation :***

### Manual (any OS)
```
Take all from this repository and 
Copy  to <MyDocuments>\chataigne\modules\WLEDAudioSync.

This is enough if you want to use WLED audio sync only.
```

_Options_
```
You will need additional step for beat / BPM / RTMGC or RTMMD if you want to use these features.
       For BPM, you can download binary from https://github.com/zak-45/WLEDAudioSyncRTBeat
       For RTMGC, you can download binary from https://github.com/zak-45/WLEDAudioSyncRTMGC
       For RTMMD, you can download binary from https://github.com/zak-45/WLEDAudioSyncRTMood
       To use integrated tools (not mandatory), you need to customize :
       rtmmd.cmd, rtmgc.cmd, aubio.cmd, friture.cmd, multicast.cmd

```

### For Windows

Download release : [Windows Installer](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/releases)

You have two options :


-1- **WLEDAudioSync.exe** provide full installation, options :

```
This will install chataigne module / and optionally : Chataigne  && all portable apps e.g. Friture / WrtmgcSRV ...

Nota : Provide portable Nodejs with WrtmgcSRV.js preconfigured (optional but recommanded to use RTMGC).
```

-2- **WLEDAudioSync-Portable.zip** is a 'portable' version :

If you want only to use the WLED audio sync feature in a easy way, this one is for you.

```
Just unzip it and execute WLEDAudioSync.cmd.
This will do all necessaries steps to have a running Chataigne with Beat detection.
--- Check "%USERPROFILE%\Documents\Chataigne" folder
```
---


## ***Use it (Win 'portable' version):***

Open folder with unzipped files and click on **WLEDAudioSync.cmd**


![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/0b7d3499-e97e-4347-a609-2158119f9793)


You will be able to found the running program under 'hidden icons':

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/fcf70fbb-6c32-46d4-a624-0bed09f3b155)

if you "left - click" on it, this will open the main interface. ("right - click" is for EXIT)

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/4035170d-7c2f-4c64-b57b-9441dfa07a84)


From there, you will be able to modify settings /parameters. This should be necessary only the first time to put your audio parameters if default one not work. 

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/41fbfb01-15e7-46df-8690-8de416b73f86)

Once done, click on save and close Chataigne with the 'cross'

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/d9dbde16-de6e-4f54-a096-bdff43fe6d47)



After, you can access the main features from any web browser, this mean even from your phone / tablet, by entering the IP address of your running PC and port number '9998' e.g. http://192.168.x.y:9998

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/6ae987e5-57ea-46f0-bb1d-d0c544e27d99)


## ***Use it (full options):***

```
Open  Chataigne.

Go to Modules, right click, Protocol/Community Modules, WLEDAudioSync.
```
![image](https://user-images.githubusercontent.com/121941293/227391581-d8341ed8-aeb0-4507-9ab9-d0bdd89a4c07.png)

Initial settings with WLED : https://youtu.be/5Y2O9qGDVE0

```
On Inspector:

  Multicast Mode: need to be checked
  IP Address to bind: select the computer IP address if more than one.
  Send Test Message: if more than one network interface and had trouble to send data to MulticastGroup, click on it to send a test message.
  Live : use real time audio data, uncheck when want to use the replay feature.
  Visualize live audio : run Friture, live audio analyzer.
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
  Force reload : kill (if running) and create a new WLEDAudioSyncRTBeat process.
  
  Use RTMGC : this will execute the Nodejs server and launch chrome
  Server Port : port number for the Nodejs server , default to 8000
  Script file: script file name for OSC module
    use OSCRTMGC.js under modules folder.
  
  Update Rate : frequence to send audio data message to WLED (fps)
    set rate from 1 fps to 1000 (for test stress: dangerous), 50 is recommended.
  
```
![image](https://user-images.githubusercontent.com/121941293/227391790-5bddd576-7fdd-440a-b03e-cc8985c81764.png)

![image](https://user-images.githubusercontent.com/121941293/230686974-c077ef89-51f3-4a71-a101-e385d02b8aa6.png)

![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/d651b923-8cc5-4abf-b7c6-a8beecbadded)

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


Audio Configuration:

Linux : https://wiki.ubuntu.com/record_system_sound

Mac : https://github.com/ExistentialAudio/BlackHole

Win : https://thegeekpage.com/stereo-mix/

For audio control, Voicemeeter is one of the best tools : https://voicemeeter.com/

https://user-images.githubusercontent.com/121941293/227597492-aff9c8a6-5314-4f5f-9825-353296f6ff28.mp4


---

---


Real Time audio analysis: all values you see there can be used by State Machine or others and by scripts.


https://user-images.githubusercontent.com/121941293/230689672-cc5d42c5-c94b-488a-aab2-aea43275ef82.mp4


RTMGC : real time music genre detection. Detected music genre is sent to Chataigne via OSC.



https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/958e140b-c4e1-4627-93b5-a1b53836775c

---

LedFx demo

Click here : https://youtu.be/yu8QgQlLT5g

[![image](https://github.com/zak-45/WLEDAudioSync-Chataigne-Module/assets/121941293/19165bed-26b6-47a9-99d7-b0846780ff2c)](https://youtu.be/yu8QgQlLT5g)


---


## ***Info ***

This module use WLED Audio Sync feature to send data via UDP / Multicast. Message version 1 & 2 are provided.
// On 10/03/2023: Multicast do not work as expected on Chataigne, mainly when more than one network card. Small python utility provided  to bind on UDP port on specified IP address and join the MulticastGroup in case of.
See : https://github.com/zak-45/WLEDAudioSyncMCast

On 26/03/2023:
for ESP8266, old SR WLED fw version required : 0.13.0b3 https://wled-install.github.io/.
Port to the 0.14.xx version is on TO DO list...


