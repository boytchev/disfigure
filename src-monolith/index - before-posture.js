

import { Mesh, Group,Euler,Matrix4,Vector3, AxesHelper, GridHelper, MeshPhysicalNodeMaterial, Matrix3 } from "three";
import { mat3, min, smoothstep,select,If, Fn, step,vec3, vec2, float, max, transformNormalToView, positionGeometry,normalGeometry, uniform, mix } from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as lil from "three/addons/libs/lil-gui.module.min.js";
import { setAnimationLoop, World, scene } from "./world.js";


console.time('TSL');

new World({stats:true, forceWebGL:true});
setAnimationLoop( loop )
var i = 0;
function loop(t) {
	++i;
	if( i==3 ) console.timeLog('TSL','render');
	if(i>10)setAnimationLoop( null )
}

var grids = new Group();
scene.add( grids );

var gh = new GridHelper( 2, 20, 'black','lightgray' );
gh.material.transparent = true;
gh.material.opacity = 0.5;
gh.rotation.x = Math.PI/2;
gh.position.y = 1;
grids.add( gh );

var gh2 = gh.clone();
gh2.material = gh.material.clone();
gh2.material.opacity = 0.2;
gh2.scale.x = 0.2;
grids.add( gh2 );

gh = gh.clone();
gh.rotation.z = Math.PI/2;
grids.add( gh );

gh2 = gh2.clone();
gh2.rotation.z = Math.PI/2;
grids.add( gh2 );
grids.visible = false;


const MODEL_PATH = import.meta.url.replace( '/index.js', '/../../assets/models/' );

var gltf = await new GLTFLoader().loadAsync( MODEL_PATH + 'man.glb' );
var model = gltf.scene.children[0];

model.castShadow = true;
model.receiveShadow = true;
model.material = new MeshPhysicalNodeMaterial( {
			metalness: 0.1,
			roughness: 0.2,
		} );

scene.add( model );


gltf = await new GLTFLoader().loadAsync( MODEL_PATH + 'woman.glb' );
var model2 = gltf.scene.children[0];

model2.position.z = -0.75;
model2.castShadow = true;
model2.receiveShadow = true;
model2.material = new MeshPhysicalNodeMaterial( {
			metalness: 0.1,
			roughness: 0.2,
		} );

scene.add( model2 );



gltf = await new GLTFLoader().loadAsync( MODEL_PATH + 'child.glb' );
var model3 = gltf.scene.children[0];

model3.position.z = -1.5;
model3.castShadow = true;
model3.receiveShadow = true;
model3.material = new MeshPhysicalNodeMaterial( {
			metalness: 0.1,
			roughness: 0.2,
		} );

scene.add( model3 );






function eulerToMatrix3(alpha, beta, gamma, signAlpha=1, signBeta=1, signGamma=1) {

	alpha *= signAlpha * Math.PI/180;
	beta *= signBeta * Math.PI/180;
	gamma *= signGamma * Math.PI/180;
	
	return new Matrix3().setFromMatrix4( (new Matrix4).makeRotationFromEuler( new Euler(-beta,-alpha,gamma,'ZXY') ) );

}


const
	TORSO_PIVOT = new Vector3(0, 0.90, 0),
	TORSO_MAT = uniform( new Matrix3 );
	
const
	HEAD_RANGE_Y = vec2(1.49, 1.57),
	HEAD_PIVOT = new Vector3(0, 1.54, -0.06),
	HEAD_MAT = uniform( new Matrix3 );
	
const
	NECK_RANGE_Y = vec2(1.4, 1.55),
	NECK_PIVOT = new Vector3(0, 1.5, -0.07),
	NECK_MAT = uniform( new Matrix3 );
	
const
	CHEST_RANGE_Y = vec2(1.0, 1.6),
	CHEST_RANGE_X = vec2(1.4, 1.6),
	CHEST_PIVOT = new Vector3(0, 1.3, -0.05),
	CHEST_MAT = uniform( new Matrix3 );
	
const
	WAIST_RANGE_Y = vec2(0.8, 1.35),
	WAIST_PIVOT = new Vector3(0, 1.1, -0.05),
	WAIST_MAT = uniform( new Matrix3 );
	
const
	FOOT_RANGE_Z = vec2(-0.05, 0.1),
	L_FOOT_PIVOT = new Vector3(0.07, 0.03, 0.05),
	L_FOOT_MAT = uniform( new Matrix3 ),
	R_FOOT_PIVOT = new Vector3(-0.07, 0.03, 0.05),
	R_FOOT_MAT = uniform( new Matrix3 );
	
const
	ANKLE_RANGE_Y = vec2(0.15, 0.05),
	L_ANKLE_PIVOT = new Vector3(0.07, 0.1, -0.02),
	L_ANKLE_MAT = uniform( new Matrix3 ),
	R_ANKLE_PIVOT = new Vector3(-0.07, 0.1, -0.02),
	R_ANKLE_MAT = uniform( new Matrix3 );
	
const
	KNEE_RANGE_Y = vec2(0.6, 0.5),
	L_KNEE_PIVOT = new Vector3(0.08, 0.53, -0.03),
	L_KNEE_MAT = uniform( new Matrix3 ),
	R_KNEE_PIVOT = new Vector3(-0.08, 0.53, -0.03),
	R_KNEE_MAT = uniform( new Matrix3 );
	
const
	adult = true,
	LEG_RANGE_Y = vec2(1.229, 0.782),
	LEG_RANGE_X = vec2(-0.004, 0.004),
	LEG_CHILD = float(1), //1=adult, 2=child
	L_LEG_PIVOT = new Vector3(0.074, 0.970, -0.034),
	L_LEG_MAT = uniform( new Matrix3 ),
	R_LEG_PIVOT = new Vector3(-0.074, 0.970, -0.034),
	R_LEG_MAT = uniform( new Matrix3 );
	
const
	WRIST_RANGE_X = vec2(0.65, 0.70),
	L_WRIST_PIVOT = new Vector3(0.67, 1.46, -0.07),
	L_WRIST_MAT = uniform( new Matrix3 ),
	R_WRIST_PIVOT = new Vector3(-0.67, 1.46, -0.07),
	R_WRIST_MAT = uniform( new Matrix3 );
	
const
	FOREARM_RANGE_X = vec2(0.435, 0.65),
	L_FOREARM_PIVOT = new Vector3(0.545, 1.46, -0.07),
	L_FOREARM_MAT = uniform( new Matrix3 ),
	R_FOREARM_PIVOT = new Vector3(-0.545, 1.46, -0.07),
	R_FOREARM_MAT = uniform( new Matrix3 );
	
const
	ELBOW_RANGE_X = vec2(0.395, 0.435),
	L_ELBOW_PIVOT = new Vector3(0.42, 1.45, -0.07),
	L_ELBOW_MAT = uniform( new Matrix3 ),
	R_ELBOW_PIVOT = new Vector3(-0.42, 1.45, -0.07),
	R_ELBOW_MAT = uniform( new Matrix3 );
	
const
	ARM_RANGE_X = vec2(0.054, 0.269),
	ARM_RANGE_Y = vec2(1.067, 1.606),
	L_ARM_PIVOT = new Vector3(0.153, 1.408, -0.072),
	L_ARM_MAT = uniform( new Matrix3 ),
	R_ARM_PIVOT = new Vector3(-0.153, 1.408, -0.072),
	R_ARM_MAT = uniform( new Matrix3 );


	
	
var posture = {
	
	head: new Vector3(0,0,0),
	neck: new Vector3(0,0,0),
	chest: new Vector3(0,0,0),
	waist: new Vector3(0,0,0),
	torso: new Vector3(0,0,0),
	
	l_foot: new Vector3(0,0,0),
	l_ankle: new Vector3(0,0,0),
	l_knee: new Vector3(0,0,0),
	l_leg: new Vector3(0,0,0),
	
	r_foot: new Vector3(0,0,0),
	r_ankle: new Vector3(0,0,0),
	r_knee: new Vector3(0,0,0),
	r_leg: new Vector3(0,0,0),
	
	l_wrist: new Vector3(0,0,0),
	l_forearm: new Vector3(0,0,0),
	l_elbow: new Vector3(0,0,0),
	l_arm: new Vector3(0,0,0),
	
	r_wrist: new Vector3(0,0,0),
	r_forearm: new Vector3(0,0,0),
	r_elbow: new Vector3(0,0,0),
	r_arm: new Vector3(0,0,0),
	
}



var axis = new AxesHelper();
axis.position.copy( L_ARM_PIVOT );
scene.add( axis );



var smooth = Fn( ([value,range])=>{

	return value.smoothstep( range.x, range.y );

},{value:'float',range:'vec2',return:'float'} );



var tslIsHead = Fn( ( [p] )=>{

	var {y, z} = p;

	var k = smooth( y.add(z.div(4)), HEAD_RANGE_Y ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsNeck = Fn( ( [p] )=>{

	var {x,y} = p;

	var k = smooth( y.sub(x.abs()), NECK_RANGE_Y ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsChest = Fn( ( [p] )=>{

	var {x,y} = p;

	var k = max(
				smooth( y, CHEST_RANGE_Y ),
				smooth( x.abs().add(y), CHEST_RANGE_X ).pow(1.5)
			);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsWaist = Fn( ( [p] )=>{
	
	var {y} = p;

	var k = smooth( y, WAIST_RANGE_Y ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsFoot = Fn( ( [p] )=>{
	
	var {y,z} = p;

	var k = smooth( z.sub(y), FOOT_RANGE_Z ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsAnkle = Fn( ( [p] )=>{
	
	var {y} = p;

	var k = smooth( y, ANKLE_RANGE_Y ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsKnee = Fn( ( [p] )=>{
	
	var {x,y} = p;

	var k = smooth( y, KNEE_RANGE_Y ).pow(1.5);
	
	return k;
}, {p:'vec3', return: 'float'} );



var tslIsLeg = Fn( ( [p, flip] )=>{
	
	var {x,y,z} = p;

	var s = vec3( x.mul( 2.0 ), y, z.min( 0 ) )
		.sub( vec3( 0, L_LEG_PIVOT.y, 0 ) )
		.length()
		.smoothstep( 0, float( 0.13 ).div( LEG_CHILD ) )
		.pow( 10 );

	var yy = y.sub( x.abs().mul( 1/5 ) );

	yy = yy.add( select( LEG_CHILD.equal( 2 ), z.abs().mul( 1/2 ), z.mul( 1/6 ) ) );

	return s
		.mul(
			smooth(x, LEG_RANGE_X.mul(flip) ),
			smooth(yy, LEG_RANGE_Y ).smoothstep(0,1).smoothstep(0,1).pow( 2 ),
		);
	
}, {p:'vec3', flip:'float', return: 'float'} );


var tslIsWrist = Fn( ( [p, flip] )=>{
	
	var {x} = p;

	var k = smooth( x, WRIST_RANGE_X.mul(flip) ).pow(1.5);
	
	return k;
}, {p:'vec3', flip:'float',return: 'float'} );


var tslIsForearm = Fn( ( [p, flip] )=>{
	
	var {x} = p;

	var k = smooth( x, FOREARM_RANGE_X.mul(flip) ).pow(1.5);
	
	return k;
}, {p:'vec3', flip:'float',return: 'float'} );


var tslIsElbow = Fn( ( [p, flip] )=>{
	
	var {x} = p;

	var k = smooth( x, ELBOW_RANGE_X.mul(flip) )//.pow(1.5);
	
	return k;
}, {p:'vec3', flip:'float',return: 'float'} );


var tslIsArm = Fn( ( [p, flip] )=>{
	
	var {x,y} = p;

	var dx = y.sub( L_ARM_PIVOT.y ).div( 4, x.sign() );

	var k = smooth( x.add( dx ), ARM_RANGE_X.mul(flip) ).smoothstep(0,1).smoothstep(0,1)
		.mul( min(
			y.smoothstep( ARM_RANGE_Y.x, mix( ARM_RANGE_Y.x, ARM_RANGE_Y.y, 0.2 ) ),
			y.smoothstep( ARM_RANGE_Y.y, mix( ARM_RANGE_Y.y, ARM_RANGE_Y.x, 0.2 ) ),
		) )
		.pow( 2 );

	return k;
	
}, {p:'vec3', flip:'float',return: 'float'} );









var tslDisfigureNode = Fn( ( )=>{

console.timeLog('TSL','disfigure');

	var pos = positionGeometry;
		
	var p = positionGeometry.toVar(); // output position
	var n = normalGeometry.toVar(); // output normal
	
	// left limbs
	If( pos.x.greaterThan(0), ()=>{

		// left foot
		var isLFoot = tslIsFoot( pos ).toVar();
		If( isLFoot.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_FOOT_PIVOT).mul(L_FOOT_MAT).add(L_FOOT_PIVOT), isLFoot ) );
			n.assign( mix( n, n.mul(L_FOOT_MAT), isLFoot ) );
		});

		// left ankle
		var isLAnkle = tslIsAnkle( pos ).toVar();
		If( isLAnkle.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_ANKLE_PIVOT).mul(L_ANKLE_MAT).add(L_ANKLE_PIVOT), isLAnkle ) );
			n.assign( mix( n, n.mul(L_ANKLE_MAT), isLAnkle ) );
		});

		// left knee
		var isLKnee = tslIsKnee( pos ).toVar();
		If( isLKnee.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_KNEE_PIVOT).mul(L_KNEE_MAT).add(L_KNEE_PIVOT), isLKnee ) );
			n.assign( mix( n, n.mul(L_KNEE_MAT), isLKnee ) );
		});

		// left leg
		var isLLeg = tslIsLeg( pos, 1 ).toVar();
		If( isLLeg.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_LEG_PIVOT).mul(L_LEG_MAT).add(L_LEG_PIVOT), isLLeg ) );
			n.assign( mix( n, n.mul(L_LEG_MAT), isLLeg ) );
		});


		// left wrist
		var isLWrist = tslIsWrist( pos, 1 ).toVar();
		If( isLWrist.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_WRIST_PIVOT).mul(L_WRIST_MAT).add(L_WRIST_PIVOT), isLWrist ) );
			n.assign( mix( n, n.mul(L_WRIST_MAT), isLWrist ) );
		});

		// left forearm
		var isLForearm = tslIsForearm( pos, 1 ).toVar();
		If( isLForearm.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_FOREARM_PIVOT).mul(L_FOREARM_MAT).add(L_FOREARM_PIVOT), isLForearm ) );
			n.assign( mix( n, n.mul(L_FOREARM_MAT), isLForearm ) );
		});

		// left elbow
		var isLElbow = tslIsElbow( pos, 1 ).toVar();
		If( isLElbow.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_ELBOW_PIVOT).mul(L_ELBOW_MAT).add(L_ELBOW_PIVOT), isLElbow ) );
			n.assign( mix( n, n.mul(L_ELBOW_MAT), isLElbow ) );
		});

		// left arm
		var isLArm = tslIsArm( pos, 1 ).toVar();
		If( isLArm.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(L_ARM_PIVOT).mul(L_ARM_MAT).add(L_ARM_PIVOT), isLArm ) );
			n.assign( mix( n, n.mul(L_ARM_MAT), isLArm ) );
		});



	} );


	// right limbs
	If( pos.x.lessThan(0), ()=>{
		
		// right foot
		var isRFoot = tslIsFoot( pos ).toVar();
		If( isRFoot.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_FOOT_PIVOT).mul(R_FOOT_MAT).add(R_FOOT_PIVOT), isRFoot ) );
			n.assign( mix( n, n.mul(R_FOOT_MAT), isRFoot ) );
		});

		// right ankle
		var isRAnkle = tslIsAnkle( pos ).toVar();
		If( isRAnkle.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_ANKLE_PIVOT).mul(R_ANKLE_MAT).add(R_ANKLE_PIVOT), isRAnkle ) );
			n.assign( mix( n, n.mul(R_ANKLE_MAT), isRAnkle ) );
		});

		// right knee
		var isRKnee = tslIsKnee( pos ).toVar();
		If( isRKnee.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_KNEE_PIVOT).mul(R_KNEE_MAT).add(R_KNEE_PIVOT), isRKnee ) );
			n.assign( mix( n, n.mul(R_KNEE_MAT), isRKnee ) );
		});

		// right leg
		var isRLeg = tslIsLeg( pos, -1 ).toVar();
		If( isRLeg.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_LEG_PIVOT).mul(R_LEG_MAT).add(R_LEG_PIVOT), isRLeg ) );
			n.assign( mix( n, n.mul(R_LEG_MAT), isRLeg ) );
		});
		

		// right wrist
		var isRWrist = tslIsWrist( pos, -1 ).toVar();
		If( isRWrist.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_WRIST_PIVOT).mul(R_WRIST_MAT).add(R_WRIST_PIVOT), isRWrist ) );
			n.assign( mix( n, n.mul(R_WRIST_MAT), isRWrist ) );
		});

		// right forearm
		var isRForearm = tslIsForearm( pos, -1 ).toVar();
		If( isRForearm.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_FOREARM_PIVOT).mul(R_FOREARM_MAT).add(R_FOREARM_PIVOT), isRForearm ) );
			n.assign( mix( n, n.mul(R_FOREARM_MAT), isRForearm ) );
		});

		// right elbow
		var isRElbow = tslIsElbow( pos, -1 ).toVar();
		If( isRElbow.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_ELBOW_PIVOT).mul(R_ELBOW_MAT).add(R_ELBOW_PIVOT), isRElbow ) );
			n.assign( mix( n, n.mul(R_ELBOW_MAT), isRElbow ) );
		});

		// right arm
		var isRArm = tslIsArm( pos, -1 ).toVar();
		If( isRArm.greaterThan(0), ()=>{
			p.assign( mix( p, p.sub(R_ARM_PIVOT).mul(R_ARM_MAT).add(R_ARM_PIVOT), isRArm ) );
			n.assign( mix( n, n.mul(R_ARM_MAT), isRArm ) );
		});
		
	} );

	
	// head
	var isHead = tslIsHead( pos ).toVar();
	If( isHead.greaterThan(0), ()=>{
		p.assign( mix( p, p.sub(HEAD_PIVOT).mul(HEAD_MAT).add(HEAD_PIVOT), isHead ) );
		n.assign( mix( n, n.mul(HEAD_MAT), isHead ) );
	});
	
	// neck
	var isNeck = tslIsNeck( pos ).toVar();
	If( isNeck.greaterThan(0), ()=>{
		p.assign( mix( p, p.sub(NECK_PIVOT).mul(NECK_MAT).add(NECK_PIVOT), isNeck ) );
		n.assign( mix( n, n.mul(NECK_MAT), isNeck ) );
	});
	
	// chest
	var isChest = tslIsChest( pos ).toVar();
	If( isChest.greaterThan(0), ()=>{
		p.assign( mix( p, p.sub(CHEST_PIVOT).mul(CHEST_MAT).add(CHEST_PIVOT), isChest ) );
		n.assign( mix( n, n.mul(CHEST_MAT), isChest ) );
	});
	
	// waist
	var isWaist = tslIsWaist( pos ).toVar();
	If( isWaist.greaterThan(0), ()=>{
		p.assign( mix( p, p.sub(WAIST_PIVOT).mul(WAIST_MAT).add(WAIST_PIVOT), isWaist ) );
		n.assign( mix( n, n.mul(WAIST_MAT), isWaist ) );
	});
	
	// torso
	p.assign( p.sub(TORSO_PIVOT).mul(TORSO_MAT).add(TORSO_PIVOT) );
	n.assign( n.mul(TORSO_MAT) );
	
	return mat3( p, transformNormalToView( n ), vec3(0) );
	
} ); // tslDisfigureNode



var tslColorNode = Fn( ( )=>{

console.timeLog('TSL','color');
	
	var pos = positionGeometry;
		
	var c = vec3( 1 ).toVar(); // output color
	
	var k = float(0);
	
	//var k = tslIsHead( pos );
	//var k = tslIsNeck( pos );
	//var k = tslIsChest( pos );
	//var k = tslIsWaist(pos);
	//var k = tslIsFoot(pos);
	//var k = tslIsAnkle(pos);
	//var k = tslIsKnee(pos);
	//var k = tslIsLeg(pos,1).mul(pos.x.step(0).oneMinus());
	//var k = tslIsWrist(pos,1);
	//var k = tslIsElbow(pos,1);
	//var k = tslIsForearm(pos,1);
	//var k = tslIsArm(pos,1);
	
	If( k.greaterThan(0).and(k.lessThan(1)) , ()=>{
		c.x.subAssign( k.oneMinus() );
		c.z.subAssign( k.oneMinus() );
		c.y.subAssign( k );
		c.z.subAssign( k );
		c.mulAssign( vec3(6,4,1) );
	});

	return c;
	
} );


		
		




var gui = new lil.GUI(); // global gui
gui.domElement.style.marginRight = 0;
var folder;

var debug = {color: !true,grids:!true};

function toggleColor() {
	if( debug.color )
		model.material.colorNode = tslColorNode();
	else
		model.material.colorNode = vec3(1);
	model.material.needsUpdate = true;
}


function toggleGrids() {
	grids.visible = debug.grids;
}


folder = gui.addFolder( 'DEBUG' ).close();
{

	folder.add( debug, 'color' ).name( 'color' ).onChange(toggleColor);
	folder.add( debug, 'grids' ).name( 'grids' ).onChange(toggleGrids);
}


folder = gui.addFolder( 'TORSO' )//.close();
{

	folder.add( posture.torso, 'x', -270, 270 ).name( 'torso x' ).onChange(updateMatrices);
	folder.add( posture.torso, 'y', -210, 210 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.torso, 'z', -210, 210 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.head, 'x', -35, 35 ).name( 'head x' ).onChange(updateMatrices);
	folder.add( posture.head, 'y', -15, 25 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.head, 'z', -25, 25 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.neck, 'x', -25, 25 ).name( 'neck x' ).onChange(updateMatrices);
	folder.add( posture.neck, 'y', -15, 25 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.neck, 'z', -25, 25 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.chest, 'x', -25, 25 ).name( 'chest x' ).onChange(updateMatrices);
	folder.add( posture.chest, 'y', -25, 45 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.chest, 'z', -20, 20 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.waist, 'x', -35, 35 ).name( 'waist x' ).onChange(updateMatrices);
	folder.add( posture.waist, 'y', -25, 35 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.waist, 'z', -25, 25 ).name( '- - z' ).onChange(updateMatrices);

}


folder = gui.addFolder( 'LEFT LEG' ).close();
{

	folder.add( posture.l_leg, 'x', -25, 45 ).name( 'leg x' ).onChange(updateMatrices);
	folder.add( posture.l_leg, 'y', -25, 100 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.l_leg, 'z', -10, 90 ).name( '- - z' ).onChange(updateMatrices);
/*
	folder.add( L_LEG_PIVOT.value, 'x', 0, 0.2 ).name( 'PIVOT X' ).onChange(updateMatrices);
	folder.add( L_LEG_PIVOT.value, 'y', 0.8, 1.2 ).name( '- - Y' ).onChange(updateMatrices);
	folder.add( L_LEG_PIVOT.value, 'z', -0.2, 0.2 ).name( '- - Z' ).onChange(updateMatrices);
*/
	folder.add( posture.l_knee, 'x', -25, 25 ).name( 'knee x' ).onChange(updateMatrices);
	folder.add( posture.l_knee, 'y', 0, 115 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.l_knee, 'z', -15, 15 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.l_ankle, 'x', -25, 25 ).name( 'ankle x' ).onChange(updateMatrices);
	folder.add( posture.l_ankle, 'y', -35, 45 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.l_ankle, 'z', -25, 25 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.l_foot, 'y', -35, 35 ).name( 'foot x' ).onChange(updateMatrices);

}


folder = gui.addFolder( 'RIGHT LEG' ).close();
{

	folder.add( posture.r_leg, 'x', -25, 45 ).name( 'leg x' ).onChange(updateMatrices);
	folder.add( posture.r_leg, 'y', -25, 100 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.r_leg, 'z', -10, 90 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.r_knee, 'x', -25, 25 ).name( 'knee x' ).onChange(updateMatrices);
	folder.add( posture.r_knee, 'y', 0, 115 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.r_knee, 'z', -15, 15 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.r_ankle, 'x', -25, 25 ).name( 'ankle x' ).onChange(updateMatrices);
	folder.add( posture.r_ankle, 'y', -35, 45 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.r_ankle, 'z', -25, 25 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.r_foot, 'y', -35, 35 ).name( 'foot x' ).onChange(updateMatrices);

}

folder = gui.addFolder( 'LEFT ARM' ).close();
{

	folder.add( posture.l_arm, 'x', -45, 20 ).name( 'arm x' ).onChange(updateMatrices);
	folder.add( posture.l_arm, 'y', -45, 30 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.l_arm, 'z', -80, 90 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.l_elbow, 'x', 0, 160 ).name( 'elbow x' ).onChange(updateMatrices);

	folder.add( posture.l_forearm, 'y', -75, 45 ).name( 'forearm y' ).onChange(updateMatrices);

	folder.add( posture.l_wrist, 'x', -45, 20 ).name( 'wrist x' ).onChange(updateMatrices);
	folder.add( posture.l_wrist, 'y', -30, 45 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.l_wrist, 'z', -80, 90 ).name( '- - z' ).onChange(updateMatrices);

}

folder = gui.addFolder( 'RIGHT ARM' ).close();
{

	folder.add( posture.r_arm, 'x', -45, 20 ).name( 'arm x' ).onChange(updateMatrices);
	folder.add( posture.r_arm, 'y', -45, 30 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.r_arm, 'z', -80, 90 ).name( '- - z' ).onChange(updateMatrices);

	folder.add( posture.r_elbow, 'x', 0, 160 ).name( 'elbow x' ).onChange(updateMatrices);

	folder.add( posture.r_forearm, 'y', -75, 45 ).name( 'forearm y' ).onChange(updateMatrices);

	folder.add( posture.r_wrist, 'x', -45, 20 ).name( 'wrist x' ).onChange(updateMatrices);
	folder.add( posture.r_wrist, 'y', -30, 45 ).name( '- - y' ).onChange(updateMatrices);
	folder.add( posture.r_wrist, 'z', -80, 90 ).name( '- - z' ).onChange(updateMatrices);

}


var _mat = new Matrix3();
function updateMatrices( )
{
	_mat = eulerToMatrix3( ...posture.head );
	HEAD_MAT.value.copy( _mat );

	_mat = eulerToMatrix3( ...posture.neck );
	NECK_MAT.value.copy( _mat );

	_mat = eulerToMatrix3( ...posture.chest );
	CHEST_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.waist );
	WAIST_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.torso );
	TORSO_MAT.value.copy( _mat );

	//
	
	_mat = eulerToMatrix3( ...posture.l_foot, 1, 1, -1 );
	L_FOOT_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_foot, -1, 1, 1 );
	R_FOOT_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_ankle, 1, 1, -1 );
	L_ANKLE_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_ankle, -1, 1, 1 );
	R_ANKLE_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_knee, 1, 1, -1 );
	L_KNEE_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_knee, -1, 1, 1 );
	R_KNEE_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_leg, 1, -1, -1 );
	L_LEG_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_leg, -1, -1, 1 );
	R_LEG_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_wrist, -1, 1, 1 );
	L_WRIST_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_wrist, 1, 1, -1 );
	R_WRIST_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_forearm, -1, 1, -1 );
	L_FOREARM_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_forearm, 1, 1, 1 );
	R_FOREARM_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_elbow, -1, 0, 0 );
	L_ELBOW_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_elbow, 1, 0, 0 );
	R_ELBOW_MAT.value.copy( _mat );
	
	//
	
	_mat = eulerToMatrix3( ...posture.l_arm, -1, 1, 1 );
	L_ARM_MAT.value.copy( _mat );
	
	_mat = eulerToMatrix3( ...posture.r_arm, 1, 1, -1 );
	R_ARM_MAT.value.copy( _mat );
	
}


var disfigureNode = tslDisfigureNode();
model.material.positionNode = disfigureNode.element(0);
model.material.normalNode = disfigureNode.element(1);
model.material.colorNode = tslColorNode();

var disfigureNode2 = tslDisfigureNode();
model2.material.positionNode = disfigureNode2.element(0);
model2.material.normalNode = disfigureNode2.element(1);
model2.material.colorNode = tslColorNode();

var disfigureNode3 = tslDisfigureNode();
model3.material.positionNode = disfigureNode3.element(0);
model3.material.normalNode = disfigureNode3.element(1);
model3.material.colorNode = tslColorNode();



console.timeLog('TSL','parser');

