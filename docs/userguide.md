<img class="logo" src="../assets/logo/logo.min.png">


# Disfigure: User Guide



<!--## <small><small>Този документ е наличен и на [български език](userguide-bg.md).</small></small>-->



[**Figures**](#figures) <small>([creating](#creating-a-figure) &middot; [anatomy](#anatomy-of-a-figure) &middot; [posture](#figure-posture) &middot; [accessories](#figure-accessories))</small> [**Motions**](#motions) <small>([figure](#figure-motion) &middot; [animation](#figure-animation)  &middot; [generators](#number-generators) )</small> [**Using**](#using-disfigure) <small>([world](#provisional-world) &middot; [CDN](#using-with-cdn))</small>



# Figures

**Disfigure** is a simple library for animating human figures.



## Creating a figure

A figure is created as an instance of `Man`, `Woman` and `Child` with an optional
parameter for *height* in meters. The default heights are 1.80 for men, 1.70 for
women and 1.35 for children.


```js
var man = new Man( );
var woman = new Woman( 1.75 );
var child = new Child( 1 );
```

Live examples: [figure types](../examples/figure-type.html) and [custom heights](../examples/figure-height.html):

[<img src="../examples/snapshots/figure-type.jpg" width="48%" border="1">](../examples/figure-type.html) [<img src="../examples/snapshots/figure-height.jpg" width="48%" border="1">](../examples/figure-height.html)



## Anatomy of a figure

All figures have the same body structure with names for each body part that can
be manipulated. 

The central body parts are `torso`, `head`, `chest` and `waist`. Arms are `arm`,
`elbow`,`forearm` and `wrist`. Legs are `leg`, `thigh`, `knee`, `shin`, `ankle`
and `foot`. Hand fingers are `thumb`, `index`, `middle`, `ring` and `pinky`.

The names of symmetrical body parts have prefixes `l_` for left
and `r_` for right. Leftness and rightness is always in respect to the figure
itself. Fingers phalanges are named after the fingers but with suffixes `_mid`
and `_tip` (*note: thumbs have no middle phalanges*).

```js
figure.head        // head
figure.r_knee      // knee of right leg
figure.l_index     // index finger of left hand
figure.l_index_tip // tip phalange of index finger of left hand
```

Live examples: [body parts](../examples/figure-parts.html) and [fingers with phalanges](../examples/figure-fingers.html):

[<img src="../examples/snapshots/figure-parts.jpg" width="48%" border="1">](../examples/figure-parts.html) 
[<img src="../examples/snapshots/figure-fingers.jpg" width="48%" border="1">](../examples/figure-fingers.html) 



## Figure posture

The `posture` property of a figure describes the rotations of all body parts.
It contains version number of an array of rotation angles. The `posture` property
can be used to push a posture to a figure. A read-only property `postureString` retrieves the posture as a string.

``` javascript
figure.posture = {version:9, angles:[[-15,44,10],[5,82,-24],...]};
figure.posture = anotherFigure.posture;

var str = figure.postureString;
```

A posture could be defined as a blend of other postures. Method `blend` mixes
two postures with a blending coefficient. When the coefficient is 0 the result
is the first posture, when it is 1 the result is the second and when it is between
0 and 1 the result is a posture between both postures.

``` javascript
figure.blend( initialPosture, finalPosture, 0.5 );
```

Live examples: [posture data](../examples/figure-posture.html) and [posture blending](../examples/figure-blend.html):

[<img src="../examples/snapshots/figure-posture.jpg" width="48%" border="1">](../examples/figure-posture.html) 
[<img src="../examples/snapshots/figure-blend.jpg" width="48%" border="1">](../examples/figure-blend.html) 



## Figure accessories

Accessories are Three.js objects attached to a specific body part. They do not
deform, but move as if attached to the body. The accessory own *position* and
*rotation* properties are in respect to the origin of the hosting body part.

``` javascript
figure.l_arm.attach(object);
```

Live examples: [attach one accessory](../examples/figure-accessory.html) and [many acccessories](../examples/figure-accessor.html):

[<img src="../examples/snapshots/figure-accessory.jpg" width="48%" border="1">](../examples/figure-accessory.html) 
[<img src="../examples/snapshots/figure-accessories.jpg" width="48%" border="1">](../examples/figure-accessories.html) 



# Motions

The motion of a figure is done by manipulating properties of the figure or its
body parts.


## Figure position

The position of the figure within the 3D is controlled by its
`.position` property with subproperties `.x`, `.y` and `.z`. Technically, the
position is [`Vector3`](https://threejs.org/docs/#Vector3) object.

``` javascript
figure.position.set( 1, 0, 0.5 );
figure.position.y = -0.1;
```

Live examples: [figure position](../examples/figure-position.html) and [figure motion](../examples/figure-motion.html):

[<img src="../examples/snapshots/figure-position.jpg" width="48%" border="1">](../examples/figure-position.html) 
[<img src="../examples/snapshots/figure-motion.jpg" width="48%" border="1">](../examples/figure-motion.html) 


## Figure motion

Each figure has three main axes:

* X axis: (aka shoulder axis) horizontal left-right direction
* Y axis: (aka head axis) vertical top-bottom direction
* Z axis: (aka chest axis) horizontal front-back direction

Body parts have properties `.x`, `.y` and `.z` which define the rotation around
the corresponding axes. Angles of rotations are in degrees.

#### Central body

The central body contains body parts in the middle of the figure &ndash; `head`,
`chest`, `waist` and the `torso`. They have no left and right variants. The motions of central body parts follow the same axes of rotations.

* positive X direction is bending forward, negative is backward
* positive Y direction is turning left, negative is right
* positive Z direction is tilting left, negitive is right

``` javascript
figure.head.x = 40;
figure.chest.z = 10;
figure.waist.z = -30;
```

Live examples: [axes of rotations](../examples/motion-axes.html) and [motion of head, chest and waist](../examples/motion-torso.html):

[<img src="../examples/snapshots/motion-axes.jpg" width="48%" border="1">](../examples/motion-axes.html) 
[<img src="../examples/snapshots/motion-torso.jpg" width="48%" border="1">](../examples/motion-torso.html) 

#### Legs and arms

A leg is made of `leg`, `thigh`, `knee`, `shin`, `ankle` and `foot`. An arm is
made of `arm`, `elbow`, `forearm` and `wrist`. These body parts are left and
right and the rotation around Y and Z axes is symmetrical and horizontally
flipped as if mirrored. Note that some motions might look counterintuitive when
two or three rotation are applied on the same body part. This is due to rotations
being non-commutative.

``` javascript
figure.l_knee.x = 40;
figure.r_ankle.x = 10;
figure.l_elbow.y = 45;
figure.r_wrist.z = -20;
```

Live examples: [motion of legs](../examples/motion-legs.html) and [motion of arms](../examples/motion-arms.html):

[<img src="../examples/snapshots/motion-legs.jpg" width="48%" border="1">](../examples/motion-legs.html) 
[<img src="../examples/snapshots/motion-arms.jpg" width="48%" border="1">](../examples/motion-arms.html) 

#### Fingers

Only hand fingers are presented as individual body parts. Fingers are `thumb`,
`index`, `middle`, `ring` and `pinky`. They are always used with prefixes `l_`
or `r_`. Fingers have phalanges which are identified with sufix `_mid` (for middle)
and `_tip` (for end) phalange. Note that the thumb has no middle phalange.

``` javascript
figure.l_thumb.x = 20;
figure.r_index.z = 45;
figure.r_index_mid.z = 30;
figure.r_index_tip.z = 15;
```

Live examples: [motion of fingers](../examples/motion-fingers.html) and [motion of phalanges](../examples/motion-phalanges.html):

[<img src="../examples/snapshots/motion-fingers.jpg" width="48%" border="1">](../examples/motion-fingers.html) 
[<img src="../examples/snapshots/motion-phalanges.jpg" width="48%" border="1">](../examples/motion-phalanges.html) 



## Figure animation

A default Disfigure world manages figure animation in two ways &ndash; via
animation loop or animation event. The function `setAnimationLoop` registers
a user-defined function that is called automatically each frame. The function
accepts a parameter `time` with the current time in milliseconds. 

```javascript
setAnimationLoop( animate );

function animate( time ) {
   
   // executed once per frame
   
}
```

Alternatively the `window` object may listen to `animate` events that are
generated every frame with property `event.time` holds the current time in
milliseconds. The `animate` event is also sent to individual figures and in this
case the figure itself is in `event.target`.

```javascript
window.addEventListener( 'animate', animate );

function animate ( event ) {

   var time = event.time;

   // executed once per frame
   
}

figure.addEventListener( 'animate', animate );

function animate ( event ) {

   var time = event.time,
       figure = event.target;

   // executed once per frame
   
}
```

Live examples: [animation loop](../examples/motion-loop.html) and [animation event](../examples/motion-event.html):

[<img src="../examples/snapshots/motion-loop.jpg" width="48%">](../examples/motion-loop.html)
[<img src="../examples/snapshots/motion-event.jpg" width="48%">](../examples/motion-event.html)



## Number generators

Disfiure provide three number generators &ndash; these are functions that
generate sequences of numbers used in animations. The `random` generator creates
uniformly distributed random numbers within interval. The `regular` generator
creates oscillation of values within interval. The `chaotic` generator combines
randomness and smoothness &ndash; it creates smoothe sequence of numbers that
gradually oscillate between randomly selected values in interval.

Random generator needs only interval, while regular and chaotic generators need
time, offset and interval.

```javascript
figure1.head.y = random( -30, 30 );
figure2.head.y = regular( time, 0, -30, 30 );
figure3.head.y = chaotic( time, 0, -30, 30 );
```

Live examples: [generators graphs](../examples/motion-generators-graphs.html) and [generators animations](../examples/motion-generators.html):

[<img src="../examples/snapshots/motion-generators-graphs.jpg" width="48%">](../examples/motion-generators-graphs.html)
[<img src="../examples/snapshots/motion-generators.jpg" width="48%">](../examples/motion-generators.html)





# Using Disfigure

## Provisional world

Disfigure provides a predefined default 3D world with all basic options,
like camera, lights, ground, user navigations and so on.

Options for the environment:

- *antialias* &ndash; boolean, if false, antialias is turned off (default is true)
- *ground* &ndash; boolean, if false, ground is not created (default is true)
- *lights* &ndash; boolean; if false, lights are not created (default is true)
- *shadows* &ndash; boolean, if false, shadows are not created (default is true)
- *controls* &ndash; boolean, if false, orbit controls is not created (default is true)
- *stats* &ndash; boolean, if true, stats panel is created (default is false)

Options for figure:

- *men* &ndash; number, allocated number of men figures (default is 3)
- *women* &ndash; number, allocated number of women figures (default is 3)
- *children* &ndash; number, allocated number of children figures (default is 3)
- *population* &ndash; number, allocated number of figures (may differ from men+women+children, default is 9)
- *smooth* &ndash; boolean, if false, render figures with low-quality but faster smoothing (default is true)
- *lowpoly* &ndash; number 0 to 1, reduction factor for figure complexity (default is 0, no reduction)

```js
new World( {ground: false, stats: true, men:100} );
```

If a provisional world instance is created, it adds global variables:

- *renderer* &ndash; WebGPU renderer
- *scene* &ndash; default scene for all figures
- *camera* &ndash; perspetive camera
- *light* &ndash; static directional light with shadows
- *cameraLight* &ndash; dynamic directional light

Depending on options initialing a world may also create:

- *ground* &ndash; ground for illusion of a solid surface
- *controls* &ndash; orbit controls for primary navigation
- *stats* &ndash; stats panel for performance monitoring

It is not compulsory to the a provisional world. A program may dafine its
custom Three.js world. In this case the figures should be added to the
scene via their *pool* property, and the animation loop must call *update*
method:

```js
var man = new Man( );

scene.add( man.pool );

function animationLoop( t ) {

	man.update();
	...
	renderer.render( scene, camera );
}
```


Live examples: [variation of default world](../examples/world-custom.html) and [customized world](../examples/world-custom.html):

[<img src="../examples/snapshots/world-default.jpg" width="48%">](../examples/world-default.html)
[<img src="../examples/snapshots/world-custom.jpg" width="48%">](../examples/world-custom.html)


## Using with CDN

The **mannequin.js** library is provided as a set of JavaScript modules. It is
intended to be used from a CDN. Most likely the library can be installed via
`npm`, however this is not tested so far.

The library uses Three.js and expects the following import maps to be defined:

* `three`: pointer to the Three.js built called `three.module.js` 
* `three/addons/`: pointer to the path of Three.js addons
* `mannequin`: pointer to the main library file called `mannequin.js`

The following subsections demonstrate some possible configuration scenarios of
using mannequin.js.


### Running from a CDN

[Content Delivery Network (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network). 
serves as a host of the library files. At the time of writing this document
it is recommended to use [jsDelivr](https://cdn.jsdelivr.net) as CDN. Other
CDNs are also available.

The main advantages of using a CDN are:

* there is no need to install disfigure.js
* there is no need to install nodes.js or another JS module manager
* there is no need to install a local web server
* a user file can be directly run in a browser

The main disadvantages of using a CDN are:

* internet access to the CDN is required at program startup
* pointers to three.js and disfigure.js must be defined as importmaps

<!--
A somewhat minimal program that uses mannequin.js from this CDN is shown
in this [see it](example-minimal-cdn.html). If the file is downloaded, it
could be run locally without any additional installation. The importmaps in the
example point to specific release of Three.js and to the latest version of mannequin.js.

```html
<!DOCTYPE html>

<html>

<head>
   <script type="importmap">
   {
      "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
         "mannequin": "https://cdn.jsdelivr.net/npm/mannequin-js@latest/src/mannequin.js"
      }
   }
   </script>
</head>

<body>
   <script type="module">
      import { createStage, Male } from "mannequin";
      createStage( );
      new Male();
   </script>
</body>
</html>
```

Note that many of the examples in this document use the script `importmap.js`
to generate the import maps and inject them in the page. This is done solely
for maintaining shorter code and to easily switch to other versions of either
Three.js or mannequin.js.
-->





<div class="footnote">
	<a href="../">Home</a> &middot;
	<a href="https://github.com/boytchev/disfigure">GitHub</a> &middot; 
	<a href="https://www.npmjs.com/package/disfigure">Legacy NPM</a>
</div>