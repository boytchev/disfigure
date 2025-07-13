


const DEBUG = false;



const DEBUG_JOINT = 1; // see DEBUG_NAME for numeric values



const DEBUG_NAME = DEBUG ? {
	0: '',
	1: 'head', 2: 'chest', 3: 'waist',
	11: 'legLeft', 12: 'legLongLeft', 13: 'kneeLeft', 15: 'ankleLeft', 14: 'ankleLongLeft', 16: 'footLeft',
	21: 'armLeft', 22: 'elbowLeft', 23: 'forearmLeft', 24: 'wristLeft',
}[ DEBUG_JOINT ] : '';



export { DEBUG, DEBUG_NAME, DEBUG_JOINT };
