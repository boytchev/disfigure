<img class="logo" src="../assets/logo/logo.min.png">


# Disfigure: API Reference



**A:**&nbsp;[addEventListener](#windowaddeventlisteneranimatecallback)
[and](#slice_1and-slice_2-)
[animate](#windowaddeventlisteneranimatecallback)
[ankle](#figurebodypart)
[arm](#figurebodypart)
[attach](#figurebodypartattachobject)
**B:**&nbsp;[bands](#bands-material_1-material_2-width-options-)
[blend](#figureblend--posturea-postureb-k-)
**C:**&nbsp;[chaotic](#chaotic-time-chaotic-time-offset-chaotic-time-offset-min-max-)
[chest](#figurebodypart)
[Child](#new-child-new-child-height-)
**D:**&nbsp;[dress](#figuredress-clothing-)
**E:**&nbsp;[elbow](#figurebodypart)
[everybody](#everybody)
**F:**&nbsp;[foot](#figurebodypart)
[forearm](#figurebodypart)
**H:**&nbsp;[head](#figurebodypart)
**I:**&nbsp;[index](#figurebodypart)
**K:**&nbsp;[knee](#figurebodypart)
**L:**&nbsp;[latex](#latex-color-)
[leg](#figurebodypart)
[lockTo](#figurebodypartlockto-globalx-globaly-globalz-localx-localy-localz-)
**M:**&nbsp;[Man](#new-man-new-man-height-)
[middle](#figurebodypart)
**O:**&nbsp;[or](#slice_1or-slice_2-)
**P:**&nbsp;[pinky](#figurebodypart)
[pointAt](#figurebodypartpointat-localx-localy-localz-)
[position](#figureposition)
[postureString](#figureposturestring)
[posture](#figureposture)
**R:**&nbsp;[random](#random-random-min-max-)
[regular](#regular-time-regular-time-offset-regular-time-offset-min-max-)
[ring](#figurebodypart)
**S:**&nbsp;[setAnimationLoop](#setanimationloopcallbackcallbacktime)
[shin](#figurebodypart)
[slice](#slice-from-to-options-)
**T:**&nbsp;[target](#eventtarget)
[thigh](#figurebodypart)
[thumb](#figurebodypart)
[time](#eventtime)
[torso](#figurebodypart)
**V:**&nbsp;[velour](#velour-color-)
**W:**&nbsp;[waist](#figurebodypart)
[Woman](#new-woman-new-woman-height-)
[wrist](#figurebodypart)
**X:**&nbsp;[x](#figurebodypartx)
**Y:**&nbsp;[y](#figurebodyparty)
**Z:**&nbsp;[z](#figurebodypartz)




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

### figure.**dress**( *clothing* )

Method. Defines the dressing of a figure. The description of the *clothing* is
an array of range and material functions:
*[ defaultMaterial, slice_1, material_1, ... slice_N, material_N]*. Slices are
function that select  portion of the figure and materials are clothing materials.


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

### figure.bodypart.**pointAt**( *localX*, *localY*, *localZ* )

Method. Calculates the global coordinate of point with local point
*( localX, localY, localZ )* on a body part.

### figure.bodypart.**lockTo**( *globalX*, *globalY*, *globalZ*, *localX*, *localY*, *localZ* )

Method. Moves a figure so that local point *(localX, localY, localZ)* on
a body part is at global point *(globalX, globalY, globalZ)*. If the local point
is not provided, then the body part origin *(0,0,0)* is used instead.



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




## Clothing

### **velour**( *color* )

Clothing function. Defines velour (matte) clothing material using Three.js *color*.

### **latex**( *color* )

Clothing function. Defines latex (shiny) clothing material using Three.js *color*.

### **bands**( *material_1*, *material_2*, *width*, *options* )

Clothing function. Makes a composite material of alternating horizontal bands of
*material_1* and *material_2*. The *width* of each band is defined in meters. 
The optional *options* parameter provides additional properties for the band.

* **balance** &ndash; the relative weight of the two materials from -1 to 1; 0 means they are equally balanced
* **blur** &ndash; the blurrness of the bands' edges from 0 to 1; 0 is no blur, 1 is maximal blur
* **angle** &ndash; the rotation of bands in degrees, from -360 to 360; 0 is horizontal bands, 90 is vertical bands
* **polar** &ndash; bands are around a central vertical axis, *angle* is not used and *width* represents portions of a full circle of one band, i.e. 1/10 is 10 bands
* **x** &ndash; the x-coordinate of a central vertical axis, used only for polar bands
* **z** &ndash; the z-coordinate of a central vertical axis, used only for polar bands

### **slice**( *from*, *to*, *options* )

Clothing function. Defines a slice of a figure to be dressed in given material.
Parameters *from* and *to* define the start and the end of the slice, measured
in meters. The optional *options* parameter provides additional properties
for the slice.

* **side** &ndash; if true, the slice is vertical across the front-back of a figure
* **front** &ndash; if true, the slice is vertical across the left-right of a figure 
* **angle** &ndash; the rotation of the slice in degrees around one axis, from -360 to 360
* **sideAngle** &ndash; the rotation of the slice in degrees around another axis, from -360 to 360
* **symmetry** &ndash; if true, the slice is symmetrical, i.e. [-to,-from] and [from,to]

Additionally, slices could be curved as a wave when a non-zero *wave* option is provided.

* **wave** &ndash; height of the weight in meters
* **width** &ndash; width of a single wave in meters, this defines how sparse or dense is the wave
* **sharpness** &ndash; defines how sharp are the edges of the wave, 0 is for sharp, 1 is for sinusoidal, intermediate values, as well as less than 0 or greater than 1 are also accepted


### slice_1.**and**( *slice_2* )

Clothing chained method. Combines slices into more complex shapes by
intersecting them. The result slice contains points common for both *slide_1*
and *slide_2*.



### slice_1(...).**or**( *slice_2* )

Clothing chained method. Combines slices into more complex shapes by
uniting them. The result slice contains points from any of the slides.



<div class="footnote">
	<a href="../">Home</a> &middot;
	<a href="https://github.com/boytchev/disfigure">GitHub</a> &middot; 
	<a href="https://www.npmjs.com/package/disfigure">Legacy NPM</a>
</div>