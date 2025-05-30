﻿
// disfigure
//
// module to construct gui



import * as THREE from "three";
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { uniform } from "three/tsl";



const DEBUG = false;
const DEBUG_JOINT = 0;


const USE_ENV_MAP = false;
const ENV_MAP = '../assets/models/rostock_laage_airport.jpg';


var scene = new THREE.Scene();
scene.background = new THREE.Color( 'whitesmoke' );



var camera = new THREE.PerspectiveCamera( 30, innerWidth/innerHeight );
camera.position.set( -2, 1, 3.5 );
camera.lookAt( scene.position );



var renderer = new THREE.WebGPURenderer( { antialias: true } );
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize( innerWidth, innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener( "resize", ( /*event*/ ) => {

	camera.aspect = innerWidth/innerHeight;
	camera.updateProjectionMatrix( );
	renderer.setSize( innerWidth, innerHeight );

} );



if ( USE_ENV_MAP ) {

	var envMap = new THREE.TextureLoader().load( ENV_MAP );
	envMap.mapping = THREE.EquirectangularReflectionMapping;
	scene.environment = envMap;

}



var controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.zoomSpeed = 10;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 0.5;



var ambientLight = new THREE.AmbientLight( 'white', 0 );
scene.add( ambientLight );



var light = new THREE.DirectionalLight( 'white', 2+1 );
light.position.set( 0, 0, 1 );
scene.add( light );





var axis1 = new THREE.AxesHelper();
var axis2 = new THREE.AxesHelper();


var options = {
	animate: false,
};



var debug = {
	reset: rigResetModel,
	randomize: rigRandomModel,
	showPlanes: false,
	x: 0,
	y: 500,
	z: 0,
};
var posture = {};
var space = {};
var model = new THREE.Group();
var gui;

var planes = new THREE.Group();
planes.visible = debug.showPlanes;

function addCuttingPlanes( dims, model ) {

	var grid = new THREE.GridHelper( dims.scale, 10, 'white', 'white' );
	grid.rotation.x = Math.PI/2;

	var geo = new THREE.PlaneGeometry( dims.scale, dims.scale );
	var mat = new THREE.MeshBasicMaterial( {
		color: 'royalblue',
		opacity: 0.5,
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: -1,
		polygonOffsetUnits: -1,
	} );

	var p = new THREE.Mesh( geo, mat );
	p.position.y = 0.5*dims.scale;
	p.add( grid );
	planes.add( p );

	mat = mat.clone();
	mat.color.set( 'green' );
	p = new THREE.Mesh( geo, mat );
	p.rotation.x = -Math.PI/2;
	p.position.y = 0.5*dims.scale;
	p.add( grid.clone() );
	planes.add( p );

	mat = mat.clone();
	mat.color.set( 'tomato' );
	p = new THREE.Mesh( geo, mat );
	p.rotation.y = Math.PI/2;
	p.position.y = 0.5*dims.scale;
	p.add( grid.clone() );
	planes.add( p );

	model.add( planes );

}



function createGui( dims, spaceData, postureData, modelObject ) {

	space = spaceData;

	posture = postureData;
	posture.select = uniform( DEBUG?DEBUG_JOINT:0, 'int' ); // 0..24
	model = modelObject;

	if ( DEBUG ) addCuttingPlanes( dims, model );

	gui = new lil.GUI(); // global gui
	gui.domElement.style.marginRight = 0;

	var mfolder = gui.addFolder( 'DEBUG' );

	if ( !DEBUG ) mfolder.close();

	mfolder.add( posture.select, 'value', {
		Nothing: 0,
		Head: 1, Chest: 2, Waist: 3,
		Hip: 11, Hip2: 15, Leg: 12, Knee: 13, Ankle: 14, Foot: 16,
		Arm: 21, Elbow: 22, Forearm: 23, Wrist: 24,
	} ).name( 'Heatmap' ).onChange( showPivotPoint );

	if ( DEBUG ) {

		mfolder.add( debug, 'showPlanes' ).name( 'Show planes' ).onChange( ( n )=>planes.visible = n );
		mfolder.add( debug, 'x', -600, 600 ).step( 1 ).name( html( 'Red', '' ) ).onChange( ( n )=>planes.children[ 2 ].position.x = n/1000*dims.scale ).name( html( 'Red', '' ) );
		mfolder.add( debug, 'y', -100, 1100 ).step( 1 ).onChange( ( n )=>planes.children[ 1 ].position.y = n/1000*dims.scale ).name( html( 'Green', '' ) );
		mfolder.add( debug, 'z', -500, 500 ).step( 1 ).name( html( 'Blue', '' ) ).onChange( ( n )=>planes.children[ 0 ].position.z = n/1000*dims.scale );
		// mfolder.add( space.hipLeftPos.value, 'y', 1, 3 ).name( 'py' ).onChange( changePivotPoint );
		// mfolder.add( space.hipLeftPos.value, 'z', -0.5, 0.5 ).name( 'pz' ).onChange( changePivotPoint );
		// mfolder.add( space.hipLeftSpan.value, 'x', 1, 3 ).name( 'sx' ).onChange( changePivotPoint );
		// mfolder.add( space.hipLeftSpan.value, 'y', 1, 2 ).name( 'sy' ).onChange( changePivotPoint );
		//		mfolder.add( space.hipLeftSpan.value, 'z', 1, 3 ).name( 'sz' ).onChange( changePivotPoint );
		//		mfolder.add( space.hipLeftSpan.value, 'w', -2, 2 ).name( 'sw' ).onChange( changePivotPoint );

	}

	mfolder.add( options, 'animate', false ).name( 'Animate' );
	mfolder.add( debug, 'reset' ).name( 'Reset' );
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

		mfolder.add( posture.waist.value, 'x', -1.0, 0.6 ).name( html( 'Waist', '&#x2195;', 'border' ) );
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
		mfolder.add( posture.legLeft.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );
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
		mfolder.add( posture.legRight.value, 'y', -1, 1 ).name( html( '', '&#x2194;' ) );
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



function rigModel( time2 ) {

	var time = time2; //+ Math.sin( 7*time2 )/6;

	//model.rotation.set( 0.5*Math.sin( time ), time, 0.5*Math.cos( time ) );

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



function rigRandomModel( seed = THREE.MathUtils.randInt( Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER ) ) {

	THREE.MathUtils.seededRandom( seed );

	function rand( from=-1, to=1 ) {

		return THREE.MathUtils.seededRandom() * ( to-from ) + from;

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



function rigResetModel( ) {

	model.rotation.y = 0;

	posture.waist.value.set( 0, 0, 0 );
	posture.chest.value.set( 0, 0, 0 );
	posture.head.value.set( 0, 0, 0 );
	posture.kneeLeft.value.set( 0, 0, 0 );
	posture.kneeRight.value.set( 0, 0, 0 );
	posture.footLeft.value.set( 0, 0, 0 );
	posture.footRight.value.set( 0, 0, 0 );
	posture.ankleLeft.value.set( 0, 0, 0 );
	posture.ankleRight.value.set( 0, 0, 0 );
	posture.legLeft.value.set( 0, 0, 0 );
	posture.legRight.value.set( 0, 0, 0 );
	posture.hipLeft.value.set( 0, 0, 0 );
	posture.hip2Left.value.set( 0, 0, 0 );
	posture.hipRight.value.set( 0, 0, 0 );
	posture.hip2Right.value.set( 0, 0, 0 );
	posture.elbowLeft.value.set( 0, 0, 0 );
	posture.elbowRight.value.set( 0, 0, 0 );
	posture.forearmLeft.value.set( 0, 0, 0 );
	posture.forearmRight.value.set( 0, 0, 0 );
	posture.wristLeft.value.set( 0, 0, 0 );
	posture.wristRight.value.set( 0, 0, 0 );
	posture.armLeft.value.set( 0, 0, 0 );
	posture.armRight.value.set( 0, 0, 0 );

	updateGUI( );

}



function showPivotPoint( index ) {

	model.add( axis1 );
	if ( index<10 )
		model.remove( axis2 );
	else
		model.add( axis2 );

	switch ( index ) {

		case 1:	axis1.position.copy( space.head.pivot ); break;
		case 2:	axis1.position.copy( space.chest.pivot ); break;
		case 3:	axis1.position.copy( space.waist.pivot ); break;

		case 11:axis1.position.copy( space.hipLeft.pivot );
			axis2.position.copy( space.hipRight.pivot ); break;
		case 15:axis1.position.copy( space.hip2Left.pivot );
			axis2.position.copy( space.hip2Right.pivot ); break;
		case 12:axis1.position.copy( space.legLeft.pivot );
			axis2.position.copy( space.legRight.pivot ); break;
		case 13:axis1.position.copy( space.kneeLeft.pivot );
			axis2.position.copy( space.kneeRight.pivot ); break;
		case 14:axis1.position.copy( space.ankleLeft.pivot );
			axis2.position.copy( space.ankleRight.pivot ); break;
		case 16:axis1.position.copy( space.footLeft.pivot );
			axis2.position.copy( space.footRight.pivot ); break;

		case 21:axis1.position.copy( space.armLeft.pivot );
			axis2.position.copy( space.armRight.pivot ); break;
		case 22:axis1.position.copy( space.elbowLeft.pivot );
			axis2.position.copy( space.elbowRight.pivot ); break;
		case 23:axis1.position.copy( space.forearmLeft.pivot );
			axis2.position.copy( space.forearmRight.pivot ); break;
		case 24:axis1.position.copy( space.wristLeft.pivot );
			axis2.position.copy( space.wristRight.pivot ); break;

		default: model.remove( axis1 ); model.remove( axis2 );

	}

}




function changePivotPoint( ) {

	//	pivot.position.copy( space.hipLeftPos.value );

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



// extract credits and place them in DOM element
// replaces the resource url extension with "txt"
// e.g. my-model.glb -> my-model.txt
function credits( url, id ) {

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {

		if ( this.readyState == 4 && this.status == 200 )
			document.getElementById( id ).innerHTML = this.responseText.split( '||' )[ 0 ];

	};

	url = url.split( '.' );
	url.pop();
	url.push( 'txt' );
	url = url.join( '.' );

	xhttp.open( "GET", url, true );
	xhttp.send();

}



if ( DEBUG ) {

	setTimeout( ()=>{

		showPivotPoint( DEBUG_JOINT );
		changePivotPoint();

	}, 500 );

}


export { createGui, addCuttingPlanes, scene, credits };
