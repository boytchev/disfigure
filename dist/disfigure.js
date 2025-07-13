// disfigure v0.0.15

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

	return transformNormalToView( disfigure( options ) ).xyz;

}


// implement the actual body bending
//		space - compiled definition of the space around the body
//		vertex - vertex or normal coordinates to use as input data
var disfigure = Fn( ( { fn, space, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	If( space.armLeft.locus( ), ()=>{

		p.assign( fn( p, space.wristLeft ) );
		p.assign( fn( p, space.forearmLeft ) );
		p.assign( fn( p, space.elbowLeft ) );
		p.assign( fn( p, space.armLeft ) );

	} );



	// RIGHT-UPPER BODY

	If( space.armRight.locus( ), ()=>{

		p.assign( fn( p, space.wristRight ) );
		p.assign( fn( p, space.forearmRight ) );
		p.assign( fn( p, space.elbowRight ) );
		p.assign( fn( p, space.armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( fn( p, space.head ) );
	p.assign( fn( p, space.chest ) );
	p.assign( fn( p, space.waist ) );



	// LEFT-LOWER BODY

	If( space.legLeft.locus( ), ()=>{

		p.assign( fn( p, space.footLeft ) );
		p.assign( fn( p, space.ankleLeft ) );
		p.assign( fn( p, space.ankleLongLeft ) );
		p.assign( fn( p, space.kneeLeft ) );
		p.assign( fn( p, space.legLongLeft ) );
		p.assign( fn( p, space.legLeft ) );

	} );



	// RIGHT-LOWER BODY

	If( space.legRight.locus( ), ()=>{

		p.assign( fn( p, space.footRight ) );
		p.assign( fn( p, space.ankleRight ) );
		p.assign( fn( p, space.ankleLongRight ) );
		p.assign( fn( p, space.kneeRight ) );
		p.assign( fn( p, space.legLongRight ) );
		p.assign( fn( p, space.legRight ) );

	} );

	return p;

} ); // disfigure

// center model and get it dimensions
function centerModel( model, dims ) {

	var v = new Vector3();

	var box = new Box3().setFromObject( model, true );

	box.getCenter( v );
	model.position.sub( v );

	dims.x = v.x;
	dims.y = box.min.y;
	dims.z = v.z;

	box.getSize( v );
	dims.scale = Math.max( ...v );
	dims.height = v.y;

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

// calculate actual value from normalized value - the space definition assumes
// overall body sizes are within [0,1000] range, decoding calculates the actual
// value scaled to the actual size
function decode( value, scale, offset=0 ) {

	return scale*value/1000 + offset;

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

	constructor( dims, pivot ) {

		// calculate a pivot vector with actual coordinates
		this.pivot = new Vector3(
			decode( pivot[ 0 ], dims.scale, dims.x ),
			decode( pivot[ 1 ], dims.scale, dims.y ),
			decode( pivot[ 2 ], dims.scale, dims.z ),
		);

		this.angle = new Vector3();
		this.matrix = uniform( mat3() );

	} // Locus.constructor

} // Locus



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY extends Locus {

	constructor( dims, pivot, rangeY, angle=0, rangeX ) {

		super( dims, pivot );

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
class LocusX extends Locus {

	constructor( dims, pivot, rangeX, angle=0 ) {

		super( dims, pivot );

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
			canvas.width = 128;
			canvas.height = 128;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 64, 64, 38, 0, 2*Math.PI );
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



var loader = new GLTFLoader();

var [ gltf_man, gltf_woman, gltf_child ] = await Promise.all(
	[
		loader.loadAsync( MODEL_PATH + URL$2 ),
		loader.loadAsync( MODEL_PATH + URL$1 ),
		loader.loadAsync( MODEL_PATH + URL ),
	]
);



// dummy vars
var _mat = new Matrix3(),
	_m = new Matrix3(),
	_v = new Vector3();



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


class Joint extends Group {

	constructor( model, isRight, parent, space, spaceAux=space, axes='xyz' ) {

		super();

		this.model = model;
		this.isRight = isRight;
		this.parent = parent;
		this.pivot = space.pivot;
		this.angle = space.angle;
		this.matrix = space.matrix;
		this.angleAux = spaceAux.angle;

		this.nameY = axes[ 1 ];

		this.position.copy( space.pivot );

		getset( this, 'bend', axes[ 0 ]);
		getset( this, 'raise', axes[ 0 ]);
		getset( this, 'tilt', axes[ 2 ]);
		getset( this, 'straddle', axes[ 2 ]);
		getset( this, 'foreward', axes[ 0 ]);

	}

	get turn( ) {

		return toDeg( this.angleAux[ this.nameY ]);

	}
	set turn( a ) {

		this.angleAux[ this.nameY ] = toRad( a );

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

		// dimensions of the body, including its height
		this.dims = {};
		this.space = {};

		// reduce the hierarchy of the model
		var model = new Mesh( gltf.scene.children[ 0 ].geometry );

		// center the model and get its dimensions
		centerModel( model, this.dims );

		// create the space around the model
		this.space = new Space( this.dims, space );

		this.waist = new Joint( this, false, null, this.space.waist );
		this.chest = new Joint( this, false, this.waist, this.space.chest );
		this.head = new Joint( this, false, this.chest, this.space.head );

		this.legLeft = new Joint( this, false, this.waist, this.space.legLeft, this.space.legLongLeft );
		this.kneeLeft = new Joint( this, false, this.legLeft, this.space.kneeLeft );
		this.ankleLeft = new Joint( this, false, this.kneeLeft, this.space.ankleLeft, this.space.ankleLongLeft );
		this.footLeft = new Joint( this, false, this.ankleLeft, this.space.footLeft );

		this.legRight = new Joint( this, true, this.waist, this.space.legRight, this.space.legLongRight );
		this.kneeRight = new Joint( this, true, this.legRight, this.space.kneeRight );
		this.ankleRight = new Joint( this, true, this.kneeRight, this.space.ankleRight, this.space.ankleLongRight );
		this.footRight = new Joint( this, true, this.ankleRight, this.space.footRight );

		this.armLeft = new Joint( this, false, this.chest, this.space.armLeft, this.space.armLeft, 'yxz' );
		this.elbowLeft = new Joint( this, false, this.armLeft, this.space.elbowLeft, this.space.elbowLeft, 'yxz' );
		this.wristLeft = new Joint( this, false, this.elbowLeft, this.space.wristLeft, this.space.forearmLeft, 'zxy' );

		this.armRight = new Joint( this, true, this.chest, this.space.armRight, this.space.armRight, 'yxz' );
		this.elbowRight = new Joint( this, true, this.armRight, this.space.elbowRight, this.space.elbowRight, 'yxz' );
		this.wristRight = new Joint( this, true, this.elbowRight, this.space.wristRight, this.space.forearmRight, 'zxy' );

		// sets the materials of the model hooking them to TSL functions
		model.material = new MeshPhysicalNodeMaterial( {
			positionNode: tslPositionNode( { space: this.space } ),
			normalNode: tslNormalNode( { space: this.space } ),
			colorNode: vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 ),
			metalness: 0,
			roughness: 0.6,
		} );

		// rescale the model to the desired height (optional)
		if ( height ) {

			model.scale.setScalar( height / this.dims.height );

		}

		model.castShadow = true;
		model.receiveShadow = true;

		this.model = model;
		this.torso = model;
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

		anglesToMatrix( this.space.head.matrix, this.space.head.angle, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.space.chest.matrix, this.space.chest.angle, -1, -1, 1, 'YZX' );
		anglesToMatrix( this.space.waist.matrix, this.space.waist.angle, -1, 1, 1, 'YZX' );

		anglesToMatrix( this.space.elbowLeft.matrix, this.space.elbowLeft.angle, 0, 1, 0, 'YZX' );
		anglesToMatrix( this.space.elbowRight.matrix, this.space.elbowRight.angle, 0, -1, 0, 'YZX' );

		// wrist: tilt bend
		anglesToMatrix( this.space.wristLeft.matrix, this.space.wristLeft.angle, 0, 1, 1, 'YZX' );
		anglesToMatrix( this.space.wristRight.matrix, this.space.wristRight.angle, 0, -1, -1, 'YZX' );

		// wrist: turn
		anglesToMatrix( this.space.forearmLeft.matrix, this.space.forearmLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.forearmRight.matrix, this.space.forearmRight.angle, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.space.armLeft.matrix, this.space.armLeft.angle, -1, 1, 1, 'XZY' );
		anglesToMatrix( this.space.armRight.matrix, this.space.armRight.angle, -1, -1, -1, 'XZY' );

		anglesToMatrix( this.space.kneeLeft.matrix, this.space.kneeLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.kneeRight.matrix, this.space.kneeRight.angle, -1, 0, 0, 'YZX' );

		anglesToMatrix( this.space.ankleLeft.matrix, this.space.ankleLeft.angle, -1, 0, -1, 'YZX' );
		anglesToMatrix( this.space.ankleRight.matrix, this.space.ankleRight.angle, -1, 0, 1, 'YZX' );

		anglesToMatrix( this.space.ankleLongLeft.matrix, this.space.ankleLongLeft.angle, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.space.ankleLongRight.matrix, this.space.ankleLongRight.angle, 0, 1, 0, 'YZX' );

		anglesToMatrix( this.space.footLeft.matrix, this.space.footLeft.angle, -1, 0, 0, 'YZX' );
		anglesToMatrix( this.space.footRight.matrix, this.space.footRight.angle, -1, 0, 0, 'YZX' );

		// legs turn
		anglesToMatrix( this.space.legLongLeft.matrix, this.space.legLongLeft.angle, 0, -1, 0, 'YZX' );
		anglesToMatrix( this.space.legLongRight.matrix, this.space.legLongRight.angle, 0, 1, 0, 'YZX' );

		// leg: foreward ??? straddle
		anglesToMatrix( this.space.legLeft.matrix, this.space.legLeft.angle, 1, 0, -1, 'YZX' );
		anglesToMatrix( this.space.legRight.matrix, this.space.legRight.angle, 1, 0, 1, 'YZX' );

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

	}

} // Disfigure



class Man extends Disfigure {

	constructor( height ) {

		super( gltf_man, SPACE$2, height );

		this.url = MODEL_PATH + URL$2;

		this.position.y = this.dims.height/2 - 0.01;

		this.legLeft.straddle = 5;
		this.legRight.straddle = 5;

		this.ankleLeft.tilt = -5;
		this.ankleRight.tilt = -5;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

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

		this.position.y = this.dims.height/2 - 0.005;

		this.legLeft.straddle = -2.9;
		this.legRight.straddle = -2.9;

		this.ankleLeft.tilt = 2.9;
		this.ankleRight.tilt = 2.9;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

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

		this.position.y = this.dims.height/2 - 0.005;

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Child.constructor

} // Child

// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '%c\n\u22EE\u22EE\u22EE%cDISFIGURE\n\n', 'font-size:200%', 'font-size:150%; display:inline-block; padding:0.15em;' );

export { Child, Man, Woman, World, camera, cameraLight, chaotic, controls, everybody, light, regular, renderer, scene, setAnimationLoop };
