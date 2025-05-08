
// disfigure
// to do: simplify matrix operation when rotations are DOF<3

import { float, Fn, If, mix, positionGeometry, select, vec3 } from "three/tsl";
import { matRotXZY, matRotYXZ } from "./utils.js";



function selectWaist( { waistSpan } ) {

	return positionGeometry.y.smoothstep( waistSpan.x, waistSpan.y );

} // inlined



function selectHead( { headSpan } ) {

	return positionGeometry.y.add( positionGeometry.z.div( 3 ) ).smoothstep( headSpan.x, headSpan.y );

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

	return positionGeometry.y.smoothstep( legLeftSpan.x, legLeftSpan.y );

} // inlined



function selectLegRight( { legRightSpan } ) {

	return positionGeometry.y.smoothstep( legRightSpan.x, legRightSpan.y );

} // inlined



function selectHipLeft( { hipLeftSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.sub(x.mul(2))
		.smoothstep( hipLeftSpan.z, hipLeftSpan.w.sub(x.mul(1.6)) )
		.mul(y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ))
		.mul(x.smoothstep( -0.01, 0.01 ));

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.add(x.mul(2))
		.smoothstep( hipRightSpan.z, hipRightSpan.w.add(x.mul(1.6)) )
		.mul(y.smoothstep( hipRightSpan.x, hipRightSpan.y ))
		.mul(x.smoothstep( 0.01, -0.01 ));

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



function selectArmLeft( { armLeftSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return x
		.smoothstep( armLeftSpan.x, armLeftSpan.y )
		.mul( y.smoothstep( armLeftSpan.z, armLeftSpan.w ) );

} // inlined



function selectArmRight( { armRightSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return x
		.smoothstep( armRightSpan.x, armRightSpan.y )
		.mul( y.smoothstep( armRightSpan.z, armRightSpan.w ) );

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

	return mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

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



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( posture ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.wristLeftPos, posture.wristLeftTurn, selectWristLeft( posture ) ) );
		p.assign( jointRotate( p, posture.forearmLeftPos, posture.forearmLeftTurn, selectForearmLeft( posture ) ) );
		p.assign( jointRotate( p, posture.elbowLeftPos, posture.elbowLeftTurn, selectElbowLeft( posture ) ) );
		p.assign( jointRotate2( p, posture.armLeftPos, posture.armLeftTurn, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( posture ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.wristRightPos, posture.wristRightTurn, selectWristRight( posture ) ) );
		p.assign( jointRotate( p, posture.forearmRightPos, posture.forearmRightTurn, selectForearmRight( posture ) ) );
		p.assign( jointRotate( p, posture.elbowRightPos, posture.elbowRightTurn, selectElbowRight( posture ) ) );
		p.assign( jointRotate2( p, posture.armRightPos, posture.armRightTurn, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, posture.headPos, posture.headTurn, selectHead( posture ) ) );
	p.assign( jointRotate( p, posture.chestPos, posture.chestTurn, selectChest( posture ) ) );
	p.assign( jointRotate( p, posture.waistPos, posture.waistTurn, selectWaist( posture ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( posture ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.ankleLeftPos, posture.ankleLeftTurn, selectAnkleLeft( posture ) ) );
		p.assign( jointRotate( p, posture.legLeftPos, posture.legLeftTurn, selectLegLeft( posture ) ) );
		p.assign( jointRotate( p, posture.kneeLeftPos, posture.kneeLeftTurn, selectKneeLeft( posture ) ) );
		p.assign( jointRotate( p, posture.hipLeftPos, posture.hipLeftTurn, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( posture ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.ankleRightPos, posture.ankleRightTurn, selectAnkleRight( posture ) ) );
		p.assign( jointRotate( p, posture.legRightPos, posture.legRightTurn, selectLegRight( posture ) ) );
		p.assign( jointRotate( p, posture.kneeRightPos, posture.kneeRightTurn, selectKneeRight( posture ) ) );
		p.assign( jointRotate( p, posture.hipRightPos, posture.hipRightTurn, hipRight ) );

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

		.add( selectHipLeft( posture ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectLegLeft( posture ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectKneeLeft( posture ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( selectAnkleLeft( posture ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		// .add( selectHipRight( posture ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		// .add( selectLegRight( posture ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		// .add( selectKneeRight( posture ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		// .add( selectAnkleRight( posture ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		.add( selectArmLeft( posture ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowLeft( posture ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmLeft( posture ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristLeft( posture ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		// .add( selectArmRight( posture ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		// .add( selectElbowRight( posture ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		// .add( selectForearmRight( posture ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		// .add( selectWristRight( posture ).mul( select( s.equal( 24 ), 1, 0 ) ) )
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
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return vec3( k );

} );



export { tslPositionNode, tslEmissiveNode, tslColorNode };
