
// disfigure
//
// Definitions of man, woman and child with motion methods.



import { Euler, Group, MathUtils, Matrix3, Matrix4, Mesh, MeshPhysicalNodeMaterial, PlaneGeometry, Vector3, Vector4 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { uniform, vec3 } from 'three/tsl';

import { compileClothing } from './clothes.js';
import { tslNormalNode, tslPositionNode } from './motion.js';
import { Space } from './space.js';
import { everybody, scene } from './world.js';



var loader = new GLTFLoader();



// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_m4 = new Matrix4(),
	_v = new Vector3(),
	_v4 = new Vector4();



var toDeg = x => x * 180 / Math.PI,
	toRad = x => x / 180 * Math.PI,
	toRound = x => Math.round( 100*x )/100;


function calcWorldMatrix( b, _v, worldMatrix ) {

	_m.identity();

	for ( ; b; b=b.parent ) {

		_mat.copy( b.matrix.value ).transpose();
		_m.premultiply( _mat );
		_v.sub( b.space.pivot ).applyMatrix3( _mat ).add( b.space.pivot );

	}

	worldMatrix.setFromMatrix3( _m );
	worldMatrix.setPosition( _v );


} // calcWorldMatrix



function getset( object, name, axis, sign ) {

	Object.defineProperty( object, name, {
		get() {

			return toDeg( sign*object.angle[ axis ]);

		},
		set( value ) {

			object.angle[ axis ] = toRad( sign*value );

		}
	} );

}


class Joint {

	constructor( model, parent, space, bendAxis, turnAxis, tiltAxis, bendSign, turnSign, tiltSign, order='XZY' ) {

		this.model = model;
		this.model.joints.push( this );
		this.parent = parent;
		this.space = space;
		this.angle = new Vector3();
		this.matrix = uniform( new Matrix3() );
		this.order = order;

		getset( this, 'bend', bendAxis, bendSign );
		getset( this, 'turn', turnAxis, turnSign );
		getset( this, 'tilt', tiltAxis, tiltSign );
		getset( this, 'foreward', bendAxis, bendSign );
		getset( this, 'straddle', tiltAxis, tiltSign );

	}


	attach( mesh, x, y, z ) {

		if ( mesh.parent ) mesh = mesh.clone();

		if ( typeof x !== 'undefined' )
			mesh.position.set( x, y, z );

		var wrapper = new Group();
		wrapper.add( mesh );
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.add( wrapper );
		this.model.accessories.push( wrapper );

	}


	point( x, y, z ) {

		var b = this;

		_v.set( x, y, z );
		_v.add( b.space.pivot );

		calcWorldMatrix( b, _v, _m4 );

		_v4.set( 0, 0, 0, 1 );
		_v4.applyMatrix4( _m4 );

		_v.set( _v4.x, _v4.y, _v4.z );

		return _v;

	}

	lockTo( localX, localY, localZ, globalX, globalY, globalZ ) {

		this.model.position.set( 0, 0, 0 );

		_v = this.point( localX, localY, localZ ); // local
		this.model.position.sub( _v );

		_v.set( globalX, globalY, globalZ ); // global
		this.model.position.add( _v );

	} // Joint.lockTo




} // Joint




var m = new Matrix4(),
	e = new Euler(),
	dummyGeometry = new PlaneGeometry(),
	_uid = 1;


class Disfigure extends Mesh {

	constructor( figure, height ) {

		var url = MODEL_PATH+figure.URL,
			space = figure.SPACE,
			geometryHeight = figure.HEIGHT;

		super( dummyGeometry );


		// unique number for each body, used to make their motions different
		this.url = url;
		this.uid = _uid;
		_uid += 1 + 10*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];
		this.joints = [];
		this.height = height??geometryHeight;

		this.scale.setScalar( this.height / geometryHeight );

		loader.load( this.url, ( gltf )=>{

			this.geometry = gltf.scene.children[ 0 ].geometry;

		} );

		// create the space around the model
		this.space = new Space( space );

		this.torso = new Joint( this, null, this.space.torso, 'x', 'y', 'z', 1, 1, -1 );
		this.waist = new Joint( this, this.torso, this.space.waist, 'x', 'y', 'z', 1, 1, -1 );
		this.chest = new Joint( this, this.waist, this.space.chest, 'x', 'y', 'z', 1, 1, -1 );
		this.head = new Joint( this, this.chest, this.space.head, 'x', 'y', 'z', 1, 1, -1 );

		this.l_leg = new Joint( this, this.torso, this.space.l_leg, 'x', 'y', 'z', -1, 1, 1, 'ZYX' );
		this.l_thigh = new Joint( this, this.l_leg, this.space.l_thigh, 'x', 'y', 'z', 0, 1, 0 );
		this.l_knee = new Joint( this, this.l_thigh, this.space.l_knee, 'x', 'y', 'z', 1, 0, -1 );
		this.l_shin = new Joint( this, this.l_knee, this.space.l_shin, 'x', 'y', 'z', 0, 1, 0 );
		this.l_ankle = new Joint( this, this.l_shin, this.space.l_ankle, 'x', 'y', 'z', 1, 0, 1 );
		this.l_foot = new Joint( this, this.l_ankle, this.space.l_foot, 'x', 'y', 'z', 1, 0, 0 );

		this.r_leg = new Joint( this, this.torso, this.space.r_leg, 'x', 'y', 'z', -1, -1, -1, 'ZYX' );
		this.r_thigh = new Joint( this, this.r_leg, this.space.r_thigh, 'x', 'y', 'z', 0, -1, 0 );
		this.r_knee = new Joint( this, this.r_thigh, this.space.r_knee, 'x', 'y', 'z', 1, 0, 1 );
		this.r_shin = new Joint( this, this.r_knee, this.space.r_shin, 'x', 'y', 'z', 0, -1, 0 );
		this.r_ankle = new Joint( this, this.r_shin, this.space.r_ankle, 'x', 'y', 'z', 1, 0, -1 );
		this.r_foot = new Joint( this, this.r_ankle, this.space.r_foot, 'x', 'y', 'z', 1, 0, 0 );

		this.l_arm = new Joint( this, this.chest, this.space.l_arm, 'y', 'x', 'z', -1, 1, -1, 'ZYX' );
		this.l_elbow = new Joint( this, this.l_arm, this.space.l_elbow, 'y', 'x', 'z', -1, 0, 0 );
		this.l_forearm = new Joint( this, this.l_elbow, this.space.l_forearm, 'z', 'x', 'y', 0, 1, 0 );
		this.l_wrist = new Joint( this, this.l_forearm, this.space.l_wrist, 'z', 'x', 'y', -1, 0, -1 );

		this.r_arm = new Joint( this, this.chest, this.space.r_arm, 'y', 'x', 'z', 1, 1, 1, 'ZYX' );
		this.r_elbow = new Joint( this, this.r_arm, this.space.r_elbow, 'y', 'x', 'z', 1, 0, 0 );
		this.r_forearm = new Joint( this, this.r_elbow, this.space.r_forearm, 'z', 'x', 'y', 0, 1, 0 );
		this.r_wrist = new Joint( this, this.r_forearm, this.space.r_wrist, 'z', 'x', 'y', 1, 0, 1 );

		// sets the materials of the model hooking them to TSL functions
		this.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( this ),
			normalNode: tslNormalNode( this ),
			colorNode: vec3( 0.99, 0.65, 0.49 ),
			metalness: 0,
			roughness: 0.6,
		} );

		this.position.y = 0;

		this.castShadow = true;
		this.receiveShadow = true;

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );

		this.l_arm.straddle = this.r_arm.straddle = 65;
		this.l_elbow.bend = this.r_elbow.bend = 20;

	} // Disfigure.constructor

	update( ) {

		for ( var joint of this.joints ) {

			e.set( joint.angle.x, joint.angle.y, joint.angle.z, joint.order );
			m.makeRotationFromEuler( e );

			var s = m.elements;
			joint.matrix.value.set( s[ 0 ], s[ 1 ], s[ 2 ], s[ 4 ], s[ 5 ], s[ 6 ], s[ 8 ], s[ 9 ], s[ 10 ]);

		}

		for ( var wrapper of this.accessories ) {

			var b = wrapper.joint;

			_v.copy( b.space.pivot );

			calcWorldMatrix( b, _v, wrapper.matrix );

		}

	} // Disfigure.update



	get posture() {

		var angles = [];

		for ( var joint of this.joints )
			angles.push( ...joint.angle );

		var position = [ ...this.position ];
		var rotation = [ ...this.rotation ];

		return {
			version: 8,
			position: position.map( x=>toRound( x ) ),
			rotation: rotation,
			angles: angles.map( x=>toRound( toDeg( x ) ) ) };

	} // Disfigure.posture



	get postureString() {

		return JSON.stringify( this.posture );

	} // Disfigure.postureString



	set posture( data ) {

		if ( data.version !=8 )
			console.error( 'Incompatible posture version' );

		var i = 0;

		var angles = data.angles.map( x=>toRad( x ) );

		this.position.set( ...data.position );
		this.rotation.set( ...data.rotation );

		for ( var joint of this.joints )
			joint.angle.set( angles[ i++ ], angles[ i++ ], angles[ i++ ]);

		this.update();
		this.updateMatrixWorld( true );


	} // Disfigure.posture


	blend( postureA, postureB, k ) {

		function lerp( a, b ) {

			var c = [];
			for ( var i=0; i<a.length; i++ )
				c[ i ] = MathUtils.lerp( a[ i ], b[ i ], k );

			return c;

		}

		var eulerA = new Euler( ...postureA.rotation ),
			eulerB = new Euler( ...postureB.rotation );
		eulerA.reorder( eulerB._order );

		var posture = {
			version: postureA.version,
			position: lerp( postureA.position, postureB.position ),
			rotation: new Euler(
				...lerp([ eulerA._x, eulerA._y, eulerA._z ],
							 [ eulerB._x, eulerB._y, eulerB._z ])
			),
			angles: lerp( postureA.angles, postureB.angles ),
		};

		this.posture = posture;

	} // Disfigure.blend


	dress( clothingData ) {

		var clothes = compileClothing( clothingData ).toVar();

		this.material.colorNode = clothes[ 0 ].xyz;
		this.material.roughnessNode = clothes[ 1 ].x;
		this.material.metalnessNode = clothes[ 1 ].y;

	} // Disfigure.dress


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
		thigh: [[ 0.070, 0.737, -0.034 ], [ 1.247, 0.242 ]],
		knee: [[ 0.090, 0.504, -0.041 ], [ 0.603, 0.382 ], 20 ],
		ankle: [[ 0.074, 0.082, -0.002 ], [ 0.165, 0.008 ], -10 ],
		shin: [[ 0.092, 0.360, -0.052 ], [ 0.762, -0.027 ]],
		foot: [[ 0.074, 0.026, 0.022 ], [ 0.190, -0.342 ], 120 ],

		// ARMS
		elbow: [[ 0.427, 1.453, -0.072 ], [ 0.413, 0.467 ]],
		forearm: [[ 0.550, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [[ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [[ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.616 ]],

	};

	constructor( height ) {

		super( Man, height );

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
		thigh: [[ 0.076, 0.7, -0.031 ], [ 1.180, 0.233 ]],
		knee: [[ 0.086, 0.480, -0.037 ], [ 0.573, 0.365 ], 20 ],
		shin: [[ 0.088, 0.337, -0.047 ], [ 0.724, -0.059 ]],
		ankle: [[ 0.076, 0.083, -0.005 ], [ 0.161, 0.014 ], -10 ],
		foot: [[ 0.076, 0.031, 0.022 ], [ 0.184, -0.316 ], 120 ],

		// ARMS
		elbow: [[ 0.404, 1.375, -0.066 ], [ 0.390, 0.441 ]],
		forearm: [[ 0.506, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [[ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [[ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( Woman, height );

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
		thigh: [[ 0.062, 0.547, -0.021 ], [ 0.946, 0.189 ]],
		knee: [[ 0.068, 0.389, -0.031 ], [ 0.468, 0.299 ], 20 ],
		shin: [[ 0.069, 0.272, -0.048 ], [ 0.581, -0.045 ]],
		ankle: [[ 0.073, 0.065, -0.033 ], [ 0.109, 0.044 ], -10 ],
		foot: [[ 0.073, 0.027, -0.006 ], [ 0.112, -0.271 ], 120 ],

		// ARMS
		elbow: [[ 0.337, 1.072, -0.090 ], [ 0.311, 0.369 ]],
		forearm: [[ 0.438, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [[ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [[ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( Child, height );

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child



export { Man, Woman, Child, Joint };
