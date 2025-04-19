
// disfigure
//
// module to process loaded GLB models



import { Mesh, Box3, MeshStandardNodeMaterial, Vector3 } from "three";
import { tslColorNode, tslEmissiveNode, tslPositionNode } from "./disfigure.js";



// center model
function centerModel( model ) {

	var center = new Vector3();

	new Box3().setFromObject( model, true ).getCenter( center );
	model.position.sub( center );

}



// remove all parts that do not lead to geometries
// (skeleton info, lights, cameras, ...)
// keep only geometries and their parents

function clearModel( model ) {

	for ( var i=model.children.length-1; i>=0; i-- ) {

		var child = model.children[ i ];

		clearModel( child );

		if ( !child.isMesh && !child.children?.length )
			model.remove( child );

	}

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission

function ennodeModel( model, posture ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			var material = new MeshStandardNodeMaterial();

			// copy all properties from the original material
			Object.assign( material, child.material );

			material.metalness = 0;
			material.roughness = 1;

			material.colorNode = tslColorNode( );
			material.positionNode = tslPositionNode( posture );
			material.emissiveNode = tslEmissiveNode( posture );

			child.material = material;

		}

	} );

}



// merge a mesh into its parent, taking into consideration
// positions, orientations and scale. flattening occurs only
// for elements with a single child mesh
function flattenModel( model ) {

	var meshes = [];

	// extract meshes
	model.traverse( ( mesh )=>{

		if ( mesh.isMesh ) {

			var geo = mesh.geometry.clone().applyMatrix4( mesh.matrixWorld );
			var mat = mesh.material.clone();

			meshes.push( new Mesh( geo, mat ) );
		}

	} );
	
	// clear model
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );
	
	// add meshes
	model.add( ...meshes );

	
/*
	model.traverse( ( parent )=>{

		if ( parent.children.length > 0 ) {

			for ( var child of parent.children ) {

				child.matrix.premultiply( parent.matrix );
				child.matrixAutoUpdate = false;

			}

			parent.matrix.identity();
			parent.position.set( 0, 0, 0 );
			parent.scale.set( 1, 1, 1 );
			parent.rotation.set( 0, 0, 0, 'XYZ' );

		}

	} );
*/

}



function processModel( model, posture ) {

//	clearModel( model );

	flattenModel( model );
	// console.log( '-------' );
	// model.traverse( ( child )=>{

		// if ( child.isObject3D ) {

			// console.log( child.matrix.elements );

		// }

	// } );
	ennodeModel( model, posture );
	centerModel( model );
	
console.log(model);

	return model;

}



export { processModel };
