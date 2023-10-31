/*
a: zak45
d: 07/04/2023
v: 1.0.0

Script to detect each Beat from aubio via osc
From odd to even.
Provide list probable genres.
To be used with WLEDAudioSync module.

*/

var newOSCRTContainer = '';
var soundCardModule = root.modules.soundCard;
var beat = '';
var beat_SC = '';
var beat_Exist = false;
var prob = '';
var bpm_Value = 0;

function init()
{
	local.register("/WLEDAudioSync/beat/BPM", "OSCBPM");
	newOSCRTContainer = local.addContainer("WLEDAudioSync");
	beat = newOSCRTContainer.addBoolParameter("Beat", "Beat odd even", true);
	if (soundCardModule.name != "undefined")
	{
		beat_SC = soundCardModule.values.addBoolParameter("Beat", "Beat odd even", true);
		beat_SC.setAttribute("readOnly", true);		
		bpm_SC = soundCardModule.values.addFloatParameter("BPM", "Beat Per Minute", 0);
		bpm_SC.setAttribute("readOnly", true);
		beat_Exist = true;
	}
	prob = newOSCRTContainer.addStringParameter("ProbGenre", "List of Probable playing music genres based on the BPM", '[]');
	
}

function OSCBPM(address, args) 
{
	
	//script.log("Received message : "+ address + " with value of : " + args[0]);
	
	bpm_Value = parseInt(local.values._WLEDAudioSync_beat_BPM.get());

	if (beat.get() == 0) 
	{
		beat.set(1);
		if (beat_Exist)
		{
			beat_SC.set(1);
			bpm_SC.set(bpm_Value);
		}

		
	} else {
		
		beat.set(0);
		if (beat_Exist)
		{
			beat_SC.set(0);
		}
	}

	prob.set(getProbableGenres(bpm_Value));
}

// We take the BPM to obtain a list of genre probability, based on medium values.
// could be associated to RTMGC
function getProbableGenres (bpm) 
{
	// Name: min BPM, max BPM
	var genres = [
		'Ambient: 60, 100',
		'Bachata: 128, 128',
		'Ballad: 60, 80',
		'Blues: 60, 120',
		'Blues Rock: 100, 120',
		'Classical: 60, 120',
		'Country: 60, 120',
		'Crunk: 80, 80',
		'Cumbia: 70, 80',
		'Disco: 110, 140',
		'Deep House: 120, 125',
		'Down Tempo: 70, 100',
		'Drum n Bass: 160, 180',
		'Dubstep: 130, 150',
		'Electro House: 125, 130',
		'Electronic: 120, 140',
		'Eurodance: 126, 132',
		'Euro House: 126, 130',
		'Frenchcore: 200, 210',
		'Folk: 90, 130',
		'Funk: 90, 120',
		'Funk Metal: 115, 130',
		'Funky House: 128, 136',
		'Hard Rock: 122, 160',
		'Heavy Metal: 100, 135',
		'Hip Hop: 85, 115',
		'House: 120, 130',
		'Indie: 100, 160',
		'Jazz: 80, 140',
		'Latin: 90, 130',
		'Louisiana Blues: 80, 120',
		'Makina: 150, 190',
		'Metal: 100, 200',
		'New Beat: 110, 120',
		'Pop: 90, 130',		
		'Psytrance: 140, 145',
		'Punk: 150, 200',
		'R&B: 60, 100',
		'Rap: 90, 100',
		'Reggae: 60, 110',
		'Reggaeton: 80, 90',
		'Rock: 100, 160',
		'Salsa: 150, 250',
		'Soul: 60, 120',
		'Synth-pop: 90, 130',
		'Tango: 50, 56',
		'Tech House: 120, 135',
		'Techno: 120, 140',
		'Techno Hardcore: 170, 200',
		'Trap: 139, 141',
		'Trance: 130, 150',
		'Tribe: 145, 180',
		'Trip Hop: 60, 120',
		'UK Garage: 130, 135'
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
