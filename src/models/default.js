
// disfigure
//
// The space description of a make 3D model, i.e. 3D locations in space that
// correspond to various body movement. The model and the spaces and not quite
// perfect, but this is the first model I tried, so it is kept because of
// santimental reasons.



var URL = 'default.glb';



var SPACE = {

	// TORSO
	head: [ 'LocusY', [ 0, 772, -13 ], [ 730, 818 ], 20 ],
	chest: [ 'LocusY', [ 0, 624, -2 ], [ 509, 681 ]],
	waist: [ 'LocusY', [ 0, 509, -2 ], [ 395, 730 ]],
	torso: [ 'LocusY', [ 0, 509, -2 ], [ -1001, -1000 ] ],

	// LEGS
	leg: [ 'LocusT', [ 30, 452, -25 ], [ -6, 9 ], [ 481+30, 395-30 ], 224, 1 ],
	legLong: [ 'LocusY', [ 50, 452, 4 ], [ 452, 166 ]],
	knee: [ 'LocusY', [ 46, 255, -8 ], [ 281, 224 ]],
	ankle: [ 'LocusY', [ 49, 52, -25 ], [ 66, 32 ]],
	ankleLong: [ 'LocusY', [ 57, 452, -25 ], [ 395, 0 ]],
	foot: [ 'LocusY', [ 0, 28, 5 ], [ 60+20, -140+20 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 245, 715, -35 ], [ 230, 260 ], 0 ],
	forearm: [ 'LocusX', [ 170, 715, -40 ], [ 80, 440 ]],
	wrist: [ 'LocusX', [ 385, 713, -36 ], [ 370, 400 ]],
	arm: [ 'LocusXY', [ 70+15, 715, -40 ], [ 30, 150 ], [ 600, 800 ] ],

};



export { URL, SPACE };
