import { fetchManifestFromUrl } from "./main.js";




 


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