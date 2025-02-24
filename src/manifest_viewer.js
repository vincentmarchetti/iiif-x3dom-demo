import { Vector3, Quaternion, Euler, MathUtils } from "threejs-math";
import { mathx3d } from "./mathx3d.js";
import { stringx3d } from "./stringx3d.js";
//import { Vector3, MathUtils, Euler, Quaternion } from "threejs-math";
const manifesto = require("manifesto-3d/dist-commonjs/");
/* 
script level: define structure and event handlers to determine when
both the window load event has been fired and the x3dom ready event
 */

let _pre_init_state = {
  x3dom: false,
  document: false,
};

x3dom.runtime.ready = function (element) {
  //console.log("x3dom.ready fired");
  _pre_init_state.x3dom = true;
  if (_pre_init_state.x3dom && _pre_init_state.document) {
    initialize_viewer();
  }
};



let manifestViewer = null;

let initialize_viewer = function () {
  console.log("initialize_viewer called");

  manifestViewer = {
    triad_switch_node: document.getElementById("triad-switch-node"),
    axes_description: document.getElementById("axes-description"),

    set AxesVisible(value) {
      // value a boolean
      var newChoice = value ? 0 : -1;
      this.triad_switch_node.setAttribute("whichChoice", newChoice);
      this.axes_description.style.display = value ? "block" : "none";
    },

    navigationinfo_node: document.getElementById("navigationinfo-node"),
    headlight_description: document.getElementById("headlight-description"),
    set HeadlightOn(value) {
      // value is a boolean
      var newBool = value ? "true" : "false";
      this.navigationinfo_node.setAttribute("headlight", newBool);
      this.headlight_description.style.display = value ? "block" : "none";
    },

    default_viewpoint: document.getElementById("default-viewpoint"),
    iiif_perspective_viewpoint: document.getElementById("iiif-perspective-viewpoint"),
    iiif_orthographic_viewpoint: document.getElementById("iiif-orthographic-viewpoint"),
    
    default_viewpoint_values: {
      position: null,
      orientation: null,
      centerOfRotation: null,
    },
    storeDefaultViewpoint() {
      for (var key of Object.keys(manifestViewer.default_viewpoint_values)) {
        manifestViewer.default_viewpoint_values[key] =
          manifestViewer.default_viewpoint.getAttribute(key);
      }
      console.log(
        "default viewpoint " +
          JSON.stringify(manifestViewer.default_viewpoint_values),
      );
    },
    restoreDefaultViewpoint() {
      for (var key of Object.keys(manifestViewer.default_viewpoint_values)) {
        let val = manifestViewer.default_viewpoint_values[key];
        if (val != null)
          manifestViewer.default_viewpoint.setAttribute(key, val);
      }
      manifestViewer.default_viewpoint.setAttribute("set_bind","true");
    },
    
    
    setProxyCamera( proxyCamera ){
        console.log("enter setProxyCamera( proxyCamera )");
        var cameraNode = proxyCamera.x3dnode;
        console.log("setting node " + cameraNode.getAttribute("id") );
        
        for (const [key, value] of Object.entries(proxyCamera.fields)) {
            console.log(`setting field ${key} to ${value}`);
            cameraNode.setAttribute(key, value );
        }
        console.log("set 'set_bind' to true on " + cameraNode.getAttribute("id") );
        cameraNode.setAttribute("set_bind", "true");
    },
    
    

    background_node: document.getElementById("x3d-background"),
    defaultBackgroundColor: { red: 204, green: 204, blue: 204 },

    /*
            rgb has properties red, greem, blue, each in integer
            in range [0, 256)
            
            side effect of setting the X3D scene background color
        */
    set BackgroundColor(rgb) {
      this.background_node.setAttribute("skyColor", stringx3d.makeSFColor(rgb));
    },

    annotation_container: document.getElementById("annotation_container"),
    clearAnnotationContent() {
      while (annotation_container.firstChild)
        annotation_container.removeChild(annotation_container.lastChild);
    },

    handleNewManifest(event) {
      if (event?.detail?.manifest) {
        var manifest = event?.detail?.manifest;

        manifestViewer.clearAnnotationContent();
        manifestViewer.restoreDefaultViewpoint();

        var scene = manifest.getSequences()[0].getScenes()[0];

        manifestViewer.BackgroundColor =
          scene.getBackgroundColor() ?? manifestViewer.defaultBackgroundColor;

        var annotations = scene.getContent();

        let ann = new SceneAnnotations(scene);

        /*
        for (let camera of ann.cameras) {
            console.log(`adding ${camera.label} to scene`);
            camera.x3dnode.setAttribute("id", "new-viewpoint");
            manifestViewer.annotation_container.appendChild(camera.x3dnode);
            
        }
        */

        for (let model of ann.models) {
          console.log(`adding ${model.label} to scene`);
          manifestViewer.annotation_container.appendChild(model.x3dnode);
        }

        for (let light of ann.lights) {
          console.log(`adding ${light.label} to scene`);
          manifestViewer.annotation_container.appendChild(light.x3dnode);
        }
        console.log(manifestViewer.annotation_container.innerHTML);
        
        if (ann.cameras.length > 0){
            manifestViewer.setProxyCamera( ann.cameras[0]);
        }
        
        for (let text_annotation_value of ann.text_annotations){
            console.log(`adding ${text_annotation_value} to text annotation table`);
            manifestViewer.addTextAnnotationValue( text_annotation_value );
        }
        //manifestViewer.default_viewpoint.setAttribute('set_bind', 'false');
        //document.getElementById('alt-viewpoint').setAttribute('set_bind','true');
        //setTimeout( () =>
        //{
        //    console.log("binding iiif viewpoint 7");
        //    //document.getElementById('new-viewpoint').setAttribute('set_bind','true');
        //    var vp = document.getElementById('x3delem').runtime.nextView();
        //    console.log("viewpoint" + vp);
            
            //vp.setAttribute('set_bind', 'false');
           //document.getElementById('new-viewpoint').setAttribute('bind','true');
        //}, 10000);
        
        //ann.cameras[0].x3dnode.setAttribute("set_bind", "true");
      }
    },
    
    manifest_label_container : document.getElementById("manifest_label_container"),
    manifest_summary_container : document.getElementById("manifest_summary_container"),
    
    /*
    showDescriptiveProperties will display the descriptive properties,
    as explained in Presentation 3.0 API (Section 3.1) in the non-3D viewport
    of the web page
    */
    
    show_descriptive_properties(event) {
        console.log("enter : show_descriptive_properties");
        if (event?.detail?.manifest){
            let label = event?.detail?.manifest?.getLabel()?.getValue();
            console.log("Setting manifest label to: " + label );
            manifestViewer.manifest_label_container.innerHTML = label;
            
            if (event?.detail?.manifest?.getSummary){
                let summary = event.detail.manifest.getSummary().getValue();
                manifestViewer.manifest_summary_container.innerHTML = summary;
            }
            else{
                console.log("manifest.getSummary is not implemented");
            }
        };
    },
    
    text_annotations_container : document.getElementById("text-annotations-table") ,
    
    addTextAnnotationValue( value ){
        let rowNode = document.createElement("tr");
        manifestViewer.text_annotations_container.appendChild( rowNode );
        rowNode.innerHTML = value;
    },
    
    
  };

  manifestViewer.storeDefaultViewpoint();

  let show_axes_checkbox = document.getElementById("show-axes-checkbox");
  show_axes_checkbox.checked = false;
  show_axes_checkbox.addEventListener("click", (event) => {
    manifestViewer.AxesVisible = show_axes_checkbox?.checked;
  });

  let headlight_on_checkbox = document.getElementById("headlight-on-checkbox");
  headlight_on_checkbox.checked = true;
  headlight_on_checkbox.addEventListener("click", (event) => {
    manifestViewer.HeadlightOn = headlight_on_checkbox?.checked;
  });

  document.addEventListener("new_manifest", manifestViewer.handleNewManifest);
  document.addEventListener("new_manifest", manifestViewer.show_descriptive_properties);
  
  
  var event = new Event("viewer_ready");
  document.dispatchEvent(event);
};

window.addEventListener("load", (event) => {
  //console.log("document load fired");
  _pre_init_state.document = true;
  if (_pre_init_state.x3dom && _pre_init_state.document) initialize_viewer();
});

class SceneAnnotations {
  constructor(scene) {
    this.models = [];
    this.lights = [];
    this.cameras = [];
    this.text_annotations = [];

    this.scene = scene;
    // create and retain  the array of all annotations
    this.annotations = scene.getContent();
    let that = this;
    this.annotations.forEach((item) => {
      that.addAnnotation(item);
    });
  }

  /*
    the entry point for adding a general annotation (model, camera, or light)
    to the appropriate list data-member of this instanceof
    Has no return value
    
    will put an object with members label and x3dnode on the appropriate list
    
    anno is an instance of the Annotation class as defined in manifesto3d.js module
    */
  addAnnotation(anno) {
    const body = anno.getBody()[0];
    const target = anno.getTarget();

    let bodyObj = body.isSpecificResource()
      ? { base: body.getSource(), wrapper: body }
      : { base: body, wrapper: null };


    /*
    Developer Note 24 Feb 2025
    for the revised AnnotationBody class which is the subject of PR 27
    https://github.com/IIIF-Commons/manifesto-3d/pull/27
    isSpecificResource is defined as as function returning bool
    
    
    For the case of the target the test here has to accomodate the 
    threadbare object returned by JSONLDResource.getPropertyAsObject
    when the manifest just has an IRI for the target field.
    */
    let targetObj = ( target.isSpecificResource && 
        ( (typeof(target.isSpecificResource) == "function" && target.isSpecificResource())
        ||  target.isSpecificResource == true ))
      ? { base: target.getSource(), wrapper: target }
      : { base: target, wrapper: null };

    var label = anno.getLabel()?.getValue();
    //let that = this;

    console.log("bodyObj.base.getType() " + bodyObj.base.getType());
    try{
    let addHandler = ((base) => {
      var lowType = base.getType().toLowerCase();
      switch (lowType){
        case "ambientlight":
        case "directionallight":
        case "spotlight":
            return this.addLight.bind(this);
            break;
        case "model":
            return this.addModel.bind(this);
            break;
        case "perspectivecamera":
        case "orthographiccamera":
            return this.addCamera.bind(this);
            break;
        case "textualbody":
            return this.addTextualBody.bind(this);
            break;
        default:
            throw new Error("unidentified body base resource " + lowType);
      }
    })(bodyObj.base);

    addHandler(bodyObj, targetObj, label);
    }
    catch(err){
        console.error("exception " + err);
    }
  }

  /*
    Handle case where the annotation is a model represented in
    the X3D secengraph by a Inline X3D node, enclosed in X3D Transform
    nodes for proper placement
    */
  addModel(bodyObj, targetObj, label = null) {
    label = label ?? `model ${this.models.length + 1}`;
    console.log("enter addModel with " + label);
    let inlineNode = document.createElement("inline");
    inlineNode.setAttribute("url", bodyObj.base.id);

    // x3dtransform will be list of X3D Transform nodes need to
    // perform the function of iiif transforms in the SpecificResource
    // of the body and the PointSelector of the target resources
    var x3dtransforms = [];

    if (bodyObj.wrapper?.isSpecificResource) {
      var transforms = x3dtransforms.concat(bodyObj.wrapper.getTransform());
      let x3dt = transforms.map(this.IIIFTransformToX3DTransform);
      x3dtransforms = x3dtransforms.concat(x3dt);
    }

    if (
      targetObj.wrapper?.isSpecificResource &&
      targetObj.wrapper.Selector?.isPointSelector
    ) {
      var selector = targetObj.wrapper.Selector;
      x3dtransforms = x3dtransforms.concat(
        this.IIIFPointSelectorToX3dTransform(selector),
      );
    }

    if (x3dtransforms.length > 0) {
      x3dtransforms[0].appendChild(inlineNode);
      for (var i = 1; i < x3dtransforms.length; ++i)
        x3dtransforms[i].appendChild(x3dtransforms[i - 1]);
      this.models.push({ label: label, x3dnode: x3dtransforms.at(-1) });
    } else this.models.push({ label: label, x3dnode: inlineNode });
  }

  addLight(bodyObj, targetObj, label = null) {
    label = label ?? `light ${this.models.length + 1}`;
    console.log("enter addLight with " + label);
    let lightNode = null;
    let iiifLight = bodyObj.base;


    if (iiifLight.isAmbientLight) {
      lightNode = document.createElement("pointlight");
      lightNode.setAttribute("intensity", "0.0");
      lightNode.setAttribute(
        "ambientIntensity",
        iiifLight.getIntensity().toString(),
      );
    } else {
      // is a directional or spot light, requireing
      // both a position ("location" in X3D)
      // and a direction
      
      // position
      let lightLocation = targetObj.wrapper?.Selector?.isPointSelector
      ? targetObj.wrapper.Selector.Location
      : new Vector3(0.0, 0.0, 0.0);
      
      // a function which returns a direction vector if the body is a 
      // SpecificResource with RotateTransforms, otherwise returns a
      // undefined
      let direction_from_rotation = () => {
        if (bodyObj.wrapper?.isSpecificResource){
          let transform = bodyObj.wrapper.getTransform();
          if (transform) {
            // assume transform is entirely RotateTransform instances
            let quat = mathx3d.quaternionFromRotateTransformArray(transform);
            return new Vector3(0.0, 0.0, -1.0).applyQuaternion(quat); 
          }
        }
        return undefined;
      };
      
      // a function which returns a direction if the Light has a lookAt property
      // which is a PointSelector
      let direction_from_lookat = () => {
        if (iiifLight.LookAt?.isPointSelector){
          let lookAtLocation = iiifLight.LookAt.Location;
          return lookAtLocation?.clone().sub(lightLocation).normalize();
        }
        else return undefined;            
      };
      
      let light_direction = direction_from_rotation() ?? direction_from_lookat();
      console.log("light direction: " + (light_direction)?
                                        stringx3d.makeSFVec3f(light_direction):
                                        "undefined" );
      
    
      if (iiifLight.isDirectionalLight) {
        lightNode = document.createElement("directionallight");
      } 
      else if ( iiifLight.isSpotLight ){
        // spotlight has an angle and a location
        lightNode = document.createElement("spotlight");
        let angleInDegrees = MathUtils.degToRad(iiifLight.Angle );
        lightNode.setAttribute("cutOffAngle", angleInDegrees);
        lightNode.setAttribute("beamWidth", angleInDegrees);
        lightNode.setAttribute("location", stringx3d.makeSFVec3f(lightLocation));
      }
      else {
        console.log("unknown light " + iiifLight.getType());
      }
      lightNode.setAttribute(
        "direction",
        stringx3d.makeSFVec3f(light_direction),
      );
      lightNode.setAttribute("intensity", iiifLight.getIntensity().toString());
      lightNode.setAttribute("ambientIntensity", "0.0");
    }
    var light_color = iiifLight.getColor();
    var rgbAttr = stringx3d.makeSFColor(light_color);
    lightNode.setAttribute("color", rgbAttr);
    lightNode.setAttribute("global", "true");

    this.lights.push({ label: label, x3dnode: lightNode });
  }
  /*
   * this is an alpha implementation and it will work by modifying
   * the existing Viewpoint node in the model. As such, it only makes
   * sense if there is just one camera annotation
   *
   * that one viewpoint is manifestViewer.default_viewpoint
   * later work will need to develop the UI for switching between
   * multiple cameras.
   *
   */
  addCamera(bodyObj, targetObj, label = null) {
    label = label ?? `camera ${this.cameras.length + 1}`;
    console.log("enter addCamera with " + label);

    let camera = bodyObj.base; // just convenient alias

    // cameraPosition set to a Vector3 instance
    let cameraPosition = targetObj.wrapper?.Selector?.isPointSelector
      ? targetObj.wrapper.Selector.Location
      : new Vector3(0.0, 0.0, 0.0);
    /* determine a camera orientation from two possible ways
     * first, the existence of a non-empty transform array in the
     * specific resource
     * cameraOrientation will be set to a Quaternion instance that
     * represents the required rotations from the X3D default camera direction
     * pointing in the -z axis  direction
     */
     
    // each of the orientationFromXXXXX will return either 
    // Quaternion instance or the undefined type
    let orientationFromTransformArray = () => {
        if (bodyObj.wrapper?.isSpecificResource){
            let transform = bodyObj.wrapper.getTransform();
            if (transform) {
                // assume transform is entirely RotateTransform instances
                return mathx3d.quaternionFromRotateTransformArray(transform);
            }            
         }
         return undefined;
    }
    
    let orientationFromLookAt = () => {
        var lookFrom = cameraPosition;
        
        // there are two mechanisms to determine what the 
        // camera should be looking at
        // each of the atLocFrom will return either a Vector3
        // or an undefined type
        let atLocFromAnno = () => {
            let lookedAtAnno = this.scene.getAnnotationById(camera.LookAt?.id);
            return lookedAtAnno?.LookAtLocation;
        }
        
        let atLocFromPoint = () => {
            if (!(camera.LookAt?.isPointSelector) )  return undefined;
            return camera.LookAt?.Location;
        }
        
        let lookAt = atLocFromAnno() ?? atLocFromPoint();
        if (! lookAt ) return undefined;
        
        let direction = lookAt.clone().sub(lookFrom).normalize();
        let euler = manifesto.cameraRelativeRotation(direction);
        return new Quaternion().setFromEuler(euler);
    }
    
    
    let quat = orientationFromTransformArray() ?? orientationFromLookAt();
    console.log("camera orientation " + quat );
    

    // centerFromXXXX returns a Vector3 or undefined ; a position intended to
    // be the center of rotation of an X3D Viewpoint

    let centerFromTransformArray = () => {
        // at this point of development we have no way of 
        // determining a center of rotation just from the camera transform
        return null;
    }
    
    
    
    let centerFromLookAt = () => {
        
        // there are two mechanisms to determine what the 
        // camera should be looking at
        // each of the atLocFrom will return either a Vector3
        // or an undefined type
        
        let atLocFromAnno = () => {
            
            try{
                var lookedAtAnnoId = camera.LookAt?.id;
                let lookedAtAnno = ( lookedAtAnnoId )? this.scene.getAnnotationById(lookedAtAnnoId):null;
                return lookedAtAnno?.LookAtLocation;
            }
            catch(err){
                return null;    
            }
                        
        };
        
        let atLocFromPoint = () => {
            try{
                if (!(camera?.LookAt?.isPointSelector) )  return null;
                return camera?.LookAt?.Location ?? null;
            }
            catch(err){
                return null;
            }
            
        };
        
        return  atLocFromAnno() ?? atLocFromPoint();
        
    }

    var center =  centerFromLookAt() ;
    console.log("camera center " + center );
    
    
    let axisAngle = mathx3d.axisAngleFromQuaternion(quat);
    let attrSFRotation = stringx3d.makeSFRotation(axisAngle);
    console.log("evaluated SFRotation " + attrSFRotation);

    let viewpointProxyNode = {};
    
    if (camera.isPerspectiveCamera){
        viewpointProxyNode.x3dnode = manifestViewer.iiif_perspective_viewpoint;
        viewpointProxyNode.fields = {
           "fieldOfView" : MathUtils.degToRad(camera.FieldOfView) 
        }
    }
    else if (camera.isOrthographicCamera) {
        viewpointProxyNode.x3dnode = manifestViewer.iiif_orthographic_viewpoint;
        
        var half_height = camera.ViewHeight;
        
        viewpointProxyNode.fields = {
           "fieldOfView" : [-half_height, -half_height, +half_height, +half_height ].join(" ")
        }    
    }
    else{
        console.warn("unrecognized camera type");
        return;
    }
    
    viewpointProxyNode.fields["orientation"] =  attrSFRotation;
    viewpointProxyNode.fields["position"] = stringx3d.makeSFVec3f(cameraPosition);
    
    if (center)
        viewpointProxyNode.fields["centerOfRotation"] = stringx3d.makeSFVec3f(center);
    
    viewpointProxyNode.fields["description"] =  label ;
    
    console.log("loaded proxy camera: " + JSON.stringify(viewpointProxyNode.fields));
    this.cameras.push(viewpointProxyNode);
  }
  
  addTextualBody( bodyObj, targetObj, label = null )
  {
        if (bodyObj.base.isTextualBody )  {
            console.log("textual body: " + bodyObj.base.Value);
            this.text_annotations.push( bodyObj.base.Value );
        }
            
        else
            console.warn("unrecognized text resource");
  }
  /*
   * @param iiiftranform : instance of manifesto.Transform class
   * returns: The equivalent X3D node in the form of a DOMElement with tag "transform"
   */
  IIIFTransformToX3DTransform(iiiftrans) {
    var retVal = document.createElement("transform");
    if (iiiftrans.isTranslateTransform) {
      var tdata = iiiftrans.getTranslation();
      retVal.setAttribute("translation", stringx3d.makeSFVec3f(tdata));
    } else if (iiiftrans.isScaleTransform) {
      var sdata = iiiftrans.getScale();
      retVal.setAttribute("scale", stringx3d.makeSFVec3f(sdata));
    } else if (iiiftrans.isRotateTransform) {
      var quat = mathx3d.quaternionFromRotateTransform(iiiftrans);
      let axis_angle = mathx3d.axisAngleFromQuaternion(quat);
      retVal.setAttribute("rotation", stringx3d.makeSFRotation(axis_angle));
    } else {
      console.log("error: unknown transform type");
    }
    return retVal;
  }

  IIIFPointSelectorToX3dTransform(selector) {
    var retVal = document.createElement("transform");
    if (selector.isPointSelector) {
      let loc = selector.Location;
      retVal.setAttribute("translation", stringx3d.makeSFVec3f(loc));
    }
    return retVal;
  }
}
