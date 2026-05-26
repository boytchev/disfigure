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
 *
 * QuatTextureNode		- class for data texture node for quaternions or vec4
 *   .set( )					- sets quaternion of a joint of a figure
 *   .setQuaternionCapacity( )	- sets the capacity of the quaternion texture
 *   .get( )					- gets quaternion from texture
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for proper texture resizing logic,
 * cloning behavior in TSL TextureNode, and fine-tuning code comments.
 */



import { DataTexture, FloatType, RGBAFormat, TextureNode } from 'three';
import { Fn, ivec2 } from 'three/tsl';



/**
 * Data texture width - 2048 is well supported across systems
 */
const QUAT_TEXTURE_WIDTH = 2048;



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

	constructor( texture, quatsPerBody ) {

		// Create an empty texture (and allock data array) if no texture provided

		if ( !texture ) {

			texture = new DataTexture( new Float32Array( 0 ), 0, 0, RGBAFormat, FloatType );

		}

		super( texture );

		this.isQuatTextureNode = true;

		this.dataArray = texture.image.data;
		this.quatTexture = texture;

		this.quatsPerBody = quatsPerBody;

		this.count = 0;

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
	 * Sets quaternion components of a joint of a figure (x, y, z, w).
	 */
	set( figure, joint, x, y, z, w ) {

		var base = ( this.quatsPerBody*figure+joint )*4,
			array = this.dataArray;

		array[ base++ ] = x;
		array[ base++ ] = y;
		array[ base++ ] = z;
		array[ base ] = w;

		this.quatTexture.needsUpdate = true;

	}


	/**
	 * Helper to sample quaternion from texture for a given figure and joint
	 */
	get( figureIndex, jointIndex ) {

		var getQuatAddr = Fn( ([ offset ])=>{

			return ivec2( offset.mod( QUAT_TEXTURE_WIDTH ), offset.div( QUAT_TEXTURE_WIDTH ) );

		}, { return: 'ivec2', offset: 'int' } );

		return this.load( getQuatAddr( figureIndex.mul( this.quatsPerBody ).add( jointIndex ) ) );

	}



	/**
	 * Increases texture capacity when more figures are added. The new texture
	 * should support the quaternions of at least `count` figures.
	 */
	setQuaternionCapacity( count ) {

		if ( count <= this.count ) return; // already sufficient

		// Calculate the new height of the data texture

		var doubleHeight = Math.min( 2*this.quatTexture.image.height, QUAT_TEXTURE_WIDTH );
		var preciseHeight = Math.ceil( count*this.quatsPerBody/QUAT_TEXTURE_WIDTH );
		var newHeight = Math.max( doubleHeight, preciseHeight );

		if ( newHeight > QUAT_TEXTURE_WIDTH )
			throw new Error( 'Too many figures — DataTexture limit exceeded' );

		// Create new larger array and copy existing data

		var newDataArray = new Float32Array( 4*newHeight*QUAT_TEXTURE_WIDTH );
		newDataArray.set( this.dataArray );

		// Create new data texture

		var newQuatTexture = new DataTexture(
			newDataArray,
			QUAT_TEXTURE_WIDTH,
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

		this.count = Math.floor( newHeight * QUAT_TEXTURE_WIDTH / this.quatsPerBody );

		console.log( `Alloc ALL[${this.count}] ${Math.round( this.dataArray.length*4/1024 )} kB` );

	}



	/**
	 * Critical: shares the same underlying texture for all figures [AI]
	 * Commented because seеms to be not needed. [PB]
	 */
	//clone() {
	//
	//	var cloned = new this.constructor( this.value ); // same texture
	//
	//	cloned.uvNode = this.uvNode;
	//	cloned.levelNode = this.levelNode;
	//	cloned.sampler = this.sampler;
	//
	//	return cloned;
	//
	//}



	/**
	 * Custom uniform hash to help Three.js/TSL caching. [AI]
	 * Commented because seеms to be not needed. [PB]
	 */
	//	getUniformHash( /* builder */ ) {
	//
	//		return `QuatTexture-${this.value?.uuid || 'default'}`;
	//
	//	}

} // QuatTexNode



export { QuatTextureNode };
