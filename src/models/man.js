
// mannequin-man



var URL = 'man.glb';



var SPACE = {

	// TORSO
	head: [ 'LocusY', [ 0, 878, -37 ], [ 838, 923 ], 30 ],
	chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 570, -9 ], [ 310, 840 ] ],

	// LEGS
	leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ] ],
	legLong: [ 'LocusY', [ 39, 0, -19 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
	ankle: [ 'LocusY', [ 41, 51, -1 ], [ 97, 10 ], -10],
	ankleLong: [ 'LocusY', [ 51, 206, -29 ], [ 430, -10 ]],
	foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
	forearm: [ 'LocusX', [ 170, 815, -38 ], [ 46, 490 ]],
	wrist: [ 'LocusX', [ 375, 820, -40 ], [ 354, 402 ]],
	arm: [ 'LocusXY', [ 70+15, 810-20, -40 ], [ 30, 150 ], [ 600, 900 ] ],

};



export { URL, SPACE };
