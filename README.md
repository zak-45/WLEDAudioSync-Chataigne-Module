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

https://user-images.githubusercontent.com/121941293/227597492-aff9c8a6-5314-4f5f-9825-353296f6ff28.mp4


---


### ***Info ***

This module use WLED Audio Sync feature to send data via UDP / Multicast. Message version 1 & 2 are provided.
// On 10/03/2023: Multicast do not work as expected on Chataigne, mainly when more than one network card. Small python utility provided  to bind on UDP port on specified IP address and join the MulticastGroup in case of.


