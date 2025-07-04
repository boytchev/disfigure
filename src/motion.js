
// motion
// to do: simplify matrix operation when rotations are DOF<3

import { float, Fn, If, normalGeometry, positionGeometry, transformNormalToView, uniform, vec3 } from "three/tsl";
import { matRotXZY, matRotYZX } from "./utils.js";



var jointRotate= Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotate',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateArm= Fn( ([ pos, center, angle, amount ])=>{



	//matRotXZY, matRotYXZ, matRotYZX
	var newPos = pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center ).toVar();

	return newPos;

} ).setLayout( {
	name: 'jointRotate2',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



function tslPositionNode( options ) {

	options.vertex = positionGeometry;
	options.mode = float( 1 );
	return disfigure( options );

}



function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.mode = float( 0 );
	return transformNormalToView( disfigure( options ) ).xyz;//.normalize( );

}



var disfigure = Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();


	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft, space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft, space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft, space.armLeft.locus( )/*, space.armLeft.sublocus(  )*/ ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristRight.pivot ), posture.wristRight, space.wristRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmRight.pivot ), posture.forearmRight, space.forearmRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowRight.pivot ), posture.elbowRight, space.elbowRight.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armRight.pivot ), posture.armRight, space.armRight.locus( )/*, space.armRight.sublocus(  )*/ ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( space.head.pivot ), posture.head, space.head.locus( ) ) );
	p.assign( jointRotate( p, mode.mul( space.chest.pivot ), posture.chest, space.chest.locus() ) );
	p.assign( jointRotate( p, mode.mul( space.waist.pivot ), posture.waist, space.waist.locus() ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft, space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongLeft.pivot ), posture.ankleLongLeft, space.ankleLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongLeft.pivot ), posture.legLongLeft, space.legLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft, legLeft ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	If( legRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footRight.pivot ), posture.footRight, space.footRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleRight.pivot ), posture.ankleRight, space.ankleRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongRight.pivot ), posture.ankleLongRight, space.ankleLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeRight.pivot ), posture.kneeRight, space.kneeRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongRight.pivot ), posture.legLongRight, space.legLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legRight.pivot ), posture.legRight, legRight ) );

	} );

	return p;

} ); // disfigure



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
