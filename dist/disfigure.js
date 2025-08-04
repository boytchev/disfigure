// disfigure v0.0.19

import { Color, WebGPURenderer, PCFSoftShadowMap, Scene, PerspectiveCamera, DirectionalLight, Mesh, CircleGeometry, MeshLambertMaterial, CanvasTexture, Vector3, Matrix3, Matrix4, Vector4, Euler, PlaneGeometry, MeshPhysicalNodeMaterial, MathUtils, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fn, mix, If, transformNormalToView, normalGeometry, positionGeometry, mat3, vec2, float, rotate, vec3, min, select, uniform } from 'three/tsl';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

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



// generate random sequence of numbers in [min.max]
function random( min=-1, max=1 ) {

	return min + ( max-min )*Math.random( );

}



// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, pivot, matrix, locus ])=>{

	var p = pos.sub( pivot ).mul( matrix ).add( pivot );
	return mix( pos, p, locus );

} );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, pivot, matrix, locus ])=>{ // eslint-disable-line no-unused-vars

	var p = pos.mul( matrix );
	return mix( pos, p, locus );

} );



// calculate vertices of bent body surface
function tslPositionNode( joints ) {

	return disfigure( joints, jointRotateMat, positionGeometry );

}



// calculate normals of bent body surface
function tslNormalNode( joints ) {

	return transformNormalToView( disfigure( joints, jointNormalMat, normalGeometry ) );

}


// implement the actual body bending
var disfigure = Fn( ([ joints, fn, p ])=>{

	var p = p.toVar( ),
		space = joints.space;


	function chain( items ) {

		for ( var item of items )
			p.assign( fn( p, space[ item ].pivot, joints[ item ].matrix, space[ item ].locus() ) );

	}

	// LEFT-UPPER BODY

	If( space.l_arm.locus( ), ()=>{

		chain([ 'l_wrist', 'l_forearm', 'l_elbow', 'l_arm' ]);

	} );


	// RIGHT-UPPER BODY

	If( space.r_arm.locus( ), ()=>{

		chain([ 'r_wrist', 'r_forearm', 'r_elbow', 'r_arm' ]);

	} );


	// LEFT-LOWER BODY

	If( space.l_leg.locus( ), ()=>{

		chain([ 'l_foot', 'l_ankle', 'l_shin', 'l_knee', 'l_thigh', 'l_leg' ]);

	} );


	// RIGHT-LOWER BODY

	If( space.r_leg.locus( ), ()=>{

		chain([ 'r_foot', 'r_ankle', 'r_shin', 'r_knee', 'r_thigh', 'r_leg' ]);

	} );


	// CENTRAL BODY AXIS

	chain([ 'head', 'chest', 'waist', 'torso' ]);

	return p;

} ); // disfigure

// simple material based on color, roughness and metalness

var tslSimpleMaterial = Fn( ( { color, roughness, metalness } ) => {

	return mat3(
		color,
		roughness, metalness, 0,
		0, 0, 0
	);

}, { color: 'vec3', roughness: 'float', metalness: 'float', return: 'mat3' } ); // tslSimpleMaterial



// check whether a value is between two values

var between = Fn( ( { value, from, to } ) => {

	return value.greaterThanEqual( from ).and( value.lessThanEqual( to ) );

}, { value: 'float', from: 'float', to: 'float', return: 'float' } ); // between



// mix two mat3'savePreferences

var mixMat3 = Fn( ([ matA, matB, k ]) => {

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', k: 'float', return: 'mat3' } ); // mixMat3



// convert Three.js color to vec3

var _color = new Color();

function toVec3( color ) {

	_color.set( color );

	return vec3( ..._color );

} // toVec3



// generates latex matrix

function latex( color ) {

	return tslSimpleMaterial( toVec3( color ), 0.2, 0.3 );

} // latex



// generates velour matrix

function velour( color ) {

	return tslSimpleMaterial( toVec3( color ).mul( 3 ), 1, 1 );

} // velour



// generates bands of two materials

var bands = Fn( ( { matA, matB, width=float( 0.1 ), options={} } ) => {

	var { balance, blur, angle, polar, x, z } = options;

	var k, p;

	if ( polar ) {

		p = positionGeometry.xz.sub( vec2( x??0, z??0 ) );
		k = p.y.atan( p.x ).div( float( width ).mul( 2 ) ).cos();

	} else {

		p = rotate( positionGeometry.xy, ( angle??0 ) * Math.PI/180 );
		k = p.y.div( width, 1/Math.PI ).cos();

	}

	if ( balance??0 ) k = k.add( balance );
	if ( blur??0.00001 ) k = k.smoothstep( -blur, blur );

	return mixMat3( matA, matB, k );

} ); // bands



// generates a sloped zone within vertical range

var band = Fn( ( { from, to, angleX=float( 0 ), angleZ=float( 0 ) } )=>{

	var p = positionGeometry.toVar();

	p.y.addAssign( p.x.mul( angleX.radians( ).tan() ) );
	p.y.addAssign( p.z.mul( angleZ.radians( ).tan() ) );

	return between( p.y, from, to );

} ); // band



// generates two symmetricals zone within horizontal range

var strip = Fn( ([ from, to ])=>{

	return between( positionGeometry.x.abs(), from, to );

}, { from: 'float', to: 'float', return: 'float' } ); // strip



// generates a zone within z range

var slice = Fn( ([ from, to, angleY=float( 0 ) ])=>{

	var p = positionGeometry.toVar();

	p.z.addAssign( p.y.mul( angleY.radians( ).tan() ) );

	return between( p.z, from, to );

}, { from: 'float', to: 'float', angleY: 'float', return: 'float' } ); // slice



// generates a zone within horizontal range

var stripSingle = Fn( ([ from, to ])=>{

	return between( positionGeometry.x, from, to );

}, { from: 'float', to: 'float', return: 'float' } ); // stripSingle



// generates a wave-like zone within horizontal range

var bandWave = Fn( ([ from, to, sharpness, width, height ])=>{

	var x = positionGeometry.x.mul( float( Math.PI ).div( width ) ).cos();

	var dy = sharpness.mix( x, x.acos().mul( -2/Math.PI ).sub( 1 ) ).mul( height, 0.5 );

	return between( positionGeometry.y.add( dy ), from, to );

}, { from: 'float', to: 'float', sharpness: 'float', width: 'float', height: 'float', return: 'float' } ); // bandWave



// generates a TSL function that implements custom clothing

var compileClothing = Fn( ([ clothinData ]) => {

	var mat = mat3( clothinData[ 0 ]);

	for ( /*MUST*/let i=1; i<clothinData.length; i+=2 ) {

		If( clothinData[ i ], ()=>{

			mat.assign( clothinData[ i+1 ]);

		} );

	}

	return mat;

} ); // compileClothing

var renderer, scene, camera, light, cameraLight, controls, ground, userAnimationLoop, stats, everybody = [];



// creates a default world with primary attributes. the options
// is a collection of flags that turn on/off specific features:
// {
//		lights: true,
//		controls: true,
//		ground: true,
//		shadows: true,
//		stats: false,
// }

class World {

	constructor( options ) {

		renderer = new WebGPURenderer( { antialias: true, forceWebGL: true } );
		renderer.setSize( innerWidth, innerHeight );
		renderer.shadowMap.enabled = options?.shadows ?? true;
		renderer.shadowMap.type = PCFSoftShadowMap;

		document.body.appendChild( renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		scene = new Scene();
		scene.background = new Color( 'whitesmoke' );

		camera = new PerspectiveCamera( 30, innerWidth/innerHeight );
		camera.position.set( 0, 1.5, 4 );

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		} // stats

		if ( options?.lights ?? true ) {

			light = new DirectionalLight( 'white', 1.5 );
			light.position.set( 0, 14, 7 );
			if ( options?.shadows ?? true ) {

				light.shadow.mapSize.width = 2048;
				light.shadow.mapSize.height = light.shadow.mapSize.width;
				light.shadow.camera.near = 1;
				light.shadow.camera.far = 50;
				light.shadow.camera.left = -5;
				light.shadow.camera.right = 5;
				light.shadow.camera.top = 5;
				light.shadow.camera.bottom = -5;
				light.shadow.normalBias = 0.01;
				light.autoUpdate = false;
				light.castShadow = true;

			} // shadows

			scene.add( light );

			cameraLight = new DirectionalLight( 'white', 1.5 );
			cameraLight.target = scene;
			camera.add( cameraLight );
			scene.add( camera );

		} // lights

		if ( options?.controls ?? true ) {

			controls = new OrbitControls( camera, renderer.domElement );
			controls.enableDamping = true;
			controls.target.set( 0, 0.9, 0 );

		} // controls

		if ( options?.ground ?? true ) {

			// generate ground texture
			var canvas = document.createElement( 'CANVAS' );
			canvas.width = 128;
			canvas.height = 128;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 64, 64, 38, 0, 2*Math.PI );
			context.fill();

			ground = new Mesh(
				new CircleGeometry( 32 ),
				new MeshLambertMaterial( {
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

var animateEvent = new AnimateEvent( );



// default animation loop that dispatches animation events
// to the window and to each body in the scene

function defaultAnimationLoop( time ) {

	try {

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

	} catch ( err ) {

		  renderer.setAnimationLoop( null );
		  throw ( err );

	}

}



// function to set animation loop, for when the user is
// scared to use events

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}

console.time( 'TSL' );



// hide the spinner when the TSL's of all models are compiled
// or if some predefined time had ellapsed

var spinnerCounter = 0,
	spinner = document.getElementById( 'spinner' );

function loader$1( ) {

	spinnerCounter++;
	//	console.timeLog('TSL',spinnerCounter);
	if ( spinner && spinnerCounter >= everybody.length*12 ) {

		console.timeLog( 'TSL', spinnerCounter );
		spinner.style.display = 'none';

	}

}

if ( spinner ) {

	setTimeout( ()=>spinner.style.display = 'none', 10000 );

}



// generate oversmooth function
const smoother = Fn( ([ edge, value ])=>{

	return value.smoothstep( edge.x, edge.y ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edge: 'vec2', value: 'float', return: 'float' } );



var tslLocusY = Fn( ([ pos, pivot, rangeY, slope ])=>{

	var y = pos.y,
		z = pos.z;

	y = y.add( z.sub( pivot.z ).div( slope ) );

	return smoother( rangeY, y );

}, { pos: 'vec3', pivot: 'vec3', rangeY: 'vec2', slope: 'float', return: 'float' } ); // tslLocusY



var tslLocusX = Fn( ([ pos, rangeX ])=>{

	return smoother( rangeX, pos.x );

}, { pos: 'vec3', rangeX: 'vec2', return: 'float' } ); // tslLocusX



var tslLocusXY = Fn( ([ pos, pivot, rangeX, rangeY ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, x.sign() );

	return smoother( rangeX, x.add( dx ) )
		.mul( min(
			y.smoothstep( rangeY.x, mix( rangeY.x, rangeY.y, 0.2 ) ),
			y.smoothstep( rangeY.y, mix( rangeY.y, rangeY.x, 0.2 ) ),
		) )
		.pow( 2 );

}, { pos: 'vec3', pivot: 'vec3', rangeX: 'vec2', rangeY: 'vec2', return: 'float' } ); // tslLocusX



var tslLocusT = Fn( ([ pos, pivot, rangeX, rangeY, grown ])=>{

	var x = pos.x,
		y = pos.y,
		z = pos.z;

	var s = vec3( x.mul( 2.0 ), y, z.min( 0 ) )
		.sub( vec3( 0, pivot.y, 0 ) )
		.length()
		.smoothstep( 0, float( 0.13 ).div( float( grown ).add( 1 ) ) )
		.pow( 10 );

	var yy = y.sub( x.abs().mul( 1/5 ) );

	yy = yy.add( select( grown.equal( 1 ), z.abs().mul( 1/2 ), z.mul( 1/6 ) ) );

	return s
		.mul(
			x.smoothstep( rangeX.x, rangeX.y ),
			smoother( rangeY, yy ).pow( 2 ),
		);

}, { pos: 'vec3', pivot: 'vec3', rangeX: 'vec2', rangeY: 'vec2', grown: 'float', return: 'float' } ); // tslLocusX



class Locus {

	constructor( pivot ) {

		this.pivot = new Vector3( ...pivot );
		this.isRight = false;

	} // Locus.constructor

	mirror( ) {

		this.isRight = true;

		this.pivot.x *= -1;

		if ( this.rangeX ) {

			this.rangeX.value.x *= -1;
			this.rangeX.value.y *= -1;

		}

		return this;

	} // Locus.mirror

} // Locus



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY extends Locus {

	constructor( pivot, rangeY, angle=0 ) {

		super( pivot );

		this.rangeY = vec2( ...rangeY );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	locus( ) {

		return tslLocusY( positionGeometry, this.pivot, this.rangeY, this.slope );

	} // locus

} // LocusY



// define a vertical planar locus, perpendicular to X; vertically infinite,
// horizontally from minX to maxX
class LocusX extends Locus {

	constructor( pivot, rangeX ) {

		super( pivot );

		this.rangeX = vec2( ...rangeX );

	} // constructor

	locus( ) {

		return tslLocusX( positionGeometry, this.rangeX );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( pivot, rangeX, rangeY ) {

		super( pivot, rangeX );

		this.rangeY = vec2( ...rangeY );

	} // constructor

	locus( ) {

		loader$1();

		return tslLocusXY( positionGeometry, this.pivot, this.rangeX, this.rangeY );

	} // locus

} // LocusXY



// define custom locus specifically for hips
class LocusT extends LocusXY {

	constructor( pivot, rangeX, rangeY, grown=0 ) {

		super( pivot, rangeX, rangeY );

		this.grown = grown;

	} // constructor

	locus( ) {

		return tslLocusT( positionGeometry, this.pivot, this.rangeX, this.rangeY, this.grown );

	} // locus

} // LocusT



// the definition of a space around a model including properties of individual
// subspaces that simulate joints
class Space {

	constructor( bodyPartsDef ) {

		var centrals = { head: LocusY, chest: LocusY, waist: LocusY, torso: LocusY },
			symmetricals = { knee: LocusY, ankle: LocusY, shin: LocusY, thigh: LocusY, foot: LocusY, leg: LocusT, elbow: LocusX, forearm: LocusX, wrist: LocusX, arm: LocusXY };

		for ( var name in centrals )
			this[ name ] = new ( centrals[ name ])( ...bodyPartsDef[ name ]);

		for ( var name in symmetricals ) {

			this[ 'l_'+name ] = new ( symmetricals[ name ])( ...bodyPartsDef[ name ]);
			this[ 'r_'+name ] = new ( symmetricals[ name ])( ...bodyPartsDef[ name ]).mirror();

		}

	} // Space.constructor

} // Space

var loader = new GLTFLoader();



// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_m4 = new Matrix4(),
	_v = new Vector3(),
	_v4 = new Vector4();



var toDeg = x => x * 180 / Math.PI,
	toRad = x => x / 180 * Math.PI,
	toRound = x => Math.round( 100*x )/100;


function getset( object, name, xyz ) {

	Object.defineProperty( object, name, {
		get() {

			return toDeg( object.angle[ xyz ]);

		},
		set( value ) {

			object.angle[ xyz ] = toRad( value );

		}
	} );

}


class Joint {

	constructor( model, parent, space, axes='xyz' ) {

		this.model = model;
		this.parent = parent;
		this.space = space;
		this.angle = new Vector3();
		this.matrix = uniform( new Matrix3() );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);
		getset( this, 'turn', axes[ 1 ]);

	}


	attach( mesh, x, y, z ) {

		if ( mesh.parent ) mesh = mesh.clone();

		if ( typeof x !== 'undefined' )
			mesh.position.set( x, y, z );

		var wrapper = new Group();
		wrapper.add( mesh );
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.add( wrapper );
		this.model.accessories.push( wrapper );

	}


	point( x, y, z ) {

		var b = this;

		_m.identity();
		_v.set( x, y, z );
		_v.add( b.space.pivot );

		for ( ; b; b=b.parent ) {

			_mat.copy( b.matrix.value ).transpose();
			_m.premultiply( _mat );
			_v.sub( b.space.pivot ).applyMatrix3( _mat ).add( b.space.pivot );

		}

		_m4.setFromMatrix3( _m );
		_m4.setPosition( _v );

		_v4.set( 0, 0, 0, 1 );
		_v4.applyMatrix4( _m4 );

		_v.set( _v4.x, _v4.y, _v4.z );

		return _v;

	}

	lockTo( localX, localY, localZ, globalX, globalY, globalZ ) {

		this.model.position.set( 0, 0, 0 );

		_v = this.point( localX, localY, localZ ); // local
		this.model.position.sub( _v );

		_v.set( globalX, globalY, globalZ ); // global
		this.model.position.add( _v );

	} // Joint.lockTo




} // Joint




var m = new Matrix4(),
	e = new Euler(),
	dummyGeometry = new PlaneGeometry(),
	_uid = 1;


class Disfigure extends Mesh {

	static POSTURE_PARTS = [ 'torso', 'waist', 'chest', 'head', 'l_leg', 'l_thigh', 'l_knee', 'l_shin', 'l_ankle', 'l_foot', 'r_leg', 'r_thigh', 'r_knee', 'r_shin', 'r_ankle', 'r_foot', 'l_arm', 'l_elbow', 'l_forearm', 'l_wrist', 'r_arm', 'r_elbow', 'r_forearm', 'r_wrist' ];

	constructor( url, space, height, geometryHeight ) {

		super( dummyGeometry );


		// unique number for each body, used to make their motions different
		this.url = url;
		this.uid = _uid;
		_uid += 1 + 10*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];
		this.height = height??geometryHeight;

		this.scale.setScalar( this.height / geometryHeight );

		loader.load( this.url, ( gltf )=>{

			this.geometry = gltf.scene.children[ 0 ].geometry;

		} );

		// create the space around the model
		this.space = new Space( space );

		this.torso = new Joint( this, null, this.space.torso );
		this.waist = new Joint( this, this.torso, this.space.waist );
		this.chest = new Joint( this, this.waist, this.space.chest );
		this.head = new Joint( this, this.chest, this.space.head );

		this.l_leg = new Joint( this, this.torso, this.space.l_leg );
		this.l_thigh = new Joint( this, this.l_leg, this.space.l_thigh );
		this.l_knee = new Joint( this, this.l_thigh, this.space.l_knee );
		this.l_shin = new Joint( this, this.l_knee, this.space.l_shin );
		this.l_ankle = new Joint( this, this.l_shin, this.space.l_ankle );
		this.l_foot = new Joint( this, this.l_ankle, this.space.l_foot );

		this.r_leg = new Joint( this, this.torso, this.space.r_leg );
		this.r_thigh = new Joint( this, this.r_leg, this.space.r_thigh );
		this.r_knee = new Joint( this, this.r_thigh, this.space.r_knee );
		this.r_shin = new Joint( this, this.r_knee, this.space.r_shin );
		this.r_ankle = new Joint( this, this.r_shin, this.space.r_ankle );
		this.r_foot = new Joint( this, this.r_ankle, this.space.r_foot );

		this.l_arm = new Joint( this, this.chest, this.space.l_arm, 'yxz' );
		this.l_elbow = new Joint( this, this.l_arm, this.space.l_elbow, 'yxz' );
		this.l_forearm = new Joint( this, this.l_elbow, this.space.l_forearm, 'zxy' );
		this.l_wrist = new Joint( this, this.l_forearm, this.space.l_wrist, 'zxy' );

		this.r_arm = new Joint( this, this.chest, this.space.r_arm, 'yxz' );
		this.r_elbow = new Joint( this, this.r_arm, this.space.r_elbow, 'yxz' );
		this.r_forearm = new Joint( this, this.r_elbow, this.space.r_forearm, 'zxy' );
		this.r_wrist = new Joint( this, this.r_forearm, this.space.r_wrist, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		this.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( this ),
			normalNode: tslNormalNode( this ),
			colorNode: vec3( 0.99, 0.65, 0.49 ),
			metalness: 0,
			roughness: 0.6,
		} );

		this.position.y = 0;

		this.castShadow = true;
		this.receiveShadow = true;

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );

		this.l_arm.straddle = this.r_arm.straddle = 65;
		this.l_elbow.bend = this.r_elbow.bend = 20;

	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( joint, sx, sy, sz ) {

			e.set( sx*joint.angle.x, sy*joint.angle.y, sz*joint.angle.z, 'YZX' );
			transferMatrix( joint );

		}

		function anglesToMatrixArm( joint, sx, sy, sz ) {

			e.set( 0, 0, sz*joint.angle.z ); // straddle

			e.reorder( 'YZX' );
			e.set( 0, sy*joint.angle.y, e.z ); // foreward

			e.reorder( 'XYZ' );
			e.set( e.x+sx*joint.angle.x, e.y, e.z ); // turn

			transferMatrix( joint );

		}

		function transferMatrix( joint ) {

			m.makeRotationFromEuler( e );
			var s = m.elements;
			joint.matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}


		anglesToMatrix( this.torso, -1, -1, 1 );
		anglesToMatrix( this.head, -1, -1, 1 );
		anglesToMatrix( this.chest, -1, -1, 1 );
		anglesToMatrix( this.waist, -1, -1, 1 );

		anglesToMatrix( this.l_elbow, 0, 1, 0 );
		anglesToMatrix( this.r_elbow, 0, -1, 0 );

		// wrist: tilt bend
		anglesToMatrix( this.l_wrist, 0, 1, 1 );
		anglesToMatrix( this.r_wrist, 0, -1, -1 );

		// wrist: turn
		anglesToMatrix( this.l_forearm, -1, 0, 0 );
		anglesToMatrix( this.r_forearm, -1, 0, 0 );

		anglesToMatrixArm( this.l_arm, -1, 1, 1 );
		anglesToMatrixArm( this.r_arm, -1, -1, -1 );

		anglesToMatrix( this.l_knee, -1, 0, 1 );
		anglesToMatrix( this.r_knee, -1, 0, -1 );

		anglesToMatrix( this.l_ankle, -1, 0, -1 );
		anglesToMatrix( this.r_ankle, -1, 0, 1 );

		anglesToMatrix( this.l_shin, 0, -1, 0 );
		anglesToMatrix( this.r_shin, 0, 1, 0 );

		anglesToMatrix( this.l_foot, -1, 0, 0 );
		anglesToMatrix( this.r_foot, -1, 0, 0 );

		// thigh turn
		anglesToMatrix( this.l_thigh, 0, -1, 0 );
		anglesToMatrix( this.r_thigh, 0, 1, 0 );

		// leg: foreward ??? straddle
		anglesToMatrixArm( this.l_leg, 1, -1, -1 );
		anglesToMatrixArm( this.r_leg, 1, 1, 1 );

		for ( var wrapper of this.accessories ) {

			var b = wrapper.joint;

			_m.identity();
			_v.copy( b.space.pivot );

			for ( ; b; b=b.parent ) {

				_mat.copy( b.matrix.value ).transpose();
				_m.premultiply( _mat );
				_v.sub( b.space.pivot ).applyMatrix3( _mat ).add( b.space.pivot );

			}

			wrapper.matrix.setFromMatrix3( _m );
			wrapper.matrix.setPosition( _v );

		}

	} // Disfigure.update



	get posture() {

		var angles = [];

		for ( var name of Disfigure.POSTURE_PARTS ) {

			angles.push( ...this[ name ].angle );

		}

		var position = [ ...this.position ];
		var rotation = [ ...this.rotation ];

		return {
			version: 8,
			position: position.map( x=>toRound( x ) ),
			rotation: rotation,
			angles: angles.map( x=>toRound( toDeg( x ) ) ) };

	} // Disfigure.posture



	get postureString() {

		return JSON.stringify( this.posture );

	} // Disfigure.postureString



	set posture( data ) {

		if ( data.version !=8 )
			console.error( 'Incompatible posture version' );

		var i = 0;

		var angles = data.angles.map( x=>toRad( x ) );

		this.position.set( ...data.position );
		this.rotation.set( ...data.rotation );

		for ( var name of Disfigure.POSTURE_PARTS ) {

			this[ name ].angle.set( angles[ i ], angles[ i+1 ], angles[ i+2 ]);
			i += 3;

		}

		this.update();
		this.updateMatrixWorld( true );


	} // Disfigure.posture


	blend( postureA, postureB, k ) {

		function lerp( a, b ) {

			var c = [];
			for ( var i=0; i<a.length; i++ )
				c[ i ] = MathUtils.lerp( a[ i ], b[ i ], k );

			return c;

		}

		var eulerA = new Euler( ...postureA.rotation ),
			eulerB = new Euler( ...postureB.rotation );
		eulerA.reorder( eulerB._order );

		var posture = {
			version: postureA.version,
			position: lerp( postureA.position, postureB.position ),
			rotation: new Euler(
				...lerp([ eulerA._x, eulerA._y, eulerA._z ],
							 [ eulerB._x, eulerB._y, eulerB._z ])
			),
			angles: lerp( postureA.angles, postureB.angles ),
		};

		this.posture = posture;

	} // Disfigure.blend


	dress( clothinData ) {

		var clothes = compileClothing( clothinData ).toVar();

		this.material.colorNode = clothes[ 0 ].xyz;
		this.material.roughnessNode = clothes[ 1 ].x;
		this.material.metalnessNode = clothes[ 1 ].y;

	} // Disfigure.dress


} // Disfigure



class Man extends Disfigure {

	static URL = 'man.glb';
	static HEIGHT = 1.795;
	static SPACE = {

		// TORSO
		head: [[ 0, 1.566, -0.066 ], [ 1.495, 1.647 ], 30 ],
		chest: [[ 0, 1.177, -0.014 ], [ 0.777, 1.658 ], 0, [ 0.072, 0.538 ]],
		waist: [[ 0, 1.014, -0.016 ], [ 0.547, 1.498 ]],
		torso: [[ 0, 1.014, -0.016 ], [ -3, -2 ]],

		// LEGS
		leg: [[ 0.074, 0.970, -0.034 ], [ -4e-3, 0.004 ], [ 1.229, 0.782 ]],
		thigh: [[ 0.070, -9e-3, -0.034 ], [ 1.247, 0.242 ]],
		knee: [[ 0.090, 0.504, -0.041 ], [ 0.603, 0.382 ], 20 ],
		ankle: [[ 0.074, 0.082, -2e-3 ], [ 0.165, 0.008 ], -10 ],
		shin: [[ 0.092, 0.360, -0.052 ], [ 0.762, -0.027 ]],
		foot: [[ 0, 0.026, 0.022 ], [ 0.190, -0.342 ], 120 ],

		// ARMS
		elbow: [[ 0.427, 1.453, -0.072 ], [ 0.413, 0.467 ]],
		forearm: [[ 0.550, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [[ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [[ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.616 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Man.URL, Man.SPACE, height, Man.HEIGHT );

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
	static HEIGHT = 1.691;
	static SPACE = {

		// TORSO
		head: [[ 0.001, 1.471, -0.049 ], [ 1.395, 1.551 ], 30 ],
		chest: [[ 0.001, 1.114, -0.012 ], [ 0.737, 1.568 ], 0, [ 0.069, 0.509 ]],
		waist: [[ 0.001, 0.961, -0.014 ], [ 0.589, 1.417 ]],
		torso: [[ 0.001, 0.961, -0.014 ], [ -1.696, -1.694 ]],

		// LEGS
		leg: [[ 0.071, 0.920, -0.031 ], [ -2e-3, 0.005 ], [ 1.163, 0.742 ]],
		thigh: [[ 0.076, -3e-3, -0.031 ], [ 1.180, 0.233 ]],
		knee: [[ 0.086, 0.480, -0.037 ], [ 0.573, 0.365 ], 20 ],
		shin: [[ 0.088, 0.337, -0.047 ], [ 0.724, -0.059 ]],
		ankle: [[ 0.076, 0.083, -5e-3 ], [ 0.161, 0.014 ], -10 ],
		foot: [[ 0.001, 0.031, 0.022 ], [ 0.184, -0.316 ], 120 ],

		// ARMS
		elbow: [[ 0.404, 1.375, -0.066 ], [ 0.390, 0.441 ]],
		forearm: [[ 0.506, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [[ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [[ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Woman.URL, Woman.SPACE, height, Woman.HEIGHT );

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
	static HEIGHT = 1.352;
	static SPACE = {

		// TORSO
		head: [[ 0, 1.149, -0.058 ], [ 1.091, 1.209 ], 30 ],
		chest: [[ 0, 0.865, -0.013 ], [ 0.566, 1.236 ], 0, [ 0.054, 0.406 ]],
		waist: [[ 0, 0.717, -0.024 ], [ 0.385, 1.130 ]],
		torso: [[ 0, 0.717, -0.024 ], [ -1.354, -1.353 ]],

		// LEGS
		leg: [[ 0.054, 0.704, -0.027 ], [ -1e-3, 0.001 ], [ 0.845, 0.581 ], 1 ],
		thigh: [[ 0.062, -0, -0.021 ], [ 0.946, 0.189 ]],
		knee: [[ 0.068, 0.389, -0.031 ], [ 0.468, 0.299 ], 20 ],
		shin: [[ 0.069, 0.272, -0.048 ], [ 0.581, -0.045 ]],
		ankle: [[ 0.073, 0.065, -0.033 ], [ 0.109, 0.044 ], -10 ],
		foot: [[ 0, 0.027, -6e-3 ], [ 0.112, -0.271 ], 120 ],

		// ARMS
		elbow: [[ 0.337, 1.072, -0.09 ], [ 0.311, 0.369 ]],
		forearm: [[ 0.438, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [[ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [[ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Child.URL, Child.SPACE, height, Child.HEIGHT );

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child

// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '\n%c\u22EE\u22EE\u22EE Disfigure\n%chttps://boytchev.github.io/disfigure/\n', 'color: navy', 'font-size:80%' );

export { Child, Man, Woman, World, band, bandWave, bands, camera, cameraLight, chaotic, controls, everybody, ground, latex, light, random, regular, renderer, scene, setAnimationLoop, slice, strip, stripSingle, velour };
