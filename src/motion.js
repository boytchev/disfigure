
// disfigure
//
// Functions to bend a body and the space it is in



import { Fn, If, mix, normalGeometry, positionGeometry, transformNormalToView } from "three/tsl";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";



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



// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, pivot, matrix, locus ])=>{

	var p = pos.sub( pivot ).mul( matrix ).add( pivot );
	return mix( pos, p, locus );

} );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, pivot, matrix, locus ])=>{ // eslint-disable-line no-unused-vars

	var p = pos.mul( matrix );
	return mix( pos, p, locus );

} );



// calculate vertices of bent body surface
function tslPositionNode( options ) {

	options.vertex = positionGeometry;
	options.fn = jointRotateMat;

	return disfigure( options );

}



// calculate normals of bent body surface
function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.fn = jointNormalMat;

	return transformNormalToView( disfigure( options ) );

}


// implement the actual body bending
//		space - the space around the body
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, joints, vertex } )=>{

	var p = vertex.toVar( );


	function chain( items ) {

		for ( var item of items )
			p.assign( fn( p, space[ item ].pivot, joints[ item ].matrix, space[ item ].locus() ) );

	}

	// LEFT-UPPER BODY

	If( space.l_arm.locus( ), ()=>{

		chain([ 'l_wrist', 'l_forearm', 'l_elbow', 'l_arm' ]);

	} );


	// RIGHT-UPPER BODY

	If( space.r_arm.locus( ), ()=>{

		chain([ 'r_wrist', 'r_forearm', 'r_elbow', 'r_arm' ]);

	} );


	// LEFT-LOWER BODY

	If( space.l_leg.locus( ), ()=>{

		chain([ 'l_foot', 'l_ankle', 'l_shin', 'l_knee', 'l_thigh', 'l_leg' ]);

	} );


	// RIGHT-LOWER BODY

	If( space.r_leg.locus( ), ()=>{

		chain([ 'r_foot', 'r_ankle', 'r_shin', 'r_knee', 'r_thigh', 'r_leg' ]);

	} );


	// CENTRAL BODY AXIS

	chain([ 'head', 'chest', 'waist', 'torso' ]);

	return p;

} ); // disfigure




export { tslPositionNode, tslNormalNode, chaotic, regular, random };
