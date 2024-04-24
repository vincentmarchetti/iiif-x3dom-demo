

import * as chai from 'chai';
let expect = chai.expect;

import {Vector3, MathUtils} from "threejs-math";

const {mathx3d} = await import("../src/mathx3d.js");

const x_axis = new Vector3(1.0,0.0,0.0);
const y_axis = new Vector3(0.0,1.0,0.0);
const z_axis = new Vector3(0.0,0.0,1.0);


describe('mathx3d rotation functions', function() {

    /*
    Following test demonstates the conversion back  and forth
    between the quaternion representation of a rotation and the
    axis-angle representation closely related to how x3d represents
    rotation and orientation.
    */
    it('test y rotation', function () {
        var test_axis = new Vector3(0,1,0);
        var test_angle = 45.0;
        var polar_axis = test_axis.clone().multiplyScalar(test_angle);
        
        var test_transform = {x:polar_axis.x, y:polar_axis.y}
        var Q = mathx3d.quaternionFromRotateTransform(test_transform);
        
        var [axis, angle] = mathx3d.axisAngleFromQuaternion(Q);
        
        var axis_error = test_axis.clone().sub(axis).length();
        var angle_error = Math.abs( test_angle - MathUtils.radToDeg(angle));
        expect(axis_error).to.be.below(1.0e-8);
        expect(angle_error).to.be.below(1.0e-8);
    });

    /*
    Following test verifies that a iiif transform mockup representing
    a ccw of 90 degrees about the x axis can be turned into a quaternion,
    that then serves to rotate a y-axis vector onto the x-axis as an active
    transformation.
    */
    it('test application of a rotation', function(){
        let test_tranform = {isRotateTransform:true , x:+90.0 };
        let quat = mathx3d.quaternionFromRotateTransform(test_tranform);
        
        let test_result = y_axis.clone().applyQuaternion(quat);
        let exact_result = z_axis.clone();
        expect( test_result.clone().sub(exact_result).length() ).to.be.below(1.0e-8);
    });
    
    /*
    This test verifies the composition of iiif rotations.
    The draft 3D spec asserts that an array of transforms should be composed
    as active transformations, first apply the 0th element to a vector, then the 1th
    element, ...
    
    the test_array defined is interpreted:
    rotate CCW 90 degrees about the fixed global x axis
    then rotate CCW 90 degrees about the fixed global y axis
    then rotate CW 90 degrees about the fixed global x axis
    
    Literal handwaving yields that this sequence is equivalent to
    a CW rotation of 90 degrees about the fixed global z axis
    */
    it('test sequence of rotations', function() {
        let test_array = [
            {isRotateTransform:true , x:+90.0 },
            {isRotateTransform:true , y:+90.0 },
            {isRotateTransform:true , x:-90.0 }
        ];
        let exact_result = mathx3d.quaternionFromRotateTransform(
            {isRotateTransform:true, z:-90.0 });
        
        let test_result = mathx3d.quaternionFromRotateTransformArray( test_array );
        
        /*
        the diff_quat is the rotation obtained by first doing the inverse of the 
        exact_result, then appying the test_result. We use the axis-angle 
        representation to show that the diff_quat is very close to identity,
        only a small net-rotation attributable to round-off error
        */
        
        let diff_quat = test_result.clone().multiply( exact_result.clone().invert() );
        var [axis, angle] = mathx3d.axisAngleFromQuaternion(diff_quat);
        expect( Math.abs(angle)).to.be.below(1.0e-8);
        
    });
});
