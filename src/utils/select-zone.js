
// disfigure



import { attribute, float, Fn, If, int, Loop, positionGeometry, step, time, uniform, vec3 } from 'three/tsl';
import { gradientArm, gradientLeg, gradient, gradientXT } from '../tsl.js';
import { PURE_QUATS_PER_BODY, QUAT_DATA_INDEX, QUATS_PER_BODY, extras, pivots, ranges, quatTextureNode } from '../assets.js';


var selectUniform = uniform( 1 );


var disfigureMatrix = Fn( ([ mat, k ])=>{

	var newMat = mat.toVar();

	If( k.greaterThan( 0 ).and( k.lessThan( 1 ) ), () => {

		newMat.addAssign( 1 );

	} );
	return newMat;

}, { return: 'float', mat: 'float', k: 'float' } );

var disfigureBodySelect = Fn( ([ ])=>{


	// header
	var p = positionGeometry.toVar( );
	var m = float( 0 ).toVar();

	var figureIndex = attribute( 'uids', 'int' ).mul( QUATS_PER_BODY ).toVar();

	var gender = quatTextureNode.get( figureIndex, QUAT_DATA_INDEX ).x.mul( PURE_QUATS_PER_BODY ).toVar(); // 52 pivots
	var gender_ex = quatTextureNode.get( figureIndex, QUAT_DATA_INDEX ).x.mul( 4 ).toVar(); // 4 extras

	// Helper functions for different deformation types

	var disP = ( i, gradient ) => m.assign( disfigureMatrix( m, gradient ) ),
		disX = ( p, i ) => m.assign( disfigureMatrix( m, gradient( p, ranges.element( i.add( gender ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureMatrix( m, gradientXT( p, ranges.element( i.add( gender ) ), 0 ) ) );

	// Side and region detection

	var isLeft = int( step( p.x, 0 ) ).toVar( ),
		isDown = p.y.lessThan( pivots.element( int( 2 ).add( gender ) ).y ), //below chest
		isHand = p.x.abs().greaterThan( pivots.element( int( 16 ).add( gender ) ).x ); // beyond wrist

	// Helper function to simulate ternary isLeft?left:right

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();

	If( isDown, ()=>{

		// process legs

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh
		Loop( { start: start, end: end }, ( { i } ) => disX( p.yzx, i ) );

		// leg
		disP( end, gradientLeg( p, ranges.element( end.add( gender ) ), extras.element( leg.add( gender_ex ) ).xy ) );

	} ).Else( ()=>{

		// process hands
		If( isHand, ()=>{

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			disP( thumb, gradientXT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender_ex ) ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradient( p.zxy, ranges.element( thumb.add( gender ) ).zwxy ) );

			let start = pick( 28, 40 ),
				end = start.add( 12 );

			// index, middle, ring, pinky
			Loop( { start: start, end: end }, ( { i } ) => disT( i ) );

		} );
		// process arms

		let start = pick( 16, 20 ),
			end = start.add( 3 );

		// wrist forearm elbow
		Loop( { start: start, end: end }, ( { i } ) => disX( p, i ) );

		// arm
		disP( end, gradientArm( p, pivots.element( end.add( gender ) ), ranges.element( end.add( gender ) ) ) );

	} );



	//	process torso

	//Loop( { end: int( 4 ) }, ( { i } ) => disX( p.yzx, i ) );
	Loop( { end: int( 3 ) }, ( { i } ) => disX( p.yzx, i ) );



	// recolor depending on selection level

	//m.assign( m.fract() );

	var col = vec3( time.mul( 20 ).sin().mul( 10 ) ).toVar();

	If( m.equal( 0 ), ()=>{

		col.assign( vec3( 0, 0, 0 ) );

	} ); //normal
	If( m.equal( 1 ), ()=>{

		col.assign( vec3( -1, 1, -1 ) );

	} ); //green
	If( m.equal( 2 ), ()=>{

		col.assign( vec3( 1, -1, -1 ) );

	} ); //red

	return col.div( 10 );

} );


export { disfigureBodySelect, selectUniform };
