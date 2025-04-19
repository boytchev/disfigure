
// disfigure
// to do: select left/right can be calculated once
// to do: simplify matrix operation when rotations are DOF<3
// to do: optimize filtering upper/lower body part

import { float, Fn, If, positionGeometry, select, vec3, cond } from "three/tsl";
import { matRotYXZ, matRotYZX } from "./disfigure-matrices.js";



function selectLeft( ) {

	return positionGeometry.x.smoothstep( -0.02, 0.02 );

}



function selectRight( ) {

	return positionGeometry.x.smoothstep( 0.02, -0.02 );

}



function selectWaist( { waistSpan } ) {
	return positionGeometry.y.smoothstep( waistSpan.x, waistSpan.y );

} // inlined



function selectHead( { headSpan } ) {

	return positionGeometry.y.add(positionGeometry.z.div(3)).smoothstep( headSpan.x, headSpan.y );

} // inlined



function selectChest( { chestSpan } ) {

	return positionGeometry.y.smoothstep( chestSpan.x, chestSpan.y );

} // inlined



function selectKneeLeft( { kneeLeftSpan } ) {

	return positionGeometry.y.smoothstep( kneeLeftSpan.x, kneeLeftSpan.y );

} // inlined



function selectKneeRight( { kneeRightSpan } ) {

	return positionGeometry.y.smoothstep( kneeRightSpan.x, kneeRightSpan.y );

} // inlined



function selectAnkleLeft( { ankleLeftSpan } ) {

	return positionGeometry.y.smoothstep( ankleLeftSpan.x, ankleLeftSpan.y );

} // inlined



function selectAnkleRight( { ankleRightSpan } ) {

	return positionGeometry.y.smoothstep( ankleRightSpan.x, ankleRightSpan.y );

} // inlined



function selectLegLeft( { legLeftSpan, waistSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;
	
	return y
		.smoothstep( legLeftSpan.x, legLeftSpan.y )
		.mul(x.sub(y.sub(2)).smoothstep( -0.1, 0.1 ).mul(x.smoothstep( -0.01, 0.01 )));

} // inlined



function selectLegRight( { legRightSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;
	
	return y
		.smoothstep( legRightSpan.x, legRightSpan.y )
		.mul(x.add(y.sub(2)).smoothstep( 0.1, -0.1 ).mul(x.smoothstep( 0.01, -0.01 )));

} // inlined



function selectElbowLeft( { elbowLeftSpan } ) {

	return positionGeometry.x.smoothstep( elbowLeftSpan.x, elbowLeftSpan.y );

} // inlined



function selectElbowRight( { elbowRightSpan } ) {

	return positionGeometry.x.smoothstep( elbowRightSpan.x, elbowRightSpan.y );

} // inlined



function selectForearmLeft( { forearmLeftSpan } ) {

	return positionGeometry.x.smoothstep( forearmLeftSpan.x, forearmLeftSpan.y );

} // inlined



function selectForearmRight( { forearmRightSpan } ) {

	return positionGeometry.x.smoothstep( forearmRightSpan.x, forearmRightSpan.y );

} // inlined



function selectWristLeft( { wristLeftSpan } ) {

	return positionGeometry.x.smoothstep( wristLeftSpan.x, wristLeftSpan.y );

} // inlined



function selectWristRight( { wristRightSpan } ) {

	return positionGeometry.x.smoothstep( wristRightSpan.x, wristRightSpan.y );

} // inlined



function selectArmLeft( { armLeftSpan, armLeftPos } ) {

	return positionGeometry.x
		.add( positionGeometry.y.sub( armLeftPos.y ).div( armLeftSpan.w ) )
		.mul( ( positionGeometry.y.smoothstep( armLeftSpan.z, armLeftPos.y ) ) )
		.smoothstep( armLeftSpan.x, armLeftSpan.y );

} // inlined



function selectArmRight( { armRightSpan, armRightPos } ) {

	return positionGeometry.x
		.add( positionGeometry.y.sub( armRightPos.y ).div( armRightSpan.w ) )
		.mul( ( positionGeometry.y.smoothstep( armRightSpan.z, armRightPos.y ) ) )
		.smoothstep( armRightSpan.x, armRightSpan.y );

} // inlined



var jointRotate= Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYXZ( angle.mul( amount ) ) ).add( center );

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



var jointRotate2= Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount ) ) ).mul( float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center );

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



var tslPositionNode = Fn( ( posture )=>{

	var p = positionGeometry.toVar();
	var left = selectLeft( ).toVar();
	var right = selectRight( ).toVar();



	// LEFT-UPPER BODY

	If( left.greaterThan( 0 ), ()=>{

		// left wrist
		p.assign( jointRotate( p, posture.wristLeftPos, posture.wristLeftTurn, selectWristLeft( posture ) ) );

		// left forearm
		p.assign( jointRotate( p, posture.forearmLeftPos, posture.forearmLeftTurn, selectForearmLeft( posture ) ) );

		// left elbow
		p.assign( jointRotate( p, posture.elbowLeftPos, posture.elbowLeftTurn, selectElbowLeft( posture ) ) );

		// left arm
		p.assign( jointRotate2( p, posture.armLeftPos, posture.armLeftTurn, selectArmLeft( posture ) ) );

	} );



	// RIGHT-UPPER BODY

	If( right.greaterThan( 0 ), ()=>{

		// right wrist
		p.assign( jointRotate( p, posture.wristRightPos, posture.wristRightTurn, selectWristRight( posture ) ) );

		// right forearm
		p.assign( jointRotate( p, posture.forearmRightPos, posture.forearmRightTurn, selectForearmRight( posture ) ) );

		// right elbow
		p.assign( jointRotate( p, posture.elbowRightPos, posture.elbowRightTurn, selectElbowRight( posture ) ) );

		// right arm
		p.assign( jointRotate2( p, posture.armRightPos, posture.armRightTurn, selectArmRight( posture ) ) );

	} );



	// CENTRAL BODY AXIS

	// head
	p.assign( jointRotate( p, posture.headPos, posture.headTurn, selectHead( posture ) ) );

	// chest
	p.assign( jointRotate( p, posture.chestPos, posture.chestTurn, selectChest( posture ) ) );

	// waist
	p.assign( jointRotate( p, posture.waistPos, posture.waistTurn, selectWaist( posture ) ) );



	// LEFT-LOWER BODY

	var legLeft = selectLegLeft( posture ).toVar();
	
	If( legLeft.greaterThan( 0 ), ()=>{

		// left ankle
		p.assign( jointRotate( p, posture.ankleLeftPos, posture.ankleLeftTurn, selectAnkleLeft( posture ) ) );

		// left knee
		p.assign( jointRotate( p, posture.kneeLeftPos, posture.kneeLeftTurn, selectKneeLeft( posture ) ) );

		// left leg
		p.assign( jointRotate( p, posture.legLeftPos, posture.legLeftTurn, legLeft ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = selectLegRight( posture ).toVar();
	
	If( legRight.greaterThan( 0 ), ()=>{

		// right ankle
		p.assign( jointRotate( p, posture.ankleRightPos, posture.ankleRightTurn, selectAnkleRight( posture ) ) );

		// right knee
		p.assign( jointRotate( p, posture.kneeRightPos, posture.kneeRightTurn, selectKneeRight( posture ) ) );

		// right leg
		p.assign( jointRotate( p, posture.legRightPos, posture.legRightTurn, legRight ) );

	} );

	return p;

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = Fn( ( posture )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( selectHead( posture ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( selectChest( posture ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( selectWaist( posture ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectLegLeft( posture ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectKneeLeft( posture ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectAnkleLeft( posture ).mul( select( s.equal( 13 ), 1, 0 ) ) )

		.add( selectLegRight( posture ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectKneeRight( posture ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectAnkleRight( posture ).mul( select( s.equal( 13 ), 1, 0 ) ) )

		.add( selectArmLeft( posture ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowLeft( posture ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmLeft( posture ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristLeft( posture ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		.add( selectArmRight( posture ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowRight( posture ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmRight( posture ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristRight( posture ).mul( select( s.equal( 24 ), 1, 0 ) ) )
		.toVar( );

	k.assign( select( posture.isolated.equal( 0 ),
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );


	return vec3( 0, k.div( 2 ), k.div( 1 ) );

} );



var tslColorNode = Fn( ()=>{

	var p = positionGeometry;

	var k = float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add(p.y.mul(4.5).add(0.5).cos().mul(1).add(2.5)).abs().smoothstep( 0.6, 0 ) )
		.smoothstep(0.6,1)
		.oneMinus()
		.pow( 0.1 )
		;

	//var k = positionGeometry.div(1.88).cos().length().mul(0.75*Math.PI).sin().pow(24*3).oneMinus().add(0.2);

	return vec3( k );

} );



export { tslPositionNode, tslEmissiveNode, tslColorNode };
