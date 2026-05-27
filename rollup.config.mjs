import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import fs from 'fs';
import path from 'path';
import pkg from './package.json' with { type: 'json' };

export default [

	{
		input: './src/disfigure.js',
		output: {
			file: './dist/disfigure.max.js',
			format: 'es',
			banner: `// disfigure v${pkg.version}\n`,
		},
		external: [
			'three',
			'three/tsl',
			'three/addons/libs/lil-gui.module.min.js',
			'three/addons/libs/stats.module.js',
			'three/addons/controls/OrbitControls.js',
			'three/addons/loaders/GLTFLoader.js',
			'three/addons/math/SimplexNoise.js',
			'three/addons/modifiers/SimplifyModifier.js'
		],
	},

	{
		input: './src/disfigure.js',
		output: {
			file: './dist/disfigure.js',
			format: 'es',
			banner: `/*! disfigure v${pkg.version} */\n`,
		},
		external: [
			'three',
			'three/tsl',
			'three/addons/libs/lil-gui.module.min.js',
			'three/addons/libs/stats.module.js',
			'three/addons/controls/OrbitControls.js',
			'three/addons/loaders/GLTFLoader.js',
			'three/addons/math/SimplexNoise.js',
			'three/addons/modifiers/SimplifyModifier.js'
		],
		plugins: [
			terser()
		]
	}	

];
