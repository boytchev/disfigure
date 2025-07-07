
// disfigure
//
// Functions to generate motion by bending a body as if it has joints and muscles



import { float, Fn, If, normalGeometry, positionGeometry, transformNormalToView, uniform, vec3 } from "three/tsl";
import { matRotXZY, matRotYZX } from "./utils.js";



// general DOF=3 rotator, used for most joints
var jointRotate= Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount, vec3( -1, -1, 1 ) ) ) ).add( center );

}, { pos: 'vec3', center: 'vec3', angle: 'vec3', amount: 'float', return: 'vec3' } );



// specific DOF=3 rotator, used for arm joints (different order of rotations)
var jointRotateArm= Fn( ([ pos, center, angle, amount ])=>{

	var newPos = pos.sub( center ).mul( matRotXZY( angle.mul( amount, vec3( -1, -1, 1 ) ) ) ).add( center ).toVar();

	return newPos;

}, { pos: 'vec3', center: 'vec3', angle: 'vec3', amount: 'float', return: 'vec3' } );



// calculate vertices of bent body surface
function tslPositionNode( options ) {

	options.vertex = positionGeometry;
	options.mode = float( 1 );

	return disfigure( options );

}



// calculate normals of bent body surface
function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.mode = float( 0 );

	return transformNormalToView( disfigure( options ) ).xyz;

}



// implement the actual body bending
//		space - compiled definition of the space around the body
//		posture - collection of angles for body posture
//		mode - 1 for vertixes, 0 for normals
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft.mul( vec3( 1, -1, 1 ) ), space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft.mul( -1 ), space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft.mul( vec3( 1, -1, 1 ) ), space.armLeft.locus( )/*, space.armLeft.sublocus(  )*/ ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristRight.pivot ), posture.wristRight.mul( vec3( 1, 1, -1 ) ), space.wristRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmRight.pivot ), posture.forearmRight, space.forearmRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowRight.pivot ), posture.elbowRight, space.elbowRight.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armRight.pivot ), posture.armRight.mul( vec3( 1, 1, -1 ) ), space.armRight.locus( )/*, space.armRight.sublocus(  )*/ ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( space.head.pivot ), posture.head, space.head.locus( ) ) );
	p.assign( jointRotate( p, mode.mul( space.chest.pivot ), posture.chest, space.chest.locus() ) );
	p.assign( jointRotate( p, mode.mul( space.waist.pivot ), posture.waist, space.waist.locus() ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft.mul( vec3( 1, 1, -1 ) ), space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongLeft.pivot ), posture.ankleLongLeft, space.ankleLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongLeft.pivot ), posture.legLongLeft, space.legLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft.mul( vec3( -1, 1, -1 ) ), legLeft ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	If( legRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footRight.pivot ), posture.footRight, space.footRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleRight.pivot ), posture.ankleRight, space.ankleRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongRight.pivot ), posture.ankleLongRight.mul( -1 ), space.ankleLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeRight.pivot ), posture.kneeRight, space.kneeRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongRight.pivot ), posture.legLongRight.negate(), space.legLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legRight.pivot ), posture.legRight.mul( vec3( -1, 1, 1 ) ), legRight ) );

	} );

	return p;

} ); // disfigure



// create a default posture
function tslPosture( ) {

	return {

		// TORSO
		head: uniform( vec3( 0, 0, 0 ) ),
		chest: uniform( vec3( 0, 0, 0 ) ),
		waist: uniform( vec3( 0, 0, 0 ) ),

		// LEGS
		kneeLeft: uniform( vec3( 0, 0, 0 ) ),
		kneeRight: uniform( vec3( 0, 0, 0 ) ),
		ankleLeft: uniform( vec3( 0, 0, 0 ) ),
		ankleRight: uniform( vec3( 0, 0, 0 ) ),
		footLeft: uniform( vec3( 0, 0, 0 ) ),
		footRight: uniform( vec3( 0, 0, 0 ) ),
		legLeft: uniform( vec3( 0, 0, 0 ) ),
		legLongLeft: uniform( vec3( 0, 0, 0 ) ),
		legRight: uniform( vec3( 0, 0, 0 ) ),
		legLongRight: uniform( vec3( 0, 0, 0 ) ),
		ankleLongLeft: uniform( vec3( 0, 0, 0 ) ),
		ankleLongRight: uniform( vec3( 0, 0, 0 ) ),

		// ARMS
		elbowLeft: uniform( vec3( 0, 0, 0 ) ),
		elbowRight: uniform( vec3( 0, 0, 0 ) ),
		forearmLeft: uniform( vec3( 0, 0, 0 ) ),
		forearmRight: uniform( vec3( 0, 0, 0 ) ),
		wristLeft: uniform( vec3( 0, 0, 0 ) ),
		wristRight: uniform( vec3( 0, 0, 0 ) ),
		armLeft: uniform( vec3( 0, 0, 0 ) ),
		armRight: uniform( vec3( 0, 0, 0 ) ),

	};

}



export { tslPositionNode, tslNormalNode, tslPosture };
