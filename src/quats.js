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



import { DataTexture, FloatType, RGBAFormat, TextureNode } from 'three';



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




export { quatTextureNode, setJointQuaternion, setQuaternionCapacity, QUAT_TEXTURE_WIDTH, QUATS_PER_BODY, QUAT_DATA_INDEX, PURE_QUATS_PER_BODY };
