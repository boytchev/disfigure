﻿
// disfigure
//
// A collection of utility functions.



import { Box3, Vector3 } from 'three';
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";



// center model and get it height
function centerModel( model ) {

	var v = new Vector3(),
		box = new Box3().setFromObject( model, true );

	box.getCenter( v );
	model.position.sub( v );

	return box.max.y-box.min.y;

}



// number generators

var simplex = new SimplexNoise( );

// generate chaotic but random sequence of numbers in [min.max]
function chaotic( time, offset=0, min=-1, max=1 ) {

	return min + ( max-min )*( simplex.noise( time, offset )+1 )/2;

}



// generate repeated sequence of numbers in [min.max]
function regular( time, offset=0, min=-1, max=1 ) {

	return min + ( max-min )*( Math.sin( time+offset )+1 )/2;

}



// generate random sequence of numbers in [min.max]
function random( min=-1, max=1 ) {

	return min + ( max-min )*Math.random( );

}



export {

	centerModel,
	chaotic,
	regular,
	random,

};
