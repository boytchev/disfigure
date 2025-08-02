
// disfigure
//
// A software burrito that wraps everything in a single file
// and exports only the things that I think someone might need.



console.log( '\n%c\u22EE\u22EE\u22EE Disfigure\n%chttps://boytchev.github.io/disfigure/\n', 'color: navy', 'font-size:80%' );



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
	ground,
	everybody,
	setAnimationLoop,

} from './world.js';



export {

	dress,
	verticalBetween,
	horizontalBetween,
	horizontalStripes,
	velour,
	latex,

} from './clothes.js';


export {

	random,
	regular,
	chaotic,

} from './motion.js';
