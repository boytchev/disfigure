// disfigure v0.0.18

'use strict';

var three = require('three');
var GLTFLoader_js = require('three/addons/loaders/GLTFLoader.js');
var tsl = require('three/tsl');
var OrbitControls_js = require('three/addons/controls/OrbitControls.js');
var Stats = require('three/addons/libs/stats.module.js');
var SimplexNoise_js = require('three/addons/math/SimplexNoise.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
// general DOF=3 rotator, used for most joints
var jointRotateMat= tsl.Fn( ([ pos, joint ])=>{

	var p = pos.sub( joint.pivot ).mul( joint.matrix ).add( joint.pivot );
	return tsl.mix( pos, p, joint.locus() );

} );



// general DOF=3 rotator, used for most joints
var jointNormalMat= tsl.Fn( ([ pos, joint ])=>{

	var p = pos.mul( joint.matrix );
	return tsl.mix( pos, p, joint.locus() );

} );



// calculate vertices of bent body surface
function tslPositionNode( options ) {

	options.vertex = tsl.positionGeometry;
	options.fn = jointRotateMat;

	return disfigure( options );

}



// calculate normals of bent body surface
function tslNormalNode( options ) {

	options.vertex = tsl.normalGeometry;
	options.fn = jointNormalMat;

	return tsl.transformNormalToView( disfigure( options ) );

}


// implement the actual body bending
//		space - the space around the body
//		vertex - vertex or normal coordinates to use as input data
var disfigure = tsl.Fn( ( { fn, space, vertex } )=>{

	var p = vertex.toVar( );


	// LEFT-UPPER BODY

	tsl.If( space.l_arm.locus( ), ()=>{

		p.assign( fn( p, space.l_wrist ) );
		p.assign( fn( p, space.l_forearm ) );
		p.assign( fn( p, space.l_elbow ) );
		p.assign( fn( p, space.l_arm ) );

	} );


	// RIGHT-UPPER BODY

	tsl.If( space.r_arm.locus( ), ()=>{

		p.assign( fn( p, space.r_wrist ) );
		p.assign( fn( p, space.r_forearm ) );
		p.assign( fn( p, space.r_elbow ) );
		p.assign( fn( p, space.r_arm ) );

	} );


	// LEFT-LOWER BODY

	tsl.If( space.l_leg.locus( ), ()=>{

		p.assign( fn( p, space.l_foot ) );
		p.assign( fn( p, space.l_ankle ) );
		p.assign( fn( p, space.l_shin ) );
		p.assign( fn( p, space.l_knee ) );
		p.assign( fn( p, space.l_thigh ) );
		p.assign( fn( p, space.l_leg ) );

	} );


	// RIGHT-LOWER BODY

	tsl.If( space.r_leg.locus( ), ()=>{

		p.assign( fn( p, space.r_foot ) );
		p.assign( fn( p, space.r_ankle ) );
		p.assign( fn( p, space.r_shin ) );
		p.assign( fn( p, space.r_knee ) );
		p.assign( fn( p, space.r_thigh ) );
		p.assign( fn( p, space.r_leg ) );

	} );


	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head ) );
	p.assign( fn( p, space.chest ) );
	p.assign( fn( p, space.waist ) );
	p.assign( fn( p, space.torso ) );

	return p;

} ); // disfigure

exports.renderer = void 0; exports.scene = void 0; exports.camera = void 0; exports.light = void 0; exports.cameraLight = void 0; exports.controls = void 0; exports.ground = void 0; var userAnimationLoop, stats, everybody = [];



// creates a default world with all its primary attributes the options parameters
// is a collection of flags that turn on/off specific features:
//    lights	true, create lights
//    controls	true, create OrbitControls
//    ground	true, create ground
//    shadows	true, create shadows
//	  stats		false, create stats panel

class World {

	constructor( options ) {

		exports.renderer = new three.WebGPURenderer( { antialias: true } );
		exports.renderer.setSize( innerWidth, innerHeight );
		exports.renderer.shadowMap.enabled = options?.shadows ?? true;
		exports.renderer.shadowMap.type = three.PCFSoftShadowMap;

		document.body.appendChild( exports.renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		exports.scene = new three.Scene();
		exports.scene.background = new three.Color( 'whitesmoke' );

		exports.camera = new three.PerspectiveCamera( 30, innerWidth/innerHeight );
		exports.camera.position.set( 0, 1, 4 );
		exports.camera.lookAt( 0, 1, 0 );

		if ( options?.stats ?? false ) {

			stats = new Stats();
			document.body.appendChild( stats.dom );

		} // stats

		if ( options?.lights ?? true ) {

			exports.light = new three.DirectionalLight( 'white', 1.5 );
			exports.light.position.set( 0, 14, 7 );
			if ( options?.shadows ?? true ) {

				exports.light.shadow.mapSize.width = 2048;
				exports.light.shadow.mapSize.height = exports.light.shadow.mapSize.width;
				exports.light.shadow.camera.near = 1;
				exports.light.shadow.camera.far = 50;
				exports.light.shadow.camera.left = -5;
				exports.light.shadow.camera.right = 5;
				exports.light.shadow.camera.top = 5;
				exports.light.shadow.camera.bottom = -5;
				exports.light.shadow.normalBias = 0.01;
				exports.light.autoUpdate = false;
				exports.light.castShadow = true;

			} // light shadows

			exports.scene.add( exports.light );

			exports.cameraLight = new three.DirectionalLight( 'white', 1.5 );
			exports.cameraLight.target = exports.scene;
			exports.camera.add( exports.cameraLight );
			exports.scene.add( exports.camera );

		} // lights

		if ( options?.controls ?? true ) {

			exports.controls = new OrbitControls_js.OrbitControls( exports.camera, exports.renderer.domElement );
			exports.controls.enableDamping = true;
			exports.controls.target.set( 0, 0.8, 0 );

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

			exports.ground = new three.Mesh(
				new three.CircleGeometry( 50 ),
				new three.MeshLambertMaterial( {
					color: 'antiquewhite',
					transparent: true,
					map: new three.CanvasTexture( canvas )
				} )
			);
			exports.ground.receiveShadow = true;
			exports.ground.rotation.x = -Math.PI / 2;
			exports.ground.renderOrder = -1;
			exports.scene.add( exports.ground );

		} // ground

		window.addEventListener( "resize", ( /*event*/ ) => {

			exports.camera.aspect = innerWidth/innerHeight;
			exports.camera.updateProjectionMatrix( );
			exports.renderer.setSize( innerWidth, innerHeight );

		} );

		exports.renderer.setAnimationLoop( defaultAnimationLoop );

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

	if ( exports.controls ) exports.controls.update( );

	if ( stats ) stats.update( );

	exports.renderer.render( exports.scene, exports.camera );

}



// function to set animation loop, for when the user is scared to use events

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}

//console.time('TSL');



var spinnerCounter = 0,
	spinner = document.getElementById( 'spinner' );

function loader$1( ) {

	spinnerCounter++;
	//	console.timeLog('TSL',spinnerCounter);
	if ( spinner && spinnerCounter >= everybody.length*12 )
		spinner.style.display = 'none';

}

if ( spinner ) {

	setTimeout( ()=>spinner.style.display = 'none', 3000 );

}



// generate oversmooth function
const smoother = tsl.Fn( ([ edge, value ])=>{

	return value.smoothstep( edge.x, edge.y ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edge: 'vec2', value: 'float', return: 'float' } );



var tslLocusY = tsl.Fn( ([ pos, pivot, rangeY, slope ])=>{

	var y = pos.y,
		z = pos.z;

	y = y.add( z.sub( pivot.z ).div( slope ) );

	return smoother( rangeY, y );

}, { pos: 'vec3', pivot: 'vec3', rangeY: 'vec2', slope: 'float', return: 'float' } ); // tslLocusY



var tslLocusX = tsl.Fn( ([ pos, rangeX ])=>{

	return smoother( rangeX, pos.x );

}, { pos: 'vec3', rangeX: 'vec2', return: 'float' } ); // tslLocusX



var tslLocusXY = tsl.Fn( ([ pos, pivot, rangeX, rangeY ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, x.sign() );

	return smoother( rangeX, x.add( dx ) )
		.mul( tsl.min(
			y.smoothstep( rangeY.x, tsl.mix( rangeY.x, rangeY.y, 0.2 ) ),
			y.smoothstep( rangeY.y, tsl.mix( rangeY.y, rangeY.x, 0.2 ) ),
		) )
		.pow( 2 );

}, { pos: 'vec3', pivot: 'vec3', rangeX: 'vec2', rangeY: 'vec2', return: 'float' } ); // tslLocusX



var tslLocusT = tsl.Fn( ([ pos, pivot, rangeX, rangeY, grown ])=>{

	var x = pos.x,
		y = pos.y,
		z = pos.z;

	var s = tsl.vec3( x.mul( 2.0 ), y, z.min( 0 ) )
		.sub( tsl.vec3( 0, pivot.y, 0 ) )
		.length()
		.smoothstep( 0, tsl.float( 0.13 ).div( tsl.float( grown ).add( 1 ) ) )
		.pow( 10 );

	var yy = y.sub( x.abs().mul( 1/5 ) );

	yy = yy.add( tsl.select( grown.equal( 1 ), z.abs().mul( 1/2 ), z.mul( 1/6 ) ) );

	return s
		.mul(
			x.smoothstep( rangeX.x, rangeX.y ),
			smoother( rangeY, yy ).pow( 2 ),
		);

}, { pos: 'vec3', pivot: 'vec3', rangeX: 'vec2', rangeY: 'vec2', grown: 'float', return: 'float' } ); // tslLocusX



class Locus {

	constructor( pivot ) {

		this.pivot = new three.Vector3( ...pivot );
		this.angle = new three.Vector3();
		this.matrix = tsl.uniform( tsl.mat3() );
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

		this.rangeY = tsl.vec2( ...rangeY );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	locus( ) {

		return tslLocusY( tsl.positionGeometry, this.pivot, this.rangeY, this.slope );

	} // locus

} // LocusY



// define a vertical planar locus, perpendicular to X; vertically infinite,
// horizontally from minX to maxX
class LocusX extends Locus {

	constructor( pivot, rangeX ) {

		super( pivot );

		this.rangeX = tsl.vec2( ...rangeX );

	} // constructor

	locus( ) {

		return tslLocusX( tsl.positionGeometry, this.rangeX );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( pivot, rangeX, rangeY ) {

		super( pivot, rangeX );

		this.rangeY = tsl.vec2( ...rangeY );

	} // constructor

	locus( ) {

		loader$1();

		return tslLocusXY( tsl.positionGeometry, this.pivot, this.rangeX, this.rangeY );

	} // locus

} // LocusXY



// define custom locus specifically for hips
class LocusT extends LocusXY {

	constructor( pivot, rangeX, rangeY, grown=0 ) {

		super( pivot, rangeX, rangeY );

		this.grown = grown;

	} // constructor

	locus( ) {

		return tslLocusT( tsl.positionGeometry, this.pivot, this.rangeX, this.rangeY, this.grown );

	} // locus

} // LocusT



// the definition of a space around a model including properties of individual
// subspaces that simulate joints
class Space {

	constructor( bodyPartsDef ) {

		// torso
		this.head = new LocusY( ...bodyPartsDef.head );
		this.chest = new LocusY( ...bodyPartsDef.chest );
		this.waist = new LocusY( ...bodyPartsDef.waist );
		this.torso = new LocusY( ...bodyPartsDef.torso );

		// legs
		this.l_knee = new LocusY( ...bodyPartsDef.knee );
		this.r_knee = new LocusY( ...bodyPartsDef.knee ).mirror();

		this.l_ankle = new LocusY( ...bodyPartsDef.ankle );
		this.r_ankle = new LocusY( ...bodyPartsDef.ankle ).mirror();

		this.l_shin = new LocusY( ...bodyPartsDef.shin );
		this.r_shin = new LocusY( ...bodyPartsDef.shin ).mirror();

		this.l_thigh = new LocusY( ...bodyPartsDef.thigh );
		this.r_thigh = new LocusY( ...bodyPartsDef.thigh ).mirror();

		this.l_foot = new LocusY( ...bodyPartsDef.foot );
		this.r_foot = new LocusY( ...bodyPartsDef.foot ).mirror();

		this.l_leg = new LocusT( ...bodyPartsDef.leg );
		this.r_leg = new LocusT( ...bodyPartsDef.leg ).mirror();

		// arms
		this.l_elbow = new LocusX( ...bodyPartsDef.elbow );
		this.r_elbow = new LocusX( ...bodyPartsDef.elbow ).mirror();

		this.l_forearm = new LocusX( ...bodyPartsDef.forearm );
		this.r_forearm = new LocusX( ...bodyPartsDef.forearm ).mirror();

		this.l_wrist = new LocusX( ...bodyPartsDef.wrist );
		this.r_wrist = new LocusX( ...bodyPartsDef.wrist ).mirror();

		this.l_arm = new LocusXY( ...bodyPartsDef.arm );
		this.r_arm = new LocusXY( ...bodyPartsDef.arm ).mirror();

	} // Space.constructor

} // Space

var loader = new GLTFLoader_js.GLTFLoader();



// path to models as GLB files
const MODEL_PATH = (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('disfigure.js', document.baseURI).href)).replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new three.Matrix3(),
	_m = new three.Matrix3(),
	_v = new three.Vector3();



var toRad = x => x * ( 2*Math.PI/360 ),
	toDeg = x => x / ( 2*Math.PI/360 );

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


class Joint extends three.Group {

	constructor( model, parent, space, axes='xyz' ) {

		super();

		this.model = model;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.isRight = space.isRight;

		this.position.copy( space.pivot );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);
		getset( this, 'turn', axes[ 1 ]);

	}


	attach( mesh ) {

		if ( mesh.parent ) mesh = mesh.clone();

		var wrapper = new three.Group();
		var subwrapper = new three.Group();

		wrapper.add( subwrapper );
		subwrapper.add( mesh );
		//subwrapper.rotation.y = this.isRight ? Math.PI*0 : 0;
		//subwrapper.rotation.z = this.isRight ? Math.PI*0 : 0;
		//mesh.position.y *= this.isRight ? -1 : 1;
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.children[ 0 ].add( wrapper );
		this.model.accessories.push( wrapper );

	}

} // Joint




var m = new three.Matrix4(),
	e = new three.Euler(),
	dummyGeomeyry = new three.PlaneGeometry(),
	_uid = 1;

class Disfigure extends three.Group {


	constructor( url, space, height ) {

		super();



		// unique number for each body, used to make their motions different
		this.url = url;
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];

		// reduce the hierarchy of the model
		this.model = new three.Mesh( dummyGeomeyry );

		loader.load( this.url, ( gltf )=>{

			this.model.geometry = gltf.scene.children[ 0 ].geometry;

			var box = new three.Box3().setFromObject( this.model, true );
			var modelHeight = box.max.y-box.min.y;

			// rescale the model to the desired height (optional)
			this.height = height ?? modelHeight;
			this.model.scale.setScalar( this.height / modelHeight );

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
		this.model.material = new three.MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: tsl.vec3( 0.99, 0.65, 0.49 ),
			metalness: 0,
			roughness: 0.6,
		} );

		this.model.position.y = 0;

		this.model.castShadow = true;
		this.model.receiveShadow = true;

		this.add( this.model );

		// register the model
		everybody.push( this );
		if ( exports.scene ) exports.scene.add( this );

		this.l_arm.straddle = this.r_arm.straddle = 65;
		this.l_elbow.bend = this.r_elbow.bend = 20;

	} // Disfigure.constructor

	update( ) {

		function anglesToMatrix( space, sx, sy, sz ) {

			e.set( sx*space.angle.x, sy*space.angle.y, sz*space.angle.z, 'YZX' );
			m.makeRotationFromEuler( e );
			var s = m.elements;
			space.matrix.value.set( s[ 0 ], s[ 4 ], s[ 8 ], s[ 1 ], s[ 5 ], s[ 9 ], s[ 2 ], s[ 6 ], s[ 10 ]);

		}

		anglesToMatrix( this.head, -1, -1, 1 );
		anglesToMatrix( this.chest, -1, -1, 1 );
		anglesToMatrix( this.waist, -1, -1, 1 );
		anglesToMatrix( this.torso, -1, -1, 1 );

		anglesToMatrix( this.l_elbow, 0, 1, 0 );
		anglesToMatrix( this.r_elbow, 0, -1, 0 );

		// wrist: tilt bend
		anglesToMatrix( this.l_wrist, 0, 1, 1 );
		anglesToMatrix( this.r_wrist, 0, -1, -1 );

		// wrist: turn
		anglesToMatrix( this.space.l_forearm, -1, 0, 0 );
		anglesToMatrix( this.space.r_forearm, -1, 0, 0 );

		anglesToMatrix( this.l_arm, -1, 1, 1 );
		anglesToMatrix( this.r_arm, -1, -1, -1 );

		anglesToMatrix( this.l_knee, -1, 0, 0 );
		anglesToMatrix( this.r_knee, -1, 0, 0 );

		anglesToMatrix( this.l_ankle, -1, 0, -1 );
		anglesToMatrix( this.r_ankle, -1, 0, 1 );

		anglesToMatrix( this.space.l_shin, 0, -1, 0 );
		anglesToMatrix( this.space.r_shin, 0, 1, 0 );

		anglesToMatrix( this.l_foot, -1, 0, 0 );
		anglesToMatrix( this.r_foot, -1, 0, 0 );

		// thigh turn
		anglesToMatrix( this.space.l_thigh, 0, -1, 0 );
		anglesToMatrix( this.space.r_thigh, 0, 1, 0 );

		// leg: foreward ??? straddle
		anglesToMatrix( this.l_leg, 1, 0, -1 );
		anglesToMatrix( this.r_leg, 1, 0, 1 );

		for ( var wrapper of this.accessories ) {

			var b = wrapper.joint;

			_m.identity();
			_v.copy( b.pivot );

			for ( ; b; b=b.parent ) {

				_mat.copy( b.matrix.value ).transpose();
				_m.premultiply( _mat );
				_v.sub( b.pivot ).applyMatrix3( _mat ).add( b.pivot );

			}

			wrapper.matrix.setFromMatrix3( _m );
			wrapper.matrix.setPosition( _v );

		}

	} // Disfigure.update

} // Disfigure



class Man extends Disfigure {

	static URL = 'man.glb';
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
		forearm: [[ 0.305, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [[ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [[ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.606 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Man.URL, Man.SPACE, height );

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
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
		forearm: [[ 0.289, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [[ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [[ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Woman.URL, Woman.SPACE, height );

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
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
		forearm: [[ 0.230, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [[ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [[ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( MODEL_PATH + Child.URL, Child.SPACE, height );

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child

// number generators

var simplex = new SimplexNoise_js.SimplexNoise( );

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

// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '\n%c\u22EE\u22EE\u22EE Disfigure\n%chttps://boytchev.github.io/disfigure/\n', 'color: navy', 'font-size:80%' );

exports.Child = Child;
exports.Man = Man;
exports.Woman = Woman;
exports.World = World;
exports.chaotic = chaotic;
exports.everybody = everybody;
exports.random = random;
exports.regular = regular;
exports.setAnimationLoop = setAnimationLoop;
