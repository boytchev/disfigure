
// disfigure



import { Euler, MathUtils, Object3D, Quaternion, Vector3 } from 'three';
import { config, everybody, JOINTS, pivots } from './assets.js';
import { Pool } from './pool.js';
import { PURE_QUATS_PER_BODY, QUAT_DATA_INDEX, setJointQuaternion, setQuaternionCapacity } from './quats.js';



// degrees-radian conversion
var toDeg = x => x * 180 / Math.PI,
	toRad = x => x / 180 * Math.PI;



// global unique identifier for bodies
var uid = 0;



// dummy variables
var _p = new Vector3(),
	_q = new Quaternion(),
	pivot = new Vector3();


class EulerDegrees extends Euler {

	constructor( body, index, parentIndex, signs ) {

		super();

		this.body = body;
		this.index = index;
		this.parentIndex = parentIndex;
		this.signs = signs;
		this.quaternion = new Quaternion();
		this.needsUpdate = true;
		this.attached = [];

	}

	set( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

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

	get x( ) {

		return toDeg( this.signs.x*super.x );

	}

	get y( ) {

		return toDeg( this.signs.y*super.y );

	}

	get z( ) {

		return toDeg( this.signs.z*super.z );

	}

	get q( ) {

		if ( this.needsUpdate ) {

			this.quaternion.setFromEuler( this );
			this.needsUpdate = false;

		}

		return this.quaternion;

	}

	// attach object to current joint
	attach( object ) {

		object.initialPosition = object.position.clone();
		object.matrixAutoUpdate = false;

		this.attached.push( object );

		this.body.pool.add( object );


	}

}


class Body extends Object3D {

	constructor( pool, bodyTypeIndex, scale ) {

		super();

		this.pool = pool;
		this.pid = pool.getBody(); // instance index within the pool
		this.uid = uid++; // global body index
		this.material = this.pool.material; // expose to outside
		this.scale.setScalar( scale );

		setQuaternionCapacity( Math.max( uid+1, config.men+config.women+config.children, config.population ) );
		setJointQuaternion( this.uid, QUAT_DATA_INDEX, bodyTypeIndex, 0, 0, 0 );

		this.quaternionOffset = bodyTypeIndex*PURE_QUATS_PER_BODY;

		pool.uidsArray[ this.pid ] = this.uid;

		this.eulers = [];

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			this.eulers.push( new EulerDegrees( this, i, JOINTS[ i ].parentIndex, JOINTS[ i ].signs ) );

			this[ JOINTS[ i ].name ] = this.eulers[ i ];

		}

		everybody.push( this );

	}

	update( ) {

		this.updateMatrix();
		this.pool.setMatrixAt( this.pid, this.matrix );
		this.pool.instanceMatrix.needsUpdate = true;

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			setJointQuaternion( this.uid, i, ...this.eulers[ i ].q );

		}

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			var _euler = this.eulers[ i ];

			for ( var object of _euler.attached ) {

				var euler = _euler;

				pivot.set( ...pivots.array[ euler.index+this.quaternionOffset ]);

				_p.copy( object.initialPosition );
				_p.add( pivot );

				_q.identity();


				scan: while ( euler ) {

					pivot.set( ...pivots.array[ euler.index+this.quaternionOffset ]);

					_p.sub( pivot ).applyQuaternion( euler.quaternion ).add( pivot );
					_q.premultiply( euler.quaternion );

					if ( euler.parentIndex<0 ) break scan;

					euler = this.eulers[ euler.parentIndex ];

				}

				_p.multiply( this.scale );
				_p.add( this.position );

				object.position.copy( _p );
				object.quaternion.copy( _q );
				object.updateMatrix();

			} // for object

		} // for i

	} // Body.updateAttached



	get posture() {

		var r = x=>Math.round( 100*( Object.is( x, -0 )?0:x ) )/100; // round a number

		return {
			version: 9,
			position: [ ...this.position ],
			angles: this.eulers.map( e=>[ r( e.x ), r( e.y ), r( e.z ) ]),
		};

	} // Body.get.posture



	get posture() {

		var r = x=>Math.round( 100*( Object.is( x, -0 )?0:x ) )/100; // round a number

		return {
			version: 9,
			//position: [...this.position],
			angles: this.eulers.map( e=>[ r( e.x ), r( e.y ), r( e.z ) ]),
		};

	} // Body.get.posture



	get postureString() {

		return JSON.stringify( this.posture );

	} // Body.get.postureString



	set posture( data ) {

		if ( data.version !=9 )
			throw 'Incompatible posture version';

		//this.position.set( ...data.position );

		for ( var i in data.angles ) {

			this.eulers[ i ].x = data.angles[ i ][ 0 ];
			this.eulers[ i ].y = data.angles[ i ][ 1 ];
			this.eulers[ i ].z = data.angles[ i ][ 2 ];

		}

	} // Body.posture


	blend( postureA, postureB, k ) {

		function lerp( a, b ) {

			var c = [];
			for ( var i=0; i<a.length; i++ )
				c[ i ] = MathUtils.lerp( a[ i ], b[ i ], k );

			return c;

		}

		if ( postureA.version !=9 || postureB.version !=9 )
			throw 'Incompatible posture version';

		this.posture = {
			version: 9,
			angles: postureA.angles.map( ( a, i ) => lerp( a, postureB.angles[ i ]) ),
		};

	} // blend


} // Body


var pools = { man: null, woman: null, child: null };

function preparePool( name, initialCount ) {

	if ( pools[ name ] == null ) {

		pools[ name ] = new Pool( name, initialCount );

	}

	if ( pools[ name ].isFull() ) {


		// get a larger pool

		var oldPool = pools[ name ];
		var newPool = new Pool( name, 2*oldPool.count );
		oldPool.addToScene = false;
		oldPool.removeFromParent();
		for ( var body of everybody ) {

			if ( body.pool == oldPool ) body.pool = newPool;

		}

		if ( oldPool.children.length>0 )
			newPool.add( ...oldPool.children ); // move attached objects

		console.log( name+':: pool is full, size', oldPool.uidsArray.length, '->', newPool.uidsArray.length );

		newPool.count = oldPool.count; // revert to old count, because only that number of figures exist
		newPool.instanceMatrix.array.set( oldPool.instanceMatrix.array );
		newPool.uidsArray.set( oldPool.uidsArray );

		pools[ name ] = newPool;

	}

}

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

} // Man



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

} // Woman



class Child extends Body {

	constructor( height = 1.35 ) {

		preparePool( 'child', config.children );

		super( pools.child, 2, height/1.352 ); // 1.352 is 3D model height

		this.l_arm.x = this.r_arm.x = -10;
		this.l_arm.z = this.r_arm.z = -80;
		this.l_ankle.bend = this.r_ankle.bend = 3;

		this.position.y = -0.008;

	}

} // Child


export { Man, Woman, Child, everybody, pools };
