
## Custom colors

Disfigure supports a painting interface to draw simple shapes
directly onto the skin of a figure.

### figure.**dress**( *clothing* )

This function defines the dressing of a figure. The description
of the *clothing* is an array of range and material functions.
The range function selects a portion of the body skin, called *slice*,
and the material function applies a material to it. The structure of
the clothing is:

```javascript
[
   material,            // default material
   
   slice_1, material_1, // optional materials
   slice_2, material_2,
   ...
   slice_N, material_N
]
```

The *material* is the mandatory default material for the whole
figure. The next optional slice-material pairs define slices
and materials for each slice &ndash; [see it](../examples/extras-clothes-uniform.html).

``` javascript
figure.dress([

   Happy.velour( 'black' ),

   Happy.slice( 1.1, 2, {angle: -20} ),
   Happy.velour( 'red' ),

   Happy.slice( 1.15, 2, {angle: 35} ),
   Happy.velour( 'red' ),
   ...
];
```
[<img src="../examples/snapshots/extras-clothes-uniform.jpg" width="48%">](../examples/extras-clothes-uniform.html)



### **velour**( *color* )<br>**latex**( *color* )

The functions *velour* and *latex* define matte material &ndash;
[see it](../examples/extras-clothes-velour.html) and shiny
material &ndash; [see it](../examples/extras-clothes-latex.html)
The *color* is either a [Three.js color](https://threejs.org/docs/#api/en/math/Color)
or a [HTML/CSS color name](https://www.w3schools.com/colors/colors_names.asp).

``` javascript
velour( 'green' )
latex( 'red' )
```
[<img src="../examples/snapshots/extras-clothes-velour.jpg" width="48%">](../examples/extras-clothes-velour.html)
[<img src="../examples/snapshots/extras-clothes-latex.jpg" width="48%">](../examples/extras-clothes-latex.html)

### **bands**( *material_1*, *material_2*, *width*, *options* )

The *bands* function makes a composite material of alternating horizontal
bands of *material_1* and *material_2*. The *width* of each band
is defined in meters.  The optional *options* parameter provides additional properties
for the band &ndash; [see it](../examples/extras-clothes-bands.html).
Adequate blurring the bands may improve the visual appearance of the bands,
especially when they are too close or too far.

Polar bands revolve around a vertical axis. They are more suitable for
vertical bands that go around a body part &ndash; [see it](../examples/extras-clothes-bands-polar.html).

* **balance** &ndash; the relative weight of the two materials from -1 to 1; 0 means they are equally balanced
* **blur** &ndash; the blurrness of the bands' edges from 0 to 1; 0 is no blur, 1 is maximal blur
* **angle** &ndash; the rotation of bands in degrees, from -360 to 360; 0 is horizontal bands, 90 is vertical bands
* **polar** &ndash; bands are around a central vertical axis, *angle* is not used and *width* represents portions of a full circle of one band, i.e. 1/10 is 10 bands
* **x** &ndash; the x-coordinate of a central vertical axis, used only for polar bands
* **z** &ndash; the z-coordinate of a central vertical axis, used only for polar bands

```javascript
Happy.bands(
   Happy.latex( 'crimson' ),
   Happy.velour( 'azure' ),
   0.015, { balance: 0.9, blur: 0.2, angle: 90 }
)
```

[<img src="../examples/snapshots/extras-clothes-bands.jpg" width="48%">](../examples/extras-clothes-bands.html)
[<img src="../examples/snapshots/extras-clothes-bands-polar.jpg" width="48%">](../examples/extras-clothes-bands-polar.html)

### **slice**( *from*, *to*, *options* )

The *slice* function defines a slice of a figure &ndash; this is a part
of the figure that is dressed in given material. Parameters *from* and *to*
define the start and the end of the slice, measure in meters. By default,
a slice is horizontal, thus *from* and *to* denote distance from the ground.
The optional *options* parameter provides additional properties
for the slice like their orientation &ndash; [see it](../examples/extras-clothes-slice.html),
their rotation &ndash; [see it](../examples/extras-clothes-slice-angle.html).

* **side** &ndash; if true, the slice is vertical across the front-back of a figure
* **front** &ndash; if true, the slice is vertical across the left-right of a figure 
* **angle** &ndash; the rotation of the slice in degrees around one axis, from -360 to 360
* **sideAngle** &ndash; the rotation of the slice in degrees around another axis, from -360 to 360
* **symmetry** &ndash; if true, the slice is symmetrical, i.e. [-to,-from] and [from,to]

```javascript
Happy.slice( -0.07, 0.03, {front: true} )
Happy.slice( 0.70, 1.40, {angle:55} )
```

[<img src="../examples/snapshots/extras-clothes-slice.jpg" width="48%">](../examples/extras-clothes-slice.html)
[<img src="../examples/snapshots/extras-clothes-slice-angle.jpg" width="48%">](../examples/extras-clothes-slice-angle.html)


Additionally, slices could be curved as a wave when a non-zero
*wave* option is provided &ndash; [see it](../examples/extras-clothes-slice-wave.html)

* **wave** &ndash; height of the weight in meters
* **width** &ndash; width of a single wave in meters, this defines how sparse or dense is the wave
* **sharpness** &ndash; defines how sharp are the edges of the wave, 0 is for sharp, 1 is for sinusoidal, intermediate values, as well as less than 0 or greater than 1 are also accepted

```javascript
Happy.slice( 1.3, 2, {wave:0.15, width:0.1, sharpness:1} )
```
			
[<img src="../examples/snapshots/extras-clothes-slice-wave.jpg" width="48%">](../examples/extras-clothes-slice-wave.html)

### slice(...).**and**( *slice* )<br>slice(...).**or**( *slice* )

Slices can be combined into more complex shapes by intersecting or uniting them.
The function `and` intersects two slices, e.g. *slice_1.and(slice_2)* generates
a slice containing all points both in *slide_1* **and** in *slide_2*, while `or`
unites two slices, e.g. *slice_1.or(slice_2)* generates a slice containing all
points either in *slide_1* **or** in *slide_2*  &ndash;
[see it](../examples/extras-clothes-slice-and-or.html)

```javascript
Happy.slice( -0.1, 1.1, {angle:45, wave: 0.3, width:0.02} )
   .and( Happy.slice( -0.3, 0.9, {angle:-45, wave: 0.3, width:0.02} ) )
   .or( Happy.slice( -0.2, 0.2 ) ),

```

[<img src="../examples/snapshots/extras-clothes-slice-and-or.jpg" width="48%">](../examples/extras-clothes-slice-and-or.html)
