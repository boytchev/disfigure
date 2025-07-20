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
			file: './dist/disfigure.js',
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
			'three/addons/math/SimplexNoise.js'
		],
	},

	{
		input: './src/disfigure.js',
		output: {
			file: './dist/cjs/disfigure.js',
			format: 'cjs',
			banner: `// disfigure v${pkg.version}\n`,
			sourcemap: false
		},
		external: [
			'three',
			'three/tsl',
			'three/addons/libs/lil-gui.module.min.js',
			'three/addons/libs/stats.module.js',
			'three/addons/controls/OrbitControls.js',
			'three/addons/loaders/GLTFLoader.js',
			'three/addons/math/SimplexNoise.js'
		],
		plugins: [
			resolve(),
			commonjs()
		]
	},

	{
		input: './src/disfigure.js',
		output: {
			file: './dist/disfigure.min.js',
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
			'three/addons/math/SimplexNoise.js'
		],
		plugins: [
			terser({
				format: {
					comments: 'some'
				}
			})
		]
	},
	
	{
		input: './src/disfigure.js',
		output: {
			file: './dist/cjs/disfigure.min.cjs.js',
			format: 'cjs',
			banner: `/*! disfigure v${pkg.version} */\n`,
			sourcemap: false
		},
		external: [
			'three',
			'three/tsl',
			'three/addons/libs/lil-gui.module.min.js',
			'three/addons/libs/stats.module.js',
			'three/addons/controls/OrbitControls.js',
			'three/addons/loaders/GLTFLoader.js',
			'three/addons/math/SimplexNoise.js'
		],
		plugins: [
			resolve(),
			commonjs(),
			terser({
				format: {
					comments: 'some'
				}
			})
		]
	}

];
