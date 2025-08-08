
// disfigure
//
// Definitions of man, woman and child with motion methods.



import { AxesHelper, IcosahedronGeometry, Mesh, MeshBasicMaterial, Object3D } from 'three';



var geometry = new IcosahedronGeometry( 0.02, 0 ),
	material = new MeshBasicMaterial( { color: 'crimson', depthTest: false, depthWrite: false, transparent: true } );



class Bone extends AxesHelper {

	constructor( name, parent ) {

		super();
		//super(geometry,material);

		this.name = name;

		if ( parent ) parent.add( this );

	}

} // Joint



class Skeleton extends Object3D {

	constructor( model ) {

		super();

		this.model = model;

		// the root of all bones
		this.name = 'root';
		this.root = this;

		// create bones and their hierarchy
		this.chain([ 'root', 'torso', 'waist', 'chest', 'head' ]);
		this.chain([ 'torso', 'l_leg', 'l_thigh', 'l_knee', 'l_shin', 'l_ankle', 'l_foot' ]);
		this.chain([ 'torso', 'r_leg', 'r_thigh', 'r_knee', 'r_shin', 'r_ankle', 'r_foot' ]);
		this.chain([ 'chest', 'l_arm', 'l_elbow', 'l_forearm', 'l_wrist' ]);
		this.chain([ 'chest', 'r_arm', 'r_elbow', 'r_forearm', 'r_wrist' ]);

		// define bones positions
		for ( var name in model.space )
			if ( this[ name ])
				this[ name ].position.copy( model.space[ name ].pivot );

		// fix positions, because they are accumulated
		this.reposition( this.root );

	} // Skeleton.constructor


	chain( names ) {

		for ( var i=1; i<names.length; i++ )
			this[ names[ i ] ] = new Bone( names[ i ], this[ names[ i-1 ] ]);

	} // Skeleton.chain


	reposition( bone ) {

		for ( var child of bone.children )
			this.reposition( child );

		if ( bone!=this.root ) bone.position.sub( bone.parent.position );

	} // Skeleton.reposition


	update( ) {

		//		this.traverse( bone => {
		//			var angle = this.model[bone.name]?.angle;
		//			if( angle) bone.rotation.set(...angle);
		//		} );

		this.torso.rotation.set(
			this.model.torso.angle.x,
			this.model.torso.angle.y,
			-this.model.torso.angle.z,
			'XZY' );

		this.chest.rotation.set(
			this.model.chest.angle.x,
			this.model.chest.angle.y,
			-this.model.chest.angle.z,
			'XZY' );

		this.waist.rotation.set(
			this.model.waist.angle.x,
			this.model.waist.angle.y,
			-this.model.waist.angle.z,
			'XZY' );

		this.head.rotation.set(
			this.model.head.angle.x,
			this.model.head.angle.y,
			-this.model.head.angle.z,
			'XZY' );

		//

		this.l_knee.rotation.set(
			this.model.l_knee.angle.x,
			0,
			-this.model.l_knee.angle.z,
			'XZY' );

		this.r_knee.rotation.set(
			this.model.r_knee.angle.x,
			0,
			this.model.r_knee.angle.z,
			'XZY' );

		this.l_ankle.rotation.set(
			this.model.l_ankle.angle.x,
			0,
			this.model.l_ankle.angle.z,
			'XZY' );

		this.r_ankle.rotation.set(
			this.model.r_ankle.angle.x,
			0,
			-this.model.r_ankle.angle.z,
			'XZY' );

		this.l_shin.rotation.set(
			0,
			this.model.l_shin.angle.y,
			0,
			'XZY' );

		this.r_shin.rotation.set(
			0,
			-this.model.r_shin.angle.y,
			0,
			'XZY' );

		this.l_foot.rotation.set(
			this.model.l_foot.angle.x,
			0,
			0,
			'XZY' );

		this.r_foot.rotation.set(
			this.model.r_foot.angle.x,
			0,
			0,
			'XZY' );

		this.l_thigh.rotation.set(
			0,
			this.model.l_thigh.angle.y,
			0,
			'XZY' );

		this.r_thigh.rotation.set(
			0,
			-this.model.r_thigh.angle.y,
			0,
			'XZY' );

		this.l_leg.rotation.set(
			-this.model.l_leg.angle.x,
			this.model.l_leg.angle.y,
			this.model.l_leg.angle.z,
			'ZYX' );

		this.r_leg.rotation.set(
			-this.model.r_leg.angle.x,
			-this.model.r_leg.angle.y,
			-this.model.r_leg.angle.z,
			'ZYX' );

		//

		this.l_wrist.rotation.set(
			0,
			-this.model.l_wrist.angle.y,
			-this.model.l_wrist.angle.z,
			'XZY' );//'ZYX');

		this.r_wrist.rotation.set(
			0,
			this.model.r_wrist.angle.y,
			this.model.r_wrist.angle.z,
			'XZY' );//'ZYX');

		this.l_forearm.rotation.set(
			this.model.l_forearm.angle.x,
			0,
			0,
			'XZY' );//'ZYX');

		this.r_forearm.rotation.set(
			this.model.r_forearm.angle.x,
			0,
			0,
			'XZY' );//'ZYX');

		this.l_elbow.rotation.set(
			0,
			-this.model.l_elbow.angle.y,
			0,
			'XZY' );//'ZYX');

		this.r_elbow.rotation.set(
			0,
			this.model.r_elbow.angle.y,
			0,
			'XZY' );//'ZYX');

		this.l_arm.rotation.set(
			this.model.l_arm.angle.x,
			-this.model.l_arm.angle.y,
			-this.model.l_arm.angle.z,
			'ZYX' );

		this.r_arm.rotation.set(
			this.model.r_arm.angle.x,
			this.model.r_arm.angle.y,
			this.model.r_arm.angle.z,
			'ZYX' );

	} // Skeleton.update


	//////////////////////////////////////////////////////////////////
	/*
	torso		++-	XZY
	chest		++-	XZY
	waist		++-	XZY
	head		++-	XZY

//

	l_knee		+0- XZY
	r_knee		+0+ XZY

	l_ankle		+0+ XZY
	r_ankle		+0- XZY

	l_shin		0+0 XZY
	r_shin		0-0 XZY

	l_foot		+00 XZY
	r_foot		+00 XZY

	l_thigh		0+0 XZY
	r_thigh		0-0 XZY

	l_leg		-++ ZYX !!!
	r_leg		--- ZYX !!!

//

	l_wrist		0-- XZY
	r_wrist		0++ XZY

	l_forearm	+00 XZY
	r_forearm	+00 XZY

	l_elbow		0-0 XZY
	r_elbow		0+0 XZY

	l_arm		+-- ZYX !!!
	r_arm		+++ ZYX !!!
*/


} // Skeleton



export { Skeleton };
