// disfigure v0.0.17

import { Vector3, Box3, WebGPURenderer, PCFSoftShadowMap, Scene, Color, PerspectiveCamera, DirectionalLight, Mesh, CircleGeometry, MeshLambertMaterial, CanvasTexture, Matrix3, Matrix4, Euler, Group, MeshPhysicalNodeMaterial } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fn, mix, If, normalGeometry, transformNormalToView, positionGeometry, float, min, vec3, uniform, mat3 } from 'three/tsl';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// general DOF=3 rotator, used for most joints
var jointRotateMat= Fn( ([ pos, joint ])=>{

	var p = pos.sub( joint.pivot ).mul( joint.matrix ).add( joint.pivot );
	return mix( pos, p, joint.locus() );

} );



// general DOF=3 rotator, used for most joints
var jointNormalMat= Fn( ([ pos, joint ])=>{

	var p = pos.mul( joint.matrix );
	return mix( pos, p, joint.locus() );

} );



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

	return transformNormalToView( disfigure( options ) );

}


// implement the actual body bending
//		space - compiled definition of the space around the body
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	If( space.l_arm.locus( ), ()=>{

		p.assign( fn( p, space.l_wrist ) );
		p.assign( fn( p, space.l_wrist2 ) );
		p.assign( fn( p, space.l_elbow ) );
		p.assign( fn( p, space.l_arm ) );

	} );



	// RIGHT-UPPER BODY

	If( space.r_arm.locus( ), ()=>{

		p.assign( fn( p, space.r_wrist ) );
		p.assign( fn( p, space.r_wrist2 ) );
		p.assign( fn( p, space.r_elbow ) );
		p.assign( fn( p, space.r_arm ) );

	} );



	// LEFT-LOWER BODY

	If( space.l_leg.locus( ), ()=>{

		p.assign( fn( p, space.l_foot ) );
		p.assign( fn( p, space.l_ankle ) );
		p.assign( fn( p, space.l_ankle2 ) );
		p.assign( fn( p, space.l_knee ) );
		p.assign( fn( p, space.l_leg2 ) );
		p.assign( fn( p, space.l_leg ) );

	} );



	// RIGHT-LOWER BODY

	If( space.r_leg.locus( ), ()=>{

		p.assign( fn( p, space.r_foot ) );
		p.assign( fn( p, space.r_ankle ) );
		p.assign( fn( p, space.r_ankle2 ) );
		p.assign( fn( p, space.r_knee ) );
		p.assign( fn( p, space.r_leg2 ) );
		p.assign( fn( p, space.r_leg ) );

	} );




	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head ) );
	p.assign( fn( p, space.chest ) );
	p.assign( fn( p, space.waist ) );
	p.assign( fn( p, space.torso ) );

	return p;

} ); // disfigure

// center model and get it height
function centerModel( model ) {

	var v = new Vector3(),
		box = new Box3().setFromObject( model, true );

	box.getCenter( v );
	model.position.sub( v );

	return box.max.y-box.min.y;

}



// generate oversmooth function
const smoother = Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edgeFrom: 'float', edgeTo: 'float', value: 'float', return: 'float' } );



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

// clone an object and flip its pivot horizontally - this is used for all spaces
// that represent left-right symmetry in human body (e.g. left arm and right arm)
function clone( instance ) {

	var obj = Object.assign( Object.create( instance ), instance );
	obj.pivot = obj.pivot.clone();
	obj.pivot.x *= -1;
	obj.angle = new Vector3();
	obj.matrix = uniform( mat3() );
	return obj;

}



class Locus {

	constructor( pivot ) {

		// calculate a pivot vector with actual coordinates
		this.pivot = new Vector3( ...pivot );
		this.angle = new Vector3();
		this.matrix = uniform( mat3() );

	} // Locus.constructor

} // Locus



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY extends Locus {

	constructor( pivot, rangeY, angle=0, rangeX ) {

		super( pivot );

		this.minY = rangeY[ 0 ];
		this.maxY = rangeY[ 1 ];

		if ( rangeX ) {

			this.minX = rangeX[ 0 ];
			this.maxX = rangeX[ 1 ];

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
class LocusX extends Locus {

	constructor( pivot, rangeX ) {

		super( pivot );

		this.minX = rangeX[ 0 ];
		this.maxX = rangeX[ 1 ];

	} // constructor

	mirror( ) {

		var obj = clone( this );

		obj.minX *= -1;
		obj.maxX *= -1;

		return obj;

	} // mirror

	locus( pos = positionGeometry ) {

		var x = pos.x;

		return smoother( this.minX, this.maxX, x );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( pivot, rangeX, rangeY ) {

		super( pivot, rangeX );

		this.minY = rangeY[ 0 ];
		this.maxY = rangeY[ 1 ];

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

	constructor( pivot, rangeX, rangeY, grown=0 ) {

		super( pivot, rangeX, rangeY );

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

	constructor( bodyPartsDef ) {

		const classes = { LocusT: LocusT, LocusX: LocusX, LocusXY: LocusXY, LocusY: LocusY };

		// bodyPartsDef = { name:[LocusClassName, data], ... }
		var bodyParts = { };
		for ( var name in bodyPartsDef ) {

			var partClass = classes[ bodyPartsDef[ name ][ 0 ] ];
			bodyParts[ name ] = new partClass( ... bodyPartsDef[ name ].slice( 1 ) );

		}
		// bodyParts = { name:LocusInstance, ... }

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;
		this.torso = bodyParts.torso;

		// legs
		this.l_knee = bodyParts.knee;
		this.r_knee = bodyParts.knee.mirror();

		this.l_ankle = bodyParts.ankle;
		this.r_ankle = bodyParts.ankle.mirror();

		this.l_ankle2 = bodyParts.ankle2;
		this.r_ankle2 = bodyParts.ankle2.mirror();

		this.l_leg2 = bodyParts.leg2;
		this.r_leg2 = bodyParts.leg2.mirror();

		this.l_foot = bodyParts.foot;
		this.r_foot = bodyParts.foot.mirror();

		this.l_leg = bodyParts.leg;
		this.r_leg = bodyParts.leg.mirror();

		// arms
		this.l_elbow = bodyParts.elbow;
		this.r_elbow = bodyParts.elbow.mirror();

		this.l_wrist2 = bodyParts.wrist2;
		this.r_wrist2 = bodyParts.wrist2.mirror();

		this.l_wrist = bodyParts.wrist;
		this.r_wrist = bodyParts.wrist.mirror();

		this.l_arm = bodyParts.arm;
		this.r_arm = bodyParts.arm.mirror();

	} // Space.constructor

} // Space

var renderer, scene, camera, light, cameraLight, controls, ground, userAnimationLoop, stats, everybody = [];



// creates a default world with all its primary attributes the options parameters
// is a collection of flags that turn on/off specific features:
//    lights	true, create lights
//    controls	true, create OrbitControls
//    ground	true, create ground
//    shadows	true, create shadows
//	  stats		false, create stats panel

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

			} // light shadows

			scene.add( light );

			cameraLight = new DirectionalLight( 'white', 1.5 );
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
			canvas.width = 128;
			canvas.height = 128;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 64, 64, 38, 0, 2*Math.PI );
			context.fill();

			ground = new Mesh(
				new CircleGeometry( 50 ),
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

// path to models as GLB files
const MODEL_PATH = import.meta.url.replace( '/src/body.js', '/assets/models/' );



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_v = new Vector3();



var toRad = x => x * ( 2*Math.PI/360 ),
	toDeg = x => x / ( 2*Math.PI/360 );

function getset( object, name, xyz, angle='angle' ) {

	Object.defineProperty( object, name, {
		get() {

			return toDeg( object[ angle ][ xyz ]);

		},
		set( value ) {

			object[ angle ][ xyz ] = toRad( value );

		}
	} );

}


class Joint extends Group {

	constructor( model, parent, space, spaceAux=space, axes='xyz' ) {

		super();

		this.model = model;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.angleAux = spaceAux.angle;

		this.position.copy( space.pivot );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);
		getset( this, 'turn', axes[ 1 ], 'angleAux' );

	}


	attach( mesh ) {

		if ( mesh.parent ) mesh = mesh.clone();

		var wrapper = new Group();
		var subwrapper = new Group();

		wrapper.add( subwrapper );
		subwrapper.add( mesh );
		subwrapper.rotation.z = this.isRight ? Math.PI : 0;
		mesh.position.y *= this.isRight ? -1 : 1;
		wrapper.matrixAutoUpdate = false;
		wrapper.joint = this;

		this.model.children[ 0 ].add( wrapper );
		this.model.accessories.push( wrapper );

	}

} // Joint





var m = new Matrix4(),
	e = new Euler(),
	_uid = 1;

class Disfigure extends Group {


	constructor( gltf, space, height ) {

		super();



		// unique number for each body, used to make their motions different
		this.uid = _uid;
		_uid += 0.3 + 2*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		this.accessories = [];

		this.space = {};

		// reduce the hierarchy of the model
		var model = new Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		var modelHeight = centerModel( model );

		// create the space around the model
		this.space = new Space( space );

		this.torso = new Joint( this, null, this.space.torso );
		this.waist = new Joint( this, this.torso, this.space.waist );
		this.chest = new Joint( this, this.waist, this.space.chest );
		this.head = new Joint( this, this.chest, this.space.head );

		this.l_leg = new Joint( this, this.torso, this.space.l_leg, this.space.l_leg2 );
		this.l_knee = new Joint( this, this.l_leg, this.space.l_knee );
		this.l_ankle = new Joint( this, this.l_knee, this.space.l_ankle, this.space.l_ankle2 );
		this.l_foot = new Joint( this, this.l_ankle, this.space.l_foot );

		this.r_leg = new Joint( this, this.torso, this.space.r_leg, this.space.r_leg2 );
		this.r_knee = new Joint( this, this.r_leg, this.space.r_knee );
		this.r_ankle = new Joint( this, this.r_knee, this.space.r_ankle, this.space.r_ankle2 );
		this.r_foot = new Joint( this, this.r_ankle, this.space.r_foot );

		this.l_arm = new Joint( this, this.chest, this.space.l_arm, this.space.l_arm, 'yxz' );
		this.l_elbow = new Joint( this, this.l_arm, this.space.l_elbow, this.space.l_elbow, 'yxz' );
		this.l_wrist = new Joint( this, this.l_elbow, this.space.l_wrist, this.space.l_wrist2, 'zxy' );

		this.r_arm = new Joint( this, this.chest, this.space.r_arm, this.space.r_arm, 'yxz' );
		this.r_elbow = new Joint( this, this.r_arm, this.space.r_elbow, this.space.r_elbow, 'yxz' );
		this.r_wrist = new Joint( this, this.r_elbow, this.space.r_wrist, this.space.r_wrist2, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		model.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 ),
			metalness: 0,
			roughness: 0.6,
		} );

		// rescale the model to the desired height (optional)
		this.height = height ?? modelHeight;
		model.scale.setScalar( this.height / modelHeight );
		model.position.y = 0;

		model.castShadow = true;
		model.receiveShadow = true;

		this.model = model;
		//		this.torso = model;
		this.add( model );

		// register the model
		everybody.push( this );
		if ( scene ) scene.add( this );

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

		anglesToMatrix( this.space.head, -1, -1, 1 );
		anglesToMatrix( this.space.chest, -1, -1, 1 );
		anglesToMatrix( this.space.waist, -1, 1, 1 );
		anglesToMatrix( this.space.torso, -1, -1, 1 );

		anglesToMatrix( this.space.l_elbow, 0, 1, 0 );
		anglesToMatrix( this.space.r_elbow, 0, -1, 0 );

		// wrist: tilt bend
		anglesToMatrix( this.space.l_wrist, 0, 1, 1 );
		anglesToMatrix( this.space.r_wrist, 0, -1, -1 );

		// wrist: turn
		anglesToMatrix( this.space.l_wrist2, -1, 0, 0 );
		anglesToMatrix( this.space.r_wrist2, -1, 0, 0 );

		anglesToMatrix( this.space.l_arm, -1, 1, 1 );
		anglesToMatrix( this.space.r_arm, -1, -1, -1 );

		anglesToMatrix( this.space.l_knee, -1, 0, 0 );
		anglesToMatrix( this.space.r_knee, -1, 0, 0 );

		anglesToMatrix( this.space.l_ankle, -1, 0, -1 );
		anglesToMatrix( this.space.r_ankle, -1, 0, 1 );

		anglesToMatrix( this.space.l_ankle2, 0, -1, 0 );
		anglesToMatrix( this.space.r_ankle2, 0, 1, 0 );

		anglesToMatrix( this.space.l_foot, -1, 0, 0 );
		anglesToMatrix( this.space.r_foot, -1, 0, 0 );

		// legs turn
		anglesToMatrix( this.space.l_leg2, 0, -1, 0 );
		anglesToMatrix( this.space.r_leg2, 0, 1, 0 );

		// leg: foreward ??? straddle
		anglesToMatrix( this.space.l_leg, 1, 0, -1 );
		anglesToMatrix( this.space.r_leg, 1, 0, 1 );

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
		head: [ 'LocusY', [ 0, 1.566, -0.066 ], [ 1.495, 1.647 ], 30 ],
		chest: [ 'LocusY', [ 0, 1.177, -0.014 ], [ 0.777, 1.658 ], 0, [ 0.072, 0.538 ]],
		waist: [ 'LocusY', [ 0, 1.014, -0.016 ], [ 0.547, 1.498 ]],
		torso: [ 'LocusY', [ 0, 1.014, -0.016 ], [ -3, -2 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.074, 0.970, -0.034 ], [ -4e-3, 0.004 ], [ 1.229, 0.782 ]],
		leg2: [ 'LocusY', [ 0.070, -9e-3, -0.034 ], [ 1.247, 0.242 ]],
		knee: [ 'LocusY', [ 0.090, 0.504, -0.041 ], [ 0.603, 0.382 ], 20 ],
		ankle: [ 'LocusY', [ 0.074, 0.082, -2e-3 ], [ 0.165, 0.008 ], -10 ],
		ankle2: [ 'LocusY', [ 0.092, 0.360, -0.052 ], [ 0.762, -0.027 ]],
		foot: [ 'LocusY', [ 0, 0.026, 0.022 ], [ 0.190, -0.342 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.427, 1.453, -0.072 ], [ 0.413, 0.467 ]],
		wrist2: [ 'LocusX', [ 0.305, 1.453, -0.068 ], [ 0.083, 0.879 ]],
		wrist: [ 'LocusX', [ 0.673, 1.462, -0.072 ], [ 0.635, 0.722 ]],
		arm: [ 'LocusXY', [ 0.153, 1.408, -0.072 ], [ 0.054, 0.269 ], [ 1.067, 1.606 ]],

	};

	constructor( height ) {

		super( gltf_man, Man.SPACE, height );

		this.url = MODEL_PATH + Man.URL;

		//this.position.y = this.height/2 - 0.015;

		this.l_leg.straddle = this.r_leg.straddle = 5;
		this.l_ankle.tilt = this.r_ankle.tilt = -5;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	static URL = 'woman.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0.001, 1.471, -0.049 ], [ 1.395, 1.551 ], 30 ],
		chest: [ 'LocusY', [ 0.001, 1.114, -0.012 ], [ 0.737, 1.568 ], 0, [ 0.069, 0.509 ]],
		waist: [ 'LocusY', [ 0.001, 0.961, -0.014 ], [ 0.589, 1.417 ]],
		torso: [ 'LocusY', [ 0.001, 0.961, -0.014 ], [ -1.696, -1.694 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.071, 0.920, -0.031 ], [ -2e-3, 0.005 ], [ 1.163, 0.742 ]],
		leg2: [ 'LocusY', [ 0.076, -3e-3, -0.031 ], [ 1.180, 0.233 ]],
		knee: [ 'LocusY', [ 0.086, 0.480, -0.037 ], [ 0.573, 0.365 ], 20 ],
		ankle: [ 'LocusY', [ 0.076, 0.083, -5e-3 ], [ 0.161, 0.014 ], -10 ],
		ankle2: [ 'LocusY', [ 0.088, 0.337, -0.047 ], [ 0.724, -0.059 ]],
		foot: [ 'LocusY', [ 0.001, 0.031, 0.022 ], [ 0.184, -0.316 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.404, 1.375, -0.066 ], [ 0.390, 0.441 ]],
		wrist2: [ 'LocusX', [ 0.289, 1.375, -0.063 ], [ 0.093, 0.805 ]],
		wrist: [ 'LocusX', [ 0.608, 1.375, -0.056 ], [ 0.581, 0.644 ]],
		arm: [ 'LocusXY', [ 0.137, 1.338, -0.066 ], [ 0.052, 0.233 ], [ 1.011, 1.519 ]],

	};

	constructor( height ) {

		super( gltf_woman, Woman.SPACE, height );

		this.url = MODEL_PATH + Woman.URL;

		//this.position.y = this.height/2 - 0.005;

		this.l_leg.straddle = this.r_leg.straddle = -2.9;
		this.l_ankle.tilt = this.r_ankle.tilt = 2.9;
		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	static URL = 'child.glb';
	static SPACE = {

		// TORSO
		head: [ 'LocusY', [ 0, 1.149, -0.058 ], [ 1.091, 1.209 ], 30 ],
		chest: [ 'LocusY', [ 0, 0.865, -0.013 ], [ 0.566, 1.236 ], 0, [ 0.054, 0.406 ]],
		waist: [ 'LocusY', [ 0, 0.717, -0.024 ], [ 0.385, 1.130 ]],
		torso: [ 'LocusY', [ 0, 0.717, -0.024 ], [ -1.354, -1.353 ]],

		// LEGS
		leg: [ 'LocusT', [ 0.054, 0.704, -0.027 ], [ -1e-3, 0.001 ], [ 0.845, 0.581 ], 1 ],
		leg2: [ 'LocusY', [ 0.062, -0, -0.021 ], [ 0.946, 0.189 ]],
		knee: [ 'LocusY', [ 0.068, 0.389, -0.031 ], [ 0.468, 0.299 ], 20 ],
		ankle: [ 'LocusY', [ 0.073, 0.065, -0.033 ], [ 0.109, 0.044 ], -10 ],
		ankle2: [ 'LocusY', [ 0.069, 0.272, -0.048 ], [ 0.581, -0.045 ]],
		foot: [ 'LocusY', [ 0, 0.027, -6e-3 ], [ 0.112, -0.271 ], 120 ],

		// ARMS
		elbow: [ 'LocusX', [ 0.337, 1.072, -0.09 ], [ 0.311, 0.369 ]],
		wrist2: [ 'LocusX', [ 0.230, 1.074, -0.094 ], [ 0.073, 0.642 ]],
		wrist: [ 'LocusX', [ 0.538, 1.084, -0.091 ], [ 0.519, 0.553 ]],
		arm: [ 'LocusXY', [ 0.108, 1.072, -0.068 ], [ 0.041, 0.185 ], [ 0.811, 1.217 ]],

	};

	constructor( height ) {

		super( gltf_child, Child.SPACE, height );

		this.url = MODEL_PATH + Child.URL;

		//this.position.y = this.height/2 - 0.005;

		this.l_ankle.bend = this.r_ankle.bend = 3;

	} // Child.constructor

} // Child



var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + Man.URL ),
		loader.loadAsync( MODEL_PATH + Woman.URL ),
		loader.loadAsync( MODEL_PATH + Child.URL ),
	]
);

// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '\n%c\u22EE\u22EE\u22EE Disfigure\n%chttps://boytchev.github.io/disfigure/\n', 'color: navy', 'font-size:80%' );

export { Child, Man, Woman, World, camera, cameraLight, chaotic, controls, everybody, ground, light, random, regular, renderer, scene, setAnimationLoop };
