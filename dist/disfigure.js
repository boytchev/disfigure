// disfigure v0.0.15

import * as THREE from 'three';
import { Vector3, Box3, MeshPhysicalNodeMaterial, WebGPURenderer, PCFSoftShadowMap, Scene, Color, PerspectiveCamera, DirectionalLight, Mesh, CircleGeometry, MeshLambertMaterial, CanvasTexture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fn, mix, If, uniform, mat3, normalGeometry, transformNormalToView, positionGeometry, vec3, float, min } from 'three/tsl';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, joint, mat ])=>{

	var p = pos.sub( joint.pivot ).mul( mat ).add( joint.pivot );
	return mix( pos, p, joint.locus() );

} );//, { pos: 'vec3', center: 'vec3', amount: 'float', mat: 'mat3', return: 'vec3' } );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, joint, mat ])=>{

	var p = pos.mul( mat );
	return mix( pos, p, joint.locus() );

} );//, { pos: 'vec3', center: 'vec3', amount: 'float', mat: 'mat3', return: 'vec3' } );



// calculate vertices of bent body surface
function tslPositionNode( options ) {

	options.vertex = positionGeometry;
	options.fn = jointRotateMat;

	return disfigure( options );

}



// calculate normals of bent body surface
function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.fn = jointNormalMat;

	return transformNormalToView( disfigure( options ) ).xyz;

}



// implement the actual body bending
//		space - compiled definition of the space around the body
//		posture - collection of angles for body posture
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, posture, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.wristLeft, posture.wristLeftMatrix ) );
		p.assign( fn( p, space.forearmLeft, posture.forearmLeftMatrix ) );
		p.assign( fn( p, space.elbowLeft, posture.elbowLeftMatrix ) );
		p.assign( fn( p, space.armLeft, posture.armLeftMatrix ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.wristRight, posture.wristRightMatrix ) );
		p.assign( fn( p, space.forearmRight, posture.forearmRightMatrix ) );
		p.assign( fn( p, space.elbowRight, posture.elbowRightMatrix ) );
		p.assign( fn( p, space.armRight, posture.armRightMatrix ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head, posture.headMatrix ) );
	p.assign( fn( p, space.chest, posture.chestMatrix ) );
	p.assign( fn( p, space.waist, posture.waistMatrix ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.footLeft, posture.footLeftMatrix ) );
		p.assign( fn( p, space.ankleLeft, posture.ankleLeftMatrix ) );
		p.assign( fn( p, space.ankleLongLeft, posture.ankleLongLeftMatrix ) );
		p.assign( fn( p, space.kneeLeft, posture.kneeLeftMatrix ) );
		p.assign( fn( p, space.legLongLeft, posture.legLongLeftMatrix ) );
		p.assign( fn( p, space.legLeft, posture.legLeftMatrix ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	If( legRight.greaterThan( 0 ), ()=>{

		p.assign( fn( p, space.footRight, posture.footRightMatrix ) );
		p.assign( fn( p, space.ankleRight, posture.ankleRightMatrix ) );
		p.assign( fn( p, space.ankleLongRight, posture.ankleLongRightMatrix ) );
		p.assign( fn( p, space.kneeRight, posture.kneeRightMatrix ) );
		p.assign( fn( p, space.legLongRight, posture.legLongRightMatrix ) );
		p.assign( fn( p, space.legRight, posture.legRightMatrix ) );

	} );

	return p;

} ); // disfigure



// create a default posture
function tslPosture( ) {

	return {


		// TORSO
		head: new Vector3( ),
		chest: new Vector3( ),
		waist: new Vector3( ),

		// TORSO
		headMatrix: uniform( mat3() ),
		chestMatrix: uniform( mat3() ),
		waistMatrix: uniform( mat3() ),

		// LEGS
		kneeLeft: new Vector3( ),
		kneeRight: new Vector3( ),
		ankleLeft: new Vector3( ),
		ankleRight: new Vector3( ),
		footLeft: new Vector3( ),
		footRight: new Vector3( ),
		legLeft: new Vector3( ),
		legLongLeft: new Vector3( ),
		legRight: new Vector3( ),
		legLongRight: new Vector3( ),
		ankleLongLeft: new Vector3( ),
		ankleLongRight: new Vector3( ),

		// LEGS
		kneeLeftMatrix: uniform( mat3() ),
		kneeRightMatrix: uniform( mat3() ),
		ankleLeftMatrix: uniform( mat3() ),
		ankleRightMatrix: uniform( mat3() ),
		footLeftMatrix: uniform( mat3() ),
		footRightMatrix: uniform( mat3() ),
		legLeftMatrix: uniform( mat3() ),
		legLongLeftMatrix: uniform( mat3() ),
		legRightMatrix: uniform( mat3() ),
		legLongRightMatrix: uniform( mat3() ),
		ankleLongLeftMatrix: uniform( mat3() ),
		ankleLongRightMatrix: uniform( mat3() ),

		// ARMS
		elbowLeft: new Vector3( ),
		elbowRight: new Vector3( ),
		forearmLeft: new Vector3( ),
		forearmRight: new Vector3( ),
		wristLeft: new Vector3( ),
		wristRight: new Vector3( ),
		armLeft: new Vector3( ),
		armRight: new Vector3( ),

		// ARMS
		armLeftMatrix: uniform( mat3() ),
		armRightMatrix: uniform( mat3() ),
		elbowLeftMatrix: uniform( mat3() ),
		elbowRightMatrix: uniform( mat3() ),
		forearmLeftMatrix: uniform( mat3() ),
		forearmRightMatrix: uniform( mat3() ),
		wristLeftMatrix: uniform( mat3() ),
		wristRightMatrix: uniform( mat3() ),

	};

}

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



Fn( ()=>{

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

//import { DEBUG_NAME } from "./debug.js";



// calculate actual value from normalized value - the space definition assumes
// overall body sizes are within [0,1000] range, decoding calculates the actual
// value scaled to the actual size
function decode( value, scale, offset=0 ) {

	return scale*value/1000 + offset;

}



// calculate a pivot vector with actual coordinates
function decodePivot( pivot, dims ) {

	return new Vector3(
		decode( pivot[ 0 ], dims.scale, dims.x ),
		decode( pivot[ 1 ], dims.scale, dims.y ),
		decode( pivot[ 2 ], dims.scale, dims.z ),
	);

}



// clone an object and flip its pivot horizontally - this is used for all spaces
// that represent left-right symmetry in human body (e.g. left arm and right arm)
function clone( instance ) {

	var obj = Object.assign( Object.create( instance ), instance );
	obj.pivot = obj.pivot.clone();
	obj.pivot.x *= -1;
	return obj;

}



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY {

	constructor( dims, pivot, rangeY, angle=0, rangeX ) {

		this.pivot = decodePivot( pivot, dims );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

		if ( rangeX ) {

			this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
			this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

		}

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	mirror( ) {

		var obj = clone( this );
		if ( 'minX' in obj ) {

			obj.minX *= -1;
			obj.maxX *= -1;

		}

		return obj;

	} // mirror

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var y = pos.y;
		var z = pos.z;

		if ( this.angle!=0 ) {

			y = y.add( z.sub( this.pivot.z ).div( this.slope ) );

		}

		var k = smoother( this.minY, this.maxY, y );

		if ( 'minX' in this ) {

			k = k.max(
				smoother( this.minX, this.maxX, x.abs().add( y.sub( this.pivot.y ) ) )
			);

		}

		return k;

	} // locus

} // LocusY



// define a vertical planar locus, perpendicular to X; vertically infinite,
// horizontally from minX to maxX
class LocusX {

	constructor( dims, pivot, rangeX, angle=0 ) {

		this.pivot = decodePivot( pivot, dims );

		this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
		this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	mirror( ) {

		var obj = clone( this );

		obj.minX *= -1;
		obj.maxX *= -1;

		return obj;

	} // mirror

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		var min = float( this.minX );
		var max = float( this.maxX );

		if ( this.angle!=0 ) {

			var dz = z.sub( this.pivot.z ).div( this.slope ).max( 0.01 ).mul( x.sign() );
			min = min.sub( dz );
			max = max.add( dz );

		}

		return smoother( min, max, x );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( dims, pivot, rangeX, rangeY ) {

		super( dims, pivot, rangeX );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

	} // constructor

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var y = pos.y;

		var dx = pos.y.sub( this.pivot.y ).div( 4, x.sign() );

		var k = 0.8;

		return float( 1 )
			.mul( smoother( float( this.minX ).sub( dx ), float( this.maxX ).sub( dx ), x ) )
			.mul( min(
				smoother( this.minY, this.minY*k+( 1-k )*this.maxY, y ),
				smoother( this.maxY, this.maxY*k+( 1-k )*this.minY, y ),
			) )
			.pow( 2 );

	} // locus

} // LocusXY



// define custom locus specifically for hips
class LocusT extends LocusXY {

	constructor( dims, pivot, rangeX, rangeY, grown=0 ) {

		super( dims, pivot, rangeX, rangeY );

		this.grown = grown;

	} // constructor

	locus( pos = positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		if ( this.grown==0 ) {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.mul( 1/6 ) );
			var s = vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.13 ).pow( 10 );


		} else {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.abs().mul( 1/2 ) );
			var s = vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.065 ).pow( 10 );

		}

		return float( s )
			.mul(
				x.smoothstep( this.minX, this.maxX ),
				smoother( this.minY, this.maxY, y ).pow( 2 ),
			);

	} // locus

} // LocusT



// the definition of a space around a model including properties of individual
// subspaces that simulate joints
class Space {

	constructor( dims, bodyPartsDef ) {

		const classes = { LocusT: LocusT, LocusX: LocusX, LocusXY: LocusXY, LocusY: LocusY/*, LocusBox:LocusBox*/ };

		// bodyPartsDef = { _:[[rot]], name:[LocusClassName, data], ... }
		var bodyParts = { };
		for ( var name in bodyPartsDef ) if ( name != '_' ) {

			var partClass = classes[ bodyPartsDef[ name ][ 0 ] ];
			bodyParts[ name ] = new partClass( dims, ... bodyPartsDef[ name ].slice( 1 ) );

		}

		// bodyParts = { name:LocusInstance, ... }
		this._ = bodyPartsDef._;

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;

		// legs
		this.kneeLeft = bodyParts?.kneeLeft ?? bodyParts.knee;
		this.kneeRight = bodyParts?.kneeRight ?? bodyParts.knee.mirror();

		this.ankleLeft = bodyParts?.ankleLeft ?? bodyParts.ankle;
		this.ankleRight = bodyParts?.ankleRight ?? bodyParts.ankle.mirror();

		this.ankleLongLeft = bodyParts?.ankleLongLeft ?? bodyParts.ankleLong;
		this.ankleLongRight = bodyParts?.ankleLongRight ?? bodyParts.ankleLong.mirror();

		this.legLongLeft = bodyParts?.legLongLeft ?? bodyParts.legLong;
		this.legLongRight = bodyParts?.legLongRight ?? bodyParts.legLong.mirror();

		this.footLeft = bodyParts?.footLeft ?? bodyParts.foot;
		this.footRight = bodyParts?.footRight ?? bodyParts.foot.mirror();

		this.legLeft = bodyParts?.legLeft ?? bodyParts.leg;
		this.legRight = bodyParts?.legRight ?? bodyParts.leg.mirror();

		// arms
		this.elbowLeft = bodyParts?.elbowLeft ?? bodyParts.elbow;
		this.elbowRight = bodyParts?.elbowRight ?? bodyParts.elbow.mirror();

		this.forearmLeft = bodyParts?.forearmLeft ?? bodyParts.forearm;
		this.forearmRight = bodyParts?.forearmRight ?? bodyParts.forearm.mirror();

		this.wristLeft = bodyParts?.wristLeft ?? bodyParts.wrist;
		this.wristRight = bodyParts?.wristRight ?? bodyParts.wrist.mirror();

		this.armLeft = bodyParts?.armLeft ?? bodyParts.arm;
		this.armRight = bodyParts?.armRight ?? bodyParts.arm.mirror();

	} // Space.constructor

} // Space

var renderer, scene, camera, light, cameraLight, controls, userAnimationLoop, stats, everybody = [];



// creates a default world with all its primary attributes the options parameters
// is a collection of flags that turn on/off specific features:
//
// options.lights		true, whether lights are created
// options.controls		true, whether OrbitControls is created
// options.ground		true, whether ground is created
// options.shadows		true, whether shadows are enabled
// options.stats		false, whether to create stats panel

class World {

	constructor( options ) {

		renderer = new WebGPURenderer( { antialias: true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = options?.shadows ?? true;
		renderer.shadowMap.type = PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		scene = new Scene();
		scene.background = new Color( 'whitesmoke' );

		camera = new PerspectiveCamera( 30, innerWidth/innerHeight );
		camera.position.set( 0, 1, 4 );
		camera.lookAt( 0, 1, 0 );

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		} // stats

		if ( options?.lights ?? true ) {

			light = new DirectionalLight( 'white', 1.5 );
			light.decay = 0;
			light.position.set( 0, 14, 7 );
			if ( options?.shadows ?? true ) {

				light.shadow.mapSize.width = 2048;
				light.shadow.mapSize.height = light.shadow.mapSize.width;
				light.shadow.camera.near = 1;//13;
				light.shadow.camera.far = 50;//18.5;
				light.shadow.camera.left = -5;
				light.shadow.camera.right = 5;
				light.shadow.camera.top = 5;
				light.shadow.camera.bottom = -5;
				light.shadow.normalBias = 0.01;
				light.autoUpdate = false;
				light.castShadow = true;

			} // light shadows

			scene.add( light );

			cameraLight = new DirectionalLight( 'white', 1.5 );
			cameraLight.decay = 0;
			cameraLight.target = scene;
			camera.add( cameraLight );
			scene.add( camera );

		} // lights

		if ( options?.controls ?? true ) {

			controls = new OrbitControls( camera, renderer.domElement );
			controls.enableDamping = true;
			controls.target.set( 0, 0.8, 0 );

		} // controls

		if ( options?.ground ?? true ) {

			// generate ground texture
			var canvas = document.createElement( 'CANVAS' );
			canvas.width = 512/4;
			canvas.height = 512/4;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 256/4, 256/4, 150/4, 0, 2*Math.PI );
			context.fill();

			var ground = new Mesh(
				new CircleGeometry( 50 ),
				new MeshLambertMaterial(
					{
						color: 'antiquewhite',
						transparent: true,
						map: new CanvasTexture( canvas )
					} )
			);
			ground.receiveShadow = true;
			ground.rotation.x = -Math.PI / 2;
			ground.renderOrder = -1;
			scene.add( ground );

		} // ground

		window.addEventListener( "resize", ( /*event*/ ) => {

			camera.aspect = innerWidth/innerHeight;
			camera.updateProjectionMatrix( );
			renderer.setSize( innerWidth, innerHeight );

		} );

		renderer.setAnimationLoop( defaultAnimationLoop );

	} // World.constructor

} // World



class AnimateEvent extends Event {

	#target;
	constructor() {

		super( 'animate' );

	}
	get target() {

		return this.#target;

	}
	set target( t ) {

		this.#target = t;

	}

}

var animateEvent = new AnimateEvent( 'animate' );



// default animation loop that dispatches animation events to the window and to
// each body in the scene

function defaultAnimationLoop( time ) {

	animateEvent.time = time;

	window.dispatchEvent( animateEvent );

	everybody.forEach( ( p )=>{

		p.update( );
		p.dispatchEvent( animateEvent );

	} );

	if ( userAnimationLoop ) userAnimationLoop( time );

	if ( controls ) controls.update( );

	if ( stats ) stats.update( );

	renderer.render( scene, camera );

}



// function to set animation loop, for when the user is scared to use events

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}

// disfigure
//
// The space description of a male 3D model, i.e. 3D locations in space that
// correspond to various body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL$2 = 'man.glb'; // model file



var SPACE$2 = {

	// TORSO
	head: [ 'LocusY', [ 0, 878, -37 ], [ 838, 923 ], 30 ],
	chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 570, -9 ], [ 310, 840 ] ],

	// LEGS
	leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ] ],
	legLong: [ 'LocusY', [ 39, 0, -19 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
	ankle: [ 'LocusY', [ 41, 51, -1 ], [ 97, 10 ], -10],
	ankleLong: [ 'LocusY', [ 51, 206, -29 ], [ 430, -10 ]],
	foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
	forearm: [ 'LocusX', [ 170, 815, -38 ], [ 46, 490 ]],
	wrist: [ 'LocusX', [ 375, 820, -40 ], [ 354, 402 ]],
	arm: [ 'LocusXY', [ 70+15, 810-20, -40 ], [ 30, 150 ], [ 600, 900 ] ],

};

// disfigure
//
// The space description of a female 3D model, i.e. 3D locations in space that
// correspond to various body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL$1 = 'woman.glb';



var SPACE$1 = {

	// TORSO
	head: [ 'LocusY', [ 0, 872, -30 ], [ 827, 919 ], 30 ],
	chest: [ 'LocusY', [ 0, 661, -8 ], [ 438, 929 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 570, -9 ], [ 350, 840 ] ],

	// LEGS
	leg: [ 'LocusT', [ 41, 546, -19 ], [ -2, 2 ], [ 690, 441 ] ],
	legLong: [ 'LocusY', [ 44, 0, -19 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 286, -23 ], [ 341, 218 ], 20 ],
	ankle: [ 'LocusY', [ 44, 51, -4 ], [ 97, 10 ], -10],
	ankleLong: [ 'LocusY', [ 51, 201, -29 ], [ 430, -33 ]],
	foot: [ 'LocusY', [ 0, 20, 12 ], [ 111, -185 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 238, 815, -40 ], [ 230, 260 ], 0 ],
	forearm: [ 'LocusX', [ 170, 815, -38 ], [ 54, 475 ]],
	wrist: [ 'LocusX', [ 359, 815, -34 ], [ 343, 380 ]],
	arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ] ],

};

// disfigure
//
// The space description of a child 3D model, // i.e. 3D locations in space that
// correspond to various body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL = 'child.glb';



var SPACE = {

	// TORSO
	head: [ 'LocusY', [ 0, 850, -32 ], [ 807, 894 ], 30 ],
	chest: [ 'LocusY', [ 0, 640, 1 ], [ 419, 914 ], 0, [40,300] ],
	waist: [ 'LocusY', [ 0, 530, -7 ], [ 285, 836 ] ],

	// LEGS
	leg: [ 'LocusT', [ 40, 521, -9 ], [ -1, 1 ], [ 625, 430 ], 1 ],
	legLong: [ 'LocusY', [ 46, 0, -5 ], [ 700, 140 ] ],
	knee: [ 'LocusY', [ 50, 288, -12 ], [ 346, 221 ], 20 ],
	ankle: [ 'LocusY', [ 54, 48, -14 ], [ 81, 33 ], -10],
	ankleLong: [ 'LocusY', [ 51, 201, -25 ], [ 430, -33 ]],
	foot: [ 'LocusY', [ 0, 20, 6 ], [ 83, -200 ], 120 ],

	// ARMS
	elbow: [ 'LocusX', [ 249, 793, -56 ], [ 230, 273 ], 0 ],
	forearm: [ 'LocusX', [ 170, 794, -59 ], [ 54, 475 ]],
	wrist: [ 'LocusX', [ 398, 802, -57 ], [ 384, 409 ]],
	arm: [ 'LocusXY', [ 80, 793, -40 ], [ 30, 137 ], [ 600, 900 ] ],

};

// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



console.time( 'Preload' );
var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + URL$2 ),
		loader.loadAsync( MODEL_PATH + URL$1 ),
		loader.loadAsync( MODEL_PATH + URL ),
	]
);
console.timeEnd( 'Preload' );



function toRad( x ) {

	return x * ( 2*Math.PI/360 );

}



function toDeg( x ) {

	return x / ( 2*Math.PI/360 );

}



class Joint {

	constructor( model, space, jointX, jointY, jointZ, nameX='x', nameY='y', nameZ='z' ) {

		this.model = model;
		this.pivot = space.pivot;
		this.jointX = jointX;
		this.jointY = jointY ?? jointX;
		this.jointZ = jointZ ?? jointX;
		this.nameX = nameX;
		this.nameY = nameY;
		this.nameZ = nameZ;

	}

	// bend raise turn tilt straddle

	get bend( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set bend( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	get raise( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set raise( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	get turn( ) {

		return toDeg( this.jointY[ this.nameY ]);

	}
	set turn( a ) {

		this.jointY[ this.nameY ] = toRad( a );

	}

	get tilt( ) {

		return toDeg( this.jointZ[ this.nameZ ]);

	}

	set tilt( a ) {

		this.jointZ[ this.nameZ ] = toRad( a );

	}

	get straddle( ) {

		return toDeg( this.jointZ[ this.nameZ ]);

	}

	set straddle( a ) {

		this.jointZ[ this.nameZ ] = toRad( a );

	}

	get foreward( ) {

		return toDeg( this.jointX[ this.nameX ]);

	}

	set foreward( a ) {

		this.jointX[ this.nameX ] = toRad( a );

	}

	attach( mesh ) {

		//mesh.position.copy( this.pivot );
		//mesh.material = this.model.children[0].material;
		//this.model.children[0].add( mesh );
		mesh.matrixAutoUpdate = false;
		this.model.add( mesh );

	}

} // Joint





var m = new THREE.Matrix4(),
	e = new THREE.Euler(),
	_uid = 1;

class Disfigure extends THREE.Group {


	constructor( gltf, space, height ) {

		super();



		// unique number for each body, used to make their motions different
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		// dimensions of the body, including its height
		this.dims = {};
		this.space = {};

		// reduce the hierarchy of the model
		var model = new THREE.Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		centerModel( model, this.dims );

		// create the space around the model
		this.space = new Space( this.dims, space );


		// posture of the body, containing only angles
		this.posture = tslPosture( );

		this.head = new Joint( this, this.space.head, this.posture.head );
		this.chest = new Joint( this, this.space.chest, this.posture.chest );
		this.waist = new Joint( this, this.space.waist, this.posture.waist );

		this.legLeft = new Joint( this, this.space.legLeft, this.posture.legLeft, this.posture.legLongLeft );
		this.kneeLeft = new Joint( this, this.space.kneeLeft, this.posture.kneeLeft );
		this.ankleLeft = new Joint( this, this.space.ankleLeft, this.posture.ankleLeft, this.posture.ankleLongLeft );
		this.footLeft = new Joint( this, this.space.footLeft, this.posture.footLeft );

		this.legRight = new Joint( this, this.space.legRight, this.posture.legRight, this.posture.legLongRight );
		this.kneeRight = new Joint( this, this.space.kneeRight, this.posture.kneeRight );
		this.ankleRight = new Joint( this, this.space.ankleRight, this.posture.ankleRight, this.posture.ankleLongRight );
		this.footRight = new Joint( this, this.space.footRight, this.posture.footRight );

		this.armLeft = new Joint( this, this.space.armLeft, this.posture.armLeft, this.posture.armLeft, this.posture.armLeft, 'y', 'x', 'z' );
		this.elbowLeft = new Joint( this, this.space.elbowLeft, this.posture.elbowLeft, null, null, 'y' );
		this.wristLeft = new Joint( this, this.space.wristLeft, this.posture.wristLeft, this.posture.forearmLeft, this.posture.wristLeft, 'z', 'x', 'y' );

		this.armRight = new Joint( this, this.space.armRight, this.posture.armRight, this.posture.armRight, this.posture.armRight, 'y', 'x', 'z' );
		this.elbowRight = new Joint( this, this.space.elbowRight, this.posture.elbowRight, null, null, 'y' );
		this.wristRight = new Joint( this, this.space.wristRight, this.posture.wristRight, this.posture.forearmRight, this.posture.wristRight, 'z', 'x', 'y' );



		// sets the materials of the model hooking them to TSL functions
		ennodeModel( model, this.space, this.posture,
			{	// nodes
				positionNode: tslPositionNode, // rigging
				normalNode: tslNormalNode, // lighting
				colorNode: Fn( ()=>{

					return vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 );

				} ),
			},
			{	// additional material properties
				metalness: 0,
				roughness: 0.6,
			} );

		// move the model so it stands on plane y=0
		model.position.y = -this.dims.y/2;

		// rescale the model to the desired height (optional)
		if ( height ) {

			model.scale.setScalar( height / this.dims.height );

		}

		model.castShadow = true;
		model.receiveShadow = true;

		this.model = model;
		this.add( model );

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );


	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( matrix, angles, sx, sy, sz, order ) {

			e.set( sx*angles.x, sy*angles.y, sz*angles.z, order );
			m.makeRotationFromEuler( e );
			var s = m.elements;
			matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		anglesToMatrix( this.posture.headMatrix, this.posture.head, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.posture.chestMatrix, this.posture.chest, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.posture.waistMatrix, this.posture.waist, -1, 1, 1, 'YZX' );

		anglesToMatrix( this.posture.elbowLeftMatrix, this.posture.elbowLeft, 0, 1, 0, 'YZX' );
		anglesToMatrix( this.posture.elbowRightMatrix, this.posture.elbowRight, 0, -1, 0, 'YZX' );

		// wrist: tilt bend
		anglesToMatrix( this.posture.wristLeftMatrix, this.posture.wristLeft, 0, 1, 1, 'YZX' );
		anglesToMatrix( this.posture.wristRightMatrix, this.posture.wristRight, 0, -1, -1, 'YZX' );

		// wrist: turn
		anglesToMatrix( this.posture.forearmLeftMatrix, this.posture.forearmLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.forearmRightMatrix, this.posture.forearmRight, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.posture.armLeftMatrix, this.posture.armLeft, -1, 1, 1, 'XZY' );
		anglesToMatrix( this.posture.armRightMatrix, this.posture.armRight, -1, -1, -1, 'XZY' );

		anglesToMatrix( this.posture.kneeLeftMatrix, this.posture.kneeLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.kneeRightMatrix, this.posture.kneeRight, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.posture.ankleLeftMatrix, this.posture.ankleLeft, -1, 0, -1, 'YZX' );
		anglesToMatrix( this.posture.ankleRightMatrix, this.posture.ankleRight, -1, 0, 1, 'YZX' );

		anglesToMatrix( this.posture.ankleLongLeftMatrix, this.posture.ankleLongLeft, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.posture.ankleLongRightMatrix, this.posture.ankleLongRight, 0, 1, 0, 'YZX' );

		anglesToMatrix( this.posture.footLeftMatrix, this.posture.footLeft, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.posture.footRightMatrix, this.posture.footRight, -1, 0, 0, 'YZX' );

		// legs turn
		anglesToMatrix( this.posture.legLongLeftMatrix, this.posture.legLongLeft, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.posture.legLongRightMatrix, this.posture.legLongRight, 0, 1, 0, 'YZX' );

		// leg: foreward ??? straddle
		anglesToMatrix( this.posture.legLeftMatrix, this.posture.legLeft, 1, 0, -1, 'YZX' );
		anglesToMatrix( this.posture.legRightMatrix, this.posture.legRight, 1, 0, 1, 'YZX' );

	}

} // Disfigure



class Man extends Disfigure {

	constructor( height ) {

		super( gltf_man, SPACE$2, height );

		this.url = MODEL_PATH + URL$2;

		this.legLeft.straddle = 5;
		this.legRight.straddle = 5;

		this.ankleLeft.tilt = -5;
		this.ankleRight.tilt = -5;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -5e-3;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( height ) {

		super( gltf_woman, SPACE$1, height );

		this.url = MODEL_PATH + URL$1;

		this.legLeft.straddle = -2.9;
		this.legRight.straddle = -2.9;

		this.ankleLeft.tilt = 2.9;
		this.ankleRight.tilt = 2.9;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -5e-3;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( height ) {

		super( gltf_child, SPACE, height );

		this.url = MODEL_PATH + URL;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -5e-3;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Child.constructor

} // Child

export { Child, Man, Woman, World, camera, cameraLight, chaotic, controls, everybody, light, regular, renderer, scene, setAnimationLoop };
