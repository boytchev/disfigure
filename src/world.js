
// disfigure



import { CanvasTexture, CircleGeometry, Color, DirectionalLight, Mesh, MeshLambertMaterial, Object3D, PCFSoftShadowMap, PerspectiveCamera, WebGPURenderer } from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';

import { scene } from './pool.js';
import { config, everybody } from './assets.js';


var renderer, camera, light, cameraLight, controls, ground, userAnimationLoop, stats;



// creates a default world with primary attributes. the options
// is a collection of flags that turn on/off specific features:
// {
//		lights: true,
//		controls: true,
//		ground: true,
//		antialias: true,
//		shadows: true,
//		stats: false,
//		men
//		women
//		children
//		population
//		smooth
//		lowpoly
// }

class World {

	constructor( options = {} ) {

		renderer = new WebGPURenderer( { antialias: options?.antialias ?? true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = options?.shadows ?? true;
		renderer.shadowMap.type = PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		scene.background = new Color( 'whitesmoke' );

		camera = new PerspectiveCamera( 30, innerWidth/innerHeight );
		camera.position.set( 0, 1.5, 4 );

		renderer.compileAsync( scene, camera );

		if ( 'men' in options ) {

			config.men = options.men;

		} // men

		if ( 'women' in options ) {

			config.women = options.women;

		} // women

		if ( 'children' in options ) {

			config.children = options.children;

		} // children


		if ( 'population' in options ) {

			config.population = options.population;

		} // population

		if ( 'smooth' in options ) {

			config.smooth = options?.smooth;

		} // smooth

		if ( 'lowpoly' in options ) {

			config.lowpoly = options?.lowpoly;

		} // smooth

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		} // stats

		if ( options?.lights ?? true ) {

			light = new DirectionalLight( 'white', 1.4 );
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
				light.shadow.normalBias = -0.01;
				light.autoUpdate = false;
				light.castShadow = true;

			} // shadows

			scene.add( light );

			cameraLight = new DirectionalLight( 'white', 1.4 );
			cameraLight.position.z = 100;
			cameraLight.target = new Object3D();
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
				new CircleGeometry( 32 ),
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



// default animation loop that dispatches animation events
// to the window and to each body in the scene

function defaultAnimationLoop( time ) {

	try {

		animateEvent.time = time;

		window.dispatchEvent( animateEvent );

		if ( userAnimationLoop ) userAnimationLoop( time );

		everybody.forEach( ( p )=>{

			p.updateAttached();
			p.dispatchEvent( animateEvent );

		} );

		if ( controls ) {

			controls.update( );
			cameraLight.target.position.copy( controls.target );

		}

		if ( stats ) stats.update( );


		renderer.render( scene, camera );

		everybody.forEach( ( p )=>{

			p.update(); // todo call update only on changed figures

		} );


	} catch ( err ) {

		  renderer.setAnimationLoop( null );
		  throw ( err );

	}

}



// function to set animation loop, for when the user is
// scared to use events

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}



export { World, renderer, scene, camera, light, cameraLight, controls, ground, everybody, setAnimationLoop };
