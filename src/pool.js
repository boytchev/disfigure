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



import { vertexStage } from 'three/tsl';
import { InstancedBufferAttribute, InstancedMesh, MeshStandardNodeMaterial, Scene } from 'three';
import { disfigureNormal, disfigurePosition } from './tsl.js';
import { config, loadGLTF } from './assets.js';



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

		console.log( `Alloc ${url.toUpperCase()}[${count}]` );

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



export { Pool, scene };
