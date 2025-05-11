
// disfigure
// to do: simplify matrix operation when rotations are DOF<3

import { transformNormalToView, float, Fn, If, mix, positionGeometry, normalGeometry, select, uniform, vec3 } from "three/tsl";
import { /*matRotXYZ,*/ matRotXZY, matRotYXZ, matRotYZX, /*matRotZXY, matRotZYX*/ } from "./utils.js";



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



function selectFootLeft( { footLeftSpan, ankleLeftSpan } ) {

	return positionGeometry.z.smoothstep( footLeftSpan.x, footLeftSpan.y ).mul( positionGeometry.y.step(ankleLeftSpan.y) );

} // inlined



function selectFootRight( { footRightSpan, ankleRightSpan } ) {

	return positionGeometry.z.smoothstep( footRightSpan.x, footRightSpan.y ).mul( positionGeometry.y.step(ankleRightSpan.y) );

} // inlined



function selectLegLeft( { legLeftSpan } ) {

	return positionGeometry.y.smoothstep( legLeftSpan.x, legLeftSpan.y ).pow( 1 );

} // inlined



function selectLegRight( { legRightSpan } ) {

	return positionGeometry.y.smoothstep( legRightSpan.x, legRightSpan.y );

} // inlined



function selectHipLeft( { hipLeftSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.sub( x.mul( 2 ) )
		.smoothstep( hipLeftSpan.z, float(hipLeftSpan.w).sub( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ) )
		.mul( x.smoothstep( -0.01, 0.01 ) );

} // inlined



function selectHip2Left( { hip2LeftSpan } ) {

	return positionGeometry.y.smoothstep( hip2LeftSpan.x, hip2LeftSpan.y );

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.add( x.mul( 2 ) )
		.smoothstep( hipRightSpan.z, float(hipRightSpan.w).add( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipRightSpan.x, hipRightSpan.y ) )
		.mul( x.smoothstep( 0.01, -0.01 ) );

} // inlined



function selectHip2Right( { hip2RightSpan } ) {

	return positionGeometry.y.smoothstep( hip2RightSpan.x, hip2RightSpan.y );

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

var jointRotateNormal= Fn( ([ nor, angle, amount ])=>{

	return nor.mul( matRotYXZ( angle.mul( amount ) ) );

} ).setLayout( {
	name: 'jointRotateNormal',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateLeg= Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotateLeg',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateNormalLeg= Fn( ([ nor, angle, amount ])=>{

	return nor.mul( matRotYZX( angle.mul( amount ) ) );

} ).setLayout( {
	name: 'jointRotateNormalLeg',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
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



var jointRotateNormal2= Fn( ([ nor, angle, amount ])=>{

	return mix( nor, nor.mul( matRotXZY( angle.mul( amount ) ) ).mul( float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ), amount.pow( 0.25 ) );

} ).setLayout( {
	name: 'jointRotateNormal2',
	type: 'vec3',
	inputs: [
		{ name: 'nor', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var tslPositionNode = Fn( ( { skeleton, posture } )=>{

	var p = positionGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( skeleton ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.wristLeftPos, posture.wristLeft, selectWristLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.forearmLeftPos, posture.forearmLeft, selectForearmLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.elbowLeftPos, posture.elbowLeft, selectElbowLeft( skeleton ) ) );
		p.assign( jointRotate2( p, skeleton.armLeftPos, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.wristRightPos, posture.wristRight, selectWristRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.forearmRightPos, posture.forearmRight, selectForearmRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.elbowRightPos, posture.elbowRight, selectElbowRight( skeleton ) ) );
		p.assign( jointRotate2( p, skeleton.armRightPos, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, skeleton.headPos, posture.head, selectHead( skeleton ) ) );
	p.assign( jointRotate( p, skeleton.chestPos, posture.chest, selectChest( skeleton ) ) );
	p.assign( jointRotate( p, skeleton.waistPos, posture.waist, selectWaist( skeleton ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.footLeftPos, posture.footLeft, selectFootLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.ankleLeftPos, posture.ankleLeft, selectAnkleLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.legLeftPos, posture.legLeft, selectLegLeft( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.kneeLeftPos, posture.kneeLeft, selectKneeLeft( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2LeftPos, posture.hip2Left, selectHip2Left( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipLeftPos, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.footRightPos, posture.footRight, selectFootRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.ankleRightPos, posture.ankleRight, selectAnkleRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.legRightPos, posture.legRight, selectLegRight( skeleton ) ) );
		p.assign( jointRotate( p, skeleton.kneeRightPos, posture.kneeRight, selectKneeRight( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2RightPos, posture.hip2Right, selectHip2Right( skeleton ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipRightPos, posture.hipRight, hipRight ) );

	} );

	return p;

} );



var tslNormalNode = Fn( ( { skeleton, posture } )=>{

	var p = normalGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( skeleton ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristLeft, selectWristLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.forearmLeft, selectForearmLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.elbowLeft, selectElbowLeft( skeleton ) ) );
		p.assign( jointRotateNormal2( p, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristRight, selectWristRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.forearmRight, selectForearmRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.elbowRight, selectElbowRight( skeleton ) ) );
		p.assign( jointRotateNormal2( p, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotateNormal( p, posture.head, selectHead( skeleton ) ) );
	p.assign( jointRotateNormal( p, posture.chest, selectChest( skeleton ) ) );
	p.assign( jointRotateNormal( p, posture.waist, selectWaist( skeleton ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footLeft, selectFootLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.ankleLeft, selectAnkleLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.legLeft, selectLegLeft( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.kneeLeft, selectKneeLeft( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Left, selectHip2Left( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footRight, selectFootRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.ankleRight, selectAnkleRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.legRight, selectLegRight( skeleton ) ) );
		p.assign( jointRotateNormal( p, posture.kneeRight, selectKneeRight( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Right, selectHip2Right( skeleton ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipRight, hipRight ) );

	} );

	return transformNormalToView( p ).normalize( );

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( selectHead( skeleton ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( selectChest( skeleton ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( selectWaist( skeleton ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectHipLeft( skeleton ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectLegLeft( skeleton ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectKneeLeft( skeleton ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( selectAnkleLeft( skeleton ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( selectFootLeft( skeleton ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( selectHip2Left( skeleton ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( selectArmLeft( skeleton ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowLeft( skeleton ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmLeft( skeleton ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristLeft( skeleton ).mul( select( s.equal( 24 ), 1, 0 ) ) )

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
		hipLeft: uniform( vec3( 0, 0, 0 ) ),
		hip2Left: uniform( vec3( 0, 0, 0 ) ),
		hipRight: uniform( vec3( 0, 0, 0 ) ),
		hip2Right: uniform( vec3( 0, 0, 0 ) ),
		legLeft: uniform( vec3( 0, 0, 0 ) ),
		legRight: uniform( vec3( 0, 0, 0 ) ),

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



export { tslPositionNode, tslEmissiveNode, tslColorNode, tslNormalNode, tslPosture };
