
// disfigure
//
// Functions to generate motion by bending a body as if it has joints and muscles



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

	return transformNormalToView( disfigure( options ) ).xyz;

}


// implement the actual body bending
//		space - compiled definition of the space around the body
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	If( space.armLeft.locus( ), ()=>{

		p.assign( fn( p, space.wristLeft ) );
		p.assign( fn( p, space.forearmLeft ) );
		p.assign( fn( p, space.elbowLeft ) );
		p.assign( fn( p, space.armLeft ) );

	} );



	// RIGHT-UPPER BODY

	If( space.armRight.locus( ), ()=>{

		p.assign( fn( p, space.wristRight ) );
		p.assign( fn( p, space.forearmRight ) );
		p.assign( fn( p, space.elbowRight ) );
		p.assign( fn( p, space.armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head ) );
	p.assign( fn( p, space.chest ) );
	p.assign( fn( p, space.waist ) );



	// LEFT-LOWER BODY

	If( space.legLeft.locus( ), ()=>{

		p.assign( fn( p, space.footLeft ) );
		p.assign( fn( p, space.ankleLeft ) );
		p.assign( fn( p, space.ankleLongLeft ) );
		p.assign( fn( p, space.kneeLeft ) );
		p.assign( fn( p, space.legLongLeft ) );
		p.assign( fn( p, space.legLeft ) );

	} );



	// RIGHT-LOWER BODY

	If( space.legRight.locus( ), ()=>{

		p.assign( fn( p, space.footRight ) );
		p.assign( fn( p, space.ankleRight ) );
		p.assign( fn( p, space.ankleLongRight ) );
		p.assign( fn( p, space.kneeRight ) );
		p.assign( fn( p, space.legLongRight ) );
		p.assign( fn( p, space.legRight ) );

	} );

	return p;

} ); // disfigure



export { tslPositionNode, tslNormalNode };
