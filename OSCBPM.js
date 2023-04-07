/*
a: zak45
d: 07/04/2023
v: 1.0.0

Script to detect each Beat from aubio via osc
From odd to even.
To be used with WLEDAudioSync module.

*/
function init() 
{
	root.modules.osc.values.addBoolParameter("WLEDAudioSyncBeat","Value change at each beat",false);
}

function beatBPMCall(address, args) 
{
	
	script.log("Received message : "+address + " with value of : " + args[0]);

	if (root.modules.osc.values.wLEDAudioSyncBeat.get() == 0) 
	{
		root.modules.osc.values.wLEDAudioSyncBeat.set(1);
		
	} else {
		
		root.modules.osc.values.wLEDAudioSyncBeat.set(0);
	}

}

