/*
a: zak45
d: 07/04/2023
v: 1.0.0

Script to detect each Beat from aubio via osc
From odd to even.
To be used with WLEDAudioSync module.

*/

function beatBPMCall(address, args) 
{
	
	script.log("Received message : "+ address + " with value of : " + args[0]);

	if (local.values.wLEDAudioSyncBeat.get() == 0) 
	{
		local.values.wLEDAudioSyncBeat.set(1);
		
	} else {
		
		local.values.wLEDAudioSyncBeat.set(0);
	}

}

