
// disfigure
//
// module to construct gui



import * as THREE from "three";
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { /*float, Fn, If, mix, select,*/ uniform/*, vec3 */ } from "three/tsl";
import { LocusT, LocusX } from "../src/space.js";
import { scene, setAnimationLoop, World, light } from "../src/world.js";
import { chaotic } from "../src/motion.js";
import { Joint, Man } from "../src/body.js";
import { DEBUG, DEBUG_JOINT, DEBUG_NAME } from "./debug.js";
import { init as initHandlers, reset as resetHandlers, update as updateHandlers, toggleRotPos } from "./handles.js";



new World();
var model = new Man();

initHandlers( model );


var debugSpace;

var menu = document.getElementById( 'menu' );
var buttons = document.getElementById( 'buttons' );

menu.addEventListener( 'click', showMenu );

function showMenu() {

	menu.style.display='none';
	buttons.style.display='block';

}

function hideMenu() {

	menu.style.display='block';
	buttons.style.display='none';

}

// extract credits and place them in DOM element
// replaces the resource url extension with "txt"
// e.g. my-model.glb -> my-model.txt
// function credits( url, id ) {

// var xhttp = new XMLHttpRequest();
// xhttp.onreadystatechange = function () {

// if ( this.readyState == 4 && this.status == 200 )
// document.getElementById( id ).innerHTML = this.responseText.split( '||' )[ 0 ];

// };

// url = url.split( '.' );
// url.pop();
// url.push( 'txt' );
// url = url.join( '.' );

// xhttp.open( "GET", url, true );
// xhttp.send();

// }

// credits( model.url, 'credits1' );



for ( var name of Object.keys( model.space ) ) {

	if ( model.space[ name ]?.pivot )
		model.space[ name ].pivot = uniform( model.space[ name ].pivot );

}

if ( DEBUG_NAME ) {

	debugSpace = model.space[ DEBUG_NAME ];

	if ( debugSpace instanceof LocusX && !( debugSpace instanceof LocusT ) ) {

		debugSpace.minX = uniform( debugSpace.minX );
		debugSpace.maxX = uniform( debugSpace.maxX );

	} else {

		debugSpace.minY = uniform( debugSpace.minY );
		debugSpace.maxY = uniform( debugSpace.maxY );

	}

} // DEBUG_NAME



const USE_ENV_MAP = false;
const ENV_MAP = '../../assets/models/envmap.jpg';



if ( USE_ENV_MAP ) {

	var envMap = new THREE.TextureLoader().load( ENV_MAP );
	envMap.mapping = THREE.EquirectangularReflectionMapping;
	scene.environment = envMap;

}



var axis1 = new THREE.AxesHelper( 60 );
var axis2 = new THREE.AxesHelper( 60 );


var options = {
	animate: false,
};



var debug = {
	reset: rigResetModel,
	randomize: rigRandomModel,
	showPlanes: false,
	x: 0,
	y: 0,
	z: 0,
	minY: 0,
	maxY: 0,
};


var gui;


document.getElementById( 'reset' ).addEventListener( 'click', rigResetModel );
document.getElementById( 'get' ).addEventListener( 'click', rigGetModel );
document.getElementById( 'set' ).addEventListener( 'click', rigSetModel );
document.getElementById( 'rotpos' ).addEventListener( 'click', ()=>{hideMenu(); toggleRotPos();} );

rigResetModel( false );


var planes = new THREE.Group();
planes.visible = debug.showPlanes;

function addCuttingPlanes( dims, model ) {

	var grid = new THREE.GridHelper( 2, 10, 'white', 'white' );
	grid.rotation.x = Math.PI/2;

	var geo = new THREE.PlaneGeometry( 2, 2 );
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
	//	p.position.y = 0.5*dims.scale;
	p.add( grid );
	planes.add( p );

	mat = mat.clone();
	mat.color.set( 'green' );
	p = new THREE.Mesh( geo, mat );
	p.rotation.x = -Math.PI/2;
	//	p.position.y = 0.5*dims.scale;
	p.add( grid.clone() );
	planes.add( p );

	mat = mat.clone();
	mat.color.set( 'tomato' );
	p = new THREE.Mesh( geo, mat );
	p.rotation.y = Math.PI/2;
	//	p.position.y = 0.5*dims.scale;
	p.add( grid.clone() );
	planes.add( p );

	planes.position.x = 0;
	planes.position.y = 0;
	planes.position.z = 0;
	model.add( planes );

}



function updateDebug() {

	if ( debugSpace instanceof LocusX && !( debugSpace instanceof LocusT ) ) {

		//		debug.minY = debugSpace.minX.value ?? debugSpace.minX;
		//		debug.maxY = debugSpace.maxX.value ?? debugSpace.maxX;

	} else {

		//		debug.minY = debugSpace.minY.value ?? debugSpace.minY;
		//		debug.maxY = debugSpace.maxY.value ?? debugSpace.maxY;

	}

	debug.x = debugSpace.pivot.value.x;
	debug.y = debugSpace.pivot.value.y;
	debug.z = debugSpace.pivot.value.z;

}

function createGui( ) {

	model.space.select = uniform( DEBUG?DEBUG_JOINT:0, 'int' ); // 0..24


	if ( DEBUG ) {

		updateDebug();
		addCuttingPlanes( model.dims, model );

	}

	gui = new lil.GUI(); // global gui
	gui.domElement.style.marginRight = 0;
	gui.domElement.style.display = 'none';

	var folder = gui.addFolder( 'DEBUG' );

	if ( !DEBUG ) folder.close();


	folder.add( model.space.select, 'value', {
		Torso: 0,
		' &#x22B8; Head': 1, ' &#x22B8; Chest': 2, ' &#x22B8; Waist': 3,
		Leg: 11, ' &#x22B8; Thigh': 12, ' &#x22B8; Knee': 13, ' &#x22B8; Shin': 14, ' &#x22B8; Ankle': 15, ' &#x22B8; Foot': 16,
		Arm: 21, ' &#x22B8; Elbow': 22, ' &#x22B8; Forearm': 23, ' &#x22B8; Wrist': 24,
	} ).name( 'Heatmap' ).onChange( showPivotPoint );

	if ( DEBUG ) {

		//mfolder.add( debug, 'showPlanes' ).name( 'Show planes' ).onChange( ( n )=>planes.visible = n );
		//mfolder.add( debug, 'x', -600, 600 ).step( 1 ).name( html( 'Red', '' ) ).onChange( ( n )=>planes.children[ 2 ].position.x = n/1000*dims.scale ).name( html( 'Red', '' ) );
		//mfolder.add( debug, 'y', -100, 1100 ).step( 1 ).onChange( ( n )=>planes.children[ 1 ].position.y = (n-500)/1000*dims.scale ).name( html( 'Green', '' ) );
		//mfolder.add( debug, 'z', -500, 500 ).step( 1 ).name( html( 'Blue', '' ) ).onChange( ( n )=>planes.children[ 0 ].position.z = n/1000*dims.scale );

		folder.add( debug, 'x', -2, 2 ).name( html( 'Pivot', 'x' ) ).onChange( changePivotPoint );
		folder.add( debug, 'y', -1, 2 ).name( html( '', 'y' ) ).onChange( changePivotPoint );
		folder.add( debug, 'z', -1, 1 ).name( html( '', 'z' ) ).onChange( changePivotPoint );

		//		folder.add( debug, 'minY', -2, 3 ).name( html( 'Range', 'min' ) ).onChange( changePivotPoint );
		//		folder.add( debug, 'maxY', -2, 3 ).name( html( '', 'max' ) ).onChange( changePivotPoint );

	}

	folder.add( options, 'animate', false ).name( 'Animate' );
	folder.add( debug, 'reset' ).name( 'Reset' );
	folder.add( debug, 'randomize' ).name( 'Randomize' );


	function html( name, icon, classes='' ) {

		return `<div class="padded ${classes}">${name} &nbsp; <span class="icon">${icon}</span></div>`;

	}


	gui.close();

	folder = gui.addFolder( 'TORSO' ).close();
	{

		folder.add( model.torso, 'bend', -200, 200 ).name( html( 'Torso', 'bend' ) );
		folder.add( model.torso, 'turn', -200, 200 ).name( html( '', 'turn' ) );
		folder.add( model.torso, 'tilt', -200, 200 ).name( html( '', 'tilt' ) );

		folder.add( model.head, 'bend', -60, 40 ).name( html( 'Head', 'bend' ) );
		folder.add( model.head, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.head, 'tilt', -35, 35 ).name( html( '', 'tilt' ) );

		folder.add( model.chest, 'bend', -20, 40 ).name( html( 'Chest', 'bend', 'border' ) );
		folder.add( model.chest, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.chest, 'tilt', -30, 30 ).name( html( '', 'tilt' ) );

		folder.add( model.waist, 'bend', -20, 40 ).name( html( 'Waist', 'bend', 'border' ) );
		folder.add( model.waist, 'tilt', -30, 30 ).name( html( '', 'tilt' ) );
		folder.add( model.waist, 'turn', -60, 60 ).name( html( '', 'turn' ) );

	}

	folder = gui.addFolder( 'LEFT LEG' ).close();
	{

		folder.add( model.l_leg, 'foreward', -40, 120 ).name( html( 'Leg', 'foreward' ) );
		/*folder.add( model.l_leg, 'turn', -10, 90 ).name( html( '', 'turn' ) );-@@*/
		folder.add( model.l_leg, 'straddle', -10, 90 ).name( html( '', 'straddle' ) );

		folder.add( model.l_thigh, 'turn', -40, 80 ).name( html( 'Thigh', 'turn', 'border' ) );

		folder.add( model.l_knee, 'bend', 0, 140 ).name( html( 'Knee', 'bend', 'border' ) );
		folder.add( model.l_knee, 'tilt', -20, 20 ).name( html( '', 'tilt' ) );

		folder.add( model.l_shin, 'turn', -60, 60 ).name( html( 'Shin', 'turn', 'border' ) );

		folder.add( model.l_ankle, 'bend', -40, 70 ).name( html( 'Ankle', 'bend', 'border' ) );
		folder.add( model.l_ankle, 'tilt', -40, 40 ).name( html( '', 'tilt' ) );

		folder.add( model.l_foot, 'bend', -40, 40 ).name( html( 'Foot', 'bend', 'border' ) );

	}

	folder = gui.addFolder( 'RIGHT LEG' ).close();
	{

		folder.add( model.r_leg, 'foreward', -40, 120 ).name( html( 'Leg', 'foreward' ) );
		/*folder.add( model.r_leg, 'turn', -10, 90 ).name( html( '', 'turn' ) );-@@*/
		folder.add( model.r_leg, 'straddle', -10, 90 ).name( html( '', 'straddle' ) );

		folder.add( model.r_thigh, 'turn', -40, 80 ).name( html( 'Thigh', 'turn', 'border' ) );

		folder.add( model.r_knee, 'bend', 0, 140 ).name( html( 'Knee', 'bend', 'border' ) );
		folder.add( model.r_knee, 'tilt', -20, 20 ).name( html( '', 'tilt' ) );

		folder.add( model.r_shin, 'turn', -60, 60 ).name( html( 'Shin', 'turn', 'border' ) );

		folder.add( model.r_ankle, 'bend', -40, 70 ).name( html( 'Ankle', 'bend', 'border' ) );
		folder.add( model.r_ankle, 'tilt', -40, 40 ).name( html( '', 'tilt' ) );

		folder.add( model.r_foot, 'bend', -40, 40 ).name( html( 'Foot', 'bend', 'border' ) );

	}

	folder = gui.addFolder( 'LEFT ARM' ).close();
	{

		folder.add( model.l_arm, 'straddle', -45, 80 ).name( html( 'Arm', 'straddle' ) );
		folder.add( model.l_arm, 'turn', -40, 40 ).name( html( '', 'turn' ) );
		folder.add( model.l_arm, 'foreward', -30, 80 ).name( html( '', 'foreward' ) );

		folder.add( model.l_elbow, 'bend', 0, 140 ).name( html( 'Elbow', 'bend', 'border' ) );

		folder.add( model.l_forearm, 'turn', -60, 60 ).name( html( 'Forearm', 'turn', 'border' ) );

		folder.add( model.l_wrist, 'bend', -90, 90 ).name( html( 'Wrist', 'bend', 'border' ) );
		folder.add( model.l_wrist, 'tilt', -45, 45 ).name( html( '', 'tilt' ) );

	}

	folder = gui.addFolder( 'RIGHT ARM' ).close();
	{

		folder.add( model.r_arm, 'straddle', -45, 80 ).name( html( 'Arm', 'straddle' ) );
		folder.add( model.r_arm, 'turn', -40, 40 ).name( html( '', 'turn' ) );
		folder.add( model.r_arm, 'foreward', -30, 80 ).name( html( '', 'foreward' ) );

		folder.add( model.r_elbow, 'bend', 0, 140 ).name( html( 'Elbow', 'bend', 'border' ) );

		folder.add( model.r_forearm, 'turn', -60, 60 ).name( html( 'Forearm', 'turn', 'border' ) );

		folder.add( model.r_wrist, 'bend', -90, 90 ).name( html( 'Wrist', 'bend', 'border' ) );
		folder.add( model.r_wrist, 'tilt', -45, 45 ).name( html( '', 'tilt' ) );

	}

	return gui;

}



function rigModel( t ) {

	t = t/2000;

	model.torso.bend = chaotic( t/3, 111, -120, 120 );
	model.torso.turn = chaotic( t/3, -24, -180, 180 );
	model.torso.tilt = chaotic( t/3, 72, -120, 120 );

	model.head.bend = chaotic( t, 0, -60, 40 );
	model.head.turn = chaotic( t, 4, -60, 60 );
	model.head.tilt = chaotic( t, 2, -35, 35 );

	model.chest.bend = chaotic( t, 1, -20, 40 );
	model.chest.turn = chaotic( t, 6, -60, 60 );
	model.chest.tilt = chaotic( t, 6, -30, 30 );

	model.waist.bend = chaotic( t, 3, -20, 40 );
	model.waist.turn = chaotic( t, 5, -60, 60 );
	model.waist.tilt = chaotic( t, 6, -30, 30 );



	model.l_elbow.bend = chaotic( t, 9, 0, 140 );
	model.r_elbow.bend = chaotic( t, 7, 0, 140 );

	model.l_wrist.bend = chaotic( t, -2, -60, 60 );
	model.l_wrist.turn = chaotic( t, -3, -45, 45 );
	model.l_wrist.tilt = chaotic( t, -2, -40, 40 );

	model.r_wrist.bend = chaotic( t, -1, -60, 60 );
	model.r_wrist.turn = chaotic( t, -4, -45, 45 );
	model.r_wrist.tilt = chaotic( t, -1, -40, 40 );

	model.l_arm.straddle = chaotic( t, 5, -50, 40 );
	model.l_arm.turn = chaotic( t, 6, -20, 20 );
	model.l_arm.foreward = chaotic( t, 7, -20, 80 );

	model.r_arm.straddle = chaotic( t, -5, -50, 40 );
	model.r_arm.turn = chaotic( t, -6, -20, 20 );
	model.r_arm.foreward = chaotic( t, -7, -20, 80 );



	model.l_knee.bend = chaotic( t, 6, 0, 140 );
	model.r_knee.bend = chaotic( t, 0, 0, 140 );

	model.l_foot.bend = chaotic( t, 7, -40, 40 );
	model.r_foot.bend = chaotic( t, 5, -40, 40 );

	model.l_ankle.bend = chaotic( t, -31, -40, 70 );
	model.l_ankle.turn = chaotic( t, 22, 0, 70 );
	model.l_ankle.tilt = chaotic( t, -2, -40, 40 );

	model.r_ankle.bend = chaotic( t, 1, -40, 70 );
	model.r_ankle.turn = chaotic( t, -11, 0, 70 );
	model.r_ankle.tilt = chaotic( t, -13, -40, 40 );

	model.l_thigh.turn = chaotic( t, 8, -40, 80 );
	model.l_leg.straddle = chaotic( t, -8, 0, 40 );
	model.l_leg.foreward = chaotic( t, -2, -40, 80 );

	model.r_thigh.turn = chaotic( t, -1, -40, 80 );
	model.r_leg.straddle = chaotic( t, -3, 0, 40 );
	model.r_leg.foreward = chaotic( t, 4, -40, 80 );

	updateGUI( );

}



function rigRandomModel( ) {

	rigModel( Math.random()*10000 );
	model.torso.turn += Math.random( )-0.2;

	for ( var name of Object.keys( model ) ) {

		if ( model[ name ] instanceof Joint ) {

			model[ name ].bend = Math.round( model[ name ].bend );
			model[ name ].turn = Math.round( model[ name ].turn );
			model[ name ].tilt = Math.round( model[ name ].tilt );

		}

	}

	updateGUI();

}



function rigResetModel( ask=true ) {

	hideMenu();

	if ( !ask || confirm( 'Reset the posture to the default T-pose?' ) == true ) {

		//camera.position.set( 0, 1.5, 4 );

		model.rotation.y = 0;
		for ( var name of Object.keys( model ) ) {

			if ( model[ name ]?.rotation ) model[ name ].rotation.set( 0, 0, 0 ); //.//
			if ( model[ name ]?.angle?.isVector3 )
				model[ name ].angle.set( 0, 0, 0 );

		}

		resetHandlers( );
		updateGUI( );

	}

}



function rigGetModel( ) {

	hideMenu();

	if ( !model ) return;

	if ( navigator.clipboard.writeText ) {

		navigator.clipboard.writeText( model.postureString );
		alert( 'The current posture is copied to the clipboard.' );

	} else {

		prompt( 'The current posture is shown below. Copy it to the clipboard.', model.postureString );

	}

}



function rigSetModel( ) {

	hideMenu();

	if ( !model ) return;

	var string = prompt( 'Set the posture to:', '{"version":8,"position":...}' );

	if ( string ) {

		var oldPosture = model.posture;

		try {

			model.posture = JSON.parse( string );

		} catch {

			model.posture = oldPosture;
			alert( 'The provided posture was either invalid or impossible to understand.' );

		}

		//renderer.render( scene, camera );

	}

}



function showPivotPoint( index ) {

	if ( !DEBUG ) return;

	model.add( axis1 );
	if ( index<10 )
		model.remove( axis2 );
	else
		model.add( axis2 );

	var space = model.space;
	switch ( index ) {

		case 1:
			debugSpace = space.head;
			axis1.position.copy( space.head.pivot.value );
			break;
		case 2:
			debugSpace = space.chest;
			axis1.position.copy( space.chest.pivot.value );
			break;
		case 3:
			debugSpace = space.waist;
			axis1.position.copy( space.waist.pivot.value );
			break;

		case 11:
			debugSpace = space.l_leg;
			axis1.position.copy( space.l_leg.pivot.value );
			axis2.position.copy( space.r_leg.pivot.value );
			break;
		case 12:
			debugSpace = space.l_thigh;
			axis1.position.copy( space.l_thigh.pivot.value );
			axis2.position.copy( space.r_thigh.pivot.value );
			break;
		case 14:
			debugSpace = space.l_shin;
			axis1.position.copy( space.l_shin.pivot.value );
			axis2.position.copy( space.r_shin.pivot.value );
			break;
		case 13:
			debugSpace = space.l_knee;
			axis1.position.copy( space.l_knee.pivot.value );
			axis2.position.copy( space.r_knee.pivot.value );
			break;
		case 15:
			debugSpace = space.l_ankle;
			axis1.position.copy( space.l_ankle.pivot.value );
			axis2.position.copy( space.r_ankle.pivot.value );
			break;
		case 16:
			debugSpace = space.l_foot;
			axis1.position.copy( space.l_foot.pivot.value );
			axis2.position.copy( space.r_foot.pivot.value );
			break;

		case 21:
			debugSpace = space.l_arm;
			axis1.position.copy( space.l_arm.pivot.value );
			axis2.position.copy( space.r_arm.pivot.value );
			break;
		case 22:
			debugSpace = space.l_elbow;
			axis1.position.copy( space.l_elbow.pivot.value );
			axis2.position.copy( space.r_elbow.pivot.value );
			break;
		case 23:
			debugSpace = space.l_forearm;
			axis1.position.copy( space.l_forearm.pivot.value );
			axis2.position.copy( space.r_forearm.pivot.value );
			break;
		case 24:
			debugSpace = space.l_wrist;
			axis1.position.copy( space.l_wrist.pivot.value );
			axis2.position.copy( space.r_wrist.pivot.value );
			break;

		default: model.remove( axis1 ); model.remove( axis2 );

	}

	updateDebug();
	updateGUI();

}



function changePivotPoint( ) {

	var space = model.space[ DEBUG_NAME ];

	space.pivot.value.x = debug.x;
	space.pivot.value.y = debug.y;
	space.pivot.value.z = debug.z;

	axis1.position.copy( space.pivot.value );

	if ( space instanceof LocusX && !( space instanceof LocusT ) ) {

		space.minX.value = debug.minY;
		space.maxX.value = debug.maxY;

	} else {

		space.minY.value = debug.minY;
		space.maxY.value = debug.maxY;

	}

	model.material.needsUpdate = true;
	model.update( );

}




function updateGUI( ) {

	if ( gui )
		for ( var ctrl of gui.controllersRecursive() ) ctrl.updateDisplay( );

}



function animationLoop( t ) {

	if ( options.animate ) rigModel( t );
	updateHandlers();
	updateGUI( );

}


setAnimationLoop( animationLoop );



if ( DEBUG ) {

	setTimeout( ()=>{

		showPivotPoint( DEBUG_JOINT );
		changePivotPoint();

	}, 500 );

}







// dubug function used to mark areas on the 3D model
/*
var tslSelectionNode = Fn( ( { space } )=>{

	var s = space.select;
	var k = float( 0 )
		.add( space.head.locus( ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( space.chest.locus( ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( space.waist.locus( ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( space.l_leg.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( space.r_leg.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )

		.add( space.l_shin.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( space.r_shin.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		.add( space.l_knee.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( space.r_knee.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )

		.add( space.l_ankle.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )
		.add( space.r_ankle.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( space.l_foot.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( space.r_foot.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )

		.add( space.l_thigh.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( space.r_thigh.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )

		.add( space.l_arm.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( space.r_arm.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )

		.add( space.l_elbow.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( space.r_elbow.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )

		.add( space.l_forearm.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( space.r_forearm.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )

		.add( space.l_wrist.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )
		.add( space.r_wrist.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		.clamp( 0, 1 )
		.toVar( );

	var color = mix( vec3( 0, 0.25, 1.5 ), vec3( 1.5, 0, 0 ), k ).mul( 2 ).toVar();



	If( k.lessThan( 0.0001 ), ()=>{

		color.assign( vec3( 1 ) );

	} );

	If( k.greaterThan( 0.9999 ), ()=>{

		color.assign( vec3( 1 ) );

	} );

	return color;

} );
*/


createGui( );



//model.material.colorNode = tslSelectionNode( { space: model.space } );
model.material.roughness = -1;//0.2;
model.material.metalness = 0.2;//0.2;
//light.intensity = 0.5;
