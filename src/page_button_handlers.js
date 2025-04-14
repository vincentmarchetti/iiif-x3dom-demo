	function show_all()
    {
        var x3delem = document.getElementById('x3delem');
        if (x3delem)
            x3delem.runtime.showAll();
        else
            console.error("x3delem not located")
    }


    function load_from_url( manifestUrl){
        var evt = new CustomEvent("load_text_from_url", {"detail":{"url" : manifestUrl}});
        document.dispatchEvent( evt );
    }
