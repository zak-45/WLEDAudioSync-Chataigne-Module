/* 

author:	zak45
date:	03/11/2022
version:1.0.0

Chataigne Module for  Sound Analysis using Vamp plugin .

This work mainly for mp3 file.
Manage the segmenter plugin from QM.
Manage the Rhythm Diff plugin from BBC.
Can create corresponding actions for LedFX / WLEd if required.
Automatic show creation feature.
Play all sequences from start to end.
Delay effects max 500 ms. To help in case of BT speakers.
Create mapping for vocal part of a song.
Send WLED audio sync from mapping.
Easing set to Hold for the created keys.

*/

// Sonic Visualiser : to be adapted by OS
var sonicVisu = "C:/Program Files/Sonic Visualiser/Sonic Visualiser.exe";

// Main module parameters 

var sequence = "";
var targetFile = "";
// segmenter

var shouldProcessSeg = false;
var segAnalyzerIsRunning = false;
var featureType = "";
var nSegmentTypes = 0;
var neighbourhoodLimit = 0;
var creColEffect = false;
var linkToGroupNumber = 0;

//rhythm
var shouldProcessRhythm = false;
var rhythmAnalyzerIsRunning = false;
var SubBands = 0;
var Threshold = 0;
var MovingAvgWindowLength = 0;
var OnsetPeackWindowLength = 0;
var MinBPM = 0;
var MaxBPM = 0;

// Sonic exe file name (required)
var SCAnalyzerExeName = "sonic-annotator.exe";

// Output file, if blank, sonic-annotator will consider to be the audio file name under temp directory
var SCAoutputFile = "";

// Transform file name/location
var SCAtransform = "";

// Vamp Plugin name
var SCAvampPluginName = "";

// writer option with overwrite
var SCAoutputOptions = "-w jams --jams-force --jams-one-file ";

// Final options
var SCAnalyzerOptions = "-d "+SCAvampPluginName+" "+SCAoutputOptions+' "'+SCAoutputFile+'" ';

// TEMP dir (required)
var tempDIR = "";

//HOME Location
//%USERPROFILE% for WIN and $HOME for others
var homeDIR = "";
var winHOME = "";

// Transform file
var origTransform = "";
var pathTransform = "";

// Ledfx test
var ledfxAuto = false;
// Ledfx Scene test
var useScenes = false;
var writeLedFXFileScenes = true;
//
var writeLedFXFileEffects = true;

// WLED test
var wledAuto = false;
var bkpWLEDValue = "";

// for playing all sequences in sequential way
var deltaTime = 0;
var numberToPlay = 0;
var lastsequence = 0;
var playseq = root.sequences.getItemAt(0);

// Enum param file : used to store Enum parameters modified / changed by end user
var enumFile = "SCAnalyzerEnumeffects.json";
// Enum param file : used to store Enum parameters modified / changed by end user
var enumScenesFile = "SCAnalyzerEnumscenes.json";

// to made some logic only once at init
var isInit = true;

// increase timeout as we want to run Sonic in synchronus way (blocking)
script.setExecutionTimeout(300);

// Module test
var wledExist = null;
var ledfxExist = null;
var spleeterExist = null;

// Create a show
var keepJson = false;
var newAudio = "";
var moreInfo = "";
var spleeterIsRunning = false;
var createShowStep2 = false;
var createShowStep3 = false;
var createShowStep4 = false;
var createShowStep5 = false;
var spleeterOccurrence = 0;
var spleeterMaxOccurrences = 240;
  
//We create necessary entries in modules & sequences. We need OS / Sound Card  and  Sequence with Trigger / Audio.
function init()
{

	script.log("-- Custom command called init()");	

	var infos = util.getOSInfos(); 
	
	script.log("Hello "+infos.username);	
	script.log("We run under : "+infos.name);

	if ( infos.name.contains("Win") )
	{
		homeDIR = util.getEnvironmentVariable("USERPROFILE") + "/Documents";
		winHOME = util.getEnvironmentVariable("USERPROFILE");
		
	} else {
		
		homeDIR = util.getEnvironmentVariable("$HOME");
	}	

	// we check required TMP folder
	analyzerTMP();
	script.log("Temp folder : "+tempDIR);
	if (tempDIR == "")
	{
		util.showMessageBox("Sonic Analyzer !", "TMP, TMPDIR or TEMP env variable not found", "warning", "OK");
	}
	
	// modules  test
	var osExist = root.modules.getItemWithName("OS");
	var SCexist = root.modules.getItemWithName("Sound Card");
	var SCAexist = root.modules.getItemWithName("SCAnalyzer");	
	ledfxExist = root.modules.getItemWithName("LedFX");
	wledExist = root.modules.getItemWithName("WLED");
	spleeterExist = root.modules.getItemWithName("Spleeter");

	if (SCexist.name == "soundCard")
	{	
		script.log("Module Sound Card exist");
		
	} else {
			
		var newSCModule = root.modules.addItem("Sound Card");
		util.delayThreadMS(10);		
	}
	
	if (osExist.name == "os")
	{
		script.log("Module OS exist");
		
	} else {
			
		var newOSModule = root.modules.addItem("OS");
		util.delayThreadMS(10);
			
	}
	
	if (ledfxExist.name == "ledFX")
	{
		script.log("Module LedFX present");		
				
	} else {
		
		script.log("No module LedFX");
	}

	var wledcontainer = local.parameters.getChild("WLED Params");
	if (wledExist.name == "wled")
	{
		script.log("Module WLED present");
		wledcontainer.setCollapsed(false);
		
	} else {
			
		script.log("No module WLED");
		wledcontainer.setCollapsed(true);
	} 	

	var spleetercontainer = local.parameters.getChild("Spleeter Params");
	if (spleeterExist.name == "spleeter")
	{
		script.log("Module Spleeter present");
		spleetercontainer.setCollapsed(false);
		
	} else {
			
		script.log("No module Spleeter");
		spleetercontainer.setCollapsed(true);
	}
	
	// test sequence
	var SQexist = root.sequences.getItemWithName("Sequence");
	
	if (SQexist.name == "sequence")
	{
		script.log("Sequences Sequence exist");
		
	} else {

		var newSequence = root.sequences.addItem();
		util.delayThreadMS(10);
		var newTSequence = newSequence.layers.addItem("Trigger");
		util.delayThreadMS(10);
		var newASequence = newSequence.layers.addItem("Audio");
		util.delayThreadMS(10);		
	}
	
	//
	script.setUpdateRate(1);
}

// Triggered once by second (rate = 1), sequence start from index 0, when one sequence reach end time, we switch to index +1
function update ()
{	

	// Initialize once some Param
	if (isInit === true)
	{
		script.log('Initialize');
		// load saved Enum
		analyzerLoadenum();
		analyzerLoadenumScenes();		
		// generate WLEDAudioSync enum list
		generateAudioSyncList();
		// set folder for nc3 files
		if (local.parameters.sonicParams.transformFile.get() == "qmsegmenter.nc3")
		{
			local.parameters.sonicParams.transformFile.set(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+ "qmsegmenter.nc3");
		}
		if (local.parameters.sonicParams.rhythmTransformFile.get() == "bbcrhythm.nc3")
		{
			local.parameters.sonicParams.rhythmTransformFile.set(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+ "bbcrhythm.nc3");
		}
		// set sonic annotator folder
		if (local.parameters.sonicParams.sonicAnnotatorLocation.get() == "sonic-annotator.exe")
		{
			local.parameters.sonicParams.sonicAnnotatorLocation.set(homeDIR + "/Chataigne/xtra/vamp-plugins/x64/sonic-annotator-1.5-win64/" + "sonic-annotator.exe");
		}		

		isInit = false;
		
	}
	
	// start long pocess on it's own thread to run in blocking mode but not block the main UI
	if (shouldProcessSeg === true)
	{
		shouldProcessSeg = false;
		runsegAnalyzer (sequence, targetFile, featureType, nSegmentTypes, neighbourhoodLimit);
	}

	// start long pocess on it's own thread to run in blocking mode but not block the main UI
	if (shouldProcessRhythm === true)
	{
		shouldProcessRhythm = false;
		runrhythmAnalyzer (sequence, targetFile, SubBands, Threshold, MovingAvgWindowLength, OnsetPeackWindowLength, MinBPM, MaxBPM);
	}

	// check some process finished
	if (spleeterIsRunning) 
	{
		checkSpleeter();
	}
	
	if (createShowStep2 === true) 
	{
		checkStep1();
		
	} else if (createShowStep3 === true) {
		
		checkStep2();
/*		
	} else if (createShowStep4 === true) {
		
		checkStep3();
*/		
	} else if (createShowStep5 === true) {
		
		checkStep3();
		
	} else if (createShowLast === true)  {
		
		checkLast();
	}	

	// Play all enabled sequences
	if (lastsequence < numberToPlay) 
	{
		if (playseq.enabled.get() == 1) 
		{
			if (playseq.currentTime.get() == playseq.totalTime.get())
			{
				script.log("Reach end of time");
				lastsequence += 1;
				if (lastsequence  == numberToPlay)
				{
					numberToPlay = 0;
					script.log("End Sequences");				
					
				} else {
					
					playseq = root.sequences.getItemAt(lastsequence);
					script.log("Sequence to play : " +playseq.name);				
				}
				
			} else if (playseq.isPlaying.get() == 0)

			{
				playseq.play.trigger();
				script.log("Play  sequence : " +playseq.name);
			}
			
		} else {

			script.log("Sequence to bypass : " +playseq.name);							
			lastsequence += 1;
			playseq = root.sequences.getItemAt(lastsequence);
			if (lastsequence  == numberToPlay)
			{
				numberToPlay = 0;
				script.log("End Sequences");				
				
			}				
		}
	}
}

// execution depend on the user response
function messageBoxCallback (id, result)
{
	script.log("Message box callback : " + id + " : " + result); 
	
	if (id == "msgDefaultEffects")
	{
		//script.log('defaultEffects Call back');

		if (result == "1")
		{
			script.log('Delete all effects and loading default one');
			analyzerLoaddefault();			
		}
	}	
}

function scriptParameterChanged (param)
{
	script.log("Script Param changed : "+param.name);	
}

function moduleParameterChanged (param)
{
	script.log("Module Param changed : " + param.name);
	
	if ( isInit === false )
	{
		if (param.name == "transformFile")
		{
			origTransform = param.getAbsolutePath();
			
		} else if (param.name == "createActions") {
			
			ledfxExist = root.modules.getItemWithName("LedFX");
			if (ledfxExist.name == "undefined")
			{
				util.showMessageBox("Sonic Analyzer !", "No LEDFX Module ", "warning", "Got it");
				param.set(0);
			}
			ledfxAuto = param.get();
			
		} else if (param.name == "createWLEDActions") {
			
			wledExist = root.modules.getItemWithName("WLED");
			if (wledExist.name == "undefined")
			{
				util.showMessageBox("Sonic Analyzer !", "No WLED Module ", "warning", "Got it");
				param.set(0);
			}			
			wledAuto = param.get();
			
		} else if (param.name == "createVocal") {
			
			spleeterExist = root.modules.getItemWithName("Spleeter");			
			if (spleeterExist.name == "undefined")
			{
				util.showMessageBox("Sonic Analyzer !", "No Spleeter Module ", "warning", "Got it");
				param.set(0);
			}
			
		} else if (param.name == "wledLive") {
			
			// wledAuto = param.get();
			
		} else if (param.name == "sonicAnnotatorInfo") {
			
			util.gotoURL('https://vamp-plugins.org/sonic-annotator/');
			
		} else if (param.name == "associatedEffects") {
			
			if (writeLedFXFileEffects == true)
			{
				util.writeFile(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+enumFile,local.parameters.ledFXParams.associatedEffects.getAllOptions(),true);					
			}
			
		} else if (param.name == "associatedScenes") {
			
			if (writeLedFXFileScenes == true)
			{
				util.writeFile(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+enumScenesFile,local.parameters.ledFXParams.associatedScenes.getAllOptions(),true);					
			}
			
		} else if (param.name == "loadDefault")	{
			
			util.showYesNoCancelBox("msgDefaultEffects", "Confirm ?", "Do you really want to load default effects ?", "question", "Yes", "No", "Cancel...");
			
		} else if (param.name.contains("scGroup")){
			
			createCustomVariables(param.name);
			
		} else if (param.name == "activateColors") {
			
			activateColors();
				
		} else if (param.name == "deActivateColors") {
			
			deActivateColors();
			
		} else if (param.name == "loopColors") {
			if (param.get() == 1)
			{
				if (local.parameters.groupParams.linkToGroupNumber.get() == "0")
				{
					util.showMessageBox("SCAnalyzer","Link to an existing group need to be set","warning", "Ok");
				}				
			}
			
		} else if (param.name == "resetEffects") {
			 
			resetEffects();
			
		} else if (param.name == "resetPalettes") {
			
			resetPalettes();
			
		} else if (param.name == "split") {
			
			if (local.parameters.mappingParams.sequential.get() == 1) 
			{
				local.parameters.mappingParams.sequential.set(0);
			}
			
		} else if (param.name == "sequential") {

			if (local.parameters.mappingParams.split.get() == 1) 
			{
				local.parameters.mappingParams.split.set(0);
			}
			
		} else if (param.name == "replayFile") {
			
			generateAudioSyncList();
			
		} else if (param.name == "runSonicVisualiser") {
			
			//execute Sonic Visualiser
			if (util.fileExists(sonicVisu))
			{
				var launchresult = root.modules.os.launchProcess(sonicVisu, false);				
			}
			
		} else if (param.name == "duration") {
			
			generateAudioSyncList();			
		}
	}
}

function moduleValueChanged (value) 
{	
	script.log("Module value changed : "+value);	
}

// check to see if something to do
function segAnalyzer (insequence, intargetFile, infeatureType, innSegmentTypes, inneighbourhoodLimit)
{	
	if (insequence == "" && intargetFile == "" )
	{
		script.log("Nothing to do !!");
		segAnalyzerIsRunning = false;
		
	} else {
	
		sequence = insequence;
		targetFile = intargetFile;
		featureType = infeatureType;
		nSegmentTypes = innSegmentTypes;
		neighbourhoodLimit = inneighbourhoodLimit;
		
		util.showMessageBox("Sonic Analyzer ! QM-SEGMENTER ", "This could take a while ...." + moreInfo, "info", "Got it");
		// runsegAnalyzer (sequence, targetFile, featureType, nSegmentTypes, neighbourhoodLimit) ;
		shouldProcessSeg = true;
	}
}

// Run Sonic: wait and read received data from Segmenter		
function runsegAnalyzer (sequence, targetFile, featureType, nSegmentTypes, neighbourhoodLimit) 
{
	segAnalyzerIsRunning = true;
	
	// Sonic executable
	SCAnalyzerExeName = local.parameters.sonicParams.sonicAnnotatorLocation.getAbsolutePath();
	// check to see if Sonic exe exist
	if (util.fileExists(SCAnalyzerExeName) == 1)
	{

		// we have some work to do, target first else file 
		if (sequence.contains("/"))
		{
			script.log('Retreive data from sequence : ' + sequence);
			var splitseq = sequence.split("/");
			var sequenceName = splitseq[2];
			var audioName = splitseq[4];
			// set newSequence to existing one
			var newSequence =  root.sequences.getItemWithName(sequenceName);
			// set newAudio to existing one 
			newAudio =  newSequence.layers.getItemWithName(audioName);
			// targetFile
			var targetFile = newAudio.clips.audioClip.filePath.getAbsolutePath();
			script.log('Target file  from sequence : ' + targetFile);				
					
		} else if (targetFile != ""){

			script.log('Create new sequence from filename :'+targetFile);
			// create new sequence / audio clip 
			var newSequence =  root.sequences.addItem('Sequence');	
			util.delayThreadMS(10);
			newAudio =  newSequence.layers.addItem('Audio');
			util.delayThreadMS(10);
			var newAudioClip =  newAudio.clips.addItem('audioClip');
			util.delayThreadMS(10);			
			newAudioClip.filePath.set(targetFile);
			
		} else {
			
			script.logError("Something wrong with segAnalyzer....");
			return;
		}

		// transform file to read
		origTransform = local.parameters.sonicParams.transformFile.getAbsolutePath();
		// plugin name
		SCAvampPluginName = "vamp:qm-vamp-plugins:qm-segmenter:segmentation";
		// result output file
		SCAoutputFile = local.parameters.sonicParams.outputFile.getAbsolutePath();		
		// if output file not set, we set it as audio clip file name under tmp folder
		if (SCAoutputFile == "")
		{						
			SCAoutputFile =  tempDIR + "/SCAnalyzer_" + getFilename(targetFile).replace(".mp3", "").replace(".wav", "") + ".json";
		}
		
		// check to see if transform file is necessary
		if (origTransform == "")
		{
			script.log("Using default parameters for the plugin, if you want to customize, select a transform");
			SCAnalyzerOptions = "-d "+SCAvampPluginName+" "+SCAoutputOptions+' "'+SCAoutputFile+'" ';			
			
		} else {

			script.log("Using transform file : "+origTransform);
			segAnalyzerTransform (featureType, nSegmentTypes, neighbourhoodLimit);				
			SCAnalyzerOptions = "-t "+'"'+pathTransform+'"'+" "+SCAoutputOptions+' "'+SCAoutputFile+'" ';
			
		}

		// Run only if necessary
		if (keepJson === false)
		{
			//set output file to blank to avoid reading old values in case sonic-annotator not run as should.
			util.writeFile(SCAoutputFile, "", true);
			
			var exeCMD = '"'+SCAnalyzerExeName+'" '+SCAnalyzerOptions+'"'+targetFile+'"';
			script.log('command to run : '+ exeCMD);
			
			// we execute the Sonic-annotator in blocking mode
			var launchresult = root.modules.os.launchProcess(exeCMD, true);
			script.log("Sonic Analyzer return code : "+launchresult);
			if (launchresult == "")
			{
				util.showMessageBox("Sonic Analyzer !", "Something wrong....", "warning", "OK");
				return;
			}				
		}

		// read the result 
		script.log("we read from : " + SCAoutputFile);
		var SCAJSONContent = util.readFile(SCAoutputFile,true);
		
		// set flag for ledfx and/or wled auto actions creation
		var ledfxExist = root.modules.getItemWithName("LedFX");
		if (ledfxExist.name == "ledFX")
		{
			ledfxAuto = local.parameters.ledFXParams.createActions.get();		
			useScenes = local.parameters.ledFXParams.useScenes.get();		
		}
		var wledExist = root.modules.getItemWithName("WLED");			
		if (wledExist.name == "wled")
		{
			wledAuto = local.parameters.wledParams.createWLEDActions.get();						
		}

		// create the container for result values
		local.values.removeContainer("Vamp plugin");
		var newContainer = local.values.addContainer("Vamp plugin");

		// create Vamp plugin values
		newContainer.addStringParameter("File Name","",SCAJSONContent.file_metadata.identifiers.filename);
		newContainer.addStringParameter("duration","",SCAJSONContent.file_metadata.duration);
		newContainer.addStringParameter("artist","",SCAJSONContent.file_metadata.artist);
		newContainer.addStringParameter("title","",SCAJSONContent.file_metadata.title);

		// only mp3 file
		if (targetFile.contains(".mp3")){
			newSequence.setName(SCAJSONContent.file_metadata.artist);
		}
		
		newAudio.setName(SCAJSONContent.file_metadata.identifiers.filename);
		
		// create Triggers from the json result file 
		var newLayersTrigger =  newSequence.layers.addItem('Trigger');
		util.delayThreadMS(10);
		var prefix = "QM";

		if (creColEffect === true)
		{
			prefix = "CALC" + linkToGroupNumber;
		}

		newLayersTrigger.setName(prefix + SCAJSONContent.annotations[0].annotation_metadata.annotator.output_id);
		newLayersTrigger.triggerWhenSeeking.set(false);
		
		for (var i = 0; i < SCAJSONContent.annotations.length; i += 1)
		{

			// set annotations in values
			var newannotationsContainer = newContainer.addContainer("annotations");		
			newannotationsContainer.addStringParameter("tools","",SCAJSONContent.annotations[i].annotation_metadata.annotation_tools);
			newannotationsContainer.addStringParameter("data source","",SCAJSONContent.annotations[i].annotation_metadata.data_source);
			// set annotator in values
			var newannotatorContainer = newannotationsContainer.addContainer("annotator");
			newannotatorContainer.addStringParameter("plugin_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.plugin_id);
			newannotatorContainer.addStringParameter("output_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.output_id);
			newannotatorContainer.addStringParameter("plugin_version ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.plugin_version);
			newannotatorContainer.addStringParameter("step_size ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.step_size);
			newannotatorContainer.addStringParameter("block_size ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.block_size);				
			newannotatorContainer.addStringParameter("sample_rate ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.sample_rate);
			newannotatorContainer.addStringParameter("transform_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.transform_id);
			// set parameters in values
			var newparametersContainer = newannotatorContainer.addContainer("parameters");
			newparametersContainer.addStringParameter("featureType ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.featureType);
			newparametersContainer.addStringParameter("nSegmentTypes ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.nSegmentTypes);
			newparametersContainer.addStringParameter("neighbourhoodLimit ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.neighbourhoodLimit);

			script.log("Occurence : " + i + " data length : " + SCAJSONContent.annotations[i].data.length);
			
			var newColor = [];
			var newEffect = 0;
			var newPalette = 0;
			
			// retreive groupName if necessary
		
			var groupName = "NotSet";
			if (creColEffect === false)
			{
				linkToGroupNumber = local.parameters.groupParams.linkToGroupNumber.get();				
			}

			if (linkToGroupNumber != 0 || creColEffect === true)
			{
				// check if custom variables exist for this group 
				// retreive groupe name 
				var groupNamevar = local.parameters.getChild("groupParams/" + linkToGroupNumber);				
				var groupName = groupNamevar.get();
				
				if (groupName == "")
				{
					groupName = "NotSet";
				}
			}
			groupName = groupName.replace(" ","").toLowerCase();
			var groupExist = root.customVariables.getItemWithName(groupName);
		
			
			// main Triggers / cues loop 
			for (var j = 0; j < SCAJSONContent.annotations[i].data.length; j += 1)
			{

				// no cue if create triggers for color/effect					
				if (creColEffect === false)
				{
					
					// set Cue time /name if cue not already exist for this time
					var cueExist = newSequence.cues.getItemWithName(j);
					
					if (cueExist == "")
					{
						var newCue = newSequence.cues.addItem();
						util.delayThreadMS(10);
						newCue.time.set(SCAJSONContent.annotations[i].data[j].time);
						newCue.setName(j);	
						
					} else {
						
						if (cueExist.time.get() != SCAJSONContent.annotations[i].data[j].time)
						{
							var newCue = newSequence.cues.addItem();
							util.delayThreadMS(10);
							newCue.time.set(SCAJSONContent.annotations[i].data[j].time);
							newCue.setName(j);								
						}
					}
				}
				
				// create new Trigger
				var newTrigger = newLayersTrigger.triggers.addItem();
				util.delayThreadMS(10);
				
				// set main Trigger values
				newTrigger.time.set(SCAJSONContent.annotations[i].data[j].time);			
				newTrigger.flagY.set(100000%j);
				newTrigger.setName(SCAJSONContent.annotations[i].data[j].label);
			
				// set Trigger color and create action for ledFX / WLED if requested, depend on segment name
				if (SCAJSONContent.annotations[i].data[j].label.contains("A"))
				{
					//newTrigger.color.set([1,0,0,1]);	
					newColor = local.parameters.defaultColors.segmentA.get();
					newTrigger.color.set(newColor);
					newEffect = local.parameters.defaultEffects.effectA.get();
					newPalette = local.parameters.defaultPalettes.paletteA.get();
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("A", groupName);
						
					} else {
						// Create init consequences put WLED on live mode if requested
						if (j == 0 && (wledExist.name == "wled") && (local.parameters.wledParams.wledLive.get() == 1))
						{
							analyzerWLEDInitConseq();
						
							// put delay between actions							
							newTrigger.consequences.stagger.set(.100);
						}
						
						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);	
						} 
						if (ledfxAuto)
						{
							analyzerLedFXConseq("A");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("B")) {
					//newTrigger.color.set([1,.30,1,1]);
					newColor = local.parameters.defaultColors.segmentB.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectB.get();
					newPalette = local.parameters.defaultPalettes.paletteB.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("B", groupName);
						
					} else {


						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("B");					
						}						
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("C")) {
					
					//newTrigger.color.set([1,.11,.81,1]);	
					newColor = local.parameters.defaultColors.segmentC.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectC.get();
					newPalette = local.parameters.defaultPalettes.paletteC.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("C", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("C");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("D")) {
					//newTrigger.color.set([.1,.1,1,1]);
					newColor = local.parameters.defaultColors.segmentD.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectD.get();
					newPalette = local.parameters.defaultPalettes.paletteD.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("D", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("D");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("E")) {
					//newTrigger.color.set([.1,.1,.1,1]);
					newColor = local.parameters.defaultColors.segmentE.get();
					newTrigger.color.set(newColor);
					newEffect = local.parameters.defaultEffects.effectE.get();
					newPalette = local.parameters.defaultPalettes.paletteE.get();						

					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("E", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("E");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("F")) {					
					//newTrigger.color.set([.1,.01,.51,1]);
					newColor = local.parameters.defaultColors.segmentF.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectF.get();
					newPalette = local.parameters.defaultPalettes.paletteF.get();
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("F", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("F");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("G")) {					
					//newTrigger.color.set([1,.15,.51,1]);
					newColor = local.parameters.defaultColors.segmentG.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectG.get();
					newPalette = local.parameters.defaultPalettes.paletteG.get();
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("G", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("G");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("H")) {					
					//newTrigger.color.set([.1,.11,.61,1]);
					newColor = local.parameters.defaultColors.segmentH.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectH.get();
					newPalette = local.parameters.defaultPalettes.paletteH.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("H", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("H");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("I")) {					
					//newTrigger.color.set([0,.81,0,1]);
					newColor = local.parameters.defaultColors.segmentI.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectI.get();
					newPalette = local.parameters.defaultPalettes.paletteI.get();						
							
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("I", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("I");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("J")) {					
					//newTrigger.color.set([.51,0,.01,1]);
					newColor = local.parameters.defaultColors.segmentJ.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectJ.get();
					newPalette = local.parameters.defaultPalettes.paletteJ.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("J", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("J");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("K")) {					
					//newTrigger.color.set([.51,.10,.01,1]);
					newColor = local.parameters.defaultColors.segmentK.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectK.get();
					newPalette = local.parameters.defaultPalettes.paletteK.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("K", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("K");					
						}
					}
					
				} else if (SCAJSONContent.annotations[i].data[j].label.contains("L")) {					
					//newTrigger.color.set([.51,.20,.01,1]);
					newColor = local.parameters.defaultColors.segmentL.get();
					newTrigger.color.set(newColor);						
					newEffect = local.parameters.defaultEffects.effectL.get();
					newPalette = local.parameters.defaultPalettes.paletteL.get();						
					
					if (creColEffect === true && groupExist.name != "undefined")
					{
						analyzerCreConseq("L", groupName);
						
					} else {

						// Create consequences priority to WLED 
						if (wledAuto)
						{
							analyzerWLEDConseq(newColor,newEffect,newPalette);
							
						}
						if (ledfxAuto)
						{
							analyzerLedFXConseq("L");					
						}
					}
					
				} else {
					
					script.log("UNKNOWN Segment");
				}
			}
		}
		
	} else {
		
		script.log("Sonic exe not found");		
		util.showMessageBox("Sonic Analyzer !", "sonic-annotator not found", "warning", "OK");
	
	}
	
	segAnalyzerIsRunning = false;
	creColEffect = false;
}

// check to see if something to do
function rhythmAnalyzer (insequence, intargetFile, inSubBands, inThreshold, inMovingAvgWindowLength, inOnsetPeackWindowLength, inMinBPM, inMaxBPM)
{
	rhythmAnalyzerIsRunning = true;
	
	if (insequence == "" && intargetFile == "" )
	{
		script.log('Nothing to do');
		rhythmAnalyzerIsRunning = false;
		
	} else {
	
		sequence = insequence;
		targetFile = intargetFile;
		SubBands = inSubBands;
		Threshold = inThreshold;
		MovingAvgWindowLength = inMovingAvgWindowLength;
		OnsetPeackWindowLength = inOnsetPeackWindowLength;
		MinBPM = inMinBPM;
		MaxBPM = inMaxBPM;	
		
		util.showMessageBox("Sonic Analyzer ! BBC-RHYTHM ", "This could take a while ...." + moreInfo, "info", "Got it");

		shouldProcessRhythm = true;	
	}
}

// Run Sonic: wait and read received data from Rhythm Difference / create Mapping for WLED
function runrhythmAnalyzer (sequence, targetFile, SubBands, Threshold, MovingAvgWindowLength, OnsetPeackWindowLength, MinBPM, MaxBPM)
{
	rhythmAnalyzerIsRunning = true;
	
	// Sonic executable
	SCAnalyzerExeName = local.parameters.sonicParams.sonicAnnotatorLocation.getAbsolutePath();
	// check to see if Sonic exe exist
	if (util.fileExists(SCAnalyzerExeName) == 1)		
	{
		// we have some work to do, target first else file 
		if (sequence.contains("/"))
		{
			script.log('Retreive data from sequence : ' + sequence);
			var splitseq = sequence.split("/");
			var sequenceName = splitseq[2];
			var audioName = splitseq[4];
			// set newSequence to existing one
			var newSequence =  root.sequences.getItemWithName(sequenceName);
			// set newAudio to existing one 
			newAudio =  newSequence.layers.getItemWithName(audioName);
			// targetFile
			var targetFile = newAudio.clips.audioClip.filePath.getAbsolutePath();
			script.log('Target file  from sequence : ' + targetFile);								
					
		} else if (targetFile != ""){

			script.log('Create new sequence from filename :'+targetFile);
			// create new sequence / audio clip 
			var newSequence =  root.sequences.addItem('Sequence');
			util.delayThreadMS(10);			
			newAudio =  newSequence.layers.addItem('Audio');
			util.delayThreadMS(10);
			var newAudioClip =  newAudio.clips.addItem('audioClip');
			util.delayThreadMS(10);			
			newAudioClip.filePath.set(targetFile);
			
		} else {
			
			script.logError("Something wrong with rhythmAnalyzer....");
			return;
		}
		
		// transform file to read
		origTransform = local.parameters.sonicParams.rhythmTransformFile.getAbsolutePath();
		// plugin name
		SCAvampPluginName = "vamp:bbc-vamp-plugins:bbc-rhythm:diff";			
		// result output file
		SCAoutputFile = local.parameters.sonicParams.outputFile.getAbsolutePath();
		// if output file not set, we set it as audio clip file name under tmp folder
		if (SCAoutputFile == "")
		{						
			SCAoutputFile =  tempDIR + "/SCAnalyzer_" + getFilename(targetFile).replace(".mp3", "").replace(".wav", "") + ".json";
		}
		
		// check to see if transform file is necessary
		if (origTransform == "")
		{
			script.log("Using default parameters for the plugin, if you want to customize, select a transform");
			SCAnalyzerOptions = " -d "+SCAvampPluginName+" "+SCAoutputOptions+' "'+SCAoutputFile+'" ';
			
		} else {			

			script.log("Using transform file : "+origTransform);
			rhythmAnalyzerTransform (SubBands, Threshold, MovingAvgWindowLength, OnsetPeackWindowLength, MinBPM, MaxBPM);				
			SCAnalyzerOptions = "-t "+'"'+pathTransform+'"'+" "+SCAoutputOptions+' "'+SCAoutputFile+'" ';				
			
		}
		
		if (keepJson === false)
		{
			//set output file to blank to avoid reading old values in case sonic-annotator not run as should.
			util.writeFile(SCAoutputFile, "", true);
			
			var exeCMD = '"'+SCAnalyzerExeName+'" '+SCAnalyzerOptions+'"'+targetFile+'"';
			script.log('command to run : '+ exeCMD);
			// we execute the Sonic-annotator in blocking mode
			var launchresult = root.modules.os.launchProcess(exeCMD, true);
			script.log("Sonic Analyzer return code : "+launchresult);
			if (launchresult == "")
			{
				util.showMessageBox("Sonic Analyzer !", "Something wrong....", "warning", "OK");
				return;
			}				
		}

		// read the result 
		script.log("we read from : " + SCAoutputFile);
		var SCAJSONContent = util.readFile(SCAoutputFile,true);
		
		// create the container for result values
		local.values.removeContainer("Vamp plugin");
		var newContainer = local.values.addContainer("Vamp plugin");

		// create Vamp plugin values
		newContainer.addStringParameter("File Name","",SCAJSONContent.file_metadata.identifiers.filename);
		newContainer.addStringParameter("duration","",SCAJSONContent.file_metadata.duration);
		newContainer.addStringParameter("artist","",SCAJSONContent.file_metadata.artist);
		newContainer.addStringParameter("title","",SCAJSONContent.file_metadata.title);

		// only if mp3 file 
		if (targetFile.contains(".mp3")){
			newSequence.setName(SCAJSONContent.file_metadata.artist);
		}
		newAudio.setName(SCAJSONContent.file_metadata.identifiers.filename);
		
		// create Mapping from the json result file 
		var newLayersMapping =  newSequence.layers.addItem('Mapping');
		util.delayThreadMS(10);
		newLayersMapping.automation.range.set(0,7);
		newLayersMapping.setName("BBC");
		
		// set flag for wled auto actions creation
		var wledExist = root.modules.getItemWithName("WLED");			
		if (wledExist.name == "wled")
		{
			wledAuto = local.parameters.wledParams.createWLEDActions.get();						
		}
		
		for (var i = 0; i < SCAJSONContent.annotations.length; i += 1)
		{
			
			// set annotations in values
			var newannotationsContainer = newContainer.addContainer("annotations");		
			newannotationsContainer.addStringParameter("tools","",SCAJSONContent.annotations[i].annotation_metadata.annotation_tools);
			newannotationsContainer.addStringParameter("data source","",SCAJSONContent.annotations[i].annotation_metadata.data_source);
			// set annotator in values
			var newannotatorContainer = newannotationsContainer.addContainer("annotator");
			newannotatorContainer.addStringParameter("plugin_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.plugin_id);
			newannotatorContainer.addStringParameter("output_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.output_id);
			newannotatorContainer.addStringParameter("plugin_version ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.plugin_version);
			newannotatorContainer.addStringParameter("step_size ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.step_size);
			newannotatorContainer.addStringParameter("block_size ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.block_size);				
			newannotatorContainer.addStringParameter("sample_rate ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.sample_rate);
			newannotatorContainer.addStringParameter("transform_id ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.transform_id);
			// set parameters in values
			var newparametersContainer = newannotatorContainer.addContainer("parameters");
			newparametersContainer.addStringParameter("featureType ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.featureType);
			newparametersContainer.addStringParameter("nSegmentTypes ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.nSegmentTypes);
			newparametersContainer.addStringParameter("neighbourhoodLimit ","",SCAJSONContent.annotations[i].annotation_metadata.annotator.parameters.neighbourhoodLimit);
					
			script.log("Occurence : " + i + " data length : "+SCAJSONContent.annotations[i].data.length);
			
			// add delay to filters
			var testdelay = local.parameters.audioParams.globalDelay.get()/1000;
			if (testdelay != 0) 
			{
				var timeDelay = newLayersMapping.mapping.filters.getItemWithName("Delay");
				if (timeDelay.name == "undefined"){
					// create Delay
					var mapoutdelay = newLayersMapping.mapping.filters.addItem("Delay");
					util.delayThreadMS(10);
					mapoutdelay.filterParams.delay.set(testdelay);
				}		
			}			

			// retreive groupName if necessary		
			var groupName = "NotSet";
			linkToGroupNumber = local.parameters.groupParams.linkToGroupNumber.get();
			var groupscName = linkToGroupNumber;

			if (linkToGroupNumber != 0)
			{
				// check if custom variables exist for this group 
				// retreive groupe name 
				var groupNamevar = local.parameters.getChild("groupParams/" + linkToGroupNumber);
				var groupName = groupNamevar.get();
							
				if (groupName == "")
				{
					groupName = "NotSet";
				}
			}
			
			groupName = groupName.replace(" ","").toLowerCase();
			
			// Create mapping output (action)
			//
			// For Colors Loop
			if (local.parameters.defaultColors.loopColors.get() == 1)
			{
				// root.modules.sCAnalyzer.parameters.groupParams.linkToGroupNumber
				newLayersMapping.setName(newLayersMapping.name +"_COLOR");
				// group need to exist
				if (linkToGroupNumber != 0) 
				{
					createColorMapping(groupscName);
					
				} else { 
				
					script.log("Group not set for  :" + groupscName);
				
				}

			}
			// For WLED or others
			// root.modules.sCAnalyzer.parameters.groupParams.linkToGroupNumber
			wledExist = root.modules.getItemWithName("WLED");
			var split = local.parameters.mappingParams.split.get();
			var sequential = local.parameters.mappingParams.sequential.get();

			if (linkToGroupNumber != 0)				
			{				
				createIPMappings(groupscName);
				
				if (local.parameters.wledParams.createWLEDActions.get() == 1 && wledExist.name != "undefined")
				{
					newLayersMapping.setName(newLayersMapping.name+"_WLED");					
					analyzerWLEDMapping(groupscName, split, sequential);
				}
				
			} else {
				
				script.log("WLED Module does not exist or Group not set for  :" + groupscName);				
			}

			// For WLEDAudioSync
			var audioReplayFile = local.parameters.wLEDAudioSyncParams.replayFile.get();
			var moduleName = local.parameters.wLEDAudioSyncParams.moduleName.get();
			var duration = local.parameters.wLEDAudioSyncParams.duration.get();
			var allModules = local.parameters.wLEDAudioSyncParams.allModules.get();
			
			if (audioReplayFile != "" && moduleName != "")
			{
				newLayersMapping.setName(newLayersMapping.name+"_SYNC");
				createWLEDAudioSyncMapping();
			}			

			//
			// main mapping points loop creation (keys)
			//
			var pointsnumber = 0;			
			for (var j = 0; j < SCAJSONContent.annotations[i].data.length; j += 1)
			{
				// create new point
				// 0/0 for the first one.
				if (j == 0)
				{
					var newKey = newLayersMapping.automation.addKey(0,0);
					newLayersMapping.automation.getKeyAtPosition(0).easingType.set("Hold");					
					pointsnumber += 1;						
				}
				// select only value not egal to zero
				else if (SCAJSONContent.annotations[i].data[j].value != 0)
				{
					// test to see if need to create zero value before and after (this increase time x3)
					var createmin = local.parameters.mappingParams.resetMappingMaxValue.get();
					
					if (SCAJSONContent.annotations[i].data[j-1].value == 0) 							
					{
						if (createmin == 1)
						{
							var newKey = newLayersMapping.automation.addKey(SCAJSONContent.annotations[i].data[j-1].time,0);
							newLayersMapping.automation.getKeyAtPosition(SCAJSONContent.annotations[i].data[j-1].time).easingType.set("Hold");
							pointsnumber += 1;								
						}
					}					
					// retreive max value from rhythm difference
					if (SCAJSONContent.annotations[i].data[j].value > SCAJSONContent.annotations[i].data[j-1].value ) 
					{
						var maxvalue = SCAJSONContent.annotations[i].data[j].value;
						var maxtime = SCAJSONContent.annotations[i].data[j].time;
					}
					// create the key
					if (SCAJSONContent.annotations[i].data[j+1].value == 0) 
					{
						var newKey = newLayersMapping.automation.addKey(maxtime,maxvalue);
						newLayersMapping.automation.getKeyAtPosition(maxtime).easingType.set("Hold");
						pointsnumber += 1;
						if (createmin == 1)
						{
							var newKey = newLayersMapping.automation.addKey(SCAJSONContent.annotations[i].data[j+1].time,0);
							newLayersMapping.automation.getKeyAtPosition(SCAJSONContent.annotations[i].data[j+1].time).easingType.set("Hold");
							pointsnumber += 1;								
						}
					}						
				}					
			}
			// last key to zero
			var newKey = newLayersMapping.automation.addKey(maxtime+.1,0);
			newLayersMapping.automation.getKeyAtPosition(maxtime+.1).easingType.set("Hold");
		}
		
		script.log("Total number of points created : " + pointsnumber);

	} else {
		
		script.log("Sonic annotator app not found");		
		util.showMessageBox("Sonic Analyzer !", "sonic-annotator not found", "warning", "OK");	
	}
	
	rhythmAnalyzerIsRunning = false;
}

/*

Segmenter

*/

// Create Colors / Effects Based on segmentation... could be used on Mappings to reference value from Groupxx
// Called from 'command/utility/calcColorEffect'.
function calcColorEffect (insequence, inmapGroup, infeatureType, innSegmentTypes, inneighbourhoodLimit)
{
	script.log("We create colors/effects based on Segmenter");

	// file is null, we use only sequence Param
	targetFile = "";
	creColEffect = true;
	linkToGroupNumber = inmapGroup;
	
	segAnalyzer(insequence, targetFile, infeatureType, innSegmentTypes, inneighbourhoodLimit);	
}

// For one specific GroupName , this will create the corresponding action (consequence) for triggers
// depending on the segment name & based on segmentation
// values effect and color stored to CV group : can be used by Mapping/states etc ...
function analyzerCreConseq (segmentName, groupName)
{
	var numberofactions = 0;

	if (newColor[3] == 1)
	{
		// COLOR
		var conseq = newTrigger.consequences.addItem("Consequence");
		util.delayThreadMS(10);			
		newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
		conseq.setCommand("generic","","Set Parameter Value");
		conseq.setName("CVColor");
		var parcmd = conseq.getChild("command");
		parcmd.target.set("customVariables/"+ groupName + "/calculatedParams/segcolor");
		parcmd.component.set("All");
		parcmd.operator.set("Equals");
		var parcmdvalue = parcmd.getChild("value");
		parcmdvalue.set(newColor);
		
		numberofactions += 1;
		
	}

	if (newEffect != -1)
	{
		// EFFECT
		var conseq = newTrigger.consequences.addItem("Consequence");
		util.delayThreadMS(10);			
		newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
		conseq.setCommand("generic","","Set Parameter Value");
		conseq.setName("CVEffect");
		var parcmd = conseq.getChild("command");
		parcmd.target.set("customVariables/"+ groupName + "/calculatedParams/effectNumber");
		parcmd.component.set("All");
		parcmd.operator.set("Equals");
		var parcmdvalue = parcmd.getChild("value");
		parcmdvalue.set(newEffect);

		numberofactions += 1;

		if (numberofactions > 1)
		{
			// put delay between actions							
			newTrigger.consequences.stagger.set(.100);		
		}		
	}

}

// this will create the corresponding LedFX actions (scene / effect activation) for triggers
// depending on the segment name
function analyzerLedFXConseq (segmentName)
{
	var conseq = newTrigger.consequences.addItem("Consequence");
	util.delayThreadMS(10);
	newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);	

	if (useScenes)
	{
		conseq.setCommand("ledFX","LedFX-Scene","DeActivate ");
	} else {
		conseq.setCommand("ledFX","LedFX-Virtual","Apply Effect ");
	}
	var parcmd = conseq.getChild("command");
	if (useScenes)
	{
		local.parameters.ledFXParams.associatedScenes.set(segmentName);
		var myscene = local.parameters.ledFXParams.associatedScenes.get();
		if (myscene == "") {			
			myscene = local.parameters.ledFXParams.defaultSceneName.get();		
		}
		parcmd.scenename.set(myscene);
	} else {
		parcmd.devicename.set(local.parameters.ledFXParams.defaultVirtualDeviceName.get());
		local.parameters.ledFXParams.associatedEffects.set(segmentName);
		parcmd.effect.set(local.parameters.ledFXParams.associatedEffects.get());
	}
}

// this will create the corresponding action (consequence) for WLED : initial when ledfxAuto is true.
// if ledFX is true we assume that WLED need to be set to Live.
function analyzerWLEDInitConseq ()
{
	var conseq = newTrigger.consequences.addItem("Consequence");
	util.delayThreadMS(10);
	conseq.setCommand("WLED","WLED","WLED On-Off");

	var parcmd = conseq.getChild("command");
	parcmd.live.set(true);	
	parcmd.on.set(true);
} 

// this will create the corresponding action (consequence) for WLED 
function analyzerWLEDConseq (newColor,newEffect,newPalette)
{
	var numberofactions = 0;
	
	// this will create the corresponding action (consequence) for WLED : color
	if (newColor[3] == 1)
	{
		var conseqColor = newTrigger.consequences.addItem("Consequence");
		util.delayThreadMS(10);
		conseqColor.setCommand("WLED","WLED","WLED Color");
		newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
		
		var parcmdColor = conseqColor.getChild("command");
		parcmdColor.wledcolor.set(newColor);
		numberofactions += 1;
		
		if (local.parameters.wledParams.allIP.get() == 1 && local.parameters.groupParams.linkToGroupNumber.get() != 0)
		{
			analyzerWLEDallIPLoop (groupName, "c");
		}
	}
	
	// this will create the corresponding action (consequence) for WLED : effect
	if (newEffect != -1)
	{
		var conseqe = newTrigger.consequences.addItem("Consequence");
		util.delayThreadMS(10);		
		conseqe.setCommand("WLED","WLED","WLED Effect");
		newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
		
		var parcmde = conseqe.getChild("command");
		parcmde.wledeffect.set(newEffect);	
		numberofactions += 1;
		
		if (local.parameters.wledParams.allIP.get() == 1 && local.parameters.groupParams.linkToGroupNumber.get() != 0)
		{
			analyzerWLEDallIPLoop (groupName, "e");
		}		
	}

	// this will create the corresponding action (consequence) for WLED : palette
	if (newPalette != -1)
	{
		var conseqp = newTrigger.consequences.addItem("Consequence");
		util.delayThreadMS(10);		
		conseqp.setCommand("WLED","WLED","WLED Palette");
		newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);		

		var parcmdp = conseqp.getChild("command");
		parcmdp.palette.set(newPalette);	
		numberofactions += 1;
		
		if (local.parameters.wledParams.allIP.get() == 1 && local.parameters.groupParams.linkToGroupNumber.get() != 0)
		{
			analyzerWLEDallIPLoop (groupName, "p");
		}		
	}

	if (numberofactions > 1)
	{
		// put delay between actions							
		newTrigger.consequences.stagger.set(.100);		
	}

}

// this will create the corresponding action (consequence) for All WLED  IP
function analyzerWLEDallIPLoop (groupName, action)
{
	if (groupName == "undefined")
	{
		script.log( "CV Group not defined : "  + groupName);
		
	} else {
		
		// retreive variables
		var cvGroup = root.customVariables.getItemWithName(groupName);
		
		if (cvGroup.name == "undefined")
		{
			script.log( "Not able to find CV Group : "  + groupName);
			
		} else {
			
			var additionalIP = cvGroup.variables.getItems();
			
			if (additionalIP)
			{
				script.log("WLED -- Number of additional CV Group variables : "+additionalIP.length);
				
				for ( var v = 0; v < additionalIP.length; v++) 
				{ 
			
					if (additionalIP[v].name.contains("ip"))
					{				
						ipname = additionalIP[v].name;
						
						var newIP = additionalIP[v].getChild(ipname);				
						var addIP = newIP.get();
						
						if (addIP != "0.0.0.0" && addIP != "")
						{
							script.log("Add consequences for : " +ipname + " with IP : "+addIP);
							
							if (action == "c")
							{
								var conseqColors = newTrigger.consequences.addItem("Consequence");
								util.delayThreadMS(10);
								conseqColors.setCommand("WLED","WLED","WLED Color");
								newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
								
								var parcmdColors = conseqColors.getChild("command");
								parcmdColors.wledcolor.set(newColor);
								parcmdColors.wledIP.set(addIP);
								numberofactions += 1;
								
							} else if (action == "e") {
							
								var conseqEffect = newTrigger.consequences.addItem("Consequence");
								util.delayThreadMS(10);		
								conseqEffect.setCommand("WLED","WLED","WLED Effect");
								newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);
								
								var parcmdEffect = conseqEffect.getChild("command");
								parcmdEffect.wledeffect.set(newEffect);
								parcmdEffect.wledIP.set(addIP);								
								numberofactions += 1;							
							
							} else if (action == "p") {
								
								var conseqPallete = newTrigger.consequences.addItem("Consequence");
								util.delayThreadMS(10);		
								conseqPallete.setCommand("WLED","WLED","WLED Palette");
								newTrigger.consequences.delay.set(local.parameters.audioParams.globalDelay.get()/1000);		

								var parcmdPalette = conseqPallete.getChild("command");
								parcmdPalette.palette.set(newPalette);	
								parcmdPalette.wledIP.set(addIP);
								numberofactions += 1;										
							
							} else {
								
								script.log("unknown action");								
							}							
											
						} else {
						
							script.log("We bypass this one (value) : "+additionalIP[v].name);
						}
						
					} else {
						
						script.log("We bypass this one (name) : "+additionalIP[v].name);
						
					}
				}
			}			
		}
	}
}

/*

Mapping

*/
 
// Mapping for WLED
function analyzerWLEDMapping (groupscName, split, sequential)
{
	
	var scGroup = local.parameters.getChild("groupParams/"+ groupscName);		
	var cvGroup = root.customVariables.getItemWithName(scGroup.get());
	var testWS = local.parameters.wledParams.useWebSocket.get();

	script.log("Group name for Mapping : " + cvGroup.name);

	if (cvGroup.name != "undefined")
	{
		// retreive variables
		var additionalIP = cvGroup.variables.getItems();
		
		if (additionalIP)
		{
			script.log("WLED -- Number of additional IP address : " + additionalIP.length);
			//var portNumber = root.modules.wledsync.parameters.output.remotePort.get();
			
			// create WLED main cmd with calculated IP 
			if (split == 1 || sequential == 1 || local.parameters.wledParams.allIP.get() == 0)
			{
				createWLEDMapping();
				
			} else {
				
				// create WLED main cmd for each IP in custom variables group
				for ( var k = 0; k < additionalIP.length; k++) 
				{
					if (additionalIP[k].name.contains("ip"))
					{				
						ipname = additionalIP[k].name;
						
						var newIP = additionalIP[k].getChild(ipname);				
						var addIP = newIP.get();
						
						if (addIP != "0.0.0.0" && addIP != "")
						{
							createWLEDMapping();
							
						} else {
						
							script.log("We bypass this one: "+additionalIP[k].name);
						}
						
					} else {
						
						script.log("We bypass this one: "+additionalIP[k].name);
						
					}
				}
			}
		}
	}
}

function createWLEDMapping()
{	
	// create ws 
	if (testWS == 1)
	{
		for (var n = 0; n < additionalIP.length; n++) 
		{ 
			if (additionalIP[n].name.contains("ip"))
			{				
				var wsipname = additionalIP[n].name;
				
				var wsnewIP = additionalIP[n].getChild(wsipname);
				var wsaddIP = wsnewIP.get();
				
				if (wsaddIP != "0.0.0.0" && wsaddIP != "")
				{
					createWS(wsaddIP);
				}				
			}
		}
	}

	// add math / multiply to filters
	var mathTest = newLayersMapping.mapping.filters.getItemWithName("Math");
	if (mathTest == undefined){
		// create Math
		var mapoutmath = newLayersMapping.mapping.filters.addItem("Math");
		util.delayThreadMS(10);
		mapoutmath.filterParams.operation.set("Multiply");
		mapoutmath.filterParams.value.set(50);		
	}

	var preset = local.parameters.wledParams.preset.get();
	
	// create output
	var mapoutw = newLayersMapping.mapping.outputs.addItem("mappingOutput");
	util.delayThreadMS(10);
	mapoutw.setName(groupName);
	mapoutw.setCommand("WLED","WLED","WLED Main");

	var parcmdw = mapoutw.getChild("command");
	
	// set params from Group
	parcmdw.wledIP.set(addIP);
	
	// Create Param Ref for IP
	if (split == 1)
	{
		var refParam = parcmdw.wledIP.getControlAddress();
		var toValue = cvGroup.calculatedParams.ip.getControlAddress();
		createParamReferenceTo(refParam,toValue);
		
	} else if (sequential == 1)
	{
		var refParam = parcmdw.wledIP.getControlAddress();
		var toValue = cvGroup.calculatedParams.ipList.getControlAddress();
		createParamReferenceTo(refParam,toValue);		
	}
	
	//
	parcmdw.live.set(false);
	parcmdw.on.set(true);
	if (testWS == 1)
	{
		parcmdw.udp.set(false);
		
	} else {
		
		parcmdw.udp.set(true);
	}

	// Create Param Ref for Color
	if (local.parameters.defaultColors.loopColors.get() == 1)		
	{
		var refParam = parcmdw.wledcolor.getControlAddress();
		var toValue = cvGroup.calculatedParams.mapcolor.getControlAddress();
		createParamReferenceTo(refParam,toValue);
	}
	// if default values in group exist we take them
	if (cvGroup.defaultWLEDParams)
	{
		parcmdw.uDPPort.set(cvGroup.defaultWLEDParams.uDPPort.get());	
		parcmdw.wledcolor.set(cvGroup.defaultWLEDParams.wledcolor.get());
		parcmdw.bgcolor.set(cvGroup.defaultWLEDParams.bgcolor.get());
		parcmdw.brightness.set(cvGroup.defaultWLEDParams.brightness.get());
		parcmdw.wledeffect.set(cvGroup.defaultWLEDParams.wledeffect.get());	
		parcmdw.fxspeed.set(cvGroup.defaultWLEDParams.fxspeed.get());
		parcmdw.fxintensity.set(cvGroup.defaultWLEDParams.fxintensity.get());
		parcmdw.palette.set(cvGroup.defaultWLEDParams.palette.get());	
	}		
	//
	parcmdw.wledgroup.set(cvGroup.name);
	parcmdw.wledgroup.setAttribute("readOnly",false);
	parcmdw.wledws.set(testWS);
	parcmdw.wledws.setAttribute("readOnly",false);
	parcmdw.wledps.set(preset);
	parcmdw.wledps.setAttribute("readOnly",false);

	// set the link active for brightness
	var brightControl = parcmdw.brightness.getControlAddress();
	var brightObj = root.getChild(brightControl).getParent();
	brightObj.loadJSONData({
		"paramLinks": {
			"brightness": {
				"linkType": 1,
				"mappingValueIndex": 0
			}
		}	
	});
	//	
}

// Mappings output for IPs: modulo or sequential linked to scGroupxx
function createIPMappings (groupscName)
{	
	var grp = local.parameters.getChild("groupParams/"+ groupscName);		
	var cvGroup = root.customVariables.getItemWithName(grp.get());

	if (split == 1)
	{
		newLayersMapping.setName(newLayersMapping.name+"_IP");
		// create output
		var mapout = newLayersMapping.mapping.outputs.addItem();
		util.delayThreadMS(10);
		mapout.setCommand("SCAnalyzer","SCAnalyzer","Script callback");
		mapout.setName("CVIPModulo");
		var parcmd = mapout.getChild("command");
		// set script callback name
		parcmd.callback.set("analyzerIPModuloLoop");
		
		// create arguments 
		var argmapout = parcmd.getChild("Arguments");
		var varargmapout = argmapout.addItem("String");
		util.delayThreadMS(10);

		// by default, linkType is active for argument, this will remove it --> linkType : 0 , change the name to 'GroupName' and set value to group name
		varargmapout.loadJSONData({
			"parameters": [
				{
					"value": cvGroup.name,
					"controlAddress": "/#1"
				}
			],
			"niceName": "GroupName",
			"type": "String",
			"param": {
				"value": cvGroup.name,
				"controlAddress": mapout.getControlAddress() + "/command/arguments/groupName/#1"
			},
			"paramLinks": {
				"linkType": 0
			}
		});
		
	} else if (sequential == 1) {
		
		newLayersMapping.setName(newLayersMapping.name+"_IP");
		
		// generate IP list
		generateIPList(cvGroup.name);

		// create output
		var mapout = newLayersMapping.mapping.outputs.addItem();
		util.delayThreadMS(10);
		mapout.setCommand("SCAnalyzer","SCAnalyzer","Script callback");
		mapout.setName("CVIPSequential");
		var parcmd = mapout.getChild("command");
		// set script callback name
		parcmd.callback.set("analyzerIPSequentialLoop");
		
		// create arguments 
		var argmapout = parcmd.getChild("Arguments");
		var varargmapout = argmapout.addItem("String");
		util.delayThreadMS(10);

		// by default, linkType is active for argument, this will remove it --> linkType : 0 , change the name to 'GroupName' and set value to group name
		varargmapout.loadJSONData({
			"parameters": [
				{
					"value": cvGroup.name,
					"controlAddress": "/#1"
				}
			],
			"niceName": "GroupName",
			"type": "String",
			"param": {
				"value": cvGroup.name,
				"controlAddress": mapout.getControlAddress() + "/command/arguments/groupName/#1"
			},
			"paramLinks": {
				"linkType": 0
			}
		});
	}
}

// create mapping output for color : can be used to change WLED color or something else
// store value in CV Group
function createColorMapping(groupscName)
{
	// retreive group name from scGroupxx
	var grp = local.parameters.getChild("groupParams/"+ groupscName);		
	var cvGroup = root.customVariables.getItemWithName(grp.get());

	// create output
	var mapout = newLayersMapping.mapping.outputs.addItem();
	util.delayThreadMS(10);
	mapout.setCommand("SCAnalyzer","SCAnalyzer","Script callback");
	mapout.setName("CVColors");
	var parcmd = mapout.getChild("command");
	// set script callback name
	parcmd.callback.set("analyzerColorLoop");
	
	// create arguments 
	var argmapout = parcmd.getChild("Arguments");
	var varargmapout = argmapout.addItem("String");
	util.delayThreadMS(10);
	
	// by default, linkType is active for argument, this will remove it --> linkType : 0 , change the name to 'GroupName' and set value to group name
	varargmapout.loadJSONData({
		"parameters": [
			{
				"value": cvGroup.name,
				"controlAddress": "/#1"
			}
		],
		"niceName": "GroupName",
		"type": "String",
		"description": "Groupe name from /modules/sCAnalyzer/parameters/groupParams/groupXX",
		"param": {
			"value": cvGroup.name,
			"controlAddress": mapout.getControlAddress() + "/command/arguments/groupName/#1"
		},
		"paramLinks": {
			"linkType": 0
		}
	});
}

// Mapping for WLEDAudioSync
function createWLEDAudioSyncMapping()
{
	// loop true all WLEDAudioSync modules if requested
	
	if (allModules == 1) 
	{
		var moduleNumbers = root.modules.getItems();

		for ( var i = 0; i < moduleNumbers.length ; i++)		
		{	
			if ( moduleNumbers[i].getType().contains("WLEDAudioSync"))
			{
				var WLEDAudioExist = root.modules.getItemWithName(moduleNumbers[i].name);
				
				if (WLEDAudioExist.name != "undefined")
				{
					// create output
					var mapoutwas = newLayersMapping.mapping.outputs.addItem("mappingOutput");
					util.delayThreadMS(10);
					mapoutwas.setName(WLEDAudioExist.name);
					mapoutwas.setCommand(WLEDAudioExist.niceName,"Replay","Snapshot");

					var parcmdwas = mapoutwas.getChild("command");
					
					// set params 
					parcmdwas.fileName.set(audioReplayFile);
					parcmdwas.duration.set(duration);
					
				} else {
				
					script.log('Module WLEDAudioSync removed ..: ' + WLEDAudioExist.name);
				}
			}
		}

	} else {
		
		var WLEDAudioExist = root.modules.getItemWithName(moduleName);
		
		if (WLEDAudioExist.name != "undefined")
		{
			// create output
			var mapoutwas = newLayersMapping.mapping.outputs.addItem("mappingOutput");
			util.delayThreadMS(10);
			mapoutwas.setName(moduleName);
			mapoutwas.setCommand(WLEDAudioExist.niceName,"Replay","Snapshot");

			var parcmdwas = mapoutwas.getChild("command");
			
			// set params 
			parcmdwas.fileName.set(audioReplayFile);
			parcmdwas.duration.set(duration);
			
		} else {
		
			script.log('Module WLEDAudioSync removed ..: ' + moduleName);
		}
	}
}

/*

Util

*/


// Create custom variables group
function createCustomVariables(scGroup)
{
	script.log("Custom group creation for : " + scGroup);

	// retreive groupe name 
	var groupNamevar = local.parameters.getChild("groupParams/" + scGroup);
	var groupName = groupNamevar.get();
	groupName = groupName.replace(" ","").toLowerCase();
	var groupExist = root.customVariables.getItemWithName(groupName);

	if (groupName != "")
	{
		if (groupExist.name == "undefined")
		{
			// create variable group
			var newGroup = root.customVariables.addItem(groupName);
			util.delayThreadMS(10);
			newGroup.setName(groupName);

			// add Wled Variables
			var newIP = newGroup.variables.addItem("String Parameter");
			util.delayThreadMS(10);
			var newIPV = newIP.getChild(newIP.name);
			newIPV.set("0.0.0.0");
			newIP.setName("IP");		
			
			wledExist = root.modules.getItemWithName("WLED");
			
			if (wledExist.name != "undefined") 
			{				
				// create Container for default WLED group values 
				var newwledContainer = newGroup.addContainer("Default WLED Params");
				
				// add Wled Parameters
				newUDP = newwledContainer.addBoolParameter("UDP","Send data thru UDP",true);
				newUDP.setAttribute("readOnly", true);
				newUDP.setAttribute("saveValueOnly",false);
				newUDPPort = newwledContainer.addIntParameter("UDPPort","Port number",0,0,65535);
				newUDPPort.setAttribute("saveValueOnly",false);
				newwledcolor = newwledContainer.addColorParameter("wledcolor","Main WLED Color",[1,1,1]);
				newwledcolor.setAttribute("saveValueOnly",false);			
				newbgcolor = newwledContainer.addColorParameter("bgcolor","Bg Color",[0,0,0]);
				newbgcolor.setAttribute("saveValueOnly",false);						
				newbri = newwledContainer.addFloatParameter("brightness","Bri",127,0,255);
				newbri.setAttribute("saveValueOnly",false);									
				newwledeffect = newwledContainer.addIntParameter("wledeffect","Effect index",0,0,200);
				newwledeffect.setAttribute("saveValueOnly",false);									
				newfx = newwledContainer.addFloatParameter("fxspeed","Effect speed",127,0,255);
				newfx.setAttribute("saveValueOnly",false);									
				newfxin = newwledContainer.addFloatParameter("fxintensity","Intensity number",64,0,255);
				newfxin.setAttribute("saveValueOnly",false);						
				newpalette = newwledContainer.addIntParameter("palette","Palette index",0,0,200);
				newpalette.setAttribute("saveValueOnly",false);									

			} 

			// create Container for calcul of IP/color/effect/index/mapcolor: used by script or link
			var newtmpwledContainer = newGroup.addContainer("Calculated Params");

			newGroupIP = newtmpwledContainer.addStringParameter("IP","IP to use for Effect. calculated by script","0.0.0.0");
			newGroupIP.setAttribute("readOnly",true);
			newGroupIP.setAttribute("saveValueOnly",false);
			newGroupIPList = newtmpwledContainer.addEnumParameter("IP List","IP List to use for Effect. From first to last with loop. Populated from variables IPxx","0.0.0.0");
			newGroupIPList.setAttribute("readOnly",true);
			newGroupIPList.setAttribute("saveValueOnly",false);			
			newGroupindex = newtmpwledContainer.addIntParameter("Index","Number of iteration. calculated by script",0);
			newGroupindex.setAttribute("readOnly",true);
			newGroupindex.setAttribute("saveValueOnly",false);	
			newGroupcolor = newtmpwledContainer.addColorParameter("Segcolor","Segmenter Color",[1,1,1]);
			newGroupcolor.setAttribute("readOnly",true);
			newGroupcolor.setAttribute("saveValueOnly",false);				
			newGroupeffect = newtmpwledContainer.addIntParameter("Effect number","Effect index.",0);
			newGroupeffect.setAttribute("readOnly",true);
			newGroupeffect.setAttribute("saveValueOnly",false);
			newGroupmapcolor = newtmpwledContainer.addColorParameter("Mapcolor","Mapping Color",[1,1,1]);
			newGroupmapcolor.setAttribute("readOnly",true);
			newGroupmapcolor.setAttribute("saveValueOnly",false);
			newGroupmapindex = newtmpwledContainer.addIntParameter("ColorIndex","Number of iteration. calculated by script",0);
			newGroupmapindex.setAttribute("readOnly",true);
			newGroupmapindex.setAttribute("saveValueOnly",false);	
			
			util.showMessageBox("Add new Group", "Custom Variables group created, go there and associate the IP addresses", "Info", "Got it");
		
		} else {
			
			util.showMessageBox("Add new Group", "Custom Variables group already exist", "Info", "Got it");
		}		
	}
}

// create WS module for an IP address
function createWS (wsip)
{
	if (wsip != "")
	{
		var ipname = wsip + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{	
			script.log("Module WS exist");
			
		} else {
			
			var newWSModule = root.modules.addItem("WebSocket Client");
			util.delayThreadMS(10);
			newWSModule.parameters.protocol.set("JSON");
			newWSModule.parameters.autoAdd.set(false);
			newWSModule.parameters.serverPath.set(wsip+"/ws");
			newWSModule.setName(wsip+"-"+"ws");
			
		}
		
	} else {
		
		scrip.log("Nothing to do for blank IP");		
	}
}


// Read all IP from custom variables group, select modulo index value from xx(max 12) to 1 
function analyzerIPModuloLoop(groupName)
{
	var loopip = root.customVariables.getItemWithName(groupName);
	var loopipAdditionalIP = loopip.variables.getItems();
	var loopIndex = loopip.calculatedParams.index.get() + 1;
	
	if (loopipAdditionalIP)
	{
		for ( var l = (loopipAdditionalIP.length -1); l >= 0; l--) 
		{ 
	
			if (loopipAdditionalIP[l].name.contains("ip"))
			{				
				var loopipIPName = loopipAdditionalIP[l].name;
				
				var loopipNewIP = loopipAdditionalIP[l].getChild(loopipIPName);
				var loopipAddIP = loopipNewIP.get();
				
				if (loopipAddIP != "0.0.0.0" && loopipAddIP != "")
				{
					var numtest = loopIndex % (l + 1);
				
					if (numtest == 0)
					{
						loopip.calculatedParams.ip.set(loopipAddIP);
						loopip.calculatedParams.index.set(loopIndex);
						break;
					}					
					
				} else {
				
					script.log("We bypass this one (value): "+loopipAdditionalIP[l].name);
				}
				
			} else {
				
				script.log("We bypass this one (not ip name): "+loopipAdditionalIP[l].name);				
			}
		}
		
	} else {

		script.log('Group does not exist or no IP !!');		
	
	}
}

// Read all active Default Colors  and set the value into root.customVariables.(groupName).parameters.mapcolor depend on index
// used as script callback in mapping output
function analyzerColorLoop(groupName)
{	
	var loopColor = [];
	var loopgrp = root.customVariables.getItemWithName(groupName);
	
	if (loopgrp.name != "undefined")
	{
		var loopIndex = loopgrp.calculatedParams.colorIndex.get() + 1;
		loopgrp.calculatedParams.colorIndex.set(loopIndex);
		
		for ( var l = 12; l > 0; l--) 
		{ 
			if ( l == 12 )
			{
				loopColor = local.parameters.defaultColors.segmentL.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 11 ) {
				loopColor = local.parameters.defaultColors.segmentK.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 10 ) {
				loopColor = local.parameters.defaultColors.segmentJ.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 9 ) {
				loopColor = local.parameters.defaultColors.segmentI.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 8 ) {
				loopColor = local.parameters.defaultColors.segmentH.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 7 ) {
				loopColor = local.parameters.defaultColors.segmentG.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 6 ) {
				loopColor = local.parameters.defaultColors.segmentF.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 5 ) {
				loopColor = local.parameters.defaultColors.segmentE.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 4 ) {
				loopColor = local.parameters.defaultColors.segmentD.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 3 ) {
				loopColor = local.parameters.defaultColors.segmentC.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 2 ) {
				loopColor = local.parameters.defaultColors.segmentB.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} else if ( l == 1 ) {
				loopColor = local.parameters.defaultColors.segmentA.get();
				if (loopColor[3] == 1)
				{
					var numtest = loopIndex % (l);				
					if (numtest == 0)
					{
						loopgrp.calculatedParams.mapcolor.set(loopColor);
						break;
					}
				}
			} 
		}
	}
}

// Play all sequences in sequential order From index 0 to last sequence number
function analyzerRunshow (play)  
{

	script.log('Play all sequences in sequential order ....');
	
	analyzerResetIndex ();

	if (play == 1)
	{
		var allsequences = root.sequences.getItems();
		numberToPlay = allsequences.length;
		lastsequence = 0;
		playseq = root.sequences.getItemAt(lastsequence);
		script.setUpdateRate(1);
		
	} else {
		
		numberToPlay = 0;
		script.log("Stop playing, release control");
		script.setUpdateRate(1);
	}	
}

// Stop all sequences
function analyzerResetshow ()  
{
	script.log('Reset all sequences to begin ....');
	numberToPlay = 0;

	var allsequences = root.sequences.getItems();
	numberToStop = allsequences.length;
	
	for (var i = 0; i < numberToStop; i += 1)
	{
		
		playseq = root.sequences.getItemAt(i);
		playseq.stop.trigger();

	}
	
	analyzerResetIndex ();	
}

// reset index value to zero 
function analyzerResetIndex ()
{
	script.log('Reset all index from variables groups to zero ....');
	
	var allgroups = root.customVariables.getItems();
	
	for (var j = 0; j < allgroups.length; j += 1)
	{
	
		var customGroup = root.customVariables.getItemAt(j);
		if (customGroup.calculatedParams.index.name != "undefined")
		{
			customGroup.calculatedParams.index.set(0);			
		}
		if (customGroup.calculatedParams.colorIndex.name != "undefined")
		{
			customGroup.calculatedParams.colorIndex.set(0);
		}
	}	
}


// load ledFX enum param from file
function analyzerLoadenum ()
{
	writeLedFXFileEffects = false;
	local.parameters.ledFXParams.associatedEffects.removeOptions();
	
	var datafile = util.readFile(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+enumFile,true);
	for (var i = 0; i < datafile.length; i +=1 )
	{
		local.parameters.ledFXParams.associatedEffects.addOption(datafile[i].key,datafile[i].value);		
	}
	
	writeLedFXFileEffects = true;
}

// load ledFX enum Scenes param from file
function analyzerLoadenumScenes ()
{
	writeLedFXFileScenes = false;
	local.parameters.ledFXParams.associatedScenes.removeOptions();
	
	var datafile = util.readFile(homeDIR + "/Chataigne/Modules/SCAnalyzer/"+enumScenesFile,true);
	for (var i = 0; i < datafile.length; i +=1 )
	{
		local.parameters.ledFXParams.associatedScenes.addOption(datafile[i].key,datafile[i].value);		
	}
	
	writeLedFXFileScenes = true;
}

// load default effects for ledFX
function analyzerLoaddefault()
{
	writeLedFXFileEffects = false;
	
	var defaulteffects = [
				'A:Power',
				'B:Bands',
				'C:Marching',
				'D:BPM Strobe',
				'E:Equalizer',
				'F:Energy',
				'G:Magnitude',
				'H:Spectrum',
				'I:Strobe',
				'J:Blocks',
				'K:Melt',
				'L:Bar'
	];
	
	local.parameters.ledFXParams.associatedEffects.removeOptions();
	
	for (var i = 0; i < defaulteffects.length; i +=1 )
	{
		var key = defaulteffects[i].split(":")[0];
		var value = defaulteffects[i].split(":")[1];
		local.parameters.ledFXParams.associatedEffects.addOption(key,value);		
	}
	
	writeLedFXFileEffects = true;
}

// Default colors
function activateColors ()
{
	var activateColor = local.parameters.defaultColors.segmentA.get();
	local.parameters.defaultColors.segmentA.set([activateColor[0],activateColor[1],activateColor[2],1]);
	var activateColor = local.parameters.defaultColors.segmentB.get();
	local.parameters.defaultColors.segmentB.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentC.get();
	local.parameters.defaultColors.segmentC.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentD.get();
	local.parameters.defaultColors.segmentD.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentE.get();
	local.parameters.defaultColors.segmentE.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentF.get();
	local.parameters.defaultColors.segmentF.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentG.get();
	local.parameters.defaultColors.segmentG.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentH.get();
	local.parameters.defaultColors.segmentH.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentI.get();
	local.parameters.defaultColors.segmentI.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentJ.get();
	local.parameters.defaultColors.segmentJ.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentK.get();
	local.parameters.defaultColors.segmentK.set([activateColor[0],activateColor[1],activateColor[2],1]);	
	var activateColor = local.parameters.defaultColors.segmentL.get();
	local.parameters.defaultColors.segmentL.set([activateColor[0],activateColor[1],activateColor[2],1]);	
}

function deActivateColors ()
{
	var activateColor = local.parameters.defaultColors.segmentA.get();
	local.parameters.defaultColors.segmentA.set([activateColor[0],activateColor[1],activateColor[2],0.75]);
	var activateColor = local.parameters.defaultColors.segmentB.get();
	local.parameters.defaultColors.segmentB.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentC.get();
	local.parameters.defaultColors.segmentC.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentD.get();
	local.parameters.defaultColors.segmentD.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentE.get();
	local.parameters.defaultColors.segmentE.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentF.get();
	local.parameters.defaultColors.segmentF.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentG.get();
	local.parameters.defaultColors.segmentG.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentH.get();
	local.parameters.defaultColors.segmentH.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentI.get();
	local.parameters.defaultColors.segmentI.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentJ.get();
	local.parameters.defaultColors.segmentJ.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentK.get();
	local.parameters.defaultColors.segmentK.set([activateColor[0],activateColor[1],activateColor[2],0.75]);	
	var activateColor = local.parameters.defaultColors.segmentL.get();
	local.parameters.defaultColors.segmentL.set([activateColor[0],activateColor[1],activateColor[2],0.75]);		
}

// Default Effects
function resetEffects ()
{
	local.parameters.defaultEffects.effectA.set(-1);
	local.parameters.defaultEffects.effectB.set(-1);
	local.parameters.defaultEffects.effectC.set(-1);
	local.parameters.defaultEffects.effectD.set(-1);
	local.parameters.defaultEffects.effectE.set(-1);
	local.parameters.defaultEffects.effectF.set(-1);
	local.parameters.defaultEffects.effectG.set(-1);
	local.parameters.defaultEffects.effectH.set(-1);
	local.parameters.defaultEffects.effectI.set(-1);
	local.parameters.defaultEffects.effectJ.set(-1);
	local.parameters.defaultEffects.effectK.set(-1);
	local.parameters.defaultEffects.effectL.set(-1);
}

// Default Palettes
function resetPalettes ()
{
	local.parameters.defaultPalettes.paletteA.set(-1);
	local.parameters.defaultPalettes.paletteB.set(-1);
	local.parameters.defaultPalettes.paletteC.set(-1);
	local.parameters.defaultPalettes.paletteD.set(-1);
	local.parameters.defaultPalettes.paletteE.set(-1);
	local.parameters.defaultPalettes.paletteF.set(-1);
	local.parameters.defaultPalettes.paletteG.set(-1);
	local.parameters.defaultPalettes.paletteH.set(-1);
	local.parameters.defaultPalettes.paletteI.set(-1);
	local.parameters.defaultPalettes.paletteJ.set(-1);
	local.parameters.defaultPalettes.paletteK.set(-1);
	local.parameters.defaultPalettes.paletteL.set(-1);
}


// retreive temp location
function analyzerTMP ()
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

// create transform file for QM segmenter from skeleton
function segAnalyzerTransform (featureType, nSegmentTypes, neighbourhoodLimit)
{
	var pluginName = SCAvampPluginName.replace(":","-");
	pathTransform = tempDIR + "/" + pluginName+".nc3";
	var qmsegmentTransform = util.readFile(origTransform);
	
	qmsegmentTransform = qmsegmentTransform.replace('value "featureType"','value '+'"'+featureType+'"');
	qmsegmentTransform = qmsegmentTransform.replace('value "nSegmentTypes"','value '+'"'+nSegmentTypes+'"');
	qmsegmentTransform = qmsegmentTransform.replace('value "neighbourhoodLimit"','value '+'"'+neighbourhoodLimit+'"');
	
	util.writeFile(pathTransform, qmsegmentTransform, true);
}

// create transform file for BBC Rhythm from skeleton
function rhythmAnalyzerTransform (SubBands, Threshold, MovingAvgWindowLength, OnsetPeackWindowLength, MinBPM, MaxBPM)
{
	var pluginName = SCAvampPluginName.replace(":","-");
	pathTransform = tempDIR + "/" + pluginName+".nc3";
	var bbcrhythmTransform = util.readFile(origTransform);
	
	bbcrhythmTransform = bbcrhythmTransform.replace('value "numBands"','value '+'"'+SubBands+'"');
	bbcrhythmTransform = bbcrhythmTransform.replace('value "threshold"','value '+'"'+Threshold+'"');
	bbcrhythmTransform = bbcrhythmTransform.replace('value "average_window"','value '+'"'+MovingAvgWindowLength+'"');
	bbcrhythmTransform = bbcrhythmTransform.replace('value "peak_window"','value '+'"'+OnsetPeackWindowLength+'"');
	bbcrhythmTransform = bbcrhythmTransform.replace('value "min_bpm"','value '+'"'+MinBPM+'"');
	bbcrhythmTransform = bbcrhythmTransform.replace('value "max_bpm"','value '+'"'+MaxBPM+'"');	
	
	util.writeFile(pathTransform, bbcrhythmTransform, true);
}


// One click Create Show for a mp3 file
// Step 1
function createShow (targetFile)
{
	script.log("We create sequence for automatic show");
	
	// reset all index value to zero
	analyzerResetIndex();
	
	// SEGMENTER part

	// First, execute segmenter with default values
	moreInfo = "Step 1";	
	keepJson = false;
	
	segAnalyzer("", targetFile, 1, 10, 4);	
	createShowStep2 = true;	
}

// check if step 1 is finished
function checkStep1()
{
	if (segAnalyzerIsRunning === true) 
	{
		script.log('Seganalyzer is running');
		
	} else {
	
		createShowStep2 = false;
		showStep2();		
	}
}

function showStep2 ()
{
	// retreive the new Audio clip address to pass as parameter, this will create data on current sequence for next segmenter / rhythm.
	var seqaddr = newAudio.getControlAddress();
	
	// Second, create colors/effects from existing JSON output file 
	moreInfo = "Step 2";	
	keepJson = true;
	creColEffect = true;
	linkToGroupNumber = local.parameters.groupParams.linkToGroupNumber.get();
	
	script.log("Create sequence for : " + seqaddr);
	
	if (linkToGroupNumber != 0)
	{
		script.log("run segmenter");
		segAnalyzer(seqaddr, "", 1, 10, 4);	
	}
	
	createShowStep3 = true;	
}

// check is step 2 is finished
function checkStep2()
{
	if (segAnalyzerIsRunning === true)
	{
		script.log('Seganalyzer is running');
		
	} else {
		
		createShowStep3 = false;
		showStep3();		
	}	
}

function showStep3 ()
{
	// RHYTHM part

	var seqaddr = newAudio.getControlAddress();

	// Third, execute Rhythm with default values, need to erase the output JSON file
	moreInfo = "Step 3";	
	keepJson = false;
	
	script.log("Create mapping for : " + seqaddr);
	
	rhythmAnalyzer (seqaddr, "", 7, 1, 200, 6, 12, 300);	
	createShowStep5 = true;
}

// check is step 3 is finished
function checkStep3()
{
	if (rhythmAnalyzerIsRunning === true)
	{
		script.log('RhythmAnalyzer is running');
		
	} else {
		
		createShowStep5 = false;
		showStep5();		
	}	
}
/*
function showStep4 ()
{	
	var seqaddr = newAudio.getControlAddress();
	
	// Fourth, create colors loop based on rhythm if requested
	moreInfo = "Step 4";	
	if (local.parameters.defaultColors.loopColors.get() == 1)
	{
		keepJson = true;
		// set flag for wled auto actions creation to false
		var wledExist = root.modules.getItemWithName("WLED");			
		if (wledExist.name == "wled")
		{
			bkpWLEDValue = local.parameters.wledParams.createWLEDActions.get();
			local.parameters.wledParams.createWLEDActions.set(0);						
		}
		
		rhythmAnalyzer (seqaddr, "", 7, 1, 200, 6, 12, 300);
	}
	
	createShowStep5 = true;
}

// check is step 4 is finished
function checkStep4()
{
	if (rhythmAnalyzerIsRunning === true)
	{
		script.log('RhythmAnalyzer is running');
		
	} else {

		var wledExist = root.modules.getItemWithName("WLED");		
		// put back flag value
		if (wledExist.name == "wled")
		{
			local.parameters.wledParams.createWLEDActions.set(bkpWLEDValue);
		}		
	}	

	createShowStep5 = false;
	showStep5();
}

*/

function showStep5 ()
{
	var seqaddr = newAudio.getControlAddress();

	// fifth, run spleeter separate for vocal
	moreInfo = "Step 5";
	keepJson = false;
	
	if (spleeterExist.name != "undefined")
	{
		script.log("Create vocals for : " + seqaddr);
		var cmd = spleeterExist.commandTester.setCommand("Spleeter","Spleeter","Separate");		
		cmd.sequence.set(seqaddr+"/clips/audioClip/filePath");
		spleeterExist.commandTester.trigger.trigger();

		spleeterIsRunning = true;
		
	} else {
		
		showLast();
	}
}

function checkSpleeter()
{
	var newSequence = newAudio.getParent();
	var vocalExist = newSequence.getChild('vocals');
	if (vocalExist.name == "undefined" && spleeterOccurrence < spleeterMaxOccurrences)
	{
		script.log('spleeter is running');
		spleeterOccurrence += 1;
		return;
	}
	
	if (spleeterOccurrence >= spleeterMaxOccurrences) 
	{
		script.log('Max occurrence reached for spleeter testing');
		
	} else {
		// retreive vocals part from the sequence and create mapping
		var seqVocals = newAudio.getParent().getControlAddress() + "/vocals";		
		rhythmAnalyzer (seqVocals, "", 7, 1, 200, 6, 12, 300);		
	}
	
	spleeterOccurrence = 0;
	spleeterIsRunning = false;
	createShowLast = true;
}

// check if analyzer for spleeter is finished
function checkLast()
{
	if (rhythmAnalyzerIsRunning === true)
	{
		script.log('RhythmAnalyzer is running');
		
	} else {

		createShowLast = false;
		showLast();		
	}	
}

function showLast()
{
	// Last, reset test
	moreInfo = "";
	keepJson = false;
	util.showMessageBox("Sonic Analyzer ! Show Maker ", "Finished", "info", "OK");	
}

// Reference parameter to value of , 'from' and 'to' need to be OSC addresses.
function createParamReferenceTo(refParam,toValue)
{
	script.log("Create Reference  from param : " + refParam + " to value of : "  + toValue);
	
	// From param, retreive object 
	var fromObj = root.getChild(refParam);
	var paramToRef = fromObj.getParent();
	
	// To value of, retreive object. Done in this way to validate the OSC address already provided.
	var toParamValue = root.getChild(toValue).getControlAddress();

	// Modify Param definition to create the Reference
	paramToRef.loadJSONData({
		"parameters": [
		  {
			"value": 1,
			"controlMode": 2,
			"reference": {
			  "value": toParamValue,
			  "controlAddress": "/reference"
			},
			"hexMode": false,
			"controlAddress": "/" + fromObj.name,
			"feedbackOnly": false,
			"customizable": true,
			"removable": false,
			"hideInEditor": false
		  }
		]
	});
}

// populate enum param from Custom variables group IP
function generateIPList(group)
{
	script.log("Generate enum param for Custom variables Group : " + group);
	
	var loopip = root.customVariables.getItemWithName(group);
	
	if (loopip.name != "undefined")
	{
		var loopipAdditionalIP = loopip.variables.getItems();		
		loopip.calculatedParams.ipList.removeOptions();
		
		var j = 0;	
		if (loopipAdditionalIP)
		{
			for ( var l = 0; l < loopipAdditionalIP.length; l++ ) 
			{ 
				if (loopipAdditionalIP[l].name.contains("ip"))
				{				
					var loopipIPName = loopipAdditionalIP[l].name;
					
					var loopipNewIP = loopipAdditionalIP[l].getChild(loopipIPName);
					var loopipAddIP = loopipNewIP.get();
					
					if (loopipAddIP != "0.0.0.0" && loopipAddIP != "")
					{
						 loopip.calculatedParams.ipList.addOption(j, loopipAddIP);
						 j = j + 1;
						
					} else {
					
						script.log("We bypass this one: "+loopipAdditionalIP[l].name);
					}
					
				} else {
					
					script.log("We bypass this one: "+loopipAdditionalIP[l].name);				
				}
			}
		}
		
	} else {
		
		script.logError("Group does not exist");
	}
}

// Populate enum param
function generateAudioSyncList()
{
	script.log('Generate WLEDAudioSync modules list');
	
	local.parameters.wLEDAudioSyncParams.moduleName.removeOptions();
	util.delayThreadMS(100);
	
	var moduleNumbers = root.modules.getItems();

	for ( var i = 0; i < moduleNumbers.length ; i++)		
	{	
		if ( moduleNumbers[i].getType().contains("WLEDAudioSync"))
		{
			local.parameters.wLEDAudioSyncParams.moduleName.addOption(moduleNumbers[i].name,moduleNumbers[i].name);
		}
	}
}

// Read all IPs from custom variables group and loop from 1 ...n - sequential 
function analyzerIPSequentialLoop(groupName)
{	
	var loopipseq = root.customVariables.getItemWithName(groupName);
	if (loopipseq.name != "undefined" && loopipseq.calculatedParams.ipList.getAllOptions().length != 0)
	{
		loopipseq.calculatedParams.ipList.setNext(true);
		
	} else {
		
		script.log('Group does not exist or no IP !!');
	}	
}

// retreive file name from absolute path
function getFilename(songname)
{
	var splitcount = songname.split("/");
	var filename = splitcount[splitcount.length-1];

return filename		
}


// used for value/expression testing .......
function testScript(from)
{
	linkToGroupNumber = local.parameters.groupParams.linkToGroupNumber.get();
	script.log(linkToGroupNumber);
}