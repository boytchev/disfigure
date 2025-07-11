
// disfigure
//
// Functions to generate motion by bending a body as if it has joints and muscles


import { Vector3 } from 'three';
import { Fn, If, mat3, mix, normalGeometry, positionGeometry, transformNormalToView, uniform } from "three/tsl";



// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, joint, mat ])=>{

	var p = pos.sub( joint.pivot ).mul( mat ).add( joint.pivot );
	return mix( pos, p, joint.locus() );

} );//, { pos: 'vec3', center: 'vec3', amount: 'float', mat: 'mat3', return: 'vec3' } );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, joint, mat ])=>{

	var p = pos.mul( mat );
	return mix( pos, p, joint.locus() );

} );//, { pos: 'vec3', center: 'vec3', amount: 'float', mat: 'mat3', return: 'vec3' } );



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
//		posture - collection of angles for body posture
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, posture, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.wristLeft, posture.wristLeftMatrix ) );
		p.assign( fn( p, space.forearmLeft, posture.forearmLeftMatrix ) );
		p.assign( fn( p, space.elbowLeft, posture.elbowLeftMatrix ) );
		p.assign( fn( p, space.armLeft, posture.armLeftMatrix ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.wristRight, posture.wristRightMatrix ) );
		p.assign( fn( p, space.forearmRight, posture.forearmRightMatrix ) );
		p.assign( fn( p, space.elbowRight, posture.elbowRightMatrix ) );
		p.assign( fn( p, space.armRight, posture.armRightMatrix ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head, posture.headMatrix ) );
	p.assign( fn( p, space.chest, posture.chestMatrix ) );
	p.assign( fn( p, space.waist, posture.waistMatrix ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.footLeft, posture.footLeftMatrix ) );
		p.assign( fn( p, space.ankleLeft, posture.ankleLeftMatrix ) );
		p.assign( fn( p, space.ankleLongLeft, posture.ankleLongLeftMatrix ) );
		p.assign( fn( p, space.kneeLeft, posture.kneeLeftMatrix ) );
		p.assign( fn( p, space.legLongLeft, posture.legLongLeftMatrix ) );
		p.assign( fn( p, space.legLeft, posture.legLeftMatrix ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	If( legRight.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.footRight, posture.footRightMatrix ) );
		p.assign( fn( p, space.ankleRight, posture.ankleRightMatrix ) );
		p.assign( fn( p, space.ankleLongRight, posture.ankleLongRightMatrix ) );
		p.assign( fn( p, space.kneeRight, posture.kneeRightMatrix ) );
		p.assign( fn( p, space.legLongRight, posture.legLongRightMatrix ) );
		p.assign( fn( p, space.legRight, posture.legRightMatrix ) );

	} );

	return p;

} ); // disfigure



// create a default posture
function tslPosture( ) {

	return {


		// TORSO
		head: new Vector3( ),
		chest: new Vector3( ),
		waist: new Vector3( ),

		// TORSO
		headMatrix: uniform( mat3() ),
		chestMatrix: uniform( mat3() ),
		waistMatrix: uniform( mat3() ),

		// LEGS
		kneeLeft: new Vector3( ),
		kneeRight: new Vector3( ),
		ankleLeft: new Vector3( ),
		ankleRight: new Vector3( ),
		footLeft: new Vector3( ),
		footRight: new Vector3( ),
		legLeft: new Vector3( ),
		legLongLeft: new Vector3( ),
		legRight: new Vector3( ),
		legLongRight: new Vector3( ),
		ankleLongLeft: new Vector3( ),
		ankleLongRight: new Vector3( ),

		// LEGS
		kneeLeftMatrix: uniform( mat3() ),
		kneeRightMatrix: uniform( mat3() ),
		ankleLeftMatrix: uniform( mat3() ),
		ankleRightMatrix: uniform( mat3() ),
		footLeftMatrix: uniform( mat3() ),
		footRightMatrix: uniform( mat3() ),
		legLeftMatrix: uniform( mat3() ),
		legLongLeftMatrix: uniform( mat3() ),
		legRightMatrix: uniform( mat3() ),
		legLongRightMatrix: uniform( mat3() ),
		ankleLongLeftMatrix: uniform( mat3() ),
		ankleLongRightMatrix: uniform( mat3() ),

		// ARMS
		elbowLeft: new Vector3( ),
		elbowRight: new Vector3( ),
		forearmLeft: new Vector3( ),
		forearmRight: new Vector3( ),
		wristLeft: new Vector3( ),
		wristRight: new Vector3( ),
		armLeft: new Vector3( ),
		armRight: new Vector3( ),

		// ARMS
		armLeftMatrix: uniform( mat3() ),
		armRightMatrix: uniform( mat3() ),
		elbowLeftMatrix: uniform( mat3() ),
		elbowRightMatrix: uniform( mat3() ),
		forearmLeftMatrix: uniform( mat3() ),
		forearmRightMatrix: uniform( mat3() ),
		wristLeftMatrix: uniform( mat3() ),
		wristRightMatrix: uniform( mat3() ),

	};

}



export { tslPositionNode, tslNormalNode, tslPosture };
