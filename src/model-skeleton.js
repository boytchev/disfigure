
// skeleton_t_pose



import { LocusT, LocusX, LocusXY, LocusY } from "./space.js";



var URL = 'skeleton_t_pose.glb';



var SPACE = {

	// TORSO
	head: [ LocusY, [ 0, 783, -12 ], [ 763, 823 ], 20 ],
	chest: [ LocusY, [ 0, 655, -2 ], [ 556, 704 ]],
	waist: [ LocusY, [ 0, 605, -2 ], [ 531, 714 ]],

	// LEGS
	knee: [ LocusY, [ 39, 247, -7 ], [ 270, 220 ]],
	ankle: [ LocusY, [ 98, 47, -21 ], [ 52, 18 ]],
	leg: [ LocusY, [ 49, 418, -21 ], [ 368, 0 ]],
	hip2: [ LocusY, [ 5, 418, 3 ], [ 418, 171 ]],
	foot: [ LocusY, [ 0, 13, 13 ], [ 3, -46 ], 120 ],
	hip: [ LocusT, [ 54, 479, -12 ], [ 39, 54 ], [ 442, 467 ], 566 ],

	// ARMS
	elbow: [ LocusX, [ 247, 734, -26 ], [ 227, 266 ]],
	forearm: [ LocusX, [ 247, 734, -26 ], [ 177, 280 ]],
	wrist: [ LocusX, [ 400, 729, -21 ], [ 395, 405 ]],
	arm: [ LocusXY, [ 98, 753, -36 ], [ 74, 106 ], [ 679, 704 ]],

};



export { URL, SPACE };
