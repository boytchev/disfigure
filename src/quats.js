// disfigure quats.js

import { DataTexture, FloatType, RGBAFormat, TextureNode } from 'three';
import { EQ } from './assets.js';





const TEXTURE_WIDTH = 2048;


/**
 * A custom version of TextureNode that eliminates TSL code for `flipY` and
 * all UV transformations, including multiplication with UV matrix. I didn't
 * find a better way to do this. Sorry.
 *
 * @augments TextureNode
 */


class QuatTextureNode extends TextureNode {

	constructor( texture = null ) { // <-- allow passing texture

		const INITIAL_HEIGHT = 1;

		if ( !texture ) {

			// fallback for manual creation
			const dataArray = new Float32Array( 4 * INITIAL_HEIGHT * TEXTURE_WIDTH );
			texture = new DataTexture( dataArray, TEXTURE_WIDTH, INITIAL_HEIGHT, RGBAFormat, FloatType );

		}

		super( texture );

		this.isQuatTextureNode = true;
		this.dataArray = texture.image.data; // better
		this.quatTexture = texture;
		this.count = Math.floor( texture.image.height * texture.image.width / EQ );

	}

	updateTexture( newTexture ) {

		this.value = newTexture;
		this.quatTexture = newTexture;
		this.dataArray = newTexture.image.data;

		// Optional: force all existing clones to update (aggressive but safe)
		this.version = ( this.version || 0 ) + 1; // can help TSL notice change

	}


	// === THIS IS THE MOST IMPORTANT PART ===
	clone() {

		const cloned = new this.constructor( this.value ); // share the SAME texture
		cloned.uvNode = this.uvNode;
		cloned.levelNode = this.levelNode;
		cloned.sampler = this.sampler;
		return cloned;

	}

	getUniformHash( /* builder */ ) {

		return `QuatTexture-${this.value?.uuid || 'default'}`;

	}


	// increases the texture to fit at least count elements
	setCapacity( count ) {

		if ( count <= this.count ) return; // already big enough

		// makes sure the texture hold data for count figures
		var doubleHeight = Math.min( 2*this.quatTexture.image.height, TEXTURE_WIDTH ),
			preciseHeight = Math.ceil( count*EQ/TEXTURE_WIDTH );

		var newHeight = Math.max( doubleHeight, preciseHeight );
		if ( newHeight > TEXTURE_WIDTH )
			throw "Too many figures (data texture)";

		// create new data array, forget the old, let GC deal with it
		var newDataArray = new Float32Array( 4*newHeight*TEXTURE_WIDTH );
		// === CRITICAL: Copy old data ===
		newDataArray.set( this.dataArray ); // copies old data to the beginning of new array

		// create new data texture, dispose the old one
		var newQuatTexture = new DataTexture(
			newDataArray,
			TEXTURE_WIDTH, // width
			newHeight, // height
			RGBAFormat,
			FloatType
		);


		this.dataArray = newDataArray;
		this.quatTexture = newQuatTexture;
		// update the texture node to be linked with the new texture
		this.value = this.quatTexture;

		this.quatTexture.dispose();
		// recalculate the new possible count of figures
		//		this.count = Math.floor(height*TEXTURE_WIDTH/EQ);
		this.count = Math.floor( newQuatTexture.image.height * newQuatTexture.image.width / EQ );


		// Tell TSL the texture changed
		this.updateTexture( newQuatTexture );
		console.log( 'QUATTEX: new size', this.dataArray.length, 'for', this.count, 'figures' );
		// === CRITICAL: Force material rebuild ===
		if ( this._material ) {

			this._material.needsUpdate = true;
			// Stronger option if needed:
			// this._material.dispose(); // then re-assign the full node graph

		}

	} // QuatTexNode.setCapacity



	// prevents TSL from generating flipY and texture transform code for WebGL2
	getTransformedUV( uvNode ) {

		return uvNode;

	} // QuatTexNode.getTransformedUV



	// prevents TSL from generating flipY and texture transform code for WebGL2
	setupUV( builder, uvNode ) {

		return uvNode;

	} // QuatTexNode.setupUV



	setQ( figure, joint, vec4 ) {

		vec4.toArray( this.dataArray, ( EQ*figure+joint )*4 );

	} // QuatTexNode.setQ



	setXYZ( figure, joint, x, y, z, w=1 ) {

		var base = ( EQ*figure+joint )*4;
		this.dataArray[ base++ ] = x;
		this.dataArray[ base++ ] = y;
		this.dataArray[ base++ ] = z;
		this.dataArray[ base++ ] = w;

	} // QuatTexNode.setXYZ


} // QuatTexNode


var quatTextureNode = new QuatTextureNode( );



export { quatTextureNode, TEXTURE_WIDTH };
