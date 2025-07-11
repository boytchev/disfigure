
// disfigure
//
// Definitions of man, woman and child classes based on general disfigure class.
// Different motions of body parts are defined as methods.



import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fn, vec3 } from 'three/tsl';

import { tslNormalNode, tslPositionNode, tslPosture } from './motion.js';
import { centerModel, ennodeModel } from './utils.js';
import { Space } from './space.js';
import { everybody, scene } from './world.js';



// definitions of spaces
import * as MAN from './models/man.js';
import * as WOMAN from './models/woman.js';
import * as CHILD from './models/child.js';



// path to models as GLB files
const MODEL_PATH = '../assets/models/';

console.time( 'Preload' );
var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + MAN.URL ),
		loader.loadAsync( MODEL_PATH + WOMAN.URL ),
		loader.loadAsync( MODEL_PATH + CHILD.URL ),
	]
);
console.timeEnd( 'Preload' );



function toRad( x ) {

	return x * ( 2*Math.PI/360 );

}



function toDeg( x ) {

	return x / ( 2*Math.PI/360 );

}



class Joint {

	constructor( model, space, jointX, jointY, jointZ, nameX='x', nameY='y', nameZ='z' ) {

		this.model = model;
		this.pivot = space.pivot;
		this.jointX = jointX;
		this.jointY = jointY ?? jointX;
		this.jointZ = jointZ ?? jointX;
		this.nameX = nameX;
		this.nameY = nameY;
		this.nameZ = nameZ;

	}

	// bend raise turn tilt straddle

	get bend( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set bend( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	get raise( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set raise( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	get turn( ) {

		return toDeg( this.jointY[ this.nameY ]);

	}
	set turn( a ) {

		this.jointY[ this.nameY ] = toRad( a );

	}

	get tilt( ) {

		return toDeg( this.jointZ[ this.nameZ ]);

	}

	set tilt( a ) {

		this.jointZ[ this.nameZ ] = toRad( a );

	}

	get straddle( ) {

		return toDeg( this.jointZ[ this.nameZ ]);

	}

	set straddle( a ) {

		this.jointZ[ this.nameZ ] = toRad( a );

	}

	get foreward( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set foreward( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	attach( mesh ) {

		//mesh.position.copy( this.pivot );
		//mesh.material = this.model.children[0].material;
		//this.model.children[0].add( mesh );
		mesh.matrixAutoUpdate = false;
		this.model.add( mesh );

	}

} // Joint





var m = new THREE.Matrix4(),
	e = new THREE.Euler(),
	_uid = 1;

class Disfigure extends THREE.Group {


	constructor( gltf, space, height ) {

		super();



		// unique number for each body, used to make their motions different
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		// dimensions of the body, including its height
		this.dims = {};
		this.space = {};

		// reduce the hierarchy of the model
		var model = new THREE.Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		centerModel( model, this.dims );

		// create the space around the model
		this.space = new Space( this.dims, space );


		// posture of the body, containing only angles
		this.posture = tslPosture( );

		this.head = new Joint( this, this.space.head, this.posture.head );
		this.chest = new Joint( this, this.space.chest, this.posture.chest );
		this.waist = new Joint( this, this.space.waist, this.posture.waist );

		this.legLeft = new Joint( this, this.space.legLeft, this.posture.legLeft, this.posture.legLongLeft );
		this.kneeLeft = new Joint( this, this.space.kneeLeft, this.posture.kneeLeft );
		this.ankleLeft = new Joint( this, this.space.ankleLeft, this.posture.ankleLeft, this.posture.ankleLongLeft );
		this.footLeft = new Joint( this, this.space.footLeft, this.posture.footLeft );

		this.legRight = new Joint( this, this.space.legRight, this.posture.legRight, this.posture.legLongRight );
		this.kneeRight = new Joint( this, this.space.kneeRight, this.posture.kneeRight );
		this.ankleRight = new Joint( this, this.space.ankleRight, this.posture.ankleRight, this.posture.ankleLongRight );
		this.footRight = new Joint( this, this.space.footRight, this.posture.footRight );

		this.armLeft = new Joint( this, this.space.armLeft, this.posture.armLeft, this.posture.armLeft, this.posture.armLeft, 'y', 'x', 'z' );
		this.elbowLeft = new Joint( this, this.space.elbowLeft, this.posture.elbowLeft, null, null, 'y' );
		this.wristLeft = new Joint( this, this.space.wristLeft, this.posture.wristLeft, this.posture.forearmLeft, this.posture.wristLeft, 'z', 'x', 'y' );

		this.armRight = new Joint( this, this.space.armRight, this.posture.armRight, this.posture.armRight, this.posture.armRight, 'y', 'x', 'z' );
		this.elbowRight = new Joint( this, this.space.elbowRight, this.posture.elbowRight, null, null, 'y' );
		this.wristRight = new Joint( this, this.space.wristRight, this.posture.wristRight, this.posture.forearmRight, this.posture.wristRight, 'z', 'x', 'y' );



		// sets the materials of the model hooking them to TSL functions
		ennodeModel( model, this.space, this.posture,
			{	// nodes
				positionNode: tslPositionNode, // rigging
				normalNode: tslNormalNode, // lighting
				colorNode: Fn( ()=>{

					return vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 );

				} ),
			},
			{	// additional material properties
				metalness: 0,
				roughness: 0.6,
			} );

		// move the model so it stands on plane y=0
		model.position.y = -this.dims.y/2;

		// rescale the model to the desired height (optional)
		if ( height ) {

			model.scale.setScalar( height / this.dims.height );

		}

		model.castShadow = true;
		model.receiveShadow = true;

		this.model = model;
		this.add( model );

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );


	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( matrix, angles, sx, sy, sz, order ) {

			e.set( sx*angles.x, sy*angles.y, sz*angles.z, order );
			m.makeRotationFromEuler( e );
			var s = m.elements;
			matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		anglesToMatrix( this.posture.headMatrix, this.posture.head, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.posture.chestMatrix, this.posture.chest, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.posture.waistMatrix, this.posture.waist, -1, 1, 1, 'YZX' );

		anglesToMatrix( this.posture.elbowLeftMatrix, this.posture.elbowLeft, 0, 1, 0, 'YZX' );
		anglesToMatrix( this.posture.elbowRightMatrix, this.posture.elbowRight, 0, -1, 0, 'YZX' );

		// wrist: tilt bend
		anglesToMatrix( this.posture.wristLeftMatrix, this.posture.wristLeft, 0, 1, 1, 'YZX' );
		anglesToMatrix( this.posture.wristRightMatrix, this.posture.wristRight, 0, -1, -1, 'YZX' );

		// wrist: turn
		anglesToMatrix( this.posture.forearmLeftMatrix, this.posture.forearmLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.forearmRightMatrix, this.posture.forearmRight, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.posture.armLeftMatrix, this.posture.armLeft, -1, 1, 1, 'XZY' );
		anglesToMatrix( this.posture.armRightMatrix, this.posture.armRight, -1, -1, -1, 'XZY' );

		anglesToMatrix( this.posture.kneeLeftMatrix, this.posture.kneeLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.kneeRightMatrix, this.posture.kneeRight, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.posture.ankleLeftMatrix, this.posture.ankleLeft, -1, 0, -1, 'YZX' );
		anglesToMatrix( this.posture.ankleRightMatrix, this.posture.ankleRight, -1, 0, 1, 'YZX' );

		anglesToMatrix( this.posture.ankleLongLeftMatrix, this.posture.ankleLongLeft, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.posture.ankleLongRightMatrix, this.posture.ankleLongRight, 0, 1, 0, 'YZX' );

		anglesToMatrix( this.posture.footLeftMatrix, this.posture.footLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.footRightMatrix, this.posture.footRight, -1, 0, 0, 'YZX' );

		// legs turn
		anglesToMatrix( this.posture.legLongLeftMatrix, this.posture.legLongLeft, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.posture.legLongRightMatrix, this.posture.legLongRight, 0, 1, 0, 'YZX' );

		// leg: foreward ??? straddle
		anglesToMatrix( this.posture.legLeftMatrix, this.posture.legLeft, 1, 0, -1, 'YZX' );
		anglesToMatrix( this.posture.legRightMatrix, this.posture.legRight, 1, 0, 1, 'YZX' );

	}

} // Disfigure



class Man extends Disfigure {

	constructor( height ) {

		super( gltf_man, MAN.SPACE, height );

		this.url = MODEL_PATH + MAN.URL;

		this.legLeft.straddle = 5;
		this.legRight.straddle = 5;

		this.ankleLeft.tilt = -5;
		this.ankleRight.tilt = -5;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -0.005;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( height ) {

		super( gltf_woman, WOMAN.SPACE, height );

		this.url = MODEL_PATH + WOMAN.URL;

		this.legLeft.straddle = -2.9;
		this.legRight.straddle = -2.9;

		this.ankleLeft.tilt = 2.9;
		this.ankleRight.tilt = 2.9;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -0.005;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( height ) {

		super( gltf_child, CHILD.SPACE, height );

		this.url = MODEL_PATH + CHILD.URL;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -0.005;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Child.constructor

} // Child



export { Man, Woman, Child };
