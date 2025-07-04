
// disfigure
//
// this is a kind of additional file for creating a predefined
// 3D world with all basic properties (like colors and lights).
// it exports one function for world creation and all Three.js
// instances used to manage a virtual scene.



import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { everybody, setWorld } from './body.js';



var renderer, scene, camera, light, cameraLight, controls, userAnimationLoop;



// creates a default world with all its primary attributes
// the options parameters is a collection of flags that turn
// on/off specific features:
//
// options.lights		true, whether lights are created
// options.controls		true, whether OrbitControls is created
// options.ground		true, whether ground is created

class World {
	constructor( options ) {

		renderer = new THREE.WebGPURenderer( { antialias: true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		scene = new THREE.Scene();
		scene.background = new THREE.Color( 'whitesmoke' );

		setWorld( scene );
		
		camera = new THREE.PerspectiveCamera( 30, innerWidth/innerHeight );
		camera.position.set( 0, 1, 4 );
		camera.lookAt( 0, 1, 0 );

		if ( options?.lights ?? true ) {

			light = new THREE.DirectionalLight( 'white', 1.5 );
			light.decay = 0;
			light.position.set( 0, 2, 1 ).setLength( 15 );
			light.shadow.mapSize.width = 2048;
			light.shadow.mapSize.height = light.shadow.mapSize.width;
			light.shadow.camera.near = 1;//13;
			light.shadow.camera.far = 50;//18.5;
			light.shadow.camera.left = -5;
			light.shadow.camera.right = 5;
			light.shadow.camera.top = 5;
			light.shadow.camera.bottom = -5;
			light.shadow.normalBias = 0.01;
			light.autoUpdate = false;
			light.castShadow = true;
			scene.add( light );

			cameraLight = new THREE.DirectionalLight( 'white', 1.5 );
			cameraLight.decay = 0;
			cameraLight.target = scene;
			camera.add( cameraLight );
			scene.add( camera );

		} // lights

		if ( options?.controls ?? true ) {

			controls = new OrbitControls( camera, renderer.domElement );
			controls.enableDamping = true;
			controls.target.set( 0, 0.8, 0 );

		} // controls

		if ( options?.ground ?? true ) {

			// generate ground texture
			var canvas = document.createElement( 'CANVAS' );
			canvas.width = 512/4;
			canvas.height = 512/4;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 256/4, 256/4, 150/4, 0, 2*Math.PI );
			context.fill();

			var ground = new THREE.Mesh(
				new THREE.CircleGeometry( 50 ),
				new THREE.MeshLambertMaterial(
					{
						color: 'antiquewhite',
						transparent: true,
						map: new THREE.CanvasTexture( canvas )
					} )
			);
			ground.receiveShadow = true;
			ground.rotation.x = -Math.PI / 2;
			ground.renderOrder = -1;
			scene.add( ground );

		} // ground

		window.addEventListener( "resize", ( /*event*/ ) => {

			camera.aspect = innerWidth/innerHeight;
			camera.updateProjectionMatrix( );
			renderer.setSize( innerWidth, innerHeight );

		} );

		renderer.setAnimationLoop( defaultAnimationLoop );
	} // World.constructor
	
} // World



// custom event to distribute animation requests to models

class NewEvent extends Event {

	#target;

	constructor( e ) {

		super( e );

	}

	get target() {

		return this.#target;

	}

	set target( a ) {

		this.#target = a;

	}

} // NewEvent



// default animation loop that dispatches animation event
// to the window and to each body

function defaultAnimationLoop( ) {

	var animateEvent = new Event( 'animate' );
	window.dispatchEvent( animateEvent );

	animateEvent = new NewEvent( 'animate' );
	everybody.forEach( ( p )=>{

		animateEvent.target = p;
		p.dispatchEvent( animateEvent );

	} );

	if ( userAnimationLoop ) userAnimationLoop( animateEvent.timeStamp );

	if ( controls ) controls.update( );

	renderer.render( scene, camera );

}



// function to set animation loop, if events are not used

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}



export { World, renderer, scene, camera, light, cameraLight, controls, setAnimationLoop };
