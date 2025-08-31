
// disfigure
//
// deifnitions for body grips

import { Fn, mix, positionGeometry } from "three/tsl";



// smooths the coloring at the boundary of selected body part

var smooth = Fn( ([ value, fromV, toV ])=>{

	return value.smoothstep( fromV, mix( fromV, toV, 0.2 ) )
		.min(
			value.smoothstep( toV, mix( toV, fromV, 0.2 ) )
		);

}, { value: 'float', fromV: 'float', toV: 'float', return: 'float' } );



var	manGrips = {
	//  idx	      scale			position		rotation || restriction || TSL-selector
	torso: [[ 0.14, 0.08, 0.12 ], [ 0.00, -0.05, -0.01 ], [ 0, 0, 0 ],
		[ -300, 300, -300, 300, -300, 300 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, -1, 3 );

		} ),
	],
	head: [[ 0.09, 0.14, 0.11 ], [ 0, 0.09, 0.04 ], [ 0, 0, 0 ],
		[ -60, 35, -60, 60, -35, 35 ],
		Fn( ()=>{

			return smooth( positionGeometry.y.add( positionGeometry.z.div( 2 ) ), 1.48, 1.9 );

		} ),
	],
	chest: [[ 0.2, 0.22, 0.13 ], [ 0, 0.18, -0.025 ], [ -0.4, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 1.1, 1.61 )
				.mul( smooth( positionGeometry.x, -0.25, 0.25 ) );

		} ),
	],
	waist: [[ 0.15, 0.18, 0.10 ], [ 0, 0.1, -0 ], [ 0.1, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 0.85, 1.25 );

		} ),
	],
	l_arm: [[ 0.08, 0.18, 0.06 ], [ 0.09, 0.05, -0.015 ], [ Math.PI/2, -0.1, Math.PI/2 ],
		[ -80, 80, -90, 30, -90, 80 ],
		Fn( ()=>{

			return smooth( positionGeometry.x, 0.1, 0.4 )
				.mul( smooth( positionGeometry.x.add( positionGeometry.y.div( 1.5 ) ), 1, 1.7 ) );

		} ),
	],
	r_arm: [[ 0.08, 0.18, 0.06 ], [ -0.09, 0.05, -0.015 ], [ Math.PI/2, 0.1, -Math.PI/2 ],
		[ -80, 80, -30, 90, -80, 90 ],
		Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.1, 0.4 )
				.mul( smooth( positionGeometry.x.negate().add( positionGeometry.y.div( 1.5 ) ), 1, 1.7 ) );

		} ),
	],
	l_elbow: [[ 0.05, 0.08, 0.05 ], [ 0, 0.005, -0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -140, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.35, 0.5 );

		} ),
				 ],
	r_elbow: [[ 0.05, 0.08, 0.05 ], [ 0, 0.005, -0.01 ], [ Math.PI/2, 0, -Math.PI/2 ],
		[ 0, 0, 0, 140, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.35, 0.5 );

		} ),
				 ],
	l_forearm: [[ 0.04, 0.13, 0.05 ], [ 0.025, 0.005, -0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.45, 0.68 );

		} ),
				 ],
	r_forearm: [[ 0.04, 0.13, 0.05 ], [ -0.025, 0.005, -0.01 ], [ Math.PI/2, 0, -Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.45, 0.68 );

		} ),
				 ],
	l_wrist: [[ 0.07, 0.1, 0.03 ], [ 0.09, -0.01, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.6, 0.93	);

		} ),
				 ],
	r_wrist: [[ 0.07, 0.1, 0.03 ], [ -0.09, -0.01, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.6, 0.93	);

		} ),
				 ],
	l_leg: [[ 0.09, 0.14, 0.12 ], [ 0.01, -0.06, 0.0 ], [ 0, 0.3, 0 ],
		[ -120, 40, -40, 80, -20, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.80, 1.1 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.x.sub( positionGeometry.y.div( 1.5 ) ), -0.64, -0.2 ) );

		} ) ],
	r_leg: [[ 0.09, 0.14, 0.12 ], [ -0.01, -0.06, 0.0 ], [ 0, -0.3, 0 ],
		[ -120, 40, -80, 40, -90, 20 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.80, 1.1 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.x.negate().sub( positionGeometry.y.div( 1.5 ) ), -0.64, -0.2 ) );

		} ) ],
	l_thigh: [[ 0.1, 0.22, 0.1 ], [ 0.01, 0.02, 0.01 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.55, 0.9 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_thigh: [[ 0.1, 0.22, 0.1 ], [ -0.01, 0.02, 0.01 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.55, 0.9 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_knee: [[ 0.07, 0.1, 0.07 ], [ -0.005, 0.01, 0.01 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.4, 0.65 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_knee: [[ 0.07, 0.1, 0.07 ], [ 0.005, 0.01, 0.01 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.4, 0.65	 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_shin: [[ 0.07, 0.18, 0.08 ], [ -0.005, -0.06, 0.0 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.1, 0.5 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_shin: [[ 0.07, 0.18, 0.08 ], [ 0.005, -0.06, 0.0 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.1, 0.5 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_ankle: [[ 0.05, 0.07, 0.09 ], [ 0, -0.01, -0.02 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.2 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.3, 0.1 ) );

		} ) ],
	r_ankle: [[ 0.05, 0.07, 0.09 ], [ 0, -0.01, -0.02 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.2 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.3, 0.1 ) );

		} ) ],

	l_foot: [[ 0.05, 0.09, 0.04 ], [ 0, 0.0, 0.07 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, -0.0, 0.3 ) )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_foot: [[ 0.05, 0.09, 0.04 ], [ 0, 0.0, 0.07 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, 0.0, 0.3 ) )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
};




var	womanGrips = {
	//  idx	      scale			position		rotation || restriction || TSL-selector
	torso: [[ 0.14, 0.1, 0.12 ], [ 0.00, -0.05, -0.01 ], [ 0, 0, 0 ],
		[ -300, 300, -300, 300, -300, 300 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, -1, 3 );

		} ),
	],
	head: [[ 0.09, 0.14, 0.11 ], [ 0, 0.095, 0.03 ], [ 0, 0, 0 ],
		[ -60, 35, -60, 60, -35, 35 ],
		Fn( ()=>{

			return smooth( positionGeometry.y.add( positionGeometry.z.div( 2 ) ), 1.39, 1.8 );

		} ),
	],
	chest: [[ 0.16, 0.19, 0.13 ], [ 0, 0.15, 0 ], [ -0.4, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 1.05, 1.5 )
				.mul( smooth( positionGeometry.x, -0.2, 0.2 ) );

		} ),
	],
	waist: [[ 0.15, 0.18, 0.10 ], [ 0, 0.1, -0 ], [ 0.1, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 0.8, 1.15 );

		} ),
	],
	l_arm: [[ 0.07, 0.18, 0.05 ], [ 0.08, 0.03, -0.01 ], [ Math.PI/2, -0.1, Math.PI/2 ],
		[ -80, 80, -90, 30, -90, 80 ],
		Fn( ()=>{

			return smooth( positionGeometry.x, 0.06, 0.35 )
				.mul( smooth( positionGeometry.x.add( positionGeometry.y.div( 1.5 ) ), 0.9, 1.6 ) );

		} ),
	],
	r_arm: [[ 0.07, 0.18, 0.05 ], [ -0.08, 0.03, -0.01 ], [ Math.PI/2, 0.1, -Math.PI/2 ],
		[ -80, 80, -30, 90, -80, 90 ],
		Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.06, 0.35 )
				.mul( smooth( positionGeometry.x.negate().add( positionGeometry.y.div( 1.5 ) ), 0.9, 1.6 ) );

		} ),
	],
	l_elbow: [[ 0.04, 0.07, 0.04 ], [ 0.015, 0.005, 0 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -140, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.33, 0.48 );

		} ),
				 ],
	r_elbow: [[ 0.04, 0.07, 0.04 ], [ 0.015, 0.005, 0 ], [ Math.PI/2, 0.1, -Math.PI/2 ],
		[ 0, 0, 0, 140, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.33, 0.48 );

		} ),
				 ],
	l_forearm: [[ 0.04, 0.12, 0.03 ], [ 0.025, 0.005, -0.005 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.43, 0.62 );

		} ),
				 ],
	r_forearm: [[ 0.04, 0.12, 0.03 ], [ -0.025, 0.005, -0.005 ], [ Math.PI/2, 0, -Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.43, 0.62 );

		} ),
				 ],
	l_wrist: [[ 0.05, 0.1, 0.02 ], [ 0.09, -0.005, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.55, 0.93	);

		} ),
				 ],
	r_wrist: [[ 0.05, 0.1, 0.02 ], [ -0.09, -0.005, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.55, 0.93	);

		} ),
				 ],
	l_leg: [[ 0.09, 0.14, 0.12 ], [ 0.02, -0.06, -0.01 ], [ 0, 0.3, 0 ],
		[ -120, 40, -40, 80, -20, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.72, 1.1 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.x.sub( positionGeometry.y.div( 1.5 ) ), -0.58, -0.2 ) );

		} ) ],
	r_leg: [[ 0.09, 0.14, 0.12 ], [ -0.02, -0.06, -0.01 ], [ 0, -0.3, 0 ],
		[ -120, 40, -80, 40, -90, 20 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.72, 1.1 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.x.negate().sub( positionGeometry.y.div( 1.5 ) ), -0.58, -0.2 ) );

		} ) ],
	l_thigh: [[ 0.09, 0.22, 0.09 ], [ 0.02, 0.03, 0.015 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.51, 0.84 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_thigh: [[ 0.09, 0.22, 0.09 ], [ -0.02, 0.03, 0.015 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.51, 0.84 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_knee: [[ 0.06, 0.1, 0.06 ], [ -0.005, 0.015, 0.005 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.4, 0.6 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_knee: [[ 0.06, 0.1, 0.06 ], [ 0.005, 0.015, 0.005 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.4, 0.6	 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_shin: [[ 0.06, 0.19, 0.06 ], [ -0.005, -0.05, 0.0 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.1, 0.48 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_shin: [[ 0.06, 0.19, 0.06 ], [ 0.005, -0.05, 0.0 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.1, 0.48 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_ankle: [[ 0.05, 0.07, 0.09 ], [ 0, -0.01, -0.02 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.2 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.3, 0.1 ) );

		} ) ],
	r_ankle: [[ 0.05, 0.07, 0.09 ], [ 0, -0.01, -0.02 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.2 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.3, 0.1 ) );

		} ) ],
	l_foot: [[ 0.05, 0.07, 0.03 ], [ 0, -0.01, 0.06 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, 0.01, 0.3 ) )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_foot: [[ 0.05, 0.07, 0.03 ], [ 0, -0.01, 0.06 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, 0.01, 0.3 ) )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
};




var	childGrips = {
	//  idx	      scale			position		rotation || restriction || TSL-selector
	torso: [[ 0.13, 0.1, 0.08 ], [ 0.00, 0.03, -0.01 ], [ 0, 0, 0 ],
		[ -300, 300, -300, 300, -300, 300 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, -1, 3 );

		} ),
	],
	head: [[ 0.08, 0.12, 0.09 ], [ 0, 0.1, 0.02 ], [ -0.3, 0, 0 ],
		[ -60, 35, -60, 60, -35, 35 ],
		Fn( ()=>{

			return smooth( positionGeometry.y.add( positionGeometry.z.div( 2 ) ), 1.1, 1.4 );

		} ),
	],
	chest: [[ 0.14, 0.15, 0.09 ], [ 0, 0.15, -0.02 ], [ -0.3, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 0.85, 1.2 )
				.mul( smooth( positionGeometry.x, -0.18, 0.18 ) );

		} ),
	],
	waist: [[ 0.11, 0.13, 0.08 ], [ 0, 0.1, -0 ], [ 0.1, 0, 0 ],
		[ -20, 40, -60, 60, -30, 30 ],
		Fn( ()=>{

			return smooth( positionGeometry.y, 0.65, 0.95 );

		} ),
	],
	l_arm: [[ 0.04, 0.13, 0.04 ], [ 0.09, 0.0, -0.02 ], [ Math.PI/2, 0.1, Math.PI/2 ],
		[ -80, 80, -90, 30, -90, 80 ],
		Fn( ()=>{

			return smooth( positionGeometry.x, 0.07, 0.32 )
				.mul( smooth( positionGeometry.x.add( positionGeometry.y.div( 1.5 ) ), 0.73, 1.4 ) );

		} ),
	],
	r_arm: [[ 0.04, 0.13, 0.04 ], [ -0.09, 0.0, -0.02 ], [ Math.PI/2, -0.1, -Math.PI/2 ],
		[ -80, 80, -30, 90, -80, 90 ],
		Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.07, 0.32 )
				.mul( smooth( positionGeometry.x.negate().add( positionGeometry.y.div( 1.5 ) ), 0.73, 1.4 ) );

		} ),
	],
	l_elbow: [[ 0.03, 0.05, 0.03 ], [ 0.0, 0.0, -0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -140, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.28, 0.38 );

		} ),
				 ],
	r_elbow: [[ 0.03, 0.05, 0.03 ], [ 0.0, 0.0, -0.01 ], [ Math.PI/2, 0.1, -Math.PI/2 ],
		[ 0, 0, 0, 140, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.28, 0.38 );

		} ),
				 ],
	l_forearm: [[ 0.035, 0.1, 0.03 ], [ 0.0, 0.005, -0.005 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.35, 0.53 );

		} ),
				 ],
	r_forearm: [[ 0.035, 0.1, 0.03 ], [ 0.0, 0.005, -0.005 ], [ Math.PI/2, 0, -Math.PI/2 ],
		[ -70, 70, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.35, 0.53 );

		} ),
				 ],
	l_wrist: [[ 0.05, 0.08, 0.02 ], [ 0.05, -0.015, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x, 0.47, 0.8	);

		} ),
				 ],
	r_wrist: [[ 0.05, 0.08, 0.02 ], [ -0.05, -0.015, 0.01 ], [ Math.PI/2, 0, Math.PI/2 ],
		[ 0, 0, -45, 45, -90, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.x.negate(), 0.47, 0.8	);

		} ),
				 ],
	l_leg: [[ 0.07, 0.10, 0.09 ], [ 0.01, -0.01, -0.01 ], [ 0, 0.3, 0 ],
		[ -120, 40, -40, 80, -20, 90 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.6, 0.85 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.x.sub( positionGeometry.y.div( 1.5 ) ), -0.48, -0.16 ) );

		} ) ],
	r_leg: [[ 0.07, 0.10, 0.09 ], [ -0.01, -0.01, -0.01 ], [ 0, -0.3, 0 ],
		[ -120, 40, -80, 40, -90, 20 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.6, 0.85 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.x.negate().sub( positionGeometry.y.div( 1.5 ) ), -0.48, -0.16 ) );

		} ) ],
	l_thigh: [[ 0.07, 0.15, 0.07 ], [ 0.005, 0.04, -0.015 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.42, 0.68 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_thigh: [[ 0.07, 0.15, 0.07 ], [ -0.005, 0.04, -0.015 ], [ 0, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.42, 0.68 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_knee: [[ 0.05, 0.08, 0.06 ], [ -0.005, 0.015, -0.01 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.33, 0.47 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_knee: [[ 0.05, 0.08, 0.06 ], [ 0.005, 0.015, -0.01 ], [ 0.2, 0, 0 ],
		[ 0, 140, 0, 0, -10, 10 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.33, 0.47	 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_shin: [[ 0.05, 0.15, 0.05 ], [ -0.005, -0.04, -0.005 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.06, 0.39 )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_shin: [[ 0.05, 0.15, 0.05 ], [ 0.005, -0.04, -0.005 ], [ -0.1, 0, 0 ],
		[ 0, 0, -60, 60, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, 0.06, 0.39 )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
	l_ankle: [[ 0.04, 0.05, 0.065 ], [ -0.02, -0.01, 0 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.18 )
				.mul( positionGeometry.x.step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.2, 0.057 ) );

		} ) ],
	r_ankle: [[ 0.04, 0.05, 0.065 ], [ 0.02, -0.01, 0 ], [ Math.PI/2-0.1, 0, 0 ],
		[ -40, 70, 0, 0, -40, 40 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.18 )
				.mul( positionGeometry.x.negate().step( 0 ) )
				.mul( smooth( positionGeometry.z, -0.2, 0.057 ) );

		} ) ],
	l_foot: [[ 0.04, 0.07, 0.03 ], [ -0.015, -0.005, 0.05 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, -0.05, 0.3 ) )
				.mul( positionGeometry.x.step( 0 ) );

		} ) ],
	r_foot: [[ 0.04, 0.07, 0.03 ], [ 0.015, -0.005, 0.05 ], [ Math.PI/2, 0, 0 ],
		[ -40, 40, 0, 0, 0, 0 ],
					 Fn( ()=>{

			return smooth( positionGeometry.y, -0.3, 0.1 )
				.mul( smooth( positionGeometry.z, -0.005, 0.3 ) )
				.mul( positionGeometry.x.negate().step( 0 ) );

		} ) ],
};


export { manGrips, womanGrips, childGrips };
