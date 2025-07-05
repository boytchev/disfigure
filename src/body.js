
// disfigure
//
// Definitions of man, woman and child classes based on general disfigure class.
// Different motions of body parts are defined as methods.



import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fn, vec3 } from 'three/tsl';

import { tslNormalNode, tslPositionNode, tslPosture } from './motion.js';
import { centerModel, ennodeModel, flattenModel } from './utils.js';
import { Space } from './space.js';
import { everybody, scene } from './world.js';



// definitions of spaces
import * as MAN from './models/man.js';
import * as WOMAN from './models/woman.js';
import * as CHILD from './models/child.js';



// path to models as GLB files
const MODEL_PATH = '../assets/models/';



var loader = new GLTFLoader();

function angle( x ) {

	x = ( ( x%360 ) + 360 )%360;
	x = x>180?x-360:x;
	return x * 2*Math.PI/360;

}



class Joint {

	constructor( jointX, jointY, jointZ, nameX='x', nameY='y', nameZ='z' ) {

		this.jointX = jointX;
		this.jointY = jointY ?? jointX;
		this.jointZ = jointZ ?? jointX;
		this.nameX = nameX;
		this.nameY = nameY;
		this.nameZ = nameZ;

	}

	get nod( ) {

		return this.jointX.value.x;

	}

	set nod( a ) {

		this.jointX.value.x = angle( a );

	}

	get bend( ) {

		return this.jointX.value[ this.nameX ];

	}

	set bend( a ) {

		this.jointX.value[ this.nameX ] = angle( a );

	}

	get raise( ) {

		return this.jointX.value[ this.nameX ];

	}

	set raise( a ) {

		this.jointX.value[ this.nameX ] = angle( a );

	}

	get turn( ) {

		return this.jointY.value[ this.nameY ];

	}
	set turn( a ) {

		this.jointY.value[ this.nameY ] = angle( a );

	}

	get tilt( ) {

		return this.jointZ.value[ this.nameZ ];

	}

	set tilt( a ) {

		this.jointZ.value[ this.nameZ ] = angle( a );

	}

	get straddle( ) {

		return this.jointZ.value[ this.nameZ ];

	}

	set straddle( a ) {

		this.jointZ.value[ this.nameZ ] = angle( a );

	}

} // Joint



class Disfigure extends THREE.Group {

	constructor( MODEL_DEFINITION, height ) {

		super();

		// unique number for each body, used to make their motions different
		this.uid = 10*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		// dimensions of the body, including its height
		this.dims = {};

		// posture of the body, containing only angles
		this.posture = tslPosture( MODEL_DEFINITION.SPACE );

		this.head = new Joint( this.posture.head );
		this.chest = new Joint( this.posture.chest );
		this.waist = new Joint( this.posture.waist );

		this.legLeft = new Joint( this.posture.legLeft, this.posture.legLongLeft );
		this.kneeLeft = new Joint( this.posture.kneeLeft );
		this.ankleLeft = new Joint( this.posture.ankleLeft, this.posture.ankleLongLeft );
		this.footLeft = new Joint( this.posture.footLeft );

		this.legRight = new Joint( this.posture.legRight, this.posture.legLongRight );
		this.kneeRight = new Joint( this.posture.kneeRight );
		this.ankleRight = new Joint( this.posture.ankleRight, this.posture.ankleLongRight );
		this.footRight = new Joint( this.posture.footRight );

		this.armLeft = new Joint( this.posture.armLeft, this.posture.armLeft, this.posture.armLeft, 'y', 'x', 'z' );
		this.elbowLeft = new Joint( this.posture.elbowLeft, null, null, 'y' );
		this.wristLeft = new Joint( this.posture.wristLeft, this.posture.forearmLeft, this.posture.wristLeft, 'z', 'x', 'y' );

		this.armRight = new Joint( this.posture.armRight, this.posture.armRight, this.posture.armRight, 'y', 'x', 'z' );
		this.elbowRight = new Joint( this.posture.elbowRight, null, null, 'y' );
		this.wristRight = new Joint( this.posture.wristRight, this.posture.forearmRight, this.posture.wristRight, 'z', 'x', 'y' );

		// load the model and prepare it
		loader.load( MODEL_PATH + MODEL_DEFINITION.URL, ( gltf ) => {

			// reduce the hierarchy of the model
			var model = flattenModel( gltf.scene, [ 0, 0, 0 ]);

			// center the model and get its dimensions
			centerModel( model, this.dims );

			// create the space around the model
			var space = new Space( this.dims, MODEL_DEFINITION.SPACE );

			// sets the materials of the model hooking them to TSL functions
			ennodeModel( model, space, this.posture,
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

			this.add( model );

			// register the model
			everybody.push( this );
			if ( scene ) scene.add( this );

		} ); // load

	} // Disfigure.constructor


} // Disfigure



class Man extends Disfigure {

	constructor( height ) {

		super( MAN, height );

		this.legLeft.straddle = -5;
		this.legRight.straddle = 5;

		this.ankleLeft.tilt = 5;
		this.ankleRight.tilt = -5;

		this.ankleLeft.bend = -3;
		this.ankleRight.bend = -3;

		this.position.y = -0.005;

		this.armLeft.straddle = 45;
		this.armRight.straddle = -45;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = -20;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( height ) {

		super( WOMAN, height );

		this.legLeft.straddle = 2.9;
		this.legRight.straddle = -2.9;

		this.ankleLeft.tilt = -2.9;
		this.ankleRight.tilt = 2.9;

		this.ankleLeft.bend = -3;
		this.ankleRight.bend = -3;

		this.position.y = -0.005;

		this.armLeft.straddle = 45;
		this.armRight.straddle = -45;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = -20;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( height ) {

		super( CHILD, height );

		this.ankleLeft.bend = -3;
		this.ankleRight.bend = -3;

		this.position.y = -0.005;

		this.armLeft.straddle = 45;
		this.armRight.straddle = -45;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = -20;

	} // Child.constructor

} // Child



export { Man, Woman, Child };
