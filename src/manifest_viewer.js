import { Vector3,  Quaternion } from "threejs-math";
import {mathx3d}                from "./mathx3d.js";
import {stringx3d}                from "./stringx3d.js";
import { Vector3, MathUtils , Euler, Quaternion } from "threejs-math";
const manifesto = require("manifesto.js/dist-commonjs/");
/* 
script level: define structure and event handlers to determine when
both the window load event has been fired and the x3dom ready event
 */



let _pre_init_state = {   
    x3dom:false, 
    document:false
};


x3dom.runtime.ready = function(element) {
    //console.log("x3dom.ready fired");
    _pre_init_state.x3dom = true;
    if ( _pre_init_state.x3dom && _pre_init_state.document ){
        initialize_viewer();
    } 
};

window.addEventListener("load" , (event) => {
    //console.log("document load fired");
    _pre_init_state.document = true;
    if ( _pre_init_state.x3dom && _pre_init_state.document ) initialize_viewer();
});

let manifestViewer = null;


initialize_viewer = function () {
    //console.log("initialize_viewer called");
    
    manifestViewer = {
        triad_switch_node : document.getElementById("triad-switch-node"),
        axes_description  : document.getElementById("axes-description"),
        
        set AxesVisible( value ){ // value a boolean
            var newChoice = (value)? 0 : -1;
            this.triad_switch_node.setAttribute("whichChoice", newChoice );
            this.axes_description.style.display =(value)?"block":"none";
        },
        
        navigationinfo_node   : document.getElementById("navigationinfo-node"),
        headlight_description : document.getElementById("headlight-description"),
        set HeadlightOn( value ){ // value is a boolean
            var newBool = (value)?"true":"false";
            this.navigationinfo_node.setAttribute("headlight", newBool);
            this.headlight_description.style.display =(value)?"block":"none";
        },
        
        
        default_viewpoint : document.getElementById("default-viewpoint"),
        default_viewpoint_values : {
            "position" : null,
            "orientation" : null,
            "centerOfRotation" : null
        },
        storeDefaultViewpoint(){
            for (key of Object.keys( manifestViewer.default_viewpoint_values)){
                manifestViewer.default_viewpoint_values[key] = 
                    manifestViewer.default_viewpoint.getAttribute(key);
            }
            console.log("default viewpoint " + JSON.stringify(manifestViewer.default_viewpoint_values));
        },
        restoreDefaultViewpoint(){
            for (key of Object.keys( manifestViewer.default_viewpoint_values)){
                let val = manifestViewer.default_viewpoint_values[key];
                if ( val != null )
                    manifestViewer.default_viewpoint.setAttribute(key, val);
            }
        },
        
        background_node : document.getElementById("x3d-background"),
        defaultBackgroundColor : { red:204, green:204, blue:204},
        
        /*
            rgb has properties red, greem, blue, each in integer
            in range [0, 256)
            
            side effect of setting the X3D scene background color
        */
        set BackgroundColor( rgb ){                        
    	    this.background_node.setAttribute("skyColor", stringx3d.makeSFColor(rgb));
        },
        
        annotation_container : document.getElementById("annotation_container"),
        clearAnnotationContent(){
            while( annotation_container.firstChild )
                annotation_container.removeChild( annotation_container.lastChild);
        },
        
        handleNewManifest( event ){
            
            if (event?.detail?.manifest){
                var manifest = event?.detail?.manifest;
                
                
                manifestViewer.clearAnnotationContent();
                manifestViewer.restoreDefaultViewpoint();
                
                var scene = manifest.getSequences()[0].getScenes()[0];
    	        
    	        manifestViewer.BackgroundColor = scene.getBackgroundColor() ?? manifestViewer.defaultBackgroundColor;
    	        
    	        var annotations = scene.getContent();
    	        
    	        
    	        let ann = new SceneAnnotations(scene);
    	        
    	        for (let model of ann.models){
    	            console.log(`adding ${model.label} to scene`);
    	            manifestViewer.annotation_container.appendChild(model.x3dnode);
    	        }
    	        
                for (let light of ann.lights){
    	            console.log(`adding ${light.label} to scene`);
    	            manifestViewer.annotation_container.appendChild(light.x3dnode);
    	        }
    	        console.log( manifestViewer.annotation_container.innerHTML);
            }
        }
        
        
        

    };
    
    manifestViewer.storeDefaultViewpoint();
    
    let show_axes_checkbox = document.getElementById("show-axes-checkbox");
    show_axes_checkbox.checked = true;
    show_axes_checkbox.addEventListener("click", (event) => 
    {
        manifestViewer.AxesVisible = show_axes_checkbox?.checked ;
    });
    
    let headlight_on_checkbox = document.getElementById("headlight-on-checkbox");
    headlight_on_checkbox.checked = true;
    headlight_on_checkbox.addEventListener("click", (event) => 
    {
        manifestViewer.HeadlightOn = headlight_on_checkbox?.checked;
    });
    
    document.addEventListener( "new_manifest", manifestViewer.handleNewManifest);
    
    var event = new Event("viewer_ready");
    document.dispatchEvent(event);
};

class SceneAnnotations {
    constructor( scene ){
        this.models= [];
        this.lights = [];
        this.cameras = [];
        
        this.scene = scene;
        // create and retain  the array of all annotations
        this.annotations = scene.getContent();
        let that = this;
        this.annotations.forEach( (item) => {that.addAnnotation(item);} );
    }
    
    /*
    the entry point for adding a general annotation (model, camera, or light)
    to the appropriate list data-member of this instanceof
    Has no return value
    
    will put an object with members label and x3dnode on the appropriate list
    
    anno is an instance of the Annotation class as defined in manifesto.js module
    */
    addAnnotation( anno ){    
        const body   = anno.getBody()[0];
        const target = anno.getTarget();
        
        let bodyObj =   (body.isSpecificResource)?
                            {base:body.getSource(), wrapper:body}:
                            {base:body            , wrapper:null};
                            
        let targetObj = (target.isSpecificResource)?
                            {base:target.getSource(), wrapper: target}:
                            {base:target            , wrapper: null};
                            
        
        
        var label = anno.getLabel()?.getValue();
        //let that = this;
        
        console.log("isModel? " + bodyObj.base.isModel);
        let addHandler = ( (base) => {
            if (base.isLight) return this.addLight.bind(this);
            if (base.isModel) return this.addModel.bind(this);
            if (base.isCamera) return this.addCamera.bind(this);
            throw new Error("unidentified body base resource");
        })( bodyObj.base );
        
        addHandler(bodyObj, targetObj, label);        
    }
    
    /*
    Handle case where the annotation is a model represented in
    the X3D secengraph by a Inline X3D node, enclosed in X3D Transform
    nodes for proper placement
    */
    addModel( bodyObj, targetObj , label=null){
        
        label  = label ?? `model ${this.models.length + 1}`;
        console.log("enter addModel with " + label);
        let inlineNode = document.createElement('inline');
        inlineNode.setAttribute('url', bodyObj.base.id);
        
        // x3dtransform will be list of X3D Transform nodes need to
        // perform the function of iiif transforms in the SpecificResource
        // of the body and the PointSelector of the target resources
        var x3dtransforms = [];
        
        if ( bodyObj.wrapper?.isSpecificResource ){
             var transforms = x3dtransforms.concat(bodyObj.wrapper.getTransform());
             let x3dt = transforms.map( this.IIIFTransformToX3DTransform );             
             x3dtransforms = x3dtransforms.concat(x3dt);             
        }
        
        if (targetObj.wrapper?.isSpecificResource &&
            targetObj.wrapper.getSelector()?.isPointSelector ){
            var selector = targetObj.wrapper.getSelector();
            x3dtransforms =  x3dtransforms.concat( this.IIIFPointSelectorToX3dTransform(selector));
        }
        
        if ( x3dtransforms.length > 0){
            x3dtransforms[0].appendChild(inlineNode);
            for ( var i = 1; i < x3dtransforms.length; ++i)
                x3dtransforms[i].appendChild( x3dtransforms[i-1]);
            this.models.push( {label : label , x3dnode : x3dtransforms.at(-1)});
        }
        else
            this.models.push( {label : label , x3dnode : inlineNode});
    }
    
    addLight( bodyObj, targetObj, label = null){
    
        label  = label ?? `light ${this.models.length + 1}`;
        console.log("enter addLight with " + label);
        let lightNode = null;
        let iiifLight = bodyObj.base;

        let light_direction = new Vector3(0.0,-1.0,0.0);
        
        if (bodyObj.wrapper?.isSpecificResource){
            let transform = bodyObj.wrapper.getTransform();
            if (transform){
                // assume transform is entirely RotateTransform instances
                let quat = mathx3d.quaternionFromRotateTransformArray( transform);
                light_direction.applyQuaternion( quat );
                console.log("light direction " + stringx3d.makeSFVec3f(light_direction));
            }
        }
        
        if (iiifLight.isAmbientLight){
            lightNode = document.createElement('pointlight');
            lightNode.setAttribute("intensity", "0.0");
            lightNode.setAttribute("ambientIntensity", iiifLight.getIntensity().toString() );                    
        }
        else{
            if (iiifLight.isDirectionalLight){
                lightNode = document.createElement('directionallight');
                                
            }  
            else{
                console.log("unknown light " + iiifLight.getType());
            } 
            lightNode.setAttribute("direction", stringx3d.makeSFVec3f(light_direction));  
            lightNode.setAttribute("intensity", iiifLight.getIntensity().toString() );  
            lightNode.setAttribute("ambientIntensity", "0.0" ); 
        }
        var light_color = iiifLight.getColor();
        var rgbAttr = stringx3d.makeSFColor( light_color );
        lightNode.setAttribute("color", rgbAttr);
        lightNode.setAttribute("global", "true");       

        this.lights.push( {label : label , x3dnode : lightNode});
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
    addCamera( bodyObj, targetObj, label = null){
    
        label  = label ?? `camera ${this.cameras.length + 1}`;
        console.log("enter addCamera with " + label);
        
        let camera = bodyObj.base; // just convenient alias
        
        /* determine a camera orientation from two possible ways
        * first, the existence of a non-empty transform array in the
        * specific resource
        */
        var transformArray = bodyObj.wrapper?.getTransform();
        if ( transformArray && transformArray.length > 0 ){
            throw new Error("Camera orientation determined by transform is not implemented");
        }
        
        // lookedAtAnno is an annotation that the camera is "looking at"
        let lookedAtAnno = this.scene.getAnnotationById( 
                            camera.LookAt?.id );
        if ( lookedAtAnno ){
            console.log("camera is looking at " + lookedAtAnno.id );
        }
        else{
            console.log("cannot determine where camera is looking!");
        }
        
        let atPoint = lookedAtAnno.LookAtLocation;
        
        let fromPoint = (targetObj.wrapper?.getSelector()?.isPointSelector)?
                        targetObj.wrapper.getSelector().getLocation():
                        new threejs_math.Vector3(0.0,0.0,0.0);
                        
        // warning: direction not normalized to unitlength
        let direction = atPoint.clone().sub(fromPoint);
        console.log("look direction" + [direction.x, direction.y, direction.z].join(" "));
        let euler = manifesto.cameraRelativeRotation( direction );
        let quat = new Quaternion().setFromEuler( euler );
        let axisAngle = mathx3d.axisAngleFromQuaternion(quat);
        let attrSFRotation = stringx3d.makeSFRotation(axisAngle);
        console.log("evaluated SFRotation " + attrSFRotation);
        
        let viewpoint = manifestViewer.default_viewpoint;
        viewpoint.setAttribute("orientation", attrSFRotation);
        viewpoint.setAttribute("position", stringx3d.makeSFVec3f(fromPoint));
        viewpoint.setAttribute("centerOfRotation", stringx3d.makeSFVec3f(atPoint));
        viewpoint.setAttribute("fieldOfView", MathUtils.degToRad( camera.FieldOfView) );
        console.log( viewpoint.outerHTML);
    }
    /*
    * @param iiiftranform : instance of manifesto.Transform class
    * returns: The equivalent X3D node in the form of a DOMElement with tag "transform"
    */
    IIIFTransformToX3DTransform( iiiftrans ){
        var retVal = document.createElement('transform');
         if (iiiftrans.isTranslateTransform ){
	        var tdata = iiiftrans.getTranslation();
	        retVal.setAttribute("translation", stringx3d.makeSFVec3f( tdata ));
        }
        else if (iiiftrans.isScaleTransform ){
            var sdata = iiiftrans.getScale();
            retVal.setAttribute( "scale",stringx3d.makeSFVec3f( sdata ));
        }
        else if (iiiftrans.isRotateTransform ){
            var quat = mathx3d.quaternionFromRotateTransform(iiiftrans);
            let axis_angle = MathUtils.axisAngleFromQuaternion(quat);
            retVal.setAttribute('rotation', stringx3d.makeSFRotation( axis_angle ));
        }
        else{
            console.log("error: unknown transform type");
        }
        return retVal;
    }
    
    IIIFPointSelectorToX3dTransform( selector ){
        var retVal = document.createElement('transform');
        if (selector.isPointSelector){
            let loc = selector.getLocation();
		    retVal.setAttribute("translation", stringx3d.makeSFVec3f( loc ));
        }
        return retVal;
    }
}

