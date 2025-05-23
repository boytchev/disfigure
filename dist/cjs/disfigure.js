// disfigure v0.0.7

'use strict';

var three = require('three');
var tsl = require('three/tsl');

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
function centerModel( model ) {

	var center = new three.Vector3();

	new three.Box3().setFromObject( model, true ).getCenter( center );
	model.position.sub( center );

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

			meshes.push( new three.Mesh( geo, mat ) );

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
function ennodeModel( model, skeleton, posture, nodes ) {

	model.traverse( ( child )=>{

		if ( child.isMesh ) {

			// convert the material into Node material
			//var material = new MeshStandardNodeMaterial();
			var material = new three.MeshPhysicalNodeMaterial();

			// copy all properties from the original material
			Object.assign( material, child.material );

			material.metalness = 0.1;
			material.roughness = 0.6;

			//			material.metalness = 0.5;
			//			material.roughness = 0.3;

			if ( nodes.colorNode )
				material.colorNode = nodes.colorNode( );

			if ( nodes.positionNode )
				material.positionNode = nodes.positionNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.normalNode )
				material.normalNode = nodes.normalNode( { skeleton: skeleton, posture: posture } );

			if ( nodes.emissiveNode )
				material.emissiveNode = nodes.emissiveNode( { skeleton: skeleton, posture: posture } );

			child.material = material;

		}

	} );

}



// prepared a model for TSL rigging
function processModel( model, skeleton, posture, nodes ) {

	flattenModel( model );
	ennodeModel( model, skeleton, posture, nodes );
	centerModel( model );

	return model;

}



// extract credits and place them in DOM element
// replaces the resource url extension with "txt"
// e.g. my-model.glb -> my-model.txt
function credits( url, id ) {

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {

		if ( this.readyState == 4 ) {

			if ( this.status == 200 ) {

				document.getElementById( id ).innerHTML = this.responseText.split( '||' )[ 0 ];

			}

		}

	};

	url = url.split( '.' );
	url.pop();
	url.push( 'txt' );
	url = url.join( '.' );

	xhttp.open( "GET", url, true );
	xhttp.send();

}

// a general class defining a locus in 3D space with fuzzy boundaries and orientation
class Locus {

	constructor( x, y, z, min, max ) {

		this.pivot = new three.Vector3( x, y, z );
		this.mirrorPivot = new three.Vector3( -x, y, z );

		this.min = min;
		this.max = max;

	}

}



// a horizontal planar locus, vertically is from min to max, horizontally is infinite
class LocusY extends Locus {

	fuzzy( ) {

		return tsl.positionGeometry.y.smoothstep( this.min, this.max );

	}

}



// a horizontal planar locus that can tilt fowrard (i.e. around X axix, towards the screen)
// vertically is from min to max, horizontally is infinite
class LocusYZ extends Locus {

	constructor( x, y, z, min, max, angle ) {

		super( x, y, z, min, max );
		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	}

	fuzzy( ) {

		return tsl.positionGeometry.y.add( tsl.positionGeometry.z.div( this.slope ) ).smoothstep( this.min, this.max );

	}

}



// a vertical planar locus, perpendiculra to X, vertically infinite, horizontally from min to max
class LocusX extends Locus {

	fuzzy( ) {

		return tsl.positionGeometry.x.smoothstep( this.min, this.max );

	}

	mirrorFuzzy( ) {

		return tsl.positionGeometry.x.smoothstep( -this.min, -this.max );

	}

}



// an intersection of LocusX and LocusY
class LocusXY extends Locus {

	constructor( x, y, z, minX, maxX, minY, maxY ) {

		super( x, y, z, minX, maxX );
		this.minY = minY;
		this.maxY = maxY;

	}

	fuzzy( ) {

		var x = tsl.positionGeometry.x.smoothstep( this.min, this.max );
		var y = tsl.positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

	mirrorFuzzy( ) {

		var x = tsl.positionGeometry.x.smoothstep( -this.min, -this.max );
		var y = tsl.positionGeometry.y.smoothstep( this.minY, this.maxY );

		return x.mul( y );

	}

}



// trapezoidal Locus for hips
class LocusT extends Locus {

	constructor( x, y, z, minY, maxY, topY ) {

		super( x, y, z, minY, maxY );
		this.topY = topY;

	}

	fuzzy( ) {

		var x = tsl.positionGeometry.x;
		var y = tsl.positionGeometry.y;

		return y.step( this.topY )
			.mul( x.smoothstep( -0.01, 0.015 ) )
			.mul( y.smoothstep(
				x.div( 0.7 ).add( this.min ),
				x.div( 7 ).add( this.max )
			)
			).pow( 2 );

	}

	mirrorFuzzy( ) {

		var x = tsl.positionGeometry.x;
		var y = tsl.positionGeometry.y;

		return y.step( this.topY )
			.mul( x.smoothstep( 0.01, -0.015 ) )
			.mul( y.smoothstep(
				x.div( -0.7 ).add( this.min ),
				x.div( -7 ).add( this.max )
			)
			).pow( 2 );

	}

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



var disfigure = tsl.Fn( ( { skeleton, posture, mode, vertex } )=>{

	var p = vertex.toVar();



	// LEFT-UPPER BODY

	var armLeft = skeleton.arm.fuzzy( ).toVar();

	tsl.If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.pivot ), posture.wristLeft, skeleton.wrist.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.pivot ), posture.forearmLeft, skeleton.forearm.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.pivot ), posture.elbowLeft, skeleton.elbow.fuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.pivot ), posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = skeleton.arm.mirrorFuzzy( ).toVar();

	tsl.If( armRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.wrist.mirrorPivot ), posture.wristRight, skeleton.wrist.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.forearm.mirrorPivot ), posture.forearmRight, skeleton.forearm.mirrorFuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.elbow.mirrorPivot ), posture.elbowRight, skeleton.elbow.mirrorFuzzy( ) ) );
		p.assign( jointRotateArm( p, mode.mul( skeleton.arm.mirrorPivot ), posture.armRight, armRight ) );

	} );



	// CENTRAL BODY AXIS

	p.assign( jointRotate( p, mode.mul( skeleton.head.pivot ), posture.head, skeleton.head.fuzzy( ) ) );
	p.assign( jointRotate( p, mode.mul( skeleton.chest.pivot ), posture.chest, skeleton.chest.fuzzy() ) );
	p.assign( jointRotate( p, mode.mul( skeleton.waist.pivot ), posture.waist, skeleton.waist.fuzzy() ) );



	// LEFT-LOWER BODY

	var hipLeft = skeleton.hip.fuzzy( ).toVar();

	tsl.If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.pivot ), posture.footLeft, skeleton.foot.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.pivot ), posture.ankleLeft, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.pivot ), posture.legLeft, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.pivot ), posture.kneeLeft, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.pivot ), posture.hip2Left, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip.pivot ), posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = skeleton.hip.mirrorFuzzy( ).toVar();

	tsl.If( hipRight.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( skeleton.foot.mirrorPivot ), posture.footRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.ankle.mirrorPivot ), posture.ankleRight, skeleton.ankle.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.leg.mirrorPivot ), posture.legRight, skeleton.leg.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.knee.mirrorPivot ), posture.kneeRight, skeleton.knee.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip2.mirrorPivot ), posture.hip2Right, skeleton.hip2.fuzzy( ) ) );
		p.assign( jointRotate( p, mode.mul( skeleton.hip.mirrorPivot ), posture.hipRight, hipRight ) );

	} );

	return p;

} ); // disfigure



// dubug function used to mark areas on the 3D model

var tslEmissiveNode = tsl.Fn( ( { skeleton, posture } )=>{

	var s = posture.select;
	var k = tsl.float( 0 )
		.add( skeleton.head.fuzzy( ).mul( tsl.select( s.equal( 1 ), 1, 0 ) ) )
		.add( skeleton.chest.fuzzy( ).mul( tsl.select( s.equal( 2 ), 1, 0 ) ) )
		.add( skeleton.waist.fuzzy( ).mul( tsl.select( s.equal( 3 ), 1, 0 ) ) )

		.add( skeleton.hip.fuzzy( ).mul( tsl.select( s.equal( 11 ), 1, 0 ) ) )
		.add( skeleton.leg.fuzzy( ).mul( tsl.select( s.equal( 12 ), 1, 0 ) ) )
		.add( skeleton.knee.fuzzy( ).mul( tsl.select( s.equal( 13 ), 1, 0 ) ) )
		.add( skeleton.ankle.fuzzy( ).mul( tsl.select( s.equal( 14 ), 1, 0 ) ) )
		.add( skeleton.foot.fuzzy( ).mul( tsl.select( s.equal( 16 ), 1, 0 ) ) )
		.add( skeleton.hip2.fuzzy( ).mul( tsl.select( s.equal( 15 ), 1, 0 ) ) )

		.add( skeleton.arm.fuzzy( ).mul( tsl.select( s.equal( 21 ), 1, 0 ) ) )
		.add( skeleton.elbow.fuzzy( ).mul( tsl.select( s.equal( 22 ), 1, 0 ) ) )
		.add( skeleton.forearm.fuzzy( ).mul( tsl.select( s.equal( 23 ), 1, 0 ) ) )
		.add( skeleton.wrist.fuzzy( ).mul( tsl.select( s.equal( 24 ), 1, 0 ) ) )

		.clamp( 0, 1 )
		.negate( )
		.toVar( );
	/*
	k.assign( select( posture.isolated,
		k.smoothstep( 0, 1 ).mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).pow( 1/4 ).mul( 1.1 ).negate(),
		k.clamp( 0, 1 ).pow( 0.75 ).negate()
	) );
*/
	tsl.If( k.lessThan( -0.999 ), ()=>{

		k.assign( 0.2 );

	} );
	return tsl.vec3( 0, k.div( 2 ), k.div( 1 ) );

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
exports.LocusYZ = LocusYZ;
exports.credits = credits;
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
