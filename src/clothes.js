
// disfigure
//
// Module to put clothes on bodies
//
// clothes.elements[0] = color
// clothes.elements[1] = (roughness, metalness)

// Trisha's Spontaneous Look
// https://www.instagram.com/reel/DMd39iqoMN2/
// "Is it really TSL if you can’t style it in different ways?"



import { Color } from "three";
import { float, Fn, If, mat3, mix, positionGeometry, reciprocal, select, vec3 } from "three/tsl";



// simple material based on color, roughness and metalness

var tslSimpleMaterial = Fn( ( { color, roughness, metalness } ) => {

	return mat3(
		color,
		roughness, metalness, 0,
		0, 0, 0
	);

}, { color: 'vec3', roughness: 'float', metalness: 'float', return: 'mat3' } ); // tslSimpleMaterial



// check whether a value is between two values

var between = Fn( ( { value, from, to } ) => {

	return value.greaterThanEqual( from ).and( value.lessThanEqual( to ) );

}, { value: 'float', from: 'float', to: 'float', return: 'float' } ); // between




// convert Three.js color to vec3

var _color = new Color();

function toVec3( color ) {

	_color.set( color );

	return vec3( ..._color );

} // toVec3



// generates latex matrix

function latex( color ) {

	return tslSimpleMaterial( toVec3( color ), 0.2, 0.3 );

} // latex



// generates velour matrix

function velour( color ) {

	return tslSimpleMaterial( toVec3( color ).mul( 3 ), 1, 1 );

} // velour



// generates horizontal bands of two materials and band width

var bands = Fn( ([ matA, matB, width ]) => {

	var k = positionGeometry.y.mul( float( Math.PI ).div( width ) )
		.sin().add( 1 ).div( 2 )
		.smoothstep( 0, 1 );

	var n = width.mul( 300 ).pow( 0.5 ).toVar();

	k = k.pow( select( k.greaterThan( 0.5 ), reciprocal( n ), n ) );
	k = k.smoothstep( 0, 1 );

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', width: 'float', return: 'mat3' } ); // bands



// generates vertical stripes of two materials and stripe width

var stripes = Fn( ([ matA, matB, width ]) => {

	var k = positionGeometry.x.mul( float( Math.PI ).div( width ) )
		.sin().add( 1 ).div( 2 )
		.smoothstep( 0, 1 );

	var n = width.mul( 300 ).pow( 0.5 ).toVar();

	k = k.pow( select( k.greaterThan( 0.5 ), reciprocal( n ), n ) );
	k = k.smoothstep( 0, 1 );

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', width: 'float', return: 'mat3' } ); // stripes



// generates vertical stripes of two materials and stripe width

var stripesAround = Fn( ([ matA, matB, x, z, width ]) => {

	var px = positionGeometry.x.sub( x ),
		pz = positionGeometry.z.sub( z );

	var k = pz.atan( px ).mul( width )
		.sin().add( 1 ).div( 2 )
		.smoothstep( 0, 1 );

	var n = width.mul( 30 ).pow( 0.5 ).toVar();

	k = k.pow( select( k.greaterThan( 0.5 ), reciprocal( n ), n ) );
	k = k.smoothstep( 0, 1 );

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', x: 'float', z: 'float', width: 'float', return: 'mat3' } ); // stripesAround



// generates a sloped zone within vertical range

var band = Fn( ( { from, to, angleX=float( 0 ), angleZ=float( 0 ) } )=>{

	var p = positionGeometry.toVar();

	p.y.addAssign( p.x.mul( angleX.radians( ).tan() ) );
	p.y.addAssign( p.z.mul( angleZ.radians( ).tan() ) );

	return between( p.y, from, to );

} ); // band



// generates two symmetricals zone within horizontal range

var strip = Fn( ([ from, to ])=>{

	return between( positionGeometry.x.abs(), from, to );

}, { from: 'float', to: 'float', return: 'float' } ); // strip



// generates a zone within z range

var slice = Fn( ([ from, to, angleY=float( 0 ) ])=>{

	var p = positionGeometry.toVar();

	p.z.addAssign( p.y.mul( angleY.radians( ).tan() ) );

	return between( p.z, from, to );

}, { from: 'float', to: 'float', angleY: 'float', return: 'float' } ); // slice



// generates a zone within horizontal range

var stripSingle = Fn( ([ from, to ])=>{

	return between( positionGeometry.x, from, to );

}, { from: 'float', to: 'float', return: 'float' } ); // stripSingle



// generates a wave-like zone within horizontal range

var bandWave = Fn( ([ from, to, sharpness, width, height ])=>{

	var x = positionGeometry.x.mul( float( Math.PI ).div( width ) ).cos();

	var dy = sharpness.mix( x, x.acos().mul( -2/Math.PI ).sub( 1 ) ).mul( height, 0.5 );

	return between( positionGeometry.y.add( dy ), from, to );

}, { from: 'float', to: 'float', sharpness: 'float', width: 'float', height: 'float', return: 'float' } ); // bandWave



// dress a body

function dress( body, clothinData ) {

	var customClothing = Fn( ( ) => {

		var mat = mat3( clothinData[ 0 ]);

		for ( /*MUST*/let i=1; i<clothinData.length; i+=2 ) {

			If( clothinData[ i ], ()=>{

				mat.assign( clothinData[ i+1 ]);

			} );
			//mat.assign( select( clothinData[ i ], clothinData[ i+1 ], mat ) );

		}

		return mat;

	} );

	var clothes = customClothing( ).toVar();

	body.material.colorNode = clothes[ 0 ].xyz;
	body.material.roughnessNode = clothes[ 1 ].x;
	body.material.metalnessNode = clothes[ 1 ].y;

	return clothes;

} // dress



export {

	dress,

	// shapes
	band,
	bandWave,
	strip,
	stripSingle,
	slice,

	// patterns and materials
	bands,
	stripes,
	stripesAround,
	velour,
	latex,

};
