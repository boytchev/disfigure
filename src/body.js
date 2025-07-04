
// body


import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { Fn, vec3, vec4 } from 'three/tsl';

import { tslNormalNode, tslPositionNode, tslPosture } from './motion.js';
import { centerModel, ennodeModel, flattenModel } from './utils.js';
import { Space } from './space.js';

import * as MAN from './models/man.js';
import * as WOMAN from './models/woman.js';
import * as CHILD from './models/child.js';



const MODEL_PATH = '../assets/models/';
const PI2 = 2*Math.PI;



//var models = {}; // a set of all models
var loader = new GLTFLoader();
var everybody = [];



//https://i.pinimg.com/474x/42/0f/9b/420f9b0944dc8f9b47ba431a2b628c10.jpg

// var colors = [
// 0xfed1b9, 0xfdc786, 0xaa6948, 0xfbc5a4, 0xfbbe9b, 0x9a572a, 0xfdcec7, 0x6f331d,
// 0x1e0e08, 0xfcbd84, 0x633c1d, 0x34251b, 0xa87256, 0x855f44, 0xb89c84, 0x9f6c56,
// ];



function angle( x ) {

	x = ( ( x%360 ) + 360 )%360;
	x = x>180?x-360:x;
	return x * PI2/360;

}



class Disfigure extends THREE.Group {

	constructor( MODEL_DEFINITION ) {

		super();

		this.castShadow = true;
		this.receiveShadow = true;

		this.dims = {};
		this.posture = tslPosture( MODEL_DEFINITION.SPACE );

		loader.load( MODEL_PATH + MODEL_DEFINITION.URL, ( gltf ) => {

			var model = flattenModel( gltf.scene, [ 0, 0, 0 ]);
			centerModel( model, this.dims );

			var space = new Space( this.dims, MODEL_DEFINITION.SPACE );


			ennodeModel( model, space, this.posture,
				{	// nodes
					//colorNode: tslWhiteNode, // color
					positionNode: tslPositionNode, // rigging
					normalNode: tslNormalNode, // lighting
					//colorNode: Fn( ()=>{return vec3( 0x30/0xFF, 0x20/0xFF, 0x10/0xFF ).pow(2.2);} ),
				},
				{	// additional material properties
					color: new THREE.Color( 0xfed1b9 ),
					metalness: 0,
					roughness: 0.6,
				} );

			model.position.y = -this.dims.y/2;
			model.castShadow = true;
			model.receiveShadow = true;
			this.add( model );
			everybody.push( this );

		} ); // load

	} // Disfigure.constructor

	head( nod, spin=0, tilt=0 ) {

		this.posture.head.value.set( nod, spin, tilt );

	}

	get headNod( ) {

		return this.posture.head.value.x;

	}
	set headNod( a ) {

		this.posture.head.value.x = angle( a );

	}

	get headSpin( ) {

		return this.posture.head.value.y;

	}
	set headSpin( a ) {

		this.posture.head.value.y = angle( a );

	}

	get headTilt( ) {

		return this.posture.head.value.z;

	}
	
	set headTilt( a ) {

		this.posture.head.value.z = angle( a );

	}

	get waistNod( ) {

		return this.posture.waist.value.x;

	}
	
	set waistNod( a ) {

		this.posture.waist.value.x = angle( a );

	}

	get waistSpin( ) {

		return this.posture.waist.value.y;

	}
	
	set waistSpin( a ) {

		this.posture.waist.value.y = angle( a );

	}


} // Disfigure



class Man extends Disfigure {

	constructor( ) {

		super( MAN );

		this.posture.legLeft.value.z = -0.1;
		this.posture.legRight.value.z = 0.1;

		this.posture.ankleLeft.value.z = 0.1;
		this.posture.ankleRight.value.z = -0.1;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( ) {

		super( WOMAN );

		this.posture.legLeft.value.z = 0.05;
		this.posture.legRight.value.z = -0.05;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( ) {

		super( CHILD );

	} // Child.constructor

} // Child



export { Man, Woman, Child, everybody };
