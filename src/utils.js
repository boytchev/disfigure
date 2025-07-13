
// disfigure
//
// A collection of utility functions.



import { Box3, Vector3 } from 'three';
import { Fn } from 'three/tsl';
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";



// center model and get it dimensions
function centerModel( model, dims ) {

	var v = new Vector3();

	var box = new Box3().setFromObject( model, true );

	box.getCenter( v );
	model.position.sub( v );

	dims.x = v.x;
	dims.y = box.min.y;
	dims.z = v.z;

	box.getSize( v );
	dims.scale = Math.max( ...v );
	dims.height = v.y;

}



// generate oversmooth function
const smoother = Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edgeFrom: 'float', edgeTo: 'float', value: 'float', return: 'float' } );



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



export
{

	smoother,
	centerModel,
	chaotic,
	regular,
};
