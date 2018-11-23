function exportDocument(){
    for(var i = 0;i < app.activeDocument.layers.length;i++){
        alert(app.activeDocument.layers[i].kind);
    }
}
