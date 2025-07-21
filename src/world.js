
// disfigure
//
// Non-core functionality for creating a predefined 3D world with all basic
// Three.js elements (like renderer, scene, camera, lights). This is mainly done
// to make concise demos and examples.



import { CanvasTexture, CircleGeometry, Color, DirectionalLight, Mesh, MeshLambertMaterial, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGPURenderer } from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';


var renderer, scene, camera, light, cameraLight, controls, ground, userAnimationLoop, stats, everybody = [];



// creates a default world with all its primary attributes the options parameters
// is a collection of flags that turn on/off specific features:
//    lights	true, create lights
//    controls	true, create OrbitControls
//    ground	true, create ground
//    shadows	true, create shadows
//	  stats		false, create stats panel

class World {

	constructor( options ) {

		renderer = new WebGPURenderer( { antialias: true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = options?.shadows ?? true;
		renderer.shadowMap.type = PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		scene = new Scene();
		scene.background = new Color( 'whitesmoke' );

		camera = new PerspectiveCamera( 30, innerWidth/innerHeight );
		camera.position.set( 0, 1.5, 4 );

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		} // stats

		if ( options?.lights ?? true ) {

			light = new DirectionalLight( 'white', 1.5 );
			light.position.set( 0, 14, 7 );
			if ( options?.shadows ?? true ) {

				light.shadow.mapSize.width = 2048;
				light.shadow.mapSize.height = light.shadow.mapSize.width;
				light.shadow.camera.near = 1;
				light.shadow.camera.far = 50;
				light.shadow.camera.left = -5;
				light.shadow.camera.right = 5;
				light.shadow.camera.top = 5;
				light.shadow.camera.bottom = -5;
				light.shadow.normalBias = 0.01;
				light.autoUpdate = false;
				light.castShadow = true;

			} // light shadows

			scene.add( light );

			cameraLight = new DirectionalLight( 'white', 1.5 );
			cameraLight.target = scene;
			camera.add( cameraLight );
			scene.add( camera );

		} // lights

		if ( options?.controls ?? true ) {

			controls = new OrbitControls( camera, renderer.domElement );
			controls.enableDamping = true;
			controls.target.set( 0, 0.9, 0 );

		} // controls

		if ( options?.ground ?? true ) {

			// generate ground texture
			var canvas = document.createElement( 'CANVAS' );
			canvas.width = 128;
			canvas.height = 128;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 64, 64, 38, 0, 2*Math.PI );
			context.fill();

			ground = new Mesh(
				new CircleGeometry( 50 ),
				new MeshLambertMaterial( {
					color: 'antiquewhite',
					transparent: true,
					map: new CanvasTexture( canvas )
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



class AnimateEvent extends Event {

	#target;
	constructor() {

		super( 'animate' );

	}
	get target() {

		return this.#target;

	}
	set target( t ) {

		this.#target = t;

	}

}

var animateEvent = new AnimateEvent( );



// default animation loop that dispatches animation events to the window and to
// each body in the scene

function defaultAnimationLoop( time ) {

	try {

		animateEvent.time = time;

		window.dispatchEvent( animateEvent );

		everybody.forEach( ( p )=>{

			p.update( );
			p.dispatchEvent( animateEvent );

		} );

		if ( userAnimationLoop ) userAnimationLoop( time );

		if ( controls ) controls.update( );

		if ( stats ) stats.update( );

		renderer.render( scene, camera );

	} catch ( err ) {

		  renderer.setAnimationLoop( null );
		  throw ( err );

	}

}



// function to set animation loop, for when the user is scared to use events

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}



export { World, renderer, scene, camera, light, cameraLight, controls, ground, everybody, setAnimationLoop };
