
// disfigure
//
// A collection of space selectors - functions that return 1 if a point is inside
// the selected space, and 0 if it is outside. Boundaries of the spaces are foggy,
// so values between 0 and 1 are also possible.



import { Vector3 } from "three";
import { float, mat3, min, positionGeometry, uniform, vec3 } from "three/tsl";
import { smoother } from "./utils.js";



// clone an object and flip its pivot horizontally - this is used for all spaces
// that represent left-right symmetry in human body (e.g. left arm and right arm)
function clone( instance ) {

	var obj = Object.assign( Object.create( instance ), instance );
	obj.pivot = obj.pivot.clone();
	obj.pivot.x *= -1;
	obj.angle = new Vector3();
	obj.matrix = uniform( mat3() );
	return obj;

}



class Locus {

	constructor( pivot ) {

		// calculate a pivot vector with actual coordinates
		this.pivot = new Vector3( ...pivot );
		this.angle = new Vector3();
		this.matrix = uniform( mat3() );

	} // Locus.constructor

} // Locus



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY extends Locus {

	constructor( pivot, rangeY, angle=0, rangeX ) {

		super( pivot );

		this.minY = rangeY[ 0 ];
		this.maxY = rangeY[ 1 ];

		if ( rangeX ) {

			this.minX = rangeX[ 0 ];
			this.maxX = rangeX[ 1 ];

		}

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	mirror( ) {

		var obj = clone( this );
		if ( 'minX' in obj ) {

			obj.minX *= -1;
			obj.maxX *= -1;

		}

		return obj;

	} // mirror

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

	} // locus

} // LocusY



// define a vertical planar locus, perpendicular to X; vertically infinite,
// horizontally from minX to maxX
class LocusX extends Locus {

	constructor( pivot, rangeX ) {

		super( pivot );

		this.minX = rangeX[ 0 ];
		this.maxX = rangeX[ 1 ];

	} // constructor

	mirror( ) {

		var obj = clone( this );

		obj.minX *= -1;
		obj.maxX *= -1;

		return obj;

	} // mirror

	locus( pos = positionGeometry ) {

		var x = pos.x;

		return smoother( this.minX, this.maxX, x );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( pivot, rangeX, rangeY ) {

		super( pivot, rangeX );

		this.minY = rangeY[ 0 ];
		this.maxY = rangeY[ 1 ];

	} // constructor

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
			.pow( 2 );

	} // locus

} // LocusXY



// define custom locus specifically for hips
class LocusT extends LocusXY {

	constructor( pivot, rangeX, rangeY, grown=0 ) {

		super( pivot, rangeX, rangeY );

		this.grown = grown;

	} // constructor

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

		return float( s )
			.mul(
				x.smoothstep( this.minX, this.maxX ),
				smoother( this.minY, this.maxY, y ).pow( 2 ),
			);

	} // locus

} // LocusT



// the definition of a space around a model including properties of individual
// subspaces that simulate joints
class Space {

	constructor( bodyPartsDef ) {

		const classes = { LocusT: LocusT, LocusX: LocusX, LocusXY: LocusXY, LocusY: LocusY };

		// bodyPartsDef = { name:[LocusClassName, data], ... }
		var bodyParts = { };
		for ( var name in bodyPartsDef ) {

			var partClass = classes[ bodyPartsDef[ name ][ 0 ] ];
			bodyParts[ name ] = new partClass( ... bodyPartsDef[ name ].slice( 1 ) );

		}
		// bodyParts = { name:LocusInstance, ... }

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;
		this.torso = bodyParts.torso;

		// legs
		this.l_knee = bodyParts.knee;
		this.r_knee = bodyParts.knee.mirror();

		this.l_ankle = bodyParts.ankle;
		this.r_ankle = bodyParts.ankle.mirror();

		this.l_ankle2 = bodyParts.ankle2;
		this.r_ankle2 = bodyParts.ankle2.mirror();

		this.l_leg2 = bodyParts.leg2;
		this.r_leg2 = bodyParts.leg2.mirror();

		this.l_foot = bodyParts.foot;
		this.r_foot = bodyParts.foot.mirror();

		this.l_leg = bodyParts.leg;
		this.r_leg = bodyParts.leg.mirror();

		// arms
		this.l_elbow = bodyParts.elbow;
		this.r_elbow = bodyParts.elbow.mirror();

		this.l_wrist2 = bodyParts.wrist2;
		this.r_wrist2 = bodyParts.wrist2.mirror();

		this.l_wrist = bodyParts.wrist;
		this.r_wrist = bodyParts.wrist.mirror();

		this.l_arm = bodyParts.arm;
		this.r_arm = bodyParts.arm.mirror();

	} // Space.constructor

} // Space



export { Space, LocusX, LocusT };
