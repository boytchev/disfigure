
// disfigure
//
// The space description of a child 3D model, // i.e. 3D locations in space that
// correspond to various body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL = 'child.glb';



var SPACE = {

	// TORSO
	head: [ 'LocusY', [ 0, 850, -32 ], [ 807, 894 ], 30 ],
	chest: [ 'LocusY', [ 0, 640, 1 ], [ 419, 914 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 530, -7 ], [ 285, 836 ] ],

	// LEGS
	leg: [ 'LocusT', [ 40, 521, -9 ], [ -1, 1 ], [ 625, 430 ], 1 ],
	legLong: [ 'LocusY', [ 46, 0, -5 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 288, -12 ], [ 346, 221 ], 20 ],
	ankle: [ 'LocusY', [ 54, 48, -14 ], [ 81, 33 ], -10],
	ankleLong: [ 'LocusY', [ 51, 201, -25 ], [ 430, -33 ]],
	foot: [ 'LocusY', [ 0, 20, 6 ], [ 83, -200 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 249, 793, -56 ], [ 230, 273 ], 0 ],
	forearm: [ 'LocusX', [ 170, 794, -59 ], [ 54, 475 ]],
	wrist: [ 'LocusX', [ 398, 802, -57 ], [ 384, 409 ]],
	arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ] ],

};



export { URL, SPACE };
