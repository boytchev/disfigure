
// female_t-pose



import { LocusT, LocusX, LocusXY, LocusY } from "./space.js";



var URL = 'female_t-pose.glb';



var SPACE = {

	// TORSO
	head: [ LocusY, [ -9, 847, -14 ], [ 806, 882 ], 20 ],
	chest: [ LocusY, [ -9, 685, -26 ], [ 557, 748 ]],
	waist: [ LocusY, [ -9, 557, -26 ], [ 435, 806 ]],

	// LEGS
	knee: [ LocusY, [ 37, 284, -14 ], [ 313, 249 ]],
	ankle: [ LocusY, [ 31, 64, -20 ], [ 75, 58 ]],
	leg: [ LocusY, [ 49, 493, -3 ], [ 435, 58 ]],
	hip2: [ LocusY, [ 49, 493, -20 ], [ 493, 180 ]],
	foot: [ LocusY, [ -9, 17, 32 ], [ -52, -110 ], 120 ],
	hip: [ LocusT, [ 31, 534, -14 ], [ -11, -8 ], [ 540, 493 ], 638 ],

	// ARMS
	elbow: [ LocusX, [ 234, 783, -55 ], [ 217, 257 ]],
	forearm: [ LocusX, [ 234, 783, -38 ], [ 165, 397 ]],
	wrist: [ LocusX, [ 385, 777, -32 ], [ 379, 391 ]],
	arm: [ LocusXY, [ 66, 772, -38 ], [ 66, 118 ], [ 690, 725 ]],

};



export { URL, SPACE };
