

import * as THREE from "three";
import * as TSL from 'three/tsl';


var renderer = new THREE.WebGPURenderer( {forceWebGL: false} ),
	scene = new THREE.Scene(),
	camera = new THREE.PerspectiveCamera( );

await renderer.renderAsync( scene, camera );	
	
	
var fail2 = TSL.Fn( ([pos,nor])=>{
	console.log('111');
	return pos.add(nor);
},{pos:'vec3',nor:'vec3',return:'vec3'});



var geometry = new THREE.BoxGeometry(),
	material = new THREE.MeshBasicNodeMaterial({positionNode: fail2(TSL.positionGeometry,TSL.normalGeometry)}),
	box = new THREE.Mesh( geometry, material );


scene.add( box );


console.log(333)
await renderer.renderAsync( scene, camera );
console.log(444)