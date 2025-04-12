const manifesto = require("@iiif/3d-manifesto-dev/dist-commonjs/");


/*
    returns an object satisfying the IManifestOptions inteface
    It is declared as a function with plan that in future development
    it will be populated based in user input elements
*/
function getRequestedManifestOptions(){
    var retVal = {
        'locale'       : "en"
    }
    return retVal;
}

export async function fetchManifestFromUrl(manifestUrl) {
  
    var response = await fetch(manifestUrl);
    if (response.ok){
        var manifestDoc = await response.text();
    }
    else{
        throw new Error("network fetch of manifest failed");
    }
    
    try{
        var manifestObj = JSON.parse( manifestDoc);
    }
    catch(exc)
    {
        console.log("err " + exc);
        console.log(manifestDoc);
    }
    var options = getRequestedManifestOptions();
    var retVal = new manifesto.Manifest(manifestObj, options)
    console.log("manifest parsed into Manifesto object");
    // prepare the pretty text
    // reference https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    var prettyText = JSON.stringify( manifestObj, undefined, 2);
    document.querySelector("textarea#manifest-text").value = prettyText;

    return retVal;
}


export function getManifestFromText(manifestDoc) {
    var manifestObj = JSON.parse( manifestDoc);
    var options = getRequestedManifestOptions();
    return new manifesto.Manifest(manifestObj, options)
}


