<img class="logo" src="../assets/logo/logo.min.png">


# Disfigure: API Reference



## Classes

Disfigure classes are used to define figures.

### new **Man**( )<br>new **Man**( *height* )

Class. Creates a man figure. The Optional parameter defines figure
*height* in meters. Default height 1.80.

### new **Woman**( )<br>new **Woman**( *height* )

Class. Creates a woman figure. The optional parameter defines figure
*height* in meters. Default height 1.70.

### new **Child**( )<br>new **Child**( *height* )

Class. Creates a child figure. The optional parameter defines figure
*height* in meters. Default height 1.35.



## Figures

Disfigure figures have the same structure independent on their appearance.

### figure.**position**

Vector3 property. Gets or sets the *position* of a figure in 3D space.

### figure.**position.x**<br>figure.**position.y**<br>figure.**position.z**

Numeric properties. Get or set the *x*, *y* or *z* coordinate of a figure in 3D space.

### figure.**posture**

Object property. Gets or sets the posture of a figure. The posture is a JavaScript object with specific structure.

### figure.**postureString**

String read-only property. Gets the posture of a figure as string.

### figure.**blend** ( *postureA*, *postureB*, *k* )

Method. Sets the posture of a *figure* to be a lerp blend of *postureA* and
*postureB* based on coefficient *k*&isin;[0,1].

### figure.***bodypart***

Body part properties. The *bodypart* is the name of a body part, one of these:
* Central body parts: **torso**, **head**, **chest**, **waist**
* Left leg: **l_leg**, **l_thigh**, **l_knee**, **l_shin**, **l_ankle**, **l_foot**
* Right leg: **r_leg**, **r_thigh**, **r_knee**, **r_shin**, **r_ankle**, **r_foot**
* Left arm: **l_arm**, **l_elbow**, **l_forearm**, **l_wrist**
* Right arm: **r_arm**, **r_elbow**, **r_forearm**, **r_wrist**
* Left fingers: **l_thumb**, **l_index**, **l_middle**, **l_ring**, **l_pinky**
* Right fingers: **r_thumb**, **r_index**, **r_middle**, **r_ring**, **r_pinky**
* Left middle phalanges: **l_index_mid**, **l_middle_mid**, **l_ring_mid**, **l_pinky_mid**
* Right middle phalanges: **r_index_mid**, **r_middle_mid**, **r_ring_mid**, **r_pinky_mid**
* Left tip phalanges: **l_thumb_tip**, **l_index_tip**, **l_middle_tip**, **l_ring_tip**, **l_pinky_tip**
* Right tip phalanges: **r_thumb_tip**, **r_index_tip**, **r_middle_tip**, **r_ring_tip**, **r_pinky_tip**



## Body parts

Each body part has the same set of properties, although some are deactivated.
For example, a knee can rotate around X axis and partly around Z axis.

### figure.bodypart.**x**

Numeric property. Gets or sets the rotation angle in degrees around the X
"shoulder" axis.

### figure.bodypart.**y**

Numeric property. Gets or sets the rotation angle in degrees around the Y
"head" axis.

### figure.bodypart.**z**

Numeric property. Gets or sets the rotation angle in degrees around the Z
"chest" axis.

### figure.bodypart.**attach**(*object*)

Method. Attaches 3D *object* to a body part. Object's position and
orientation are relative to the body part.



## Functions

### **setAnimationLoop**(callback)<br>callback(*time*)

Function. Sets animation function called once every frame. The *callback*
function receives the time in miliseconds.

### **random**( )<br>**random**( *min*, *max* )

Function. Generates uniformly distributed random number in interval [*min*,*max*).
By default the optional parameters are *min*=-1 and *max*=1.

### **regular**( *time* )<br>**regular**( *time*, *offset* )<br>**regular**( *time*, *offset*, *min*, *max* )

Function. Generates an oscilating sine sequence of numbers in interval
[*min*,*max*]. By default the optional parameters are *offset*=0, *min*=-1 and
*max*=1. Parameter *offset* shifts the oscillation forward or backward in time.

### **chaotic**( *time* )<br>**chaotic**( *time*, *offset* )<br>**chaotic**( *time*, *offset*, *min*, *max* )

Function. Generates a chaotic oscilating sequence of numbers in interval
[*min*,*max*]. By default the optional parameters are *offset*=0, *min*=-1 and
*max*=1. Internally uses a simplex noise function. Parameter *offset* shifts the
sequence across the time, i.e. two generators with different offsets produce
different sequences.



## Events

### window.addEventListener('**animate**',callback)

Global animate event. Triggered once on every frame.

### figure.addEventListener('**animate**',callback)

Local animate event. Triggered once on every frame for each figure.

### event.**time**

Animate event property. Time in miliseconds in global and local animate events.

### event.**target**

Animate event property. Figure for which a local animate event is triggered.




## Variables

### **everybody**

Global array. Contains all created figures. Usually used to traverse them and do
some operation on all figures.



<div class="footnote">
	<a href="../">Home</a> &middot;
	<a href="https://github.com/boytchev/disfigure">GitHub</a> &middot; 
	<a href="https://www.npmjs.com/package/disfigure">Legacy NPM</a>
</div>