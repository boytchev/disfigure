
// disfigure



import { Euler, Mesh, MeshPhysicalNodeMaterial, PlaneGeometry, Quaternion, Vector2, Vector3, Vector4 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { uniform, vec4 } from 'three/tsl';
import { disfigureBody } from './tsl.js';


var loader = new GLTFLoader();



// path to models as GLB files
const MODEL_PATH = import.meta.url
	.replace( '/src/body.js', '/assets/models/' )
	.replace( '/dist/disfigure.js', '/assets/models/' )
	.replace( '/dist/disfigure.min.js', '/assets/models/' )
	.replace( '/examples/quaternions-prototype/body.js', '/assets/models/' );




var dummyGeometry = new PlaneGeometry(),
	dummyQuaternion = new Quaternion();


var geometries = {};


class Disfigure extends Mesh {

	constructor( url ) {

		super( dummyGeometry, new MeshPhysicalNodeMaterial() );
		this.castShadow = true;
		this.receiveShadow = true;

		this.select = null;
		this.eulers = [];
		this.quaternions = [];

		this.loadGeometry( url );

		for ( var i=0; i<52; i++ ) {

			this.eulers.push( new Euler( 0, 0, 0, 'YXZ' ) );
			this.quaternions.push( uniform( vec4() ) );

		}

		var disfigure = disfigureBody( this );

		this.material.positionNode = disfigure.element( 0 );
		this.material.normalNode = disfigure.element( 1 );
		this.material.emissiveNode = disfigure.element( 2 );

	} // Disfigure.constructor


	loadGeometry( url ) {

		if ( url in geometries )
			this.geometry = geometries[ url ];
		else
			loader.load( url, ( gltf )=>{

				geometries[ url ] = gltf.scene.children[ 0 ].geometry;
				this.geometry = geometries[ url ];

			} );

	} // Disfigure.loadGeometry


	updateQuaternions( ) {

		for ( var i in this.eulers ) {

			dummyQuaternion.setFromEuler( this.eulers[ i ], false );
			this.quaternions[ i ].value.set( ...dummyQuaternion );

		}

	} // Disfigure.updateQuaternions


} // Disfigure



class Man extends Disfigure {

	constructor( ) {

		super( MODEL_PATH+'man.glb' );

		this.skeletonData = {

			// torso

			torsoPivot: new Vector3( 0, 1.014, -0.016 ), //xyz

			headPivot: new Vector3( 0, 1.57, -0.07 ), //xyz
			headRange: new Vector3( 1.49, 1.57, 0.5 ), //miny, maxy, z

			chestPivot: new Vector3( 0, 1.20, -0.01 ), //xyz
			chestRange: new Vector3( 1.00, 1.40, 0 ), //miny, maxy, z

			waistPivot: new Vector3( 0, 1.00, -0.01 ), //xyz
			waistRange: new Vector3( 0.80, 1.20, 0 ), //miny, maxy, z

			// leg

			footPivot: new Vector3( 0, 0.03, 0.07 ), //xyz
			footRange: new Vector3( 0.0, -0.10, -1 ), //miny, maxy, z

			anklePivot: new Vector3( 0.07, 0.07, -0.02 ), //xyz
			ankleRange: new Vector3( 0.10, 0.04, 0 ), //miny, maxy, z

			shinPivot: new Vector3( 0.07, 0.4, -0.04 ), //xyz
			shinRange: new Vector3( 0.5, 0.07, 0 ), //miny, maxy, z

			kneePivot: new Vector3( 0.09, 0.53, -0.03 ), //xyz
			kneeRange: new Vector3( 0.55, 0.48, 0 ), //miny, maxy, z

			thighPivot: new Vector3( 0.09, 0.53, -0.03 ), //xyz
			thighRange: new Vector3( 0.87, 0.55, 0 ), //miny, maxy, m

			legPivot: new Vector3( 0.062, 0.931, -0.015 ), // xyz
			legRange: new Vector4( 1.05+0.005, 0.852-0.005, 0.88, 0.87 ), // min-max, min-max
			legRange2: new Vector2( 0, 0.05 ), // grown=0,1, dX

			// arm

			wristPivot: new Vector3( 0.673, 1.462, -0.072 ), //xyz
			wristRange: new Vector3( 0.65, 0.70, 0 ), //minx, maxx, m

			forearmPivot: new Vector3( 0.550, 1.453, -0.068 ), //xyz
			forearmRange: new Vector3( 0.40, 0.77, 0 ), //minx, maxx, m

			elbowPivot: new Vector3( 0.427, 1.453, -0.072 ), //xyz
			elbowRange: new Vector3( 0.413, 0.467, 0 ), //minx, maxx, m

			armPivot: new Vector3( 0.16, 1.441, -0.072 ), //xyz
			armRange: new Vector4( 0.103, 0.242, 1.066, 1.164 ), //minx, maxx, miny, maxy

			// fingers
			finger02Pivot: new Vector3( 0.759, 1.456, -0.003 ), //xyz
			finger02Range: new Vector4( 0.759-0.01, 0.759+0.007, -0.025, 0.03 ), //minx, maxx, minz, maxz
			finger02Slope: 0.5,
			finger01Pivot: uniform( new Vector3( 0.717, 1.456, -0.035 ) ), //xyz
			finger01Range: uniform( new Vector4( 1.519, 1.477, 0.656, 0.770 ) ), // miny maxy minx maxx
			finger01Z: -0.03,

			finger13Pivot: new Vector3( 0.829, 1.461, -0.049 ), //xyz
			finger13Range: new Vector4( 0.829-0.01, 0.829+0.01, -0.058, -0.040 ), //minx, maxx, minz, maxz
			finger12Pivot: new Vector3( 0.804, 1.461, -0.049 ), //xyz
			finger12Range: new Vector4( 0.804-0.01, 0.804+0.01, -0.058, -0.040 ), //minx, maxx, minz, maxz
			finger11Pivot: new Vector3( 0.764, 1.461, -0.049 ), //xyz
			finger11Range: new Vector4( 0.764-0.01, 0.764+0.03, -0.058, -0.040 ), //minx, maxx, minz, maxz

			finger23Pivot: new Vector3( 0.841, 1.461, -0.068 ), //xyz
			finger23Range: new Vector4( 0.841-0.01, 0.841+0.01, -0.077, -0.058 ), //minx, maxx, minz, maxz
			finger22Pivot: new Vector3( 0.811, 1.461, -0.068 ), //xyz
			finger22Range: new Vector4( 0.811-0.01, 0.811+0.01, -0.077, -0.058 ), //minx, maxx, minz, maxz
			finger21Pivot: new Vector3( 0.773, 1.461, -0.068 ), //xyz
			finger21Range: new Vector4( 0.773-0.01, 0.773+0.03, -0.077, -0.058 ), //minx, maxx, minz, maxz

			finger33Pivot: new Vector3( 0.834, 1.453, -0.086 ), //xyz
			finger33Range: new Vector4( 0.834-0.01, 0.834+0.01, -0.095, -0.077 ), //minx, maxx, minz, maxz
			finger32Pivot: new Vector3( 0.807, 1.453, -0.086 ), //xyz
			finger32Range: new Vector4( 0.807-0.01, 0.807+0.01, -0.095, -0.077 ), //minx, maxx, minz, maxz
			finger31Pivot: new Vector3( 0.767, 1.453, -0.086 ), //xyz
			finger31Range: new Vector4( 0.767-0.01, 0.767+0.03, -0.095, -0.077 ), //minx, maxx, minz, maxz

			finger43Pivot: new Vector3( 0.821, 1.45, -0.103 ), //xyz
			finger43Range: new Vector4( 0.821-0.01, 0.821+0.01, -0.111, -0.0955 ), //minx, maxx, minz, maxz
			finger42Pivot: new Vector3( 0.796, 1.45, -0.103 ), //xyz
			finger42Range: new Vector4( 0.796-0.01, 0.796+0.01, -0.111, -0.0955 ), //minx, maxx, minz, maxz
			finger41Pivot: new Vector3( 0.753, 1.45, -0.103 ), //xyz
			finger41Range: new Vector4( 0.753-0.01, 0.753+0.03, -0.111, -0.0955 ), //minx, maxx, minz, maxz

		};

	} // Man.constructor

} // Man



export { Man };
