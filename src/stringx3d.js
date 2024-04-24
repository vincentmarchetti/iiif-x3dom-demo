
/*
A collection of functions taking
or returning strings that are useful
in x3d/x3dom processing
*/

export const stringx3d = {
    /*
        rgb an object with red, green, blue properties,
        each of which is a integner in range [0,256)
        returns a string of form "0.012 1.000 0.000"
    */
    makeSFColor( rgb ){
        return [rgb.red, rgb.green, rgb.blue].map( (x) =>
        {
            return Math.max(0.0,Math.min(1.0, x/255)).toFixed(3)
        }).join(" ");    
    },
    
    /*
        returns the 4 floating point string as the
        XML attribute value for an SFRotation
        
        axis_angle an object with property axis that itself
        has x,y,z properties
        
        axis_angle has property angle that is the numeric
        angle in radians
    */
    makeSFRotation( axis_angle ){
        let axis = axis_angle.axis;
        return [axis.x, axis.y, axis.z, axis_angle.angle].join(" ");
    },
    
    /*
    xyz an object with x, y, z property
    */
    makeSFVec3f( xyz ){
        return [xyz.x, xyz.y, xyz.z].join(" ")
    }

}