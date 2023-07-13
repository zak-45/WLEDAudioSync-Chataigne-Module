/* 

a:zak45
d:25/01/2023
v:1.1.0

Chataigne Module for  WLED Sound Reactive
Send sound card audio data via UDP.
This script will take Audio data provided by Chataigne and try to map them to WLED values.
It also provide some real time sound data analysis (e.g Pitch, FFT, BPM, etc..).


    Classical (Classique) : 60-120 BPM
    Jazz : 80-140 BPM
    Blues : 60-120 BPM
    Rock : 100-160 BPM
    Pop : 90-130 BPM
    R&B : 60-100 BPM
    Hip Hop : 60-100 BPM
    Electronic (EDM, Trance, House) : 120-140 BPM (varie selon les sous-genres)
    Country : 60-120 BPM
    Reggae : 70-100 BPM
    Funk : 90-120 BPM
    Metal : 100-200 BPM (varie selon les sous-genres)
    Punk : 150-200 BPM
    Salsa : 150-250 BPM
    Ballad : 60-80 BPM



 Names of frequency responses
	20 - 40 Hz			Low Bass
	40 - 80 Hz			Mid Bass
	80 - 160 Hz			Upper Bass
	160 - 320 Hz		Lower Midrange
	320 - 640 Hz		Middle Midrange
	640 Hz - 1.28 кHz	Upper Midrange
	1.28 - 2.56 кHz		Lower Treble
	2.56 - 5.12 кHz		Middele Treble
	5.12 - 10.2 кHz		Upper Treble
	10.2 - 20.4 кHz		Top Octave

The UDP  Multicast  IP is 239.0.0.1, and the default UDP port is 11988.

// From WLED Infos
UDP port can be changed in WLED config pages, for example to have several groups of devices by assigning different UDP ports to each group.
the software sends/receives one packet every 20 milliseconds (approx). An external sender may be slower, but not faster than 20ms = 50fps
//

-------------------------------------- BIN -----------------  
  
  //                                               Range
      fftCalc[0] = (fftAdd(3,4)) /2;        // 60 - 100
      fftCalc[1] = (fftAdd(4,5)) /2;        // 80 - 120
      fftCalc[2] = (fftAdd(5,7)) /3;        // 100 - 160
      fftCalc[3] = (fftAdd(7,9)) /3;        // 140 - 200
      fftCalc[4] = (fftAdd(9,12)) /4;       // 180 - 260
      fftCalc[5] = (fftAdd(12,16)) /5;      // 240 - 340
      fftCalc[6] = (fftAdd(16,21)) /6;      // 320 - 440
      fftCalc[7] = (fftAdd(21,28)) /8;      // 420 - 600
      fftCalc[8] = (fftAdd(28,37)) /10;     // 580 - 760
      fftCalc[9] = (fftAdd(37,48)) /12;     // 740 - 980
      fftCalc[10] = (fftAdd(48,64)) /17;    // 960 - 1300
      fftCalc[11] = (fftAdd(64,84)) /21;    // 1280 - 1700
      fftCalc[12] = (fftAdd(84,111)) /28;   // 1680 - 2240
      fftCalc[13] = (fftAdd(111,147)) /37;  // 2220 - 2960
      fftCalc[14] = (fftAdd(147,194)) /48;  // 2940 - 3900
      fftCalc[15] = (fftAdd(194, 255)) /62; // 3880 - 5120  // avoid the last 5 bins, which are usually inaccurate
  //
  
      fftCalc[ 0] = fftAddAvg(1,2);               // 1    43 - 86   sub-bass
      fftCalc[ 1] = fftAddAvg(2,3);               // 1    86 - 129  bass
      fftCalc[ 2] = fftAddAvg(3,5);               // 2   129 - 216  bass
      fftCalc[ 3] = fftAddAvg(5,7);               // 2   216 - 301  bass + midrange    
  
      fftCalc[ 4] = fftAddAvg(7,10);                // 3   301 - 430  midrange
      fftCalc[ 5] = fftAddAvg(10,13);               // 3   430 - 560  midrange
      fftCalc[ 6] = fftAddAvg(13,19);               // 5   560 - 818  midrange
      fftCalc[ 7] = fftAddAvg(19,26);               // 7   818 - 1120 midrange -- 1Khz should always be the center !
      fftCalc[ 8] = fftAddAvg(26,33);               // 7  1120 - 1421 midrange
      fftCalc[ 9] = fftAddAvg(33,44);               // 9  1421 - 1895 midrange
      fftCalc[10] = fftAddAvg(44,56);               // 12 1895 - 2412 midrange + high mid
      fftCalc[11] = fftAddAvg(56,70);               // 14 2412 - 3015 high mid
      fftCalc[12] = fftAddAvg(70,86);               // 16 3015 - 3704 high mid
      fftCalc[13] = fftAddAvg(86,104);              // 18 3704 - 4479 high mid
      fftCalc[14] = fftAddAvg(104,165) * 0.88f;     // 61 4479 - 7106 high mid + high  -- with slight damping
		// don't use the last bins from 216 to 255. They are usually contaminated by aliasing (aka noise) 
	  fftCalc[15] = fftAddAvg(165,215) * 0.70f;   // 50 7106 - 9259 high             -- with some damping	  
  
  
*/

// sound Card
var SCexist = false;

// os
var OSmodule = null;

// osc
var OSCModule = null;
var OSCIP = "127.0.0.1";

// TMPDIR
var tempDIR = "";

//HOME Location
//%USERPROFILE% for WIN and $HOME for others
var homeDIR = "";
var winHOME = "";

// Volume
var wledVol = 0;
// Volume Multiplier
var volMultiplier = 1024;

// Global FFT Multiplier
var fftMultiplier = 254;
// FFT Data
var FFTWLED = [];
// FFT Max Freq / Magnitude
var fftSoundMaxFreqMagnitude = 0;
var fftSoundMaxFreqIndex = 0;
// FFT Mode
var fftMode = "";
//minAudio/max DB
var minDB = -50;
var maxDB = 0;
// Frequence table
var FREQTABLE = [];

// samplePeak
var wledPeak = 0;

// Wled Freq/Mag
var wledFreq = 0;
var wledMag = 0;

// UDP
var multicastIP = "239.0.0.1";
var	uDPPort = 11988;
var myIP = "127.0.0.1";

// Init Flag
// to made some logic only once at init
var isInit = true;

// snapshot
var snapshot = false;

//replay 
var replay = false;
var duration = 0;
var previousFile = "";
var SOUNDDATA = [];

// UDP Data
var  UDP_AUDIO_SYNC = [];
var  UDP_AUDIO_SYNC_V2 = [];

// BPM
var aubioCmdName = "aubio.cmd";
var aubioProcName = "aubio-beat-osc";
var aubioBuffer = 128;
// Friture
var fritureCmdName = "friture.cmd";
// RTMGC
var rtmgcCmdName = "rtmgc.cmd";
var rtmgcProcName = "WrtmgcSRV";
// multicast
var multicastCmdName = "multicast.cmd";
// python
var wpythonPath = "";
// module
var moduleDIR = "/Chataigne/modules/WLEDAudioSync/";

var options = "";

// SCAnalyzer test
var SCAModule = false;

//We create necessary entries in module.
function init ()
{
	script.log("-- Custom command called init()");	
	
	var UDPexist = root.modules.getItemWithName("WLEDAudioSync");
	var SCtest = root.modules.getItemWithName("Sound Card");
	OSmodule = root.modules.getItemWithName("OS");
	OSCModule = root.modules.getItemWithName("OSC");
	SCAModule = root.modules.getItemWithName("SCAnalyzer");	
	
	if (SCtest.name == "soundCard")
	{	
		script.log("Sound Card present");
		SCexist = true;
		
	} else {
			
		script.log("No Sound Card present");
		var newSCModule = root.modules.addItem("Sound Card");
		util.delayThreadMS(100);
		if (newSCModule.name != "undefined")
		{
			SCexist = true;
			
		} else {
			
			SCexist = false;
		}
	}

	if (OSmodule.name == "os")
	{
		script.log("Module OS exist");
		
	} else {
			
		OSModule = root.modules.addItem("OS");
		util.delayThreadMS(100);
			
	}

	if (OSCModule.name == "osc")
	{
		script.log("Module OSC exist");
		
	} else {
			
		script.log("Module OSC do not exist");
			
	}

	if (SCAModule.name != "undefined")
	{
		script.log("Module SCAnalyzer exist");
		
	} else {
			
		script.log("Module SCAnalyzer does not exist");
			
	}	

	local.scripts.wLEDAudioSync.updateRate.setAttribute("readOnly",false);
	root.modules.soundCard.parameters.pitchDetectionMethod.set("YIN");

	var infos = util.getOSInfos(); 
	script.log("Hello "+infos.username);	
	script.log("We run under : "+infos.name);
	
	if ( infos.name.contains("Win") )
	{
		homeDIR = util.getEnvironmentVariable("USERPROFILE") + "/Documents";
		winHOME = util.getEnvironmentVariable("USERPROFILE");
		if (util.directoryExists(homeDIR + "/Chataigne/Python/WPy64-39100/python-3.9.10.amd64/"))
		{
			// set win exe path to python portable
			wpythonPath = homeDIR + "/Chataigne/Python/WPy64-39100/python-3.9.10.amd64";
		}
		
	} else {
		
		homeDIR = util.getEnvironmentVariable("$HOME");
	}
	
	script.setUpdateRate(50);
	
}

// execution depend on the user response
function messageBoxCallback (id, result)
{
	script.log("Message box callback : "+id+" : "+result); 
	
}

function moduleParameterChanged (param)
{	
	script.log("Param changed : "+param.name);
	
	if (param.name == "volumeMultiplier")
	{
		volMultiplier = local.parameters.volumeMultiplier.get();
		
	} else if (param.name == "frequencyMagnitudeMultiplier"){
		
		fftMultiplier = local.parameters.frequencyMagnitudeMultiplier.get();
		
	} else if (param.name == "remoteHost"){
		
		multicastIP = local.parameters.output.remoteHost.get();
		
	} else if (param.name == "remotePort"){
		
		uDPPort = local.parameters.output.remotePort.get();
		
	} else if  (param.name == "ipAddressToBind"){
		
		myIP = local.parameters.ipAddressToBind.get();
		
	} else if (param.name == "sendTestMessage"){
		
		testMultiCast();
		
	} else if (param.name == "local"){
		
		if (local.parameters.output.local.get() == 1){
			
			multicastIP = "127.0.0.1";
			
		} else {
			
			multicastIP = local.parameters.output.remoteHost.get();
			
		}
		
	} else if (param.name == "takeSnapshot"){
		
		snapshot = true;
	
	} else if (param.name == "useBPM"){
		

		var checkProcess = root.modules.os.getRunningProcesses("*");
		var aubioIsRunning = false;
		var aubioProcessName = "";
		
		for ( var i = 0; i < checkProcess.length; i ++)
		{
			if (checkProcess[i].contains(aubioProcName))
			{
				aubioIsRunning = true;
				aubioProcessName = checkProcess[i];
				script.log("aubio is running");
				break;
			}				
		}

		addOSCScript("OSCBPM");
		
		if (local.parameters.beatParams.useBPM.get() == 1)
		{
			// find aubio devices list
			aubioDevicesList();
				
			script.log("run aubio");
			
			// find sound card input audio
			var scInput = audioFindInput();
			if (scInput == "")
			{
				script.log("Input device not defined in Sound card module");
				util.showMessageBox("WLEDAudioSync ! ", "Input device not defined in Sound card module", "info", "Got it");
				local.parameters.beatParams.useBPM.set(0); 
				
			} else {
				
				script.log("Sound card input device : " + scInput);
				var aubioDevices = local.parameters.beatParams.inputAudio.getAllOptions();
				
				for ( var i = 0; i < aubioDevices.length; i++)
				{
					if (scInput.contains(aubioDevices[i].key.substring(4,(aubioDevices[i].key.length)-1)))
					{
						script.log("Aubio device number : " + aubioDevices[i].value);
						break;
					}
				}
				
				if (aubioIsRunning === false)
				{
					options = 	" beat -c " + OSCIP + " " + root.modules.osc.parameters.oscInput.localPort.get() + ' "/WLEDAudioSync/beat/BPM"' + 
								" -d " + aubioDevices[i].value +
								" -b " + aubioBuffer;
					var command = homeDIR + moduleDIR + aubioCmdName + options;
					script.log("command to run : " + command);
					root.modules.os.launchCommand(command, true);
					
				} else {
					
					script.log("aubio is already running");
				}
			}
			
		} else {
			
			if (aubioIsRunning === true)
			{
				script.log("killing aubio : " + aubioProcessName);
				var killCmd = root.modules.os.commandTester.setCommand("OS","Process","Kill App");		
				killCmd.target.set(aubioProcessName);
				killCmd.hardKill.set(1);
				root.modules.os.commandTester.trigger.trigger();
				
			} else {
				
				script.log("nothing to kill");
			}		
		}
		
	} else if (param.name == "forceReload"){

		var checkProcess = root.modules.os.getRunningProcesses("*");
		var aubioProcessName = "";
		
		addOSCScript("OSCBPM");
		
		for ( var i = 0; i < checkProcess.length; i ++)
		{
			if (checkProcess[i].contains(aubioProcName))
			{
				aubioProcessName = checkProcess[i];
				script.log("aubio is running");
				script.log("killing aubio : " + aubioProcessName);
				var killCmd = root.modules.os.commandTester.setCommand("OS","Process","Kill App");		
				killCmd.target.set(aubioProcessName);
				killCmd.hardKill.set(1);
				root.modules.os.commandTester.trigger.trigger();				
				break;
			}				
		}
		
		util.delayThreadMS(200);
		
		options = 	" beat -c " + OSCIP + " " + root.modules.osc.parameters.oscInput.localPort.get() + ' "/WLEDAudioSync/beat/BPM"' + 
					" -d " + local.parameters.beatParams.inputAudio.get() +
					" -b " + aubioBuffer;
		var command = homeDIR + moduleDIR + aubioCmdName + options;
		script.log("command to run : " + command);		
		root.modules.os.launchCommand(command, true);	

	} else if (param.name == "live") {
		
		// find sound card input audio
		var scInput = audioFindInput();
		if (scInput == "")
		{
			script.log("Input device not defined in Sound card module");
			util.showMessageBox("WLEDAudioSync ! ", "Input device not defined in Sound card module", "info", "Got it");
			
		}
		
	} else if (param.name == "visualizeLiveAudio") {
		
		//execute Friture
		var exeCMD = homeDIR + moduleDIR + fritureCmdName;
		if (util.fileExists(exeCMD)){
			var launchresult = root.modules.os.launchProcess(exeCMD, false);
		} else {
			util.showMessageBox("Friture not found ", "file name : " + exeCMD , "warning", "Ok");			
		}		
		
	} else if (param.name == "useRTMGC") {
	
		if ( local.parameters.rtmgcParams.useRTMGC.get() == 1) 
		{
			var checkProcess = root.modules.os.getRunningProcesses("*");
			var rtmgcRun = false;
			
			for ( var i = 0; i < checkProcess.length; i ++)
			{
				if (checkProcess[i].contains(rtmgcProcName))
				{
					script.log("RTMGC is already running");
					var rtmgcRun = true;
					break;
					
				}
			}
			
			if (rtmgcRun === false) 
			{
				addOSCScript("OSCRTMGC");				
				var oscPort = OSCModule.parameters.oscInput.localPort.get();
				options = " " + local.parameters.rtmgcParams.serverPort.get() + " " + OSCIP + " " + oscPort;
				var command = homeDIR + moduleDIR + rtmgcCmdName + options;
				script.log("command to run : " + command);
				if (util.fileExists(homeDIR + moduleDIR + rtmgcCmdName)){
					root.modules.os.launchProcess(command, false);
				} else {
					script.log('Command file do not exist : ' + homeDIR + moduleDIR + rtmgcCmdName);
				}
			}
		}
	}
}

function moduleValueChanged (value) 
{	
	//script.log("Module value changed : "+value.get());
	
}


// update rate (no more than 50fps)
function update ()
{
	// Initialize only once some Params when script run
	if (isInit === true)
	{
		script.log('Initialize');
		
		// retreive all IPs
		var ips = util.getIPs();
		local.parameters.ipAddressToBind.removeOptions();
		
		for( var i=0; i<ips.length; i +=1 ) 
		{ 
			local.parameters.ipAddressToBind.addOption(ips[i],i);
		}		
		
		local.parameters.ipAddressToBind.set(root.modules.os.values.networkInfos.ip.get());
		multicastIP = local.parameters.output.remoteHost.get();;
		uDPPort = local.parameters.output.remotePort.get();
		myIP = local.parameters.ipAddressToBind.get();
		
		testMultiCast();
		
		// if no FFT then create FFT : new
		var testFFT = root.modules.soundCard.parameters.fftAnalysis.getItemWithName("Analyzer 1");
		if (testFFT.name != "undefined") 
		{
			script.log("FFT already there !!");
			
		} else {
			
			createWLEDFFT(false);
			root.modules.soundCard.parameters.fftAnalysis.enabled.set(1);
			
		}
		
		// Remove read only from rate
		local.scripts.wLEDAudioSync.updateRate.setAttribute("readOnly",false);
		
		// add WLEDAudioSync to SCAnalyzer options
		if (SCAModule.name != "undefined")
		{
			SCAModule.parameters.wLEDAudioSyncParams.moduleName.addOption(local.name, local.name);	
			// workaround to avoid Chataigne crash
			//root.modules.sCAnalyzer.scripts.sCAnalyzer.reload.trigger();
			var mycontainer = SCAModule.parameters.getChild("WLEDAudioSync Params");
			mycontainer.setCollapsed(false);			
		}		
		
		// end
		isInit = false;
	}
	
	// Send audio data
	if (SCexist && root.modules.soundCard.values.volume.get()!= 0 && replay === false && local.parameters.live.get() == 1)
	{
		sendAudio(false);
		
	} else if (replay === true){
		
		if ( duration > 0 )
		{
			sendAudio(true);
			
		} else {

			replay = false;
			
			util.delayThreadMS(30);	
			for ( var k = 0; k < 10; k += 1 )
			{
				sendAudio(false);	
			}
			
			script.setUpdateRate(50);
		}
	}
}

// send audio data with optional delay
function sendAudio(replay)
{
	// translate audio data to UDP message
	var udpdataV1 = udpAudioSyncV1(replay);
	
	if (replay)
	{
		duration -= 100;
	}
	
	// optional delay: audio datas during the delay are lost 
	var mydelay = local.parameters.delay.get();	
	if (replay === false && mydelay > 0)
	{
		util.delayThreadMS(mydelay);		
	}
	
	// v1 message
	if (local.parameters.audioV1.get() == 1)
	{
		local.sendBytesTo (multicastIP,uDPPort,udpdataV1);
	}
	// v2 message	
	if (local.parameters.audioV2.get() == 1)
	{
		var udpdataV2 = udpAudioSyncV2(udpdataV1);
		local.sendBytesTo (multicastIP,uDPPort,udpdataV2);		
	}
}

/* 
Sound Card
*/

// Create 16 FFT analysis entries with default name : adjustable size - custom
function createFFT(size)
{

	removeFFT();
	root.modules.soundCard.parameters.fftAnalysis.minDB.set(minDB);
	root.modules.soundCard.parameters.fftAnalysis.maxDB.set(maxDB);
	
	fftMode = "custom";

	if (size > 1)
	{
		size  = 1;
		
	} else if (size == 0) {
		
		size = 0.1;
	}

	for (var i = 0; i < 16; i += 1)
	{
		var bin = root.modules.soundCard.parameters.fftAnalysis.addItem();
		util.delayThreadMS(100);
		bin.position.set(0.0625 * i);
		bin.size.set(size);
		updateFreqTable(fftMode, i);
	}
}

// Create 16 FFT analysis entries with default name : WLED OLD/NEW -- true/false
function createWLEDFFT(old)
{

	removeFFT();
	root.modules.soundCard.parameters.fftAnalysis.minDB.set(minDB);
	root.modules.soundCard.parameters.fftAnalysis.maxDB.set(maxDB);	
	
	if (old)
	{
		fftMode = "old";
		
	} else {
		
		fftMode = "new";
	}
	

	for (var i = 0; i < 16; i += 1)
	{
		var bin = root.modules.soundCard.parameters.fftAnalysis.addItem();
		util.delayThreadMS(100);
		if (i == 0)
		{
			if (old) 
			{
				bin.position.set(0.020);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.020);
				bin.size.set(0.020);				
			}
			
		} else if (i == 1) {
			
			if (old) 
			{
				bin.position.set(0.030);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.030);
				bin.size.set(0.020);				
			}
			
		} else if (i == 2) {
			
			if (old) 
			{
				bin.position.set(0.040);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.045);
				bin.size.set(0.020);				
			}
			
		} else if (i == 3) {
			
			if (old) 
			{
				bin.position.set(0.045);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.065);
				bin.size.set(0.020);				
			}
			
		} else if (i == 4) {
			
			if (old) 
			{
				bin.position.set(0.060);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.090);
				bin.size.set(0.020);				
			}
			
		} else if (i == 5) {
			
			if (old) 
			{
				bin.position.set(0.075);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.110);
				bin.size.set(0.040);				
			}
			
		} else if (i == 6) {
			
			if (old) 
			{
				bin.position.set(0.090);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.160);
				bin.size.set(0.040);				
			}
			
		} else if (i == 7) {
			
			if (old) 
			{
				bin.position.set(0.120);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.215);
				bin.size.set(0.050);				
			}
			
		} else if (i == 8) {
			
			if (old) 
			{
				bin.position.set(0.150);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.265);
				bin.size.set(0.050);				
			}
			
		} else if (i == 9) {
			
			if (old) 
			{
				bin.position.set(0.190);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.340);
				bin.size.set(0.050);				
			}
			
		} else if (i == 10) {
			
			if (old) 
			{
				bin.position.set(0.245);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.410);
				bin.size.set(0.050);				
			}
			
		} else if (i == 11) {
			
			if (old) 
			{
				bin.position.set(0.310);
				bin.size.set(0.040);
				
			} else {
				
				bin.position.set(0.490);
				bin.size.set(0.050);				
			}
			
		} else if (i == 12) {
			
			if (old) 
			{
				bin.position.set(0.390);
				bin.size.set(0.060);
				
			} else {
				
				bin.position.set(0.570);
				bin.size.set(0.060);				
			}
			
		} else if (i == 13) {
			
			if (old) 
			{
				bin.position.set(0.480);
				bin.size.set(0.060);
				
			} else {
				
				bin.position.set(0.645);
				bin.size.set(0.070);				
			}
			
		} else if (i == 14) {
			
			if (old) 
			{
				bin.position.set(0.590);
				bin.size.set(0.030);
				
			} else {
				
				bin.position.set(0.830);
				bin.size.set(0.070);				
			}
			
		} else if (i == 15) {
			
			if (old) 
			{
				bin.position.set(0.700);
				bin.size.set(0.050);
				
			} else {
				
				bin.position.set(0.915);
				bin.size.set(0.070);				
			}
		}
		
		updateFreqTable(fftMode, i);
	}
}

// update Frequences Table depend on FFT mode
function updateFreqTable(fftMode, index)
{
	
	if ( index == 0 ) 
	{
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 86;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 100;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 50;
		
		}
		
	} else if ( index == 1 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 129;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 120;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 280;
		
		}

	} else if ( index == 2 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 216;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 160;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 600;
		
		}

	} else if ( index == 3 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 301;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 200;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 950;
		
		}

	} else if ( index == 4 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 430;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 260;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 1300;
		
		}

	} else if ( index == 5 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 560;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 340;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 1700;
		
		}

	} else if ( index == 6 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 818;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 440;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 2150;
		
		}

	} else if ( index == 7 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 1120;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 600;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 2600;
		
		}

	} else if ( index == 8 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 1421;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 760;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 3100;
		
		}

	} else if ( index == 9 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 1895;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 980;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 3600;
		
		}

	} else if ( index == 10 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 2412;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 1300;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 4200;
		
		}

	} else if ( index == 11 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 3015;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 1700;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 4950;
		
		}

	} else if ( index == 12 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 3704;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 2240;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 5750;
		
		}

	} else if ( index == 13 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 4479;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 2960;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 6800;
		
		}

	} else if ( index == 14 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 7106;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 3900;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 8100;
		
		}

	} else if ( index == 15 ) {
		
		if ( fftMode == "new" )
		{
			FREQTABLE[index] = 9259;
			
		} else if ( fftMode == "old" ) {

			FREQTABLE[index] = 5120;			
			
		} else if ( fftMode == "custom" ) {

			FREQTABLE[index] = 10000;
		
		}
	}	
}


// remove all FFT analysis
function removeFFT()
{
	root.modules.soundCard.parameters.fftAnalysis.removeAll();
}

/*

WLED Specifics

*/

// This one should be always executed. If replay is true we had taken data from file.
function udpAudioSyncV1(replay)
{
/* 
#define UDP_SYNC_HEADER "00001"
struct audioSyncPacket {
  char header[6] = UDP_SYNC_HEADER;
  uint8_t myVals[32];     //  32 Bytes
  int sampleAgc;          //  04 Bytes
  int sampleRaw;          //  04 Bytes
  float sampleAvg;        //  04 Bytes
  bool samplePeak;        //  01 Bytes
  uint8_t fftResult[16];  //  16 Bytes - FFT results, one byte per GEQ channel
  double FFT_Magnitude;   //  08 Bytes
  double FFT_MajorPeak;   //  08 Bytes
};
----------------------------------------------------

  // update samples for effects
  volumeSmth   = fmaxf(receivedPacket->sampleAgc, 0.0f);
  volumeRaw    = volumeSmth;   // V1 format does not have "raw" AGC sample
  // update internal samples
  sampleRaw    = fmaxf(receivedPacket->sampleRaw, 0.0f);
  sampleAvg    = fmaxf(receivedPacket->sampleAvg, 0.0f);;
  sampleAgc    = volumeSmth;
  rawSampleAgc = volumeRaw;
  multAgc      = 1.0f;
  
-----------------------------------------------------

  bool newReading = MSGEQ7.read(MSGEQ7_INTERVAL);
  if (newReading) {
    audioSyncPacket transmitData;

    for (int b = 0; b < 14; b = b + 2) {
      int val = MSGEQ7.get((b / 2));
      val = mapNoise(val);
      Serial.printf("%u ", val);
      transmitData.fftResult[b] = val;
      transmitData.fftResult[(b + 1)] = val;  
    }

------------------------------------------------------

    int v = map(MSGEQ7.getVolume(), 0, MSGEQ7_OUT_MAX, 0, 1023); // TODO: not sure this is right
    transmitData.sampleRaw = v; // Current sample

------------------------------------------------------


*/

	// save audio data to file
	if (snapshot)
	{
		script.log("Take snapshot");
		
		var soundFileName = homeDIR + moduleDIR + "Snapshot_" + util.getTimestamp() + ".csv";
		var data = wledVol + ";" + wledPeak + ";" + wledMag + ";" + wledFreq;
		for (var i = 0; i < 16; i+=1)
		{
			data = data + ";" + FFTWLED[i];
		}
		data = data + ";" + fftMode;
		
		// write sound data to file		
		util.writeFile(soundFileName, data, false);		
		util.showMessageBox("Snapshot", "file name : " + soundFileName , "info", "Ok");
		
		snapshot = false;
	}

	
	// FFT Max Freq / Magnitude
	fftSoundMaxFreqMagnitude = 0;
	fftSoundMaxFreqIndex = 0;

	if (replay === false  && local.parameters.live.get() == 1)	
	{
	
		// sampleRaw 4 Bytes
		wledVol = root.modules.soundCard.values.volume.get()*volMultiplier;
		// samplePeak
		wledPeak = root.modules.soundCard.values.pitchDetection.pitch.get();	
		
		// Calculate FFT Data
		// Freq value
		FFTWLED[0] = root.modules.soundCard.values.fftEnveloppes.analyzer1Value.get()*fftMultiplier;
		FFTWLED[1] = root.modules.soundCard.values.fftEnveloppes.analyzer2Value.get()*fftMultiplier;
		FFTWLED[2] = root.modules.soundCard.values.fftEnveloppes.analyzer3Value.get()*fftMultiplier;	
		FFTWLED[3] = root.modules.soundCard.values.fftEnveloppes.analyzer4Value.get()*fftMultiplier;
		FFTWLED[4] = root.modules.soundCard.values.fftEnveloppes.analyzer5Value.get()*fftMultiplier;
		FFTWLED[5] = root.modules.soundCard.values.fftEnveloppes.analyzer6Value.get()*fftMultiplier;	
		FFTWLED[6] = root.modules.soundCard.values.fftEnveloppes.analyzer7Value.get()*fftMultiplier;	
		FFTWLED[7] = root.modules.soundCard.values.fftEnveloppes.analyzer8Value.get()*fftMultiplier;
		FFTWLED[8] = root.modules.soundCard.values.fftEnveloppes.analyzer9Value.get()*fftMultiplier;
		FFTWLED[9] = root.modules.soundCard.values.fftEnveloppes.analyzer10Value.get()*fftMultiplier;	
		FFTWLED[10] = root.modules.soundCard.values.fftEnveloppes.analyzer11Value.get()*fftMultiplier;	
		FFTWLED[11] = root.modules.soundCard.values.fftEnveloppes.analyzer12Value.get()*fftMultiplier;
		FFTWLED[12] = root.modules.soundCard.values.fftEnveloppes.analyzer13Value.get()*fftMultiplier;
		FFTWLED[13] = root.modules.soundCard.values.fftEnveloppes.analyzer14Value.get()*fftMultiplier;	
		FFTWLED[14] = root.modules.soundCard.values.fftEnveloppes.analyzer15Value.get()*fftMultiplier;	
		FFTWLED[15] = root.modules.soundCard.values.fftEnveloppes.analyzer16Value.get()*fftMultiplier;
		

		// retreive MaxFreq and Magnitude
		for (var i = 0; i < 16; i +=1)
		{
			if (fftSoundMaxFreqMagnitude < FFTWLED[i])
			{
				fftSoundMaxFreqMagnitude = FFTWLED[i];				
				fftSoundMaxFreqIndex = FREQTABLE[i];
			}
		}
		
		// FFT Magnitude 8 bytes
		wledMag = fftSoundMaxFreqMagnitude;
		// FFT Max Freq 8 bytes
		wledFreq = fftSoundMaxFreqIndex;
		
	} else if (replay === false  && local.parameters.live.get() == 0) {
		
		// set audio data
		wledVol = 0;
		wledPeak = 0;
		wledMag = 0;
		wledFreq = 0;
		
		for ( var i = 0; i < 16; i += 1)
		{
			FFTWLED[i] = 0;
		}
		
	}
	
	//
	// create UDP data 
	//
	var intArray = createIntArray(util.floatToHexSeq(wledVol,true));
	
	if (wledPeak !=0)
	{
		var samplePeak = 1;
		
	} else {
		
		var samplePeak = 0;
	}

	var fftMagArray = createIntArray(util.doubleToHexSeq(wledMag,true));
	var fftFreqArray = createIntArray(util.doubleToHexSeq(wledFreq,true));
	
	// Header v1
	UDP_AUDIO_SYNC[0] = 48;
	UDP_AUDIO_SYNC[1] = 48;
	UDP_AUDIO_SYNC[2] = 48;
	UDP_AUDIO_SYNC[3] = 48;
	UDP_AUDIO_SYNC[4] = 49;
	UDP_AUDIO_SYNC[5] = 0;
	// uint8_t myVals[32];
	// Used to store a pile of samples because WLED frame rate and WLED sample rate are not synchronized. Frame rate is too low.
	UDP_AUDIO_SYNC[6] = wledVol;
	UDP_AUDIO_SYNC[7] = wledVol;
	UDP_AUDIO_SYNC[8] = wledVol;
	UDP_AUDIO_SYNC[9] = wledVol;
	UDP_AUDIO_SYNC[10] = wledVol;
	UDP_AUDIO_SYNC[11] = wledVol;
	UDP_AUDIO_SYNC[12] = wledVol;
	UDP_AUDIO_SYNC[13] = wledVol;
	UDP_AUDIO_SYNC[14] = wledVol;
	UDP_AUDIO_SYNC[15] = wledVol;
	UDP_AUDIO_SYNC[16] = wledVol;
	UDP_AUDIO_SYNC[17] = wledVol;
	UDP_AUDIO_SYNC[18] = wledVol;
	UDP_AUDIO_SYNC[19] = wledVol;
	UDP_AUDIO_SYNC[20] = wledVol;
	UDP_AUDIO_SYNC[21] = wledVol;
	UDP_AUDIO_SYNC[22] = wledVol;
	UDP_AUDIO_SYNC[23] = wledVol;
	UDP_AUDIO_SYNC[24] = wledVol;
	UDP_AUDIO_SYNC[25] = wledVol;
	UDP_AUDIO_SYNC[26] = wledVol;
	UDP_AUDIO_SYNC[27] = wledVol;
	UDP_AUDIO_SYNC[28] = wledVol;
	UDP_AUDIO_SYNC[29] = wledVol;
	UDP_AUDIO_SYNC[30] = wledVol;
	UDP_AUDIO_SYNC[31] = wledVol;
	UDP_AUDIO_SYNC[32] = wledVol;
	UDP_AUDIO_SYNC[33] = wledVol;
	UDP_AUDIO_SYNC[34] = wledVol;
	UDP_AUDIO_SYNC[35] = wledVol;
	UDP_AUDIO_SYNC[36] = wledVol;
	UDP_AUDIO_SYNC[37] = wledVol;
	// Filler
	UDP_AUDIO_SYNC[38] = 0;
	UDP_AUDIO_SYNC[39] = 0;	
	// int sampleAgc;          //  04 Bytes
 	// volumeSmth   = fmaxf(receivedPacket->sampleSmth, 0.0f);
	UDP_AUDIO_SYNC[40] = intArray[3];
	UDP_AUDIO_SYNC[41] = intArray[2];
	UDP_AUDIO_SYNC[42] = intArray[1];
	UDP_AUDIO_SYNC[43] = intArray[0];
	//  int sampleRaw;          //  04 Bytes
	// fmaxf(receivedPacket->sampleRaw, 0.0f);
	UDP_AUDIO_SYNC[44] = intArray[3];
	UDP_AUDIO_SYNC[45] = intArray[2];
	UDP_AUDIO_SYNC[46] = intArray[1];
	UDP_AUDIO_SYNC[47] = intArray[0];
	// float sampleAvg;        //  04 Bytes
	// volumeSmth   = fmaxf(receivedPacket->sampleSmth, 0.0f);
	UDP_AUDIO_SYNC[48] = intArray[3];
	UDP_AUDIO_SYNC[49] = intArray[2];
	UDP_AUDIO_SYNC[50] = intArray[1];
	UDP_AUDIO_SYNC[51] = intArray[0];
	//   bool samplePeak;        //  01 Bytes
	// Boolean flag for peak. Responding routine must reset this flag
  	UDP_AUDIO_SYNC[52] = samplePeak;
	//   uint8_t fftResult[16];  //  16 Bytes - FFT results, one byte per GEQ channel 
	UDP_AUDIO_SYNC[53] = FFTWLED[0];
	UDP_AUDIO_SYNC[54] = FFTWLED[1];
	UDP_AUDIO_SYNC[55] = FFTWLED[2];
	UDP_AUDIO_SYNC[56] = FFTWLED[3];
	UDP_AUDIO_SYNC[57] = FFTWLED[4];
	UDP_AUDIO_SYNC[58] = FFTWLED[5];
	UDP_AUDIO_SYNC[59] = FFTWLED[6];
	UDP_AUDIO_SYNC[60] = FFTWLED[7];
	UDP_AUDIO_SYNC[61] = FFTWLED[8];
	UDP_AUDIO_SYNC[62] = FFTWLED[9];
	UDP_AUDIO_SYNC[63] = FFTWLED[10];
	UDP_AUDIO_SYNC[64] = FFTWLED[11];
	UDP_AUDIO_SYNC[65] = FFTWLED[12];
	UDP_AUDIO_SYNC[66] = FFTWLED[13];
	UDP_AUDIO_SYNC[67] = FFTWLED[14];
	UDP_AUDIO_SYNC[68] = FFTWLED[15];
	// Filler
	UDP_AUDIO_SYNC[69] = 0;	
	UDP_AUDIO_SYNC[70] = 0;	
	UDP_AUDIO_SYNC[71] = 0;	
	//   double FFT_Magnitude;   //  08 Bytes
	// float FFT_Magnitude = 0.0f;   // FFT: volume (magnitude) of peak frequency
	// my_magnitude  = fmaxf(receivedPacket->FFT_Magnitude, 0.0f);
	UDP_AUDIO_SYNC[72] = fftMagArray[7];
	UDP_AUDIO_SYNC[73] = fftMagArray[6];
	UDP_AUDIO_SYNC[74] = fftMagArray[5];
	UDP_AUDIO_SYNC[75] = fftMagArray[4];
	UDP_AUDIO_SYNC[76] = fftMagArray[3];
	UDP_AUDIO_SYNC[77] = fftMagArray[2];
	UDP_AUDIO_SYNC[78] = fftMagArray[1];
	UDP_AUDIO_SYNC[79] = fftMagArray[0];
	//  double FFT_MajorPeak;   //  08 Bytes
	// float FFT_MajorPeak = 1.0f;   // FFT: strongest (peak) frequency
	// FFT_MajorPeak = constrain(receivedPacket->FFT_MajorPeak, 1.0f, 11025.0f);  // restrict value to range expected by effects
	UDP_AUDIO_SYNC[80] = fftFreqArray[7];
	UDP_AUDIO_SYNC[81] = fftFreqArray[6];
	UDP_AUDIO_SYNC[82] = fftFreqArray[5];
	UDP_AUDIO_SYNC[83] = fftFreqArray[4];
	UDP_AUDIO_SYNC[84] = fftFreqArray[3];
	UDP_AUDIO_SYNC[85] = fftFreqArray[2];
	UDP_AUDIO_SYNC[86] = fftFreqArray[1];
	UDP_AUDIO_SYNC[87] = fftFreqArray[0];
	
	
return UDP_AUDIO_SYNC;
}

// v2 message , new format
function udpAudioSyncV2(udpdataV1)
{
/*
  // new "V2" audiosync struct - 40 bytes - from WLED 0.14xx
  
  struct audioSyncPacket {
  char    header[6];      //  06 Bytes
  float   sampleRaw;      //  04 Bytes  - either "sampleRaw" or "rawSampleAgc" depending on soundAgc setting
  float   sampleSmth;     //  04 Bytes  - either "sampleAvg" or "sampleAgc" depending on soundAgc setting
  uint8_t samplePeak;     //  01 Bytes  - 0 no peak; >=1 peak detected. In future, this will also provide peak Magnitude
  uint8_t reserved1;      //  01 Bytes  - for future extensions - not used yet
  uint8_t fftResult[16];  //  16 Bytes
  float  FFT_Magnitude;   //  04 Bytes
  float  FFT_MajorPeak;   //  04 Bytes
  
*/

	// FFT Magnitude 4 bytes
	var fftMagArray = createIntArray(util.floatToHexSeq(wledMag,true));
	
	// FFT Max Freq 4 bytes
	var fftFreqArray = createIntArray(util.floatToHexSeq(wledFreq,true));	
	
	// Header
	UDP_AUDIO_SYNC_V2[0] = 48;
	UDP_AUDIO_SYNC_V2[1] = 48;
	UDP_AUDIO_SYNC_V2[2] = 48;
	UDP_AUDIO_SYNC_V2[3] = 48;
	UDP_AUDIO_SYNC_V2[4] = 50;
	UDP_AUDIO_SYNC_V2[5] = 0;
	// Filler
	UDP_AUDIO_SYNC_V2[6] = 0;
	UDP_AUDIO_SYNC_V2[7] = 0;
	// sampleRaw
	UDP_AUDIO_SYNC_V2[8] = udpdataV1[44];
	UDP_AUDIO_SYNC_V2[9] = udpdataV1[45];
	UDP_AUDIO_SYNC_V2[10] = udpdataV1[46];
	UDP_AUDIO_SYNC_V2[11] = udpdataV1[47];
	// sampleSmth
	UDP_AUDIO_SYNC_V2[12] = udpdataV1[44];
	UDP_AUDIO_SYNC_V2[13] = udpdataV1[45];
	UDP_AUDIO_SYNC_V2[14] = udpdataV1[46];
	UDP_AUDIO_SYNC_V2[15] = udpdataV1[47];
	// samplePeak
	UDP_AUDIO_SYNC_V2[16] = udpdataV1[52];
	//for future extensions - not used yet
	UDP_AUDIO_SYNC_V2[17] = 0;
	// FFT
	UDP_AUDIO_SYNC_V2[18] = udpdataV1[53];
	UDP_AUDIO_SYNC_V2[19] = udpdataV1[54];
	UDP_AUDIO_SYNC_V2[20] = udpdataV1[55];
	UDP_AUDIO_SYNC_V2[21] = udpdataV1[56];
	UDP_AUDIO_SYNC_V2[22] = udpdataV1[57];
	UDP_AUDIO_SYNC_V2[23] = udpdataV1[58];
	UDP_AUDIO_SYNC_V2[24] = udpdataV1[59];
	UDP_AUDIO_SYNC_V2[25] = udpdataV1[60];
	UDP_AUDIO_SYNC_V2[26] = udpdataV1[61];
	UDP_AUDIO_SYNC_V2[27] = udpdataV1[62];
	UDP_AUDIO_SYNC_V2[28] = udpdataV1[63];
	UDP_AUDIO_SYNC_V2[29] = udpdataV1[64];
	UDP_AUDIO_SYNC_V2[30] = udpdataV1[65];
	UDP_AUDIO_SYNC_V2[31] = udpdataV1[66];
	UDP_AUDIO_SYNC_V2[32] = udpdataV1[67];
	UDP_AUDIO_SYNC_V2[33] = udpdataV1[68];
	// Filler
	UDP_AUDIO_SYNC_V2[34] = 0;
	UDP_AUDIO_SYNC_V2[35] = 0;	
	// FFT_Magnitude
	UDP_AUDIO_SYNC_V2[36] = fftMagArray[3];
	UDP_AUDIO_SYNC_V2[37] = fftMagArray[2];
	UDP_AUDIO_SYNC_V2[38] = fftMagArray[1];
	UDP_AUDIO_SYNC_V2[39] = fftMagArray[0];
	// FFT_MajorPeak
	UDP_AUDIO_SYNC_V2[40] = fftFreqArray[3];
	UDP_AUDIO_SYNC_V2[41] = fftFreqArray[2];
	UDP_AUDIO_SYNC_V2[42] = fftFreqArray[1];
	UDP_AUDIO_SYNC_V2[43] = fftFreqArray[0];

return UDP_AUDIO_SYNC_V2;
}

/*

OSC Module

*/

function addOSCScript(scriptName)
{
	OSCModule = root.modules.getItemWithName("OSC");
	// create module if not exist
	if (OSCModule.name == "undefined" ) 
	{
		script.log("Create OSC");
		OSCModule = root.modules.addItem("OSC");
		util.delayThreadMS(100);
	}

	var localTest = '';	
	if (scriptName == "OSCBPM")
	{		
		localTest = local.parameters.getChild("Beat Params");		
		
	} else if (scriptName == "OSCRTMGC") {
		
		localTest = local.parameters.getChild("RTMGC Params");
		
	} else {
		
		script.log('unknown script');
		return;
	}
	

	var testScript = OSCModule.scripts.getChild(scriptName);	
	if (testScript.name == "undefined")
	{
		var mysc = OSCModule.scripts.addItem();
		util.delayThreadMS(100);
		if (localTest.scriptFile.get() == scriptName + ".js")
		{
			mysc.filePath.set(homeDIR + "/Chataigne/modules/WLEDAudioSync/"+scriptName+".js");
			
		} else {
			
			mysc.filePath.set(localTest.scriptFile.get());
		}
	}

}


/*
 
 Utilities

*/

// Convert Sequence of Hex Char values ( from 00 to FF ) to int Array
function createIntArray(hexSequence)
{
	var intArray = [];
	var j = 0;
	
    for ( var i = 0; i < hexSequence.length; i+=2 )
	{
		intArray[j] = util.hexStringToInt(hexSequence.substring(i,i+1) + hexSequence.substring(i+1,i+2));
		j +=1;
    }
	
return intArray;
}

// Will bind to UDP port on specified IP address and join the MulticastGroup
// On 10/03/2023: Multicast do not work as expected on Chataigne, mainly when more than one network card
function testMultiCast()
{
	myIP = local.parameters.ipAddressToBind.getKey();
	script.log(myIP , multicastIP , uDPPort);
	
	var multiExeCmd = homeDIR + moduleDIR + multicastCmdName;
	if (util.fileExists(multiExeCmd))
	{
		script.log("multicastCmdName Ok");
		var multiOptions = " --ip " + myIP + " --group " + multicastIP + " --port " + uDPPort;
		var exeCMD = multiExeCmd + multiOptions;
		script.log('command to run : '+ exeCMD);
		// we execute the cmd 
		var launchresult = root.modules.os.launchProcess(exeCMD, false);
		
	} else {
		
		script.log('multicmd not found');
	}
}

// replay audio data from snapshot file
function runReplay(fileName, myduration)
{
	duration = myduration;
	
	// if same file for replay, avoid to read it again and again
	if (fileName != previousFile)
	{
		script.log("File Name : "  + fileName);
		if (fileName == ""){return;}
		SOUNDDATA = [];
		SOUNDDATA = util.readFile(fileName).split(";");
		previousFile = fileName;
	}

	// set audio datas
	wledVol  = SOUNDDATA[0];
	wledPeak = SOUNDDATA[1];
	wledMag  = SOUNDDATA[2];
	wledFreq = SOUNDDATA[3];
	
	for ( var i = 0; i < 16; i += 1 )
	{
		FFTWLED[i] = SOUNDDATA[4+i];
	}

	replay = true;
	script.setUpdateRate(10);
}

// Find Audio input device name 
function audioFindInput()
{
	var audioInput = "";

	var JSONobj = root.modules.soundCard.getJSONData();
	var JSONdata = JSON.stringify(JSONobj.audioSettings);
	var audioSettings = JSONdata.split("=");
	
	for ( var i = 0; i < audioSettings.length ; i++) 
	{		
		if (audioSettings[i].contains("audioInputDeviceName"))
		{
			audioInput = audioSettings[i+1].split('"')[1];
			break;
		}		
	}
	
	audioInput = audioInput.substring(0,audioInput.length-1);
	
return audioInput;	
}

// retreive temp location
function findTMP ()
{
	script.log("Retreive temp folder");
	// TMP, TMPDIR, and TEMP environment variables 
	var pathTMP = util.getEnvironmentVariable("TMP");
	var pathTMPDIR = util.getEnvironmentVariable("TMPDIR");	
	var pathTEMP = util.getEnvironmentVariable("TEMP");
	
	if (pathTMP != "")
	{
		tempDIR = pathTMP;
		return tempDIR;
		
	} else if (pathTMPDIR != ""){
		tempDIR = pathTMPDIR;
		return tempDIR;

	} else if (pathTEMP != ""){
		tempDIR = pathTEMP;
		return tempDIR;	
	}
	
	script.log('ERROR temp directory not found');
	
return tempDIR;
}

// retreive devices list from aubio
function aubioDevicesList()
{
	var fileTmp = findTMP() + "/aubioDevicesList.tmp";
	var command = homeDIR + moduleDIR + aubioCmdName + " list >" + fileTmp;
	var result = root.modules.os.launchCommand(command, false);
	var devicesList = util.readFile(fileTmp).split("\n");
	
	local.parameters.beatParams.inputAudio.removeOptions();
	
	for ( var i = 0; i < devicesList.length ; i ++)
	{
		if (devicesList[i].startsWith("["))
		{
			local.parameters.beatParams.inputAudio.addOption(devicesList[i].replace("\n","").replace("\r",""),devicesList[i].substring(1,2));
		}
	}
}

// Deactivate FFT

// bass
function bassFFT(onOff)
{
	if (onOff)
	{
		root.modules.soundCard.parameters.fftAnalysis.analyzer1.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer2.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer3.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer4.enabled.set(1);		
		
	} else {
		root.modules.soundCard.parameters.fftAnalysis.analyzer1.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer2.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer3.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer4.enabled.set(0);		
	}
}
// midrange
function midFFT(onOff)
{
	if (onOff)
	{
		root.modules.soundCard.parameters.fftAnalysis.analyzer5.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer6.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer7.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer8.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer9.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer10.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer11.enabled.set(1);		
		
	} else {
		root.modules.soundCard.parameters.fftAnalysis.analyzer5.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer6.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer7.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer8.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer9.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer10.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer11.enabled.set(0);		
	}
}
// high
function highFFT(onOff)
{
	if (onOff)
	{
		root.modules.soundCard.parameters.fftAnalysis.analyzer12.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer13.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer14.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer15.enabled.set(1);
		root.modules.soundCard.parameters.fftAnalysis.analyzer16.enabled.set(1);		
		
	} else {
		root.modules.soundCard.parameters.fftAnalysis.analyzer12.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer13.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer14.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer15.enabled.set(0);
		root.modules.soundCard.parameters.fftAnalysis.analyzer16.enabled.set(0);
	}
}
// reset volume & magnitude multiplier
function resetVolMag()
{
	local.parameters.volumeMultiplier.set(1024);
	local.parameters.frequencyMagnitudeMultiplier.set(254);
}

// We take the BPM to give a genre probability, based on medium values.
// could be associated to RTMGC
function getProbableGenres (bpm) 
{
	// Name: min BPM, max BPM
	var genres = [
		'Ambient: 60, 100',
		'Bachata: 128, 128',
		'Ballad: 60, 80',
		'Blues: 60, 120',
		'Classical: 60, 120',
		'Country: 60, 120',
		'Crunk: 80, 80',
		'Cumbia: 70, 80',
		'Disco: 110, 140',
		'Drum n Bass: 160, 180',
		'Dubstep: 130, 150',
		'Electronic: 120, 140',
		'Eurodance: 126, 132',
		'Frenchcore: 200, 210',
		'Folk: 90, 130',
		'Funk: 90, 120',
		'Funky House: 128, 136',
		'Hard Rock: 130, 160',
		'Heavy Metal: 100, 120',
		'Hip Hop: 60, 100',
		'House: 120, 130',
		'Indie: 100, 160',
		'Jazz: 80, 140',
		'Latin: 90, 130',
		'Makina: 150, 190',
		'Metal: 100, 200',
		'New Beat: 110, 120',
		'Pop: 90, 130',
		'Psytrance: 140, 145',
		'Punk: 150, 200',
		'R&B: 60, 100',
		'Rap: 90, 100',
		'Reggae: 70, 100',
		'Reggaeton: 80, 90',
		'Rock: 100, 160',
		'Salsa: 150, 250',
		'Soul: 60, 120',
		'Tango: 50, 56',	
		'Techno: 120, 140',
		'Techno Hardcore: 170, 200',
		'Trance: 130, 150',
		'Tribe: 145, 180',
		'Trip Hop: 60, 120'
	];

	var probableGenres = [];
	var j = 0;

	for (var i = 0; i < genres.length; i ++) {
		var genre = genres[i].split(':');
		var bpmRange = genre[1].split(',');
		if (bpm >= parseInt(bpmRange[0]) && bpm <= parseInt(bpmRange[1])) {
		  probableGenres[j] = genre[0];
		  j = j+1;
		}
	}

	return probableGenres;
}


// just for some test
function test()
{
		script.log('test');
		root.modules.sCAnalyzer.parameters.wLEDAudioSyncParams.moduleName.addOption(local.name, local.name);
		script.log(local.name);
}