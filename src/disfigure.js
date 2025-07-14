
// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '%c\u22EE\u22EE\u22EE DISFIGURE v0', 'display: block; padding:0.5em; font-size:150%; color: crimson;' );



export {

	Man,
	Woman,
	Child,

} from './body.js';



export {

	World,
	renderer,
	scene,
	camera,
	light,
	cameraLight,
	controls,
	everybody,
	setAnimationLoop,

} from './world.js';



export {

	regular,
	chaotic,

} from './utils.js';
