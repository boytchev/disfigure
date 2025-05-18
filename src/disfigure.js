
// disfigure
// to do: simplify matrix operation when rotations are DOF<3

import { Vector3 } from "three";
import { float, Fn, If, mix, normalGeometry, positionGeometry, select, transformNormalToView, uniform, vec3 } from "three/tsl";
import { /*matRotXYZ,*/ matRotXZY, matRotYXZ, matRotYZX, /*matRotZXY, matRotZYX*/ } from "./utils.js";



// a class defining a locus in 3D space with fuzzy boundaries and orientation
class Locus {

	constructor( x, y, z, min, max ) {

		this.pivot = new Vector3( x, y, z );
		this.mirrorPivot = new Vector3( -x, y, z );

		this.min = min;
		this.max = max;

	}

}



// a horizontal XZ-flat locus, horizontally infinite, vertically from min to max
class LocusY extends Locus {

	fuzzy( ) {

		return positionGeometry.y.smoothstep( this.min, this.max );

	}

}



// a horizontal XZ-flat locus at angle degrees, horizontally infinite, vertically from min to max
class LocusYZ extends Locus {

	constructor( x, y, z, min, max, angle ) {

		super( x, y, z, min, max );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	fuzzy( ) {

		return positionGeometry.y.add( positionGeometry.z.div( this.slope ) ).smoothstep( this.min, this.max );

	}

}



// a vertical YZ-flat locus at angle degrees, vertically infinite, X-horizontally from min to max
class LocusX extends Locus {

	fuzzy( ) {

		return positionGeometry.x.smoothstep( this.min, this.max );

	}

	mirrorFuzzy( ) {

		return positionGeometry.x.smoothstep( -this.min, -this.max );

	}

}



function selectHipLeft( { hipLeftSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.sub( x.mul( 2 ) )
		.smoothstep( hipLeftSpan.z, float( hipLeftSpan.w ).sub( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ) )
		.mul( x.smoothstep( -0.01, 0.01 ) );

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = positionGeometry.x;
	var y = positionGeometry.y;

	return y.add( x.mul( 2 ) )
		.smoothstep( hipRightSpan.z, float( hipRightSpan.w ).add( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipRightSpan.x, hipRightSpan.y ) )
		.mul( x.smoothstep( 0.01, -0.01 ) );

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

		p.assign( jointRotate( p, skeleton.wrist.pivot, posture.wristLeft, skeleton.wrist.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.forearm.pivot, posture.forearmLeft, skeleton.forearm.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.elbow.pivot, posture.elbowLeft, skeleton.elbow.fuzzy( ) ) );
		p.assign( jointRotate2( p, skeleton.armLeftPos, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.wrist.mirrorPivot, posture.wristRight, skeleton.wrist.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.forearm.mirrorPivot, posture.forearmRight, skeleton.forearm.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.elbow.mirrorPivot, posture.elbowRight, skeleton.elbow.mirrorFuzzy( ) ) );
		p.assign( jointRotate2( p, skeleton.armRightPos, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, skeleton.head.pivot, posture.head, skeleton.head.fuzzy( ) ) );
	p.assign( jointRotate( p, skeleton.chest.pivot, posture.chest, skeleton.chest.fuzzy() ) );
	p.assign( jointRotate( p, skeleton.waist.pivot, posture.waist, skeleton.waist.fuzzy() ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.foot.pivot, posture.footLeft, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.ankle.pivot, posture.ankleLeft, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.leg.pivot, posture.legLeft, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.knee.pivot, posture.kneeLeft, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2.pivot, posture.hip2Left, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipLeftPos, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, skeleton.foot.mirrorPivot, posture.footRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.ankle.mirrorPivot, posture.ankleRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.leg.mirrorPivot, posture.legRight, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, skeleton.knee.mirrorPivot, posture.kneeRight, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotateLeg( p, skeleton.hip2.mirrorPivot, posture.hip2Right, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotateLeg( p, skeleton.hipRightPos, posture.hipRight, hipRight ) );

	} );

	return p;

} );



var tslNormalNode = Fn( ( { skeleton, posture } )=>{

	var p = normalGeometry.toVar();



	// LEFT-UPPER BODY

	var armLeft = selectArmLeft( skeleton ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristLeft, skeleton.wrist.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.forearmLeft, skeleton.forearm.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.elbowLeft, skeleton.elbow.fuzzy( ) ) );
		p.assign( jointRotateNormal2( p, posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = selectArmRight( skeleton ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.wristRight, skeleton.wrist.mirrorFuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.forearmRight, skeleton.forearm.mirrorFuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.elbowRight, skeleton.elbow.mirrorFuzzy( ) ) );
		p.assign( jointRotateNormal2( p, posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotateNormal( p, posture.head, skeleton.head.fuzzy( ) ) );
	p.assign( jointRotateNormal( p, posture.chest, skeleton.chest.fuzzy( ) ) );
	p.assign( jointRotateNormal( p, posture.waist, skeleton.waist.fuzzy( ) ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footLeft, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.ankleLeft, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.legLeft, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.kneeLeft, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Left, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotateNormal( p, posture.footRight, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.ankleRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.legRight, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotateNormal( p, posture.kneeRight, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hip2Right, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotateNormalLeg( p, posture.hipRight, hipRight ) );

	} );

	return transformNormalToView( p ).normalize( );

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( skeleton.head.fuzzy( ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( skeleton.chest.fuzzy( ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( skeleton.waist.fuzzy( ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectHipLeft( skeleton ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( skeleton.leg.fuzzy( ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( skeleton.knee.fuzzy( ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( skeleton.ankle.fuzzy( ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( skeleton.foot.fuzzy( ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( skeleton.hip2.fuzzy( ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( selectArmLeft( skeleton ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( skeleton.elbow.fuzzy( ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( skeleton.forearm.fuzzy( ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( skeleton.wrist.fuzzy( ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		.toVar( );

	k.assign( select( posture.isolated,
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



export { tslPositionNode, tslEmissiveNode, tslColorNode, tslNormalNode, tslPosture, LocusY, LocusYZ, LocusX };
export * from "./utils.js";
export * from "./disfigure-gui.js";
