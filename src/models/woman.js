
// disfigure
//
// This file is the space description of a female 3D model,
// i.e. 3D locations in space that correspond to various
// body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL = 'woman.glb'; // model file



var SPACE = {

	// TORSO
	head: [ 'LocusY', [ 0, 872, -30 ], [ 827, 919 ], 30 ],
	chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 570, -9 ], [ 350, 840 ] ],

	// LEGS
	leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ] ],
	legLong: [ 'LocusY', [ 44, 0, -19 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
	ankle: [ 'LocusY', [ 44, 51, -4 ], [ 97, 10 ], -10],
	ankleLong: [ 'LocusY', [ 51, 201, -29 ], [ 430, -33 ]],
	foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
	forearm: [ 'LocusX', [ 170, 815, -38 ], [ 54, 475 ]],
	wrist: [ 'LocusX', [ 359, 815, -34 ], [ 343, 380 ]],
	arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ] ],

};



export { URL, SPACE };
