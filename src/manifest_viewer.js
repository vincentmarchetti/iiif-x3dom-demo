

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
    }
    
    /*
    the entry point for adding a general annotation (model, camera, or light)
    to the appropriate list data-member of this instanceof
    Has no return value
    
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
        

        var addHandler = ( (base) => {
            if (base.isLight) return this.addLight;
            if (base.isModel) return this.addModel;
            throw new Error("unidentified body base resource");
        })( bodyObj.base );
        
        addHandler(bodyObj, targetObj);        
    }
    
    addModel( bodyObj, targetObj ){
    
    }
}

