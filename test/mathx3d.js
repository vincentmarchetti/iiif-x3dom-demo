

import * as chai from 'chai';
let expect = chai.expect;

import {Vector3, MathUtils} from "threejs-math";

const {mathx3d} = await import("../src/mathx3d.js");

describe('mathx3d rotation functions', function() {
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
});
