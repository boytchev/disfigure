
// disfigure
//
// A collection of utility functions for matrix generation, 3D model processing
// and number generation.



import { Box3, Group, Mesh, MeshPhysicalNodeMaterial, Vector3 } from 'three';
import { Fn, mat3, vec3 } from 'three/tsl';
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";



// generate X-rotation matrix
const matRotX = Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

}, { angle: 'float', return: 'mat3' } );



// generate Y-rotation matrix
const matRotY = Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

}, { angle: 'float', return: 'mat3' } );



// generate Z-rotation matrix
const matRotZ = Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

}, { angle: 'float', return: 'mat3' } );



// generate YXZ rotation matrix
const matRotYXZ = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

}, { angles: 'vec3', return: 'mat3' } );



// generate YZX rotation matrix
const matRotYZX = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

}, { angles: 'vec3', return: 'mat3' } );



// generate XYZ rotation matrix
const matRotXYZ = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

}, { angles: 'vec3', return: 'mat3' } );



// generate XZY rotation matrix
const matRotXZY = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

}, { angles: 'vec3', return: 'mat3' } );



// generate ZXY rotation matrix
const matRotZXY = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

}, { angles: 'vec3', return: 'mat3' } );



// generate ZYX rotation matrix
const matRotZYX = Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

}, { angles: 'vec3', return: 'mat3' } );



// center model and get it dimensions
function centerModel( model, dims ) {

	var center = new Vector3();

	var box = new Box3().setFromObject( model, true );

	box.getCenter( center );
	model.position.sub( center );

	dims.x = ( box.max.x + box.min.x )/2;
	dims.y = box.min.y;
	dims.z = ( box.max.z + box.min.z )/2;

	dims.scale = Math.max( box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z );

	dims.height = box.max.y - box.min.y;

}



// merge a mesh into its parent, taking into consideration positions, orientations
// and scale. flattening occurs only for elements with a single child mesh
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

			/* the current models have no skinning
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

			} // isSkinnedMesh
			*/

			var newMesh = new Mesh( geo, mat );
			newMesh.frustumCulled = false;

			meshes.push( newMesh );

		}

	} );

	var newModel = new Group();
	newModel.add( ...meshes );

	return newModel;

}



// convert all model materials to Node materials, attach TSL functions for
// vertices, colors and emission
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



// generate oversmooth function
const smoother = Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edgeFrom: 'float', edgeTo: 'float', value: 'float', return: 'float' } );



var tslWhiteNode = Fn( ()=>{

	return vec3( 1 );

} );



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



export
{
	matRotXZY,
	matRotXYZ,
	matRotYXZ,
	matRotYZX,
	matRotZXY,
	matRotZYX,

	smoother,

	tslWhiteNode,

	flattenModel,
	centerModel,
	ennodeModel,

	chaotic,
	regular,
};
