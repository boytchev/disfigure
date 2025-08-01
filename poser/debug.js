


const DEBUG = false;



const DEBUG_JOINT = 1; // see DEBUG_NAME for numeric values



const DEBUG_NAME = DEBUG ? {
	0: '',
	1: 'head', 2: 'chest', 3: 'waist',
	11: 'l_leg', 12: 'l_thigh', 13: 'l_knee', 15: 'l_ankle', 14: 'l_shin', 16: 'l_foot',
	21: 'l_arm', 22: 'l_elbow', 23: 'l_forearm', 24: 'l_wrist',
}[ DEBUG_JOINT ] : '';



export { DEBUG, DEBUG_NAME, DEBUG_JOINT };
