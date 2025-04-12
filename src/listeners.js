import { fetchManifestFromUrl , getManifestFromText } from "./main.js";



document
  .querySelector("button#load-manifest-from-text")
  .addEventListener("click",  () => {
    const manifestText = document.querySelector("textarea#manifest-text").value;
    var manifest = getManifestFromText(manifestText);
    fireNewManifestEvent( manifest );
    //console.log("getManifestFromText result label " + manifest.getLabel().getValue() )
  });

 

document.addEventListener("load_text_from_url", async (event) =>
{
    var manifestUrl = event.detail.url;
    console.log("in load_text_from_url " + manifestUrl);
    await fetchManifestFromUrl(manifestUrl);
});

function fireNewManifestEvent( newManifest ){
    console.log("firing new_manifest");
    var toFire = new CustomEvent("new_manifest", { detail : {manifest : newManifest }});
    document.dispatchEvent( toFire );
}
