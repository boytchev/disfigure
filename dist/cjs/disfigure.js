// disfigure v0.0.2

'use strict';

var tsl = require('three/tsl');
require('three');

// generate X-rotation matrix
const matRotX = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

} ).setLayout( {
	name: 'matRotX',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Y-rotation matrix
const matRotY = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

} ).setLayout( {
	name: 'matRotY',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Z-rotation matrix
const matRotZ = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

} ).setLayout( {
	name: 'matRotZ',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate YXZ rotation matrix
const matRotYXZ = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

} ).setLayout( {
	name: 'matRotYXZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate YZX rotation matrix
const matRotYZX = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

} ).setLayout( {
	name: 'matRotYZX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XYZ rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

} ).setLayout( {
	name: 'matRotXYZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XZY rotation matrix
const matRotXZY = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

} ).setLayout( {
	name: 'matRotXZY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZXY rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

} ).setLayout( {
	name: 'matRotZXY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZYX rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

} ).setLayout( {
	name: 'matRotZYX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );

function selectWaist( { waistSpan } ) {

	return tsl.positionGeometry.y.smoothstep( waistSpan.x, waistSpan.y );

} // inlined



function selectHead( { headSpan } ) {

	return tsl.positionGeometry.y.add( tsl.positionGeometry.z.div( 3 ) ).smoothstep( headSpan.x, headSpan.y );

} // inlined



function selectChest( { chestSpan } ) {

	return tsl.positionGeometry.y.smoothstep( chestSpan.x, chestSpan.y );

} // inlined



function selectKneeLeft( { kneeLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( kneeLeftSpan.x, kneeLeftSpan.y );

} // inlined



function selectKneeRight( { kneeRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( kneeRightSpan.x, kneeRightSpan.y );

} // inlined



function selectAnkleLeft( { ankleLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( ankleLeftSpan.x, ankleLeftSpan.y );

} // inlined



function selectAnkleRight( { ankleRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( ankleRightSpan.x, ankleRightSpan.y );

} // inlined



function selectLegLeft( { legLeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( legLeftSpan.x, legLeftSpan.y ).pow( 1 );

} // inlined



function selectLegRight( { legRightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( legRightSpan.x, legRightSpan.y );

} // inlined



function selectHipLeft( { hipLeftSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.sub( x.mul( 2 ) )
		.smoothstep( hipLeftSpan.z, hipLeftSpan.w.sub( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ) )
		.mul( x.smoothstep( -0.01, 0.01 ) );

} // inlined



function selectHip2Left( { hip2LeftSpan } ) {

	return tsl.positionGeometry.y.smoothstep( hip2LeftSpan.x, hip2LeftSpan.y );

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.add( x.mul( 2 ) )
		.smoothstep( hipRightSpan.z, hipRightSpan.w.add( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipRightSpan.x, hipRightSpan.y ) )
		.mul( x.smoothstep( 0.01, -0.01 ) );

} // inlined



function selectHip2Right( { hip2RightSpan } ) {

	return tsl.positionGeometry.y.smoothstep( hip2RightSpan.x, hip2RightSpan.y );

} // inlined



function selectElbowLeft( { elbowLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( elbowLeftSpan.x, elbowLeftSpan.y );

} // inlined



function selectElbowRight( { elbowRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( elbowRightSpan.x, elbowRightSpan.y );

} // inlined



function selectForearmLeft( { forearmLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( forearmLeftSpan.x, forearmLeftSpan.y );

} // inlined



function selectForearmRight( { forearmRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( forearmRightSpan.x, forearmRightSpan.y );

} // inlined



function selectWristLeft( { wristLeftSpan } ) {

	return tsl.positionGeometry.x.smoothstep( wristLeftSpan.x, wristLeftSpan.y );

} // inlined



function selectWristRight( { wristRightSpan } ) {

	return tsl.positionGeometry.x.smoothstep( wristRightSpan.x, wristRightSpan.y );

} // inlined



function selectArmLeft( { armLeftSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return x
		.smoothstep( armLeftSpan.x, armLeftSpan.y )
		.mul( y.smoothstep( armLeftSpan.z, armLeftSpan.w ) );

} // inlined



function selectArmRight( { armRightSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return x
		.smoothstep( armRightSpan.x, armRightSpan.y )
		.mul( y.smoothstep( armRightSpan.z, armRightSpan.w ) );

} // inlined



var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

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



var jointRotateLeg= tsl.Fn( ([ pos, center, angle, amount ])=>{

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



var jointRotate2= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return tsl.mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( tsl.float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

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



var tslPositionNode = tsl.Fn( ( posture )=>{

	var p = tsl.positionGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( posture ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.wristLeftPos, posture.wristLeftTurn, selectWristLeft( posture ) ) );
		p.assign( jointRotate( p, posture.forearmLeftPos, posture.forearmLeftTurn, selectForearmLeft( posture ) ) );
		p.assign( jointRotate( p, posture.elbowLeftPos, posture.elbowLeftTurn, selectElbowLeft( posture ) ) );
		p.assign( jointRotate2( p, posture.armLeftPos, posture.armLeftTurn, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( posture ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

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

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.ankleLeftPos, posture.ankleLeftTurn, selectAnkleLeft( posture ) ) );
		p.assign( jointRotate( p, posture.legLeftPos, posture.legLeftTurn, selectLegLeft( posture ) ) );
		p.assign( jointRotate( p, posture.kneeLeftPos, posture.kneeLeftTurn, selectKneeLeft( posture ) ) );
		p.assign( jointRotateLeg( p, posture.hip2LeftPos, posture.hip2LeftTurn, selectHip2Left( posture ) ) );
		p.assign( jointRotateLeg( p, posture.hipLeftPos, posture.hipLeftTurn, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( posture ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, posture.ankleRightPos, posture.ankleRightTurn, selectAnkleRight( posture ) ) );
		p.assign( jointRotate( p, posture.legRightPos, posture.legRightTurn, selectLegRight( posture ) ) );
		p.assign( jointRotate( p, posture.kneeRightPos, posture.kneeRightTurn, selectKneeRight( posture ) ) );
		p.assign( jointRotateLeg( p, posture.hip2RightPos, posture.hip2RightTurn, selectHip2Right( posture ) ) );
		p.assign( jointRotateLeg( p, posture.hipRightPos, posture.hipRightTurn, hipRight ) );

	} );

	return p;

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = tsl.Fn( ( posture )=>{

	var s = posture.select;
	var k = tsl.float( 0 )
		.add( selectHead( posture ).mul( tsl.select( s.equal( 1 ), 1, 0 ) ) )
		.add( selectChest( posture ).mul( tsl.select( s.equal( 2 ), 1, 0 ) ) )
		.add( selectWaist( posture ).mul( tsl.select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectHipLeft( posture ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )
		.add( selectLegLeft( posture ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )
		.add( selectKneeLeft( posture ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )
		.add( selectAnkleLeft( posture ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )

	// .add( selectHipRight( posture ).mul( select( s.equal( 11 ), 1, 0 ) ) )
	// .add( selectLegRight( posture ).mul( select( s.equal( 12 ), 1, 0 ) ) )
	// .add( selectKneeRight( posture ).mul( select( s.equal( 13 ), 1, 0 ) ) )
	// .add( selectAnkleRight( posture ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		.add( selectArmLeft( posture ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )
		.add( selectElbowLeft( posture ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )
		.add( selectForearmLeft( posture ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )
		.add( selectWristLeft( posture ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )

		// .add( selectArmRight( posture ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		// .add( selectElbowRight( posture ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		// .add( selectForearmRight( posture ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		// .add( selectWristRight( posture ).mul( select( s.equal( 24 ), 1, 0 ) ) )
		.toVar( );

	k.assign( tsl.select( posture.isolated.equal( 0 ),
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );


	return tsl.vec3( 0, k.div( 2 ), k.div( 1 ) );

} );



var tslColorNode = tsl.Fn( ()=>{

	var p = tsl.positionGeometry;

	var k = tsl.float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return tsl.vec3( k );

} );

exports.tslColorNode = tslColorNode;
exports.tslEmissiveNode = tslEmissiveNode;
exports.tslPositionNode = tslPositionNode;
