
// disfigure
//
// module to construct gui



import * as THREE from "three";
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";



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
//controls.autoRotate = true;
controls.autoRotateSpeed = 3;



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

	var mfolder = gui.addFolder( 'DEBUG' );//.close();

	mfolder.add( posture.select, 'value', {
		Nothing: 0, Head: 1,Chest: 2, Waist: 3, 
		Leg: 11, Knee: 12, Ankle: 13,
		Arm: 21, Elbow: 22, Forearm: 23, Wrist: 24,
	} ).name( 'Mark area' ).onChange( showPivotPoint );

	mfolder.add( posture.legLeftPos.value, 'x', -0.2, 0.2 ).name( 'px' ).onChange( changePivotPoint );
	mfolder.add( posture.legLeftPos.value, 'y', 1.8, 2.5 ).name( 'py' ).onChange( changePivotPoint );
	mfolder.add( posture.legLeftPos.value, 'z', -0.5, 0.5 ).name( 'pz' ).onChange( changePivotPoint );
	mfolder.add( posture.legLeftSpan.value, 'x', 1.7, 3 ).name( 'sx' ).onChange( changePivotPoint );
	mfolder.add( posture.legLeftSpan.value, 'y', 1.5, 3 ).name( 'sy' ).onChange( changePivotPoint );

	mfolder.add( posture.isolated, 'value', { Isolated: 0, Full: 1 } ).name( 'Mark stype' );
	mfolder.add( options, 'animate', false ).name( 'Animate' );

	mfolder = gui.addFolder( 'TORSO' ).close();

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

	mfolder = gui.addFolder( 'LEFT LEG' )//.close();

	var folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.legLeftTurn.value, 'x', -0.5, 1.5 ).name( 'leg' );
	folder.add( posture.kneeLeftTurn.value, 'x', -2.6, 0 ).name( 'knee' );
	folder.add( posture.ankleLeftTurn.value, 'x', -1, 0.7 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.legLeftTurn.value, 'y', -0.75, 0.75 ).name( 'leg' );
	folder.add( posture.ankleLeftTurn.value, 'y', -0.75, 0.75 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.legLeftTurn.value, 'z', -1.4, 0.2 ).name( 'leg' );
	folder.add( posture.ankleLeftTurn.value, 'z', -0.5, 0.5 ).name( 'ankle' );

	mfolder = gui.addFolder( 'RIGHT LEG' ).close();

	var folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.legRightTurn.value, 'x', -0.5, 1.5 ).name( 'leg' );
	folder.add( posture.kneeRightTurn.value, 'x', -2.6, 0 ).name( 'knee' );
	folder.add( posture.ankleRightTurn.value, 'x', -1, 0.7 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.legRightTurn.value, 'y', -0.75, 0.75 ).name( 'leg' );
	folder.add( posture.ankleRightTurn.value, 'y', -0.75, 0.75 ).name( 'ankle' );

	folder = mfolder.addFolder( '&nbsp; &nbsp; Side bend' );
	folder.add( posture.legRightTurn.value, 'z', -0.2, 1.4 ).name( 'leg' ); // swapped
	folder.add( posture.ankleRightTurn.value, 'z', -0.5, 0.5 ).name( 'ankle' );


	mfolder = gui.addFolder( 'LEFT ARM' ).close();

	folder = mfolder.addFolder( '&nbsp; &nbsp; Bend' );
	folder.add( posture.armLeftTurn.value, 'y', -0.5, 2 ).name( 'arm' );
	folder.add( posture.elbowLeftTurn.value, 'y', 0, 2.7 ).name( 'elbow' );
	folder.add( posture.wristLeftTurn.value, 'z', -1.4, 1.4 ).name( 'wrist' ); // axis

	folder = mfolder.addFolder( '&nbsp; &nbsp; Twist' );
	folder.add( posture.armLeftTurn.value, 'x', -0.5, 0.5 ).name( 'arm' );
	folder.add( posture.forearmLeftTurn.value, 'x', -1.5, 3 ).name( 'forearm' );
	folder.add( posture.wristLeftTurn.value, 'x', -0.3, 0.3 ).name( 'wrist' );

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
	folder.add( posture.wristRightTurn.value, 'x', -0.3, 0.3 ).name( 'wrist' );

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
		Math.cos( time*2.8 )/2,
		Math.cos( time*2.2 )/4,
	);

	posture.ankleRightTurn.value.set(
		Math.sin( time*3.2 )/2,
		Math.cos( time*2.3 )/2,
		Math.sin( time*2.1 )/4,
	);


	posture.legLeftTurn.value.set(
		( Math.cos( time*3 )/1.5+0.25 ),
		Math.cos( time*2.8 )/4,
		-( Math.cos( time*2.2 )+1 )/4,
	);

	posture.legRightTurn.value.set(
		( Math.sin( time*2.2 )/1.5+0.25 ),
		Math.sin( time*3.2 )/4,
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
		( Math.cos( time*3.6-1 )*1.5+1 ),
		0,
		0,
	);

	posture.forearmRightTurn.value.set(
		( Math.sin( time*1.8*3+1 )*1.5+1 ),
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
		-0.7*( Math.cos( time*2.8 )*1-0.6 ),
		0.7*( Math.cos( time*2.2 ) ),
	);

	posture.armRightTurn.value.set(
		0.7*( Math.sin( time*2.4 )/1.5-0.15 ),
		-0.7*-( Math.cos( time*3.1 )*1-0.6 ),
		0.7*( Math.sin( time*2.7 ) ),
	);

}



function showPivotPoint( index ) {

	model.add( pivot );
	switch( index )
	{
		case 1: pivot.position.copy( posture.headPos.value ); break;
		case 2: pivot.position.copy( posture.chestPos.value ); break;
		case 3: pivot.position.copy( posture.waistPos.value ); break;
		
		case 11: pivot.position.copy( posture.legLeftPos.value ); break;
		case 12: pivot.position.copy( posture.kneeLeftPos.value ); break;
		case 13: pivot.position.copy( posture.ankleLeftPos.value ); break;

		case 21: pivot.position.copy( posture.armLeftPos.value ); break;
		case 22: pivot.position.copy( posture.elbowLeftPos.value ); break;
		case 23: pivot.position.copy( posture.forearmLeftPos.value ); break;
		case 24: pivot.position.copy( posture.wristLeftPos.value ); break;

		default: model.remove( pivot );
	}
}



function changePivotPoint( ) {

	pivot.position.copy( posture.legLeftPos.value );

}



function animationLoop( t ) {

	if ( options.animate ) rigModel( t/1000 );

	controls.update( );
	light.position.copy( camera.position );

	renderer.render( scene, camera );

}


renderer.setAnimationLoop( animationLoop );



setTimeout( ()=>{showPivotPoint(11)}, 500 );



export { createGui, scene };
