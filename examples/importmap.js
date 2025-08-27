

var THREEJS = 'three@0.179.0';
var CDN = 'https://cdn.jsdelivr.net/npm';



// add favicon
var favicon = document.createElement( 'link' );
favicon.setAttribute( 'rel', 'shortcut icon' );
favicon.href = '../assets/logo/favicon.ico';

document.querySelector( 'head' ).appendChild( favicon );


// add CSS
var css = document.createElement( 'link' );
css.type = 'text/css';
css.rel = 'stylesheet';
css.href = '../examples/styles.css';

document.head.appendChild( css );



// import maps
// https://www.baldurbjarnason.com/2023/dynamic-import-map/

var importMap = `
	{
		"imports": {
			"three": "${CDN}/${THREEJS}/build/three.webgpu.min.js",
			"three/webgpu": "${CDN}/${THREEJS}/build/three.webgpu.min.js",
			"three/tsl": "${CDN}/${THREEJS}/build/three.tsl.min.js",
			"three/addons/": "${CDN}/${THREEJS}/examples/jsm/",
			"disfigure": "../src/disfigure.js",
			"label": "./font.js"
		}
	}
`;


var importmap = document.createElement( 'script' );
importmap.type = "importmap";
importmap.textContent = importMap;

document.currentScript.after( importmap );
