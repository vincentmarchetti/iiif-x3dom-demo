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
  
    
    var urlObj = new URL(manifestUrl);
    console.log('parsed manifestUrl protocol ', urlObj.protocol )
    var manifestText;
    

    if (urlObj.protocol == "data:"){
        console.log("handle data url");
        manifestText=parseDataUri(manifestUrl);
    }
    else{
        var response = await fetch( encodeURI(manifestUrl));
        if (response.ok) manifestText = await response.text();
        else throw new Error("network fetch of manifest failed");
    }
    
    
    console.log("json result ", manifestText);
    
    var manifestObj = JSON.parse( manifestText);
    
    var options = getRequestedManifestOptions();
    var retVal = new manifesto.Manifest(manifestObj, options)
    console.log("manifest parsed into Manifesto object");
    // prepare the pretty text
    // reference https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    //var prettyText = JSON.stringify( manifestObj, undefined, 2);
    //document.querySelector("textarea#manifest-text").value = prettyText;

    return retVal;
}

function parseDataUri( dataUri ){
    const ix=dataUri.indexOf(",");
    if (ix >= 0){
        // TODO: insert identification of Mimetype , base64
        return decodeURIComponent( dataUri.substring(ix+1));
    }
}



