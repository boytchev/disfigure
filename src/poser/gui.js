
// disfigure
//
// module to construct gui



import * as THREE from "three";
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { float, Fn, If, mix, select, uniform, vec3 } from "three/tsl";
import { decode, encode, LocusT, LocusX } from "../space.js";
import { scene, setAnimationLoop, World } from "../world.js";
import { chaotic } from "../utils.js";
import { Man } from "../body.js";
import { DEBUG, DEBUG_JOINT, DEBUG_NAME } from "./debug.js";


console.clear( );

new World();
var model = new Man();
var debugSpace;


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

credits( model.url, 'credits1' );



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


rigResetModel( );


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

	planes.position.x = dims.x;
	planes.position.y = dims.y+0.5*dims.scale;
	planes.position.z = dims.z;
	model.add( planes );

}



function updateDebug() {

	var dims = model.dims;

	if ( debugSpace instanceof LocusX && !( debugSpace instanceof LocusT ) ) {

		debug.minY = encode( debugSpace.minX.value, dims.scale, dims.x );
		debug.maxY = encode( debugSpace.maxX.value, dims.scale, dims.x );

	} else {

		debug.minY = encode( debugSpace.minY.value, dims.scale, dims.y );
		debug.maxY = encode( debugSpace.maxY.value, dims.scale, dims.y );

	}

	debug.x = encode( debugSpace.pivot.value.x, dims.scale, dims.x );
	debug.y = encode( debugSpace.pivot.value.y, dims.scale, dims.y );
	debug.z = encode( debugSpace.pivot.value.z, dims.scale, dims.z );

}

function createGui( ) {

	model.posture.select = uniform( DEBUG?DEBUG_JOINT:0, 'int' ); // 0..24


	if ( DEBUG ) {

		updateDebug();
		addCuttingPlanes( model.dims, model );

	}

	gui = new lil.GUI(); // global gui
	gui.domElement.style.marginRight = 0;

	var folder = gui.addFolder( 'DEBUG' );

	if ( !DEBUG ) folder.close();


	folder.add( model.posture.select, 'value', {
		Torso: 0,
		' &#x22B8; Head': 1, ' &#x22B8; Chest': 2, ' &#x22B8; Waist': 3,
		Leg: 11, ' &#x22B8; Leg (ext)': 12, ' &#x22B8; Knee': 13, ' &#x22B8; Ankle': 15, ' &#x22B8; Ankle (ext)': 14, ' &#x22B8; Foot': 16,
		Arm: 21, ' &#x22B8; Elbow': 22, ' &#x22B8; Forearm': 23, ' &#x22B8; Wrist': 24,
	} ).name( 'Heatmap' ).onChange( showPivotPoint );

	if ( DEBUG ) {

		//mfolder.add( debug, 'showPlanes' ).name( 'Show planes' ).onChange( ( n )=>planes.visible = n );
		//mfolder.add( debug, 'x', -600, 600 ).step( 1 ).name( html( 'Red', '' ) ).onChange( ( n )=>planes.children[ 2 ].position.x = n/1000*dims.scale ).name( html( 'Red', '' ) );
		//mfolder.add( debug, 'y', -100, 1100 ).step( 1 ).onChange( ( n )=>planes.children[ 1 ].position.y = (n-500)/1000*dims.scale ).name( html( 'Green', '' ) );
		//mfolder.add( debug, 'z', -500, 500 ).step( 1 ).name( html( 'Blue', '' ) ).onChange( ( n )=>planes.children[ 0 ].position.z = n/1000*dims.scale );

		folder.add( debug, 'x', -500, 500 ).name( html( 'Pivot', 'x' ) ).step( 1 ).onChange( changePivotPoint );
		folder.add( debug, 'y', -100, 1100 ).name( html( '', 'y' ) ).step( 1 ).onChange( changePivotPoint );
		folder.add( debug, 'z', -100, 100 ).name( html( '', 'z' ) ).step( 1 ).onChange( changePivotPoint );

		folder.add( debug, 'minY', -200, 1200 ).name( html( 'Range', 'min' ) ).step( 1 ).onChange( changePivotPoint );
		folder.add( debug, 'maxY', -200, 1200 ).name( html( '', 'max' ) ).step( 1 ).onChange( changePivotPoint );

	}

	folder.add( options, 'animate', false ).name( 'Animate' );
	folder.add( debug, 'reset' ).name( 'Reset' );
	folder.add( debug, 'randomize' ).name( 'Randomize' );


	function html( name, icon, classes='' ) {

		return `<div class="padded ${classes}">${name} &nbsp; <span class="icon">${icon}</span></div>`;

	}


	folder = gui.addFolder( 'TORSO' );//.close();
	{

		folder.add( model.head, 'bend', -60, 40 ).name( html( 'Head', 'bend' ) );
		folder.add( model.head, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.head, 'tilt', -35, 35 ).name( html( '', 'tilt' ) );

		folder.add( model.chest, 'bend', -20, 40 ).name( html( 'Chest', 'bend', 'border' ) );
		folder.add( model.chest, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.chest, 'tilt', -30, 30 ).name( html( '', 'tilt' ) );

		folder.add( model.waist, 'bend', -20, 40 ).name( html( 'Waist', 'bend', 'border' ) );
		folder.add( model.waist, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.waist, 'tilt', -30, 30 ).name( html( '', 'tilt' ) );

	}

	folder = gui.addFolder( 'LEFT LEG' ).close();
	{

		folder.add( model.legLeft, 'foreward', -40, 120 ).name( html( 'Leg', 'foreward' ) );
		folder.add( model.legLeft, 'straddle', -10, 90 ).name( html( '', 'straddle' ) );
		folder.add( model.legLeft, 'turn', -40, 80 ).name( html( '', 'turn' ) );

		folder.add( model.kneeLeft, 'bend', 0, 140 ).name( html( 'Knee', 'bend', 'border' ) );

		folder.add( model.ankleLeft, 'bend', -40, 70 ).name( html( 'Ankle', 'bend', 'border' ) );
		folder.add( model.ankleLeft, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.ankleLeft, 'tilt', -40, 40 ).name( html( '', 'tilt' ) );

		folder.add( model.footLeft, 'bend', -40, 40 ).name( html( 'Foot', 'bend', 'border' ) );

	}

	folder = gui.addFolder( 'RIGHT LEG' ).close();
	{

		folder.add( model.legRight, 'foreward', -40, 120 ).name( html( 'Leg', 'foreward' ) );
		folder.add( model.legRight, 'straddle', -10, 90 ).name( html( '', 'straddle' ) );
		folder.add( model.legRight, 'turn', -40, 80 ).name( html( '', 'turn' ) );

		folder.add( model.kneeRight, 'bend', 0, 140 ).name( html( 'Knee', 'bend', 'border' ) );

		folder.add( model.ankleRight, 'bend', -40, 70 ).name( html( 'Ankle', 'bend', 'border' ) );
		folder.add( model.ankleRight, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.ankleRight, 'tilt', -40, 40 ).name( html( '', 'tilt' ) );

		folder.add( model.footRight, 'bend', -40, 40 ).name( html( 'Foot', 'bend', 'border' ) );

	}

	folder = gui.addFolder( 'LEFT ARM' ).close();
	{

		folder.add( model.armLeft, 'straddle', -45, 80 ).name( html( 'Arm', 'straddle' ) );
		folder.add( model.armLeft, 'turn', -40, 40 ).name( html( '', 'turn' ) );
		folder.add( model.armLeft, 'foreward', -30, 80 ).name( html( '', 'foreward' ) );

		folder.add( model.elbowLeft, 'bend', 0, 140 ).name( html( 'Elbow', 'bend', 'border' ) );

		folder.add( model.wristLeft, 'bend', -90, 90 ).name( html( 'Wrist', 'bend', 'border' ) );
		folder.add( model.wristLeft, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.wristLeft, 'tilt', -45, 45 ).name( html( '', 'tilt' ) );

	}

	folder = gui.addFolder( 'RIGHT ARM' ).close();
	{

		folder.add( model.armRight, 'straddle', -45, 80 ).name( html( 'Arm', 'straddle' ) );
		folder.add( model.armRight, 'turn', -40, 40 ).name( html( '', 'turn' ) );
		folder.add( model.armRight, 'foreward', -30, 80 ).name( html( '', 'foreward' ) );

		folder.add( model.elbowRight, 'bend', 0, 140 ).name( html( 'Elbow', 'bend', 'border' ) );

		folder.add( model.wristRight, 'bend', -90, 90 ).name( html( 'Wrist', 'bend', 'border' ) );
		folder.add( model.wristRight, 'turn', -60, 60 ).name( html( '', 'turn' ) );
		folder.add( model.wristRight, 'tilt', -45, 45 ).name( html( '', 'tilt' ) );

	}

	return gui;

}



function rigModel( t ) {

	t = t/1500;

	model.head.bend = chaotic( t, 0, -60, 40 );
	model.head.turn = chaotic( t, 4, -60, 60 );
	model.head.tilt = chaotic( t, 2, -35, 35 );

	model.chest.bend = chaotic( t, 1, -20, 40 );
	model.chest.turn = chaotic( t, 6, -60, 60 );
	model.chest.tilt = chaotic( t, 6, -30, 30 );

	model.waist.bend = chaotic( t, 3, -20, 40 );
	model.waist.turn = chaotic( t, 5, -60, 60 );
	model.waist.tilt = chaotic( t, 6, -30, 30 );



	model.elbowLeft.bend = chaotic( t, 9, 0, 140 );
	model.elbowRight.bend = chaotic( t, 7, 0, 140 );

	model.wristLeft.bend = chaotic( t, -2, -60, 60 );
	model.wristLeft.turn = chaotic( t, -3, -45, 45 );
	model.wristLeft.tilt = chaotic( t, -2, -40, 40 );

	model.wristRight.bend = chaotic( t, -1, -60, 60 );
	model.wristRight.turn = chaotic( t, -4, -45, 45 );
	model.wristRight.tilt = chaotic( t, -1, -40, 40 );

	model.armLeft.straddle = chaotic( t, 5, -50, 40 );
	model.armLeft.turn = chaotic( t, 6, -20, 20 );
	model.armLeft.foreward = chaotic( t, 7, -20, 80 );

	model.armRight.straddle = chaotic( t, -5, -50, 40 );
	model.armRight.turn = chaotic( t, -6, -20, 20 );
	model.armRight.foreward = chaotic( t, -7, -20, 80 );



	model.kneeLeft.bend = chaotic( t, 6, 0, 140 );
	model.kneeRight.bend = chaotic( t, 0, 0, 140 );

	model.footLeft.bend = chaotic( t, 7, -40, 40 );
	model.footRight.bend = chaotic( t, 5, -40, 40 );

	model.ankleLeft.bend = chaotic( t, -31, -40, 70 );
	model.ankleLeft.turn = chaotic( t, 22, 0, 70 );
	model.ankleLeft.tilt = chaotic( t, -2, -40, 40 );

	model.ankleRight.bend = chaotic( t, 1, -40, 70 );
	model.ankleRight.turn = chaotic( t, -11, 0, 70 );
	model.ankleRight.tilt = chaotic( t, -13, -40, 40 );

	model.legLeft.turn = chaotic( t, 8, -40, 80 );
	model.legLeft.straddle = chaotic( t, -8, 0, 40 );
	model.legLeft.foreward = chaotic( t, -2, -40, 80 );

	model.legRight.turn = chaotic( t, -1, -40, 80 );
	model.legRight.straddle = chaotic( t, -3, 0, 40 );
	model.legRight.foreward = chaotic( t, 4, -40, 80 );

	updateGUI( );

}



function rigRandomModel( ) {

	rigModel( Math.random()*10000 );
	model.rotation.y += Math.random( )-0.2;

	for ( var name of Object.keys( model ) ) {

		if ( model[ name ]?.bend ) {

			model[ name ].bend = Math.round( model[ name ].bend );
			model[ name ].turn = Math.round( model[ name ].turn );
			model[ name ].tilt = Math.round( model[ name ].tilt );

		}

	}

	updateGUI();

}



function rigResetModel( ) {

	model.rotation.y = 0;

	for ( var name of Object.keys( model.posture ) )
		if ( model.posture[ name ].isVector3 )
			model.posture[ name ].set( 0, 0, 0 );

	updateGUI( );

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

		case 11:axis1.position.copy( space.legLeft.pivot.value );
			axis2.position.copy( space.legRight.pivot.value ); break;
		case 12:axis1.position.copy( space.legLongLeft.pivot.value );
			axis2.position.copy( space.legLongRight.pivot.value ); break;
		case 14:axis1.position.copy( space.ankleLongLeft.pivot.value );
			axis2.position.copy( space.ankleLongRight.pivot.value ); break;
		case 13:axis1.position.copy( space.kneeLeft.pivot.value );
			axis2.position.copy( space.kneeRight.pivot.value ); break;
		case 15:axis1.position.copy( space.ankleLeft.pivot.value );
			axis2.position.copy( space.ankleRight.pivot.value ); break;
		case 16:axis1.position.copy( space.footLeft.pivot.value );
			axis2.position.copy( space.footRight.pivot.value ); break;

		case 21:axis1.position.copy( space.armLeft.pivot.value );
			axis2.position.copy( space.armRight.pivot.value ); break;
		case 22:axis1.position.copy( space.elbowLeft.pivot.value );
			axis2.position.copy( space.elbowRight.pivot.value );
			break;
		case 23:axis1.position.copy( space.forearmLeft.pivot.value );
			axis2.position.copy( space.forearmRight.pivot.value ); break;
		case 24:axis1.position.copy( space.wristLeft.pivot.value );
			axis2.position.copy( space.wristRight.pivot.value ); break;

		default: model.remove( axis1 ); model.remove( axis2 );

	}

	updateDebug();
	updateGUI();

}



function changePivotPoint( ) {

	var space = model.space[ DEBUG_NAME ],
		dims = model.dims;

	space.pivot.value.x = decode( debug.x, dims.scale, dims.x );
	space.pivot.value.y = decode( debug.y, dims.scale, dims.y );
	space.pivot.value.z = decode( debug.z, dims.scale, dims.z );

	axis1.position.copy( space.pivot.value );

	if ( space instanceof LocusX && !( space instanceof LocusT ) ) {

		space.minX.value = decode( debug.minY, dims.scale, dims.x );
		space.maxX.value = decode( debug.maxY, dims.scale, dims.x );

	} else {

		space.minY.value = decode( debug.minY, dims.scale, dims.y );
		space.maxY.value = decode( debug.maxY, dims.scale, dims.y );

	}

	model.children[ 0 ].material.needsUpdate = true;
	model.update( );

}




function updateGUI( ) {

	if ( gui )
		for ( var ctrl of gui.controllersRecursive() ) ctrl.updateDisplay( );

}



function animationLoop( t ) {

	if ( options.animate ) rigModel( t );

}


setAnimationLoop( animationLoop );



if ( DEBUG ) {

	setTimeout( ()=>{

		showPivotPoint( DEBUG_JOINT );
		changePivotPoint();

	}, 500 );

}







// dubug function used to mark areas on the 3D model

var tslSelectionNode = Fn( ( { space, posture } )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( space.head.locus( ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( space.chest.locus( ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( space.waist.locus( ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( space.legLeft.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( space.legRight.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )

		.add( space.ankleLongLeft.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( space.ankleLongRight.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		.add( space.kneeLeft.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( space.kneeRight.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )

		.add( space.ankleLeft.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )
		.add( space.ankleRight.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( space.footLeft.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( space.footRight.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )

		.add( space.legLongLeft.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( space.legLongRight.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )

		.add( space.armLeft.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( space.armRight.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )

		.add( space.elbowLeft.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( space.elbowRight.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )

		.add( space.forearmLeft.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( space.forearmRight.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )

		.add( space.wristLeft.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )
		.add( space.wristRight.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )

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



createGui( );


model.children[ 0 ].material.colorNode = tslSelectionNode( { space: model.space, posture: model.posture } );
//model.children[0].material.colorNode = vec3( 1 );
model.children[ 0 ].material.roughness = 0.2;
