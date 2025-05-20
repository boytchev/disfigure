// disfigure v0.0.7

'use strict';

var THREE = require('three');
var tsl = require('three/tsl');
var lil = require('three/addons/libs/lil-gui.module.min.js');
var OrbitControls_js = require('three/addons/controls/OrbitControls.js');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var THREE__namespace = /*#__PURE__*/_interopNamespaceDefault(THREE);
var lil__namespace = /*#__PURE__*/_interopNamespaceDefault(lil);

// generate X-rotation matrix
const matRotX = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
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
const matRotY = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
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
const matRotZ = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
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
const matRotYXZ = tsl.Fn( ([ angles ])=>{

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
const matRotYZX = tsl.Fn( ([ angles ])=>{

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
const matRotXYZ = tsl.Fn( ([ angles ])=>{

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
const matRotXZY = tsl.Fn( ([ angles ])=>{

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
const matRotZXY = tsl.Fn( ([ angles ])=>{

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
const matRotZYX = tsl.Fn( ([ angles ])=>{

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
function centerModel( model ) {

	var center = new THREE.Vector3();

	new THREE.Box3().setFromObject( model, true ).getCenter( center );
	model.position.sub( center );

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

			meshes.push( new THREE.Mesh( geo, mat ) );

		}

	} );

	// clear model
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );

	// add meshes
	model.add( ...meshes );

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission
function ennodeModel( model, skeleton, posture, nodes ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			//var material = new MeshStandardNodeMaterial();
			var material = new THREE.MeshPhysicalNodeMaterial();

			// copy all properties from the original material
			Object.assign( material, child.material );

			material.metalness = 0.1;
			material.roughness = 0.6;

			//			material.metalness = 0.5;
			//			material.roughness = 0.3;

			if ( nodes.colorNode )
				material.colorNode = nodes.colorNode( );

			if ( nodes.positionNode )
				material.positionNode = nodes.positionNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.normalNode )
				material.normalNode = nodes.normalNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.emissiveNode )
				material.emissiveNode = nodes.emissiveNode( { skeleton: skeleton, posture: posture } );

			child.material = material;

		}

	} );

}



// prepared a model for TSL rigging
function processModel( model, skeleton, posture, nodes ) {

	flattenModel( model );
	ennodeModel( model, skeleton, posture, nodes );
	centerModel( model );

	return model;

}



// extract credits and place them in DOM element
// replaces the resource url extension with "txt"
// e.g. my-model.glb -> my-model.txt
function credits( url, id ) {

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {

		if ( this.readyState == 4 ) {

			if ( this.status == 200 ) {

				document.getElementById( id ).innerHTML = this.responseText.split( '||' )[ 0 ];

			}

		}

	};

	url = url.split( '.' );
	url.pop();
	url.push( 'txt' );
	url = url.join( '.' );

	xhttp.open( "GET", url, true );
	xhttp.send();

}

var scene = new THREE__namespace.Scene();
scene.background = new THREE__namespace.Color( 'whitesmoke' );



var camera = new THREE__namespace.PerspectiveCamera( 30, innerWidth/innerHeight );
camera.position.set( -2, 1, 3.5 );
camera.lookAt( scene.position );



var renderer = new THREE__namespace.WebGPURenderer( { antialias: true } );
renderer.outputColorSpace = THREE__namespace.LinearSRGBColorSpace;
renderer.setSize( innerWidth, innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener( "resize", ( /*event*/ ) => {

	camera.aspect = innerWidth/innerHeight;
	camera.updateProjectionMatrix( );
	renderer.setSize( innerWidth, innerHeight );

} );



var controls = new OrbitControls_js.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 0.5;



var ambientLight = new THREE__namespace.AmbientLight( 'white', 1 );
scene.add( ambientLight );



var light = new THREE__namespace.DirectionalLight( 'white', 2 );
light.position.set( 0, 0, 1 );
scene.add( light );





var pivot = new THREE__namespace.AxesHelper();


var options = {
	animate: false,
};



var debug = {
	isolated: false,
	randomize: rigRandomModel,
};
var posture = {};
var skeleton = {};
var model = new THREE__namespace.Group();
var gui;

function createGui( skeletonData, postureData, modelObject ) {

	skeleton = skeletonData;

	posture = postureData;
	posture.select = tsl.uniform( 0, 'int' ); // 0..24
	posture.isolated = tsl.uniform( 0, 'int' ); // 0 or 1
	model = modelObject;


	gui = new lil__namespace.GUI(); // global gui
	gui.domElement.style.marginRight = 0;

	var mfolder = gui.addFolder( 'DEBUG' );

	mfolder.close();

	mfolder.add( posture.select, 'value', {
		Nothing: 0,
		Head: 1, Chest: 2, Waist: 3,
		Hip: 11, Hip2: 15, Leg: 12, Knee: 13, Ankle: 14, Foot: 16,
		Arm: 21, Elbow: 22, Forearm: 23, Wrist: 24,
	} ).name( 'Show' ).onChange( showPivotPoint );

	mfolder.add( debug, 'isolated', false ).name( 'Isolated' ).onChange( ()=>{

		posture.isolated.value = debug.isolated?1:0;

	} );
	mfolder.add( options, 'animate', false ).name( 'Animate' );
	mfolder.add( debug, 'randomize' ).name( 'Randomize' );

	function html( name, icon, classes='' ) {

		return `<div class="padded ${classes}">${name} &nbsp; <span class="icon">${icon}</span></div>`;

	}


	mfolder = gui.addFolder( 'TORSO' );//.close();
	{

		mfolder.add( posture.head.value, 'x', -0.7, 0.5 ).name( html( 'Head', '&#x2195;' ) );
		mfolder.add( posture.head.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );
		mfolder.add( posture.head.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.chest.value, 'x', -0.7, 0.4 ).name( html( 'Chest', '&#x2195;', 'border' ) );
		mfolder.add( posture.chest.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );

		mfolder.add( posture.waist.value, 'x', -1, 0.6 ).name( html( 'Waist', '&#x2195;', 'border' ) );
		mfolder.add( posture.waist.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21B6;' ) );
		mfolder.add( posture.waist.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );

	}

	mfolder = gui.addFolder( 'LEFT LEG' ).close();
	{

		mfolder.add( posture.hipLeft.value, 'x', -0.6, 2.7 ).name( html( 'Leg', '&#x2195;' ) );
		mfolder.add( posture.hipLeft.value, 'z', -2.4, 0.2 ).name( html( '', '&#x21BA;' ) );
		mfolder.add( posture.hip2Left.value, 'y', -1.4, 1.4 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.kneeLeft.value, 'x', -2.6, 0 ).name( html( 'Knee', '&#x2195;', 'border' ) );

		mfolder.add( posture.ankleLeft.value, 'x', -1, 0.7 ).name( html( 'Ankle', '&#x2195;', 'border' ) );
		mfolder.add( posture.legLeft.value, 'y', -3, 3 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.ankleLeft.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21BA;' ) );

		mfolder.add( posture.footLeft.value, 'x', -0.3, 0.6 ).name( html( 'Foot', '&#x2195;', 'border' ) );

	}

	mfolder = gui.addFolder( 'RIGHT LEG' ).close();
	{

		mfolder.add( posture.hipRight.value, 'x', -0.6, 2.7 ).name( html( 'Leg', '&#x2195;' ) );
		mfolder.add( posture.hipRight.value, 'z', -0.2, 2.4 ).name( html( '', '&#x21BB;' ) ); // swapped
		mfolder.add( posture.hip2Right.value, 'y', -1.4, 1.4 ).name( html( '', '&#x2194;' ) );

		mfolder.add( posture.kneeRight.value, 'x', -2.6, 0 ).name( html( 'Knee', '&#x2195;', 'border' ) );

		mfolder.add( posture.ankleRight.value, 'x', -1, 0.7 ).name( html( 'Ankle', '&#x2195;', 'border' ) );
		mfolder.add( posture.legRight.value, 'y', -3, 3 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.ankleRight.value, 'z', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.footRight.value, 'x', -0.3, 0.6 ).name( html( 'Foot', '&#x2195;', 'border' ) );

	}

	mfolder = gui.addFolder( 'LEFT ARM' ).close();
	{

		mfolder.add( posture.armLeft.value, 'z', -1.5, 1.7 ).name( html( 'Arm', '&#x2195;' ) );
		mfolder.add( posture.armLeft.value, 'y', -0.5, 2 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.armLeft.value, 'x', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.elbowLeft.value, 'y', 0, 2.7 ).name( html( 'Elbow', '&#x2195;', 'border' ) );

		mfolder.add( posture.wristLeft.value, 'z', -1.4, 1.4 ).name( html( 'Wrist', '&#x2195;', 'border' ) );
		mfolder.add( posture.wristLeft.value, 'y', -0.6, 0.4 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.forearmLeft.value, 'x', -1.5, 3 ).name( html( '', '&#x21BB;' ) );

	}

	mfolder = gui.addFolder( 'RIGHT ARM' ).close();
	{

		mfolder.add( posture.armRight.value, 'z', -1.5, 1.7 ).name( html( 'Arm', '&#x2195;' ) );
		mfolder.add( posture.armRight.value, 'y', -2, 0.5 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.armRight.value, 'x', -0.5, 0.5 ).name( html( '', '&#x21BB;' ) );

		mfolder.add( posture.elbowRight.value, 'y', -2.7, 0 ).name( html( 'Elbow', '&#x2195;', 'border' ) );

		mfolder.add( posture.wristRight.value, 'z', -1.4, 1.4 ).name( html( 'Wrist', '&#x2195;', 'border' ) );
		mfolder.add( posture.wristRight.value, 'y', -0.4, 0.6 ).name( html( '', '&#x2194;' ) );
		mfolder.add( posture.forearmRight.value, 'x', -1.5, 3 ).name( html( '', '&#x21BB;' ) );

	}

	return gui;

}



function rigModel( time ) {

	posture.waist.value.set(
		Math.sin( time )/4-0.2,
		Math.cos( time*1.2 )/2,
		Math.sin( time*3 )/2.5
	);

	posture.chest.value.set(
		Math.cos( time*3 )/3,
		0, //08.05.25 Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.head.value.set(
		Math.cos( time*3 )/2,
		Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.kneeLeft.value.set(
		-( Math.cos( time*3 )+1 )/1.5,
		0,
		0,
	);

	posture.kneeRight.value.set(
		-( Math.sin( time*2.4 )+1 )/1.5,
		0,
		0,
	);

	posture.footLeft.value.set(
		( Math.cos( time*1.7 ) )*0.5+0.15,
		0,
		0,
	);

	posture.footRight.value.set(
		( Math.sin( time*1.9 ) )*0.5+0.15,
		0,
		0,
	);

	posture.ankleLeft.value.set(
		Math.cos( time*3 )/2,
		0*	Math.cos( time*2.8 )/2,
		Math.cos( time*2.2 )/4,
	);

	posture.ankleRight.value.set(
		Math.sin( time*3.2 )/2,
		0*	Math.cos( time*2.3 )/2,
		Math.sin( time*2.1 )/4,
	);

	posture.legLeft.value.set(
		0,
		Math.cos( time*2.8 )-0.25,
		0,
	);

	posture.legRight.value.set(
		0,
		Math.cos( time*2.3 )+0.25,
		0,
	);

	posture.hipLeft.value.set(
		( Math.cos( time*3 )/1+0.25 ),
		0, //08.05.25 Math.cos( time*2.8 ),///4,
		-( Math.cos( time*2.2 )+1 )/4,
	);

	posture.hip2Left.value.set(
		0,
		Math.cos( time*2.8 ),
		0,
	);

	posture.hipRight.value.set(
		( Math.sin( time*2.2 )/1+0.25 ),
		0, //08.05.25 Math.sin( time*3.2 )/4,
		( Math.sin( time*2.6 )+1 )/4,
	);

	posture.hip2Right.value.set(
		0,
		Math.sin( time*3.2 ),
		0,
	);

	posture.elbowLeft.value.set(
		0,
		( Math.cos( time*2-1 )+1 ),
		0,
	);

	posture.elbowRight.value.set(
		0,
		-( Math.sin( time*1.8 )+1 ),
		0,
	);

	posture.forearmLeft.value.set(
		0.5*( Math.cos( time*3.6-1 )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRight.value.set(
		0.5*( Math.sin( time*1.8*3+1 )*1.5+1 ),
		0,
		0,
	);

	posture.wristLeft.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.wristRight.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		-( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.armLeft.value.set(
		0.7*( Math.cos( time*3 )/1.5-0.15 ),
		0, //-0.7*( Math.cos( time*2.8 )*1-0.6 ),
		0.7*( Math.cos( time*2.2 ) ),
	);

	posture.armRight.value.set(
		0.7*( Math.sin( time*2.4 )/1.5-0.15 ),
		0, //-0.7*-( Math.cos( time*3.1 )*1-0.6 ),
		0.7*( Math.sin( time*2.7 ) ),
	);

}



function rigRandomModel( seed = THREE__namespace.MathUtils.randInt( Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER ) ) {

	THREE__namespace.MathUtils.seededRandom( seed );

	function rand( from=-1, to=1 ) {

		return THREE__namespace.MathUtils.seededRandom() * ( to-from ) + from;

	}

	model.rotation.y += rand( )-0.2;

	posture.waist.value.set(
		rand()/4-0.2,
		rand()/2,
		rand()/2.5
	);

	posture.chest.value.set(
		rand()/3,
		0,
		rand( )/3
	);

	posture.head.value.set(
		rand( )/2,
		rand( )/2,
		rand( )/3
	);

	posture.kneeLeft.value.set(
		-( rand( )+1 )/1.5,
		0,
		0,
	);

	posture.kneeRight.value.set(
		-( rand( )+1 )/1.5,
		0,
		0,
	);

	posture.footLeft.value.set(
		( rand( ) )*0.5+0.15,
		0,
		0,
	);

	posture.footRight.value.set(
		( rand( ) )*0.5+0.15,
		0,
		0,
	);

	posture.ankleLeft.value.set(
		rand( )/2,
		0,
		rand( )/4,
	);

	posture.ankleRight.value.set(
		rand( )/2,
		0,
		rand( )/4,
	);

	posture.legLeft.value.set(
		0,
		rand( )-0.25,
		0,
	);

	posture.legRight.value.set(
		0,
		rand( )+0.25,
		0,
	);

	posture.hipLeft.value.set(
		( rand( )/1+0.25 ),
		0,
		-( rand( )+1 )/4,
	);

	posture.hip2Left.value.set(
		0,
		rand( ),
		0,
	);

	posture.hipRight.value.set(
		( rand( )/1+0.25 ),
		0,
		( rand( )+1 )/4,
	);

	posture.hip2Right.value.set(
		0,
		rand( ),
		0,
	);

	posture.elbowLeft.value.set(
		0,
		( rand( )+1 ),
		0,
	);

	posture.elbowRight.value.set(
		0,
		-( rand( )+1 ),
		0,
	);

	posture.forearmLeft.value.set(
		0.5*( rand( )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRight.value.set(
		0.5*( rand( )*1.5+1 ),
		0,
		0,
	);

	posture.wristLeft.value.set(
		0,
		( rand( )*0.5+0.1 ),
		( rand( )*0.7 ),
	);

	posture.wristRight.value.set(
		0,
		( rand( )*0.5+0.1 ),
		-( rand( )*0.7 ),
	);

	posture.armLeft.value.set(
		0.7*( rand( )/1.5-0.15 ),
		0,
		0.7*( rand( ) ),
	);

	posture.armRight.value.set(
		0.7*( rand( )/1.5-0.15 ),
		0,
		0.7*( rand( ) ),
	);

	updateGUI( );

}



function showPivotPoint( index ) {

	model.add( pivot );
	switch ( index ) {

		case 1: pivot.position.copy( skeleton.head.pivot ); break;
		case 2: pivot.position.copy( skeleton.chest.pivot ); break;
		case 3: pivot.position.copy( skeleton.waist.pivot ); break;

		case 11: pivot.position.copy( skeleton.hipLeftPos ); break;
		case 15: pivot.position.copy( skeleton.hip2.pivot ); break;
		case 12: pivot.position.copy( skeleton.leg.pivot ); break;
		case 13: pivot.position.copy( skeleton.knee.pivot ); break;
		case 14: pivot.position.copy( skeleton.ankle.pivot ); break;
		case 16: pivot.position.copy( skeleton.foot.pivot ); break;

		case 21: pivot.position.copy( skeleton.arm.pivot ); break;
		case 22: pivot.position.copy( skeleton.elbow.pivot ); break;
		case 23: pivot.position.copy( skeleton.forearm.pivot ); break;
		case 24: pivot.position.copy( skeleton.wrist.pivot ); break;

		default: model.remove( pivot );

	}

}



function updateGUI( ) {

	for ( var ctrl of gui.controllersRecursive() ) ctrl.updateDisplay( );

}



function animationLoop( t ) {

	if ( options.animate ) {

		rigModel( t/1000 );
		updateGUI( );

	}

	controls.update( );
	light.position.copy( camera.position );

	renderer.render( scene, camera );

}


renderer.setAnimationLoop( animationLoop );

// a class defining a locus in 3D space with fuzzy boundaries and orientation
class Locus {

	constructor( x, y, z, min, max ) {

		this.pivot = new THREE.Vector3( x, y, z );
		this.mirrorPivot = new THREE.Vector3( -x, y, z );

		this.min = min;
		this.max = max;

	}

}



// a horizontal XZ-flat locus, horizontally infinite, vertically from min to max
class LocusY extends Locus {

	fuzzy( ) {

		return tsl.positionGeometry.y.smoothstep( this.min, this.max );

	}

}



// a horizontal XZ-flat locus at angle degrees, horizontally infinite, vertically from min to max
class LocusYZ extends Locus {

	constructor( x, y, z, min, max, angle ) {

		super( x, y, z, min, max );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	fuzzy( ) {

		return tsl.positionGeometry.y.add( tsl.positionGeometry.z.div( this.slope ) ).smoothstep( this.min, this.max );

	}

}



// a vertical YZ-flat locus at angle degrees, vertically infinite, X-horizontally from min to max
class LocusX extends Locus {

	fuzzy( ) {

		return tsl.positionGeometry.x.smoothstep( this.min, this.max );

	}

	mirrorFuzzy( ) {

		return tsl.positionGeometry.x.smoothstep( -this.min, -this.max );

	}

}



class LocusXY extends Locus {

	constructor( x, y, z, minX, maxX, minY, maxY ) {

		super( x, y, z, minX, maxX );
		this.minY = minY;
		this.maxY = maxY;

	}

	fuzzy( ) {

		var x = tsl.positionGeometry.x.smoothstep( this.min, this.max );
		var y = tsl.positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

	mirrorFuzzy( ) {

		var x = tsl.positionGeometry.x.smoothstep( -this.min, -this.max );
		var y = tsl.positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

}



function selectHipLeft( { hipLeftSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.sub( x.mul( 2 ) )
		.smoothstep( hipLeftSpan.z, tsl.float( hipLeftSpan.w ).sub( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipLeftSpan.x, hipLeftSpan.y ) )
		.mul( x.smoothstep( -0.01, 0.01 ) );

} // inlined



function selectHipRight( { hipRightSpan } ) {

	var x = tsl.positionGeometry.x;
	var y = tsl.positionGeometry.y;

	return y.add( x.mul( 2 ) )
		.smoothstep( hipRightSpan.z, tsl.float( hipRightSpan.w ).add( x.mul( 1.6 ) ) )
		.mul( y.smoothstep( hipRightSpan.x, hipRightSpan.y ) )
		.mul( x.smoothstep( 0.01, -0.01 ) );

} // inlined



var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

	// for legs matRotYZX was better, but for all others matRotYXZ is better
	return pos.sub( center ).mul( matRotYXZ( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotate',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateArm= tsl.Fn( ([ pos, center, angle, amount ])=>{

	//return pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center );
	return tsl.mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( tsl.float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

} ).setLayout( {
	name: 'jointRotate2',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



function tslPositionNode( options ) {

	options.vertex = tsl.positionGeometry;
	options.mode = tsl.float( 1 );
	return tslPositionNode2( options );

}



function tslNormalNode( options ) {

	options.vertex = tsl.normalGeometry;
	options.mode = tsl.float( 0 );
	return tsl.transformNormalToView( tslPositionNode2( options ) ).normalize( );

}



var tslPositionNode2 = tsl.Fn( ( { skeleton, posture, mode, vertex } )=>{

	var p = vertex.toVar();



	// LEFT-UPPER BODY

	var armLeft = skeleton.arm.fuzzy( ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.pivot ), posture.wristLeft, skeleton.wrist.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.pivot ), posture.forearmLeft, skeleton.forearm.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.pivot ), posture.elbowLeft, skeleton.elbow.fuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.pivot ), posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = skeleton.arm.mirrorFuzzy( ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.mirrorPivot ), posture.wristRight, skeleton.wrist.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.mirrorPivot ), posture.forearmRight, skeleton.forearm.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.mirrorPivot ), posture.elbowRight, skeleton.elbow.mirrorFuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.mirrorPivot ), posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( skeleton.head.pivot ), posture.head, skeleton.head.fuzzy( ) ) );
	p.assign( jointRotate( p, mode.mul( skeleton.chest.pivot ), posture.chest, skeleton.chest.fuzzy() ) );
	p.assign( jointRotate( p, mode.mul( skeleton.waist.pivot ), posture.waist, skeleton.waist.fuzzy() ) );



	// LEFT-LOWER BODY

	var hipLeft = selectHipLeft( skeleton ).toVar();

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.pivot ), posture.footLeft, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.pivot ), posture.ankleLeft, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.pivot ), posture.legLeft, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.pivot ), posture.kneeLeft, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.pivot ), posture.hip2Left, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hipLeftPos ), posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = selectHipRight( skeleton ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.mirrorPivot ), posture.footRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.mirrorPivot ), posture.ankleRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.mirrorPivot ), posture.legRight, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.mirrorPivot ), posture.kneeRight, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.mirrorPivot ), posture.hip2Right, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hipRightPos ), posture.hipRight, hipRight ) );

	} );

	return p;

} );



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = tsl.Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = tsl.float( 0 )
		.add( skeleton.head.fuzzy( ).mul( tsl.select( s.equal( 1 ), 1, 0 ) ) )
		.add( skeleton.chest.fuzzy( ).mul( tsl.select( s.equal( 2 ), 1, 0 ) ) )
		.add( skeleton.waist.fuzzy( ).mul( tsl.select( s.equal( 3 ), 1, 0 ) ) )

		.add( selectHipLeft( skeleton ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )
		.add( skeleton.leg.fuzzy( ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )
		.add( skeleton.knee.fuzzy( ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )
		.add( skeleton.ankle.fuzzy( ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )
		.add( skeleton.foot.fuzzy( ).mul( tsl.select( s.equal( 16 ), 1, 0 ) ) )
		.add( skeleton.hip2.fuzzy( ).mul( tsl.select( s.equal( 15 ), 1, 0 ) ) )

		.add( skeleton.arm.fuzzy( ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )
		.add( skeleton.elbow.fuzzy( ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )
		.add( skeleton.forearm.fuzzy( ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )
		.add( skeleton.wrist.fuzzy( ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )

		.toVar( );

	k.assign( tsl.select( posture.isolated,
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );


	return tsl.vec3( 0, k.div( 2 ), k.div( 1 ) );

} );



var tslColorNode = tsl.Fn( ()=>{

	var p = tsl.positionGeometry;

	var k = tsl.float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return tsl.vec3( k );

} );



function tslPosture( ) {

	return {

		// TORSO
		head: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		chest: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		waist: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// LEGS
		kneeLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		kneeRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hipLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Left: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hipRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Right: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// ARMS
		elbowLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		elbowRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
	};

}

exports.LocusX = LocusX;
exports.LocusXY = LocusXY;
exports.LocusY = LocusY;
exports.LocusYZ = LocusYZ;
exports.createGui = createGui;
exports.credits = credits;
exports.matRotXYZ = matRotXYZ;
exports.matRotXZY = matRotXZY;
exports.matRotYXZ = matRotYXZ;
exports.matRotYZX = matRotYZX;
exports.matRotZXY = matRotZXY;
exports.matRotZYX = matRotZYX;
exports.processModel = processModel;
exports.scene = scene;
exports.tslColorNode = tslColorNode;
exports.tslEmissiveNode = tslEmissiveNode;
exports.tslNormalNode = tslNormalNode;
exports.tslPositionNode = tslPositionNode;
exports.tslPosture = tslPosture;
