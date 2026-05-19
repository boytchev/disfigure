// disfigure v0.0.25

import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { Vector3, Vector4, TextureNode, DataTexture, RGBAFormat, FloatType, Scene, InstancedMesh, MeshStandardNodeMaterial, InstancedBufferAttribute, Quaternion, Object3D, MathUtils, Euler, WebGPURenderer, PCFSoftShadowMap, Color, PerspectiveCamera, DirectionalLight, Mesh, CircleGeometry, MeshLambertMaterial, CanvasTexture } from 'three';
import { uniformArray, Fn, vec4, If, select, ivec2, mat3, positionGeometry, normalGeometry, vec3, attribute, int, step, Loop, transformNormalToView, vertexStage } from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

/**
 * Disfigure Assets Loader
 *
-----------------------------------------------------------------------------
 *
 * This module defined global configuration, handles the preload of skeleton
 * metadata and the asynchronous loading of 3D assets and skeleton metadata.
 *
 * All models and metadata are expected to be in `/assets/models/`.
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * config    - {men,women,children,population,smooth,lowpoly}
 * everybody - array of all created bodies
 * JOINTS	 - array of JS objects with joint names, hierarchy and orientation
 * pivots	 - uniform array of vec3 with coordinates of joint pivot points
 * ranges	 - uniform array of vec4 with joint selection ranges
 * extras	 - uniform array of vec4 with additional selection data
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */




/**
 * Global configuration
 */
var config = {
	men: 1,			// amount of preallocatd space for Man instances
	women: 1,		// amount of preallocatd space for Woman instances
	children: 1,	// amount of preallocatd space for Child instances
	population: 3,	// amount of preallocatd space for quad texture used for rigging
	smooth: true,	// true = smooth shapes, false = rough shapes
	lowpoly: 0,		// lowpoly reduction factor, 0=0%, 1=75% reduction
};



/**
 * Array of all created bodies
 */
var everybody = [];



/**
 * Preloaded metadata for joint names and rotation directions.
 * The same metadata is used for all fibure types.
 * 		.name - name of joint
 *		.parentIndex - index of parent joint (calculated)
 *		.signs - rotation direction for joints (calculated)
 */
var JOINTS;



/**
 * Preloaded skeleton data. Defined are uniformArray to make the TSL shader code
 * shorter. Once created, they are not modified.
 *
 * pivots - array of vec3 = [52 for man, 52 for woman, 52 for child]
 * ranges - array of vec4 = [52 for man, 52 for woman, 52 for child]
 * extras - array of few vec4 [4 for man, 4 for woman, 4 for child]
 */
var pivots, ranges, extras;



/**
 * Base path for all model and metadata files
 */
const ASSETS_PATH = import.meta.url
	.replace( '/src/assets.js', '/assets/models/' )
	.replace( '/dist/disfigure.js', '/assets/models/' )
	.replace( '/dist/disfigure.min.js', '/assets/models/' );



/**
 * Simple JSON loader for metadata files. Returns a promise. Used internally.
 */
function loadJSON( url ) {

	return fetch( ASSETS_PATH + url ).then( r => {

		if ( !r.ok ) throw new Error( `Failed to load metadata: ${url}` ); // [AI]

		return r.json();

	} );

}



/**
 * Loads a GLB model and optionally simplifies its geometry.
 *
 * The model must have a single mesh as the first child of `gltf.scene`.
 * Returns a promise for the geometry.
 *
 * @param {string} url - Filename with .glb extension
 */
function loadGLTF( url ) {

	return new GLTFLoader().loadAsync( ASSETS_PATH+url ).then( gltf => {

		var geometry = gltf.scene.children[ 0 ].geometry;

		// Simplify the geometry if requested

		if ( config.lowpoly > 0 ) {

			var existingVertices = geometry.attributes.position.count,
				removedVertices = Math.floor( existingVertices * config.lowpoly * 0.75 );

			var simplified = new SimplifyModifier().modify( geometry, removedVertices );

			geometry.dispose();
			geometry = simplified;

		}

		return geometry;

	} ); // promise then

}



/**
 * Preload and process all skeleton metadata
 */
await Promise.all([
	loadJSON( 'body.json' ),
	loadJSON( 'man.json' ),
	loadJSON( 'woman.json' ),
	loadJSON( 'child.json' ),
]).then( ([ dataJoints, dataMan, dataWoman, dataChild ])=>{

	// process JOINTS: find parent indices, convert angle directions to Vector3

	JOINTS = dataJoints.joints;
	JOINTS.forEach( x => {

		x.parentIndex = JOINTS.findIndex( y => y.name==x.parent );
		x.signs = new Vector3( ...x.signs );

	} );

	// process pivots: merge data for figures, convert to vec3 uniform array

	pivots = uniformArray([
		...dataMan.pivots.map( v=>new Vector3( ...v ) ),
		...dataWoman.pivots.map( v=>new Vector3( ...v ) ),
		...dataChild.pivots.map( v=>new Vector3( ...v ) ),
	], 'vec3' ).setName( 'pivots' );

	// process ranges: merge data for figures, convert to vec4 uniform array

	ranges = uniformArray([
		...dataMan.ranges.map( v=>new Vector4( ...v ) ),
		...dataWoman.ranges.map( v=>new Vector4( ...v ) ),
		...dataChild.ranges.map( v=>new Vector4( ...v ) ),
	], 'vec4' ).setName( 'ranges' );

	// process extras: merge data for figures, convert to vec4 uniform array

	extras = uniformArray([
		...dataMan.extras.map( v=>new Vector4( ...v ) ),
		...dataWoman.extras.map( v=>new Vector4( ...v ) ),
		...dataChild.extras.map( v=>new Vector4( ...v ) ),
	], 'vec4' ).setName( 'extras' );


} );

/**
 * Disfigure Quaterion Data Texture
 *
 * -----------------------------------------------------------------------------
 *
 * Module responsible for managing quaternion data for all figures using a data
 * texture. Each RGBA pixel represents one quaternion. A figure uses QUATS_PER_BODY pixels.
 * The texture grows dynamically in height keeping width fixed at QUAT_TEXTURE_WIDTH.
 *
 * A full 2048x2048 texture supports ~79k figures (38 per row).
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * QUAT_TEXTURE_WIDTH	- data texture width (2048)
 * QUATS_PER_BODY		- total number of quaternions (pixels) per figure (53)
 * PURE_QUATS_PER_BODY	- number of pure/proper/joint quaternions (52)
 * QUAT_DATA_INDEX		- index of the data quaternion (52)
 *
 * setJointQuaternion	- sets quaternion of a joint of a figure
 * setQuaternionCapacity- sets the capacity of the quaternion texture
 *
 * quatTextureNode - a single unique instance of QuatTextureNode for all figures
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for proper texture resizing logic,
 * cloning behavior in TSL TextureNode, and fine-tuning code comments.
 */




/**
 * Data texture width - 2048 is well supported across systems
 */
const QUAT_TEXTURE_WIDTH = 2048;



/**
 * Number of vec4 per figure, 0..51 are quaternions, 52 is user data
 */
const QUATS_PER_BODY = 53;



/**
 * Number of quaternions per body that are used as quaternions
 */
const PURE_QUATS_PER_BODY = 52;



/**
 * Index of the data quaternion. It is not used as quaternion.
 * Could be used a loop of pure quaternions: for (i=0; i<QUAT_DATA_INDEX; i++)...
 *		x - the type of the figure (man=0, woman=1, child=2)
 *		y - unused, set to 0
 *		z - unused, set to 0
 *		w - unused, set to 0
 */
const QUAT_DATA_INDEX = 52; // 52 is vec4 for user data




/**
 * Custom TextureNode optimized for storing and accessing quaternion data.
 * Grows automatically. Extends TextureNode but disables all automatic UV
 * transformations and flipY logic that Three.js/TSL normally applies.
 *
 *   .dataArray			- direct reference to the underlying raw data (Float32Array)
 *   .quatTexture		- the active DataTexture object (DataTexture)
 *   .count				- current maximum number of figures the texture can hold (number)
 *   .isQuatTextureNode	- flag identifying this custom node (boolean)
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
	 * Commented because seams to be not needed. [PB]
	 */
	//	getUniformHash( /* builder */ ) {
	//
	//		return `QuatTexture-${this.value?.uuid || 'default'}`;
	//
	//	}



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

} // QuatTexNode



/**
 * Global shared instance used across the application
 */
var quatTextureNode = new QuatTextureNode( );



/**
 * Sets quaternion components of a joint of a figure (x, y, z, w).
 */
function setJointQuaternion( figure, joint, x, y, z, w ) {

	var base = ( QUATS_PER_BODY*figure+joint )*4,
		array = quatTextureNode.dataArray;

	array[ base++ ] = x;
	array[ base++ ] = y;
	array[ base++ ] = z;
	array[ base ] = w;

	quatTextureNode.quatTexture.needsUpdate = true;

}



/**
 * Increases texture capacity when more figures are added. The new texture
 * should support the quaternions of at least `count` figures.
 */
function setQuaternionCapacity( count ) {

	if ( count <= quatTextureNode.count ) return; // already sufficient

	// Calculate the new height of the data texture

	var doubleHeight = Math.min( 2*quatTextureNode.quatTexture.image.height, QUAT_TEXTURE_WIDTH );
	var preciseHeight = Math.ceil( count*QUATS_PER_BODY/QUAT_TEXTURE_WIDTH );
	var newHeight = Math.max( doubleHeight, preciseHeight );

	if ( newHeight > QUAT_TEXTURE_WIDTH )
		throw new Error( 'Too many figures — DataTexture limit exceeded' );

	// Create new larger array and copy existing data

	var newDataArray = new Float32Array( 4*newHeight*QUAT_TEXTURE_WIDTH );
	newDataArray.set( quatTextureNode.dataArray );

	// Create new data texture

	var newQuatTexture = new DataTexture(
		newDataArray,
		QUAT_TEXTURE_WIDTH,
		newHeight,
		RGBAFormat,
		FloatType
	);

	// Dispose old texture

	quatTextureNode.quatTexture.dispose();

	// Update internal references

	quatTextureNode.dataArray = newDataArray;
	quatTextureNode.quatTexture = newQuatTexture;
	quatTextureNode.value = newQuatTexture;

	quatTextureNode.count = Math.floor( newHeight * QUAT_TEXTURE_WIDTH / QUATS_PER_BODY );

	// Commented because seams to be not needed. [PB]

	/**
	// Increment version [AI]

	this.version = ( this.version || 0 ) + 1;

	// Force material update if we have a reference to it [AI]

	if ( this._material ) this._material.needsUpdate = true;
	*/

	console.log( `QUATTEX: resized → ${quatTextureNode.dataArray.length} floats (${quatTextureNode.count} figures)` );

}

/**
 * Disfigure TSL Rigging
 *
 * -----------------------------------------------------------------------------
 *
 * This module provides GPU-accelerated vertex deformation and normal
 * calculation for body rigging using TSL. It applies quaternion-based rotations
 * to different body parts (legs, arms, torso, hands) based on per-vertex
 * gradients and precomputed pivot points.
 *
 * The deformation is driven by:
 * - A texture `quatTextureNode` with per-figure and per-joint quaternion data
 * - Predefined pivot points `pivots` and gradient ranges `ranges`
 * - Custom gradient functions `gradient...()` for natural-looking joint bending
 *
 * The mat3 in this module is used purely as a container (not as a real matrix):
 *   - element(0) = position
 *   - element(1) = normal
 *   - element(2) = unused
 *
 * This allows applying the same quaternion rotation to both position and normal.
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * disfigurePosition - node to be attached to positionNode
 * disfigureNormal   - node to be attached to normalNode
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */




/**
 * Rotates a vector `p` by a quaternion `q` using the standard formula.
 */
var rotateByQuaternion = Fn( ([ p, q ])=>{

	// p' = p + 2 * q.xyz ✕ (q.xyz ✕ p + q.w * p)

	return p.add( q.xyz.cross( q.xyz.cross( p ).add( q.w.mul( p ) ) ).mul( 2 ) );

}, { return: 'vec3', p: 'vec3', q: 'vec4' } );



/**
 * Scales the rotation angle of a quaternion `quat` by factor `k`.
 * Used to partially apply rotations (0 < k < 1) for smooth blending.
 */
var scaleQuaternion = Fn( ([ quat, k ])=>{

	var q = vec4();
	var len = quat.xyz.length().toVar();

	If( len.lessThan( 1e-5 ), ()=>{

		q.assign( vec4( 0, 0, 0, 1 ) ); // near-zero quaternion → identity

	} ).Else( ()=>{

		// angle = k * acos(quat.w)
		// q = (quat.xyz/len * sin(k*angle), cos(k*angle))

		var angle = k.mul( quat.w.acos() ).toVar();
		q.assign( vec4( quat.xyz.div( len ).mul( angle.sin() ), angle.cos() ) );

	} );

	return q;

}, { return: 'vec4', quat: 'vec4', k: 'float' } );



/**
 * Applies partial `k`k quaternion rotation `quat` to the matrix container `mat`.
 *   - element(0) → position (rotated around `pivot`)
 *   - element(1) → normal   (rotated, no pivot)
 *   - element(2) → unused
 */
var disfigureMatrix = Fn( ([ mat, pivot, quat, k ])=>{

	var newMat = mat.toVar();

	// Only apply transformation if k > 0

	If( k.greaterThan( 0 ), () => {

		var q = quat.toVar();

		// Scale quaternion rotation when k < 1 (partial deformation)

		If( k.lessThan( 1 ), ()=>{

			q.assign( scaleQuaternion( q, k ) );

		} ); // k<1

		// Rotate position around pivot: p = pivot + rotate(p - pivot)

		newMat.element( 0 ).assign( rotateByQuaternion( mat.element( 0 ).sub( pivot ), q ).add( pivot ) );

		// Rotate normal (as direction vector) without pivot: n = rotate(n)

		newMat.element( 1 ).assign( rotateByQuaternion( mat.element( 1 ), q ) );

	} ); // k>0

	return newMat;

}, { return: 'mat3', mat: 'mat3', pivot: 'vec3', quat: 'vec4', k: 'float' } );



// ======================== GRADIENT FUNCTIONS ========================



/**
 * Horizontal gradient with vertical influence.
 * result = smoothstep( range.x, range.y, x + y * range.z )
 */
var gradientX = Fn( ([ pos, range ]) => {

	return pos.x.add( pos.y.mul( range.z ) ).smoothstep( range.x, range.y );

}, { pos: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Vertical gradient with depth influence.
 * result = smoothstep( range.x, range.y, y + z * range.z )
 */
var gradientY = Fn( ([ pos, range ]) => {

	return pos.y.add( pos.z.mul( range.z ) ).smoothstep( range.x, range.y );

}, { pos: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Tilted gradient used for thumb and specific joint transitions
 * result = smoothstep(range.z, range.w, z + x * slope)
 */
var gradientYT = Fn( ([ pos, range, slope ])=>{

	return pos.z.add( pos.x.mul( slope ) ).smoothstep( range.z, range.w );

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



/**
 * Complex gradient for area where legs attach to the torso
 */
var gradientLeg = Fn( ([ pos, range, range2 ])=>{

	var y = pos.y.sub( pos.x.abs().mul( 1/5 ) );

	var ofs = select( range2.x.equal( 1 ), pos.z.add( 0.05 ).abs().mul( 1/2 ), pos.z.mul( 1/6 ) );

	return pos.x.smoothstep( 0, range2.y )
		.mul( y.smoothstep( range.x.sub( ofs ), range.y ).smoothstep( 0, 1 ).pow( 2 ) )
		.add( pos.x.smoothstep( 0, range2.y.div( 10 ) ).mul( y.smoothstep( range.z, range.w ) ) )
		.clamp( 0, 1 );

}, { return: 'float', pos: 'vec3', range: 'vec4', range2: 'vec2' } );



/**
 * Complex gradient for area where arm attach to the torso
 */
var gradientArm = Fn( ([ pos, pivot, range ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, select( x.greaterThan( 0 ), 1, -1 ) );

	return x.add( dx ).smoothstep( range.x, range.y ).smoothstep( 0, 1 )
		.mul( y.step( range.z ).oneMinus() );

}, { pos: 'vec3', pivot: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Sharp gradient for fingers and thumbs
 */
var gradientXT = Fn( ([ pos, range, slope ])=>{

	return pos.x.add( pos.z.mul( slope ) )
		.smoothstep( range.x, range.y )
		.mul(
			//pos.z.smoothstep( range.z.sub( 0.0001 ), range.z.add( 0.0001 ) ),
			pos.z.step( range.z ),
			//pos.z.smoothstep( range.w.add( 0.0001 ), range.w.sub( 0.0001 ) )
			pos.z.step( range.w ).oneMinus(),
		);

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



// ======================== QUATERNION UTILITIES ========================



/**
 * Computes texture coordinates for quaternion data lookup for figure and joint.
 */
var getQuatAddr = Fn( ([ figureIndex, jointIndex ])=>{

	var offset = figureIndex.add( jointIndex ).toVar();
	return ivec2( offset.mod( QUAT_TEXTURE_WIDTH ), offset.div( QUAT_TEXTURE_WIDTH ) );

}, { return: 'ivec2', figureIndex: 'int', jointIndex: 'int' } );



/**
 * Helper to sample quaternion from texture for a given figure and joint
 */
var q = ( figureIndex, jointIndex )=> {

	return quatTextureNode.load( getQuatAddr( figureIndex, jointIndex ) );

};



// ======================== MAIN DISFIGURE FUNCTION ========================



/**
 * Internal count for number of generations of the main TSL function
 */
var disfigureVersion = 0;



/**
 * Main body disfigure/deformation function.
 * Deforms position and normal using per-joint quaternions and gradient masks.
 * Uses a mat3 container to hold and transform position + normal together.
 */
var disfigureBody = Fn( ( )=>{

	var p = positionGeometry,
		m = mat3( p, normalGeometry.normalize(), vec3( 0 ) ).toVar( ); // container

	var figureIndex = attribute( 'uids', 'int' ).mul( QUATS_PER_BODY ).toVar();

	// Figure type offset for pivots and ranges (52 pivots per gender, 4 extras)

	var gender = q( figureIndex, QUAT_DATA_INDEX ).x.mul( PURE_QUATS_PER_BODY ).toVar(); // 52 pivots
	var gender_ex = q( figureIndex, QUAT_DATA_INDEX ).x.mul( 4 ).toVar(); // 4 extras

	// Helper functions for different deformation types

	var disP = ( i, gradient ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradient ) ),
		disY = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientY( p, ranges.element( i.add( gender ) ) ) ) ),
		disX = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientX( p, ranges.element( i.add( gender ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientXT( p, ranges.element( i.add( gender ) ), 0 ) ) );

	// Side and region detection

	var isLeft = int( step( p.x, 0 ) ).toVar( ),
		isDown = p.y.lessThan( pivots.element( int( 2 ).add( gender ) ).y ), //below chest
		isHand = p.x.abs().greaterThan( pivots.element( int( 16 ).add( gender ) ).x ); // beyond wrist

	// Helper function to simulate ternary isLeft?left:right

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();


	If( isDown, ()=>{

		// ======================== LOWER BODY ========================

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh

		Loop( { start: start, end: end }, ( { i } ) => disY( i ) );

		// leg

		disP( end, gradientLeg( p, ranges.element( end.add( gender ) ), extras.element( leg.add( gender_ex ) ).xy ) );

	} ).Else( ()=>{

		If( isHand, ()=>{

			// ======================== HANDS ========================

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			// fingers: thumb

			disP( thumb, gradientXT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender_ex ) ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradientYT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender_ex ) ).y ) );

			let start = pick( 28, 40 ),
				end = start.add( 12 );

			// fingers: index middle ring pinky

			Loop( { start: start, end: end }, ( { i } ) => disT( i ) );

		} );

		// ======================== ARMS ========================

		let start = pick( 16, 20 ),
			end = start.add( 3 );

		// wrist forearm elbow

		Loop( { start: start, end: end }, ( { i } ) => disX( i ) );

		// arm

		disP( end, gradientArm( p, pivots.element( int( end ).add( gender ) ), ranges.element( end.add( gender ) ) ) );

	} );



	// ======================== TORSO ========================

	// head chest waist torso

	Loop( { end: int( 4 ) }, ( { i } ) => disY( i ) );

	// Final normal transformation to view space + normalization

	m.element( 1 ).assign( transformNormalToView( m.element( 1 ) ).normalize() );

	// Warm if this disfigure function was generated too many times

	++disfigureVersion;

	if ( disfigureVersion > 6 && Math.log2( disfigureVersion ) % 1 < 1E-10 )
		console.warn( `TSL compiled ${disfigureVersion} times` );

	return m;//.debug();

} )( );



/**
 * Execute the main rigging function and isolate the vertex and normal nodes
 */
var disfigurePosition = disfigureBody.element( 0 ); // position node
var disfigureNormal = disfigureBody.element( 1 ); // normal node

/**
 * Disfigure Instanced Pool of 3D Models
 *
 * -----------------------------------------------------------------------------
 *
 * Manages a pool of instanced 3D bodies (figures) using Three.js InstancedMesh.
 *
 * This module provides an efficient way to render a large number of similar
 * meshes with per-instance variations. Uses InstancedMesh for GPU-efficient
 * rendering, integrates custom TSL nodes for procedural rigging (by setting
 * `positionNode` and `normalNode` of `material`, supports dynamic allocation
 * of bodies from the pool.
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * scene	- default Three.js scene
 * Pool		- class for instances of figures of given type and number
 *
 *   .material	 - node material for all figures in the pool
 *   .count		 - current number of active figures
 *   .uidsArray  - array if unique IDs of figures - indices in the quat texture
 *   .uidsAttr	 - instance attribute of unique IDs (bound to `uidsArray`)
 *   .addToScene - to to indicate active from to-be-deleted pools
 *
 *   .onLoad()	 - callback method called after geometry is loaded
 *   .isFull()	 - returns whether the pull is full (no space for more figure)
 *	 .getBody	 - allocates an instance and returns its index
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */




/**
 * Default scene if the user does not use own scene.
 */
var scene = new Scene();



/**
 * A class representing a pool of instanced meshes with custom TSL materials.
 *
 * The pool pre-allocates a fixed number of instances (`count`) for performance.
 * Each instance has an attribute UID pointing to a data texture of quaternions.
 *
 * A pool may contain only one type of figure instances - Man, Woman or Child.
 */
class Pool extends InstancedMesh {

	/**
	 * Creates a new Pool instanced mesh with URL to geometry *.glb file and
	 * total capacity of instances this pool can hold.
     */
	constructor( url, count ) {

		// Create material with TSL nodes (will be configured after geometry loads)

		var material = new MeshStandardNodeMaterial( );

		// Initialize empty InstancedMesh

		super( null, material, count );

		this.count = 0; // Current number of active instances

		this.castShadow = true;
		this.receiveShadow = true;
		this.frustumCulled = false;

		// Array to store global unique IDs (UIDs) for each instance.
		// It will become instance attribute once the geometry is ready.

		this.uidsArray = new Int32Array( count );

		// Whether to automatically add this pool to the shared scene after
		// loading. If the pool is resized before the first render, this property
		// is set to false and the pool is not included in the scene. A copy of
		// its instances are in the resized pool and it is included in the scene.

		this.addToScene = true;

		console.log( `Pool: created with capacity ${count} instances` );

		// Asynchronously load the geometry, the skeleton data, hook
		// shaders to material nodes and add the instance to the scene

		loadGLTF( url+'.glb' ).then( ( geometry )=>{

			this.geometry = geometry;

			// Add per-instance UID attribute for each instance

			this.geometry.setAttribute( 'uids', new InstancedBufferAttribute( this.uidsArray, 1 ) );
			this.uidsAttr = this.geometry.getAttribute( 'uids' );
			this.uidsAttr.needsUpdate = true;

			// Hook custom TSL deformation nodes

			material.positionNode = disfigurePosition;
			material.normalNode = disfigureNormal;

			// Optional: force normal calculation in vertex stage.
			// Reduces computational load at the cost of lower lighting quality.

			if ( !config.smooth )
				material.normalNode = vertexStage( material.normalNode );

			material.needsUpdate = true;

			// Add to scene if enabled

			if ( this.addToScene ) {

				this.onLoad();
				scene.add( this );

			}

		} ); // loadGLTF

	} // constructor



	/**
     * Callback function called after the GLTF model has been successfully loaded.
     * Override this method in subclasses to run custom initialization logic.
     */
	onLoad() {

		// To be overridden by subclasses if needed

	}



	/**
     * Checks if the pool has reached its maximum capacity.
     */
	isFull( ) {

		return ( this.count >= this.instanceMatrix.count );

	}



	/**
     * Allocates and returns the index of a new body from the pool.
     */
	 getBody( ) {

		if ( this.isFull() ) {

			throw new Error( 'Too many figures (instance pool is full)' );

		}

		return this.count++;

	}



	/**
     * Copies all instance data (matrices and UIDs) from another Pool into this one.
     */
	copy( sourcePool ) {

		// Copy matrices
		this.instanceMatrix.array.set( sourcePool.instanceMatrix.array );
		this.instanceMatrix.needsUpdate = true;

		// Copy UIDs
		this.uidsArray.set( sourcePool.uidsArray );
		this.geometry.getAttribute( 'uids' ).needsUpdate = true;

	}

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

	constructor( pool, bodyTypeIndex, scale ) {

		super();

		this.pool = pool;
		this.pid = pool.getBody(); // instance index within the pool
		this.uid = uid++; // global body index
		this.material = this.pool.material; // expose to outside
		this.scale.setScalar( scale );

		setQuaternionCapacity( Math.max( uid+1, config.men+config.women+config.children, config.population ) );
		setJointQuaternion( this.uid, QUAT_DATA_INDEX, bodyTypeIndex, 0, 0, 0 );

		this.quaternionOffset = bodyTypeIndex*PURE_QUATS_PER_BODY;

		pool.uidsArray[ this.pid ] = this.uid;

		this.eulers = [];

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			this.eulers.push( new EulerDegrees( this, i, JOINTS[ i ].parentIndex, JOINTS[ i ].signs ) );

			this[ JOINTS[ i ].name ] = this.eulers[ i ];

		}

		everybody.push( this );

	}

	update( ) {

		this.updateMatrix();
		this.pool.setMatrixAt( this.pid, this.matrix );
		this.pool.instanceMatrix.needsUpdate = true;

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

			setJointQuaternion( this.uid, i, ...this.eulers[ i ].q );

		} // for i

	} // Body.update

	updateAttached( ) {

		if ( !pivots ) return;

		var offset = this.quaternionOffset;

		for ( var i=0; i<PURE_QUATS_PER_BODY; i++ ) {

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


var pools = { man: null, woman: null, child: null };

function preparePool( name, initialCount ) {

	if ( pools[ name ] == null ) {

		pools[ name ] = new Pool( name, initialCount );

	}

	if ( pools[ name ].isFull() ) {


		// get a larger pool

		var oldPool = pools[ name ];
		var newPool = new Pool( name, 2*oldPool.count );
		oldPool.addToScene = false;
		oldPool.removeFromParent();
		for ( var body of everybody ) {

			if ( body.pool == oldPool ) body.pool = newPool;

		}

		if ( oldPool.children.length>0 )
			newPool.add( ...oldPool.children ); // move attached objects

		console.log( name+':: pool is full, size', oldPool.uidsArray.length, '->', newPool.uidsArray.length );

		newPool.count = oldPool.count; // revert to old count, because only that number of figures exist
		newPool.instanceMatrix.array.set( oldPool.instanceMatrix.array );
		newPool.uidsArray.set( oldPool.uidsArray );

		pools[ name ] = newPool;

	}

}

class Man extends Body {

	static count = 2; // max number of men

	constructor( height = 1.80 ) {

		preparePool( 'man', config.men );

		super( pools.man, 0, height/1.795 ); // 1.795 is 3D model height

		this.l_arm.z = this.r_arm.z = -75;
		this.l_elbow.y = this.r_elbow.y = 20;
		this.l_leg.z = this.r_leg.z = 10;
		this.l_ankle.z = this.r_ankle.z = -10;
		this.l_ankle.x = this.r_ankle.x = 3;

		this.position.y = -0.012;

	}

} // Man



class Woman extends Body {

	static count = 2; // max number of women

	constructor( height = 1.70 ) {

		preparePool( 'woman', config.women );

		super( pools.woman, 1, height/1.691 ); // 1.691 is 3D model height

		this.l_arm.z = this.r_arm.z = -90;
		this.l_elbow.y = this.r_elbow.y = 0;
		this.l_leg.z = this.r_leg.z = -3;
		this.l_ankle.z = this.r_ankle.z = 3;
		this.l_ankle.x = this.r_ankle.x = 3;

	}

} // Woman



class Child extends Body {

	static count = 2; // max number of children

	constructor( height = 1.35 ) {

		preparePool( 'child', config.children );

		super( pools.child, 2, height/1.352 ); // 1.352 is 3D model height

		this.l_arm.x = this.r_arm.x = -10;
		this.l_arm.z = this.r_arm.z = -80;
		this.l_ankle.bend = this.r_ankle.bend = 3;

		this.position.y = -8e-3;

	}

} // Child

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

/**
 * Disfigure Main Entry Point
 *
 * A lightweight library for TSL quaternion-based humanoid character rigging.
 *
 * This file serves as the public API and "software burrito" — it wraps
 * all internal modules and exposes only the intended public interface.
 *
 * @see https://boytchev.github.io/disfigure/
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * chaotic()	- Calculates a smoothly varying organic value
 * regular()	- Calculates a smoothly oscillating sine value
 * random()		- Calculates a uniform random value
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */




/**
 * Not-fancy banner - just name and link
 */
console.log(
	'\nDisfigure\n%chttps://boytchev.github.io/disfigure/\n',
	'font-size:80%'
);



var simplex = new SimplexNoise( );



/**
 * Calculates a smoothly varying pseudo-random value using Simplex 2D noise.
 * Used for organic, chaotic motion suitable for breathing, idle animations, etc.
 *
 * The noise represents an imaginary terrain. This function gets the altitude
 * at position [`x`,`y`]. The result is in [`min`,`max`].
 */
function chaotic( x, y, min, max ) {

	return min + ( max-min )*( simplex.noise( x, y )+1 )/2;

}



/**
 * Calculates a smoothly oscillating value using sine function.
 * Used for predictable, repeating motion like walking cycle.
 *
 * The sine represents an imaginary wave. This function gets the altitude
 * at position [`x`]. The result is in [`min`,`max`].
 */
function regular( x, min, max ) {

	return min + ( max-min )*( Math.sin( x )+1 )/2;

}



/**
 * Calculates a simple uniform random value (non-deterministic).
 * Useful for one-time randomization or initial setup.
 *
 * The result is in [`min`,`max`].
 */
function random( min, max ) {

	return min + ( max-min )*Math.random( );

}

export { Child, Man, Woman, World, camera, cameraLight, chaotic, controls, disfigureBody, disfigureMatrix, disfigureNormal, disfigurePosition, everybody, gradientArm, gradientLeg, gradientX, gradientXT, gradientY, gradientYT, ground, light, pools, random, regular, renderer, scene, setAnimationLoop };
