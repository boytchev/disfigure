
// disfigure



import { Fn, If, mat3, min, mix, mul, negate, normalGeometry, positionGeometry, select, transformNormalToView, vec3, vec4 } from 'three/tsl';



var rotateByQuaternion = Fn( ([ p, q ])=>{

	return p.add( q.xyz.cross( q.xyz.cross( p ).add( q.w.mul( p ) ) ).mul( 2 ) );

}, { return: 'vec3', p: 'vec3', q: 'vec4' } );



var disfigureMatrix = Fn( ([ mat, pivot, quat, k, selection ])=>{

	var newMat = mat.toVar();

	// if k>0 the matrix must be updated
	If( k.greaterThan( 0 ), () => {

		var q = quat.toVar();

		// if k<1 the quaternion's rotation must be 'divided'
		If( k.lessThan( 1 ), ()=>{

			var len = quat.xyz.length().toVar();
			var acos = k.mul( quat.w.acos() ).toVar();

			q.assign( select(
				len.lessThan( 1e-5 ),
				vec4( 0, 0, 0, 1 ),
				vec4( quat.xyz.div( len ).mul( acos.sin() ), acos.cos() )
			) );

		} ); // k<1

		newMat.element( 0 ).assign( rotateByQuaternion( mat.element( 0 ).sub( pivot ), q ).add( pivot ) );
		newMat.element( 1 ).assign( rotateByQuaternion( mat.element( 1 ), q ) );
		newMat.element( 2 ).x.addAssign( 	k.mul( selection ) );

	} ); // k>0

	return newMat;

}, { return: 'mat3', mat: 'mat3', pivot: 'vec3', quat: 'vec4', k: 'float', selection: 'float' } );



var gradientX = Fn( ([ pos, range ])=>pos.x.add( pos.y.mul( range.z ) ).smoothstep( range.x, range.y ), { pos: 'vec3', range: 'vec3', return: 'float' } );



var gradientY = Fn( ([ pos, range ])=>pos.y.add( pos.z.mul( range.z ) ).smoothstep( range.x, range.y ), { pos: 'vec3', range: 'vec3', return: 'float' } );



var gradientYT = Fn( ([ pos, range, maxz ])=> {

	var k1 = pos.y.add( pos.z.mul( -1.22/*fixed slope*/ ) ).smoothstep( range.x, range.y );

	var k2 = mul(
		pos.x.smoothstep( range.z, range.z.mul( 1.02 ) ),
		pos.x.smoothstep( range.w, range.w.div( 1.02 ) )
	)
		.add( pos.z.step( maxz ).mul( pos.x.abs().step( range.z.abs() ) ) )
		.clamp( 0, 1 );
	return k1.mul( k2 );

}, { pos: 'vec3', range: 'vec4', maxz: 'float', return: 'float' } );



var gradientXZ = Fn( ([ pos, range ])=>
	pos.x
		.smoothstep( range.x, range.y )
		.mul(
			pos.z.smoothstep( range.z.sub( 0.001 ), range.z.add( 0.001 ) ),
			pos.z.smoothstep( range.w.add( 0.001 ), range.w.sub( 0.001 ) )
		)
, { pos: 'vec3', range: 'vec4', return: 'float' } );



var gradientXT = Fn( ([ pos, range, slope ])=>
	pos.x.add( pos.z.mul( slope ) )
		.smoothstep( range.x, range.y )
		.mul(
			pos.z.smoothstep( range.z.sub( 0.001 ), range.z.add( 0.001 ) ),
			pos.z.smoothstep( range.w.add( 0.001 ), range.w.sub( 0.001 ) )
		)
, { pos: 'vec3', range: 'vec4', slope: 'float', return: 'float' } );



var gradientLeg = Fn( ([ pos, range, range2 ])=>{

	var y = pos.y.sub( pos.x.abs().mul( 1/5 ) );
	var ofs = select( range2.x.equal( 1 ), pos.z.add( 0.05 ).abs().mul( 1/2 ), pos.z.mul( 1/6 ) );

	return pos.x.smoothstep( 0, range2.y )
		.mul( y.smoothstep( range.x.sub( ofs ), range.y ).smoothstep( 0, 1 ).pow( 2 ) )
		.add( pos.x.smoothstep( 0, range2.y.div( 10 ) ).mul( y.smoothstep( range.z, range.w ) ) )
		.clamp( 0, 1 )
	;

}, { pos: 'vec3', range: 'vec4', range2: 'vec2', return: 'float' } );



var gradientArm = Fn( ([ pos, pivot, range ])=>{

	var x = pos.x,
		y = pos.y;

	var dx = y.sub( pivot.y ).div( 4, x.sign() );

	return x.add( dx ).smoothstep( range.x, range.y ).smoothstep( 0, 1 )
		.mul( min(
			y.smoothstep( range.z, mix( range.z, range.w, 0.2 ) ),
			y.smoothstep( range.z, mix( range.w, range.z, 0.2 ) ),
		) )
		.pow( 2 )
	;

}, { pos: 'vec3', pivot: 'vec3', range: 'vec4', return: 'float' } );



var disfigureBody = Fn( ([ modelData ])=>{

	// header
	var p = positionGeometry;
	var m = mat3( p, normalGeometry, vec3( 0, 0, 0 ) ).toVar();
	var def = modelData.skeletonData; // static data
	var quats = modelData.quaternions;

	function flip( v ) {

		v = v.clone();
		v.x = -v.x;
		return v;

	}

	function flipXY( v ) {

		v = v.clone();
		v.x = -v.x;
		v.y = -v.y;
		return v;

	}

	function flipZW( v ) {

		v = v.clone();
		v.z = -v.z;
		v.w = -v.w;
		return v;

	}

	var isLeft = p.x.greaterThan( 0 );
	var isDown = p.y.lessThan( def.chestPivot.y );

	If( isLeft, ()=>{

		If( isDown, ()=>{

			// ---foot left
			m.assign( disfigureMatrix( m, def.footPivot, quats[ 4 ], gradientY( p, def.footRange ), modelData.select==4 ) );

			// ---ankle left
			m.assign( disfigureMatrix( m, def.anklePivot, quats[ 6 ], gradientY( p, def.ankleRange ), modelData.select==6 ) );

			// ---shin left
			m.assign( disfigureMatrix( m, def.shinPivot, quats[ 8 ], gradientY( p, def.shinRange ), modelData.select==8 ) );

			// ---knee left
			m.assign( disfigureMatrix( m, def.kneePivot, quats[ 10 ], gradientY( p, def.kneeRange ), modelData.select==10 ) );

			// ---thigh left
			m.assign( disfigureMatrix( m, def.thighPivot, quats[ 12 ], gradientY( p, def.thighRange ), modelData.select==12 ) );

			// ---leg left
			m.assign( disfigureMatrix( m, def.legPivot, quats[ 14 ], gradientLeg( p, def.legRange, def.legRange2 ), modelData.select==14 ) );

		} )
			.Else( () => {

				// ---finger01-03 (thumb) left
				m.assign( disfigureMatrix( m, def.finger02Pivot, quats[ 48 ], gradientXT( p, def.finger02Range, def.finger02Slope ), modelData.select==48 ) );
				m.assign( disfigureMatrix( m, def.finger01Pivot, quats[ 50 ], gradientYT( p, def.finger01Range, def.finger01Z ), modelData.select==50 ) );

				// ---finger11-13 (index) left
				m.assign( disfigureMatrix( m, def.finger13Pivot, quats[ 30 ], gradientXZ( p, def.finger13Range ), modelData.select==30 ) );
				m.assign( disfigureMatrix( m, def.finger12Pivot, quats[ 32 ], gradientXZ( p, def.finger12Range ), modelData.select==32 ) );
				m.assign( disfigureMatrix( m, def.finger11Pivot, quats[ 34 ], gradientXZ( p, def.finger11Range ), modelData.select==34 ) );

				// ---finger21-23 (middle) left
				m.assign( disfigureMatrix( m, def.finger23Pivot, quats[ 24 ], gradientXZ( p, def.finger23Range ), modelData.select==24 ) );
				m.assign( disfigureMatrix( m, def.finger22Pivot, quats[ 26 ], gradientXZ( p, def.finger22Range ), modelData.select==26 ) );
				m.assign( disfigureMatrix( m, def.finger21Pivot, quats[ 28 ], gradientXZ( p, def.finger21Range ), modelData.select==28 ) );

				// ---finger31-33 (ring) left
				m.assign( disfigureMatrix( m, def.finger33Pivot, quats[ 36 ], gradientXZ( p, def.finger33Range ), modelData.select==36 ) );
				m.assign( disfigureMatrix( m, def.finger32Pivot, quats[ 38 ], gradientXZ( p, def.finger32Range ), modelData.select==38 ) );
				m.assign( disfigureMatrix( m, def.finger31Pivot, quats[ 40 ], gradientXZ( p, def.finger31Range ), modelData.select==40 ) );

				// ---finger41-43 (pinky) left
				m.assign( disfigureMatrix( m, def.finger43Pivot, quats[ 42 ], gradientXZ( p, def.finger43Range ), modelData.select==42 ) );
				m.assign( disfigureMatrix( m, def.finger42Pivot, quats[ 44 ], gradientXZ( p, def.finger42Range ), modelData.select==44 ) );
				m.assign( disfigureMatrix( m, def.finger41Pivot, quats[ 46 ], gradientXZ( p, def.finger41Range ), modelData.select==46 ) );

				// ---wrist left
				m.assign( disfigureMatrix( m, def.wristPivot, quats[ 16 ], gradientX( p, def.wristRange ), modelData.select==16 ) );

				// ---forearm left
				m.assign( disfigureMatrix( m, def.forearmPivot, quats[ 18 ], gradientX( p, def.forearmRange ), modelData.select==18 ) );

				// ---elbow left
				m.assign( disfigureMatrix( m, def.elbowPivot, quats[ 20 ], gradientX( p, def.elbowRange ), modelData.select==20 ) );

				// ---arm left
				m.assign( disfigureMatrix( m, def.armPivot, quats[ 22 ], gradientArm( p, def.armPivot, def.armRange ), modelData.select==22 ) );

			} );

	} )
		.Else( ()=>{

			If( isDown, ()=>{

				// ---foot right
				m.assign( disfigureMatrix( m, def.footPivot, quats[ 5 ], gradientY( p, def.footRange ), modelData.select==5 ) );

				// ---ankle right
				m.assign( disfigureMatrix( m, flip( def.anklePivot ), quats[ 7 ], gradientY( p, def.ankleRange ), modelData.select==7 ) );

				// ---shin right
				m.assign( disfigureMatrix( m, flip( def.shinPivot ), quats[ 9 ], gradientY( p, def.shinRange ), modelData.select==9 ) );

				// ---knee right
				m.assign( disfigureMatrix( m, flip( def.kneePivot ), quats[ 11 ], gradientY( p, def.kneeRange ), modelData.select==11 ) );

				// ---thigh right
				m.assign( disfigureMatrix( m, flip( def.thighPivot ), quats[ 13 ], gradientY( p, def.thighRange ), modelData.select==13 ) );

				// ---leg right
				m.assign( disfigureMatrix( m, flip( def.legPivot ), quats[ 15 ], gradientLeg( p, def.legRange, negate( def.legRange2 ) ), modelData.select==15 ) );

			} )
				.Else( () => {

					// ---finger01-02 (thumb) right
					m.assign( disfigureMatrix( m, flip( def.finger02Pivot ), quats[ 49 ], gradientXT( p, flipXY( def.finger02Range ), -def.finger02Slope ), modelData.select==49 ) );
					m.assign( disfigureMatrix( m, flip( def.finger01Pivot.value ), quats[ 51 ], gradientYT( p, flipZW( def.finger01Range.value ), def.finger01Z ), modelData.select==51 ) );

					// ---finger11-13 (index) right
					m.assign( disfigureMatrix( m, flip( def.finger13Pivot ), quats[ 31 ], gradientXZ( p, flipXY( def.finger13Range ) ), modelData.select==31 ) );
					m.assign( disfigureMatrix( m, flip( def.finger12Pivot ), quats[ 33 ], gradientXZ( p, flipXY( def.finger12Range ) ), modelData.select==33 ) );
					m.assign( disfigureMatrix( m, flip( def.finger11Pivot ), quats[ 35 ], gradientXZ( p, flipXY( def.finger11Range ) ), modelData.select==35 ) );

					// ---finger21-23 (middle) right
					m.assign( disfigureMatrix( m, flip( def.finger23Pivot ), quats[ 25 ], gradientXZ( p, flipXY( def.finger23Range ) ), modelData.select==25 ) );
					m.assign( disfigureMatrix( m, flip( def.finger22Pivot ), quats[ 27 ], gradientXZ( p, flipXY( def.finger22Range ) ), modelData.select==27 ) );
					m.assign( disfigureMatrix( m, flip( def.finger21Pivot ), quats[ 29 ], gradientXZ( p, flipXY( def.finger21Range ) ), modelData.select==29 ) );

					// ---finger31-33 (ring) right
					m.assign( disfigureMatrix( m, flip( def.finger33Pivot ), quats[ 37 ], gradientXZ( p, flipXY( def.finger33Range ) ), modelData.select==37 ) );
					m.assign( disfigureMatrix( m, flip( def.finger32Pivot ), quats[ 39 ], gradientXZ( p, flipXY( def.finger32Range ) ), modelData.select==39 ) );
					m.assign( disfigureMatrix( m, flip( def.finger31Pivot ), quats[ 41 ], gradientXZ( p, flipXY( def.finger31Range ) ), modelData.select==41 ) );

					// ---finger41-43 (pinky) right
					m.assign( disfigureMatrix( m, flip( def.finger43Pivot ), quats[ 43 ], gradientXZ( p, flipXY( def.finger43Range ) ), modelData.select==43 ) );
					m.assign( disfigureMatrix( m, flip( def.finger42Pivot ), quats[ 45 ], gradientXZ( p, flipXY( def.finger42Range ) ), modelData.select==45 ) );
					m.assign( disfigureMatrix( m, flip( def.finger41Pivot ), quats[ 47 ], gradientXZ( p, flipXY( def.finger41Range ) ), modelData.select==47 ) );

					// ---wrist right
					m.assign( disfigureMatrix( m, flip( def.wristPivot ), quats[ 17 ], gradientX( p, flipXY( def.wristRange ) ), modelData.select==17 ) );

					// ---forearm right
					m.assign( disfigureMatrix( m, flip( def.forearmPivot ), quats[ 19 ], gradientX( p, flipXY( def.forearmRange ) ), modelData.select==19 ) );

					// ---elbow right
					m.assign( disfigureMatrix( m, flip( def.elbowPivot ), quats[ 21 ], gradientX( p, flipXY( def.elbowRange ) ), modelData.select==21 ) );

					// ---arm right
					m.assign( disfigureMatrix( m, flip( def.armPivot ), quats[ 23 ], gradientArm( p, flip( def.armPivot ), flipXY( def.armRange ) ), modelData.select==23 ) );

				} );

		} );// right things

	// ---head
	m.assign( disfigureMatrix( m, def.headPivot, quats[ 1 ], gradientY( p, def.headRange ), modelData.select==1 ) );

	// ---chest
	m.assign( disfigureMatrix( m, def.chestPivot, quats[ 2 ], gradientY( p, def.chestRange ), modelData.select==2 ) );

	// ---waist
	m.assign( disfigureMatrix( m, def.waistPivot, quats[ 3 ], gradientY( p, def.waistRange ), modelData.select==3 ) );

	// ---torso
	m.assign( disfigureMatrix( m, def.torsoPivot, quats[ 0 ], 1, modelData.select==0 ) );



	// footer
	m.element( 1 ).assign( transformNormalToView( m.element( 1 ).normalize() ) );

	if ( modelData.select != null ) {

		const n = 4;
		var k2 = m.element( 2 ).x.mul( n*Math.PI*2 ).sub( Math.PI/2 ).sin().toVar();

		var k = m.element( 2 ).x.mul( n ).round().div( n ).toVar();

		If( k.equal( 1 ), ()=>{

			m.element( 2 ).assign( vec3( 0 ) );

		} )
			.ElseIf( k.greaterThan( 0 ), ()=>{

				m.element( 2 ).assign( mix( vec3( -1/2, -1/2, 1/2 ), vec3( 1/2, -1/2, -1/2 ), k ).div( 1 ) );

			} )
			.Else( ()=>{

				m.element( 2 ).assign( vec3( 0 ) );

			} );

		If( k2.greaterThan( 0.95 ), ()=>{

			m.element( 2 ).assign( vec3( -1 ) );

		} );

	}

	return m;

} );


export { rotateByQuaternion, disfigureMatrix, disfigureBody };
