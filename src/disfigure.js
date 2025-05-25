
// disfigure
// to do: simplify matrix operation when rotations are DOF<3

import { Vector3 } from "three";
import { float, Fn, If, mix, normalGeometry, positionGeometry, select, transformNormalToView, uniform, vec3 } from "three/tsl";
import { matRotXZY, matRotYXZ } from "./utils.js";



// a general class defining a locus in 3D space with fuzzy boundaries and orientation
class Locus {

	constructor( dims, pivot, range ) {

		this.dims = dims;

		this.pivot = new Vector3( pivot[ 0 ], pivot[ 1 ], pivot[ 2 ]);
		this.mirrorPivot = new Vector3( -pivot[ 0 ], pivot[ 1 ], pivot[ 2 ]);

		this.min = range[ 0 ];
		this.max = range[ 1 ];

	}

	encodeX( inX ) {

		var outX = Math.round( 1000*( inX-this.dims.x )/this.dims.scale );
		console.log( inX.toFixed( 4 ), '→', outX, '→', this.decodeX( outX ).toFixed( 4 ), '(', ( this.decodeX( outX )/inX*100-100 ).toFixed( 4 ) );
		return outX;

	}

	decodeX( outX ) {

		var inX = this.dims.scale*outX/1000 + this.dims.x;
		return inX;

	}

	encodeY( inY ) {

		var outY = Math.round( 1000*( inY-this.dims.y )/this.dims.scale );
		console.log( inY.toFixed( 4 ), '→', outY, '→', this.decodeY( outY ).toFixed( 4 ), '(', ( this.decodeY( outY )/inY*100-100 ).toFixed( 4 ) );
		return outY;

	}

	decodeY( outY ) {

		var inY = this.dims.scale*outY/1000 + this.dims.y;
		return inY;

	}


	encodeZ( inZ ) {

		var outZ = Math.round( 1000*( inZ-this.dims.z )/this.dims.scale );
		console.log( inZ.toFixed( 4 ), '→', outZ, '→', this.decodeZ( outZ ).toFixed( 4 ), '(', ( this.decodeZ( outZ )/inZ*100-100 ).toFixed( 4 ) );
		return outZ;

	}

	decodeZ( outZ ) {

		var inZ = this.dims.scale*outZ/1000 + this.dims.z;
		return inZ;

	}

	decode() {

		// console.log('---------')
		// this.encodeX(this.pivot.x);
		// this.encodeY(this.pivot.y);
		// this.encodeZ(this.pivot.z);
		this.pivot.x = this.decodeX( this.pivot.x );
		this.pivot.y = this.decodeY( this.pivot.y );
		this.pivot.z = this.decodeZ( this.pivot.z );
		this.mirrorPivot.x = this.decodeX( this.mirrorPivot.x );
		this.mirrorPivot.y = this.decodeY( this.mirrorPivot.y );
		this.mirrorPivot.z = this.decodeZ( this.mirrorPivot.z );

	}

}



// a horizontal planar locus, vertically is from min to max, horizontally is infinite
class LocusY extends Locus {

	constructor( dims, pivot, range ) {

		super( dims, pivot, range );
		this.decode();

	}

	decode( ) {

		super.decode( );

		// this.encodeY(this.min);
		// this.encodeY(this.max);

		this.min = this.decodeY( this.min );
		this.max = this.decodeY( this.max );

	}

	fuzzy( ) {

		return positionGeometry.y.smoothstep( this.min, this.max );

	}

}



// a horizontal planar locus that can tilt fowrard (i.e. around X axix, towards the screen)
// vertically is from min to max, horizontally is infinite
class LocusYZ extends LocusY {

	constructor( dims, pivot, range, angle ) {

		super( dims, pivot, range );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	fuzzy( ) {

		return positionGeometry.y.add( positionGeometry.z.div( this.slope ) ).smoothstep( this.min, this.max );

	}

}



// a vertical planar locus, perpendiculra to X, vertically infinite, horizontally from min to max
class LocusX extends Locus {

	constructor( dims, pivot, range ) {

		super( dims, pivot, range );
		this.decode();

	}

	decode( ) {

		super.decode( );

		// this.encodeX(this.min);
		// this.encodeX(this.max);

		this.min = this.decodeX( this.min );
		this.max = this.decodeX( this.max );

	}

	fuzzy( ) {

		return positionGeometry.x.smoothstep( this.min, this.max );

	}

	mirrorFuzzy( ) {

		return positionGeometry.x.smoothstep( -this.min, -this.max );

	}

}



// an intersection of LocusX and LocusY
class LocusXY extends Locus {

	constructor( dims, pivot, rangeX, rangeY ) {

		super( dims, pivot, rangeX );
		this.minY = rangeY[ 0 ];
		this.maxY = rangeY[ 1 ];
		this.decode();

	}

	decode( ) {

		super.decode( );

		// this.encodeX(this.min);
		// this.encodeX(this.max);

		// this.encodeY(this.minY);
		// this.encodeY(this.maxY);

		this.min = this.decodeX( this.min );
		this.max = this.decodeX( this.max );

		this.minY = this.decodeY( this.minY );
		this.maxY = this.decodeY( this.maxY );

	}

	fuzzy( ) {

		var x = positionGeometry.x.smoothstep( this.min, this.max );
		var y = positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

	mirrorFuzzy( ) {

		var x = positionGeometry.x.smoothstep( -this.min, -this.max );
		var y = positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

}



// trapezoidal Locus for hips
class LocusT extends Locus {

	constructor( dims, pivot, rangeY, topY, rangeX ) {

		super( dims, pivot, rangeY );
		this.topY = topY;
		this.minX = rangeX[ 0 ];
		this.maxX = rangeX[ 1 ];
		this.decode();

	}

	decode() {

		super.decode( );

		// this.encodeY(this.min);
		// this.encodeY(this.max);
		// this.encodeY(this.topY);
		// this.encodeX(this.minX);
		// this.encodeX(this.maxX);

		this.min = this.decodeY( this.min );
		this.max = this.decodeY( this.max );

		this.topY = this.decodeY( this.topY );

		this.minX = this.decodeX( this.minX );
		this.maxX = this.decodeX( this.maxX );

	}

	fuzzy( ) {

		var x = positionGeometry.x.toVar();
		var y = positionGeometry.y;

		//		x.mulAssign( float(1).add(y.sub(this.topY).div(2)) );

		return y.step( this.topY )
			.mul( x.smoothstep( this.minX, this.maxX ) )
			.mul( y.smoothstep(
				x.div( 0.7 ).add( this.min ),
				x.div( 7 ).add( this.max )
			)
			).pow( 2 );

	}

	mirrorFuzzy( ) {

		var x = positionGeometry.x;
		var y = positionGeometry.y;

		return y.step( this.topY )
			.mul( x.smoothstep( -this.minX, -this.maxX ) )
			.mul( y.smoothstep(
				x.div( -0.7 ).add( this.min ),
				x.div( -7 ).add( this.max )
			)
			).pow( 2 );

	}

}



var jointRotate= Fn( ([ pos, center, angle, amount ])=>{

	// for legs matRotYZX was better, but for all others matRotYXZ is better
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



var jointRotateArm= Fn( ([ pos, center, angle, amount ])=>{

	//return pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center );
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



function tslPositionNode( options ) {

	options.vertex = positionGeometry;
	options.mode = float( 1 );
	return disfigure( options );

}



function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.mode = float( 0 );
	return transformNormalToView( disfigure( options ) ).normalize( );

}



var disfigure = Fn( ( { skeleton, posture, mode, vertex } )=>{

	var p = vertex.toVar();



	// LEFT-UPPER BODY

	var armLeft = skeleton.arm.fuzzy( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.pivot ), posture.wristLeft, skeleton.wrist.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.pivot ), posture.forearmLeft, skeleton.forearm.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.pivot ), posture.elbowLeft, skeleton.elbow.fuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.pivot ), posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = skeleton.arm.mirrorFuzzy( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.mirrorPivot ), posture.wristRight, skeleton.wrist.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.mirrorPivot ), posture.forearmRight, skeleton.forearm.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.mirrorPivot ), posture.elbowRight, skeleton.elbow.mirrorFuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.mirrorPivot ), posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( skeleton.head.pivot ), posture.head, skeleton.head.fuzzy( ) ) );
	p.assign( jointRotate( p, mode.mul( skeleton.chest.pivot ), posture.chest, skeleton.chest.fuzzy() ) );
	p.assign( jointRotate( p, mode.mul( skeleton.waist.pivot ), posture.waist, skeleton.waist.fuzzy() ) );



	// LEFT-LOWER BODY

	var hipLeft = skeleton.hip.fuzzy( ).toVar();

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.pivot ), posture.footLeft, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.pivot ), posture.ankleLeft, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.pivot ), posture.legLeft, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.pivot ), posture.kneeLeft, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.pivot ), posture.hip2Left, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip.pivot ), posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = skeleton.hip.mirrorFuzzy( ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.mirrorPivot ), posture.footRight, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.mirrorPivot ), posture.ankleRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.mirrorPivot ), posture.legRight, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.mirrorPivot ), posture.kneeRight, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.mirrorPivot ), posture.hip2Right, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip.mirrorPivot ), posture.hipRight, hipRight ) );

	} );

	return p;

} ); // disfigure



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( skeleton.head.fuzzy( ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( skeleton.chest.fuzzy( ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( skeleton.waist.fuzzy( ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( skeleton.hip.fuzzy( ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( skeleton.leg.fuzzy( ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( skeleton.knee.fuzzy( ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( skeleton.ankle.fuzzy( ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( skeleton.foot.fuzzy( ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( skeleton.hip2.fuzzy( ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( skeleton.arm.fuzzy( ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( skeleton.elbow.fuzzy( ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( skeleton.forearm.fuzzy( ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( skeleton.wrist.fuzzy( ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		.clamp( 0, 1 )
		.negate( )
		.toVar( );
	/*
	k.assign( select( posture.isolated,
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );
*/
	If( k.lessThan( -0.999 ), ()=>{

		k.assign( 0.2 );

	} );
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



export { tslPositionNode, tslEmissiveNode, tslColorNode, tslNormalNode, tslPosture, LocusY, LocusYZ, LocusX, LocusXY, LocusT };
export * from "./utils.js";
