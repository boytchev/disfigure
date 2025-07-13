
// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '%c\n\u22EE\u22EE\u22EE%cDISFIGURE\n\n', 'font-size:200%', 'font-size:150%; display:inline-block; padding:0.15em;' );



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
