// disfigure v0.0.12

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

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		1, 0, 0,
		0, cos, sin,
		0, sin.negate(), cos,
	);

} ).setLayout( {
	name: 'matRotX',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Y-rotation matrix
const matRotY = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, 0, sin.negate(),
		0, 1, 0,
		sin, 0, cos,
	);

} ).setLayout( {
	name: 'matRotY',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate Z-rotation matrix
const matRotZ = tsl.Fn( ([ angle ])=>{

	var	cos = angle.cos().toVar(),
		sin = angle.sin().toVar();

	return tsl.mat3(
		cos, sin, 0,
		sin.negate(), cos, 0,
		0, 0, 1,
	);

} ).setLayout( {
	name: 'matRotZ',
	type: 'mat3',
	inputs: [
		{ name: 'angle', type: 'float' },
	]
} );



// generate YXZ rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RX ).mul( RZ );

} ).setLayout( {
	name: 'matRotYXZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate YZX rotation matrix
const matRotYZX = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RY.mul( RZ ).mul( RX );

} ).setLayout( {
	name: 'matRotYZX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XYZ rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RY ).mul( RZ );

} ).setLayout( {
	name: 'matRotXYZ',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate XZY rotation matrix
const matRotXZY = tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RX.mul( RZ ).mul( RY );

} ).setLayout( {
	name: 'matRotXZY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZXY rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RX ).mul( RY );

} ).setLayout( {
	name: 'matRotZXY',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );



// generate ZYX rotation matrix
tsl.Fn( ([ angles ])=>{

	var RX = matRotX( angles.x ),
		RY = matRotY( angles.y ),
		RZ = matRotZ( angles.z );

	return RZ.mul( RY ).mul( RX );

} ).setLayout( {
	name: 'matRotZYX',
	type: 'mat3',
	inputs: [
		{ name: 'angles', type: 'vec3' },
	]
} );




/*
// generate scaling matrix
const matScale = Fn( ([ scales ])=>{

	return mat3(
		scales.x, 0, 0,
		0, scales.y, 0,
		0, 0, scales.z,
	);

} ).setLayout( {
	name: 'matScale',
	type: 'mat3',
	inputs: [
		{ name: 'scales', type: 'vec3' },
	]
} );
*/



// center model
function centerModel( model, dims ) {

	var center = new THREE.Vector3();

	var box = new THREE.Box3().setFromObject( model, true );

	box.getCenter( center );
	model.position.sub( center );

	dims.x = ( box.max.x + box.min.x )/2;
	dims.y = box.min.y;
	dims.z = ( box.max.z + box.min.z )/2;

	dims.scale = Math.max( box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z );

}



// merge a mesh into its parent, taking into consideration
// positions, orientations and scale. flattening occurs only
// for elements with a single child mesh
function flattenModel( model, rotate ) {

	var meshes = [];

	// extract meshes
	model.traverse( ( mesh )=>{

		if ( mesh.isMesh ) {

			var geo = mesh.geometry.clone().applyMatrix4( mesh.matrixWorld );
			var mat = mesh.material.clone();

			if ( mesh.isSkinnedMesh ) {

				mesh.pose();

				var pos = geo.getAttribute( 'position' );
				var nor = geo.getAttribute( 'normal' );
				var v = new THREE.Vector3();

				for ( var i=0; i<pos.count; i++ ) {

					v.fromBufferAttribute( pos, i );
					mesh.applyBoneTransform( i, v );
					pos.setXYZ( i, ...v );

					v.fromBufferAttribute( nor, i );
					mesh.applyBoneTransform( i, v );
					nor.setXYZ( i, ...v );

				}

			}

			var newMesh = new THREE.Mesh( geo, mat );
			newMesh.frustumCulled = false;


			meshes.push( newMesh );

		}

	} );

	// clear model
	/*
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );

	// add meshes
	model.add( ...meshes );
	*/

	var newModel = new THREE.Group();
	newModel.add( ...meshes );
	return newModel;

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission
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


/*
// prepared a model for TSL rigging
function processModel( model, space, posture, nodes, options={} ) {

	var dims = {};

	model = flattenModel( model, space?._?.rot ?? [ 0, 0, 0 ]);

	centerModel( model, dims );

	space = new Space( dims, space );

	ennodeModel( model, space, posture, nodes, options );

	return { model: model, dims: dims, space: space };

}
*/





// generate oversmooth function
const smoother = tsl.Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

} ).setLayout( {
	name: 'smoother',
	type: 'float',
	inputs: [
		{ name: 'edgeFrom', type: 'float' },
		{ name: 'edgeTo', type: 'float' },
		{ name: 'value', type: 'float' },
	]
} );



tsl.Fn( ()=>{

	return tsl.vec3( 1 );

} );


new SimplexNoise_js.SimplexNoise( );

var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

	return pos.sub( center ).mul( matRotYZX( angle.mul( amount ) ) ).add( center );

} ).setLayout( {
	name: 'jointRotate',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



var jointRotateArm= tsl.Fn( ([ pos, center, angle, amount ])=>{



	//matRotXZY, matRotYXZ, matRotYZX
	var newPos = pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center ).toVar();

	return newPos;

} ).setLayout( {
	name: 'jointRotate2',
	type: 'vec3',
	inputs: [
		{ name: 'pos', type: 'vec3' },
		{ name: 'center', type: 'vec3' },
		{ name: 'angle', type: 'vec3' },
		{ name: 'amount', type: 'float' },
	]
} );



function tslPositionNode( options ) {

	options.vertex = tsl.positionGeometry;
	options.mode = tsl.float( 1 );
	return disfigure( options );

}



function tslNormalNode( options ) {

	options.vertex = tsl.normalGeometry;
	options.mode = tsl.float( 0 );
	return tsl.transformNormalToView( disfigure( options ) ).xyz;//.normalize( );

}



var disfigure = tsl.Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();


	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft, space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft, space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft, space.armLeft.locus( )/*, space.armLeft.sublocus(  )*/ ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristRight.pivot ), posture.wristRight, space.wristRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmRight.pivot ), posture.forearmRight, space.forearmRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowRight.pivot ), posture.elbowRight, space.elbowRight.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armRight.pivot ), posture.armRight, space.armRight.locus( )/*, space.armRight.sublocus(  )*/ ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( space.head.pivot ), posture.head, space.head.locus( ) ) );
	p.assign( jointRotate( p, mode.mul( space.chest.pivot ), posture.chest, space.chest.locus() ) );
	p.assign( jointRotate( p, mode.mul( space.waist.pivot ), posture.waist, space.waist.locus() ) );



	// LEFT-LOWER BODY

	var legLeft = space.legLeft.locus( ).toVar();

	tsl.If( legLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft, space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongLeft.pivot ), posture.ankleLongLeft, space.ankleLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongLeft.pivot ), posture.legLongLeft, space.legLongLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft, legLeft ) );

	} );



	// RIGHT-LOWER BODY

	var legRight = space.legRight.locus( ).toVar();

	tsl.If( legRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footRight.pivot ), posture.footRight, space.footRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleRight.pivot ), posture.ankleRight, space.ankleRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLongRight.pivot ), posture.ankleLongRight, space.ankleLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeRight.pivot ), posture.kneeRight, space.kneeRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLongRight.pivot ), posture.legLongRight, space.legLongRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legRight.pivot ), posture.legRight, legRight ) );

	} );

	return p;

} ); // disfigure



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

// calculate actual value from normalize value
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



// clone an object and flip its pivot horizontally
function clone( instance ) {

	var obj = Object.assign( Object.create( instance ), instance );
	obj.pivot = obj.pivot.clone();
	obj.pivot.x *= -1;
	return obj;

}



// define a horizontal planar locus that can tilt fowrard
// (i.e. around X axix, towards the screen); vertically it
// is from minY to maxY, horizontally it is infinite
// areas outside rangeX are consider inside the locus
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

	}

	mirror( ) {

		var obj = clone( this );
		if ( 'minX' in obj ) {

			obj.minX *= -1;
			obj.maxX *= -1;

		}

		return obj;

	}

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

	}

}



// define a vertical planar locus, perpendicular to X,
// vertically infinite, horizontally from minX to maxX
class LocusX {

	constructor( dims, pivot, rangeX, angle=0 ) {

		this.pivot = decodePivot( pivot, dims );

		this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
		this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	mirror( ) {

		var obj = clone( this );

		obj.minX *= -1;
		obj.maxX *= -1;

		return obj;

	}

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

	}

}



// define a rectangular locus, from minX to maxX, from minY
// to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( dims, pivot, rangeX, rangeY ) {

		super( dims, pivot, rangeX );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

	}

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
			.pow( 2 )
		;

	}

}



// define custom trapezoidal locus specifically for hips
class LocusT extends LocusXY {

	constructor( dims, pivot, rangeX, rangeY, grown=0 ) {

		super( dims, pivot, rangeX, rangeY );

		this.grown = grown;

	}

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


		//  var s = vec3(pos.x.mul(2.0),pos.y,pos.z.min(0)).sub(vec3(0,this.pivot.y,0)).length().smoothstep(0,0.065).pow(10);

		return tsl.float( s )
			.mul(
				x.smoothstep( this.minX, this.maxX ),
				smoother( this.minY, this.maxY, y ).pow( 2 ),
			);

	}

}



class Space {

	constructor( dims, bodyParts ) {

		const classes = { LocusT: LocusT, LocusX: LocusX, LocusXY: LocusXY, LocusY: LocusY/*, LocusBox:LocusBox*/ };

		// bodyParts = { _:[[rot]], name:[LocusClass, data], ... }

		for ( var name in bodyParts ) if ( name != '_' ) {

			var partClass = classes[ bodyParts[ name ].shift() ];
			bodyParts[ name ] = new partClass( dims, ... bodyParts[ name ]);

		}

		// bodyParts = { name:LocusInstance, ... }
		this._ = bodyParts._;

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

	}

}

// disfigure
//
// This file is the space description of a male 3D model,
// i.e. 3D locations in space that correspond to various
// body movement. The model and the spaces and not quite
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
// This file is the space description of a female 3D model,
// i.e. 3D locations in space that correspond to various
// body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL$1 = 'woman.glb'; // model file



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
// This file is the space description of a child 3D model,
// i.e. 3D locations in space that correspond to various
// body movement. The model and the spaces and not quite
// perfect, this I've already spent enough time on this.



var URL = 'child.glb'; // model file



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

const MODEL_PATH = '../assets/models/';
const PI2 = 2*Math.PI;



//var models = {}; // a set of all models
var loader = new GLTFLoader_js.GLTFLoader();
var everybody = [];



//https://i.pinimg.com/474x/42/0f/9b/420f9b0944dc8f9b47ba431a2b628c10.jpg

// var colors = [
// 0xfed1b9, 0xfdc786, 0xaa6948, 0xfbc5a4, 0xfbbe9b, 0x9a572a, 0xfdcec7, 0x6f331d,
// 0x1e0e08, 0xfcbd84, 0x633c1d, 0x34251b, 0xa87256, 0x855f44, 0xb89c84, 0x9f6c56,
// ];



function angle( x ) {

	x = ( ( x%360 ) + 360 )%360;
	x = x>180?x-360:x;
	return x * PI2/360;

}



class Disfigure extends THREE__namespace.Group {

	constructor( MODEL_DEFINITION ) {

		super();

		this.castShadow = true;
		this.receiveShadow = true;

		this.dims = {};
		this.posture = tslPosture( MODEL_DEFINITION.SPACE );

		loader.load( MODEL_PATH + MODEL_DEFINITION.URL, ( gltf ) => {

			var model = flattenModel( gltf.scene);
			centerModel( model, this.dims );

			var space = new Space( this.dims, MODEL_DEFINITION.SPACE );


			ennodeModel( model, space, this.posture,
				{	// nodes
					//colorNode: tslWhiteNode, // color
					positionNode: tslPositionNode, // rigging
					normalNode: tslNormalNode, // lighting
					//colorNode: Fn( ()=>{return vec3( 0x30/0xFF, 0x20/0xFF, 0x10/0xFF ).pow(2.2);} ),
				},
				{	// additional material properties
					color: new THREE__namespace.Color( 0xfed1b9 ),
					metalness: 0,
					roughness: 0.6,
				} );

			model.position.y = -this.dims.y/2;
			model.castShadow = true;
			model.receiveShadow = true;
			this.add( model );
			everybody.push( this );

		} ); // load

	} // Disfigure.constructor

	head( nod, spin=0, tilt=0 ) {

		this.posture.head.value.set( nod, spin, tilt );

	}

	get headNod( ) {

		return this.posture.head.value.x;

	}
	set headNod( a ) {

		this.posture.head.value.x = angle( a );

	}

	get headSpin( ) {

		return this.posture.head.value.y;

	}
	set headSpin( a ) {

		this.posture.head.value.y = angle( a );

	}

	get headTilt( ) {

		return this.posture.head.value.z;

	}
	set headTilt( a ) {

		this.posture.head.value.z = angle( a );

	}

	get waistNod( ) {

		return this.posture.waist.value.x;

	}
	set waistNod( a ) {

		this.posture.waist.value.x = angle( a );

	}

	get waistSpin( ) {

		return this.posture.waist.value.y;

	}
	set waistSpin( a ) {

		this.posture.waist.value.y = angle( a );

	}


} // Disfigure



class Man extends Disfigure {

	constructor( ) {

		super( MAN );

		this.posture.legLeft.value.z = -0.1;
		this.posture.legRight.value.z = 0.1;

		this.posture.ankleLeft.value.z = 0.1;
		this.posture.ankleRight.value.z = -0.1;

	} // Man.constructor

} // Man



class Woman extends Disfigure {

	constructor( ) {

		super( WOMAN );

		this.posture.legLeft.value.z = 0.05;
		this.posture.legRight.value.z = -0.05;

	} // Woman.constructor

} // Woman



class Child extends Disfigure {

	constructor( ) {

		super( CHILD );

	} // Child.constructor

} // Child

exports.renderer = void 0; exports.scene = void 0; exports.camera = void 0; exports.light = void 0; exports.cameraLight = void 0; exports.controls = void 0; var userAnimationLoop;



// creates a default world with all its primary attributes
// the options parameters is a collection of flags that turn
// on/off specific features:
//
// options.lights		true, whether lights are created
// options.controls		true, whether OrbitControls is created
// options.ground		true, whether ground is created

function world( options ) {

	exports.renderer = new THREE__namespace.WebGPURenderer( { antialias: true } );
	exports.renderer.setSize( innerWidth, innerHeight );
	exports.renderer.shadowMap.enabled = true;
	exports.renderer.shadowMap.type = THREE__namespace.PCFSoftShadowMap;

	document.body.appendChild( exports.renderer.domElement );
	document.body.style.overflow = 'hidden';
	document.body.style.margin = '0';

	exports.scene = new THREE__namespace.Scene();
	exports.scene.background = new THREE__namespace.Color( 'whitesmoke' );

	exports.camera = new THREE__namespace.PerspectiveCamera( 30, innerWidth/innerHeight );
	exports.camera.position.set( 0, 1, 4 );
	exports.camera.lookAt( 0, 1, 0 );

	if ( options?.lights ?? true ) {

		exports.light = new THREE__namespace.DirectionalLight( 'white', 2 );
		exports.light.decay = 0;
		exports.light.position.set( 0, 2, 1 ).setLength( 15 );
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
		exports.scene.add( exports.light );

		exports.cameraLight = new THREE__namespace.DirectionalLight( 'white', 2 );
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

		var ground = new THREE__namespace.Mesh(
			new THREE__namespace.CircleGeometry( 50 ),
			new THREE__namespace.MeshLambertMaterial(
				{
					color: 'antiquewhite',
					transparent: true,
					map: new THREE__namespace.CanvasTexture( canvas )
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

} // world



// custom event to distribute animation requests to models

class NewEvent extends Event {

	#target;

	constructor( e ) {

		super( e );

	}

	get target() {

		return this.#target;

	}

	set target( a ) {

		this.#target = a;

	}

} // NewEvent



// default animation loop that dispatches animation event
// to the window and to each body

function defaultAnimationLoop( ) {

	var animateEvent = new Event( 'animate' );
	window.dispatchEvent( animateEvent );

	animateEvent = new NewEvent( 'animate' );
	everybody.forEach( ( p )=>{

		animateEvent.target = p;
		p.dispatchEvent( animateEvent );

	} );

	if ( userAnimationLoop ) userAnimationLoop( animateEvent.timeStamp );

	if ( exports.controls ) exports.controls.update( );

	exports.renderer.render( exports.scene, exports.camera );

}



// function to set animation loop, if events are not used

function setAnimationLoop( animationLoop ) {

	userAnimationLoop = animationLoop;

}

exports.Child = Child;
exports.Man = Man;
exports.Woman = Woman;
exports.everybody = everybody;
exports.setAnimationLoop = setAnimationLoop;
exports.world = world;
