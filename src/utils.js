
// disfigure
//
// a collections
//
// module with various utility functions:
//
// * processing models
// * generating matrices



import { Box3, Group, Mesh, MeshPhysicalNodeMaterial, Vector3 } from 'three';
import { Fn, mat3, vec3 } from 'three/tsl';
//import { Space } from './space.js';
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";





// generate X-rotation matrix
const matRotX = Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

} ).setLayout( {
	name: 'matRotX',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Y-rotation matrix
const matRotY = Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

} ).setLayout( {
	name: 'matRotY',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Z-rotation matrix
const matRotZ = Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

} ).setLayout( {
	name: 'matRotZ',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate YXZ rotation matrix
const matRotYXZ = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

} ).setLayout( {
	name: 'matRotYXZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate YZX rotation matrix
const matRotYZX = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

} ).setLayout( {
	name: 'matRotYZX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XYZ rotation matrix
const matRotXYZ = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

} ).setLayout( {
	name: 'matRotXYZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XZY rotation matrix
const matRotXZY = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

} ).setLayout( {
	name: 'matRotXZY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZXY rotation matrix
const matRotZXY = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

} ).setLayout( {
	name: 'matRotZXY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZYX rotation matrix
const matRotZYX = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

} ).setLayout( {
	name: 'matRotZYX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );




/*
// generate scaling matrix
const matScale = Fn( ([ scales ])=>{

	return mat3(
		scales.x, 0, 0,
		0, scales.y, 0,
		0, 0, scales.z,
	);

} ).setLayout( {
	name: 'matScale',
	type: 'mat3',
	inputs: [
		{ name: 'scales', type: 'vec3' },
	]
} );
*/



// center model
function centerModel( model, dims ) {

	var center = new Vector3();

	var box = new Box3().setFromObject( model, true );

	box.getCenter( center );
	model.position.sub( center );

	dims.x = ( box.max.x + box.min.x )/2;
	dims.y = box.min.y;
	dims.z = ( box.max.z + box.min.z )/2;

	dims.scale = Math.max( box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z );

}



// merge a mesh into its parent, taking into consideration
// positions, orientations and scale. flattening occurs only
// for elements with a single child mesh
function flattenModel( model, rotate ) {

	var meshes = [];

	// extract meshes
	model.traverse( ( mesh )=>{

		if ( mesh.isMesh ) {

			var geo = mesh.geometry.clone().applyMatrix4( mesh.matrixWorld );
			var mat = mesh.material.clone();

			if ( rotate[ 0 ]) geo.rotateX( rotate[ 0 ]);
			if ( rotate[ 1 ]) geo.rotateY( rotate[ 1 ]);
			if ( rotate[ 2 ]) geo.rotateZ( rotate[ 2 ]);

			if ( mesh.isSkinnedMesh ) {

				mesh.pose();

				var pos = geo.getAttribute( 'position' );
				var nor = geo.getAttribute( 'normal' );
				var v = new Vector3();

				for ( var i=0; i<pos.count; i++ ) {

					v.fromBufferAttribute( pos, i );
					mesh.applyBoneTransform( i, v );
					pos.setXYZ( i, ...v );

					v.fromBufferAttribute( nor, i );
					mesh.applyBoneTransform( i, v );
					nor.setXYZ( i, ...v );

				}

			}

			var newMesh = new Mesh( geo, mat );
			newMesh.frustumCulled = false;


			meshes.push( newMesh );

		}

	} );

	// clear model
	/*
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );

	// add meshes
	model.add( ...meshes );
	*/

	var newModel = new Group();
	newModel.add( ...meshes );
	return newModel;

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission
function ennodeModel( model, space, posture, nodes, options ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			//var material = new MeshStandardNodeMaterial();
			var material = new MeshPhysicalNodeMaterial();

			// copy all properties from the original material
			Object.assign( material, child.material );

			// copy all properties from the options
			Object.assign( material, options );

			// bind nodes
			if ( nodes.colorNode )
				material.colorNode = nodes.colorNode( );

			if ( nodes.positionNode )
				material.positionNode = nodes.positionNode( { space: space, posture: posture } );

			if ( nodes.normalNode )
				material.normalNode = nodes.normalNode( { space: space, posture: posture } );

			if ( nodes.emissiveNode )
				material.emissiveNode = nodes.emissiveNode( { space: space, posture: posture } );

			child.material = material;
			child.castShadow = true;
			child.receiveShadow = true;

		}

	} );

}


/*
// prepared a model for TSL rigging
function processModel( model, space, posture, nodes, options={} ) {

	var dims = {};

	model = flattenModel( model, space?._?.rot ?? [ 0, 0, 0 ]);

	centerModel( model, dims );

	space = new Space( dims, space );

	ennodeModel( model, space, posture, nodes, options );

	return { model: model, dims: dims, space: space };

}
*/





// generate oversmooth function
const smoother = Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

} ).setLayout( {
	name: 'smoother',
	type: 'float',
	inputs: [
		{ name: 'edgeFrom', type: 'float' },
		{ name: 'edgeTo', type: 'float' },
		{ name: 'value', type: 'float' },
	]
} );



var tslWhiteNode = Fn( ()=>{

	return vec3( 1 );

} );


var simplex = new SimplexNoise( );

function chaotic( x, y=0, min=-1, max=1 ) {

	return min + ( simplex.noise( x, y )+1 )/( max-min );

}

function regular( x, y=0 ) {

	return Math.sin( x+y );

}


export
{
	matRotXZY,
	matRotXYZ,
	matRotYXZ,
	matRotYZX,
	matRotZXY,
	matRotZYX,

	flattenModel,
	centerModel,
	ennodeModel,
	tslWhiteNode,

	/*processModel,*/
	smoother,
	chaotic,
	regular,
};
