/*
a: zak45
d: 05/05/2023
v: 1.0.0

Script to create Container values from received JSON via OSC.
Used for Real Time Music Genre Classification from ESSENTIA.js
Designed for WLEDAudioSync module.

*/

var newOSCRTMGCContainer = '';

function init ()
{
	local.register("/WLEDAudioSync/RTMGC", "OSCRTMGC");
	newOSCRTMGCContainer = local.addContainer("WLEDAudioSync");
}

// update data, Top 5 predictions, from 1st to 5th
function OSCRTMGC (address, args) 
{
	// script.log("Received message : "+ address + " with value of : " + args[0]);
	
	var rtmgcJsonData = JSON.parse(args[0]);
	var id = rtmgcJsonData.WLEDAudioSync.id;
	
	var rtmgcToUpdate = newOSCRTMGCContainer.getChild("RTMGC " + id);
	
	if ( rtmgcToUpdate.name != "undefined" ) {
	
		rtmgcToUpdate.timestamp.set(rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.TimeStamp);
		
		var j = 0;
		for (var i = 0; i < 5; i++)
		{
			j = i + 1 ;
			var parentGenre = rtmgcToUpdate.predictions.getChild("parentGenre"+j);
			parentGenre.set(rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.Predictions[i].parentGenre);
			var name = rtmgcToUpdate.predictions.getChild("name"+j);		
			name.set(rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.Predictions[i].name);
			var score = rtmgcToUpdate.predictions.getChild("score"+j);		
			score.set(rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.Predictions[i].score);			
		}
		
	} else {
		
		createRTMGC (id);
		
	}
}

// create container for the unique id received from sender
function createRTMGC (id)
{
	var newidRTMGCContainer = newOSCRTMGCContainer.addContainer("RTMGC " + id);
	newidRTMGCContainer.addStringParameter('Timestamp','Timestamp from generated message', '');
	var newPredictions = newidRTMGCContainer.addContainer("Predictions");
	for (var i = 1; i < 6; i ++)
	{
		newPredictions.addStringParameter('parentGenre'+i,'Parent','');
		newPredictions.addStringParameter('name'+i,'Name','');
		newPredictions.addFloatParameter('score'+i,'Score: bigger, better',0.0);
	}
}
