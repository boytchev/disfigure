// disfigure v0.0.14

'use strict';

var THREE = require('three');
var GLTFLoader_js = require('three/addons/loaders/GLTFLoader.js');
var tsl = require('three/tsl');
var SimplexNoise_js = require('three/addons/math/SimplexNoise.js');
var OrbitControls_js = require('three/addons/controls/OrbitControls.js');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var THREE__namespace = /*#__PURE__*/_interopNamespaceDefault(THREE);

// generate X-rotation matrix
const matRotX = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return tsl.mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

}, { angle: 'float', return: 'mat3' } );



// generate Y-rotation matrix
const matRotY = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return tsl.mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

}, { angle: 'float', return: 'mat3' } );



// generate Z-rotation matrix
const matRotZ = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos(),
		sin = angle.sin();

	return tsl.mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

}, { angle: 'float', return: 'mat3' } );



// generate YXZ rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

}, { angles: 'vec3', return: 'mat3' } );



// generate YZX rotation matrix
const matRotYZX = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

}, { angles: 'vec3', return: 'mat3' } );



// generate XYZ rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

}, { angles: 'vec3', return: 'mat3' } );



// generate XZY rotation matrix
const matRotXZY = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

}, { angles: 'vec3', return: 'mat3' } );



// generate ZXY rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

}, { angles: 'vec3', return: 'mat3' } );



// generate ZYX rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

}, { angles: 'vec3', return: 'mat3' } );



// center model and get it dimensions
function centerModel( model, dims ) {

	var center = new THREE.Vector3();

	var box = new THREE.Box3().setFromObject( model, true );

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
			var material = new THREE.MeshPhysicalNodeMaterial();

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

			if ( nodes.emissiveNode )
				material.emissiveNode = nodes.emissiveNode( { space: space, posture: posture } );

			child.material = material;
			child.castShadow = true;
			child.receiveShadow = true;

		}

	} );

}



// generate oversmooth function
const smoother = tsl.Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edgeFrom: 'float', edgeTo: 'float', value: 'float', return: 'float' } );



tsl.Fn( ()=>{

	return tsl.vec3( 1 );

} );



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

// general DOF=3 rotator, used for most joints
var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount, tsl.vec3( -1, -1, 1 ) ) ) ).add( center );

}, { pos: 'vec3', center: 'vec3', angle: 'vec3', amount: 'float', return: 'vec3' } );



// specific DOF=3 rotator, used for arm joints (different order of rotations)
var jointRotateArm= tsl.Fn( ([ pos, center, angle, amount ])=>{

	var newPos = pos.sub( center ).mul( matRotXZY( angle.mul( amount, tsl.vec3( -1, -1, 1 ) ) ) ).add( center ).toVar();

	return newPos;

}, { pos: 'vec3', center: 'vec3', angle: 'vec3', amount: 'float', return: 'vec3' } );



// calculate vertices of bent body surface
function tslPositionNode( options ) {

	options.vertex = tsl.positionGeometry;
	options.mode = tsl.float( 1 );

	return disfigure( options );

}



// calculate normals of bent body surface
function tslNormalNode( options ) {

	options.vertex = tsl.normalGeometry;
	options.mode = tsl.float( 0 );

	return tsl.transformNormalToView( disfigure( options ) ).xyz;

}



// implement the actual body bending
//		space - compiled definition of the space around the body
//		posture - collection of angles for body posture
//		mode - 1 for vertixes, 0 for normals
//		vertex - vertex or normal coordinates to use as input data
var disfigure = tsl.Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();

	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft.mul( tsl.vec3( 1, -1, 1 ) ), space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft.mul( -1 ), space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft.mul( tsl.vec3( 1, -1, 1 ) ), space.armLeft.locus( )/*, space.armLeft.sublocus(  )*/ ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristRight.pivot ), posture.wristRight.mul( tsl.vec3( 1, 1, -1 ) ), space.wristRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmRight.pivot ), posture.forearmRight, space.forearmRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowRight.pivot ), posture.elbowRight, space.elbowRight.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armRight.pivot ), posture.armRight.mul( tsl.vec3( 1, 1, -1 ) ), space.armRight.locus( )/*, space.armRight.sublocus(  )*/ ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( space.head.pivot ), posture.head, space.head.locus( ) ) );
	p.assign( jointRotate( p, mode.mul( space.chest.pivot ), posture.chest, space.chest.locus() ) );
	p.assign( jointRotate( p, mode.mul( space.waist.pivot ), posture.waist, space.waist.locus() ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	tsl.If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft.mul( tsl.vec3( 1, 1, -1 ) ), space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongLeft.pivot ), posture.ankleLongLeft, space.ankleLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongLeft.pivot ), posture.legLongLeft, space.legLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft.mul( tsl.vec3( -1, 1, -1 ) ), legLeft ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	tsl.If( legRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footRight.pivot ), posture.footRight, space.footRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleRight.pivot ), posture.ankleRight, space.ankleRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongRight.pivot ), posture.ankleLongRight.mul( -1 ), space.ankleLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeRight.pivot ), posture.kneeRight, space.kneeRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongRight.pivot ), posture.legLongRight.negate(), space.legLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legRight.pivot ), posture.legRight.mul( tsl.vec3( -1, 1, 1 ) ), legRight ) );

	} );

	return p;

} ); // disfigure



// create a default posture
function tslPosture( ) {

	return {

		// TORSO
		head: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		chest: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		waist: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// LEGS
		kneeLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		kneeRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		footRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLongLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLongRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleLongLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		ankleLongRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

		// ARMS
		elbowLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		elbowRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		forearmRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		wristRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		armRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

	};

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

	return new THREE.Vector3(
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

	locus( pos = tsl.positionGeometry ) {

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

	locus( pos = tsl.positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		var min = tsl.float( this.minX );
		var max = tsl.float( this.maxX );

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

	locus( pos = tsl.positionGeometry ) {

		var x = pos.x;
		var y = pos.y;

		var dx = pos.y.sub( this.pivot.y ).div( 4, x.sign() );

		var k = 0.8;

		return tsl.float( 1 )
			.mul( smoother( tsl.float( this.minX ).sub( dx ), tsl.float( this.maxX ).sub( dx ), x ) )
			.mul( tsl.min(
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

	locus( pos = tsl.positionGeometry ) {

		var x = pos.x;
		var z = pos.z;

		if ( this.grown==0 ) {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.mul( 1/6 ) );
			var s = tsl.vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( tsl.vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.13 ).pow( 10 );


		} else {

			var y = pos.y.sub( x.abs().mul( 1/5 ) ).add( z.abs().mul( 1/2 ) );
			var s = tsl.vec3( pos.x.mul( 2.0 ), pos.y, pos.z.min( 0 ) ).sub( tsl.vec3( 0, this.pivot.y, 0 ) ).length().smoothstep( 0, 0.065 ).pow( 10 );

		}

		return tsl.float( s )
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

		/*
		if ( DEBUG_NAME ) {

			this[ DEBUG_NAME ].pivot = uniform( this[ DEBUG_NAME ].pivot );
			if ( this[ DEBUG_NAME ] instanceof LocusX && !( this[ DEBUG_NAME ] instanceof LocusT ) ) {

				this[ DEBUG_NAME ].minX = uniform( this[ DEBUG_NAME ].minX );
				this[ DEBUG_NAME ].maxX = uniform( this[ DEBUG_NAME ].maxX );

			} else {

				this[ DEBUG_NAME ].minY = uniform( this[ DEBUG_NAME ].minY );
				this[ DEBUG_NAME ].maxY = uniform( this[ DEBUG_NAME ].maxY );

			}

		} // DEBUG_NAME
*/

	} // Space.constructor

} // Space

exports.renderer = void 0; exports.scene = void 0; exports.camera = void 0; exports.light = void 0; exports.cameraLight = void 0; exports.controls = void 0; var userAnimationLoop, everybody = [];



// creates a default world with all its primary attributes the options parameters
// is a collection of flags that turn on/off specific features:
//
// options.lights		true, whether lights are created
// options.controls		true, whether OrbitControls is created
// options.ground		true, whether ground is created
// options.shadows		true, whether shadows are enabled

class World {

	constructor( options ) {

		exports.renderer = new THREE.WebGPURenderer( { antialias: true } );
		exports.renderer.setSize( innerWidth, innerHeight );
		exports.renderer.shadowMap.enabled = options?.shadows ?? true;
		exports.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		document.body.appendChild( exports.renderer.domElement );
		document.body.style.overflow = 'hidden';
		document.body.style.margin = '0';

		exports.scene = new THREE.Scene();
		exports.scene.background = new THREE.Color( 'whitesmoke' );

		exports.camera = new THREE.PerspectiveCamera( 30, innerWidth/innerHeight );
		exports.camera.position.set( 0, 1, 4 );
		exports.camera.lookAt( 0, 1, 0 );

		if ( options?.lights ?? true ) {

			exports.light = new THREE.DirectionalLight( 'white', 1.5 );
			exports.light.decay = 0;
			exports.light.position.set( 0, 14, 7 );
			if ( options?.shadows ?? true ) {

				exports.light.shadow.mapSize.width = 2048;
				exports.light.shadow.mapSize.height = exports.light.shadow.mapSize.width;
				exports.light.shadow.camera.near = 1;//13;
				exports.light.shadow.camera.far = 50;//18.5;
				exports.light.shadow.camera.left = -5;
				exports.light.shadow.camera.right = 5;
				exports.light.shadow.camera.top = 5;
				exports.light.shadow.camera.bottom = -5;
				exports.light.shadow.normalBias = 0.01;
				exports.light.autoUpdate = false;
				exports.light.castShadow = true;

			} // light shadows

			exports.scene.add( exports.light );

			exports.cameraLight = new THREE.DirectionalLight( 'white', 1.5 );
			exports.cameraLight.decay = 0;
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
			canvas.width = 512/4;
			canvas.height = 512/4;

			var context = canvas.getContext( '2d' );
			context.fillStyle = 'white';
			context.filter = 'blur(10px)';
			context.beginPath();
			context.arc( 256/4, 256/4, 150/4, 0, 2*Math.PI );
			context.fill();

			var ground = new THREE.Mesh(
				new THREE.CircleGeometry( 50 ),
				new THREE.MeshLambertMaterial(
					{
						color: 'antiquewhite',
						transparent: true,
						map: new THREE.CanvasTexture( canvas )
					} )
			);
			ground.receiveShadow = true;
			ground.rotation.x = -Math.PI / 2;
			ground.renderOrder = -1;
			exports.scene.add( ground );

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

var animateEvent = new AnimateEvent( 'animate' );



// default animation loop that dispatches animation events to the window and to
// each body in the scene

function defaultAnimationLoop( time ) {

	animateEvent.time = time;

	window.dispatchEvent( animateEvent );

	everybody.forEach( ( p )=>{

		p.dispatchEvent( animateEvent );

	} );

	if ( userAnimationLoop ) userAnimationLoop( time );

	if ( exports.controls ) exports.controls.update( );

	exports.renderer.render( exports.scene, exports.camera );

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

var MAN = /*#__PURE__*/Object.freeze({
	__proto__: null,
	SPACE: SPACE$2,
	URL: URL$2
});

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

var WOMAN = /*#__PURE__*/Object.freeze({
	__proto__: null,
	SPACE: SPACE$1,
	URL: URL$1
});

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

var CHILD = /*#__PURE__*/Object.freeze({
	__proto__: null,
	SPACE: SPACE,
	URL: URL
});

// path to models as GLB files
const MODEL_PATH = '../assets/models/';



var loader = new GLTFLoader_js.GLTFLoader();

function angle( x ) {

	x = ( ( x%360 ) + 360 )%360;
	x = x>180?x-360:x;
	return x * 2*Math.PI/360;

}



class Joint {

	constructor( isRight, jointX, jointY, jointZ, nameX='x', nameY='y', nameZ='z' ) {

		this.isRight = isRight;
		this.jointX = jointX;
		this.jointY = jointY ?? jointX;
		this.jointZ = jointZ ?? jointX;
		this.nameX = nameX;
		this.nameY = nameY;
		this.nameZ = nameZ;

	}

	get nod( ) {

		return this.jointX.value.x;

	}

	set nod( a ) {

		this.jointX.value.x = angle( a );

	}

	get bend( ) {

		return this.jointX.value[ this.nameX ];

	}

	set bend( a ) {

		this.jointX.value[ this.nameX ] = angle( a );

	}

	get raise( ) {

		return this.jointX.value[ this.nameX ];

	}

	set raise( a ) {

		this.jointX.value[ this.nameX ] = angle( a );

	}

	get turn( ) {

		return this.jointY.value[ this.nameY ];

	}
	set turn( a ) {

		this.jointY.value[ this.nameY ] = angle( a );

	}

	get tilt( ) {

		return this.jointZ.value[ this.nameZ ];

	}

	set tilt( a ) {

		this.jointZ.value[ this.nameZ ] = angle( a );

	}

	get straddle( ) {

		return this.jointZ.value[ this.nameZ ];

	}

	set straddle( a ) {

		this.jointZ.value[ this.nameZ ] = angle( a );

	}

} // Joint



class Disfigure extends THREE__namespace.Group {

	constructor( MODEL_DEFINITION, height ) {

		super();

		// unique number for each body, used to make their motions different
		this.uid = 10*Math.random();

		this.castShadow = true;
		this.receiveShadow = true;

		// dimensions of the body, including its height
		this.dims = {};

		// posture of the body, containing only angles
		this.posture = tslPosture( MODEL_DEFINITION.SPACE );

		this.head = new Joint( false, this.posture.head );
		this.chest = new Joint( false, this.posture.chest );
		this.waist = new Joint( false, this.posture.waist );

		this.legLeft = new Joint( false, this.posture.legLeft, this.posture.legLongLeft );
		this.kneeLeft = new Joint( false, this.posture.kneeLeft );
		this.ankleLeft = new Joint( false, this.posture.ankleLeft, this.posture.ankleLongLeft );
		this.footLeft = new Joint( false, this.posture.footLeft );

		this.legRight = new Joint( true, this.posture.legRight, this.posture.legLongRight );
		this.kneeRight = new Joint( true, this.posture.kneeRight );
		this.ankleRight = new Joint( true, this.posture.ankleRight, this.posture.ankleLongRight );
		this.footRight = new Joint( true, this.posture.footRight );

		this.armLeft = new Joint( false, this.posture.armLeft, this.posture.armLeft, this.posture.armLeft, 'y', 'x', 'z' );
		this.elbowLeft = new Joint( false, this.posture.elbowLeft, null, null, 'y' );
		this.wristLeft = new Joint( false, this.posture.wristLeft, this.posture.forearmLeft, this.posture.wristLeft, 'z', 'x', 'y' );

		this.armRight = new Joint( true, this.posture.armRight, this.posture.armRight, this.posture.armRight, 'y', 'x', 'z' );
		this.elbowRight = new Joint( true, this.posture.elbowRight, null, null, 'y' );
		this.wristRight = new Joint( true, this.posture.wristRight, this.posture.forearmRight, this.posture.wristRight, 'z', 'x', 'y' );

		// load the model and prepare it
		loader.load( MODEL_PATH + MODEL_DEFINITION.URL, ( gltf ) => {

			// reduce the hierarchy of the model
			var model = gltf.scene;

			// center the model and get its dimensions
			centerModel( model, this.dims );

			// create the space around the model
			var space = new Space( this.dims, MODEL_DEFINITION.SPACE );

			// sets the materials of the model hooking them to TSL functions
			ennodeModel( model, space, this.posture,
				{	// nodes
					positionNode: tslPositionNode, // rigging
					normalNode: tslNormalNode, // lighting
					colorNode: tsl.Fn( ()=>{

						return tsl.vec3( 0xFE/0xFF, 0xD1/0xFF, 0xB9/0xFF ).pow( 2.2 );

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

			this.add( model );

			// register the model
			everybody.push( this );
			if ( exports.scene ) exports.scene.add( this );

		} ); // load

	} // Disfigure.constructor


} // Disfigure



class Man extends Disfigure {

	constructor( height ) {

		super( MAN, height );

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

		super( WOMAN, height );

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

		super( CHILD, height );

		this.ankleLeft.bend = 3;
		this.ankleRight.bend = 3;

		this.position.y = -5e-3;

		this.armLeft.straddle = 65;
		this.armRight.straddle = 65;

		this.elbowLeft.bend = 20;
		this.elbowRight.bend = 20;

	} // Child.constructor

} // Child

exports.Child = Child;
exports.Man = Man;
exports.Woman = Woman;
exports.World = World;
exports.chaotic = chaotic;
exports.everybody = everybody;
exports.regular = regular;
exports.setAnimationLoop = setAnimationLoop;
