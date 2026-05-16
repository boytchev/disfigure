
// disfigure assets loaders
//
// provides functions to handle loading of 3D models and their metadata
//
// JOINT						→ names and rotation direction of joints
// loadGLTF(url, lowpoly = 0)	→ loads and optionally simplifies a GLB model
// loadJSON(url)				→ loads JSON skeleton description



import { Vector3, Vector4 } from 'three';
import { uniformArray } from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';



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



export { JOINTS, loadGLTF, loadJSON, pivots, ranges, extras };
