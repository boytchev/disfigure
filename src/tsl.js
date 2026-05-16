
// disfigure



import { attribute, Fn, If, int, ivec2, Loop, mat3, normalGeometry, positionGeometry, select, step, transformNormalToView, vec3, vec4 } from 'three/tsl';
import { EQ, EQ_DATA, extras, pivots, ranges } from './assets.js';
import { quatTextureNode, TEXTURE_WIDTH } from './quats.js';



var rotateByQuaternion = Fn( ([ p, q ])=>{

	return p.add( q.xyz.cross( q.xyz.cross( p ).add( q.w.mul( p ) ) ).mul( 2 ) );

}, { return: 'vec3', p: 'vec3', q: 'vec4' } );



var scaleQuaternion = Fn( ([ quat, k ])=>{

	var q = vec4();
	var len = quat.xyz.length().toVar();

	If( len.lessThan( 1e-5 ), ()=>{

		q.assign( vec4( 0, 0, 0, 1 ) );

	} ).

		Else( ()=>{

			var acos = k.mul( quat.w.acos() ).toVar();
			q.assign( vec4( quat.xyz.div( len ).mul( acos.sin() ), acos.cos() ) );

		} );

	return q;

}, { return: 'vec4', quat: 'vec4', k: 'float' } );



var disfigureMatrix = Fn( ([ mat, pivot, quat, k ])=>{

	var newMat = mat.toVar();

	// if k>0 the 'matrix' must be updated
	If( k.greaterThan( 0 ), () => {

		var q = quat.toVar();

		// if k<1 the quaternion's rotation must be 'divided'
		If( k.lessThan( 1 ), ()=>{

			q.assign( scaleQuaternion( q, k ) );

		} ); // k<1

		newMat.element( 0 ).assign( rotateByQuaternion( mat.element( 0 ).sub( pivot ), q ).add( pivot ) );
		newMat.element( 1 ).assign( rotateByQuaternion( mat.element( 1 ), q ) );

	} ); // k>0

	return newMat;

}, { return: 'mat3', mat: 'mat3', pivot: 'vec3', quat: 'vec4', k: 'float' } );



var layout = { pos: 'vec3', range: 'vec4', return: 'float' };



var gradientX = Fn( ([ pos, range ])=>pos.x.add( pos.y.mul( range.z ) ).smoothstep( range.x, range.y ), layout );



var gradientY = Fn( ([ pos, range ])=>pos.y.add( pos.z.mul( range.z ) ).smoothstep( range.x, range.y ), layout );



var gradientYT = Fn( ([ pos, range, slope ])=>{

	return pos.z.add( pos.x.mul( slope ) ).smoothstep( range.z, range.w );

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



var gradientLeg = Fn( ([ pos, range, range2 ])=>{

	var y = pos.y.sub( pos.x.abs().mul( 1/5 ) );
	var ofs = select( range2.x.equal( 1 ), pos.z.add( 0.05 ).abs().mul( 1/2 ), pos.z.mul( 1/6 ) );

	return pos.x.smoothstep( 0, range2.y )
		.mul( y.smoothstep( range.x.sub( ofs ), range.y ).smoothstep( 0, 1 ).pow( 2 ) )
		.add( pos.x.smoothstep( 0, range2.y.div( 10 ) ).mul( y.smoothstep( range.z, range.w ) ) )
		.clamp( 0, 1 )
	;

}, { return: 'float', pos: 'vec3', range: 'vec4', range2: 'vec2' } );



var gradientArm = Fn( ([ pos, pivot, range ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, select( x.greaterThan( 0 ), 1, -1 ) );

	return x.add( dx ).smoothstep( range.x, range.y ).smoothstep( 0, 1 )
		.mul( y.step( range.z ).oneMinus() );

}, { pos: 'vec3', pivot: 'vec3', range: 'vec4', return: 'float' } );



var gradientXT = Fn( ([ pos, range, slope ])=>
	pos.x.add( pos.z.mul( slope ) )
		.smoothstep( range.x, range.y )
		.mul(
			pos.z.smoothstep( range.z.sub( 0.0001 ), range.z.add( 0.0001 ) ),
			pos.z.smoothstep( range.w.add( 0.0001 ), range.w.sub( 0.0001 ) )
		)
, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );


var getQuatAddr = Fn( ([ figureIndex, propIndex ])=>{

	var offset = figureIndex.mul( EQ ).add( propIndex );//.toVar();
	return ivec2( offset.mod( TEXTURE_WIDTH ), offset.div( TEXTURE_WIDTH ) );

}, { return: 'ivec2', figureIndex: 'uint', propIndex: 'int' } );



var q = ( figureIndex, propIndex )=> {

	return quatTextureNode.load( getQuatAddr( figureIndex, propIndex ) );

};



var disfigureBody = Fn( ( )=>{

	var p = positionGeometry,
		m = mat3( p, normalGeometry.normalize(), vec3( 0 ) ).toVar( );

	var figureIndex = attribute( 'uids', 'int' );

	var gender = q( figureIndex, EQ_DATA ).x.mul( 52 ).toVar(); // 52 pivots
	var gender2 = q( figureIndex, EQ_DATA ).x.mul( 4 ).toVar(); // 4 extras

	var disP = ( i, gradient ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradient ) ),
		disY = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientY( p, ranges.element( i.add( gender ) ) ) ) ),
		disX = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientX( p, ranges.element( i.add( gender ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), q( figureIndex, i ), gradientXT( p, ranges.element( i.add( gender ) ), 0 ) ) );

	var isLeft = int( step( p.x, 0 ) ).toVar( ),
		isDown = p.y.lessThan( pivots.element( int( 2 ).add( gender ) ).y ).toVar( ), //chest
		isHand = p.x.abs().greaterThan( pivots.element( int( 16 ).add( gender ) ).x ); // wrist

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();


	If( isDown, ()=>{

		// process legs

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh
		Loop( { start: start, end: end }, ( { i } ) => disY( i ) );

		// leg
		disP( end, gradientLeg( p, ranges.element( end.add( gender ) ), extras.element( leg.add( gender2 ) ).xy ) );

	} ).Else( ()=>{

		// process hands
		If( isHand, ()=>{

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			disP( thumb, gradientXT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender2 ) ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradientYT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender2 ) ).y ) );

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
		disP( end, gradientArm( p, pivots.element( int( end ).add( gender ) ), ranges.element( end.add( gender ) ) ) );

	} );



	//	process torso

	Loop( { end: int( 4 ) }, ( { i } ) => disY( i ) );

	// footer
	m.element( 1 ).assign( transformNormalToView( m.element( 1 ) ).normalize() );

	//	console.log( 'DODO==============================' );
	return m;//.debug();

} );



export { disfigureMatrix, disfigureBody, gradientX, gradientY, gradientYT, gradientXT, gradientLeg, gradientArm };
