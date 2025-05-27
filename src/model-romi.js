
// catch_ping_ar_-_romi



import { LocusT, LocusX, LocusXY, LocusY } from "./space.js";



var URL = 'catch_ping_ar_-_romi.glb';



var SPACE = {

	// TORSO
	head: [ LocusY, [ 1, 791, -10 ], [ 782, 796 ], 20 ],
	chest: [ LocusY, [ 0, 624, -2 ], [ 509, 681 ]],
	waist: [ LocusY, [ 0, 509, -2 ], [ 395, 738 ]],

	// LEGS
	knee: [ LocusY, [ 46, 255, -8 ], [ 281, 224 ]],
	ankle: [ LocusY, [ 49, 52, -25 ], [ 66, 32 ]],
	leg: [ LocusY, [ 57, 452, -25 ], [ 395, 0 ]],
	hip2: [ LocusY, [ 6, 452, 4 ], [ 452, 166 ]],
	foot: [ LocusY, [ 0, 12, 27 ], [ 1, -57 ], 120 ],
	hip: [ LocusT, [ 30, 452, -25 ], [ -6, 9 ], [ 481, 395 ], 624 ],

	// ARMS
	elbow: [ LocusX, [ 200, 695, -24 ], [ 180, 220 ]],
	forearm: [ LocusX, [ 182, 699, -27 ], [ 182, 290 ]],
	wrist: [ LocusX, [ 298, 670, -18 ], [ 291, 301 ]],
	arm: [ LocusXY, [ 97, 704, -36 ], [ 66, 123 ], [ 632, 664 ]],

};



export { URL, SPACE };
