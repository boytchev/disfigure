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



import { Vector3, Vector4 } from 'three';
import { uniformArray } from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';



/**
 * Global configuration
 */
var config = {
	men: 3,			// amount of preallocatd space for Man instances
	women: 3,		// amount of preallocatd space for Woman instances
	children: 3,	// amount of preallocatd space for Child instances
	population: 9,	// amount of preallocatd space for quad texture used for rigging
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



export { JOINTS, loadGLTF, pivots, ranges, extras, config, everybody };
