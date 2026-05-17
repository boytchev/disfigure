
import { vertexStage } from 'three/tsl';
import { InstancedBufferAttribute, InstancedMesh, MeshStandardNodeMaterial } from 'three';
import { disfigureBody } from './tsl.js';
import { loadGLTF } from './assets.js';
import { scene } from './world.js';





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


export { Pool };
