

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
};
