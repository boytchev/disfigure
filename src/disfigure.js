
// disfigure
// to do: select left/right can be calculated once
// to do: simplify matrix operation when rotations are DOF<3
// to do: optimize filtering upper/lower body part

import { float, Fn, If, positionGeometry, select, vec3 } from "three/tsl";
import { matRotYXZ, matRotYZX } from "./disfigure-matrices.js";



function selectLeft( ) {

	return positionGeometry.x.smoothstep( -2, 2 );

}



function selectRight( ) {

	return positionGeometry.x.smoothstep( 2, -2 );

}



function selectWaist( { waistSpan } ) {

	return positionGeometry.y.smoothstep( waistSpan.x, waistSpan.y );

} // inlined



function selectNeck( { neckSpan } ) {

	return positionGeometry.y.smoothstep( neckSpan.x, neckSpan.y );

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



function selectLegLeft( { legLeftSpan } ) {

	return positionGeometry.y.sub( positionGeometry.x.div( 0.35 ) )
		.smoothstep( legLeftSpan.x, legLeftSpan.y )
		.mul( positionGeometry.y.smoothstep( legLeftSpan.x, legLeftSpan.y ) );

} // inlined



function selectLegRight( { legRightSpan } ) {

	return positionGeometry.y.add( positionGeometry.x.div( 0.35 ) )
		.smoothstep( legRightSpan.x, legRightSpan.y )
		.mul( positionGeometry.y.smoothstep( legRightSpan.x, legRightSpan.y ) );

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

	// neck
	p.assign( jointRotate( p, posture.neckPos, posture.neckTurn, selectNeck( posture ) ) );

	// chest
	p.assign( jointRotate( p, posture.chestPos, posture.chestTurn, selectChest( posture ) ) );

	// waist
	p.assign( jointRotate( p, posture.waistPos, posture.waistTurn, selectWaist( posture ) ) );



	// LEFT-LOWER BODY

	If( left.greaterThan( 0 ), ()=>{

		// left ankle
		p.assign( jointRotate( p, posture.ankleLeftPos, posture.ankleLeftTurn, selectAnkleLeft( posture ) ) );

		// left knee
		p.assign( jointRotate( p, posture.kneeLeftPos, posture.kneeLeftTurn, selectKneeLeft( posture ) ) );

		// left leg
		p.assign( jointRotate( p, posture.legLeftPos, posture.legLeftTurn, selectLegLeft( posture ).mul( left ) ) );

	} );



	// RIGHT-LOWER BODY

	If( right.greaterThan( 0 ), ()=>{

		// right ankle
		p.assign( jointRotate( p, posture.ankleRightPos, posture.ankleRightTurn, selectAnkleRight( posture ) ) );

		// right knee
		p.assign( jointRotate( p, posture.kneeRightPos, posture.kneeRightTurn, selectKneeRight( posture ) ) );

		// right leg
		p.assign( jointRotate( p, posture.legRightPos, posture.legRightTurn, selectLegRight( posture ).mul( right ) ) );

	} );


	return p.debug();

} );



var tslEmissiveNode = Fn( ( posture )=>{

	var s = posture.select;
	var k = float( 0 )
	//			.add(selectArmRight( posture ))
	//			.add(selectArmLeft( posture ))
	//			.add(selectWristLeft( posture ))
	//			.add(selectWristRight( posture ))
		.add( selectWaist( posture ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( selectChest( posture ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( selectNeck( posture ).mul( select( s.equal( 3 ), 1, 0 ) ) );
	//			.add(selectKneeLeft( posture ))
	//			.add(selectKneeRight( posture ))
	//.add(selectAnkleLeft( posture ))
	//.add(selectAnkleRight( posture ))
	//			.add(selectLegLeft( posture ))
	//			.add(selectLegRight( posture ))


	k = k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).negate();

	return vec3( 0, k.div( 2 ), k.div( 1 ) );

} );


export { tslPositionNode, tslEmissiveNode };
