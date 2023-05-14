/*
a: zak45
d: 07/04/2023
v: 1.0.0

Script to detect each Beat from aubio via osc
From odd to even.
To be used with WLEDAudioSync module.

*/

var newOSCRTContainer = '';
var beat = '';
var prob = '';

function init()
{
	local.register("/WLEDAudioSync/beat/BPM", "OSCBPM");
	newOSCRTContainer = local.addContainer("WLEDAudioSync");
	beat = newOSCRTContainer.addBoolParameter("Beat", "Beat odd even", true);
	prob = newOSCRTContainer.addStringParameter("ProbGenre", "Probable playing music genre based on the BPM", '[]');
	
}

function OSCBPM(address, args) 
{
	
	//script.log("Received message : "+ address + " with value of : " + args[0]);

	if (beat.get() == 0) 
	{
		beat.set(1);
		
	} else {
		
		beat.set(0);
	}

	prob.set(getProbableGenres(parseInt(local.values._WLEDAudioSync_beat_BPM.get())));
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

	var probableGenres = "";

	for (var i = 0; i < genres.length; i ++) {
		var genre = genres[i].split(':');
		var bpmRange = genre[1].split(',');
		if (bpm >= parseInt(bpmRange[0]) && bpm <= parseInt(bpmRange[1])) {
		  probableGenres = probableGenres + genre[0] + ",";
		}
	}
	
	return probableGenres.substring(0,probableGenres.length-1);
}
