
// disfigure
//
// module to construct gui



import * as THREE from "three";
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";



const DEBUG = false;


var scene = new THREE.Scene();
scene.background = new THREE.Color( 'gainsboro' );



var camera = new THREE.PerspectiveCamera( 30, innerWidth/innerHeight );
camera.position.set( -2, 1, 3.5 );
camera.lookAt( scene.position );



var renderer = new THREE.WebGPURenderer( { antialias: true } );
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize( innerWidth, innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener( "resize", ( /*event*/ ) => {

	camera.aspect = innerWidth/innerHeight;
	camera.updateProjectionMatrix( );
	renderer.setSize( innerWidth, innerHeight );

} );



var controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;



var ambientLight = new THREE.AmbientLight( 'white', 1 );
scene.add( ambientLight );



var light = new THREE.DirectionalLight( 'white', 2 );
light.position.set( 0, 0, 1 );
scene.add( light );



var pivot = new THREE.AxesHelper();


var options = {
	animate: false,
};



var posture = {};
var model = new THREE.Group();

function createGui( postureData, modelObject ) {

	posture = postureData;
	model = modelObject;

	var gui = new lil.GUI();
	gui.domElement.style.marginRight = 0;

	var mfolder = gui.addFolder( 'DEBUG' );

	if ( !DEBUG ) mfolder.close();

	mfolder.add( posture.select, 'value', {
		Nothing: 0,
		Head: 1, Chest: 2, Waist: 3,
		Hip: 11, Leg: 12, Knee: 13, Ankle: 14,
		Arm: 21, Elbow: 22, Forearm: 23, Wrist: 24,
	} ).name( 'Show' ).onChange( showPivotPoint );

	if ( DEBUG ) {

		mfolder.add( posture.hipLeftPos.value, 'x', 0., 1 ).name( 'px' ).onChange( changePivotPoint );
		mfolder.add( posture.hipLeftPos.value, 'y', 1.0, 1.7 ).name( 'py' ).onChange( changePivotPoint );
		mfolder.add( posture.hipLeftPos.value, 'z', -0.5, 0.5 ).name( 'pz' ).onChange( changePivotPoint );
		mfolder.add( posture.hipLeftSpan.value, 'x', 1, 2 ).name( 'sx' ).onChange( changePivotPoint );
		mfolder.add( posture.hipLeftSpan.value, 'y', 1, 2 ).name( 'sy' ).onChange( changePivotPoint );

	}

	mfolder.add( posture.isolated, 'value', { Isolated: 0, Full: 1 } ).name( 'Isolated' );
	mfolder.add( options, 'animate', false ).name( 'Animate' );

	mfolder = gui.addFolder( 'TORSO' );
	if ( DEBUG ) mfolder.close();

	var folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.headTurn.value, 'x', -0.7, 0.5 ).name( 'head' );
	folder.add( posture.chestTurn.value, 'x', -0.7, 0.4 ).name( 'chest' );
	folder.add( posture.waistTurn.value, 'x', -1.0, 0.6 ).name( 'waist' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.headTurn.value, 'y', -1, 1 ).name( 'head' );
	folder.add( posture.chestTurn.value, 'y', -0.7, 0.7 ).name( 'chest' );
	folder.add( posture.waistTurn.value, 'y', -1, 1 ).name( 'waist' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.headTurn.value, 'z', -0.5, 0.5 ).name( 'head' );
	folder.add( posture.chestTurn.value, 'z', -0.5, 0.5 ).name( 'chest' );
	folder.add( posture.waistTurn.value, 'z', -0.5, 0.5 ).name( 'waist' );

	mfolder = gui.addFolder( 'LEFT LEG' ).close();

	var folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.hipLeftTurn.value, 'x', -0.5, 1.5 ).name( 'hip' );
	folder.add( posture.kneeLeftTurn.value, 'x', -2.6, 0 ).name( 'knee' );
	folder.add( posture.ankleLeftTurn.value, 'x', -1, 0.7 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.hipLeftTurn.value, 'y', -0.3, 0.3 ).name( 'hip' );
	folder.add( posture.legLeftTurn.value, 'y', -3, 3 ).name( 'leg' );
	folder.add( posture.ankleLeftTurn.value, 'y', -0.75, 0.75 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.hipLeftTurn.value, 'z', -1.4, 0.2 ).name( 'hip' );
	folder.add( posture.ankleLeftTurn.value, 'z', -0.5, 0.5 ).name( 'ankle' );

	mfolder = gui.addFolder( 'RIGHT LEG' ).close();

	var folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.hipRightTurn.value, 'x', -0.5, 1.5 ).name( 'hip' );
	folder.add( posture.kneeRightTurn.value, 'x', -2.6, 0 ).name( 'knee' );
	folder.add( posture.ankleRightTurn.value, 'x', -1, 0.7 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.hipRightTurn.value, 'y', -0.3, 0.3 ).name( 'hip' );
	folder.add( posture.legRightTurn.value, 'y', -3, 3 ).name( 'leg' );
	folder.add( posture.ankleRightTurn.value, 'y', -0.75, 0.75 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.hipRightTurn.value, 'z', -0.2, 1.4 ).name( 'hip' ); // swapped
	folder.add( posture.ankleRightTurn.value, 'z', -0.5, 0.5 ).name( 'ankle' );


	mfolder = gui.addFolder( 'LEFT ARM' ).close();

	folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.armLeftTurn.value, 'y', -0.5, 2 ).name( 'arm' );
	folder.add( posture.elbowLeftTurn.value, 'y', 0, 2.7 ).name( 'elbow' );
	folder.add( posture.wristLeftTurn.value, 'z', -1.4, 1.4 ).name( 'wrist' ); // axis

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.armLeftTurn.value, 'x', -0.5, 0.5 ).name( 'arm' );
	folder.add( posture.forearmLeftTurn.value, 'x', -1.5, 3 ).name( 'forearm' );
	folder.add( posture.wristLeftTurn.value, 'x', -0.5, 0.5 ).name( 'wrist' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.armLeftTurn.value, 'z', -1.5, 1.7 ).name( 'arm' );
	folder.add( posture.wristLeftTurn.value, 'y', -0.6, 0.4 ).name( 'wrist' ); // axis


	mfolder = gui.addFolder( 'RIGHT ARM' ).close();

	folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.armRightTurn.value, 'y', -2, 0.5 ).name( 'arm' ); // swapped
	folder.add( posture.elbowRightTurn.value, 'y', -2.7, 0 ).name( 'elbow' ); // swapped
	folder.add( posture.wristRightTurn.value, 'z', -1.4, 1.4 ).name( 'wrist' ); // axis swapped

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.armRightTurn.value, 'x', -0.5, 0.5 ).name( 'arm' );
	folder.add( posture.forearmRightTurn.value, 'x', -1.5, 3 ).name( 'forearm' );
	folder.add( posture.wristRightTurn.value, 'x', -0.5, 0.5 ).name( 'wrist' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.armRightTurn.value, 'z', -1.5, 1.7 ).name( 'arm' );
	folder.add( posture.wristRightTurn.value, 'y', -0.4, 0.6 ).name( 'wrist' ); // axis swapped

	return gui;

}



function rigModel( time ) {

	posture.waistTurn.value.set(
		Math.sin( time )/4-0.2,
		Math.cos( time*1.2 )/2,
		Math.sin( time*3 )/2.5
	);

	posture.chestTurn.value.set(
		Math.cos( time*3 )/3,
		Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.headTurn.value.set(
		Math.cos( time*3 )/2,
		Math.sin( time*1.2*2 )/2,
		Math.cos( time*3*1.5 )/3
	);

	posture.kneeLeftTurn.value.set(
		-( Math.cos( time*3 )+1 )/1.5,
		0,
		0,
	);

	posture.kneeRightTurn.value.set(
		-( Math.sin( time*2.4 )+1 )/1.5,
		0,
		0,
	);

	posture.ankleLeftTurn.value.set(
		Math.cos( time*3 )/2,
		0*	Math.cos( time*2.8 )/2,
		Math.cos( time*2.2 )/4,
	);

	posture.ankleRightTurn.value.set(
		Math.sin( time*3.2 )/2,
		0*	Math.cos( time*2.3 )/2,
		Math.sin( time*2.1 )/4,
	);

	posture.legLeftTurn.value.set(
		0,
		2*Math.cos( time*2.8 )-0.5,
		0,
	);

	posture.legRightTurn.value.set(
		0,
		2*Math.cos( time*2.3 )+0.5,
		0,
	);

	posture.hipLeftTurn.value.set(
		( Math.cos( time*3 )/1.5+0.25 ),
		0*Math.cos( time*2.8 )/4,
		-( Math.cos( time*2.2 )+1 )/4,
	);

	posture.hipRightTurn.value.set(
		( Math.sin( time*2.2 )/1.5+0.25 ),
		0*Math.sin( time*3.2 )/4,
		( Math.sin( time*2.6 )+1 )/4,
	);

	posture.elbowLeftTurn.value.set(
		0,
		( Math.cos( time*2-1 )+1 ),
		0,
	);

	posture.elbowRightTurn.value.set(
		0,
		-( Math.sin( time*1.8 )+1 ),
		0,
	);

	posture.forearmLeftTurn.value.set(
		0.5*( Math.cos( time*3.6-1 )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRightTurn.value.set(
		0.5*( Math.sin( time*1.8*3+1 )*1.5+1 ),
		0,
		0,
	);

	posture.wristLeftTurn.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.wristRightTurn.value.set(
		0,
		( Math.cos( time*3.6-1 )*0.5+0.1 ),
		-( Math.cos( time*2.6+1 )*0.7 ),
	);

	posture.armLeftTurn.value.set(
		0.7*( Math.cos( time*3 )/1.5-0.15 ),
		0, //-0.7*( Math.cos( time*2.8 )*1-0.6 ),
		0.7*( Math.cos( time*2.2 ) ),
	);

	posture.armRightTurn.value.set(
		0.7*( Math.sin( time*2.4 )/1.5-0.15 ),
		0, //-0.7*-( Math.cos( time*3.1 )*1-0.6 ),
		0.7*( Math.sin( time*2.7 ) ),
	);

}



function showPivotPoint( index ) {

	model.add( pivot );
	switch ( index ) {

		case 1: pivot.position.copy( posture.headPos.value ); break;
		case 2: pivot.position.copy( posture.chestPos.value ); break;
		case 3: pivot.position.copy( posture.waistPos.value ); break;

		case 11: pivot.position.copy( posture.hipLeftPos.value ); break;
		case 12: pivot.position.copy( posture.legLeftPos.value ); break;
		case 13: pivot.position.copy( posture.kneeLeftPos.value ); break;
		case 14: pivot.position.copy( posture.ankleLeftPos.value ); break;

		case 21: pivot.position.copy( posture.armLeftPos.value ); break;
		case 22: pivot.position.copy( posture.elbowLeftPos.value ); break;
		case 23: pivot.position.copy( posture.forearmLeftPos.value ); break;
		case 24: pivot.position.copy( posture.wristLeftPos.value ); break;

		default: model.remove( pivot );

	}

}




function changePivotPoint( ) {

	pivot.position.copy( posture.hipLeftPos.value );

}



function animationLoop( t ) {

	if ( options.animate ) rigModel( t/1000 );

	controls.update( );
	light.position.copy( camera.position );

	renderer.render( scene, camera );

}


renderer.setAnimationLoop( animationLoop );


if ( DEBUG ) {

	setTimeout( ()=>{

		showPivotPoint( 11 ); changePivotPoint();

	}, 500 );

}


export { createGui, scene };
