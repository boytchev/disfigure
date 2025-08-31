
// disfigure
//
// module for interactive posture
//
// horrible code, do not look at it


import * as THREE from "three";
import { float, Fn, If, select, vec3 } from "three/tsl";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { camera, controls, renderer, scene } from "../src/world.js";


const DEBUG_SHOW_BODY_GRIPS = false;

var model;
var moveMode = false;
var moveModel = false;


// prepare materials

var princeRupertsDrop = new THREE.MeshPhysicalMaterial( {
	color: new THREE.Color( 2, 2, 2 ),
	wireframe: !true,
	transmission: 1,
	roughness: 0,
	metalness: 0.2,
	ior: 2,
	thickness: 0.2,
} );

var vantaBlack = new THREE.MeshBasicMaterial( {
	color: new THREE.Color( 'black' ),
} );



// create 3D cross handle

var gltf = await ( new GLTFLoader() ).loadAsync( 'handle.glb' ),
	geometry = gltf.scene.children[ 0 ].geometry.scale( 0.05, 0.05, 0.05 );

var handle = new THREE.Mesh(
	geometry,
	//princeRupertsDrop,
	vantaBlack,
);
handle.castShadow = true;
handle.visible = false;

var handle2 = new THREE.Mesh(
	geometry,
	princeRupertsDrop.clone(),
	//vantaBlack.clone(),
);
handle2.material.transparent = true;
handle2.material.opacity = 0.3;
handle2.castShadow = false;
handle2.material.depthTest = false;
//handle2.visible = false;
handle.add( handle2 );



// spheres to collect mouse clicks on grips - the endpoint of the handle

var gripGeometry = new THREE.IcosahedronGeometry( 0.08*0.6 ),
	gripMaterial = new THREE.MeshBasicMaterial( { color: 'black', wireframe: true } ),
	gripCoords = [[ 0.50, 0, 0 ], [ -0.50, 0, 0 ], [ 0, 0.50, 0 ], [ 0, -0.50, 0 ], [ 0, 0, 0.50 ], [ 0, 0, -0.50 ]],
	allGrips = [];

for ( var coords of gripCoords ) {

	gripMaterial = new THREE.MeshBasicMaterial( { color: new THREE.Color( coords[ 0 ]+0.5, coords[ 1 ]+0.5, coords[ 2 ]+0.5 ) } );

	var grip = new THREE.Mesh( gripGeometry, gripMaterial );
	grip.position.set( ...coords );
	grip.isHandleGrip = true;
	grip.visible = !false;
	grip.isBodyGrip = false;
	allGrips.push( grip );
	handle.add( grip );


}


// interceptor -- a lens-like invisible camera-facing structure
// used to track mouse moves when they are away from the handle

function interceptorGeometry( ) {

	var r, points, b, alpha, shape;

	r = 0.5;
	alpha = Math.asin( 2/3 );
	b = 0.1;
	let s5 = r*Math.sqrt( 5 );

	shape = new THREE.Shape();

	// a bit of math to make a double-sided UFO-like structure,
	// sorry, if you read this and get no idea what's going on

	shape.moveTo( 0, r );
	shape.absarc( 0, 0, r, Math.PI/2, alpha, !false );
	shape.absarc( s5, 2*r, 2*r, Math.PI+alpha, 3*Math.PI/2-b, !true );
	shape.lineTo( s5-( 2*r*Math.sin( b ) ), 2*r-2*r*Math.cos( b ) );
	shape.lineTo( /*1*/5*r, 2*r-2*r*Math.cos( b ) );

	shape.lineTo( /*1*/5*r, -( 2*r-2*r*Math.cos( b ) ) );
	shape.lineTo( s5-( 2*r*Math.sin( b ) ), -( 2*r-2*r*Math.cos( b ) ) );
	shape.absarc( s5, -2*r, 2*r, -( 3*Math.PI/2-b ), -( Math.PI+alpha ), !true );
	shape.absarc( 0, 0, r, -alpha, -Math.PI/2, !false );
	shape.lineTo( 0, -r );

	points = shape.getPoints( 3 );
	return new THREE.LatheGeometry( points, 32 ).rotateX( Math.PI/2 );

} // interceptorGeometry

var interceptor = new THREE.Mesh(
	interceptorGeometry(),
	new THREE.MeshPhysicalMaterial( { side: THREE.DoubleSide } ) // must be double sided for the raycaster
);
interceptor.visible = false;

var interceptorIndex = 0; // 0=front, 1=back



// the body grips - cylinders over body parts to capture
// mouse clicks when selecting body parts






// custom lookAt that uses own's Y axis as up direction

var up = new THREE.Vector4();

function lookAt( object, target ) {

	up.set( 0, 1, 0, 0 );
	up.applyMatrix4( object.matrixWorld );
	object.up.set( up.x, up.y, up.z );

	object.lookAt( target );

} // lookAt



// capture mouse clicks on the grips

var raycaster = new THREE.Raycaster(),
	pointer = new THREE.Vector2( ),
	//oldClientX,
	oldClientY;



// initialize all elements, needs a model and scene to be ready,
// so initialization is triggered by gui.js, which loads the model

function initScene( ) {

	// attach 3D objects to the scene
	scene.add( interceptor, handle, startPositionGlobal, endPositionGlobal );

	// hooks pointer events
	renderer.domElement.addEventListener( 'pointerdown', pointerDown );
	renderer.domElement.addEventListener( 'pointerup', pointerUp );
	renderer.domElement.addEventListener( 'pointermove', pointerMove );

}


function useModel( newModel ) {

	model = newModel;

}

function initModel( readyModel, gripDef ) {

	// store a local copy of the model and fix its material
	model = readyModel;
	model.material.colorNode = tslSelectionNodeNew( { space: model.space } );
	model.material.roughness = 0;
	model.material.metalness = 0;
	model.material.needsUpdate = true;
	model.visible = false;

	model.bodyGrips = [];

	// make body grips from the grip data
	var idx = 0;
	for ( var name in gripDef ) {

		var bodyGeometry = new THREE.IcosahedronGeometry( 1, 1 )//( 1, 1, 1, 8, 1 )
			.scale( ...gripDef[ name ][ 0 ])
			.rotateX( gripDef[ name ][ 2 ][ 0 ])
			.rotateY( gripDef[ name ][ 2 ][ 1 ])
			.rotateY( gripDef[ name ][ 2 ][ 2 ])
			.translate( ...gripDef[ name ][ 1 ]);

		var g = new THREE.Mesh( bodyGeometry, new THREE.MeshBasicMaterial( { color: new THREE.Color().setHSL( idx/Math.PI, 1, 0.5 ), wireframe: true, depthTest: false, depthWrite: false, transparent: true, opacity: 0.25 } ) );

		g.gripIndex = ++idx;
		g.gripSelector = gripDef[ name ][ 4 ];
		g.bodyPart = model[ name ];
		g.bodyPart.gripLimits = gripDef[ name ][ 3 ].map( x=>x*Math.PI/180 );
		g.visible = DEBUG_SHOW_BODY_GRIPS;
		g.isHandleGrip = false;
		g.isBodyGrip = true;

		model[ name ].attach( g );
		model.bodyGrips.push( g );


	} // for name

	return model;

}



// colors body part depending on the body grip index

var tslSelectionNodeNew = Fn( ( { space } )=>{

	var s = space.select,
		k = float( 0 );

	for ( var grip of model.bodyGrips )
		k = k.add( grip.gripSelector().mul( select( s.equal( grip.gripIndex ), 1, 0 ) ) );

	k =	k.clamp( 0, 1 ).toVar( );


	var color = vec3( 1, k.oneMinus(), k.oneMinus().mul( 0.9 ) ).toVar();

	If( s.equal( -1 ), ()=> {

		color.assign( vec3( 0, 0.25, 1 ) );

	} );

	return color;

} );



var activeHandleGrip = null,
	activeBodyPart = null;

var startQuaternion = new THREE.Quaternion(),
	startPositionGlobal = new THREE.Mesh( new THREE.BoxGeometry( 0.08, 0.04, 0.04 ), new THREE.MeshBasicMaterial( { color: 'green' } ) ), // start position
	endPositionGlobal = new THREE.Mesh( new THREE.BoxGeometry( 0.04, 0.08, 0.04 ), new THREE.MeshBasicMaterial( { color: 'red' } ) ); // end position

startPositionGlobal.visible = false;
endPositionGlobal.visible = false;


var clickX, clickY, clickTime;
var pointerDrag = false;

function pointerDown( event ) {

	pointerDrag = true;

	pointer.x = 2*event.clientX/innerWidth - 1;
	pointer.y = -2*event.clientY/innerHeight + 1;

	raycaster.setFromCamera( pointer, camera );

	var intersects;

	intersects = raycaster.intersectObjects([ ...model.bodyGrips, ...allGrips ]);


	if ( moveMode && intersects.length>0 ) {

		model.space.select.value = -1;
		moveModel = true;
		//oldClientX = event.clientX;
		oldClientY = event.clientY;
		controls.enabled = false;
		return;

	}

	if ( handle.visible ) {

		// check for handle grips
		if ( intersects.length && intersects[ 0 ].object.isHandleGrip ) {

			activeHandleGrip = intersects[ 0 ].object;

			controls.enabled = false;

			// vector camera-handle
			var vch = new THREE.Vector3();
			handle.getWorldPosition( vch );
			vch.sub( camera.position );

			// vector handle-grip (or click point)
			var vhg = new THREE.Vector3();
			handle.getWorldPosition( vhg );
			vhg.sub( intersects[ 0 ].point );

			if ( vch.dot( vhg )>=0 )
				interceptorIndex = 0;
			else
				interceptorIndex = 1;

			raycaster.setFromCamera( pointer, camera );

			var intersects = raycaster.intersectObject( interceptor );
			if ( intersects.length>0 ) {

				startPositionGlobal.position.copy( intersects[ interceptorIndex ].point );
				endPositionGlobal.position.copy( intersects[ interceptorIndex ].point );
				startQuaternion.copy( activeBodyPart.quaternion );

			}

			return;

		}

	}

	if ( activeHandleGrip ) {

		activeHandleGrip = null;
		controls.enabled = true;

	}

	// test click on body parts
	if ( intersects.length && intersects[ 0 ].object.isBodyGrip ) {

		if ( intersects[ 0 ].object.gripIndex ) {

			model.space.select.value = intersects[ 0 ].object.gripIndex;

			handle.removeFromParent(); // needed otherwise activeBodyPart.attach will clone it

			activeBodyPart = intersects[ 0 ].object.bodyPart;
			activeBodyPart.attach( handle );

			startQuaternion.copy( activeBodyPart.quaternion );

			handle.visible = true;

			return;

		}

	}

	clickX = event.clientX;
	clickY = event.clientY;
	clickTime = Date.now();


}



function pointerUp( /*event*/ ) {

	pointerDrag = false;

	model.space.select.value = 0;

	if ( moveMode ) {

		controls.enabled = true;
		moveModel = false;

	}

	if ( activeHandleGrip ) {

		//activeHandleGrip.visible = false;
		activeHandleGrip = null;
		controls.enabled = true;

	}

	if ( ( clickX-event.clientX )**2<50 && ( clickY-event.clientY )**2<50 && Date.now()-clickTime<300 ) {

		handle.visible = false;
		model.space.select.value = 0;

	}

}


function reset() {

	handle.visible = false;
	if ( model.space.select ) model.space.select.value = 0;
	if ( activeHandleGrip ) activeHandleGrip.visible = false;
	activeHandleGrip = null;
	controls.enabled = true;
	document.getElementById( 'left-buttons' ).display = 'none';

}


function pointerMove( event ) {

	handle.getWorldPosition( interceptor.position );
	lookAt( interceptor, camera.position );
	interceptor.updateMatrixWorld( true, true );


	pointer.x = 2*event.clientX/innerWidth - 1;
	pointer.y = -2*event.clientY/innerHeight + 1;

	if ( moveMode && moveModel ) {

		//var dX = event.clientX-oldClientX;
		var dY = event.clientY-oldClientY;

		model.position.y -= 0.000625*dY*camera.position.distanceTo( model.position );

		//oldClientX = event.clientX;
		oldClientY = event.clientY;
		return;

	}

	raycaster.setFromCamera( pointer, camera );
	intersects = raycaster.intersectObjects( model.bodyGrips );

	// if in move mode just translate the model, do not rotate any body part
	if ( moveMode && intersects.length>0 ) {

		model.space.select.value = -1;
		return;

	}

	// test click on body parts
	model.space.select.value = 0;
	if ( !activeHandleGrip && !pointerDrag ) {

		if ( intersects.length ) {

			if ( intersects[ 0 ].object.gripIndex ) {

				model.space.select.value = intersects[ 0 ].object.gripIndex;

			}

		}

	}


	if ( !activeHandleGrip ) return;


	var intersects = raycaster.intersectObject( interceptor );
	if ( intersects.length>0 ) {

		endPositionGlobal.position.copy( intersects[ interceptorIndex ].point );

	}

}



var quaternion = new THREE.Quaternion();

function update() {

	// This function was developed with assistance from xAI's Grok AI.

	handle.getWorldPosition( interceptor.position );
	lookAt( interceptor, camera.position );
	interceptor.updateMatrixWorld( true, true );

	if ( !activeHandleGrip ) return;

	// restore body part original position

	activeBodyPart.quaternion.copy( startQuaternion );
	activeBodyPart.updateMatrixWorld( true, true );

	// compute vectors and their dot product

	var OP = handle.worldToLocal( startPositionGlobal.position.clone() ).normalize(),
		OQ = handle.worldToLocal( endPositionGlobal.position.clone() ).normalize();

	var dotProduct = Math.min( Math.max( OP.dot( OQ ), -1 ), 1 );

	// check if vectors are already aligned - no need to rotate

	if ( Math.abs( dotProduct - 1 ) < 1e-10 ) {

		return;

	}

	// check if vectors are already opposite


	var angle;

	if ( Math.abs( dotProduct + 1 ) < 1e-10 ) {

		// rotate 180 degrees around an arbitrary perpendicular axis

		var rotationAxis = OP.clone().cross( new THREE.Vector3( 1, 0, 0 ) );
		if ( rotationAxis.length() < 1e-10 ) {

			rotationAxis.crossVectors( OP, new THREE.Vector3( 0, 1, 0 ) );

		}

		angle = Math.PI;
		rotationAxis.normalize();

	} else {

		// compute the rotation axis (cross product) and angle

		var rotationAxis = OP.clone().cross( OQ ).normalize();
		angle = Math.acos( dotProduct );

	}

	// create quaternion for the rotation

	quaternion.setFromAxisAngle( rotationAxis, angle );

	// apply the rotation

	activeBodyPart.quaternion.multiply( quaternion );
	activeBodyPart.updateMatrixWorld( true, true );

	const constrainedEuler = findClosestConstrainedEuler2( activeBodyPart, ...activeBodyPart.gripLimits, 10*Math.PI/180, 0.1*Math.PI/180 );
	activeBodyPart.rotation.copy( constrainedEuler );

	activeBodyPart.updateMatrixWorld( true, true );

}



/**

 * This function was developed with assistance from xAI's Grok AI.

 * Finds the closest Euler orientation to (x, y, z, order) within the specified intervals
 * using iterative optimization with perturbations in six directions.
 * Each component is constrained: x' in [xmin, xmax], y' in [ymin, ymax], z' in [zmin, zmax].
 * @param {THREE.Object3D} OBJ - The Object3D with current Euler angles.
 * @param {number} xmin - Minimum x angle (radians).
 * @param {number} xmax - Maximum x angle (radians).
 * @param {number} ymin - Minimum y angle (radians).
 * @param {number} ymax - Maximum y angle (radians).
 * @param {number} zmin - Minimum z angle (radians).
 * @param {number} zmax - Maximum z angle (radians).
 * @param {number} [initialStep=0.1] - Initial step size for perturbations (radians).
 * @param {number} [epsilon=0.001] - Minimum step size for convergence (radians).
 * @returns {THREE.Euler} - The closest Euler angles within the constraints.
 */
function findClosestConstrainedEuler2( OBJ, xmin, xmax, ymin, ymax, zmin, zmax, initialStep = 0.1, epsilon = 0.001 ) {

	// Get current Euler angles and order
	const currentEuler = OBJ.rotation.clone();
	const order = currentEuler.order;
	const originalQuaternion = OBJ.quaternion.clone();

	// Helper: Convert Euler angles to quaternion
	function eulerToQuaternion( x, y, z, order ) {

		const euler = new THREE.Euler( x, y, z, order );
		const quaternion = new THREE.Quaternion();
		quaternion.setFromEuler( euler );
		return quaternion.normalize();

	}

	// Helper: Compute angular difference between two quaternions
	function getAngularDifference( q1, q2 ) {

		const qRel = q1.clone().invert().multiply( q2 );
		return 2 * Math.acos( Math.min( Math.max( Math.abs( qRel.w ), -1 ), 1 ) ); // Angle in radians

	}

	// Helper: Clamp angle to interval
	function clamp( value, min, max ) {

		return Math.min( Math.max( value, min ), max );

	}

	// Initialize current Euler angles (start with current angles clamped to intervals)
	let bestX = clamp( currentEuler.x, xmin, xmax );
	let bestY = clamp( currentEuler.y, ymin, ymax );
	let bestZ = clamp( currentEuler.z, zmin, zmax );
	let minAngle = getAngularDifference( originalQuaternion, eulerToQuaternion( bestX, bestY, bestZ, order ) );

	// Iterative optimization
	let step = initialStep;
	while ( step >= epsilon ) {

		let improved = false;
		let newBestX = bestX;
		let newBestY = bestY;
		let newBestZ = bestZ;
		let newMinAngle = minAngle;

		// Test six directions: +x, -x, +y, -y, +z, -z
		const directions = [
			{ dx: step, dy: 0, dz: 0 }, // +x
			{ dx: -step, dy: 0, dz: 0 }, // -x
			{ dx: 0, dy: step, dz: 0 }, // +y
			{ dx: 0, dy: -step, dz: 0 }, // -y
			{ dx: 0, dy: 0, dz: step }, // +z
			{ dx: 0, dy: 0, dz: -step } // -z
		];

		for ( const dir of directions ) {

			// Skip directions if axis is fixed (e.g., zmin = zmax for z)
			if ( dir.dx !== 0 && xmin === xmax ) continue;
			if ( dir.dy !== 0 && ymin === ymax ) continue;
			if ( dir.dz !== 0 && zmin === zmax ) continue;

			// Compute perturbed angles and clamp to intervals
			const x = clamp( bestX + dir.dx, xmin, xmax );
			const y = clamp( bestY + dir.dy, ymin, ymax );
			const z = clamp( bestZ + dir.dz, zmin, zmax );

			// Evaluate angular difference
			const candidateQuaternion = eulerToQuaternion( x, y, z, order );
			const angleDiff = getAngularDifference( originalQuaternion, candidateQuaternion );

			// Update best orientation if better
			if ( angleDiff < newMinAngle ) {

				newMinAngle = angleDiff;
				newBestX = x;
				newBestY = y;
				newBestZ = z;
				improved = true;

			}

		}

		// Update current best orientation
		if ( improved ) {

			bestX = newBestX;
			bestY = newBestY;
			bestZ = newBestZ;
			minAngle = newMinAngle;

		} else {

			// No improvement; reduce step size
			step /= 2;

		}

	}

	// Create the constrained Euler angles
	const constrainedEuler = new THREE.Euler( bestX, bestY, bestZ, order );

	return constrainedEuler;

}


var title = document.getElementById( 'title' );

function setPoseMode( ) {

	model.space.select.value = 0;
	title.innerHTML = '<b>Posing</b> mode';
	title.classList.remove( 'autohide' );
	void title.offsetWidth;
	title.classList.add( 'autohide' );
	moveMode = false;
	handle.visible = false;

}


function setMoveMode( ) {

	model.space.select.value = 0;
	title.innerHTML = '<b>Moving</b> mode';
	title.classList.remove( 'autohide' );
	void title.offsetWidth;
	title.classList.add( 'autohide' );
	moveMode = true;
	handle.visible = false;

}


function swapModel( model, models ) {

	if ( model==models[ 0 ]) {

		title.innerHTML = '<b>Woman</b> figure';
		title.classList.remove( 'autohide' );
		void title.offsetWidth;
		title.classList.add( 'autohide' );
		return models[ 1 ];

	}

	if ( model==models[ 1 ]) {

		title.innerHTML = '<b>Child</b> figure';
		title.classList.remove( 'autohide' );
		void title.offsetWidth;
		title.classList.add( 'autohide' );
		return models[ 2 ];

	}

	title.innerHTML = '<b>Man</b> figure';
	title.classList.remove( 'autohide' );
	void title.offsetWidth;
	title.classList.add( 'autohide' );
	return models[ 0 ];

}


export { initScene, initModel, update, reset, setMoveMode, setPoseMode, swapModel, useModel };
