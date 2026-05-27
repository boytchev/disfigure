/**
 * Disfigure TSL Rigging
 *
 * -----------------------------------------------------------------------------
 *
 * This module provides GPU-accelerated vertex deformation and normal
 * calculation for body rigging using TSL. It applies quaternion-based rotations
 * to different body parts (legs, arms, torso, hands) based on per-vertex
 * gradients and precomputed pivot points.
 *
 * The deformation is driven by:
 * - A texture `quatTextureNode` with per-figure and per-joint quaternion data
 * - Predefined pivot points `pivots` and gradient ranges `ranges`
 * - Custom gradient functions `gradient...()` for natural-looking joint bending
 *
 * The mat3 in this module is used purely as a container (not as a real matrix):
 *   - element(0) = position
 *   - element(1) = normal
 *   - element(2) = unused
 *
 * This allows applying the same quaternion rotation to both position and normal.
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * disfigurePosition - node to be attached to positionNode
 * disfigureNormal   - node to be attached to normalNode
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */



import { attribute, Fn, If, int, Loop, mat3, normalGeometry, positionGeometry, select, step, transformNormalToView, vec3, vec4 } from 'three/tsl';
import { extras, pivots, PURE_QUATS_PER_BODY, QUAT_DATA_INDEX, quatTextureNode, ranges } from './assets.js';



/**
 * Rotates a vector `p` by a quaternion `q` using the standard formula.
 */
var rotateByQuaternion = Fn( ([ p, q ])=>{

	// p' = p + 2 * q.xyz ✕ (q.xyz ✕ p + q.w * p)

	return p.add( q.xyz.cross( q.xyz.cross( p ).add( q.w.mul( p ) ) ).mul( 2 ) );

}, { return: 'vec3', p: 'vec3', q: 'vec4' } );



/**
 * Scales the rotation angle of a quaternion `quat` by factor `k`.
 * Used to partially apply rotations (0 < k < 1) for smooth blending.
 */
var scaleQuaternion = Fn( ([ quat, k ])=>{

	var q = vec4();
	var len = quat.xyz.length().toVar();

	If( len.lessThan( 1e-5 ), ()=>{

		q.assign( vec4( 0, 0, 0, 1 ) ); // near-zero quaternion → identity

	} ).Else( ()=>{

		// angle = k * acos(quat.w)
		// q = (quat.xyz/len * sin(k*angle), cos(k*angle))

		var angle = k.mul( quat.w.acos() ).toVar();
		q.assign( vec4( quat.xyz.div( len ).mul( angle.sin() ), angle.cos() ) );

	} );

	return q;

}, { return: 'vec4', quat: 'vec4', k: 'float' } );



/**
 * Applies partial `k` quaternion rotation `quat` to the matrix container `mat`.
 *   - element(0) → position (rotated around `pivot`)
 *   - element(1) → normal   (rotated, no pivot)
 *   - element(2) → unused
 */
var disfigureMatrix = Fn( ([ mat, pivot, quat, k ])=>{

	var newMat = mat.toVar();

	// Only apply transformation if k > 0

	If( k.greaterThan( 0 ), () => {

		var q = quat.toVar();

		// Scale quaternion rotation when k < 1 (partial deformation)

		If( k.lessThan( 1 ), ()=>{

			q.assign( scaleQuaternion( q, k ) );

		} ); // k<1

		// Rotate position around pivot: p = pivot + rotate(p - pivot)

		newMat.element( 0 ).assign( rotateByQuaternion( mat.element( 0 ).sub( pivot ), q ).add( pivot ) );

		// Rotate normal (as direction vector) without pivot: n = rotate(n)

		newMat.element( 1 ).assign( rotateByQuaternion( mat.element( 1 ), q ) );

	} ); // k>0

	return newMat;

}, { return: 'mat3', mat: 'mat3', pivot: 'vec3', quat: 'vec4', k: 'float' } );



// ======================== GRADIENT FUNCTIONS ========================



/**
 * Horizontal gradient with vertical influence.
 * result = smoothstep( range.x, range.y, x + y * range.z )
 */
var gradientX = Fn( ([ pos, range ]) => {

	return pos.x.add( pos.y.mul( range.z ) ).smoothstep( range.x, range.y );

}, { pos: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Vertical gradient with depth influence.
 * result = smoothstep( range.x, range.y, y + z * range.z )
 */
var gradientY = Fn( ([ pos, range ]) => {

	return pos.y.add( pos.z.mul( range.z ) ).smoothstep( range.x, range.y );

}, { pos: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Tilted gradient used for thumb and specific joint transitions
 * result = smoothstep(range.z, range.w, z + x * slope)
 */
var gradientYT = Fn( ([ pos, range, slope ])=>{

	return pos.z.add( pos.x.mul( slope ) ).smoothstep( range.z, range.w );

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



/**
 * Complex gradient for area where legs attach to the torso
 */
var gradientLeg = Fn( ([ pos, range, range2 ])=>{

	var y = pos.y.sub( pos.x.abs().mul( 1/5 ) );

	var ofs = select( range2.x.equal( 1 ), pos.z.add( 0.05 ).abs().mul( 1/2 ), pos.z.mul( 1/6 ) );

	return pos.x.smoothstep( 0, range2.y )
		.mul( y.smoothstep( range.x.sub( ofs ), range.y ).smoothstep( 0, 1 ).pow( 2 ) )
		.add( pos.x.smoothstep( 0, range2.y.div( 10 ) ).mul( y.smoothstep( range.z, range.w ) ) )
		.clamp( 0, 1 );

}, { return: 'float', pos: 'vec3', range: 'vec4', range2: 'vec2' } );



/**
 * Complex gradient for area where arm attach to the torso
 */
var gradientArm = Fn( ([ pos, pivot, range ])=>{

	var dx = pos.y.sub( pivot.y ).div( 4, select( pos.x.greaterThan( 0 ), 1, -1 ) );

	return pos.x.add( dx ).smoothstep( range.x, range.y ).smoothstep( 0, 1 )
		.mul( pos.y.step( range.z ).oneMinus() );

}, { pos: 'vec3', pivot: 'vec3', range: 'vec4', return: 'float' } );



/**
 * Sharp gradient for fingers and thumbs
 */
var gradientXT = Fn( ([ pos, range, slope ])=>{

	return pos.x.add( pos.z.mul( slope ) )
		.smoothstep( range.x, range.y )
		.mul(
			//pos.z.smoothstep( range.z.sub( 0.0001 ), range.z.add( 0.0001 ) ),
			pos.z.step( range.z ),
			//pos.z.smoothstep( range.w.add( 0.0001 ), range.w.sub( 0.0001 ) )
			pos.z.step( range.w ).oneMinus(),
		);

}, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



// ======================== MAIN DISFIGURE FUNCTION ========================



/**
 * Internal count for number of generations of the main TSL function
 */
var disfigureVersion = 0;



/**
 * Main body disfigure/deformation function.
 * Deforms position and normal using per-joint quaternions and gradient masks.
 * Uses a mat3 container to hold and transform position + normal together.
 */
var disfigureBody = Fn( ( )=>{

	var p = positionGeometry,
		m = mat3( p, normalGeometry.normalize(), vec3( 0 ) ).toVar( ); // container

	var figureIndex = attribute( 'uids', 'int' ).toVar();

	// Figure type offset for pivots and ranges (52 pivots per gender, 4 extras)

	var gender = quatTextureNode.get( figureIndex, QUAT_DATA_INDEX ).x.mul( PURE_QUATS_PER_BODY ).toVar(); // 52 pivots
	var gender_ex = quatTextureNode.get( figureIndex, QUAT_DATA_INDEX ).x.mul( 4 ).toVar(); // 4 extras

	// Helper functions for different deformation types

	var disP = ( i, gradient ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), quatTextureNode.get( figureIndex, i ), gradient ) ),
		disY = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), quatTextureNode.get( figureIndex, i ), gradientY( p, ranges.element( i.add( gender ) ) ) ) ),
		disX = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), quatTextureNode.get( figureIndex, i ), gradientX( p, ranges.element( i.add( gender ) ) ) ) ),
		disT = ( i ) => m.assign( disfigureMatrix( m, pivots.element( i.add( gender ) ), quatTextureNode.get( figureIndex, i ), gradientXT( p, ranges.element( i.add( gender ) ), 0 ) ) );

	// Side and region detection

	var isLeft = int( step( p.x, 0 ) ).toVar( ),
		isDown = p.y.lessThan( pivots.element( int( 2 ).add( gender ) ).y ), //below chest
		isHand = p.x.abs().greaterThan( pivots.element( int( 16 ).add( gender ) ).x ); // beyond wrist

	// Helper function to simulate ternary isLeft?left:right

	var pick = ( left, right )=>isLeft.mul( right-left ).add( left ).toVar();


	If( isDown, ()=>{

		// ======================== LOWER BODY ========================

		let start = pick( 4, 10 ),
			end = start.add( 5 ).toVar();
		let leg = pick( 0, 1 );

		// foot ankle shin knee thigh

		Loop( { start: start, end: end }, ( { i } ) => disY( i ) );

		// leg

		disP( end, gradientLeg( p, ranges.element( end.add( gender ) ), extras.element( leg.add( gender_ex ) ).xy ) );

	} ).Else( ()=>{

		If( isHand, ()=>{

			// ======================== HANDS ========================

			let thumb = pick( 24, 26 );
			let thumb2 = pick( 2, 3 );

			// fingers: thumb

			disP( thumb, gradientXT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender_ex ) ).x ) );
			thumb.addAssign( 1 );
			disP( thumb, gradientYT( p, ranges.element( thumb.add( gender ) ), extras.element( thumb2.add( gender_ex ) ).y ) );

			let start = pick( 28, 40 ),
				end = start.add( 12 );

			// fingers: index middle ring pinky

			Loop( { start: start, end: end }, ( { i } ) => disT( i ) );

		} );

		// ======================== ARMS ========================

		let start = pick( 16, 20 ),
			end = start.add( 3 );

		// wrist forearm elbow

		Loop( { start: start, end: end }, ( { i } ) => disX( i ) );

		// arm

		disP( end, gradientArm( p, pivots.element( int( end ).add( gender ) ), ranges.element( end.add( gender ) ) ) );

	} );



	// ======================== TORSO ========================

	// head chest waist torso

	Loop( { end: int( 4 ) }, ( { i } ) => disY( i ) );

	// Final normal transformation to view space + normalization

	m.element( 1 ).assign( transformNormalToView( m.element( 1 ) ).normalize() );

	// Warm if this disfigure function was generated too many times

	++disfigureVersion;

	if ( disfigureVersion > 6 && Math.log2( disfigureVersion ) % 1 < 1E-10 )
		console.warn( `TSL compiled ${disfigureVersion} times` );

	return m;//.debug();

} )( );



/**
 * Execute the main rigging function and isolate the vertex and normal nodes
 */
var disfigurePosition = disfigureBody.element( 0 ); // position node
var disfigureNormal = disfigureBody.element( 1 ); // normal node



export { disfigureMatrix, disfigurePosition, disfigureNormal, disfigureBody, gradientX, gradientY, gradientYT, gradientXT, gradientLeg, gradientArm };
