
// disfigure
//
// Module to put clothes on bodies
//
// clothes.elements[0] = color
// clothes.elements[1] = (roughness, metalness)



import { Color } from "three";
import { float, Fn, If, mat3, mix, positionGeometry, reciprocal, select, vec3 } from "three/tsl";



var tslSimpleMaterial = Fn( ( { color, roughness, metalness } ) => {

	return mat3(
		color,
		roughness, metalness, 0,
		0, 0, 0
	);

}, { color: 'vec3', roughness: 'float', metalness: 'float', return: 'mat3' } ); // Clothes



function color( red, green, blue ) {

	if ( typeof red !== 'number' ) {

		var c = new Color( red );
		red = c.r;
		green = c.g;
		blue = c.b;

	}

	return vec3( red, green, blue );

}


function latex( red, green, blue ) {

	return tslSimpleMaterial( color( red, green, blue ), 0.2, 0.3 );

}



function velour( red, green, blue ) {

	return tslSimpleMaterial( color( red, green, blue ).mul( 3 ), 1, 1 );

}




var horizontalStripes = Fn( ([ matA, matB, width ]) => {

	var k = positionGeometry.y.mul( float( Math.PI ).div( width ) ).sin().add( 1 ).div( 2 )
		.smoothstep( 0, 1 );

	var n = width.mul( 300 ).pow( 0.5 );

	k = k.pow( select( k.greaterThan( 0.5 ), reciprocal( n ), n ) );
	k = k.smoothstep( 0, 1 );

	return mat3(
		mix( matA[ 0 ], matB[ 0 ], k ),
		mix( matA[ 1 ], matB[ 1 ], k ),
		0, 0, 0,
	);

}, { matA: 'mat3', matB: 'mat3', width: 'float', return: 'mat3' } ); // Clothes



// Trisha's Spontaneous Look
// https://www.instagram.com/reel/DMd39iqoMN2/
// "Is it really TSL if you can’t style it in different ways?"

var verticalBetween = Fn( ([ from, to ])=>{

	var y = positionGeometry.y;
	return y.greaterThanEqual( from ).and( y.lessThanEqual( to ) );

}, { from: 'float', to: 'float', return: 'float' } );


var horizontalBetween = Fn( ([ from, to ])=>{

	var x = positionGeometry.x.abs();
	return x.greaterThanEqual( from ).and( x.lessThanEqual( to ) );

}, { from: 'float', to: 'float', return: 'float' } );



function dress( body, clothinData ) {

	var customClothing = Fn( ( ) => {

		var mat = mat3( clothinData[ 0 ]);

		for ( /*MUST*/let i=1; i<clothinData.length; i+=2 ) {

			//If( data[i], ()=>{mat.assign( data[i+1] );} )
			mat.assign( select( clothinData[ i ], clothinData[ i+1 ], mat ) );

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
	verticalBetween,
	horizontalBetween,
	horizontalStripes,
	velour,
	latex,

};
