
// disfigure
//
// Definitions of man, woman and child with motion methods.



import { Euler, Group, Matrix3, Matrix4, Mesh, MeshPhysicalNodeMaterial, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vec3 } from 'three/tsl';

import { tslNormalNode, tslPositionNode } from './motion.js';
import { centerModel } from './utils.js';
import { Space } from './space.js';
import { everybody, scene } from './world.js';



// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_v = new Vector3();



var toRad = x => x * ( 2*Math.PI/360 ),
	toDeg = x => x / ( 2*Math.PI/360 );

function getset( object, name, xyz, angle='angle' ) {

	Object.defineProperty( object, name, {
		get() {

			return toDeg( object[ angle ][ xyz ]);

		},
		set( value ) {

			object[ angle ][ xyz ] = toRad( value );

		}
	} );

}


class Joint extends Group {

	constructor( model, parent, space, spaceAux=space, axes='xyz' ) {

		super();

		this.model = model;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.angleAux = spaceAux.angle;

		this.position.copy( space.pivot );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);
		getset( this, 'turn', axes[ 1 ], 'angleAux' );

	}


	attach( mesh ) {

		if ( mesh.parent ) mesh = mesh.clone();

		var wrapper = new Group();
		var subwrapper = new Group();

		wrapper.add( subwrapper );
		subwrapper.add( mesh );
		subwrapper.rotation.z = this.isRight ? Math.PI : 0;
		mesh.position.y *= this.isRight ? -1 : 1;
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.children[ 0 ].add( wrapper );
		this.model.accessories.push( wrapper );

	}

} // Joint





var m = new Matrix4(),
	e = new Euler(),
	_uid = 1;

class Disfigure extends Group {


	constructor( gltf, space, height ) {

		super();



		// unique number for each body, used to make their motions different
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];

		this.space = {};

		// reduce the hierarchy of the model
		var model = new Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		var modelHeight = centerModel( model );

		// create the space around the model
		this.space = new Space( space );

		this.torso = new Joint( this, null, this.space.torso );
		this.waist = new Joint( this, this.torso, this.space.waist );
		this.chest = new Joint( this, this.waist, this.space.chest );
		this.head = new Joint( this, this.chest, this.space.head );

		this.l_leg = new Joint( this, this.waist, this.space.l_leg, this.space.l_leg2 );
		this.l_knee = new Joint( this, this.l_leg, this.space.l_knee );
		this.l_ankle = new Joint( this, this.l_knee, this.space.l_ankle, this.space.l_ankle2 );
		this.l_foot = new Joint( this, this.l_ankle, this.space.l_foot );

		this.r_leg = new Joint( this, this.waist, this.space.r_leg, this.space.r_leg2 );
		this.r_knee = new Joint( this, this.r_leg, this.space.r_knee );
		this.r_ankle = new Joint( this, this.r_knee, this.space.r_ankle, this.space.r_ankle2 );
		this.r_foot = new Joint( this, this.r_ankle, this.space.r_foot );

		this.l_arm = new Joint( this, this.chest, this.space.l_arm, this.space.l_arm, 'yxz' );
		this.l_elbow = new Joint( this, this.l_arm, this.space.l_elbow, this.space.l_elbow, 'yxz' );
		this.l_wrist = new Joint( this, this.l_elbow, this.space.l_wrist, this.space.l_wrist2, 'zxy' );

		this.r_arm = new Joint( this, this.chest, this.space.r_arm, this.space.r_arm, 'yxz' );
		this.r_elbow = new Joint( this, this.r_arm, this.space.r_elbow, this.space.r_elbow, 'yxz' );
		this.r_wrist = new Joint( this, this.r_elbow, this.space.r_wrist, this.space.r_wrist2, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		model.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 ),
			metalness: 0,
			roughness: 0.6,
		} );

		// rescale the model to the desired height (optional)
		this.height = height ?? modelHeight;
		model.scale.setScalar( this.height / modelHeight );
		model.position.y = 0;

		model.castShadow = true;
		model.receiveShadow = true;

		this.model = model;
		//		this.torso = model;
		this.add( model );

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

		anglesToMatrix( this.space.head, -1, -1, 1 );
		anglesToMatrix( this.space.chest, -1, -1, 1 );
		anglesToMatrix( this.space.waist, -1, 1, 1 );
		anglesToMatrix( this.space.torso, -1, -1, 1 );

		anglesToMatrix( this.space.l_elbow, 0, 1, 0 );
		anglesToMatrix( this.space.r_elbow, 0, -1, 0 );

		// wrist: tilt bend
		anglesToMatrix( this.space.l_wrist, 0, 1, 1 );
		anglesToMatrix( this.space.r_wrist, 0, -1, -1 );

		// wrist: turn
		anglesToMatrix( this.space.l_wrist2, -1, 0, 0 );
		anglesToMatrix( this.space.r_wrist2, -1, 0, 0 );

		anglesToMatrix( this.space.l_arm, -1, 1, 1 );
		anglesToMatrix( this.space.r_arm, -1, -1, -1 );

		anglesToMatrix( this.space.l_knee, -1, 0, 0 );
		anglesToMatrix( this.space.r_knee, -1, 0, 0 );

		anglesToMatrix( this.space.l_ankle, -1, 0, -1 );
		anglesToMatrix( this.space.r_ankle, -1, 0, 1 );

		anglesToMatrix( this.space.l_ankle2, 0, -1, 0 );
		anglesToMatrix( this.space.r_ankle2, 0, 1, 0 );

		anglesToMatrix( this.space.l_foot, -1, 0, 0 );
		anglesToMatrix( this.space.r_foot, -1, 0, 0 );

		// legs turn
		anglesToMatrix( this.space.l_leg2, 0, -1, 0 );
		anglesToMatrix( this.space.r_leg2, 0, 1, 0 );

		// leg: foreward ??? straddle
		anglesToMatrix( this.space.l_leg, 1, 0, -1 );
		anglesToMatrix( this.space.r_leg, 1, 0, 1 );

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
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0, 1.566, -0.066 ], [ 1.495, 1.647 ], 30 ],
		chest: [ 'LocusY', [ 0, 1.177, -0.014 ], [ 0.777, 1.658 ], 0, [ 0.072, 0.538 ]],
		waist: [ 'LocusY', [ 0, 1.014, -0.016 ], [ 0.547, 1.498 ]],
		torso: [ 'LocusY', [ 0, 1.014, -0.016 ], [ -3, -2 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.074, 0.970, -0.034 ], [ -0.004, 0.004 ], [ 1.229, 0.782 ]],
		leg2: [ 'LocusY', [ 0.070, -0.009, -0.034 ], [ 1.247, 0.242 ]],
		knee: [ 'LocusY', [ 0.090, 0.504, -0.041 ], [ 0.603, 0.382 ], 20 ],
		ankle: [ 'LocusY', [ 0.074, 0.082, -0.002 ], [ 0.165, 0.008 ], -10 ],
		ankle2: [ 'LocusY', [ 0.092, 0.360, -0.052 ], [ 0.762, -0.027 ]],
		foot: [ 'LocusY', [ 0, 0.026, 0.022 ], [ 0.190, -0.342 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.427, 1.453, -0.072 ], [ 0.413, 0.467 ]],
		wrist2: [ 'LocusX', [ 0.305, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [ 'LocusX', [ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [ 'LocusXY', [ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.606 ]],

	};

	constructor( height ) {

		super( gltf_man, Man.SPACE, height );

		this.url = MODEL_PATH + Man.URL;

		//this.position.y = this.height/2 - 0.015;

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0.001, 1.471, -0.049 ], [ 1.395, 1.551 ], 30 ],
		chest: [ 'LocusY', [ 0.001, 1.114, -0.012 ], [ 0.737, 1.568 ], 0, [ 0.069, 0.509 ]],
		waist: [ 'LocusY', [ 0.001, 0.961, -0.014 ], [ 0.589, 1.417 ]],
		torso: [ 'LocusY', [ 0.001, 0.961, -0.014 ], [ -1.696, -1.694 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.071, 0.920, -0.031 ], [ -0.002, 0.005 ], [ 1.163, 0.742 ]],
		leg2: [ 'LocusY', [ 0.076, -0.003, -0.031 ], [ 1.180, 0.233 ]],
		knee: [ 'LocusY', [ 0.086, 0.480, -0.037 ], [ 0.573, 0.365 ], 20 ],
		ankle: [ 'LocusY', [ 0.076, 0.083, -0.005 ], [ 0.161, 0.014 ], -10 ],
		ankle2: [ 'LocusY', [ 0.088, 0.337, -0.047 ], [ 0.724, -0.059 ]],
		foot: [ 'LocusY', [ 0.001, 0.031, 0.022 ], [ 0.184, -0.316 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.404, 1.375, -0.066 ], [ 0.390, 0.441 ]],
		wrist2: [ 'LocusX', [ 0.289, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [ 'LocusX', [ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [ 'LocusXY', [ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( gltf_woman, Woman.SPACE, height );

		this.url = MODEL_PATH + Woman.URL;

		//this.position.y = this.height/2 - 0.005;

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0, 1.149, -0.058 ], [ 1.091, 1.209 ], 30 ],
		chest: [ 'LocusY', [ 0, 0.865, -0.013 ], [ 0.566, 1.236 ], 0, [ 0.054, 0.406 ]],
		waist: [ 'LocusY', [ 0, 0.717, -0.024 ], [ 0.385, 1.130 ]],
		torso: [ 'LocusY', [ 0, 0.717, -0.024 ], [ -1.354, -1.353 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.054, 0.704, -0.027 ], [ -0.001, 0.001 ], [ 0.845, 0.581 ], 1 ],
		leg2: [ 'LocusY', [ 0.062, -0.000, -0.021 ], [ 0.946, 0.189 ]],
		knee: [ 'LocusY', [ 0.068, 0.389, -0.031 ], [ 0.468, 0.299 ], 20 ],
		ankle: [ 'LocusY', [ 0.073, 0.065, -0.033 ], [ 0.109, 0.044 ], -10 ],
		ankle2: [ 'LocusY', [ 0.069, 0.272, -0.048 ], [ 0.581, -0.045 ]],
		foot: [ 'LocusY', [ 0, 0.027, -0.006 ], [ 0.112, -0.271 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.337, 1.072, -0.090 ], [ 0.311, 0.369 ]],
		wrist2: [ 'LocusX', [ 0.230, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [ 'LocusX', [ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [ 'LocusXY', [ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( gltf_child, Child.SPACE, height );

		this.url = MODEL_PATH + Child.URL;

		//this.position.y = this.height/2 - 0.005;

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child



var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + Man.URL ),
		loader.loadAsync( MODEL_PATH + Woman.URL ),
		loader.loadAsync( MODEL_PATH + Child.URL ),
	]
);



export { Man, Woman, Child };
