/*
a: zak45
d: 18/10/2023
v: 1.0.0

Script to create Container values from received JSON via OSC.
Used for Real Time Music Mood Detection.
Designed for WLEDAudioSync module.

// Mood
var disgust_pos = [-0.9, 0];
var angry_pos = [-0.5, 0.5];
var alert_pos = [0, 0.5];
var happy_pos = [0.5, 0.5];
var calm_pos = [0.4, -0.4];
var relaxed_pos = [0, -0.6];
var sad_pos = [-0.5, -0.5];
var neu_pos = [0.0, 0.0];

*/

var newOSCRTMMDContainer = '';
var moodColor = '';

function init ()
{
	// script callback
	local.register("/WLEDAudioSync/mood/data", "OSCRTMMDData");
	local.register("/WLEDAudioSync/mood/color", "OSCRTMMDColor");
	// Main container
	newOSCRTMMDContainer = local.addContainer("WLEDAudioSync");
	newOSCRTMMDContainer.addColorParameter("Music Mood Color", "Respective Color from detected music mood", [1,0,1]);
	newOSCRTMMDContainer.addStringParameter("Mood", "Detected mood name", 'neutral');	
	// Mood Data container	
	var newRTMMDDataContainer = newOSCRTMMDContainer.addContainer("Mood Data");
	newRTMMDDataContainer.addStringParameter("win_class",'win_class','');
	newRTMMDDataContainer.addStringParameter("win_class_energy",'win_class_energy','');
	newRTMMDDataContainer.addStringParameter("win_class_valence",'win_class_valence','');
	newRTMMDDataContainer.addFloatParameter("soft_valence",'soft_valence',0);
	newRTMMDDataContainer.addFloatParameter("soft_energy",'soft_energy',0);
}

// set Data 
function OSCRTMMDData (address, args) 
{
	// script.log("Received message : "+ address + " with value of : " + args[0]);
	
	var rtmmddJsonData = JSON.parse(args[0]);	
	local.wLEDAudioSync.moodData.win_class.set(rtmmddJsonData.win_class);
	local.wLEDAudioSync.moodData.win_class_energy.set(rtmmddJsonData.win_class_energy);
	local.wLEDAudioSync.moodData.win_class_valence.set(rtmmddJsonData.win_class_valence);
	local.wLEDAudioSync.moodData.soft_valence.set(rtmmddJsonData.soft_valence);
	local.wLEDAudioSync.moodData.soft_energy.set(rtmmddJsonData.soft_energy);
	
	// retreive Mood
	local.wLEDAudioSync.mood.set(detectMood(rtmmddJsonData.soft_valence, rtmmddJsonData.soft_energy));
}

// set Color
function OSCRTMMDColor (address, args) 
{
	// script.log("Received message : "+ address + " with value of : " + args[0]);
	
	var rtmmdcJsonData = JSON.parse(args[0]);	
	local.wLEDAudioSync.musicMoodColor.set([rtmmdcJsonData.R / 255, rtmmdcJsonData.G / 255, rtmmdcJsonData.B / 255]);
}

// util

// returned value is not supposed represent real mood
// only a extraprolation from visual representation
function detectMood(x, y) 
{
	// white (neutral
	if (x <= 0.2 && x >= -0.2 && y <= 0.2 && y >= -0.2) {
		
		return "neutral";
	
	// yellow (happy)
	} else if (x >= 0 && y >= 0) {
		
		if ( x >= 0.4 && y >= 0.4){
			return "joy";
		} else if ( y >= 0.6) {
			return "extase";
		} else {
			return "serenity";
		}
	// blue (sad)
	} else if (x <= 0 && y <= 0) {
		
		if ( x <= -0.9 && y <= 0.2 && y >= -0.2) {
			return "disgust";
		} else if (x <= -0.4 && y <= -0.4){
			return "sad";
		} else {
			return "pensinve";
		}
	// 	red (angry)
	} else if (x <= 0 && y >= 0) {
		
		if ( x <= -0.9  && y <= 0.2 && y >= -0.2) {
			return "disgust";
		} else if ((x <= -0.4 && y >= 0.4) || y >= 0.6){
			return "rage";
		} else {			
			return "angry";
		}	
	// green (relax)
	} else if (x >= 0 && y <= 0) {
		
		if ( x <= 0.4  && y <= -0.4) {		
			return "relax";
		} else {
			return "calm";
		}

	} else {
		
		return "Error : No mood defined ....";		
	}
}

function test ()
{

}