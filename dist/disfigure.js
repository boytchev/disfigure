// disfigure v0.0.25

import { TextureNode, DataTexture, RGBAFormat, FloatType, WebGPURenderer, PCFSoftShadowMap, Scene, Color, PerspectiveCamera, DirectionalLight, Object3D, Mesh, CircleGeometry, MeshLambertMaterial, CanvasTexture, Vector3, Vector4, InstancedMesh, MeshStandardNodeMaterial, InstancedBufferAttribute, Quaternion, MathUtils, Euler } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { uniformArray, Fn, vec4, If, select, ivec2, mat3, positionGeometry, normalGeometry, vec3, attribute, int, step, Loop, transformNormalToView, vertexStage } from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';

/**
 * disfigure / quats.js
 *
 * -----------------------------------------------------------------------------
 *
 * Module responsible for managing quaternion data for all figures using a data
 * texture. Each RGBA pixel represents one quaternion. A figure uses EQ pixels.
 * The texture grows dynamically in height keeping width fixed at TEXTURE_WIDTH.
 *
 * A full 2048x2048 texture supports ~79k figures (38 per row).
 *
 *
 * TEXTURE_WIDTH - data texture width (2048)
 * EQ		- total number of quaternions (pixels) per figure (53 )
 * EQ_DATA	- index of the data quaternion (52)
 *
 * quatTextureNode - a single unique instance of QuatTextureNode for all figures
 *
 *   .dataArray			- direct reference to the underlying raw data (Float32Array)
 *   .quatTexture		- the active DataTexture object (DataTexture)
 *   .count				- current maximum number of figures the texture can hold (number)
 *   .isQuatTextureNode	- flag identifying this custom node (boolean)
 *
 *   .setQ(figure,joint,vec4)		- sets a full quaternion for a figure joint
 *   .setXYZ(figure,joint,x,y,z,w)	- sets quaternion components directly
 *
 *
 * AI Disclosure: Grok 4.3 assistance was used for proper texture resizing logic,
 * cloning behavior in TSL TextureNode, and fine-tuning code comments.
 */




/**
 * Data texture width - 2048 is well supported across systems
 */
const TEXTURE_WIDTH = 2048;



/**
 * Number of vec4 per figure, 0..51 are quaternions, 52 is user data
 */
const EQ = 53; 



/**
 * Index of the data quaternion. It is not used as quaternion.
 * Could be used a loop of pure quaternions: for (i=0; i<EQ_DATA; i++)...
 *		x - the type of the figure (man=0, woman=1, child=2)
 *		y - unused, set to 0
 *		z - unused, set to 0
 *		w - unused, set to 0
 */
const EQ_DATA = 52; // 52 is vec4 for user data




/**
 * Custom TextureNode optimized for storing and accessing quaternion data.
 * Grows automatically. Extends TextureNode but disables all automatic UV
 * transformations and flipY logic that Three.js/TSL normally applies.
 */
class QuatTextureNode extends TextureNode {

	constructor( texture = null ) {

		// Create an empty texture if not provided

		if ( !texture ) {

			var dataArray = new Float32Array( 0 );
			texture = new DataTexture( dataArray, 0, 0, RGBAFormat, FloatType );

		}

		super( texture );

		this.isQuatTextureNode = true;

		this.dataArray = texture.image.data;
		this.quatTexture = texture;

		this.count = 0;

	}



	/**
	 * Critical: shares the same underlying texture for all figures [AI]
	 */
	clone() {

		var cloned = new this.constructor( this.value ); // same texture

		cloned.uvNode = this.uvNode;
		cloned.levelNode = this.levelNode;
		cloned.sampler = this.sampler;

		return cloned;

	}



	/**
	 * Custom uniform hash to help Three.js/TSL caching. [AI]
	 */
	getUniformHash( /* builder */ ) {

		return `QuatTexture-${this.value?.uuid || 'default'}`;

	}



	/**
	 * Increases texture capacity when more figures are added.
	 */
	setCapacity( count ) {

		if ( count <= this.count ) return; // already sufficient

		// Calculate the new height of the data texture

		var doubleHeight = Math.min( 2*this.quatTexture.image.height, TEXTURE_WIDTH );
		var preciseHeight = Math.ceil( count*EQ/TEXTURE_WIDTH );
		var newHeight = Math.max( doubleHeight, preciseHeight );

		if ( newHeight > TEXTURE_WIDTH )
			throw new Error( 'Too many figures — DataTexture limit exceeded' );

		// Create new larger array and copy existing data

		var newDataArray = new Float32Array( 4*newHeight*TEXTURE_WIDTH );
		newDataArray.set( this.dataArray );

		// Create new data texture

		var newQuatTexture = new DataTexture(
			newDataArray,
			TEXTURE_WIDTH,
			newHeight,
			RGBAFormat,
			FloatType
		);

		// Dispose old texture

		this.quatTexture.dispose();

		// Update internal references

		this.dataArray = newDataArray;
		this.quatTexture = newQuatTexture;
		this.value = newQuatTexture;

		this.count = Math.floor( newHeight * TEXTURE_WIDTH / EQ );

		// Increment version [AI]

		this.version = ( this.version || 0 ) + 1;

		// Force material update if we have a reference to it [AI]

		if ( this._material ) this._material.needsUpdate = true;

		console.log( `QUATTEX: resized → ${this.dataArray.length} floats (${this.count} figures)` );

	}



	/**
	 * Disables TSL's automatic UV transformation (including flipY).
	 */

	getTransformedUV( uvNode ) {

		return uvNode;

	}



	/**
	 * Disables TSL's automatic UV setup (including flipY).
	 */
	setupUV( builder, uvNode ) {

		return uvNode;

	}



	/**
	 * Sets a full quaternion for a given figure and joint.
	 */
	setQ( figure, joint, vec4 ) {

		vec4.toArray( this.dataArray, ( EQ*figure+joint )*4 );

	}



	/**
     * Sets quaternion components directly (x, y, z, w).
     */
	setXYZ( figure, joint, x, y, z, w ) {

		var base = ( EQ*figure+joint )*4;

		this.dataArray[ base++ ] = x;
		this.dataArray[ base++ ] = y;
		this.dataArray[ base++ ] = z;
		this.dataArray[ base++ ] = w;

	}


} // QuatTexNode



/**
 * Global shared instance used across the application
 */
var quatTextureNode = new QuatTextureNode( );

// number generators

var simplex = new SimplexNoise( );

// generate chaotic but random sequence of numbers in [min.max]
function chaotic( time, offset=0, min=-1, max=1 ) {

	return min + ( max-min )*( simplex.noise( time, offset )+1 )/2;

}



// generate repeated sequence of numbers in [min.max]
function regular( time, offset=0, min=-1, max=1 ) {

	return min + ( max-min )*( Math.sin( time+offset )+1 )/2;

}



// generate random sequence of numbers in [min.max]
function random( min=-1, max=1 ) {

	return min + ( max-min )*Math.random( );

}

var renderer, scene, camera, light, cameraLight, controls, ground, userAnimationLoop, stats, everybody = [];



// creates a default world with primary attributes. the options
// is a collection of flags that turn on/off specific features:
// {
//		lights: true,
//		controls: true,
//		ground: true,
//		antialias: true,
//		shadows: true,
//		stats: false,
// }

class World {

	constructor( options ) {

		renderer = new WebGPURenderer( { antialias: options?.antialias ?? true } );
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

		renderer.compileAsync( scene, camera );

		if ( options?.men ) {

			Man.count = options.men;

		} // men

		if ( options?.women ) {

			Woman.count = options.women;

		} // women

		if ( options?.children ) {

			Child.count = options.children;

		} // children

		quatTextureNode.setCapacity( Man.count+Woman.count+Child.count );

		if ( options?.population ) {

			quatTextureNode.setCapacity( options.population );

		} // population

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

// path to GLB models

const ASSETS_PATH = import.meta.url
	.replace( '/src/assets.js', '/assets/models/' )
	.replace( '/dist/disfigure.js', '/assets/models/' )
	.replace( '/dist/disfigure.min.js', '/assets/models/' )
	.replace( '/misc/firefox/assets.js', '/assets/models/' );



// preload figure metadata
var pivots, ranges, extras;

//console.time( 'metadata' );

await Promise.all([
	loadJSON( 'man.json' ),
	loadJSON( 'woman.json' ),
	loadJSON( 'child.json' ),
]).then( ([ dataMan, dataWoman, dataChild ])=>{

	var data1 = [
		...dataMan.pivots.map( v=>new Vector3( ...v ) ).flat(),
		...dataWoman.pivots.map( v=>new Vector3( ...v ) ).flat(),
		...dataChild.pivots.map( v=>new Vector3( ...v ) ).flat(),
	];
	var data2 = [
		...dataMan.ranges.map( v=>new Vector4( ...v ) ).flat(),
		...dataWoman.ranges.map( v=>new Vector4( ...v ) ).flat(),
		...dataChild.ranges.map( v=>new Vector4( ...v ) ).flat(),
	];
	var data3 = [
		...dataMan.extras.map( v=>new Vector4( ...v ) ).flat(),
		...dataWoman.extras.map( v=>new Vector4( ...v ) ).flat(),
		...dataChild.extras.map( v=>new Vector4( ...v ) ).flat(),
	];

	pivots = uniformArray( data1, 'vec3' ).setName( 'pivots' );
	ranges = uniformArray( data2, 'vec4' ).setName( 'ranges' );
	extras = uniformArray( data3, 'vec4' ).setName( 'extras' );

	//console.timeEnd( 'metadata' );

} );


// preloading names of skeleton joints

//console.time( 'body.json' );

const JOINTS = ( await fetch( ASSETS_PATH+'body.json' ).then( r => r.json() ) ).joints;
JOINTS.forEach( x => {

	x.parentIndex = JOINTS.findIndex( y => y.name==x.parent ); // set parent index for each joint
	x.signs = new Vector3( ...x.signs ); // convert angle directions into Vector3

} );

//console.timeEnd( 'body.json' );



/**
 * Loads a GLB model and optionally simplifies its geometry.
 *
 * The model must have a single mesh with geometry as the first child
 * of `gltf.scene`.
 *
 * @param {string} url - Full URL of the GLB model file.
 * @param {number} [lowpoly=0] - Geometry simplification factor.
 *        Mapped linearly [0 to 1]→[0% to 75%]
 *        - `lowpoly = 0` → keeps the original geometry
 *        - `lowpoly = 1` → removes ~75% of the geometry
 * @returns {Promise<BufferGeometry>} Promise for the geometry.
 */
function loadGLTF( url, lowpoly = 0 ) {

	//	console.time( url );

	return new GLTFLoader().loadAsync( ASSETS_PATH+url ).then( gltf => {

		// get the geometry and vertex count to remove

		var geometry = gltf.scene.children[ 0 ].geometry,
			vertices = Math.floor( geometry.attributes.position.count * lowpoly * 0.75 );

		// simplify the geometry if needed

		if ( vertices > 0 ) {

			var simplified = new SimplifyModifier().modify( geometry, vertices );
			geometry.dispose();
			geometry = simplified;

		}

		//		console.timeEnd( url );

		return geometry;

	} ); // then

} // loadGLTF



/**
 * Loads a JSON model description (skeleton data).
 *
 * Loads pivot points, ranges and extra data. All coordinate arrays
 * are automatically converted to Three.js TSL vectors (`vec3` / `vec4`).
 *
 * @param {string} url - Full URL of the JSON file.
 * @returns {Promise<object>} Promise for an object with:
 *                            - `pivots`: `vec3[]`
 *                            - `ranges`: `vec4[]`
 *                            - `extras`: `vec4[]`
 */
function loadJSON( url ) {

	return fetch( ASSETS_PATH+url ).then( r => r.json() );

} // loadJSON

var rotateByQuaternion = Fn( ([ p, q ])=>{

	return p.add( q.xyz.cross( q.xyz.cross( p ).add( q.w.mul( p ) ) ).mul( 2 ) );

}, { return: 'vec3', p: 'vec3', q: 'vec4' } );



var scaleQuaternion = Fn( ([ quat, k ])=>{

	var q = vec4();
	var len = quat.xyz.length().toVar();

	If( len.lessThan( 1e-5 ), ()=>{

		q.assign( vec4( 0, 0, 0, 1 ) );

	} ).

		Else( ()=>{

			var acos = k.mul( quat.w.acos() ).toVar();
			q.assign( vec4( quat.xyz.div( len ).mul( acos.sin() ), acos.cos() ) );

		} );

	return q;

}, { return: 'vec4', quat: 'vec4', k: 'float' } );



var disfigureMatrix = Fn( ([ mat, pivot, quat, k ])=>{

	var newMat = mat.toVar();

	// if k>0 the 'matrix' must be updated
	If( k.greaterThan( 0 ), () => {

		var q = quat.toVar();

		// if k<1 the quaternion's rotation must be 'divided'
		If( k.lessThan( 1 ), ()=>{

			q.assign( scaleQuaternion( q, k ) );

		} ); // k<1

		newMat.element( 0 ).assign( rotateByQuaternion( mat.element( 0 ).sub( pivot ), q ).add( pivot ) );
		newMat.element( 1 ).assign( rotateByQuaternion( mat.element( 1 ), q ) );

	} ); // k>0

	return newMat;

}, { return: 'mat3', mat: 'mat3', pivot: 'vec3', quat: 'vec4', k: 'float' } );



var layout = { pos: 'vec3', range: 'vec4', return: 'float' };



var gradientX = Fn( ([ pos, range ])=>pos.x.add( pos.y.mul( range.z ) ).smoothstep( range.x, range.y ), layout );



var gradientY = Fn( ([ pos, range ])=>pos.y.add( pos.z.mul( range.z ) ).smoothstep( range.x, range.y ), layout );



var gradientYT = Fn( ([ pos, range, slope ])=>{

	return pos.z.add( pos.x.mul( slope ) ).smoothstep( range.z, range.w );

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



var gradientLeg = Fn( ([ pos, range, range2 ])=>{

	var y = pos.y.sub( pos.x.abs().mul( 1/5 ) );
	var ofs = select( range2.x.equal( 1 ), pos.z.add( 0.05 ).abs().mul( 1/2 ), pos.z.mul( 1/6 ) );

	return pos.x.smoothstep( 0, range2.y )
		.mul( y.smoothstep( range.x.sub( ofs ), range.y ).smoothstep( 0, 1 ).pow( 2 ) )
		.add( pos.x.smoothstep( 0, range2.y.div( 10 ) ).mul( y.smoothstep( range.z, range.w ) ) )
		.clamp( 0, 1 )
	;

}, { return: 'float', pos: 'vec3', range: 'vec4', range2: 'vec2' } );



var gradientArm = Fn( ([ pos, pivot, range ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, select( x.greaterThan( 0 ), 1, -1 ) );

	return x.add( dx ).smoothstep( range.x, range.y ).smoothstep( 0, 1 )
		.mul( y.step( range.z ).oneMinus() );

}, { pos: 'vec3', pivot: 'vec3', range: 'vec4', return: 'float' } );



var gradientXT = Fn( ([ pos, range, slope ])=>
	pos.x.add( pos.z.mul( slope ) )
		.smoothstep( range.x, range.y )
		.mul(
			pos.z.smoothstep( range.z.sub( 0.0001 ), range.z.add( 0.0001 ) ),
			pos.z.smoothstep( range.w.add( 0.0001 ), range.w.sub( 0.0001 ) )
		)
, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );


var getQuatAddr = Fn( ([ figureIndex, propIndex ])=>{

	var offset = figureIndex.mul( EQ ).add( propIndex );//.toVar();
	return ivec2( offset.mod( TEXTURE_WIDTH ), offset.div( TEXTURE_WIDTH ) );

}, { return: 'ivec2', figureIndex: 'uint', propIndex: 'int' } );



var q = ( figureIndex, propIndex )=> {

	return quatTextureNode.load( getQuatAddr( figureIndex, propIndex ) );

};



var disfigureBody = Fn( ( )=>{

	var p = positionGeometry,
		m = mat3( p, normalGeometry.normalize(), vec3( 0 ) ).toVar( );

	var figureIndex = attribute( 'uids', 'int' );

	var gender = q( figureIndex, EQ_DATA ).x.mul( 52 ).toVar(); // 52 pivots
	var gender2 = q( figureIndex, EQ_DATA ).x.mul( 4 ).toVar(); // 4 extras

	var disP = ( i, gradient ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradient ) ),
		disY = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientY( p, ranges.element( i.add( gender ) ) ) ) ),
		disX = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientX( p, ranges.element( i.add( gender ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientXT( p, ranges.element( i.add( gender ) ), 0 ) ) );

	var isLeft = int( step( p.x, 0 ) ).toVar( ),
		isDown = p.y.lessThan( pivots.element( int( 2 ).add( gender ) ).y ).toVar( ), //chest
		isHand = p.x.abs().greaterThan( pivots.element( int( 16 ).add( gender ) ).x ); // wrist

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();


	If( isDown, ()=>{

		// process legs

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh
		Loop( { start: start, end: end }, ( { i } ) => disY( i ) );

		// leg
		disP( end, gradientLeg( p, ranges.element( end.add( gender ) ), extras.element( leg.add( gender2 ) ).xy ) );

	} ).Else( ()=>{

		// process hands
		If( isHand, ()=>{

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			disP( thumb, gradientXT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender2 ) ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradientYT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender2 ) ).y ) );

			let start = pick( 28, 40 ),
				end = start.add( 12 );

			// index, middle, ring, pinky
			Loop( { start: start, end: end }, ( { i } ) => disT( i ) );

		} );

		// process arms

		let start = pick( 16, 20 ),
			end = start.add( 3 );

		// wrist forearm elbow
		Loop( { start: start, end: end }, ( { i } ) => disX( i ) );

		// arm
		disP( end, gradientArm( p, pivots.element( int( end ).add( gender ) ), ranges.element( end.add( gender ) ) ) );

	} );



	//	process torso

	Loop( { end: int( 4 ) }, ( { i } ) => disY( i ) );

	// footer
	m.element( 1 ).assign( transformNormalToView( m.element( 1 ) ).normalize() );

	//	console.log( 'DODO==============================' );
	return m;//.debug();

} );

var disfigure = disfigureBody( );
var disfigurePosition = disfigure.element( 0 );
var disfigureNormal = disfigure.element( 1 );


/**
 * A class representing an instanced mesh with TSL material.
 * The data for rigging is stored in a square data texture.
 *
 * @augments InstancedMesh
 */
class Pool extends InstancedMesh {

	constructor( url, MAX_BODIES, lowpoly, useVertexStage ) {

		// create an empty instance mesh

		var material = new MeshStandardNodeMaterial( );

		super( null, material, MAX_BODIES );

		this.count = 0;
		this.castShadow = true;
		this.receiveShadow = true;
		this.frustumCulled = false;

		this.uidsArray = new Int32Array( MAX_BODIES ); // the global body index (uid) of each instance

		this.addToScene = true;

		console.log( 'Pool:created count', MAX_BODIES );

		// asynchronously load the geometry, the skeleton data, hook
		// shaders to material nodes and add the instance to the scene

		loadGLTF( url+'.glb', lowpoly ).then( ( geometry )=>{

			this.geometry = geometry;
			this.geometry.setAttribute( 'uids', new InstancedBufferAttribute( this.uidsArray, 1 ) );
			this.uidsAttr = this.geometry.getAttribute( 'uids' );
			this.uidsAttr.needsUpdate = true;

			material.positionNode = disfigurePosition;

			if ( useVertexStage )
				material.normalNode = vertexStage( disfigureNormal );
			else
				material.normalNode = disfigureNormal;
			material.needsUpdate = true;

			// safe only for webgl <-- causes extra shader compilation, so better to remove it
			//if( renderer.backend.isWebGLBackend ) renderer.render( this, camera )

			if ( this.addToScene ) {

				this.onLoad();
				scene.add( this );

			}

		} );

	} // Pool.constructor



	onLoad() {
	} // Pool.onLoad



	isFull( ) {

		return ( this.count >= this.instanceMatrix.count );

	} // Pool.isFull


	getBody( ) {

		if ( this.isFull() ) throw 'Too many figures (instance pool)';

		return this.count++;

	} // Pool.getBody


	// copy another pool to this pool
	copy( sourcePool ) {

		// copy matrices
		this.instanceMatrix.array.set( sourcePool.instanceMatrix.array );
		this.instanceMatrix.needsUpdate = true;

		// copy uids
		this.uidsArray.set( sourcePool.uidsArray );
		this.geometry.getAttribute( 'uids' ).needsUpdate = true;

	} // Pool.copy

}

// degrees-radian conversion
var toDeg = x => x * 180 / Math.PI,
	toRad = x => x / 180 * Math.PI;



// global unique identifier for bodies
var uid = 0;



// dummy variables
var _p = new Vector3(),
	_q = new Quaternion(),
	pivot = new Vector3();


class EulerDegrees extends Euler {

	constructor( body, index, parentIndex, signs ) {

		super();

		this.body = body;
		this.index = index;
		this.parentIndex = parentIndex;
		this.signs = signs;
		this.quaternion = new Quaternion();
		this.needsUpdate = true;
		this.attached = [];

	}

	set( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

	set x( n ) {

		super.x = toRad( this.signs.x*n );
		this.needsUpdate = true;

	}

	set y( n ) {

		super.y = toRad( this.signs.y*n );
		this.needsUpdate = true;

	}

	set z( n ) {

		super.z = toRad( this.signs.z*n );
		this.needsUpdate = true;

	}

	get x( ) {

		return toDeg( this.signs.x*super.x );

	}

	get y( ) {

		return toDeg( this.signs.y*super.y );

	}

	get z( ) {

		return toDeg( this.signs.z*super.z );

	}

	get q( ) {

		if ( this.needsUpdate ) {

			this.quaternion.setFromEuler( this );
			this.needsUpdate = false;

		}

		return this.quaternion;

	}

	// attach object to current joint
	attach( object ) {

		object.initialPosition = object.position.clone();
		object.matrixAutoUpdate = false;

		this.attached.push( object );

		this.body.pool.add( object );


	}

}


class Body extends Object3D {

	constructor( pool ) {

		quatTextureNode.setCapacity( uid+1 );
		pool.material.needsUpdate = true;

		super();

		this.pool = pool;
		this.pid = pool.getBody(); // instance index within the pool
		this.uid = uid++; // global body index

		pool.uidsArray[ this.pid ] = this.uid;

		this.eulers = [];

		for ( var i=0; i<EQ_DATA; i++ ) {

			this.eulers.push( new EulerDegrees( this, i, JOINTS[ i ].parentIndex, JOINTS[ i ].signs ) );

			this[ JOINTS[ i ].name ] = this.eulers[ i ];

		}

		everybody.push( this );

	}

	update( ) {

		this.updateMatrix();
		this.pool.setMatrixAt( this.pid, this.matrix );
		this.pool.instanceMatrix.needsUpdate = true;

		for ( var i=0; i<EQ_DATA; i++ ) {

			var euler = this.eulers[ i ];

			quatTextureNode.setQ( this.uid, i, euler.q );

		} // for i

		quatTextureNode.quatTexture.needsUpdate = true;

	} // Body.update

	updateAttached( ) {

		if ( !pivots ) return;

		var offset = this.quaternionOffset;

		for ( var i=0; i<EQ_DATA; i++ ) {

			var _euler = this.eulers[ i ];

			for ( var object of _euler.attached ) {

				var euler = _euler;

				pivot.set( ...pivots.array[ euler.index+offset ]);

				_p.copy( object.initialPosition );
				_p.add( pivot );

				_q.identity();


				scan: while ( euler ) {

					pivot.set( ...pivots.array[ euler.index+offset ]);

					_p.sub( pivot ).applyQuaternion( euler.quaternion ).add( pivot );
					_q.premultiply( euler.quaternion );

					if ( euler.parentIndex<0 ) break scan;

					euler = this.eulers[ euler.parentIndex ];

				}

				_p.multiply( this.scale );
				_p.add( this.position );

				object.position.copy( _p );
				object.quaternion.copy( _q );
				object.updateMatrix();


			} // for object

		} // for i

	} // Body.updateAttached



	get posture() {

		var r = x=>Math.round( 100*( Object.is( x, -0 )?0:x ) )/100; // round a number

		return {
			version: 9,
			position: [ ...this.position ],
			angles: this.eulers.map( e=>[ r( e.x ), r( e.y ), r( e.z ) ]),
		};

	} // Body.get.posture



	get posture() {

		var r = x=>Math.round( 100*( Object.is( x, -0 )?0:x ) )/100; // round a number

		return {
			version: 9,
			//position: [...this.position],
			angles: this.eulers.map( e=>[ r( e.x ), r( e.y ), r( e.z ) ]),
		};

	} // Body.get.posture



	get postureString() {

		return JSON.stringify( this.posture );

	} // Body.get.postureString



	set posture( data ) {

		if ( data.version !=9 )
			throw 'Incompatible posture version';

		//this.position.set( ...data.position );

		for ( var i in data.angles ) {

			this.eulers[ i ].x = data.angles[ i ][ 0 ];
			this.eulers[ i ].y = data.angles[ i ][ 1 ];
			this.eulers[ i ].z = data.angles[ i ][ 2 ];

		}

	} // Body.posture


	blend( postureA, postureB, k ) {

		function lerp( a, b ) {

			var c = [];
			for ( var i=0; i<a.length; i++ )
				c[ i ] = MathUtils.lerp( a[ i ], b[ i ], k );

			return c;

		}

		if ( postureA.version !=9 || postureB.version !=9 )
			throw 'Incompatible posture version';

		this.posture = {
			version: 9,
			angles: postureA.angles.map( ( a, i ) => lerp( a, postureB.angles[ i ]) ),
		};

	} // blend


} // Body


function preparePool( Class, name ) {

	if ( Class.pool == null ) {

		Class.pool = new Pool( name, Class.count, Class.lowpoly, Class.vertexStage );

	}

	if ( Class.pool.isFull() ) {


		// get a larger pool
		Class.count = Math.round( 2*Class.count );

		var oldPool = Class.pool;
		var newPool = new Pool( name, Class.count, Class.lowpoly, Class.vertexStage );
		oldPool.addToScene = false;
		oldPool.removeFromParent();
		for ( var body of everybody ) {

			if ( body.pool == oldPool ) body.pool = newPool;

		}

		if ( oldPool.children.length>0 )
			newPool.add( ...oldPool.children ); // move attached objects

		console.log( name+':: pool is full, size', oldPool.uidsArray.length, '->', newPool.uidsArray.length );

		newPool.count = oldPool.count;
		newPool.instanceMatrix.array.set( oldPool.instanceMatrix.array );
		newPool.uidsArray.set( oldPool.uidsArray );

		Class.pool = newPool;

	}

}

class Man extends Body {

	static pool = null;
	static count = 2; // max number of men
	static lowpoly = 0; // lowpoly-ness, 0=original, 1.0 remove 75%
	static vertexStage = false; // true for faster but uglier normals

	constructor( height = 1.80 ) {

		preparePool( Man, 'man' );

		super( Man.pool );

		quatTextureNode.setXYZ( this.uid, EQ_DATA, 0, 0, 0, 0 );

		this.material = Man.pool.material; // expose to outside

		this.scale.setScalar( height/1.795 ); // 1.795 is 3D model height

		this.quaternionOffset = 0*EQ_DATA; // custom property

		this.l_arm.z = this.r_arm.z = -75;
		this.l_elbow.y = this.r_elbow.y = 20;
		this.l_leg.z = this.r_leg.z = 10;
		this.l_ankle.z = this.r_ankle.z = -10;
		this.l_ankle.x = this.r_ankle.x = 3;

		this.position.y = -0.012;

	}

} // Man



class Woman extends Body {

	static pool = null;
	static count = 2; // max number of women
	static lowpoly = 0; // lowpoly-ness, 0=original, 1.0 remove 75%
	static vertexStage = false; // true for faster but uglier normals

	constructor( height = 1.70 ) {

		preparePool( Woman, 'woman' );

		super( Woman.pool );

		quatTextureNode.setXYZ( this.uid, EQ_DATA, 1, 0, 0, 0 );

		this.material = Woman.pool.material; // expose to outside

		this.scale.setScalar( height/1.691 ); // 1.691 is 3D model height

		this.quaternionOffset = 1*EQ_DATA; // custom property

		this.l_arm.z = this.r_arm.z = -90;
		this.l_elbow.y = this.r_elbow.y = 0;
		this.l_leg.z = this.r_leg.z = -3;
		this.l_ankle.z = this.r_ankle.z = 3;
		this.l_ankle.x = this.r_ankle.x = 3;

	}

} // Woman



class Child extends Body {

	static pool = null;
	static count = 2; // max number of children
	static lowpoly = 0; // lowpoly-ness, 0=original, 1.0 remove 75%
	static vertexStage = false; // true for faster but uglier normals

	constructor( height = 1.35 ) {

		preparePool( Child, 'child' );

		super( Child.pool );

		quatTextureNode.setXYZ( this.uid, EQ_DATA, 2, 0, 0, 0 );

		this.material = Child.pool.material; // expose to outside

		this.scale.setScalar( height/1.352 ); // 1.352 is 3D model height

		this.quaternionOffset = 2*EQ_DATA; // custom property

		this.l_arm.x = this.r_arm.x = -10;
		this.l_arm.z = this.r_arm.z = -80;
		this.l_ankle.bend = this.r_ankle.bend = 3;

		this.position.y = -8e-3;

	}

} // Child

// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '\n%c\u22EE\u22EE\u22EE Disfigure\n%chttps://boytchev.github.io/disfigure/\n', 'color: navy', 'font-size:80%' );

export { Child, Man, Pool, Woman, World, camera, cameraLight, chaotic, controls, disfigureBody, disfigureMatrix, everybody, gradientArm, gradientLeg, gradientX, gradientXT, gradientY, gradientYT, ground, light, random, regular, renderer, scene, setAnimationLoop };
