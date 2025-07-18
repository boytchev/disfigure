
// disfigure
//
// Functions to bend a body and the space it is in



import { Fn, If, mix, normalGeometry, positionGeometry, transformNormalToView } from "three/tsl";



// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, joint ])=>{

	var p = pos.sub( joint.pivot ).mul( joint.matrix ).add( joint.pivot );
	return mix( pos, p, joint.locus() );

} );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, joint ])=>{

	var p = pos.mul( joint.matrix );
	return mix( pos, p, joint.locus() );

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
var disfigure = Fn( ( { fn, space, vertex } )=>{

	var p = vertex.toVar( );


	// LEFT-UPPER BODY

	If( space.l_arm.locus( ), ()=>{

		p.assign( fn( p, space.l_wrist ) );
		p.assign( fn( p, space.l_forearm ) );
		p.assign( fn( p, space.l_elbow ) );
		p.assign( fn( p, space.l_arm ) );

	} );


	// RIGHT-UPPER BODY

	If( space.r_arm.locus( ), ()=>{

		p.assign( fn( p, space.r_wrist ) );
		p.assign( fn( p, space.r_forearm ) );
		p.assign( fn( p, space.r_elbow ) );
		p.assign( fn( p, space.r_arm ) );

	} );


	// LEFT-LOWER BODY

	If( space.l_leg.locus( ), ()=>{

		p.assign( fn( p, space.l_foot ) );
		p.assign( fn( p, space.l_ankle ) );
		p.assign( fn( p, space.l_shin ) );
		p.assign( fn( p, space.l_knee ) );
		p.assign( fn( p, space.l_thigh ) );
		p.assign( fn( p, space.l_leg ) );

	} );


	// RIGHT-LOWER BODY

	If( space.r_leg.locus( ), ()=>{

		p.assign( fn( p, space.r_foot ) );
		p.assign( fn( p, space.r_ankle ) );
		p.assign( fn( p, space.r_shin ) );
		p.assign( fn( p, space.r_knee ) );
		p.assign( fn( p, space.r_thigh ) );
		p.assign( fn( p, space.r_leg ) );

	} );


	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head ) );
	p.assign( fn( p, space.chest ) );
	p.assign( fn( p, space.waist ) );
	p.assign( fn( p, space.torso ) );

	return p;

} ); // disfigure



export { tslPositionNode, tslNormalNode };
