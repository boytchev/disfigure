
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



// definitions of spaces
import * as MAN from './models/man.js';
import * as WOMAN from './models/woman.js';
import * as CHILD from './models/child.js';


// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + MAN.URL ),
		loader.loadAsync( MODEL_PATH + WOMAN.URL ),
		loader.loadAsync( MODEL_PATH + CHILD.URL ),
	]
);



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

	}

	get turn( ) {

		return toDeg( this.angleAux[ this.nameY ]);

	}
	set turn( a ) {

		this.angleAux[ this.nameY ] = toRad( a );

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

		this.legLeft = new Joint( this, false, this.waist, this.space.legLeft, this.space.legLongLeft );
		this.kneeLeft = new Joint( this, false, this.legLeft, this.space.kneeLeft );
		this.ankleLeft = new Joint( this, false, this.kneeLeft, this.space.ankleLeft, this.space.ankleLongLeft );
		this.footLeft = new Joint( this, false, this.ankleLeft, this.space.footLeft );

		this.legRight = new Joint( this, true, this.waist, this.space.legRight, this.space.legLongRight );
		this.kneeRight = new Joint( this, true, this.legRight, this.space.kneeRight );
		this.ankleRight = new Joint( this, true, this.kneeRight, this.space.ankleRight, this.space.ankleLongRight );
		this.footRight = new Joint( this, true, this.ankleRight, this.space.footRight );

		this.armLeft = new Joint( this, false, this.chest, this.space.armLeft, this.space.armLeft, 'yxz' );
		this.elbowLeft = new Joint( this, false, this.armLeft, this.space.elbowLeft, this.space.elbowLeft, 'yxz' );
		this.wristLeft = new Joint( this, false, this.elbowLeft, this.space.wristLeft, this.space.forearmLeft, 'zxy' );

		this.armRight = new Joint( this, true, this.chest, this.space.armRight, this.space.armRight, 'yxz' );
		this.elbowRight = new Joint( this, true, this.armRight, this.space.elbowRight, this.space.elbowRight, 'yxz' );
		this.wristRight = new Joint( this, true, this.elbowRight, this.space.wristRight, this.space.forearmRight, 'zxy' );

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

		this.armLeft.straddle = this.armRight.straddle = 65;
		this.elbowLeft.bend = this.elbowRight.bend = 20;

	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( matrix, angles, sx, sy, sz, order ) {

			e.set( sx*angles.x, sy*angles.y, sz*angles.z, order );
			m.makeRotationFromEuler( e );
			var s = m.elements;
			matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		anglesToMatrix( this.space.head.matrix, this.space.head.angle, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.space.chest.matrix, this.space.chest.angle, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.space.waist.matrix, this.space.waist.angle, -1, 1, 1, 'YZX' );
		anglesToMatrix( this.space.torso.matrix, this.space.torso.angle, -1, -1, 1, 'YZX' );

		anglesToMatrix( this.space.elbowLeft.matrix, this.space.elbowLeft.angle, 0, 1, 0, 'YZX' );
		anglesToMatrix( this.space.elbowRight.matrix, this.space.elbowRight.angle, 0, -1, 0, 'YZX' );

		// wrist: tilt bend
		anglesToMatrix( this.space.wristLeft.matrix, this.space.wristLeft.angle, 0, 1, 1, 'YZX' );
		anglesToMatrix( this.space.wristRight.matrix, this.space.wristRight.angle, 0, -1, -1, 'YZX' );

		// wrist: turn
		anglesToMatrix( this.space.forearmLeft.matrix, this.space.forearmLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.forearmRight.matrix, this.space.forearmRight.angle, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.space.armLeft.matrix, this.space.armLeft.angle, -1, 1, 1, 'XZY' );
		anglesToMatrix( this.space.armRight.matrix, this.space.armRight.angle, -1, -1, -1, 'XZY' );

		anglesToMatrix( this.space.kneeLeft.matrix, this.space.kneeLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.kneeRight.matrix, this.space.kneeRight.angle, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.space.ankleLeft.matrix, this.space.ankleLeft.angle, -1, 0, -1, 'YZX' );
		anglesToMatrix( this.space.ankleRight.matrix, this.space.ankleRight.angle, -1, 0, 1, 'YZX' );

		anglesToMatrix( this.space.ankleLongLeft.matrix, this.space.ankleLongLeft.angle, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.space.ankleLongRight.matrix, this.space.ankleLongRight.angle, 0, 1, 0, 'YZX' );

		anglesToMatrix( this.space.footLeft.matrix, this.space.footLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.footRight.matrix, this.space.footRight.angle, -1, 0, 0, 'YZX' );

		// legs turn
		anglesToMatrix( this.space.legLongLeft.matrix, this.space.legLongLeft.angle, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.space.legLongRight.matrix, this.space.legLongRight.angle, 0, 1, 0, 'YZX' );

		// leg: foreward ??? straddle
		anglesToMatrix( this.space.legLeft.matrix, this.space.legLeft.angle, 1, 0, -1, 'YZX' );
		anglesToMatrix( this.space.legRight.matrix, this.space.legRight.angle, 1, 0, 1, 'YZX' );

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

	constructor( height ) {

		super( gltf_man, MAN.SPACE, height );

		this.url = MODEL_PATH + MAN.URL;

		this.position.y = this.dims.height/2 - 0.015;

		this.legLeft.straddle = this.legRight.straddle = 5;
		this.ankleLeft.tilt = this.ankleRight.tilt = -5;
		this.ankleLeft.bend = this.ankleRight.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( height ) {

		super( gltf_woman, WOMAN.SPACE, height );

		this.url = MODEL_PATH + WOMAN.URL;

		this.position.y = this.dims.height/2 - 0.005;

		this.legLeft.straddle = this.legRight.straddle = -2.9;
		this.ankleLeft.tilt = this.ankleRight.tilt = 2.9;
		this.ankleLeft.bend = this.ankleRight.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( height ) {

		super( gltf_child, CHILD.SPACE, height );

		this.url = MODEL_PATH + CHILD.URL;

		this.position.y = this.dims.height/2 - 0.005;

		this.ankleLeft.bend = this.ankleRight.bend = 3;

	} // Child.constructor

} // Child



export { Man, Woman, Child };
