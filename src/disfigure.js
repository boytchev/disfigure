/**
 * Disfigure Main Entry Point
 *
 * A lightweight library for TSL quaternion-based humanoid character rigging.
 *
 * This file serves as the public API and "software burrito" — it wraps
 * all internal modules and exposes only the intended public interface.
 *
 * @see https://boytchev.github.io/disfigure/
 *
 * -----------------------------------------------------------------------------
 *
 * Public API:
 *
 * chaotic()	- Calculates a smoothly varying organic value
 * regular()	- Calculates a smoothly oscillating sine value
 * random()		- Calculates a uniform random value
 *
 * -----------------------------------------------------------------------------
 *
 * AI Disclosure:
 *
 * Grok 4.3 assistance was used for fine-tuning code comments.
 */



import { SimplexNoise } from "three/addons/math/SimplexNoise.js";



/**
 * Not-fancy banner - just name and link
 */
console.log(
	'\nDisfigure\n%chttps://boytchev.github.io/disfigure/\n',
	'font-size:80%'
);



var simplex = new SimplexNoise( );



/**
 * Calculates a smoothly varying pseudo-random value using Simplex 2D noise.
 * Used for organic, chaotic motion suitable for breathing, idle animations, etc.
 *
 * The noise represents an imaginary terrain. This function gets the altitude
 * at position [`x`,`y`]. The result is in [`min`,`max`].
 */
function chaotic( x, y, min, max ) {

	return min + ( max-min )*( simplex.noise( x, y )+1 )/2;

}



/**
 * Calculates a smoothly oscillating value using sine function.
 * Used for predictable, repeating motion like walking cycle.
 *
 * The sine represents an imaginary wave. This function gets the altitude
 * at position [`x`]. The result is in [`min`,`max`].
 */
function regular( x, min, max ) {

	return min + ( max-min )*( Math.sin( x )+1 )/2;

}



/**
 * Calculates a simple uniform random value (non-deterministic).
 * Useful for one-time randomization or initial setup.
 *
 * The result is in [`min`,`max`].
 */
function random( min, max ) {

	return min + ( max-min )*Math.random( );

}



export { chaotic, regular, random };

export * from './body.js';
export * from './world.js';
export * from './tsl.js';
