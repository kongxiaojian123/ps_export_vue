var _assetsPath = '';
var vnodeObj = null;
var globalLight = null;
var regRule = new RegExp('\.(wrap|jpg)','g');
// exportDocument('','C:\\Users\\klvin\\Desktop');
function exportDocument(assetsPath){
    if(app.activeDocument.width.type==='%'){
        alert('Error: 文档所用单位不能为 "%"');
        return;
    }
    _assetsPath = assetsPath;
    vnodeObj = {
        structure:null,
        vnode:{},
    };
    var info = getInfo();
    info.width = info.bounds.right;
    info.height = info.bounds.bottom;
    vnodeObj.structure = mapVnode(info,null);
    parseVnode(vnodeObj.structure);
    return toJSON(vnodeObj);
}
function getInfo() {
    var info ;
    var docRef = new ActionReference();
    var desc = new ActionDescriptor();
    var JSONid = stringIDToTypeID("json");
    docRef.putProperty(charIDToTypeID('Prpr'), JSONid);
    docRef.putEnumerated(stringIDToTypeID("document"), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    desc.putReference(charIDToTypeID('null'), docRef);
    eval('info = ' + executeAction(charIDToTypeID( "getd" ), desc, DialogModes.NO).getString(JSONid));
    globalLight = info.globalLight.angle;
    return info;
}
function toJSON(object) {
    var json;
    if(object instanceof Array){
        json = '[';
        for(var i = 0;i<object.length;i++){
            if(typeof object[i] === 'object'){
                if(object[i]===null) json += 'null,';
                else json += toJSON(object[i]) + ',';
            }else{
                if(typeof object[i] === 'string') json += '"' + object[i] + '",';
                else json += object[i] + ',';
            }
        }
        json = json.replace(/,$/,'');
        json += ']';
    }else{
        json = '{';
        for(var attr in object){
            json +='"'+attr+'":';
            var item = object[attr];
            switch (typeof item) {
                case 'string':
                    json +='"'+item+'",';
                    break;
                case 'object':
                    if(item===null){
                        json += 'null,';
                    }else{
                        json += toJSON(item) + ',';
                    }
                    break;
                default:
                    json += item + ',';
            }
        }
        json = json.replace(/,$/,'');
        json +='}';
    }
    return json;
}
function selectLayerById(id){
    var ref = new ActionReference();
    ref.putIdentifier(stringIDToTypeID('layer'),id);
    var desc = new ActionDescriptor();
    desc.putReference(stringIDToTypeID("null"),ref);
    desc.putBoolean(stringIDToTypeID( "makeVisible" ),false);
    executeAction(stringIDToTypeID("select"), desc,DialogModes.NO);
}
function mapVnode(currentVnode, parentVnode) {
    if(parentVnode){
        updateBounds(currentVnode,parentVnode);
        rename(currentVnode);
    }
    var vnodeStructure = {
        parentID : parentVnode?parentVnode.id:null,
        vnodeID : currentVnode.id,
    };
    vnodeObj.vnode[currentVnode.id] = {
        name:currentVnode.name||'container',
        text:null,
        background:null,
        type:currentVnode.type||'root',
        bounds:{
            absolute:[currentVnode.bounds.left,currentVnode.bounds.top,currentVnode.bounds.right,currentVnode.bounds.bottom],
            relative:[0,0,0,0],
            width:currentVnode.bounds.right,
            height:currentVnode.bounds.bottom,
            center:[currentVnode.bounds.right/2,currentVnode.bounds.bottom/2],
            offset:[0,0],
        },
        style:{
            display:currentVnode.visible===false?'none':null,
            flex:null,
            flexWrap:currentVnode.name&&currentVnode.name.indexOf('.wrap')>=0?'wrap':null,
            flexDirection:null,
            alignSelf:null,
            alignItems:null,
            justifyContent:null,
            width:null,
            height:null,
            padding:null,
            margin:null,
            borderWidth:null,
            borderColor:null,
            borderRadius:null,
            backgroundColor:null,
            backgroundImage:null,
            fontSize:null,
            lineHeight:null,
            textAlign:null,
            whiteSpace:null,
            textWidth:null,
            textHeight:null,
            fontWeight:null,
            fontStyle:null,
            textDecoration:null,
            color:null,
            boxShadow:null,
        }
    };
    if(parentVnode){
        vnodeObj.vnode[currentVnode.id].bounds.relative = [currentVnode.boundsWithParent.left,currentVnode.boundsWithParent.top,currentVnode.boundsWithParent.right,currentVnode.boundsWithParent.bottom];
        vnodeObj.vnode[currentVnode.id].bounds.width = currentVnode.width;
        vnodeObj.vnode[currentVnode.id].bounds.height = currentVnode.height;
        vnodeObj.vnode[currentVnode.id].bounds.center = [currentVnode.centerX,currentVnode.centerY];
        vnodeObj.vnode[currentVnode.id].bounds.offset = [currentVnode.offsetX,currentVnode.offsetY];
    }
    updateStyle(currentVnode, parentVnode);
    if(currentVnode.layers){
        vnodeStructure.children = [];
        for(var i = 0;i<currentVnode.layers.length;i++){
            vnodeStructure.children.push(mapVnode(currentVnode.layers[i],currentVnode));
        }
        var lastChild = currentVnode.layers[currentVnode.layers.length-1];
        if(
            lastChild.boundsWithParent.left === 0&&
            lastChild.boundsWithParent.top === 0&&
            lastChild.boundsWithParent.right === 0&&
            lastChild.boundsWithParent.bottom === 0&&
            lastChild.type !== 'layerSection'
        ){
            vnodeStructure.children.pop();
            vnodeObj.vnode[currentVnode.id].background = lastChild.id;
        }
        if(vnodeStructure.children.length===1){
            if(currentVnode.layers[0].type === 'textLayer'){
                vnodeStructure.children.pop();
                vnodeObj.vnode[currentVnode.id].text = currentVnode.layers[0].id;
            }
        }
    }
    return vnodeStructure;
}
function parseVnode(currentVnode) {
    //解析padding margin
    if(currentVnode.children&&currentVnode.children.length){
        var vnode = vnodeObj.vnode[currentVnode.vnodeID];
        var padding = [vnode.bounds.width,vnode.bounds.height,vnode.bounds.width,vnode.bounds.height];
        for(var i = 0;i<currentVnode.children.length;i++){
            var _vnode = vnodeObj.vnode[currentVnode.children[i].vnodeID];
            if(_vnode.bounds.relative[1]<padding[0]) padding[0] = _vnode.bounds.relative[1];
            if(_vnode.bounds.relative[2]<padding[1]) padding[1] = _vnode.bounds.relative[2];
            if(_vnode.bounds.relative[3]<padding[2]) padding[2] = _vnode.bounds.relative[3];
            if(_vnode.bounds.relative[0]<padding[3]) padding[3] = _vnode.bounds.relative[0];
            parseVnode(currentVnode.children[i]);
        }
        if(vnode.style.flexDirection==='column'){
            padding[0] = 0;
            padding[1] = padding[3] = Math.min(padding[1],padding[3]);
        }else{
            padding[3] = 0;
            padding[0] = padding[2] = Math.min(padding[0],padding[2]);
        }
        if(padding[0]||padding[1]||padding[2]||padding[3]){
            vnode.style.padding = padding;
        }
        for(var i = 0;i<currentVnode.children.length;i++){
            var _vnode = vnodeObj.vnode[currentVnode.children[i].vnodeID];
            if(vnode.style.flexDirection==='column'){
                var paddingLeft = vnode.style.padding?vnode.style.padding[3]:0;
                var paddingRight = vnode.style.padding?vnode.style.padding[1]:0;
                var offsetLeft = _vnode.bounds.relative[0] - paddingLeft;
                var offsetRight = _vnode.bounds.relative[2] - paddingRight;
                if(offsetLeft-offsetRight>vnode.bounds.width*.1){
                    _vnode.style.alignSelf='flex-end';
                    _vnode.style.margin = [_vnode.bounds.offset[1],offsetRight,0,0];
                }else if(offsetLeft-offsetRight<-vnode.bounds.width*.1){
                    _vnode.style.alignSelf='flex-start';
                    _vnode.style.margin = [_vnode.bounds.offset[1],0,0,offsetLeft];
                }else{
                    var min = Math.min(offsetLeft,offsetRight);
                    _vnode.style.margin = [_vnode.bounds.offset[1],min,0,min];
                }
            }else{
                var paddingTop = vnode.style.padding?vnode.style.padding[0]:0;
                var paddingBottom = vnode.style.padding?vnode.style.padding[2]:0;
                var offsetTop = _vnode.bounds.relative[1] - paddingTop;
                var offsetBottom = _vnode.bounds.relative[3] - paddingBottom;
                if(offsetTop-offsetBottom>vnode.bounds.height*.25){
                    _vnode.style.alignSelf='flex-end';
                    _vnode.style.margin = [0,0,offsetBottom,_vnode.bounds.offset[0]];
                }else if(offsetTop-offsetBottom<-vnode.bounds.height*.25){
                    _vnode.style.alignSelf='flex-start';
                    _vnode.style.margin = [offsetTop,0,0,_vnode.bounds.offset[0]];
                }else{
                    var min = Math.min(offsetTop,offsetBottom);
                    _vnode.style.margin = [min,0,min,_vnode.bounds.offset[0]];
                }
            }
            if(
                _vnode.style.margin&&!(
                    _vnode.style.margin[0]||
                    _vnode.style.margin[1]||
                    _vnode.style.margin[2]||
                    _vnode.style.margin[3]
                )
            ){
                _vnode.style.margin = null;
            }
            setJustifyContent(currentVnode.children[i]);
        }
    }

}
function updateBounds(vnode,parentVnode) {
    selectLayerById(vnode.id);
    var activeLayer = app.activeDocument.activeLayer;
    vnode.bounds.left = activeLayer.boundsNoEffects[0].as("px");
    vnode.bounds.top = activeLayer.boundsNoEffects[1].as("px");
    vnode.bounds.right = activeLayer.boundsNoEffects[2].as("px");
    vnode.bounds.bottom = activeLayer.boundsNoEffects[3].as("px");
    vnode.width = vnode.bounds.right-vnode.bounds.left;
    vnode.height = vnode.bounds.bottom-vnode.bounds.top;
    vnode.boundsWithParent = {
        left:0,
        top:0,
        right:0,
        bottom:0
    };
    if(parentVnode){
        vnode.boundsWithParent.left = vnode.bounds.left - parentVnode.bounds.left;
        vnode.boundsWithParent.top = vnode.bounds.top - parentVnode.bounds.top;
        vnode.boundsWithParent.right = parentVnode.bounds.right - vnode.bounds.right;
        vnode.boundsWithParent.bottom = parentVnode.bounds.bottom - vnode.bounds.bottom;
    }
    vnode.centerX = vnode.boundsWithParent.left+vnode.width/2;
    vnode.centerY = vnode.boundsWithParent.top+vnode.height/2;
    for(var i = 0;i<parentVnode.layers.length;i++){
        if(vnode===parentVnode.layers[i]){
            if(i>0){
                vnode.offsetX=vnode.bounds.left-parentVnode.layers[i-1].bounds.right;
                vnode.offsetY=vnode.bounds.top-parentVnode.layers[i-1].bounds.bottom;
            }else{
                vnode.offsetX=vnode.boundsWithParent.left;
                vnode.offsetY=vnode.boundsWithParent.top;
            }
        }
    }
}
function updateStyle(vnode) {
    var _vnode = vnodeObj.vnode[vnode.id];
    var shape = updateShape(vnode);
    var text = updateText(vnode);
    if(!shape&&!text){
        if((!vnode.file)&&vnode.type !== 'layerSection'){
            copyLayer();
            var name = vnode.name.replace(regRule,'');
            _vnode.style.backgroundImage = name+'.'+vnode.id;
            if(vnode.name.indexOf('.jpg')>=0){
                _vnode.style.backgroundImage+='.jpg';
                saveJPG(_vnode.style.backgroundImage);
            }else{
                _vnode.style.backgroundImage+='.png';
                savePNG(_vnode.style.backgroundImage);
            }
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
    }
    setDirection(vnode);
}
function updateShape(vnode) {
    var activeLayer = app.activeDocument.activeLayer;
    var _vnode = vnodeObj.vnode[vnode.id];
    var _style = _vnode.style;
    if(
        vnode.type === 'shapeLayer'&&
        vnode.path.pathComponents.length === 1&&
        (
            vnode.path.pathComponents[0].origin.type === 'rect'||
            vnode.path.pathComponents[0].origin.type === 'ellipse'||
            vnode.path.pathComponents[0].origin.type === 'roundedRect'||
            (vnode.path.pathComponents[0].origin.type === 'line' && Math.min(vnode.width,vnode.height)<=2)
        )
    ){
        _style.width = Math.round(activeLayer.boundsNoEffects[2].as("px")-activeLayer.boundsNoEffects[0].as("px"));
        _style.height = Math.round(activeLayer.boundsNoEffects[3].as("px")-activeLayer.boundsNoEffects[1].as("px"));
        if(!(vnode.strokeStyle&&!vnode.strokeStyle.fillEnabled)){
            _style.backgroundColor = [
                Math.round(vnode.fill.color.red),
                Math.round(vnode.fill.color.green),
                Math.round(vnode.fill.color.blue),
                ((activeLayer.opacity/100)*(activeLayer.fillOpacity/100)).toFixed (2)*1
            ];
        }
        if(vnode.strokeStyle&&vnode.strokeStyle.strokeEnabled){
            _style.borderWidth = vnode.strokeStyle.strokeStyleLineWidth;
            _style.borderColor = [
                Math.round(vnode.strokeStyle.strokeStyleContent.color.red),
                Math.round(vnode.strokeStyle.strokeStyleContent.color.green),
                Math.round(vnode.strokeStyle.strokeStyleContent.color.blue),
                (activeLayer.opacity/100).toFixed (2)*1
            ];
        }
        switch (vnode.path.pathComponents[0].origin.type) {
            case 'rect': case 'line':
                _style.borderRadius = [0,0,0,0];
                break;
            case 'ellipse':
                _style.borderRadius = ['50%','50%','50%','50%'];
                break;
            case 'roundedRect':
                _style.borderRadius = [
                    vnode.path.pathComponents[0].origin.radii[3],
                    vnode.path.pathComponents[0].origin.radii[0],
                    vnode.path.pathComponents[0].origin.radii[1],
                    vnode.path.pathComponents[0].origin.radii[2],
                ];
                break;
        }
        updateEffects(vnode);
        return true;
    }
    return false;
}
function updateText(vnode) {
    var activeLayer = app.activeDocument.activeLayer;
    var _vnode = vnodeObj.vnode[vnode.id];
    var _style = _vnode.style;
    if(vnode.type === 'textLayer'){
        var textItem = activeLayer.textItem;
        try{_style.fontWeight=textItem.fauxBold?'bold':null}catch(e){}
        try{_style.fontStyle=textItem.fauxItalic?'italic':null}catch(e){}
        try{_style.lineHeight=textItem.leading.as('px')||null}catch(e){}
        try{_style.textDecoration = textItem.underline===UnderlineType.UNDERLINEOFF?null:'underline' }catch(e){}
        if(textItem.justification === Justification.CENTER){
            _style.textAlign = 'center';
        }else if(textItem.justification === Justification.RIGHT){
            _style.textAlign = 'right';
        }
        _style.color = [
            Math.round(textItem.color.rgb.red),
            Math.round(textItem.color.rgb.green),
            Math.round(textItem.color.rgb.blue),
            ((activeLayer.opacity/100)*(activeLayer.fillOpacity/100)).toFixed (2)*1
        ];
        _style.fontSize = Math.round(textItem.size.as('px'));
        _style.textWidth = Math.round(textItem.width.as('px'));
        _style.textHeight = Math.round(textItem.height.as('px'));
        _vnode.text = {
            text:textItem.contents.replace(/\s/g,' '),
            type:textItem.kind === TextType.POINTTEXT?'text':'textBox'
        };
        if(_vnode.bounds.height<_style.fontSize*1.3) _vnode.style.whiteSpace = 'nowrap';
        else if(_vnode.text.type==='textBox'&&!_style.textAlign){
            _style.width = activeLayer.boundsNoEffects[2].as('px')-activeLayer.boundsNoEffects[0].as('px');
        }
        return true;
    }
    return false;
}
function updateEffects(vnode) {
    if(vnode.layerEffects){
        updateShadow(vnode);
    }
}
function updateShadow(vnode) {
    if(vnode.layerEffects.dropShadow){
        //shadow
        var dropShadow = vnode.layerEffects.dropShadow;
        if(!vnode.layerEffects.dropShadow.length){
            dropShadow = [vnode.layerEffects.dropShadow];
        }
        for(var i = 0;i<dropShadow.length;i++){
            if(!dropShadow[i].enabled){
                dropShadow.splice(i--,1);
            }
        }
        if(!dropShadow.length) return;
        dropShadow = dropShadow[0];
        if(!dropShadow.opacity.value) return;
        var color = [0,0,0,(dropShadow.opacity.value/100).toFixed(2)];
        if(dropShadow.color){
            color[0] = Math.round(dropShadow.color.red||0);
            color[1] = Math.round(dropShadow.color.green||0);
            color[2] = Math.round(dropShadow.color.blue||0);
        }
        if(!dropShadow.mode){
            color[0] = Math.round(color[0]*.15);
            color[1] = Math.round(color[0]*.15);
            color[2] = Math.round(color[0]*.15);
        }
        if(!dropShadow.distance&&dropShadow.distance!==0)dropShadow.distance = 3;
        dropShadow.blur = dropShadow.blur ||0;
        if((!dropShadow.distance)&&(!dropShadow.blur)) return;
        if(dropShadow.useGlobalAngle!==false) dropShadow.useGlobalAngle = true;
        var light = (dropShadow.useGlobalAngle?globalLight:dropShadow.localLightingAngle.value)/180*Math.PI;
        var spread = Math.round(dropShadow.blur*dropShadow.chokeMatte/100);
        var blur = Math.round(dropShadow.blur*(100-dropShadow.chokeMatte)/100);
        var h_shadow = -1*Math.round(Math.cos(light)*dropShadow.distance);
        var v_shadow = Math.round(Math.sin(light)*dropShadow.distance);

        vnodeObj.vnode[vnode.id].style.boxShadow = [h_shadow,v_shadow,blur,spread,color];
    }
}
function setJustifyContent(vnode) {
    var _vnode = vnodeObj.vnode[vnode.vnodeID];
    if(_vnode.style.margin&&!_vnode.style.alignSelf){
        if(_vnode.style.flexDirection){
            if(_vnode.style.margin[0]===_vnode.style.margin[2]){
                //col
                _vnode.style.alignSelf='normal';
                _vnode.style.height=null;
                if(vnode.children){
                    _vnode.style.justifyContent='space-between';
                    for(var i= 0;i<vnode.children.length;i++){
                        var _child = vnodeObj.vnode[vnode.children[i].vnodeID];
                        if(_child.style.margin&&_child.style.margin[0]>_vnode.bounds.height*.25){
                            _child.style.margin[0] = 0;
                        }
                    }
                }
            }
        }else{
            if(_vnode.style.margin[1]===_vnode.style.margin[3]){
                //row
                _vnode.style.alignSelf='normal';
                if(vnode.parentID){
                    var _parent = vnodeObj.vnode[vnode.parentID];
                    if(!_parent.style.flexWrap) _vnode.style.width=null;
                }else{
                    _vnode.style.width=null;
                }
                if(vnode.children) {
                    _vnode.style.justifyContent = 'space-between';
                    for (var i = 0; i < vnode.children.length; i++) {
                        var _child = vnodeObj.vnode[vnode.children[i].vnodeID];
                        if (_child.style.margin && _child.style.margin[3] > _vnode.bounds.width * .25) {
                            _child.style.margin[3] = 0;
                        }
                    }
                }
            }
        }
    }
}
function setDirection(vnode) {
    if(vnode.layers&&vnode.layers.length>1){
        var direction = [0,0];
        for(var i = 1;i<vnode.layers.length;i++){
            var first = vnode.layers[i-1];
            var second = vnode.layers[i];
            if(first.bounds.bottom < second.bounds.top){
                direction[1]++;
            }
            if(first.bounds.right < second.bounds.left){
                direction[0]++;
            }
            if(first.bounds.bottom<second.bounds.top&&second.bounds.right<first.bounds.left){
                vnodeObj.vnode[vnode.id].style.flexWrap='wrap';
            }
        }
        if(direction[0]<direction[1]&&vnodeObj.vnode[vnode.id].style.flexWrap!=='wrap'){
            vnodeObj.vnode[vnode.id].style.flexDirection = 'column';
        }
    }
}
function copyLayer() {
    //复制图层
    var idMk = charIDToTypeID( "Mk  " );
    var desc1561 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref1210 = new ActionReference();
    var idDcmn = charIDToTypeID( "Dcmn" );
    ref1210.putClass( idDcmn );
    desc1561.putReference( idnull, ref1210 );
    var idUsng = charIDToTypeID( "Usng" );
    var ref1211 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    var idOrdn = charIDToTypeID( "Ordn" );
    var idTrgt = charIDToTypeID( "Trgt" );
    ref1211.putEnumerated( idLyr, idOrdn, idTrgt );
    desc1561.putReference( idUsng, ref1211 );
    var idVrsn = charIDToTypeID( "Vrsn" );
    desc1561.putInteger( idVrsn, 5 );
    executeAction( idMk, desc1561, DialogModes.NO );
    if(!app.activeDocument.activeLayer.isBackgroundLayer){
        app.activeDocument.trim(TrimType.TRANSPARENT,true,true,true,true);
    }
}
function savePNG(name) {
    var idExpr = charIDToTypeID( "Expr" );
    var desc714 = new ActionDescriptor();
    var idUsng = charIDToTypeID( "Usng" );
    var desc715 = new ActionDescriptor();
    var idOp = charIDToTypeID( "Op  " );
    var idSWOp = charIDToTypeID( "SWOp" );
    var idOpSa = charIDToTypeID( "OpSa" );
    desc715.putEnumerated( idOp, idSWOp, idOpSa );
    var idDIDr = charIDToTypeID( "DIDr" );
    desc715.putBoolean( idDIDr, true );
    var idIn = charIDToTypeID( "In  " );
    desc715.putPath( idIn, new File( _assetsPath ) );
    var idovFN = charIDToTypeID( "ovFN" );
    desc715.putString( idovFN, name );
    var idFmt = charIDToTypeID( "Fmt " );
    var idIRFm = charIDToTypeID( "IRFm" );

    var idPNtwofour = charIDToTypeID( "PN24" );
    desc715.putEnumerated( idFmt, idIRFm, idPNtwofour );
    var idIntr = charIDToTypeID( "Intr" );
    desc715.putBoolean( idIntr, false );
    var idTrns = charIDToTypeID( "Trns" );
    desc715.putBoolean( idTrns, true );
    var idMtt = charIDToTypeID( "Mtt " );
    desc715.putBoolean( idMtt, true );
    var idEICC = charIDToTypeID( "EICC" );
    desc715.putBoolean( idEICC, false );
    var idMttR = charIDToTypeID( "MttR" );
    desc715.putInteger( idMttR, 255 );
    var idMttG = charIDToTypeID( "MttG" );
    desc715.putInteger( idMttG, 255 );
    var idMttB = charIDToTypeID( "MttB" );
    desc715.putInteger( idMttB, 255 );
    var idSHTM = charIDToTypeID( "SHTM" );
    desc715.putBoolean( idSHTM, false );
    var idSImg = charIDToTypeID( "SImg" );
    desc715.putBoolean( idSImg, true );
    var idSWsl = charIDToTypeID( "SWsl" );
    var idSTsl = charIDToTypeID( "STsl" );
    var idSLAl = charIDToTypeID( "SLAl" );
    desc715.putEnumerated( idSWsl, idSTsl, idSLAl );

    var idSWch = charIDToTypeID( "SWch" );
    var idSTch = charIDToTypeID( "STch" );
    var idCHsR = charIDToTypeID( "CHsR" );
    desc715.putEnumerated( idSWch, idSTch, idCHsR );
    var idSWmd = charIDToTypeID( "SWmd" );
    var idSTmd = charIDToTypeID( "STmd" );
    var idMDCC = charIDToTypeID( "MDCC" );
    desc715.putEnumerated( idSWmd, idSTmd, idMDCC );
    var idohXH = charIDToTypeID( "ohXH" );
    desc715.putBoolean( idohXH, false );
    var idohIC = charIDToTypeID( "ohIC" );
    desc715.putBoolean( idohIC, true );
    var idohAA = charIDToTypeID( "ohAA" );
    desc715.putBoolean( idohAA, true );
    var idohQA = charIDToTypeID( "ohQA" );
    desc715.putBoolean( idohQA, true );
    var idohCA = charIDToTypeID( "ohCA" );
    desc715.putBoolean( idohCA, false );
    var idohIZ = charIDToTypeID( "ohIZ" );
    desc715.putBoolean( idohIZ, true );
    var idohTC = charIDToTypeID( "ohTC" );
    var idSToc = charIDToTypeID( "SToc" );
    var idOCzerothree = charIDToTypeID( "OC03" );
    desc715.putEnumerated( idohTC, idSToc, idOCzerothree );
    var idohAC = charIDToTypeID( "ohAC" );
    var idSToc = charIDToTypeID( "SToc" );
    var idOCzerothree = charIDToTypeID( "OC03" );
    desc715.putEnumerated( idohAC, idSToc, idOCzerothree );
    var idohIn = charIDToTypeID( "ohIn" );
    desc715.putInteger( idohIn, -1 );
    var idohLE = charIDToTypeID( "ohLE" );
    var idSTle = charIDToTypeID( "STle" );
    var idLEzerothree = charIDToTypeID( "LE03" );
    desc715.putEnumerated( idohLE, idSTle, idLEzerothree );
    var idohEn = charIDToTypeID( "ohEn" );
    var idSTen = charIDToTypeID( "STen" );
    var idENzerozero = charIDToTypeID( "EN00" );
    desc715.putEnumerated( idohEn, idSTen, idENzerozero );
    var idolCS = charIDToTypeID( "olCS" );
    desc715.putBoolean( idolCS, false );
    var idolEC = charIDToTypeID( "olEC" );
    var idSTst = charIDToTypeID( "STst" );
    var idSTzerozero = charIDToTypeID( "ST00" );
    desc715.putEnumerated( idolEC, idSTst, idSTzerozero );
    var idolWH = charIDToTypeID( "olWH" );
    var idSTwh = charIDToTypeID( "STwh" );
    var idWHzeroone = charIDToTypeID( "WH01" );
    desc715.putEnumerated( idolWH, idSTwh, idWHzeroone );
    var idolSV = charIDToTypeID( "olSV" );
    var idSTsp = charIDToTypeID( "STsp" );
    var idSPzerofour = charIDToTypeID( "SP04" );
    desc715.putEnumerated( idolSV, idSTsp, idSPzerofour );
    var idolSH = charIDToTypeID( "olSH" );
    var idSTsp = charIDToTypeID( "STsp" );
    var idSPzerofour = charIDToTypeID( "SP04" );
    desc715.putEnumerated( idolSH, idSTsp, idSPzerofour );
    var idolNC = charIDToTypeID( "olNC" );
    var list261 = new ActionList();
    var desc716 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerozero = charIDToTypeID( "NC00" );
    desc716.putEnumerated( idncTp, idSTnc, idNCzerozero );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc716 );
    var desc717 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNConenine = charIDToTypeID( "NC19" );
    desc717.putEnumerated( idncTp, idSTnc, idNConenine );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc717 );
    var desc718 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwoeight = charIDToTypeID( "NC28" );
    desc718.putEnumerated( idncTp, idSTnc, idNCtwoeight );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc718 );
    var desc719 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc719.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc719 );
    var desc720 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc720.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc720 );
    var desc721 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc721.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list261.putObject( idSCnc, desc721 );
    desc715.putList( idolNC, list261 );
    var idobIA = charIDToTypeID( "obIA" );
    desc715.putBoolean( idobIA, false );
    var idobIP = charIDToTypeID( "obIP" );
    desc715.putString( idobIP, "" );
    var idobCS = charIDToTypeID( "obCS" );
    var idSTcs = charIDToTypeID( "STcs" );
    var idCSzeroone = charIDToTypeID( "CS01" );
    desc715.putEnumerated( idobCS, idSTcs, idCSzeroone );
    var idovNC = charIDToTypeID( "ovNC" );
    var list262 = new ActionList();
    var desc722 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzeroone = charIDToTypeID( "NC01" );
    desc722.putEnumerated( idncTp, idSTnc, idNCzeroone );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc722 );
    var desc723 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwozero = charIDToTypeID( "NC20" );
    desc723.putEnumerated( idncTp, idSTnc, idNCtwozero );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc723 );
    var desc724 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerotwo = charIDToTypeID( "NC02" );
    desc724.putEnumerated( idncTp, idSTnc, idNCzerotwo );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc724 );
    var desc725 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNConenine = charIDToTypeID( "NC19" );
    desc725.putEnumerated( idncTp, idSTnc, idNConenine );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc725 );
    var desc726 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerosix = charIDToTypeID( "NC06" );
    desc726.putEnumerated( idncTp, idSTnc, idNCzerosix );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc726 );
    var desc727 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc727.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc727 );
    var desc728 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc728.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc728 );
    var desc729 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc729.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc729 );
    var desc730 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwotwo = charIDToTypeID( "NC22" );
    desc730.putEnumerated( idncTp, idSTnc, idNCtwotwo );
    var idSCnc = charIDToTypeID( "SCnc" );
    list262.putObject( idSCnc, desc730 );
    desc715.putList( idovNC, list262 );
    var idovCM = charIDToTypeID( "ovCM" );
    desc715.putBoolean( idovCM, false );
    var idovCW = charIDToTypeID( "ovCW" );
    desc715.putBoolean( idovCW, true );
    var idovCU = charIDToTypeID( "ovCU" );
    desc715.putBoolean( idovCU, true );
    var idovSF = charIDToTypeID( "ovSF" );
    desc715.putBoolean( idovSF, true );
    var idovCB = charIDToTypeID( "ovCB" );
    desc715.putBoolean( idovCB, true );
    var idovSN = charIDToTypeID( "ovSN" );
    desc715.putString( idovSN, "images" );
    var idSaveForWeb = stringIDToTypeID( "SaveForWeb" );
    desc714.putObject( idUsng, idSaveForWeb, desc715 );
    executeAction( idExpr, desc714, DialogModes.NO );
}
function saveJPG(name) {
    var idExpr = charIDToTypeID( "Expr" );
    var desc1351 = new ActionDescriptor();
    var idUsng = charIDToTypeID( "Usng" );
    var desc1352 = new ActionDescriptor();
    var idOp = charIDToTypeID( "Op  " );
    var idSWOp = charIDToTypeID( "SWOp" );
    var idOpSa = charIDToTypeID( "OpSa" );
    desc1352.putEnumerated( idOp, idSWOp, idOpSa );
    var idDIDr = charIDToTypeID( "DIDr" );
    desc1352.putBoolean( idDIDr, true );
    var idIn = charIDToTypeID( "In  " );
    desc1352.putPath( idIn, new File( _assetsPath ) );
    var idovFN = charIDToTypeID( "ovFN" );
    desc1352.putString( idovFN, name );
    var idFmt = charIDToTypeID( "Fmt " );
    var idIRFm = charIDToTypeID( "IRFm" );

    var idJPEG = charIDToTypeID( "JPEG" );
    desc1352.putEnumerated( idFmt, idIRFm, idJPEG );
    var idIntr = charIDToTypeID( "Intr" );
    desc1352.putBoolean( idIntr, false );
    var idQlty = charIDToTypeID( "Qlty" );
    desc1352.putInteger( idQlty, 80 );
    var idQChS = charIDToTypeID( "QChS" );
    desc1352.putInteger( idQChS, 0 );
    var idQCUI = charIDToTypeID( "QCUI" );
    desc1352.putInteger( idQCUI, 0 );
    var idQChT = charIDToTypeID( "QChT" );
    desc1352.putBoolean( idQChT, false );
    var idQChV = charIDToTypeID( "QChV" );
    desc1352.putBoolean( idQChV, false );
    var idOptm = charIDToTypeID( "Optm" );
    desc1352.putBoolean( idOptm, true );
    var idPass = charIDToTypeID( "Pass" );
    desc1352.putInteger( idPass, 1 );
    var idblur = charIDToTypeID( "blur" );
    desc1352.putDouble( idblur, 0.000000 );
    var idMtt = charIDToTypeID( "Mtt " );
    desc1352.putBoolean( idMtt, true );
    var idEICC = charIDToTypeID( "EICC" );
    desc1352.putBoolean( idEICC, false );
    var idMttR = charIDToTypeID( "MttR" );
    desc1352.putInteger( idMttR, 255 );
    var idMttG = charIDToTypeID( "MttG" );
    desc1352.putInteger( idMttG, 255 );
    var idMttB = charIDToTypeID( "MttB" );
    desc1352.putInteger( idMttB, 255 );
    var idSHTM = charIDToTypeID( "SHTM" );
    desc1352.putBoolean( idSHTM, false );
    var idSImg = charIDToTypeID( "SImg" );
    desc1352.putBoolean( idSImg, true );

    var idSWsl = charIDToTypeID( "SWsl" );
    var idSTsl = charIDToTypeID( "STsl" );
    var idSLAl = charIDToTypeID( "SLAl" );
    desc1352.putEnumerated( idSWsl, idSTsl, idSLAl );
    var idSWch = charIDToTypeID( "SWch" );
    var idSTch = charIDToTypeID( "STch" );
    var idCHsR = charIDToTypeID( "CHsR" );
    desc1352.putEnumerated( idSWch, idSTch, idCHsR );
    var idSWmd = charIDToTypeID( "SWmd" );
    var idSTmd = charIDToTypeID( "STmd" );
    var idMDCC = charIDToTypeID( "MDCC" );
    desc1352.putEnumerated( idSWmd, idSTmd, idMDCC );
    var idohXH = charIDToTypeID( "ohXH" );
    desc1352.putBoolean( idohXH, false );
    var idohIC = charIDToTypeID( "ohIC" );
    desc1352.putBoolean( idohIC, true );
    var idohAA = charIDToTypeID( "ohAA" );
    desc1352.putBoolean( idohAA, true );
    var idohQA = charIDToTypeID( "ohQA" );
    desc1352.putBoolean( idohQA, true );
    var idohCA = charIDToTypeID( "ohCA" );
    desc1352.putBoolean( idohCA, false );
    var idohIZ = charIDToTypeID( "ohIZ" );
    desc1352.putBoolean( idohIZ, true );
    var idohTC = charIDToTypeID( "ohTC" );
    var idSToc = charIDToTypeID( "SToc" );
    var idOCzerothree = charIDToTypeID( "OC03" );
    desc1352.putEnumerated( idohTC, idSToc, idOCzerothree );
    var idohAC = charIDToTypeID( "ohAC" );
    var idSToc = charIDToTypeID( "SToc" );
    var idOCzerothree = charIDToTypeID( "OC03" );
    desc1352.putEnumerated( idohAC, idSToc, idOCzerothree );
    var idohIn = charIDToTypeID( "ohIn" );
    desc1352.putInteger( idohIn, -1 );
    var idohLE = charIDToTypeID( "ohLE" );
    var idSTle = charIDToTypeID( "STle" );
    var idLEzerothree = charIDToTypeID( "LE03" );
    desc1352.putEnumerated( idohLE, idSTle, idLEzerothree );
    var idohEn = charIDToTypeID( "ohEn" );
    var idSTen = charIDToTypeID( "STen" );
    var idENzerozero = charIDToTypeID( "EN00" );
    desc1352.putEnumerated( idohEn, idSTen, idENzerozero );
    var idolCS = charIDToTypeID( "olCS" );
    desc1352.putBoolean( idolCS, false );
    var idolEC = charIDToTypeID( "olEC" );
    var idSTst = charIDToTypeID( "STst" );
    var idSTzerozero = charIDToTypeID( "ST00" );
    desc1352.putEnumerated( idolEC, idSTst, idSTzerozero );
    var idolWH = charIDToTypeID( "olWH" );
    var idSTwh = charIDToTypeID( "STwh" );
    var idWHzeroone = charIDToTypeID( "WH01" );
    desc1352.putEnumerated( idolWH, idSTwh, idWHzeroone );
    var idolSV = charIDToTypeID( "olSV" );
    var idSTsp = charIDToTypeID( "STsp" );
    var idSPzerofour = charIDToTypeID( "SP04" );
    desc1352.putEnumerated( idolSV, idSTsp, idSPzerofour );
    var idolSH = charIDToTypeID( "olSH" );
    var idSTsp = charIDToTypeID( "STsp" );
    var idSPzerofour = charIDToTypeID( "SP04" );
    desc1352.putEnumerated( idolSH, idSTsp, idSPzerofour );
    var idolNC = charIDToTypeID( "olNC" );
    var list385 = new ActionList();
    var desc1353 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerozero = charIDToTypeID( "NC00" );
    desc1353.putEnumerated( idncTp, idSTnc, idNCzerozero );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1353 );
    var desc1354 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNConenine = charIDToTypeID( "NC19" );
    desc1354.putEnumerated( idncTp, idSTnc, idNConenine );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1354 );
    var desc1355 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwoeight = charIDToTypeID( "NC28" );
    desc1355.putEnumerated( idncTp, idSTnc, idNCtwoeight );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1355 );
    var desc1356 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1356.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1356 );
    var desc1357 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1357.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1357 );
    var desc1358 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1358.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list385.putObject( idSCnc, desc1358 );
    desc1352.putList( idolNC, list385 );
    var idobIA = charIDToTypeID( "obIA" );
    desc1352.putBoolean( idobIA, false );
    var idobIP = charIDToTypeID( "obIP" );
    desc1352.putString( idobIP, "" );
    var idobCS = charIDToTypeID( "obCS" );
    var idSTcs = charIDToTypeID( "STcs" );
    var idCSzeroone = charIDToTypeID( "CS01" );
    desc1352.putEnumerated( idobCS, idSTcs, idCSzeroone );
    var idovNC = charIDToTypeID( "ovNC" );
    var list386 = new ActionList();
    var desc1359 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzeroone = charIDToTypeID( "NC01" );
    desc1359.putEnumerated( idncTp, idSTnc, idNCzeroone );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1359 );
    var desc1360 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwozero = charIDToTypeID( "NC20" );
    desc1360.putEnumerated( idncTp, idSTnc, idNCtwozero );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1360 );
    var desc1361 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerotwo = charIDToTypeID( "NC02" );
    desc1361.putEnumerated( idncTp, idSTnc, idNCzerotwo );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1361 );
    var desc1362 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNConenine = charIDToTypeID( "NC19" );
    desc1362.putEnumerated( idncTp, idSTnc, idNConenine );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1362 );
    var desc1363 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCzerosix = charIDToTypeID( "NC06" );
    desc1363.putEnumerated( idncTp, idSTnc, idNCzerosix );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1363 );
    var desc1364 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1364.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1364 );
    var desc1365 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1365.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1365 );
    var desc1366 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwofour = charIDToTypeID( "NC24" );
    desc1366.putEnumerated( idncTp, idSTnc, idNCtwofour );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1366 );
    var desc1367 = new ActionDescriptor();
    var idncTp = charIDToTypeID( "ncTp" );
    var idSTnc = charIDToTypeID( "STnc" );
    var idNCtwotwo = charIDToTypeID( "NC22" );
    desc1367.putEnumerated( idncTp, idSTnc, idNCtwotwo );
    var idSCnc = charIDToTypeID( "SCnc" );
    list386.putObject( idSCnc, desc1367 );
    desc1352.putList( idovNC, list386 );
    var idovCM = charIDToTypeID( "ovCM" );
    desc1352.putBoolean( idovCM, false );
    var idovCW = charIDToTypeID( "ovCW" );
    desc1352.putBoolean( idovCW, true );
    var idovCU = charIDToTypeID( "ovCU" );
    desc1352.putBoolean( idovCU, true );
    var idovSF = charIDToTypeID( "ovSF" );
    desc1352.putBoolean( idovSF, true );
    var idovCB = charIDToTypeID( "ovCB" );
    desc1352.putBoolean( idovCB, true );
    var idovSN = charIDToTypeID( "ovSN" );
    desc1352.putString( idovSN, "images" );
    var idSaveForWeb = stringIDToTypeID( "SaveForWeb" );
    desc1351.putObject( idUsng, idSaveForWeb, desc1352 );
    executeAction( idExpr, desc1351, DialogModes.NO );
}
function rename(vnode) {
    var activeLayer = app.activeDocument.activeLayer;
    var names = activeLayer.name.toLowerCase().replace(/\s/g,'').split('.');
    for (var i = 0;i<names.length;i++){
        if(names[i].search(regRule)<0){
            if(names[i].search(/[^\w-]/)>=0||names[i].search(/^\d/)>=0){
                names.splice(i--,1);
            }
        }
    }
    if(!names.join('.').replace(regRule,'')){
        if(vnode.type === 'layerSection'){
            names.push('ps_div');
        }else if(vnode.type === 'textLayer'){
            names.push('text');
        }else{
            names.push('ps_asset');
        }
    }
    vnode.name = activeLayer.name = names.join('.');

}
