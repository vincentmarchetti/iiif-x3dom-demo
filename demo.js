const {mathx3d} = await import("./src/mathx3d.js");


var test_transform = {x:0, y:45}

var Q = mathx3d.quaternionFromRotateTransform(test_transform);

var [axis, angle] = mathx3d.axisAngleFromQuaternion(Q);

console.log(`result : axis ${[axis.x, axis.y,axis.z]}  angle ${angle}`);

