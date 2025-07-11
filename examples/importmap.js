﻿
// https://www.baldurbjarnason.com/2023/dynamic-import-map/

var THREEJS = 'three@0.178.0';
var CDN = 'https://cdn.jsdelivr.net/npm';

var importMap = `
	{
		"imports": {
			"three": "${CDN}/${THREEJS}/build/three.webgpu.min.js",
			"three/webgpu": "${CDN}/${THREEJS}/build/three.webgpu.min.js",
			"three/tsl": "${CDN}/${THREEJS}/build/three.tsl.min.js",
			"three/addons/": "${CDN}/${THREEJS}/examples/jsm/",
			"disfigure": "../src/disfigure.js"
		}
	}
`;


var importmap = document.createElement( 'script' );
	importmap.type = "importmap";
	importmap.textContent = importMap;
	
	
document.currentScript.after( importmap );
