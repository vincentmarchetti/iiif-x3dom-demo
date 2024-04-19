import { fetchManifestFromUrl , getManifestFromText } from "./main.js";


document
  .querySelector("button#load-manifest-from-url")
  .addEventListener("click", async () => {
    const manifestUrl = document.querySelector("input#manifest-url").value;
    var manifest = await fetchManifestFromUrl(manifestUrl);
    fireNewManifestEvent( manifest );
    //console.log("fetchManifestFromUrl result label " + manifest.getLabel() )
  });

document
  .querySelector("button#load-manifest-from-text")
  .addEventListener("click",  () => {
    const manifestText = document.querySelector("textarea#manifest-text").value;
    var manifest = getManifestFromText(manifestText);
    fireNewManifestEvent( manifest );
    //console.log("getManifestFromText result label " + manifest.getLabel().getValue() )
  });

document
  .querySelector("select#manifest-select")
  .addEventListener("change", async (event) => {
    const manifestUrl = event.target.value;
    document.querySelector("input#manifest-url").value = manifestUrl;
    var manifest = await fetchManifestFromUrl(manifestUrl);
    fireNewManifestEvent( manifest );
    //console.log("select then fetchManifestFromUrl result label " + manifest.getLabel().getValue() )
  });

document.addEventListener("viewer_ready", async (event) => {
    console.log("viewer_ready event fired" );
    const manifestUrl = document.querySelector("select#manifest-select").value;
    document.querySelector("input#manifest-url").value = manifestUrl;
    var manifest = await fetchManifestFromUrl(manifestUrl);
    fireNewManifestEvent( manifest );
  });
  
  
function fireNewManifestEvent( newManifest ){
    console.log("firing new_manifest");
    var toFire = new CustomEvent("new_manifest", { detail : {manifest : newManifest }});
    document.dispatchEvent( toFire );
}
