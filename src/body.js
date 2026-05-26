/**
 * Disfigure Body
 *
 * -----------------------------------------------------------------------------
 *
 * Creates a default provisional world and environment.
 *
 * This module provides a high-level API for creating and animating 3D human
 * figures (men, women, children) using Three.js InstancedMesh for performance.
 *
 * It handles skeletal posing via Euler angles (in degrees), joint hierarchies,
 * quaternion conversion, and attachment of custom objects to joints.
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * EulerDegrees - an THREE.Euler class representing a joint
 *
 *   .x, .y, .z		- properties for Euler angles in degrees
 *	 .q				- read-only property to get the quaternion
 *
 *   .attach( )		- attach an object to the joint
 *
 * Body - base class for general human figure.
 *
 *	 .material		- material of the pool
 *   .head, .waist... - named properties for each joint
 *
 *   .posture		- property to get and set the posture
 *   .postureString - read-only property to get the posture as a string
 *   .blend( )		- blends two postures
 *
 * -----------------------------------------------------------------------------
 *
 * Developers API:
 *
 * EulerDegrees - an THREE.Euler class representing a joint
 *
 *   .body			- link to joint body
 *	 .index			- index of joint within body (0 to PURE_QUATS_PER_BODY)
 *   .parentIndex	- index of parent joint
 *   .signs			- direciton of joint angle rotations
 *	 .quaternion	- quaternion representation of the Euler angles
 *	 .attached		- list of external objects attached to the joint
 *
 *	 .q				- read-only property to get the quaternion
 *
 *   .set( )		- verbatim set of Euler angles
 *
 * Body - base class for general human figure.
 *
 *   .pool			- instance pool of the figure
 *   .pid			- index within the pool
 *   .uid			- global index and index in quaternion data texture
 *	 .material		- material of the pool
 *   .eulers[]		- array of body joints (doubled as properties: .head, .l_arm, ...)
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */



import { Euler, MathUtils, Object3D, Quaternion, Vector3 } from 'three';
import { config, everybody, JOINTS, pivots, PURE_QUATS_PER_BODY, QUAT_DATA_INDEX, QUATS_PER_BODY, quatTextureNode } from './assets.js';
import { Pool } from './pool.js';



/**
 * Utility functions for degrees-radian conversion
 */
var toDeg = x => x * 180 / Math.PI,
	toRad = x => x / 180 * Math.PI;



/**
 * Global unique identifier for figures independend on their type.
 * The `uid` of a body is also index in the quaternion data texture.
 */
var uid = 0;



/**
 * Instance pools management - an array of all pools
 */
var pools = { man: null, woman: null, child: null };



/**
 * Shared temporary variables (to reduce GC pressure)
 */
var _p = new Vector3(),
	_q = new Quaternion(),
	pivot = new Vector3();



/**
 * Extended Euler class that works with degrees and maintains a live quaternion.
 * Used internally by each joint of a body.
 *
 * An instance of EulerDegree represents a body joint.
 */
class EulerDegrees extends Euler {

	constructor( body, index, parentIndex, signs ) {

		super();

		this.body = body; // the parent body
		this.index = index; // joint index in the skeleton
		this.parentIndex = parentIndex; // index of the parent joint (or -1 for root)
		this.signs = signs; // directions of angles

		this.quaternion = new Quaternion();
		this.needsUpdate = true; // the quaternion must be recomputed

		this.attached = []; // external objects attached to this joint

	}



	/**
	 * Set verbatim all three angles at once (in degrees)
	 */
	set( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

	}



	/**
	 * Set an individual X, Y or Z angle (in degrees)
	 */
	set x( n ) {

		super.x = toRad( this.signs.x*n );
		this.needsUpdate = true;

	}

	set y( n ) {

		super.y = toRad( this.signs.y*n );
		this.needsUpdate = true;

	}

	set z( n ) {

		super.z = toRad( this.signs.z*n );
		this.needsUpdate = true;

	}




	/**
	 * Get an individual X, Y or Z angle (in degrees)
	 */
	get x( ) {

		return toDeg( this.signs.x*super.x );

	}

	get y( ) {

		return toDeg( this.signs.y*super.y );

	}

	get z( ) {

		return toDeg( this.signs.z*super.z );

	}



	/**
	 * Get the current quaternion (computed lazily)
	 */
	get q( ) {

		if ( this.needsUpdate ) {

			this.quaternion.setFromEuler( this );
			this.needsUpdate = false;

		}

		return this.quaternion;

	}



	/**
     * Attach a Three.js Object3D to this joint.
     * The object will follow the joint's world transform.
     */
	attach( object ) {

		object.initialPosition = object.position.clone();
		object.initialQuaternion = object.quaternion.clone();
		object.matrixAutoUpdate = false;

		this.attached.push( object );

		this.body.pool.add( object );


	}

}



/**
 * Base class representing a single animated human figure.
 * Manages pose, instancing, and attached objects.
 *
 * The body is created as instance in `pool`, its type is
 * in `bodyTypeIndex` (0=man, 1=woman, 2=child).
 */
class Body extends Object3D {

	constructor( pool, bodyTypeIndex, scale ) {

		super();

		this.pool = pool;
		this.pid = pool.getBody(); // instance index within the pool
		this.uid = uid++; // global body index
		this.material = this.pool.material; // expose to outside

		this.scale.setScalar( scale );

		// Register this body in the global quaternion data array

		quatTextureNode.setQuaternionCapacity( Math.max( uid+1, config.men+config.women+config.children, config.population ), QUATS_PER_BODY );
		quatTextureNode.set( this.uid, QUAT_DATA_INDEX, bodyTypeIndex, 0, 0, 0 );

		this.quaternionOffset = bodyTypeIndex*PURE_QUATS_PER_BODY;

		pool.uidsArray[ this.pid ] = this.uid;

		this.eulers = [];

		// Create Euler-quaternions for joints

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			this.eulers.push( new EulerDegrees( this, i, JOINTS[ i ].parentIndex, JOINTS[ i ].signs ) );

			this[ JOINTS[ i ].name ] = this.eulers[ i ];

		}

		everybody.push( this );

	}



	/**
     * Update the body's transform and all joint quaternions.
     * Also updates any objects attached to joints.
     */
	update( ) {

		this.updateMatrix();
		this.pool.setMatrixAt( this.pid, this.matrix );
		this.pool.instanceMatrix.needsUpdate = true;

		// Push joint quaternions to shared data buffer

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			quatTextureNode.set( this.uid, i, ...this.eulers[ i ].q );

		}

		// Update attached objects (forward kinematics) - scan all joints

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			var _euler = this.eulers[ i ];

			// Process one by one attached objects to specific joint

			for ( var object of _euler.attached ) {

				var euler = _euler;

				// Apply this joint transformation

				pivot.set( ...pivots.array[ euler.index+this.quaternionOffset ]);

				_p.copy( object.initialPosition );
				_p.add( pivot );

				_q.copy( object.initialQuaternion );


				// Scan all parents and apply their transformation too

				scan: while ( euler ) {

					pivot.set( ...pivots.array[ euler.index+this.quaternionOffset ]);

					_p.sub( pivot ).applyQuaternion( euler.quaternion ).add( pivot );
					_q.premultiply( euler.quaternion );

					if ( euler.parentIndex<0 ) break scan;

					euler = this.eulers[ euler.parentIndex ];

				}

				// Apply position and scale

				_p.multiply( this.scale );
				_p.add( this.position );

				// Update the attached object

				object.position.copy( _p );
				object.quaternion.copy( _q );
				object.updateMatrix();

			} // for object

		} // for i

	}



	/**
     * Get current posture as a serializable object (angles in degrees)
     */
	get posture() {

		var r = x=>Math.round( 100*( Object.is( x, -0 )?0:x ) )/100; // round a number

		return {
			version: 9,
			angles: this.eulers.map( e=>[ r( e.x ), r( e.y ), r( e.z ) ]),
		};

	}



	/**
     * Get current posture as a compact JSON string
     */
	get postureString() {

		return JSON.stringify( this.posture );

	}



	/**
     * Set posture from saved data
     */
	set posture( data ) {

		if ( data.version !=9 )
			throw new Error( 'Incompatible posture version' );

		for ( var i in data.angles ) {

			this.eulers[ i ].x = data.angles[ i ][ 0 ];
			this.eulers[ i ].y = data.angles[ i ][ 1 ];
			this.eulers[ i ].z = data.angles[ i ][ 2 ];

		}

	}


	/**
     * Linearly interpolate between `postureA` and `postureB` with factor `k`
     */
	blend( postureA, postureB, k ) {

		function lerp( a, b ) {

			var c = [];
			for ( var i=0; i<a.length; i++ )
				c[ i ] = MathUtils.lerp( a[ i ], b[ i ], k );

			return c;

		}

		if ( postureA.version !=9 || postureB.version !=9 )
			throw new Error( 'Incompatible posture version' );

		this.posture = {
			version: 9,
			angles: postureA.angles.map( ( a, i ) => lerp( a, postureB.angles[ i ]) ),
		};

	}

}



/**
 * Prepare a pool for figures with specific `name`.
 * If not existing, create it with capacity of `initialCount`.
 * If full, create a new pool and move all figures in it.
 */
function preparePool( name, initialCount ) {

	// Pool initial creation

	if ( pools[ name ] == null ) {

		pools[ name ] = new Pool( name, initialCount );

	}

	// Pool growth logic

	if ( pools[ name ].isFull() ) {


		// Get a twice larger pool

		var oldPool = pools[ name ];
		var newPool = new Pool( name, 2*oldPool.count );

		oldPool.addToScene = false;
		oldPool.removeFromParent();

		// Reassign bodies to new pool

		for ( var body of everybody )
			if ( body.pool == oldPool ) body.pool = newPool;

		// Move attached objects

		if ( oldPool.children.length>0 )
			newPool.add( ...oldPool.children );

 		// The actual number of figures is the same as in the old pool

		newPool.count = oldPool.count;

		// Transfer instance matrices and array of unique IDs

		newPool.instanceMatrix.array.set( oldPool.instanceMatrix.array );
		newPool.uidsArray.set( oldPool.uidsArray );

		pools[ name ] = newPool;

	}

}



/**
 * Male human figure
 */
class Man extends Body {

	constructor( height = 1.80 ) {

		preparePool( 'man', config.men );

		super( pools.man, 0, height/1.795 ); // 1.795 is 3D model height

		this.l_arm.z = this.r_arm.z = -75;
		this.l_elbow.y = this.r_elbow.y = 20;
		this.l_leg.z = this.r_leg.z = 10;
		this.l_ankle.z = this.r_ankle.z = -10;
		this.l_ankle.x = this.r_ankle.x = 3;

		this.position.y = -0.012;

	}

}



/**
 * Female human figure
 */
class Woman extends Body {

	constructor( height = 1.70 ) {

		preparePool( 'woman', config.women );

		super( pools.woman, 1, height/1.691 ); // 1.691 is 3D model height

		this.l_arm.z = this.r_arm.z = -90;
		this.l_elbow.y = this.r_elbow.y = 0;
		this.l_leg.z = this.r_leg.z = -3;
		this.l_ankle.z = this.r_ankle.z = 3;
		this.l_ankle.x = this.r_ankle.x = 3;

	}

}



/**
 * Child human figure
 */
class Child extends Body {

	constructor( height = 1.35 ) {

		preparePool( 'child', config.children );

		super( pools.child, 2, height/1.352 ); // 1.352 is 3D model height

		this.l_arm.x = this.r_arm.x = -10;
		this.l_arm.z = this.r_arm.z = -80;
		this.l_ankle.bend = this.r_ankle.bend = 3;

		this.position.y = -0.008;

	}

}



export { Man, Woman, Child, everybody, pools };
