import { Vector3, MathUtils , Euler, Quaternion } from "threejs-math";
const manifesto = require("manifesto-3d/dist-commonjs/");


/*
collection of utilities that perform geometry based calculation
to bridge the gap between IIIF 3D Presentation API and the X3D standard

use if made of threejs-math library
https://www.npmjs.com/package/threejs-math
https://github.com/ros2jsguy/threejs-math
API documentation: https://ros2jsguy.github.io/threejs-math/index.html
*/

export const mathx3d = {
/*
    argument transform has:
    1. optional properties "x","y","z" which if defined are numeric
       and interpreted as rotations in degrees ccw about X,Y,Z axes respectively
       
    Developer Note Apr 18 2024: Pending more complete specification of the
    RotateTransfrom in the 3D API, at this revision only one axis may be non-zero.
    
    Returns a Quaternion instance
*/
quaternionFromRotateTransform( transform ){
    if (! transform.isRotateTransform )
        throw new Error("invalid transform to quaternionFromRotateTransform");
        
    var euler = manifesto.eulerFromRotateTransform( transform );
        
    var retVal = new Quaternion().setFromEuler( euler );
    
    return retVal;
},

/*
array elements are manifesto RotateTransform instances, or a mockup which
must have a true value for a "isRotateTransform" property and
must have x,y,z numeric properties. At this revision the limit that only
one of the x,y,z components can be non-zero is enforced.

Note that quaternion multiplication in not-commutative. The choice of the
premultiply function to combine rotations supports the IIIF convention as to
the interpretation of arrays of RotateTranforms:
element 0 is applied to a Vector
then element 1 is applied to the result... 
*/
quaternionFromRotateTransformArray( transformArray ){
    let accum = new Quaternion();
    transformArray.forEach( ( transform ) => {
        if (!transform.isRotateTransform )
            throw new Error("invalid transform to quaternionFromRotateTransformArray");
        let nquat = mathx3d.quaternionFromRotateTransform( transform );
        //console.log("this " + Object.keys(this));
        accum.premultiply( nquat );
    });
    return accum;
},

/*
returns 2, array of a Vector3 axis and angle of rotation in radians
*/
axisAngleFromQuaternion( quat ){
    var vec = new Vector3(quat.x, quat.y, quat.z);
    var vlen = vec.length();
    var angle = 2.0 * Math.atan2( vlen, quat.w);
    
    if (angle == 0.0) return { axis : new Vector3(1.0,0.0,0.0) , angle:0.0 };
    else return { axis : vec.divideScalar( vlen ), angle : angle };
}
}