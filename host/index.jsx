var _assetsPath = '';
var reg = new RegExp('[^a-z0-9A-Z\-]');
var regRule = new RegExp('^(!%|vue|jpg)$');
var regRule2 = new RegExp('\.(!%|vue|jpg)','g');
var _documentWidth,_documentHeight;
//exportDocument('','d:\\KFC_PC\\Desktop\\ps_f2e\\assets');
function exportDocument(assetsPath){
    if(app.activeDocument.width.type==='%'){
        alert('Error: 文档所用单位不能为 "%"');
        return;
    }
    _assetsPath = assetsPath;
    _documentWidth = app.activeDocument.width.as("px");
    _documentHeight = app.activeDocument.height.as("px");
    focusLayer(app.activeDocument.layers[0].name);
    app.activeDocument.vNode = setVNode(app.activeDocument,true);
    doForcedProgress( 'export . . .', 'mapLayers(app.activeDocument.layers)' );
    return toJSON(app.activeDocument.vNode);
}
function toJSON(object) {
    var json = '{';
    for(var attr in object){
        json +='"'+attr+'":';
        var item = object[attr];
        switch (typeof item) {
            case 'string':
                json +='"'+item+'",';
                break;
            case 'object':
                if(item instanceof Array){
                    json += '[';
                    for(var i = 0;i<item.length;i++){
                        if(typeof item[i] === 'object'){
                            if(item[i]===null) json += 'null,';
                            else json += toJSON(item[i]) + ',';
                        }else{
                            if(typeof item[i] === 'string') json += '"' + item[i] + '",';
                            else json += item[i] + ',';
                        }
                    }
                    json = json.replace(/,$/,'');
                    json += '],';
                }else if(item!=null){
                    json += toJSON(item) + ',';
                }else{
                    json += 'null,';
                }
                break;
            default:
                json += item + ',';
        }
    }
    json = json.replace(/,$/,'');
    json +='}';
    return json;
}
function setVNode(layer,root) {
    var name = root?'app.vue':layer.name;
    var vueName = '';
    var className = name.split('.');
    var psName = '';
    for(var i = 0;i<className.length;i++){
        if(className[i].search(regRule)>=0){
            className.splice(i,1);
            i--;
        }else if(className[i].search(/ps-\d+/)<0){
            vueName += className[i].replace(/^[a-z]/,function(a){return a.toUpperCase()});
        }else if(className[i].search(/ps-\d+/)>=0){
            psName = className[i];
        }
    }
    return {
        name:name,
        root:root||false,
        className:className,
        vueName:vueName,
        psName:root?'app':psName,
        assets:'',
        bounds:{
            x:0,//相对父级
            y:0,//相对父级
            _x:0,//全局定位
            _y:0,//全局定位
            w:_documentWidth,
            h:_documentHeight,
        },
        child:null,
    }
}
function focusLayer(name) {
    var idslct = charIDToTypeID( "slct" );
    var desc1574 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref1218 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    ref1218.putName( idLyr, name );
    desc1574.putReference( idnull, ref1218 );
    var idMkVs = charIDToTypeID( "MkVs" );
    desc1574.putBoolean( idMkVs, false );
    var idLyrI = charIDToTypeID( "LyrI" );
    var list876 = new ActionList();
    list876.putInteger( 7386 );
    desc1574.putList( idLyrI, list876 );
    executeAction( idslct, desc1574, DialogModes.NO );
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
function mapLayers(layers) {
    //遍历图层
    if(!layers.parent.vNode.child) layers.parent.vNode.child = [];
    for(var i = 0;i < layers.length;i++){
        var layer = layers[i];
        if(
            !layer.opacity||
            !layer.visible||
            (layer.layers&&!layer.layers.length)
        ) continue;
        rename(layer);
        layer.vNode = setVNode(layer);
        focusLayer(layer.name);
        copyLayer();
        if(!app.activeDocument.activeLayer.isBackgroundLayer){
            app.activeDocument.trim(TrimType.TRANSPARENT,true,true,false,false);
            layer.vNode.bounds._x = _documentWidth - app.activeDocument.width.as("px");
            layer.vNode.bounds._y = _documentHeight - app.activeDocument.height.as("px");
            layer.vNode.bounds.x = layer.vNode.bounds._x - layers.parent.vNode.bounds._x;
            layer.vNode.bounds.y = layer.vNode.bounds._y - layers.parent.vNode.bounds._y;
            app.activeDocument.trim(TrimType.TRANSPARENT,false,false,true,true);
            layer.vNode.bounds.w = app.activeDocument.width.as("px");
            layer.vNode.bounds.h =  app.activeDocument.height.as("px");
        }
        if(!layer.layers){
            layer.vNode.assets = layer.name.replace(regRule2,'');
            if(layer.name.indexOf(".jpg")>=0){
                layer.vNode.assets += '.jpg';
                saveJPG(layer.vNode.assets);
            }else{
                layer.vNode.assets += '.png';
                savePNG(layer.vNode.assets);
            }
        }
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        layers.parent.vNode.child.push(layer.vNode);
        if(layer.layers){
            // 图层组
            mapLayers(layer.layers);
        }else{

        }
    }
}
function rename(layer) {
    var names = layer.name.toLowerCase().replace(/\s/g,'').split('.');
    var save_name = [];
    var num = 0;//中文文字次数
    for (var i = 0;i<names.length;i++){
        if(names[i].search(regRule)<0){
            var id = names[i].match(/ps-(\d+)/);
            if(id&&id[1] !== layer.id){
                names[i] = 'ps-'+layer.id;
            }
            if(names[i].search(reg)>=0||names[i].search(/^(\d+)$/)>=0||!names[i]){
                if(!num){
                    num++;
                    names[i] = 'ps-'+layer.id;
                    continue;
                }
                num++;
                names.splice(i--,1);
            }
        }
    }
    layer.name = names.join('.');
    if(layer.name.indexOf('ps-'+layer.id)<0){
        layer.name += '.ps-' + layer.id;
    }
}
