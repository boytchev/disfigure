
// disfigure
// to do: simplify matrix operation when rotations are DOF<3

import { float, Fn, If, mix, normalGeometry, positionGeometry, select, transformNormalToView, uniform, vec3 } from "three/tsl";
import { matRotXZY, matRotYXZ } from "./utils.js";



var jointRotate= Fn( ([ pos, center, angle, amount ])=>{

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



var jointRotateArm= Fn( ([ pos, center, angle, amount ])=>{

	//return pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).add( center );
	return mix( pos, pos.sub( center ).mul( matRotXZY( angle.mul( amount ) ) ).mul( float( 1 ).sub( amount.mul( 2*Math.PI ).sub( Math.PI ).cos().add( 1 ).div( 2 ).div( 4 ).mul( angle.z.cos().oneMinus() ) ) ).add( center ), amount.pow( 0.25 ) );

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

	options.vertex = positionGeometry;
	options.mode = float( 1 );
	return disfigure( options );

}



function tslNormalNode( options ) {

	options.vertex = normalGeometry;
	options.mode = float( 0 );
	return transformNormalToView( disfigure( options ) ).normalize( );

}



var disfigure = Fn( ( { space, posture, mode, vertex } )=>{

	var p = vertex.toVar();



	// LEFT-UPPER BODY

	var armLeft = space.armLeft.locus( ).toVar();

	If( armLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.wristLeft.pivot ), posture.wristLeft, space.wristLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.forearmLeft.pivot ), posture.forearmLeft, space.forearmLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.elbowLeft.pivot ), posture.elbowLeft, space.elbowLeft.locus( ) ) );
		p.assign( jointRotateArm( p, mode.mul( space.armLeft.pivot ), posture.armLeft, armLeft ) );

	} );



	// RIGHT-UPPER BODY

	var armRight = space.armRight.locus( ).toVar();

	If( armRight.greaterThan( 0 ), ()=>{

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

	If( hipLeft.greaterThan( 0 ), ()=>{

		p.assign( jointRotate( p, mode.mul( space.footLeft.pivot ), posture.footLeft, space.footLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.ankleLeft.pivot ), posture.ankleLeft, space.ankleLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.legLeft.pivot ), posture.legLeft, space.legLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.kneeLeft.pivot ), posture.kneeLeft, space.kneeLeft.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hip2Left.pivot ), posture.hip2Left, space.hip2Left.locus( ) ) );
		p.assign( jointRotate( p, mode.mul( space.hipLeft.pivot ), posture.hipLeft, hipLeft ) );

	} );



	// RIGHT-LOWER BODY

	var hipRight = space.hipRight.locus( ).toVar();

	If( hipRight.greaterThan( 0 ), ()=>{

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

var tslEmissiveNode = Fn( ( { space, posture } )=>{

	var s = posture.select;
	var k = float( 0 )
		.add( space.head.locus( ).mul( select( s.equal( 1 ), 1, 0 ) ) )
		.add( space.chest.locus( ).mul( select( s.equal( 2 ), 1, 0 ) ) )
		.add( space.waist.locus( ).mul( select( s.equal( 3 ), 1, 0 ) ) )

		.add( space.hipLeft.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )
		.add( space.hipRight.locus( ).mul( select( s.equal( 11 ), 1, 0 ) ) )

		.add( space.legLeft.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )
		.add( space.legRight.locus( ).mul( select( s.equal( 12 ), 1, 0 ) ) )

		.add( space.kneeLeft.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )
		.add( space.kneeRight.locus( ).mul( select( s.equal( 13 ), 1, 0 ) ) )

		.add( space.ankleLeft.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )
		.add( space.ankleRight.locus( ).mul( select( s.equal( 14 ), 1, 0 ) ) )

		.add( space.footLeft.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )
		.add( space.footRight.locus( ).mul( select( s.equal( 16 ), 1, 0 ) ) )

		.add( space.hip2Left.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )
		.add( space.hip2Right.locus( ).mul( select( s.equal( 15 ), 1, 0 ) ) )

		.add( space.armLeft.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )
		.add( space.armRight.locus( ).mul( select( s.equal( 21 ), 1, 0 ) ) )

		.add( space.elbowLeft.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )
		.add( space.elbowRight.locus( ).mul( select( s.equal( 22 ), 1, 0 ) ) )

		.add( space.forearmLeft.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )
		.add( space.forearmRight.locus( ).mul( select( s.equal( 23 ), 1, 0 ) ) )

		.add( space.wristLeft.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )
		.add( space.wristRight.locus( ).mul( select( s.equal( 24 ), 1, 0 ) ) )

		.clamp( 0, 1 )
		.negate( )
		.toVar( );

	var color = vec3( float( -1 ).sub( k ), k.div( 2 ), k.div( 1/2 ) ).toVar();

	If( k.lessThan( -0.99 ), ()=>{

		color.assign( vec3( 0, 0, 0 ) );

	} );

	If( k.greaterThan( -0.01 ), ()=>{

		color.assign( vec3( 0, 0, 0 ) );

	} );


	return color;

} );



var tslColorNode = Fn( ()=>{

	var p = positionGeometry;

	var k = float( 0 )
		.add( p.x.mul( 72 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.y.mul( 74 ).cos().smoothstep( 0.9, 1 ) )
		.add( p.z.mul( 74 ).add( p.y.mul( 4.5 ).add( 0.5 ).cos().mul( 1 ).add( 2.5 ) ).abs().smoothstep( 0.6, 0 ) )
		.smoothstep( 0.6, 1 )
		.oneMinus()
		.pow( 0.1 )
		;

	return vec3( k );

} );



function tslPosture( ) {

	return {

		// TORSO
		head: uniform( vec3( 0, 0, 0 ) ),
		chest: uniform( vec3( 0, 0, 0 ) ),
		waist: uniform( vec3( 0, 0, 0 ) ),

		// LEGS
		kneeLeft: uniform( vec3( 0, 0, 0 ) ),
		kneeRight: uniform( vec3( 0, 0, 0 ) ),
		ankleLeft: uniform( vec3( 0, 0, 0 ) ),
		ankleRight: uniform( vec3( 0, 0, 0 ) ),
		footLeft: uniform( vec3( 0, 0, 0 ) ),
		footRight: uniform( vec3( 0, 0, 0 ) ),
		hipLeft: uniform( vec3( 0, 0, 0 ) ),
		hip2Left: uniform( vec3( 0, 0, 0 ) ),
		hipRight: uniform( vec3( 0, 0, 0 ) ),
		hip2Right: uniform( vec3( 0, 0, 0 ) ),
		legLeft: uniform( vec3( 0, 0, 0 ) ),
		legRight: uniform( vec3( 0, 0, 0 ) ),

		// ARMS
		elbowLeft: uniform( vec3( 0, 0, 0 ) ),
		elbowRight: uniform( vec3( 0, 0, 0 ) ),
		forearmLeft: uniform( vec3( 0, 0, 0 ) ),
		forearmRight: uniform( vec3( 0, 0, 0 ) ),
		wristLeft: uniform( vec3( 0, 0, 0 ) ),
		wristRight: uniform( vec3( 0, 0, 0 ) ),
		armLeft: uniform( vec3( 0, 0, 0 ) ),
		armRight: uniform( vec3( 0, 0, 0 ) ),
	};

}



export { tslPositionNode, tslEmissiveNode, tslColorNode, tslNormalNode, tslPosture };
export * from "./space.js";
export * from "./utils.js";
