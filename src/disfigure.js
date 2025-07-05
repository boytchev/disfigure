
// disfigure
//
// A software burrito -- a wrapper this pack everything in a single file and
// exports only the things that I thought someone might need. I'd try to make
// the exports as few as reasonable possible.



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
