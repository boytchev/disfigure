
// disfigure
//
// A collection of space selectors - functions that return 1 if a point is inside
// the selected space, and 0 if it is outside. Boundaries of the spaces are foggy,
// so values between 0 and 1 are also possible.



import { Vector3 } from "three";
import { float, Fn, mat3, min, positionGeometry, uniform, vec3 } from "three/tsl";
import { everybody } from './world.js';



// inject spinner CSS
var css = document.createElement( 'style' );
css.innerHTML = `
	#spinner {position:fixed;left:49%;top:45%;animation:flash 1s 3;}
	#spinner::before {content:'Loading...'}
	@keyframes flash{to{opacity:0}}
`;
document.head.appendChild( css );



var spinnerCounter = 0,
	spinner = document.getElementById( 'spinner' );

function loader( ) {

	spinnerCounter++;
	if ( spinner && spinnerCounter >= everybody.length*12 )
		spinner.style.display = 'none';

}

if ( spinner ) {

	setTimeout( ()=>spinner.style.display = 'none', 3000 );

}



// generate oversmooth function
const smoother = Fn( ([ edgeFrom, edgeTo, value ])=>{

	return value.smoothstep( edgeFrom, edgeTo ).smoothstep( 0, 1 ).smoothstep( 0, 1 );

}, { edgeFrom: 'float', edgeTo: 'float', value: 'float', return: 'float' } );



class Locus {

	constructor( pivot ) {

		// calculate a pivot vector with actual coordinates
		this.pivot = new Vector3( ...pivot );
		this.angle = new Vector3();
		this.matrix = uniform( mat3() );
		this.isRight = false;

	} // Locus.constructor

	mirror( ) {

		this.isRight = true;

		this.pivot.x *= -1;

		if ( this.minX ) this.minX *= -1;
		if ( this.maxX ) this.maxX *= -1;

		return this;

	} // Locus.mirror

} // Locus



// define a horizontal planar locus that can tilt fowrard (i.e. around X axix,
// towards the screen); vertically it is from minY to maxY, horizontally it is
// infinite; areas outside rangeX are consider inside the locus
class LocusY extends Locus {

	constructor( pivot, rangeY, angle=0, rangeX=[ 0, 0 ]) {

		super( pivot );

		[ this.minY, this.maxY ] = rangeY;
		[ this.minX, this.maxX ] = rangeX;

		this.slope = Math.tan( ( 90-angle ) * Math.PI/180 );

	} // constructor

	locus( ) {

		var { x, y, z } = positionGeometry;

		y = y.add( z.sub( this.pivot.z ).div( this.slope ) );

		var k = smoother( this.minY, this.maxY, y );

		if ( this.minX || this.maxX ) {

			k = k.max(
				smoother( this.minX, this.maxX, x.abs().add( y.sub( this.pivot.y ) ) )
			);

		}

		return k;

	} // locus

} // LocusY



// define a vertical planar locus, perpendicular to X; vertically infinite,
// horizontally from minX to maxX
class LocusX extends Locus {

	constructor( pivot, rangeX ) {

		super( pivot );

		[ this.minX, this.maxX ] = rangeX;

	} // constructor

	locus( ) {

		var x = positionGeometry.x;

		return smoother( this.minX, this.maxX, x );

	} // locus

} // LocusX



// define a rectangular locus, from minX to maxX, from minY to maxY, but infinite along Z
class LocusXY extends LocusX {

	constructor( pivot, rangeX, rangeY ) {

		super( pivot, rangeX );

		[ this.minY, this.maxY ] = rangeY;

	} // constructor

	locus( ) {

		loader();

		var { x, y } = positionGeometry;

		var dx = y.sub( this.pivot.y ).div( 4, x.sign() );

		return smoother( float( this.minX ).sub( dx ), float( this.maxX ).sub( dx ), x )
			.mul( min(
				smoother( this.minY, this.minY*0.8+0.2*this.maxY, y ),
				smoother( this.maxY, this.maxY*0.8+0.2*this.minY, y ),
			) )
			.pow( 2 );

	} // locus

} // LocusXY



// define custom locus specifically for hips
class LocusT extends LocusXY {

	constructor( pivot, rangeX, rangeY, grown=0 ) {

		super( pivot, rangeX, rangeY );

		this.grown = grown;

	} // constructor

	locus( ) {

		var { x, y, z } = positionGeometry;

		var s = vec3( x.mul( 2.0 ), y, z.min( 0 ) )
			.sub( vec3( 0, this.pivot.y, 0 ) )
			.length()
			.smoothstep( 0, 0.13/( this.grown+1 ) )
			.pow( 10 );

		var yy = y.sub( x.abs().mul( 1/5 ) );

		if ( this.grown==0 )
			yy = yy.add( z.mul( 1/6 ) );
		else
			yy = yy.add( z.abs().mul( 1/2 ) );

		return s
			.mul(
				x.smoothstep( this.minX, this.maxX ),
				smoother( this.minY, this.maxY, yy ).pow( 2 ),
			);

	} // locus

} // LocusT



// the definition of a space around a model including properties of individual
// subspaces that simulate joints
class Space {

	constructor( bodyPartsDef ) {

		// torso
		this.head = new LocusY( ...bodyPartsDef.head );
		this.chest = new LocusY( ...bodyPartsDef.chest );
		this.waist = new LocusY( ...bodyPartsDef.waist );
		this.torso = new LocusY( ...bodyPartsDef.torso );

		// legs
		this.l_knee = new LocusY( ...bodyPartsDef.knee );
		this.r_knee = new LocusY( ...bodyPartsDef.knee ).mirror();

		this.l_ankle = new LocusY( ...bodyPartsDef.ankle );
		this.r_ankle = new LocusY( ...bodyPartsDef.ankle ).mirror();

		this.l_ankle2 = new LocusY( ...bodyPartsDef.ankle2 );
		this.r_ankle2 = new LocusY( ...bodyPartsDef.ankle2 ).mirror();

		this.l_leg2 = new LocusY( ...bodyPartsDef.leg2 );
		this.r_leg2 = new LocusY( ...bodyPartsDef.leg2 ).mirror();

		this.l_foot = new LocusY( ...bodyPartsDef.foot );
		this.r_foot = new LocusY( ...bodyPartsDef.foot ).mirror();

		this.l_leg = new LocusT( ...bodyPartsDef.leg );
		this.r_leg = new LocusT( ...bodyPartsDef.leg ).mirror();

		// arms
		this.l_elbow = new LocusX( ...bodyPartsDef.elbow );
		this.r_elbow = new LocusX( ...bodyPartsDef.elbow ).mirror();

		this.l_wrist2 = new LocusX( ...bodyPartsDef.wrist2 );
		this.r_wrist2 = new LocusX( ...bodyPartsDef.wrist2 ).mirror();

		this.l_wrist = new LocusX( ...bodyPartsDef.wrist );
		this.r_wrist = new LocusX( ...bodyPartsDef.wrist ).mirror();

		this.l_arm = new LocusXY( ...bodyPartsDef.arm );
		this.r_arm = new LocusXY( ...bodyPartsDef.arm ).mirror();

	} // Space.constructor

} // Space



export { Space, LocusX, LocusT };
