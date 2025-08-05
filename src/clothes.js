
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
import { float, Fn, If, mat3, mix, positionGeometry, rotate, vec2, vec3 } from "three/tsl";



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



// mix two mat3'savePreferences

var mixMat3 = Fn( ([ matA, matB, k ]) => {

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', k: 'float', return: 'mat3' } ); // mixMat3



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



// generates bands of two materials

var bands = Fn( ( { matA, matB, width=float( 0.1 ), options={} } ) => {

	var { balance, blur, angle, polar, x, z } = options;

	var k, p;

	if ( polar ) {

		p = positionGeometry.xz.sub( vec2( x??0, z??0 ) );
		k = p.y.atan( p.x ).div( float( width ).mul( 2 ) ).cos();

	} else {

		p = rotate( positionGeometry.xy, ( angle??0 ) * Math.PI/180 );
		k = p.y.div( width, 1/Math.PI ).cos();

	}

	if ( balance??0 ) k = k.add( balance );

	blur = blur??0.00001;
	if ( blur ) k = k.smoothstep( -blur, blur );

	return mixMat3( matA, matB, k );

} ); // bands



// generates a slice through a body

var slice = Fn( ( { from, to, options={} } )=>{

	var p = positionGeometry.toVar();

	var axes = 'yxzyx',
		idx = 0;

	if ( options.side ) idx=1;
	if ( options.front ) idx=2;

	if ( options.angle ) p[ axes[ idx ] ].addAssign( p[ axes[ idx+1 ] ].mul( Math.tan( options.angle*Math.PI/180 ) ) );
	if ( options.sideAngle ) p[ axes[ idx ] ].addAssign( p[ axes[ idx+2 ] ].mul( Math.tan( options.sideAngle*Math.PI/180 ) ) );

	var value = p[ axes[ idx ] ];

	if ( options.wave ) {

		var w = p[ axes[ idx+1 ] ].mul( float( Math.PI ).div( options.width??Math.PI ) ).cos().toVar();
		var dWave = float( options.sharpness??0 ).mix( w, w.acos().mul( -2/Math.PI ).sub( 1 ) ).mul( options.wave, 0.5 );

		value = value.add( dWave );

	}

	if ( options.symmetry ) value = value.abs();

	return between( value, from, to );

} ); // slice



// generates a TSL function that implements custom clothing

var compileClothing = Fn( ([ clothinData ]) => {

	var mat = mat3( clothinData[ 0 ]);

	for ( /*MUST*/let i=1; i<clothinData.length; i+=2 ) {

		If( clothinData[ i ], ()=>{

			mat.assign( clothinData[ i+1 ]);

		} );

	}

	return mat;

} ); // compileClothing


export {

	compileClothing,
	slice,
	bands,
	velour,
	latex,

};
