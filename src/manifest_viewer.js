

/* 
script level: define structure and event handlers to determine when
both the window load event has been fired and the x3dom ready event
 */



let _pre_init_state = {   
    x3dom:false, 
    document:false
};


x3dom.runtime.ready = function(element) {
    console.log("x3dom.ready fired");
    _pre_init_state.x3dom = true;
    if ( _pre_init_state.x3dom && _pre_init_state.document ){
        initialize_viewer();
    } 
};

window.addEventListener("load" , (event) => {
    console.log("document load fired");
    _pre_init_state.document = true;
    if ( _pre_init_state.x3dom && _pre_init_state.document ) initialize_viewer();
});

let manifestViewer = null;


initialize_viewer = function () {
    console.log("initialize_viewer called");
    
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
        
        
        
        
        background_node : document.getElementById("x3d-background"),
        defaultBackgroundColor : { red:128, green:128, blue:128},
        
        /*
            colorObject has properties red, greem, blue, each in integer
            in range [0, 256)
            
            side effect of setting the X3D scene background color
        */
        set BackgroundColor( colorObject ){
            // result of following: rgbString a string of 3 float numbers delimited by spaces
            // each  number in range [0.0,1.0]
            var rgbString = [
    	        Math.max(0.0,Math.min(1.0, colorObject.red/255)),
    	        Math.max(0.0,Math.min(1.0, colorObject.green/255)),
    	        Math.max(0.0,Math.min(1.0, colorObject.blue/255)),
    	    ].join(" ");
    	    console.log("setting color to " + rgbString);
    	    this.background_node.setAttribute("skyColor", rgbString);
        },
        
        annotation_container : document.getElementById("annotation_container"),
        clearAnnotationContent(){
            while( annotation_container.firstChild )
                annotation_container.removeChild( annotation_container.lastChild);
        },
        
        handleNewManifest( event ){
            console.log('in handleNewManifest ' + Object.keys( event ));
            console.log('more in handleNewManifest ' + Object.keys( event.detail ));
            if (event?.detail?.manifest){
                var manifest = event?.detail?.manifest;
                console.log("call to handleNewManifest " + manifest.getLabel().getValue());
                
                manifestViewer.clearAnnotationContent();
                
                var scene = manifest.getSequences()[0].getScenes()[0];
    	        
    	        manifestViewer.BackgroundColor = scene.getBackgroundColor() ?? manifestViewer.defaultBackgroundColor;
    	        
    	        var annotations = scene.getContent();
    	        console.log(`prepare to render ${annotations.length} annotations`);
    	        
    	        let ann = new SceneAnnotations(scene);
    	        
    	        for (let model of ann.models){
    	            console.log(`adding ${model.label} to scene`);
    	            manifestViewer.annotation_container.appendChild(model.x3dnode);
    	        }
            }
        }
        
        
        

    };
    
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
        var body   = anno.getBody()[0];
        var target = anno.getTarget();
        
        var bodyObj =   (body.isSpecificResource)?
                            {base:body.getSource(), wrapper:body}:
                            {base:body            , wrapper:null};
                            
        var targetObj = (target.isSpecificResource)?
                            {base:target.getSource(), wrapper: target}:
                            {base:target            , wrapper: null};
        
        var label = anno.getLabel()?.getValue();
        let that = this;
        /*
        var addHandler = ( (base) => {
            if (base.isLight) return that.addLight;
            if (base.isModel) return that.addModel;
            throw new Error("unidentified body base resource");
        })( bodyObj.base );
        */
        this.addModel(bodyObj, targetObj, label);        
    }
    
    /*
    Handle case where the annotation is a model represented in
    the X3D secengraph by a Inline X3D node, enclosed in X3D Transform
    nodes for proper placement
    */
    addModel( bodyObj, targetObj , label=null){
        
        label  = label ?? `model ${this.models.length + 1}`;
    
        var inlineNode = document.createElement('inline');
        inlineNode.setAttribute('url', bodyObj.base.id);
        
        // x3dtransform will be list of X3D Transform nodes need to
        // perform the function of iiif transforms in the SpecificResource
        // of the body and the PointSelector of the target resources
        var x3dtransforms = [];
        
        if ( bodyObj.wrapper &&
             bodyObj.wrapper.isSpecificResource &&
             bodyObj.wrapper.transform){
             // rem: bodyObj.wrapper.transform is a array of IIIF transform resources
             x3dtransforms.concat(bodyObj.wrapper.transform.map( this.IIIFTransformToX3DTransform));
        }
        
        if (targetObj.wrapper?.isSpecificResource &&
            targetObj.wrapper.getSelector()?.isPointSelector ){
            var selector = targetObj.wrapper.getSelector();
            x3dtransforms.concat( this.IIIFPointSelectorTOX3dTransform(selector));
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
    
    /*
    * @param iiiftranform : instance of manifesto.Transform class
    * returns: The equivalent X3D node in the form of a DOMElement with tag "transform"
    */
    IIIFTransformToX3DTransform( iiiftrans ){
        var retVal = document.createElement('transform');
         if (iiiftrans.isTranslateTransform ){
	        var tdata = iiiftrans.getTranslation();
	        retVal.setAttribute("translation", `${tdata.x} ${tdata.y} ${tdata.z}`);
        }
        else if (iiiftrans.isScaleTransform ){
            var sdata = iiiftrans.getScale();
            retVal.setAttribute( "scale",`${sdata.x} ${sdata.y} ${sdata.z}`);
        }
        else if (iiiftrans.isRotateTransform ){
            var quat = mathx3d.quaternionFromRotateTransform(iiiftrans);
            [polar, angle ] = mathx3d.axisAngleFromQuaternion(quat);
            retval.setAttribute('rotation',
                                `${polar.x} ${polar.y} ${polar.z} ${angle}`);
        }
        else{
            console.log("error: unknown transform type");
        }
        return retVal;
    }
    
    IIIFPointSelectorTOX3dTransform( selector ){
        var retVal = document.createElement('transform');
        if (selector.isPointSelector){
            var loc = selector.getLocation();
		    retVal.setAttribute("translation", `${loc.x} ${loc.y} ${loc.z}`);
        }
        return retVal;
    }
}
