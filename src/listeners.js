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

document.addEventListener("viewer_ready", async (event) => {
  const searchPart = window.location.hash?.substring(1);
  console.log("searchPart " + searchPart )
  const searchparam = new URLSearchParams( searchPart );
  const manifest_url = searchparam.get("manifest");
  console.log("viewer_ready search result " + manifest_url );
  const manifest = await fetchManifestFromUrl(manifest_url);
  console.log("manifest retrieved" );
  fireNewManifestEvent( manifest );
});