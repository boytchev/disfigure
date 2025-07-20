
// disfigure
//
// Definitions of man, woman and child with motion methods.



import { Box3, Euler, Group, Matrix3, Matrix4, Mesh, MeshPhysicalNodeMaterial, PlaneGeometry, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vec3 } from 'three/tsl';

import { tslNormalNode, tslPositionNode } from './motion.js';
import { Space } from './space.js';
import { everybody, scene } from './world.js';



var loader = new GLTFLoader();



// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_v = new Vector3();



var toRad = x => x * ( 2*Math.PI/360 ),
	toDeg = x => x / ( 2*Math.PI/360 );

function getset( object, name, xyz ) {

	Object.defineProperty( object, name, {
		get() {

			return toDeg( object.angle[ xyz ]);

		},
		set( value ) {

			object.angle[ xyz ] = toRad( value );

		}
	} );

}


class Joint extends Group {

	constructor( model, parent, space, axes='xyz' ) {

		super();

		this.model = model;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.isRight = space.isRight;

		this.position.copy( space.pivot );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);
		getset( this, 'turn', axes[ 1 ]);

	}


	attach( mesh ) {

		if ( mesh.parent ) mesh = mesh.clone();

		var wrapper = new Group();
		var subwrapper = new Group();

		wrapper.add( subwrapper );
		subwrapper.add( mesh );
		//subwrapper.rotation.y = this.isRight ? Math.PI*0 : 0;
		//subwrapper.rotation.z = this.isRight ? Math.PI*0 : 0;
		//mesh.position.y *= this.isRight ? -1 : 1;
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.children[ 0 ].add( wrapper );
		this.model.accessories.push( wrapper );

	}

} // Joint




var m = new Matrix4(),
	e = new Euler(),
	dummyGeomeyry = new PlaneGeometry(),
	_uid = 1;

class Disfigure extends Group {


	constructor( url, space, height, geometryHeight ) {

		super();



		// unique number for each body, used to make their motions different
		this.url = url;
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];
		this.height = height??geometryHeight;

		// reduce the hierarchy of the model
		this.model = new Mesh( dummyGeomeyry );
		this.model.scale.setScalar( this.height / geometryHeight );

		loader.load( this.url, ( gltf )=>{

			this.model.geometry = gltf.scene.children[ 0 ].geometry;

		} );


		// create the space around the model
		this.space = new Space( space );

		this.torso = new Joint( this, null, this.space.torso );
		this.waist = new Joint( this, this.torso, this.space.waist );
		this.chest = new Joint( this, this.waist, this.space.chest );
		this.head = new Joint( this, this.chest, this.space.head );

		this.l_leg = new Joint( this, this.torso, this.space.l_leg );
		this.l_thigh = new Joint( this, this.l_leg, this.space.l_thigh );
		this.l_knee = new Joint( this, this.l_thigh, this.space.l_knee );
		this.l_shin = new Joint( this, this.l_knee, this.space.l_shin );
		this.l_ankle = new Joint( this, this.l_shin, this.space.l_ankle );
		this.l_foot = new Joint( this, this.l_ankle, this.space.l_foot );

		this.r_leg = new Joint( this, this.torso, this.space.r_leg );
		this.r_thigh = new Joint( this, this.r_leg, this.space.r_thigh );
		this.r_knee = new Joint( this, this.r_thigh, this.space.r_knee );
		this.r_shin = new Joint( this, this.r_knee, this.space.r_shin );
		this.r_ankle = new Joint( this, this.r_shin, this.space.r_ankle );
		this.r_foot = new Joint( this, this.r_ankle, this.space.r_foot );

		this.l_arm = new Joint( this, this.chest, this.space.l_arm, 'yxz' );
		this.l_elbow = new Joint( this, this.l_arm, this.space.l_elbow, 'yxz' );
		this.l_forearm = new Joint( this, this.l_elbow, this.space.l_forearm, 'zxy' );
		this.l_wrist = new Joint( this, this.l_forearm, this.space.l_wrist, 'zxy' );

		this.r_arm = new Joint( this, this.chest, this.space.r_arm, 'yxz' );
		this.r_elbow = new Joint( this, this.r_arm, this.space.r_elbow, 'yxz' );
		this.r_forearm = new Joint( this, this.r_elbow, this.space.r_forearm, 'zxy' );
		this.r_wrist = new Joint( this, this.r_forearm, this.space.r_wrist, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		this.model.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: vec3( 0.99, 0.65, 0.49 ),
			metalness: 0,
			roughness: 0.6,
		} );

		this.model.position.y = 0;

		this.model.castShadow = true;
		this.model.receiveShadow = true;

		this.add( this.model );

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );

		this.l_arm.straddle = this.r_arm.straddle = 65;
		this.l_elbow.bend = this.r_elbow.bend = 20;

	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( space, sx, sy, sz ) {

			e.set( sx*space.angle.x, sy*space.angle.y, sz*space.angle.z, 'YZX' );
			m.makeRotationFromEuler( e );
			var s = m.elements;
			space.matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		function anglesToMatrixArm( space, sx, sy, sz ) {

			e.set( 0, 0, 0, 'YZX' );
			
			e.reorder( 'ZXY' );
			e.set( e.x, e.y, e.z+sz*space.angle.z ); // straddle

			e.reorder( 'YZX' );
			e.set( e.x, e.y+sy*space.angle.y, e.z ); // foreward
			
			e.reorder( 'XYZ' );
			e.set( e.x+sx*space.angle.x, e.y, e.z ); // turn
			
			m.makeRotationFromEuler( e );
			var s = m.elements;
			space.matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		anglesToMatrix( this.head, -1, -1, 1 );
		anglesToMatrix( this.chest, -1, -1, 1 );
		anglesToMatrix( this.waist, -1, -1, 1 );
		anglesToMatrix( this.torso, -1, -1, 1 );

		anglesToMatrix( this.l_elbow, 0, 1, 0 );
		anglesToMatrix( this.r_elbow, 0, -1, 0 );

		// wrist: tilt bend
		anglesToMatrix( this.l_wrist, 0, 1, 1 );
		anglesToMatrix( this.r_wrist, 0, -1, -1 );

		// wrist: turn
		anglesToMatrix( this.space.l_forearm, -1, 0, 0 );
		anglesToMatrix( this.space.r_forearm, -1, 0, 0 );

		anglesToMatrixArm( this.l_arm, -1, 1, 1 );
		anglesToMatrixArm( this.r_arm, -1, -1, -1 );

		anglesToMatrix( this.l_knee, -1, 0, 0 );
		anglesToMatrix( this.r_knee, -1, 0, 0 );

		anglesToMatrix( this.l_ankle, -1, 0, -1 );
		anglesToMatrix( this.r_ankle, -1, 0, 1 );

		anglesToMatrix( this.space.l_shin, 0, -1, 0 );
		anglesToMatrix( this.space.r_shin, 0, 1, 0 );

		anglesToMatrix( this.l_foot, -1, 0, 0 );
		anglesToMatrix( this.r_foot, -1, 0, 0 );

		// thigh turn
		anglesToMatrix( this.space.l_thigh, 0, -1, 0 );
		anglesToMatrix( this.space.r_thigh, 0, 1, 0 );

		// leg: foreward ??? straddle
		anglesToMatrixArm( this.l_leg, 1, 0, -1 );
		anglesToMatrixArm( this.r_leg, 1, 0, 1 );

		for ( var wrapper of this.accessories ) {

			var b = wrapper.joint;

			_m.identity();
			_v.copy( b.pivot );

			for ( ; b; b=b.parent ) {

				_mat.copy( b.matrix.value ).transpose();
				_m.premultiply( _mat );
				_v.sub( b.pivot ).applyMatrix3( _mat ).add( b.pivot );

			}

			wrapper.matrix.setFromMatrix3( _m );
			wrapper.matrix.setPosition( _v );

		}

	} // Disfigure.update

} // Disfigure



class Man extends Disfigure {

	static URL = 'man.glb';
	static HEIGHT = 1.795;
	static SPACE = {

		// TORSO
		head: [[ 0, 1.566, -0.066 ], [ 1.495, 1.647 ], 30 ],
		chest: [[ 0, 1.177, -0.014 ], [ 0.777, 1.658 ], 0, [ 0.072, 0.538 ]],
		waist: [[ 0, 1.014, -0.016 ], [ 0.547, 1.498 ]],
		torso: [[ 0, 1.014, -0.016 ], [ -3, -2 ]],

		// LEGS
		leg: [[ 0.074, 0.970, -0.034 ], [ -0.004, 0.004 ], [ 1.229, 0.782 ]],
		thigh: [[ 0.070, -0.009, -0.034 ], [ 1.247, 0.242 ]],
		knee: [[ 0.090, 0.504, -0.041 ], [ 0.603, 0.382 ], 20 ],
		ankle: [[ 0.074, 0.082, -0.002 ], [ 0.165, 0.008 ], -10 ],
		shin: [[ 0.092, 0.360, -0.052 ], [ 0.762, -0.027 ]],
		foot: [[ 0, 0.026, 0.022 ], [ 0.190, -0.342 ], 120 ],

		// ARMS
		elbow: [[ 0.427, 1.453, -0.072 ], [ 0.413, 0.467 ]],
		forearm: [[ 0.305, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [[ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [[ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.606 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Man.URL, Man.SPACE, height, Man.HEIGHT );

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
	static HEIGHT = 1.691;
	static SPACE = {

		// TORSO
		head: [[ 0.001, 1.471, -0.049 ], [ 1.395, 1.551 ], 30 ],
		chest: [[ 0.001, 1.114, -0.012 ], [ 0.737, 1.568 ], 0, [ 0.069, 0.509 ]],
		waist: [[ 0.001, 0.961, -0.014 ], [ 0.589, 1.417 ]],
		torso: [[ 0.001, 0.961, -0.014 ], [ -1.696, -1.694 ]],

		// LEGS
		leg: [[ 0.071, 0.920, -0.031 ], [ -0.002, 0.005 ], [ 1.163, 0.742 ]],
		thigh: [[ 0.076, -0.003, -0.031 ], [ 1.180, 0.233 ]],
		knee: [[ 0.086, 0.480, -0.037 ], [ 0.573, 0.365 ], 20 ],
		shin: [[ 0.088, 0.337, -0.047 ], [ 0.724, -0.059 ]],
		ankle: [[ 0.076, 0.083, -0.005 ], [ 0.161, 0.014 ], -10 ],
		foot: [[ 0.001, 0.031, 0.022 ], [ 0.184, -0.316 ], 120 ],

		// ARMS
		elbow: [[ 0.404, 1.375, -0.066 ], [ 0.390, 0.441 ]],
		forearm: [[ 0.289, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [[ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [[ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Woman.URL, Woman.SPACE, height, Woman.HEIGHT );

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
	static HEIGHT = 1.352;
	static SPACE = {

		// TORSO
		head: [[ 0, 1.149, -0.058 ], [ 1.091, 1.209 ], 30 ],
		chest: [[ 0, 0.865, -0.013 ], [ 0.566, 1.236 ], 0, [ 0.054, 0.406 ]],
		waist: [[ 0, 0.717, -0.024 ], [ 0.385, 1.130 ]],
		torso: [[ 0, 0.717, -0.024 ], [ -1.354, -1.353 ]],

		// LEGS
		leg: [[ 0.054, 0.704, -0.027 ], [ -0.001, 0.001 ], [ 0.845, 0.581 ], 1 ],
		thigh: [[ 0.062, -0.000, -0.021 ], [ 0.946, 0.189 ]],
		knee: [[ 0.068, 0.389, -0.031 ], [ 0.468, 0.299 ], 20 ],
		shin: [[ 0.069, 0.272, -0.048 ], [ 0.581, -0.045 ]],
		ankle: [[ 0.073, 0.065, -0.033 ], [ 0.109, 0.044 ], -10 ],
		foot: [[ 0, 0.027, -0.006 ], [ 0.112, -0.271 ], 120 ],

		// ARMS
		elbow: [[ 0.337, 1.072, -0.090 ], [ 0.311, 0.369 ]],
		forearm: [[ 0.230, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [[ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [[ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Child.URL, Child.SPACE, height, Child.HEIGHT );

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child



export { Man, Woman, Child, Joint };
