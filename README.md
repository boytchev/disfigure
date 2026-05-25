# disfigure

A library to rig 3D models &mdash; visit [**Disfigure** Home](https://boytchev.github.io/disfigure/index.html) for less details, but more demos.

[<img src="examples/snapshots/figure-parts.jpg" border="1">](examples/figure-parts.html)



### Technical notes

This is highly experimental work and is still in progress. There are several
things that make Disfigure different from the traditional Three.js rigging.

* Disfigure does not use skeletons, bones, joints, skinning or morphing.
Instead, it defines **fuzzy subspaces** around 50+ pivot points and uses TSL to
calculate the transformation inside the subspace.

* Disfigure avoids matrices and implements transformations via quaternions only.
Instead of calculating rotations at pivot points, it calculates individual
rotations for each vertex based on its position in the fuzzy subspaces.

* Disfigure fuses standalone meshes with instanced meshes. In this hybrid approach
one draw call renders bodies as instances, but each body has its own properties like
position and scale.


### Legacy notes

Initially Disfigure was written as a TSL wrapper over traditional skeleton
armature. This version of Disfigure is temporarily available here:
[Old **Disfigure** Home](https://boytchev.github.io/disfigure/legacy/index.html)
