
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

	constructor( model, isRight, parent, space, spaceAux=space, axes='xyz' ) {

		super();

		this.model = model;
		this.isRight = isRight;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.angleAux = spaceAux.angle;

		this.nameY = axes[ 1 ];

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

		// dimensions of the body, including its height
		this.dims = {};
		this.space = {};

		// reduce the hierarchy of the model
		var model = new Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		centerModel( model, this.dims );

		// create the space around the model
		this.space = new Space( this.dims, space );

		this.torso = new Joint( this, false, null, this.space.torso );
		this.waist = new Joint( this, false, this.torso, this.space.waist );
		this.chest = new Joint( this, false, this.waist, this.space.chest );
		this.head = new Joint( this, false, this.chest, this.space.head );

		this.l_leg = new Joint( this, false, this.waist, this.space.l_leg, this.space.l_leg2 );
		this.l_knee = new Joint( this, false, this.l_leg, this.space.l_knee );
		this.l_ankle = new Joint( this, false, this.l_knee, this.space.l_ankle, this.space.l_ankle2 );
		this.l_foot = new Joint( this, false, this.l_ankle, this.space.l_foot );

		this.r_leg = new Joint( this, true, this.waist, this.space.r_leg, this.space.r_leg2 );
		this.r_knee = new Joint( this, true, this.r_leg, this.space.r_knee );
		this.r_ankle = new Joint( this, true, this.r_knee, this.space.r_ankle, this.space.r_ankle2 );
		this.r_foot = new Joint( this, true, this.r_ankle, this.space.r_foot );

		this.l_arm = new Joint( this, false, this.chest, this.space.l_arm, this.space.l_arm, 'yxz' );
		this.l_elbow = new Joint( this, false, this.l_arm, this.space.l_elbow, this.space.l_elbow, 'yxz' );
		this.l_wrist = new Joint( this, false, this.l_elbow, this.space.l_wrist, this.space.l_wrist2, 'zxy' );

		this.r_arm = new Joint( this, true, this.chest, this.space.r_arm, this.space.r_arm, 'yxz' );
		this.r_elbow = new Joint( this, true, this.r_arm, this.space.r_elbow, this.space.r_elbow, 'yxz' );
		this.r_wrist = new Joint( this, true, this.r_elbow, this.space.r_wrist, this.space.r_wrist2, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		model.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 ),
			metalness: 0,
			roughness: 0.6,
		} );

		// rescale the model to the desired height (optional)
		if ( height ) {

			model.scale.setScalar( height / this.dims.height );

		}

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
		head: [ 'LocusY', [ 0, 878, -37 ], [ 838, 923 ], 30 ],
		chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [ 40, 300 ]],
		waist: [ 'LocusY', [ 0, 570, -9 ], [ 310, 840 ]],
		torso: [ 'LocusY', [ 0, 570, -9 ], [ -1001, -1000 ]],

		// LEGS
		leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ]],
		legLong: [ 'LocusY', [ 39, 0, -19 ], [ 700, 140 ]],
		knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
		ankle: [ 'LocusY', [ 41, 51, -1 ], [ 97, 10 ], -10 ],
		ankleLong: [ 'LocusY', [ 51, 206, -29 ], [ 430, -10 ]],
		foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
		forearm: [ 'LocusX', [ 170, 815, -38 ], [ 46, 490 ]],
		wrist: [ 'LocusX', [ 375, 820, -40 ], [ 354, 402 ]],
		arm: [ 'LocusXY', [ 70+15, 810-20, -40 ], [ 30, 150 ], [ 600, 900 ]],

	};

	constructor( height ) {

		super( gltf_man, Man.SPACE, height );

		this.url = MODEL_PATH + Man.URL;

		this.position.y = this.dims.height/2 - 0.015;

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0, 872, -30 ], [ 827, 919 ], 30 ],
		chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [ 40, 300 ]],
		waist: [ 'LocusY', [ 0, 570, -9 ], [ 350, 840 ]],
		torso: [ 'LocusY', [ 0, 570, -9 ], [ -1001, -1000 ]],

		// LEGS
		leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ]],
		legLong: [ 'LocusY', [ 44, 0, -19 ], [ 700, 140 ]],
		knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
		ankle: [ 'LocusY', [ 44, 51, -4 ], [ 97, 10 ], -10 ],
		ankleLong: [ 'LocusY', [ 51, 201, -29 ], [ 430, -33 ]],
		foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
		forearm: [ 'LocusX', [ 170, 815, -38 ], [ 54, 475 ]],
		wrist: [ 'LocusX', [ 359, 815, -34 ], [ 343, 380 ]],
		arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ]],

	};

	constructor( height ) {

		super( gltf_woman, Woman.SPACE, height );

		this.url = MODEL_PATH + Woman.URL;

		this.position.y = this.dims.height/2 - 0.005;

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0, 850, -32 ], [ 807, 894 ], 30 ],
		chest: [ 'LocusY', [ 0, 640, 1 ], [ 419, 914 ], 0, [ 40, 300 ]],
		waist: [ 'LocusY', [ 0, 530, -7 ], [ 285, 836 ]],
		torso: [ 'LocusY', [ 0, 530, -7 ], [ -1001, -1000 ]],

		// LEGS
		leg: [ 'LocusT', [ 40, 521, -9 ], [ -1, 1 ], [ 625, 430 ], 1 ],
		legLong: [ 'LocusY', [ 46, 0, -5 ], [ 700, 140 ]],
		knee: [ 'LocusY', [ 50, 288, -12 ], [ 346, 221 ], 20 ],
		ankle: [ 'LocusY', [ 54, 48, -14 ], [ 81, 33 ], -10 ],
		ankleLong: [ 'LocusY', [ 51, 201, -25 ], [ 430, -33 ]],
		foot: [ 'LocusY', [ 0, 20, 6 ], [ 83, -200 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 249, 793, -56 ], [ 230, 273 ], 0 ],
		forearm: [ 'LocusX', [ 170, 794, -59 ], [ 54, 475 ]],
		wrist: [ 'LocusX', [ 398, 802, -57 ], [ 384, 409 ]],
		arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ]],

	};

	constructor( height ) {

		super( gltf_child, Child.SPACE, height );

		this.url = MODEL_PATH + Child.URL;

		this.position.y = this.dims.height/2 - 0.005;

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
