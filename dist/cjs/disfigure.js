// disfigure v0.0.9

'use strict';

var tsl = require('three/tsl');
var three = require('three');

// calculate actual value from normalize value
function decode( value, scale, offset ) {

	return scale*value/1000 + offset;

}



// calculate a pivot vector with actual coordinates
function decodePivot( pivot, dims ) {

	return new three.Vector3(
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
class LocusY {

	constructor( dims, pivot, rangeY, angle=0 ) {

		this.pivot = decodePivot( pivot, dims );

		this.minY = decode( rangeY[ 0 ], dims.scale, dims.y );
		this.maxY = decode( rangeY[ 1 ], dims.scale, dims.y );

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	mirror( ) {

		return clone( this );

	}

	locus( ) {

		var y = tsl.positionGeometry.y;
		if ( this.angle!=0 ) y = y.add( tsl.positionGeometry.z.div( this.slope ) );

		return y.smoothstep( this.minY, this.maxY );

	}

}



// define a vertical planar locus, perpendicular to X,
// vertically infinite, horizontally from minX to maxX
class LocusX {

	constructor( dims, pivot, rangeX ) {

		this.pivot = decodePivot( pivot, dims );

		this.minX = decode( rangeX[ 0 ], dims.scale, dims.x );
		this.maxX = decode( rangeX[ 1 ], dims.scale, dims.x );

	}

	mirror( ) {

		var obj = clone( this );
		obj.minX *= -1;
		obj.maxX *= -1;
		return obj;

	}

	locus( ) {

		return tsl.positionGeometry.x.smoothstep( this.minX, this.maxX );

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

	locus( ) {

		var x = tsl.positionGeometry.x.smoothstep( this.minX, this.maxX );
		var y = tsl.positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

}



// define custom trapezoidal locus specifically for hips
class LocusT extends LocusXY {

	constructor( dims, pivot, rangeX, rangeY, topY ) {

		super( dims, pivot, rangeX, rangeY );

		this.topY = decode( topY, dims.scale, dims.y );

	}

	locus( ) {

		var x = tsl.positionGeometry.x.toVar();
		var y = tsl.positionGeometry.y;

		return y.step( this.topY )
			.mul( x.smoothstep( this.minX, this.maxX ) )
			.mul( y.smoothstep(
				x.abs().div( 0.7 ).add( this.minY ),
				x.abs().div( 7.0 ).add( this.maxY )
			)
			).pow( 2 );

	}

}



class Space {

	constructor( dims, bodyParts ) {

		// bodyParts = { name:[LocusClass, data], ... }

		for ( var name in bodyParts ) {

			var partClass = bodyParts[ name ].shift();
			bodyParts[ name ] = new partClass( dims, ... bodyParts[ name ]);

		}

		// bodyParts = { name:LocusInstance, ... }

		// torso
		this.head = bodyParts.head;
		this.chest = bodyParts.chest;
		this.waist = bodyParts.waist;

		// legs
		this.kneeLeft = bodyParts?.kneeLeft ?? bodyParts.knee;
		this.kneeRight = bodyParts?.kneeRight ?? bodyParts.knee.mirror();

		this.ankleLeft = bodyParts?.ankleLeft ?? bodyParts.ankle;
		this.ankleRight = bodyParts?.ankleRight ?? bodyParts.ankle.mirror();

		this.legLeft = bodyParts?.legLeft ?? bodyParts.leg;
		this.legRight = bodyParts?.legRight ?? bodyParts.leg.mirror();

		this.hip2Left = bodyParts?.hip2Left ?? bodyParts.hip2;
		this.hip2Right = bodyParts?.hip2Right ?? bodyParts.hip2.mirror();

		this.footLeft = bodyParts?.footLeft ?? bodyParts.foot;
		this.footRight = bodyParts?.footRight ?? bodyParts.foot.mirror();

		this.hipLeft = bodyParts?.hipLeft ?? bodyParts.hip;
		this.hipRight = bodyParts?.hipRight ?? bodyParts.hip.mirror();

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
const matRotYXZ = tsl.Fn( ([ angles ])=>{

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
const matRotXYZ = tsl.Fn( ([ angles ])=>{

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
const matRotZXY = tsl.Fn( ([ angles ])=>{

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
const matRotZYX = tsl.Fn( ([ angles ])=>{

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

	var center = new three.Vector3();

	var box = new three.Box3().setFromObject( model, true );

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
function flattenModel( model ) {

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
				var v = new three.Vector3();

				for ( var i=0; i<pos.count; i++ ) {

					v.fromBufferAttribute( pos, i );
					mesh.applyBoneTransform( i, v );
					pos.setXYZ( i, ...v );

					v.fromBufferAttribute( nor, i );
					mesh.applyBoneTransform( i, v );
					nor.setXYZ( i, ...v );

				}

			}

			var newMesh = new three.Mesh( geo, mat );
			newMesh.frustumCulled = false;

			meshes.push( newMesh );

		}

	} );

	// clear model
	model.clear( );
	model.position.set( 0, 0, 0 );
	model.rotation.set( 0, 0, 0, 'XYZ' );
	model.scale.set( 1, 1, 1 );

	// add meshes
	model.add( ...meshes );

}



// convert all model materials to Node materials
// attach TSL functions for vertices, colors and emission
function ennodeModel( model, space, posture, nodes, options ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			//var material = new MeshStandardNodeMaterial();
			var material = new three.MeshPhysicalNodeMaterial();

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

		}

	} );

}



// prepared a model for TSL rigging
function processModel( model, space, posture, nodes, options={} ) {

	var dims = {};

	flattenModel( model );
	centerModel( model, dims );

	space = new Space( dims, space );

	ennodeModel( model, space, posture, nodes, options );

	return { model: model, dims: dims, space: space };

}

var jointRotate= tsl.Fn( ([ pos, center, angle, amount ])=>{

	// for legs matRotYZX was better, but for all others matRotYXZ is better
	return pos.sub( center ).mul( matRotYXZ( angle.mul( amount ) ) ).add( center );

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

	//return pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center );
	return tsl.mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( tsl.float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

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
	return tsl.transformNormalToView( disfigure( options ) ).normalize( );

}



var disfigure = tsl.Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();



	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft, space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft, space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristRight.pivot ), posture.wristRight, space.wristRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmRight.pivot ), posture.forearmRight, space.forearmRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowRight.pivot ), posture.elbowRight, space.elbowRight.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armRight.pivot ), posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( space.head.pivot ), posture.head, space.head.locus( ) ) );
	p.assign( jointRotate( p, mode.mul( space.chest.pivot ), posture.chest, space.chest.locus() ) );
	p.assign( jointRotate( p, mode.mul( space.waist.pivot ), posture.waist, space.waist.locus() ) );



	// LEFT-LOWER BODY

	var hipLeft = space.hipLeft.locus( ).toVar();

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft, space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft, space.legLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hip2Left.pivot ), posture.hip2Left, space.hip2Left.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hipLeft.pivot ), posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = space.hipRight.locus( ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footRight.pivot ), posture.footRight, space.footRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleRight.pivot ), posture.ankleRight, space.ankleRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legRight.pivot ), posture.legRight, space.legRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeRight.pivot ), posture.kneeRight, space.kneeRight.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hip2Right.pivot ), posture.hip2Right, space.hip2Right.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hipRight.pivot ), posture.hipRight, hipRight ) );

	} );

	return p;

} ); // disfigure



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = tsl.Fn( ( { space, posture } )=>{

	var s = posture.select;
	var k = tsl.float( 0 )
		.add( space.head.locus( ).mul( tsl.select( s.equal( 1 ), 1, 0 ) ) )
		.add( space.chest.locus( ).mul( tsl.select( s.equal( 2 ), 1, 0 ) ) )
		.add( space.waist.locus( ).mul( tsl.select( s.equal( 3 ), 1, 0 ) ) )

		.add( space.hipLeft.locus( ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )
		.add( space.hipRight.locus( ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )

		.add( space.legLeft.locus( ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )
		.add( space.legRight.locus( ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )

		.add( space.kneeLeft.locus( ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )
		.add( space.kneeRight.locus( ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )

		.add( space.ankleLeft.locus( ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )
		.add( space.ankleRight.locus( ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )

		.add( space.footLeft.locus( ).mul( tsl.select( s.equal( 16 ), 1, 0 ) ) )
		.add( space.footRight.locus( ).mul( tsl.select( s.equal( 16 ), 1, 0 ) ) )

		.add( space.hip2Left.locus( ).mul( tsl.select( s.equal( 15 ), 1, 0 ) ) )
		.add( space.hip2Right.locus( ).mul( tsl.select( s.equal( 15 ), 1, 0 ) ) )

		.add( space.armLeft.locus( ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )
		.add( space.armRight.locus( ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )

		.add( space.elbowLeft.locus( ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )
		.add( space.elbowRight.locus( ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )

		.add( space.forearmLeft.locus( ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )
		.add( space.forearmRight.locus( ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )

		.add( space.wristLeft.locus( ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )
		.add( space.wristRight.locus( ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )

		.clamp( 0, 1 )
		.negate( )
		.toVar( );

	var color = tsl.vec3( tsl.float( -1 ).sub( k ), k.div( 2 ), k.div( 1/2 ) ).toVar();

	tsl.If( k.lessThan( -0.99 ), ()=>{

		color.assign( tsl.vec3( 0, 0, 0 ) );

	} );

	tsl.If( k.greaterThan( -0.01 ), ()=>{

		color.assign( tsl.vec3( 0, 0, 0 ) );

	} );


	return color;

} );



var tslColorNode = tsl.Fn( ()=>{

	var p = tsl.positionGeometry;

	var k = tsl.float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return tsl.vec3( k );

} );



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
		hipLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Left: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hipRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		hip2Right: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legLeft: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),
		legRight: tsl.uniform( tsl.vec3( 0, 0, 0 ) ),

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

exports.LocusT = LocusT;
exports.LocusX = LocusX;
exports.LocusXY = LocusXY;
exports.LocusY = LocusY;
exports.Space = Space;
exports.matRotXYZ = matRotXYZ;
exports.matRotXZY = matRotXZY;
exports.matRotYXZ = matRotYXZ;
exports.matRotYZX = matRotYZX;
exports.matRotZXY = matRotZXY;
exports.matRotZYX = matRotZYX;
exports.processModel = processModel;
exports.tslColorNode = tslColorNode;
exports.tslEmissiveNode = tslEmissiveNode;
exports.tslNormalNode = tslNormalNode;
exports.tslPositionNode = tslPositionNode;
exports.tslPosture = tslPosture;
