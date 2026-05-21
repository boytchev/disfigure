/**
 * Disfigure World
 *
 * -----------------------------------------------------------------------------
 *
 * Creates a default provisional world and environment.
 *
 * This module initializes and manages the core 3D world, including renderer,
 * camera, lighting, controls, and the main animation loop. Optional parameters
 * control the amount of figures. This is useful for large populations when it
 * is better to allocate resources in advance.
 *
 * It is not compulsory to use this world. User may setup their own environment.
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * World	- a class defining custom world with optional properties.
 *
 * setAnimationLoop() - sets custom animation loop in addition to the main loop
 *
 * everybody - array of all figures (exported from assets.js)
 *
 * renderer		- WebGPU renderer
 * scene		- scene (exported from pool.js)
 * camera		- perspective camera
 * light		- fixed directional light
 * cameraLight	- light attached to the camera
 * controls		- optional orbit controls
 * ground		- optional ground
 * stats		- optional statistic panel
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */



import { CanvasTexture, CircleGeometry, Color, DirectionalLight, Mesh, MeshLambertMaterial, Object3D, PCFSoftShadowMap, PerspectiveCamera, WebGPURenderer } from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';
import { scene } from './pool.js';
import { config, everybody } from './assets.js';



/**
 * Module-level variables - exposed for external access
 */
var renderer, camera, light, cameraLight, controls, ground, userAnimationLoop, stats;



/**
 * Main World class - responsible for setting up a default Three.js scene,
 * renderer, camera, lighting, ground, controls, population and so on.
 *
 * The `options` parameter defines configuration parameters:
 *
 *  - antialias	- Enable antialiasing (default is true)
 *  - shadows	- Enable shadow mapping (default is true)
 *  - lights	- Add lights (default is true)
 *  - controls	- Enable OrbitControls (default is true)
 *  - ground	- Add a circular ground plane (default is true)
 *  - stats		- Show performance stats  (default is false)
 *
 * The `options` parameter also defines figure parameters:
 *
 *  - men		- Suggested number of men figures
 *  - women		- Suggested number of women figures
 *  - children	- Suggested number of children figures
 *  - population- Total number of figures (may differ from men+women+children)
 *  - smooth	- Render figures with smoother surface (default is true)
 *  - lowpoly	- Reduce figure complexity (default is 0, no reduction)
 */
class World {

	constructor( options = {} ) {

		// Renderer setup

		renderer = new WebGPURenderer( { antialias: options?.antialias ?? true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = options?.shadows ?? true;
		renderer.shadowMap.type = PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		// Scene setup (defined in pool.js)

		scene.background = new Color( 'whitesmoke' );

		// Camera setup

		camera = new PerspectiveCamera( 30, innerWidth/innerHeight, 0.1, 1000 );
		camera.position.set( 0, 1.5, 4 );

		// Pre-compile scene for better performance - is it needed?

		renderer.compileAsync( scene, camera );

		// Population configuration

		if ( 'men' in options ) config.men = options.men;
		if ( 'women' in options ) config.women = options.women;
		if ( 'children' in options ) config.children = options.children;
		if ( 'population' in options ) config.population = options.population;

		// Figure configuration

		if ( 'smooth' in options ) config.smooth = options?.smooth;
		if ( 'lowpoly' in options ) config.lowpoly = options?.lowpoly;

		// Performance stats

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		}

		// Lights setup

		if ( options?.lights ?? true ) this.setupLighting( options );

		// Ground setup

		if ( options?.ground ?? true ) this.setupGround( );

		// Obrit controls setup

		if ( options?.controls ?? true ) {

			controls = new OrbitControls( camera, renderer.domElement );
			controls.enableDamping = true;
			controls.target.set( 0, 0.9, 0 );

		}

		// Event Listener to process canvas resizes

		window.addEventListener( "resize", ( /*event*/ ) => {

			camera.aspect = innerWidth/innerHeight;
			camera.updateProjectionMatrix( );

			renderer.setSize( innerWidth, innerHeight );

		} );

		// Animation loop setup

		renderer.setAnimationLoop( defaultAnimationLoop );

	} // World.constructor



	/**
     * Sets up main directional light and camera-attached fill light
     */
	setupLighting( options ) {

		// directional light with optional shadow

		light = new DirectionalLight( 'white', 1.4 );
		light.position.set( 0, 14, 7 );
		if ( options?.shadows ?? true ) {

			light.shadow.mapSize.width = 2048;
			light.shadow.mapSize.height = 2048;
			light.shadow.camera.near = 1;
			light.shadow.camera.far = 50;
			light.shadow.camera.left = -5;
			light.shadow.camera.right = 5;
			light.shadow.camera.top = 5;
			light.shadow.camera.bottom = -5;
			light.shadow.normalBias = -0.01;
			light.autoUpdate = false;
			light.castShadow = true;

		}

		scene.add( light );

		// Secondary camera-attached light (fill light)

		cameraLight = new DirectionalLight( 'white', 1.4 );
		cameraLight.position.z = 100;
		cameraLight.target = new Object3D();
		camera.add( cameraLight );
		scene.add( camera );

	}



	/**
     * Creates a stylized circular ground plane with a soft highlight
     */
	setupGround() {

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

		// Create ground object

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
		ground.renderOrder = -1; // Render behind everything

		scene.add( ground );

	}

} // World



/**
 * Custom event dispatched on every frame to `window` object and to each figure.
 */
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



/**
 * Singleton animate event instance - heavily reused
 */
var animateEvent = new AnimateEvent( );



/**
 * Default animation loop - core of the application.
 * Dispatches events and updates all entities.
 */
function defaultAnimationLoop( time ) {

	try {

		animateEvent.time = time;

		// Dispatch global animate event

		window.dispatchEvent( animateEvent );

		// Run custom user animation loop if set

		if ( userAnimationLoop ) userAnimationLoop( time );

		// Update all people/entities and send individual animate events

		everybody.forEach( ( p )=>{

			p.update();
			p.dispatchEvent( animateEvent );

		} );

		// Update orbit controls and camera light target

		if ( controls ) {

			controls.update( );
			cameraLight.target.position.copy( controls.target );

		}

		// Update stats panel

		if ( stats ) stats.update( );

		// Finally render the scene

		renderer.render( scene, camera );

	} catch ( err ) {

		renderer.setAnimationLoop( null );
		throw err;

	}

}



/**
 * Allows users to set a custom animation loop instead of using events.
 * Useful for users who prefer the classic Three.js pattern.
 */
function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}



export { World, renderer, scene, camera, light, cameraLight, controls, ground, everybody, setAnimationLoop };
