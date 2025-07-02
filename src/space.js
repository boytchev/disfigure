
// space 333


import { Vector3 } from "three";
import { float, min, positionGeometry, uniform, vec3 } from "three/tsl";
import { smoother } from "./utils.js";
import { DEBUG_NAME } from "./debug.js";



// calculate actual value from normalize value
function decode( value, scale, offset=0 ) {

	return scale*value/1000 + offset;

}



// calculate normalize value from actual value
function encode( value, scale, offset=0 ) {

	return ( value-offset )*1000/scale;

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
// areas outside rangeX are consider inside the locus
class LocusY {

	constructor( dims, pivot, rangeY, angle=0, rangeX ) {

		this.pivot = decodePivot( pivot, dims );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

		if ( rangeX ) {

			this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
			this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

		}

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	mirror( ) {

		var obj = clone( this );
		if ( 'minX' in obj ) {

			obj.minX *= -1;
			obj.maxX *= -1;

		}

		return obj;

	}

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var y = pos.y;
		var z = pos.z;

		if ( this.angle!=0 ) {

			y = y.add( z.sub( this.pivot.z ).div( this.slope ) );

		}

		var k = smoother( this.minY, this.maxY, y );

		if ( 'minX' in this ) {

			k = k.max(
				smoother( this.minX, this.maxX, x.abs().add( y.sub( this.pivot.y ) ) )
			);

		}

		return k;

	}

}



// define a vertical planar locus, perpendicular to X,
// vertically infinite, horizontally from minX to maxX
class LocusX {

	constructor( dims, pivot, rangeX, angle=0 ) {

		this.pivot = decodePivot( pivot, dims );

		this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
		this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	mirror( ) {

		var obj = clone( this );

		obj.minX *= -1;
		obj.maxX *= -1;

		return obj;

	}

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		var min = float( this.minX );
		var max = float( this.maxX );

		if ( this.angle!=0 ) {

			var dz = z.sub( this.pivot.z ).div( this.slope ).max( 0.01 ).mul( x.sign() );
			min = min.sub( dz );
			max = max.add( dz );

		}

		return smoother( min, max, x );

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

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var y = pos.y;

		var dx = pos.y.sub( this.pivot.y ).div( 4, x.sign() );

		var k = 0.8;

		return float( 1 )
			.mul( smoother( float( this.minX ).sub( dx ), float( this.maxX ).sub( dx ), x ) )

			.mul( min(
				smoother( this.minY, this.minY*k+( 1-k )*this.maxY, y ),
				smoother( this.maxY, this.maxY*k+( 1-k )*this.minY, y ),
			) )
			.pow( 2 )
		;

	}

}



// define custom trapezoidal locus specifically for hips
class LocusT extends LocusXY {

	constructor( dims, pivot, rangeX, rangeY, grown=0 ) {

		super( dims, pivot, rangeX, rangeY );

		this.grown = grown;

	}

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		if ( this.grown==0 ) {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.mul( 1/6 ) );
			var s = vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.13 ).pow( 10 );

		} else {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.abs().mul( 1/2 ) );
			var s = vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.065 ).pow( 10 );

		}


		//  var s = vec3(pos.x.mul(2.0),pos.y,pos.z.min(0)).sub(vec3(0,this.pivot.y,0)).length().smoothstep(0,0.065).pow(10);

		return float( s )
			.mul(
				x.smoothstep( this.minX, this.maxX ),
				smoother( this.minY, this.maxY, y ).pow( 2 ),
			);

	}

}



class Space {

	constructor( dims, bodyParts ) {

		const classes = { LocusT: LocusT, LocusX: LocusX, LocusXY: LocusXY, LocusY: LocusY/*, LocusBox:LocusBox*/ };

		// bodyParts = { _:[[rot]], name:[LocusClass, data], ... }

		for ( var name in bodyParts ) if ( name != '_' ) {

			var partClass = classes[ bodyParts[ name ].shift() ];
			bodyParts[ name ] = new partClass( dims, ... bodyParts[ name ]);

		}

		// bodyParts = { name:LocusInstance, ... }
		this._ = bodyParts._;

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;

		// legs
		this.kneeLeft = bodyParts?.kneeLeft ?? bodyParts.knee;
		this.kneeRight = bodyParts?.kneeRight ?? bodyParts.knee.mirror();

		this.ankleLeft = bodyParts?.ankleLeft ?? bodyParts.ankle;
		this.ankleRight = bodyParts?.ankleRight ?? bodyParts.ankle.mirror();

		this.ankleLongLeft = bodyParts?.ankleLongLeft ?? bodyParts.ankleLong;
		this.ankleLongRight = bodyParts?.ankleLongRight ?? bodyParts.ankleLong.mirror();

		this.legLongLeft = bodyParts?.legLongLeft ?? bodyParts.legLong;
		this.legLongRight = bodyParts?.legLongRight ?? bodyParts.legLong.mirror();

		this.footLeft = bodyParts?.footLeft ?? bodyParts.foot;
		this.footRight = bodyParts?.footRight ?? bodyParts.foot.mirror();

		this.legLeft = bodyParts?.legLeft ?? bodyParts.leg;
		this.legRight = bodyParts?.legRight ?? bodyParts.leg.mirror();

		// arms
		this.elbowLeft = bodyParts?.elbowLeft ?? bodyParts.elbow;
		this.elbowRight = bodyParts?.elbowRight ?? bodyParts.elbow.mirror();

		this.forearmLeft = bodyParts?.forearmLeft ?? bodyParts.forearm;
		this.forearmRight = bodyParts?.forearmRight ?? bodyParts.forearm.mirror();

		this.wristLeft = bodyParts?.wristLeft ?? bodyParts.wrist;
		this.wristRight = bodyParts?.wristRight ?? bodyParts.wrist.mirror();

		this.armLeft = bodyParts?.armLeft ?? bodyParts.arm;
		this.armRight = bodyParts?.armRight ?? bodyParts.arm.mirror();

		if ( DEBUG_NAME ) {

			this[ DEBUG_NAME ].pivot = uniform( this[ DEBUG_NAME ].pivot );
			if ( this[ DEBUG_NAME ] instanceof LocusX && !( this[ DEBUG_NAME ] instanceof LocusT ) ) {

				this[ DEBUG_NAME ].minX = uniform( this[ DEBUG_NAME ].minX );
				this[ DEBUG_NAME ].maxX = uniform( this[ DEBUG_NAME ].maxX );

			} else {

				this[ DEBUG_NAME ].minY = uniform( this[ DEBUG_NAME ].minY );
				this[ DEBUG_NAME ].maxY = uniform( this[ DEBUG_NAME ].maxY );

			}

		}

	}

}



export { Space, decode, encode, LocusX, LocusT };
