/*
a: zak45
d: 05/05/2023
v: 1.0.0

Script to create Container values from received JSON via OSC.
Used for Real Time Music Genre Classification from ESSENTIA.js
Designed for WLEDAudioSync module.

*/

var newOSCRTMGCContainer = '';
var names = [];

function init ()
{
	local.register("/WLEDAudioSync/RTMGC", "OSCRTMGC");
	newOSCRTMGCContainer = local.addContainer("WLEDAudioSync");
}

// update data, Top 5 predictions, from 1st to 5th
function OSCRTMGC (address, args) 
{
	// script.log("Received message : "+ address + " with value of : " + args[0]);
	
	names = [];
	
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
			names[i] = rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.Predictions[i].name;
			var score = rtmgcToUpdate.predictions.getChild("score"+j);		
			score.set(rtmgcJsonData.WLEDAudioSync.RTMGCDiscogs.Predictions[i].score);			
		}
		
		local.values.mostProbableGenre.set(mostProb());
		
	} else {
		
		createRTMGC (id);
		
	}
}

// create container for the unique id received from sender
function createRTMGC (id)
{
	var newidRTMGCContainer = newOSCRTMGCContainer.addContainer("RTMGC " + id);
	newidRTMGCContainer.addStringParameter('Timestamp','Timestamp from generated message', '');
	if (local.values.mostProbableGenre.name == "undefined")
	{
		var newStrPar = local.values.addStringParameter('Most Probable Genre','Most detected genre name, to be used with only one id', '');	
		newStrPar.setAttribute("saveValueOnly", false);
	}	
	var newPredictions = newidRTMGCContainer.addContainer("Predictions");
	for (var i = 1; i < 6; i ++)
	{
		var newStrPar = newPredictions.addStringParameter('parentGenre'+i,'Parent','');
		newStrPar.setAttribute("saveValueOnly", false);
		var newStrPar = newPredictions.addStringParameter('name'+i,'Name','');
		newStrPar.setAttribute("saveValueOnly", false);
		var newFloatPar = newPredictions.addFloatParameter('score'+i,'Score: bigger, better',0.0);
		newFloatPar.setAttribute("saveValueOnly", false);
	}
}

// Found the most Probable genre name
function mostProb()
{
	// generate all genres name detected
	// check to see if BPM present to append	
	if (newOSCRTMGCContainer.probGenre.name != "undefined")		
	{
		var namesBPM = newOSCRTMGCContainer.probGenre.get().split(',');
		var namesLength = names.length;
		for ( var j = 0; j < namesBPM.length;  j++)
		{
			names[namesLength+j] = namesBPM[j];
		}
	}
	
	// found unique names
	var uniqueNames = [];
	var j = 0;
	for ( var i = 0; i < names.length; i++)
	{
		if ( !uniqueNames.contains(names[i]) )
		{
			uniqueNames[j] = names[i];
			j = j + 1;		 
		}
	}

	// calculate occurence by name
	var occurrences = [];	
	for ( var i = 0 ; i < uniqueNames.length; i++ ) 		
	{
		var numberOccurrence = 0;
		for (var j = 0 ; j < names.length ; j++)
		{
			if (uniqueNames[i] == names[j])
			{
				numberOccurrence = numberOccurrence + 1;
			}			
		}
		
		occurrences[i] = uniqueNames[i] + ":" + numberOccurrence ;
	}

	var nameMostSeen = "";
	var maxOccurrences = 0;
	
	// found the one most present
	for ( var i = 0; i < occurrences.length; i++ )
	{
		occurrenceName = occurrences[i].split(':')[0];
		occurrenceByName = occurrences[i].split(':')[1];
		if (occurrenceByName > maxOccurrences)
		{
			maxOccurrences = occurrenceByName;
			nameMostSeen = occurrenceName;
		}
	}
	
	return nameMostSeen;
}

function moduleValueChanged(value) 
{ 
	if(value.name == "mostProbableGenre") 
	{ 
		script.log("Module value changed : "+value.name+" > "+value.get()); 
	}
}



