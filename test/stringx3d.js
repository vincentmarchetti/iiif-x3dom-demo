import * as chai from 'chai';
let expect = chai.expect;


const {stringx3d} = await import("../src/stringx3d.js");

describe('stringx3d functions', function() {
    it('test colorFromRGB', function () {
        const test_rgb = {red:0 , green:153, blue:255 };
        const exact_result = "0.000 0.600 1.000";
        
        const test_result = stringx3d.colorFromRGB( test_rgb );
        expect( test_result ).to.equal( exact_result );
    });
});
