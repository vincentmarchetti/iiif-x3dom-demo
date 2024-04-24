
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
    colorFromRGB( rgb ){
    return [rgb.red, rgb.green, rgb.blue].map( (x) =>
    {
        return Math.max(0.0,Math.min(1.0, x/255)).toFixed(3)
    }).join(" ");
    
    }

}