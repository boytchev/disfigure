
// space 283


import { Vector3 } from "three";
import { positionGeometry } from "three/tsl";



// calculate actual value from normalize value
function decode( value, scale, offset ) {

	return scale*value/1000 + offset;

}



// calculate a pivot vector with actual coordinates
function decodePivot( pivot, dims ) {

	return new Vector3(
		decode( pivot[ 0 ], dims.scale, dims.x ),
		decode( pivot[ 1 ], dims.scale, dims.y ),
		decode( pivot[ 2 ], dims.scale, dims.z ),
	);

}



// clone an object and flip its pivot horizontally
function clone( instance ) {

	var obj = Object.assign( Object.create( instance ), instance );
	obj.pivot = obj.pivot.clone();
	obj.pivot.x *= -1;
	return obj;

}



// define a horizontal planar locus that can tilt fowrard
// (i.e. around X axix, towards the screen); vertically it
// is from minY to maxY, horizontally it is infinite
class LocusY {

	constructor( dims, pivot, rangeY, angle=0 ) {

		this.pivot = decodePivot( pivot, dims );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	mirror( ) {

		return clone( this );

	}

	locus( ) {

		var y = positionGeometry.y;
		if ( this.angle!=0 ) y = y.add( positionGeometry.z.div( this.slope ) );

		return y.smoothstep( this.minY, this.maxY );

	}

}



// define a vertical planar locus, perpendicular to X,
// vertically infinite, horizontally from minX to maxX
class LocusX {

	constructor( dims, pivot, rangeX ) {

		this.pivot = decodePivot( pivot, dims );

		this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
		this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

	}

	mirror( ) {

		var obj = clone( this );
		obj.minX *= -1;
		obj.maxX *= -1;
		return obj;

	}

	locus( ) {

		return positionGeometry.x.smoothstep( this.minX, this.maxX );

	}

}



// define a rectangular locus, from minX to maxX, from minY
// to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( dims, pivot, rangeX, rangeY ) {

		super( dims, pivot, rangeX );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

	}

	locus( ) {

		var x = positionGeometry.x.smoothstep( this.minX, this.maxX );
		var y = positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

}



// define custom trapezoidal locus specifically for hips
class LocusT extends LocusXY {

	constructor( dims, pivot, rangeX, rangeY, topY ) {

		super( dims, pivot, rangeX, rangeY );

		this.topY = decode( topY, dims.scale, dims.y );

	}

	locus( ) {

		var x = positionGeometry.x.toVar();
		var y = positionGeometry.y;

		return y.step( this.topY )
			.mul( x.smoothstep( this.minX, this.maxX ) )
			.mul( y.smoothstep(
				x.abs().div( 0.7 ).add( this.minY ),
				x.abs().div( 7.0 ).add( this.maxY )
			)
			).pow( 2 );

	}

}



class Space {

	constructor( dims, bodyParts ) {

		// bodyParts = { name:[LocusClass, data], ... }

		for ( var name in bodyParts ) {

			var partClass = bodyParts[ name ].shift();
			bodyParts[ name ] = new partClass( dims, ... bodyParts[ name ]);

		}

		// bodyParts = { name:LocusInstance, ... }

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;

		// legs
		this.kneeLeft = bodyParts?.kneeLeft ?? bodyParts.knee;
		this.kneeRight = bodyParts?.kneeRight ?? bodyParts.knee.mirror();

		this.ankleLeft = bodyParts?.ankleLeft ?? bodyParts.ankle;
		this.ankleRight = bodyParts?.ankleRight ?? bodyParts.ankle.mirror();

		this.legLeft = bodyParts?.legLeft ?? bodyParts.leg;
		this.legRight = bodyParts?.legRight ?? bodyParts.leg.mirror();

		this.hip2Left = bodyParts?.hip2Left ?? bodyParts.hip2;
		this.hip2Right = bodyParts?.hip2Right ?? bodyParts.hip2.mirror();

		this.footLeft = bodyParts?.footLeft ?? bodyParts.foot;
		this.footRight = bodyParts?.footRight ?? bodyParts.foot.mirror();

		this.hipLeft = bodyParts?.hipLeft ?? bodyParts.hip;
		this.hipRight = bodyParts?.hipRight ?? bodyParts.hip.mirror();

		// arms
		this.elbowLeft = bodyParts?.elbowLeft ?? bodyParts.elbow;
		this.elbowRight = bodyParts?.elbowRight ?? bodyParts.elbow.mirror();

		this.forearmLeft = bodyParts?.forearmLeft ?? bodyParts.forearm;
		this.forearmRight = bodyParts?.forearmRight ?? bodyParts.forearm.mirror();

		this.wristLeft = bodyParts?.wristLeft ?? bodyParts.wrist;
		this.wristRight = bodyParts?.wristRight ?? bodyParts.wrist.mirror();

		this.armLeft = bodyParts?.armLeft ?? bodyParts.arm;
		this.armRight = bodyParts?.armRight ?? bodyParts.arm.mirror();

	}

}



export { LocusY, LocusX, LocusXY, LocusT, Space };
