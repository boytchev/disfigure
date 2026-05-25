
// disfigure



import { float, Fn, If, int, Loop, positionGeometry, select, step, uniform, vec3 } from 'three/tsl';
import { gradientArm, gradientLeg, gradientX, gradientXT, gradientY, gradientYT } from '../tsl.js';
import { extras, pivots, ranges } from '../assets.js';



var selectUniform = uniform( 1 );


var disfigureSelect = Fn( ([ mat, i, k ])=>{

	var newMat = mat.toVar();

	var selection = select( int( i.round() ).equal( int( selectUniform.round() ) ), 1, 0 );

	newMat.addAssign( k.mul( selection ) );

	return newMat;

}, { return: 'float', mat: 'float', selection: 'float', k: 'float' } );



var disfigureBodySelect = Fn( ([ baseIndex ])=>{


	// header
	var p = positionGeometry.toVar( );
	var m = float( 0 ).toVar();

	//	var pivots = array( figureData.pivots ).toConst( 'pivots' ),
	//		ranges = array( figureData.ranges ).toConst( 'ranges' ),
	//		extras = array( figureData.extras ).toConst( 'extras' );

	var isLeft = step( p.x, 0 ).toVar( ),
		isDown = p.y.lessThan( pivots.element( baseIndex.add( 2 ) ).y ), //chest
		isHand = p.x.abs().greaterThan( pivots.element( baseIndex.add( 16 ) ).x ); // wrist

	var disP = ( i, gradient ) => m.assign( disfigureSelect( m, i, gradient ) ),
		disY = ( i ) => m.assign( disfigureSelect( m, i, gradientY( p, ranges.element( i.add( baseIndex ) ) ) ) ),
		disX = ( i ) => m.assign( disfigureSelect( m, i, gradientX( p, ranges.element( i.add( baseIndex ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureSelect( m, i, gradientXT( p, ranges.element( i.add( baseIndex ) ), 0 ) ) );

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();


	If( isDown, ()=>{

		// process legs

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh
		Loop( { start: start, end: end }, ( { i } ) => disY( i ) );

		// leg
		disP( end, gradientLeg( p, ranges.element( end ), extras.element( leg ).xy ) );

	} ).Else( ()=>{

		// process hands
		If( isHand, ()=>{

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			disP( thumb, gradientXT( p, ranges.element( thumb ), extras.element( thumb2 ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradientYT( p, ranges.element( thumb ), extras.element( thumb2 ).y ) );

			let start = pick( 28, 40 ),
				end = start.add( 12 );

			// index, middle, ring, pinky
			Loop( { start: start, end: end }, ( { i } ) => disT( i ) );

		} );

		// process arms

		let start = pick( 16, 20 ),
			end = start.add( 3 );

		// wrist forearm elbow
		Loop( { start: start, end: end }, ( { i } ) => disX( i ) );

		// arm
		disP( end, gradientArm( p, pivots.element( end ), ranges.element( end ) ) );

	} );



	//	process torso

	Loop( { end: int( 4 ) }, ( { i } ) => disY( i ) );

	// recolor depending on selection level

	var col = vec3( 0, 0, 0 ).toVar();


	const n = 5;
	//	var k2 = m.mul( n*Math.PI*2 ).sub( Math.PI/2 ).sin().toVar();

	var k = m.mul( n ).round().div( n ).toVar();

	If( k.equal( 1 ), ()=>{

		col.assign( vec3( 0 ) );

	} )
		.ElseIf( k.greaterThan( 0 ), ()=>{

			col.assign( vec3( 1, -1, -1 ) );

		} )
		.Else( ()=>{

			col.assign( vec3( 0 ) );

		} );

	// If( k2.greaterThan( 0.98 ), ()=>{

	// col.assign( vec3( -1 ) );

	// } );

	//}

	return col;

} );


export { disfigureBodySelect, selectUniform };
