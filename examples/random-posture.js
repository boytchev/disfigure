


import * as Happy from 'disfigure';


function randomPosture( figure, t=Math.random()*100, k=Math.random()*100 ) {
	
		figure.head.x = Happy.chaotic(t,k++,-30,30);
		figure.head.y = Happy.chaotic(t*2,k++,-60,60);
		figure.head.z = Happy.chaotic(t,k++,-30,30);

		figure.chest.x = Happy.chaotic(t,k++,-30,30);
		figure.chest.y = Happy.chaotic(t,k++,-60,60);
		figure.chest.z = Happy.chaotic(t,k++,-30,30);

		figure.waist.x = Happy.chaotic(t,k++,-30,30);
		figure.waist.y = Happy.chaotic(t,k++,-60,60);
		figure.waist.z = Happy.chaotic(t,k++,-30,30);
	

		figure.l_foot.x = Happy.chaotic(t,k++,-40,40);
		figure.r_foot.x = Happy.chaotic(t,k++,-40,40);

		figure.l_ankle.x = Happy.chaotic(t,k++,-30,30);
		figure.l_ankle.z = Happy.chaotic(t,k++,-30,30);
		figure.r_ankle.x = Happy.chaotic(t,k++,-30,30);
		figure.r_ankle.z = Happy.chaotic(t,k++,-30,30);

		figure.l_shin.y = Happy.chaotic(t,k++,-60,60);
		figure.r_shin.y = Happy.chaotic(t,k++,-60,60);

		figure.l_knee.x = Happy.chaotic(t,k++,0,120);
		figure.l_knee.z = Happy.chaotic(t,k++,-10,10);
		figure.r_knee.x = Happy.chaotic(t,k++,0,120);
		figure.r_knee.z = Happy.chaotic(t,k++,-10,10);

		figure.l_thigh.y = Happy.chaotic(t,k++,-40,40);
		figure.r_thigh.y = Happy.chaotic(t,k++,-40,40);

		figure.l_leg.x = Happy.chaotic(t,k++,-15,70);
		figure.l_leg.z = Happy.chaotic(t,k++,0,40);
		figure.r_leg.x = Happy.chaotic(t,k++,-15,70);
		figure.r_leg.z = Happy.chaotic(t,k++,0,40);
					
		
		
		figure.l_wrist.y = Happy.chaotic(t,k++,-20,45);
		figure.l_wrist.z = Happy.chaotic(t,k++,-90,90);
		figure.r_wrist.y = Happy.chaotic(t,k++,-20,45);
		figure.r_wrist.z = Happy.chaotic(t,k++,-90,90);

		figure.l_forearm.x = Happy.chaotic(t,k++,-30,60);
		figure.r_forearm.x = Happy.chaotic(t,k++,-30,60);

		figure.l_elbow.y = Happy.chaotic(t,k++,0,160);
		figure.r_elbow.y = Happy.chaotic(t,k++,0,160);

		figure.l_arm.x = Happy.chaotic(t,k++,-40,40);
		figure.l_arm.y = Happy.chaotic(t,k++,-15,60);
		figure.l_arm.z = Happy.chaotic(t,k++,-15,60);
		figure.r_arm.x = Happy.chaotic(t,k++,-40,40);
		figure.r_arm.y = Happy.chaotic(t,k++,-15,60);
		figure.r_arm.z = Happy.chaotic(t,k++,-15,60);


		figure.l_thumb.x = Happy.chaotic(3*t,k++,0,60);
		figure.l_thumb.y = Happy.chaotic(3*t,k++,0,50);
		figure.l_thumb.z = Happy.chaotic(3*t,k++,-15,50);
		figure.r_thumb.x = Happy.chaotic(3*t,k++,0,60);
		figure.r_thumb.y = Happy.chaotic(3*t,k++,0,50);
		figure.r_thumb.z = Happy.chaotic(3*t,k++,-15,50);
		figure.l_thumb_tip.y = Happy.chaotic(3*t,k++,0,90);
		figure.r_thumb_tip.y = Happy.chaotic(3*t,k++,0,90);

		figure.l_index.z = Happy.chaotic(3*t,k++,-10,90);
		figure.r_index.z = Happy.chaotic(3*t,k++,-10,90);
		figure.l_index_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_index_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.l_index_tip.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_index_tip.z = Happy.chaotic(3*t,k++,0,90);

		figure.l_middle.z = Happy.chaotic(3*t,k++,-10,90);
		figure.r_middle.z = Happy.chaotic(3*t,k++,-10,90);
		figure.l_middle_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_middle_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.l_middle_tip.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_middle_tip.z = Happy.chaotic(3*t,k++,0,90);


		figure.l_ring.z = Happy.chaotic(3*t,k++,-10,90);
		figure.r_ring.z = Happy.chaotic(3*t,k++,-10,90);
		figure.l_ring_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_ring_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.l_ring_tip.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_ring_tip.z = Happy.chaotic(3*t,k++,0,90);

		figure.l_pinky.z = Happy.chaotic(3*t,k++,-10,90);
		figure.r_pinky.z = Happy.chaotic(3*t,k++,-10,90);
		figure.l_pinky_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_pinky_mid.z = Happy.chaotic(3*t,k++,0,90);
		figure.l_pinky_tip.z = Happy.chaotic(3*t,k++,0,90);
		figure.r_pinky_tip.z = Happy.chaotic(3*t,k++,0,90);


		var h = Happy.chaotic(3*t,k++,0,10);
		
		figure.l_index.y = 3*h;
		figure.r_index.y = 3*h;

		figure.l_middle.y = h;
		figure.r_middle.y = h;

		figure.l_ring.y = h;
		figure.r_ring.y = h;

		figure.l_pinky.y = 3*h;
		figure.r_pinky.y = 3*h;

}


function standingPosture( figure, t ) {

		t += 10*figure.uid;

		// arms

		figure.l_arm.z = Happy.chaotic( t, figure.uid+5, -70, -80 );
		figure.l_arm.y = Happy.chaotic( t, figure.uid+6, -10, 70 );

		figure.r_arm.z = Happy.chaotic( t, figure.uid-5, -70, -80 );
		figure.r_arm.y = Happy.chaotic( t, figure.uid-6, -10, 70 );

		figure.l_elbow.y = Happy.chaotic( t, figure.uid+9, 0, 40 );
		figure.r_elbow.y = Happy.chaotic( t, figure.uid+7, 0, 40 );

		figure.l_forearm.x = Happy.chaotic( t, figure.uid+11, -15, 15 );
		figure.r_forearm.x = Happy.chaotic( t, figure.uid-8, -15, 15 );

		figure.l_wrist.y = Happy.chaotic( t, figure.uid-5, -20, 20 );
		figure.l_wrist.z = Happy.chaotic( t, figure.uid-2, -20, 20 );

		figure.r_wrist.y = Happy.chaotic( t, figure.uid-4, -20, 20 );
		figure.r_wrist.z = Happy.chaotic( t, figure.uid-1, -20, 20 );

		// body
	
		figure.head.x = Happy.chaotic( t/5, figure.uid+3, -10, 10 );
		figure.head.y = Happy.chaotic( t/2, figure.uid+2, -40, 40 );
		figure.head.z = Happy.chaotic( t/2, figure.uid+1, -20, 20 );
		figure.waist.y = -figure.head.y;
		
}


export { randomPosture, standingPosture };
