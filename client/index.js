const fs = require('fs-extra');
const { spawn,spawnSync } = require('child_process');
const path = require('path');
const desktop_path = getDesktop();
const save_path = path.resolve(desktop_path,'ps_f2e');
const csInterface = new CSInterface();
const exportButton = document.querySelector(".export-btn");
const timeDiv = document.querySelector(".time");
const units = document.querySelectorAll('.unit');
let unit = 'rpx';
let vNodeCache= null;
let today  = 0;
var regRule = new RegExp('\.(vue|jpg)','g');
if(localStorage.getItem('gitDate')){
    const timeDate = new Date(localStorage.getItem('gitDate')*1);
    timeDiv.innerHTML = `${timeDate.getFullYear()}.${timeDate.getMonth()+1}.${timeDate.getDate()}`;
}
exportButton.addEventListener("click", ()=>{
    // for(let item of units){
    //     if(item.checked){
    //         unit = item.value;
    //         break;
    //     }
    // }
    fs.exists(save_path,(isExist)=>{
        if(isExist){
            fs.removeSync(save_path);
        }
        fs.mkdir(save_path,function(err){
            if (err) {
                return console.error(err);
            }
            fs.mkdir(path.resolve(save_path,'assets'),function(err){
                if (err) {
                    return console.error(err);
                }
                csInterface.evalScript(`exportDocument("${path.resolve(save_path,'assets').replace(/\\/g,'\\\\')}")`,(result)=>{
                    fs.mkdir(path.resolve(save_path,'js'),function(err) {
                        if (err) {
                            return console.error(err);
                        }
                        pullCode();
                        vNodeCache = JSON.parse(result);
                        createVUE(vNodeCache);
                    });
                });
            });
        });
    });
});
function pullCode() {
    today = new Date();
    today.setHours(0,0,0,0);
    console.log('test');
    fs.exists(path.resolve(__dirname,'.git'),(isExist)=>{
        if(isExist){
            const gitDate = localStorage.getItem('gitDate')||0;
            if(gitDate<today.getTime()){
                spawn('git', ['pull'],{cwd:__dirname}).on('close',()=>{
                    updateNode(__dirname);
                });
            }
        }else{
            const gitAssets = path.resolve(desktop_path,'../');
            spawn('git', ['clone','git@github.com:kongxiaojian123/ps_export_vue.git'],{cwd:gitAssets}).on('close',()=>{
                fs.move(path.resolve(gitAssets,'ps_export_vue'), __dirname, { overwrite: true }, err => {
                    if (err) return console.error(err);
                    updateNode(__dirname);
                })
            });
        }
    });
}
function updateNode(cwd) {
    const cmdStr = /^win/.test(process.platform) ? 'cnpm.cmd' : 'cnpm';
    spawn(cmdStr, ['i'],{cwd:cwd}).on('close',()=>{
        localStorage.setItem('gitDate',today.getTime());
        console.log('插件已更新');
    });
}
function getDesktop() {
    let HOMEDRIVE = '';
    if(process.env.OS&&process.env.OS.search(/windows/i)>=0){
        if(process.env.USERPATH) return path.resolve(process.env.USERPATH,'Desktop');
        HOMEDRIVE = process.env.HOMEDRIVE;
    }
    return path.resolve(HOMEDRIVE + process.env.HOMEPATH,'Desktop');
}
function createVUE(vNode) {
    const html = `<template>
${createHTML(vNode)}
</template>`;
    const style = `\n<style scoped>
${createStyle(vNode)}
</style>`;
    console.log(html+style,vNode);
}
function tabSpace(num) {
    let space = '';
    for(let i = 0;i<num;i++){
        space += '  ';
    }
    return space;
}
function getClass(vNode) {
    return vNode.name.replace(regRule,'').split('.');
}
function createHTML(vNode,tab=1) {
    let html = '';
    if(vNode.layers){
        if(vNode.text){
            html +=`${tabSpace(tab)}<p class="${getClass(vNode).join(' ')}">${vNode.text.text}</p>`
        }else{
            let _childHtml = '';
            html +=`${tabSpace(tab)}<div class="${getClass(vNode).join(' ')}">`;
            vNode.layers.forEach(child=>{
                _childHtml +=`${createHTML(child,tab+1)}\n`
            });
            if(_childHtml) html +=`\n${_childHtml}`;
            html +=`${tabSpace(tab)}</div>`;
        }
    }else{
        if(vNode.type==='textLayer'){
            html +=`${tabSpace(tab)}<p class="${getClass(vNode).join(' ')}">${vNode.text}</p>`
        }else{
            html +=`${tabSpace(tab)}<span class="${getClass(vNode).join(' ')}"></span>`
        }
    }
    return html;
}
function getMargin(vNode, tab = 0, parent=null) {
    if(vNode.optimizeData&&parent){
        let offsetPrev = [vNode.optimizeData.boundsWithParent.left-parent.style.padding[3],vNode.optimizeData.boundsWithParent.top-parent.style.padding[0]];
        for(let i = 1;i<parent.layers.length;i++){
            if(parent.layers[i].id === vNode.id){
                const prev = parent.layers[i-1];
                offsetPrev[0] = vNode.optimizeData.bounds.left-prev.optimizeData.bounds.right;
                offsetPrev[1] = vNode.optimizeData.bounds.top-prev.optimizeData.bounds.bottom;
            }
        }
        if(parent.style.flexWrap==='nowrap'){
            if(parent.style.flexDirection==='row'){
                offsetPrev[1] = 0;
            }else {
                offsetPrev[0] = 0;
            }
        }
        vNode.style.margin = [Math.max(0,offsetPrev[1]),0,0,Math.max(0,offsetPrev[0])];
    }else{
        vNode.style.margin = [0,0,0,0];
        return '';
    }
    const margin = vNode.style.margin.concat([]);
    if(margin[1]===margin[3]) {
        margin.pop();
        if(margin[0]===margin[2]) {
            margin.pop();
            if(margin[0]===margin[1]) {
                margin.pop();
            }
        }
    }
    if(margin.length>1||(margin.length===1&&margin[0])){
        return `${tabSpace(tab+1)}margin: ${margin.join('rpx ')}rpx;\n`;
    }else{
        return '';
    }
}
function getPadding(vNode,tab=0) {
    if(vNode.optimizeData&&vNode.layers&&vNode.layers.length){
        const padding =[vNode.optimizeData.height,vNode.optimizeData.width,vNode.optimizeData.height,vNode.optimizeData.width];
        vNode.layers.forEach(item=> {
            const bounds = item.optimizeData.boundsWithParent;
            if (bounds.top< padding[0]) padding[0] = bounds.top;
            if (bounds.right< padding[1]) padding[1] = bounds.right;
            if (bounds.bottom< padding[2]) padding[2] = bounds.bottom;
            if (bounds.left< padding[3]) padding[3] = bounds.left;
        });
        vNode.style.padding = padding;
        if(vNode.style.flexWrap==='nowrap'){
            if(vNode.style.flexDirection==='row'){
                const pleft = Math.min(padding[0],padding[2]);
                if(padding[0]-padding[2]>pleft*2){
                    padding[0] = padding[2] = pleft;
                }
            }else {
                const pleft = Math.min(padding[1],padding[3]);
                if(padding[1]-padding[3]>pleft*2){
                    padding[1] = padding[3] = pleft;
                }
            }
        }
    }else{
        vNode.style.padding = [0,0,0,0];
    }
    const padding = vNode.style.padding.concat([]);
    if(padding[1]===padding[3]) {
        padding.pop();
        if(padding[0]===padding[2]) {
            padding.pop();
            if(padding[0]===padding[1]) {
                padding.pop();
            }
        }
    }
    if(padding.length>1||(padding.length===1&&padding[0])){
        return `${tabSpace(tab+1)}padding: ${padding.join('rpx ')}rpx;
${tabSpace(tab+1)}box-sizing: border-box;\n`;
    }else{
        return '';
    }
}
function getColor(color) {
    if(color.alpha>=1){
        return `rgb(${Math.round(color.red)},${Math.round(color.green)},${Math.round(color.blue)})`;
    }
    return `rgba(${Math.round(color.red)},${Math.round(color.green)},${Math.round(color.blue)},${color.alpha})`;
}
function fontStyle(vNode,tab=0) {
    let styleData = vNode.style;
    let style = '';
    style+=`${tabSpace(tab+1)}flex: none;\n`;
    if(styleData.lineHeight!=='auto')style+=`${tabSpace(tab+1)}line-height: ${styleData.lineHeight}rpx;\n`;
    style+=`${tabSpace(tab+1)}font-size: ${styleData.size}rpx;\n`;
    if(styleData.bold) style+=`${tabSpace(tab+1)}font-weight: bold;\n`;
    if(styleData.italic) style+=`${tabSpace(tab+1)}font-style: italic;\n`;
    if(styleData.textDecoration !=='none') style+=`${tabSpace(tab+1)}text-decoration: ${styleData.textDecoration};\n`;
    if(styleData.textAlign !=='left') style+=`${tabSpace(tab+1)}text-align: ${styleData.textAlign};\n`;
    style+=`${tabSpace(tab+1)}color: ${getColor(styleData.color)};\n`;
    return style;
}
function getAlignSelf(vNode, tab = 0, parent) {
    let style = '';
    if(parent.style.flexDirection==='row'){
        style+=`${tabSpace(tab+1)}width: ${vNode.optimizeData.width}rpx;\n`;
        const parentHeight = parent.optimizeData?parent.optimizeData.height:parent.height;
        const centerY = vNode.optimizeData.center[1]/parentHeight;
        vNode.style.alignSelf = 'center';
        if(centerY<.4){
            vNode.style.alignSelf = 'flex-start';
        }else if(centerY>.6){
            vNode.style.alignSelf = 'flex-end';
        }else if(vNode.layers){
            style+=`${tabSpace(tab+1)}height: 100%;\n`;
        }
    }else {
        style+=`${tabSpace(tab+1)}height: ${vNode.optimizeData.height}rpx;\n`;
        const parentWidth = parent.optimizeData?parent.optimizeData.width:parent.width;
        const centerX = vNode.optimizeData.center[0]/parentWidth;
        vNode.style.alignSelf = 'center';
        if(centerX<.4){
            vNode.style.alignSelf = 'flex-start';
        }else if(centerX>.6){
            vNode.style.alignSelf = 'flex-end';
        }else if(vNode.layers){
            style+=`${tabSpace(tab+1)}width: 100%;\n`;
        }
    }
    if(vNode.style.alignSelf!=='center'){
        style+=`${tabSpace(tab+1)}align-self: ${vNode.style.alignSelf};\n`;
    }
    return style;
}
function createStyle(vNode,tab=0,parent) {
    let styleData = vNode.style;
    if(vNode.backgroundStyle){
        styleData = Object.assign(vNode.backgroundStyle.style,styleData);
    }
    const classList = getClass(vNode);
    let style = `${tabSpace(tab)}${tab&&classList[0].search(/^ps_/)>=0?'>':''}.${classList[0]}{\n`;
    let childStyle = '';
    const padding=getPadding(vNode,tab);
    const margin=getMargin(vNode,tab,parent);
    if(vNode.layers){
        style+=`${tabSpace(tab+1)}position: relative;\n`;
        if(!vNode.visible) style+=`${tabSpace(tab+1)}display: none;\n`;
        else if(!vNode.text) style+=`${tabSpace(tab+1)}display: flex;\n`;

        if(vNode.optimizeData){
            if(vNode.text){
                style+=`${tabSpace(tab+1)}height: ${Math.ceil(vNode.height)}rpx;\n`;
                style+=`${tabSpace(tab+1)}line-height: ${Math.ceil(vNode.height)}rpx;\n`;
                style+=`${tabSpace(tab+1)}padding: 0 ${Math.round((vNode.optimizeData.width-vNode.text.optimizeData.width)/2)}rpx;\n`;
            }else{
                if(parent.style.flexWrap==='nowrap'){
                    style+=`${tabSpace(tab+1)}align-items: center;\n`;
                    style+=`${tabSpace(tab+1)}flex: auto;\n`;
                    style+=getAlignSelf(vNode,tab,parent);
                }else{
                    style+=`${tabSpace(tab+1)}width: ${vNode.optimizeData.width}rpx;\n`;
                    style+=`${tabSpace(tab+1)}height: ${vNode.optimizeData.height}rpx;\n`;
                }
            }
        }
        if(vNode.text){
            style+=fontStyle(vNode.text,tab);
        }else {
            if (styleData.flexDirection !== 'row') style += `${tabSpace(tab + 1)}flex-direction: ${styleData.flexDirection};\n`;
            const sameItem = [];
            vNode.layers.forEach(child => {
                if (!sameItem.includes(getClass(child)[0])) {
                    sameItem.push(getClass(child)[0]);
                    childStyle += `${createStyle(child, tab + 1, vNode)}\n`;
                }
            });
        }
    }else{
        if(!vNode.visible) style+=`${tabSpace(tab+1)}display: none;\n`;
        if(vNode.type==='textLayer'){
            style+=getAlignSelf(vNode,tab,parent);
            style+=`${tabSpace(tab+1)}height: ${Math.ceil(vNode.height)}rpx;\n`;
            if(vNode.style.kind==='textBox'&&Math.ceil(vNode.height)>vNode.style.size*1.5) style+=`${tabSpace(tab+1)}width: ${Math.ceil(vNode.width)}rpx;\n`;
            else{
                style+=`${tabSpace(tab+1)}white-space: nowrap;\n`;
            }
            style+=fontStyle(vNode,tab);
        }else{
            style+=`${tabSpace(tab+1)}width: ${vNode.optimizeData.width}rpx;\n`;
            style+=`${tabSpace(tab+1)}height: ${vNode.optimizeData.height}rpx;\n`;
        }
    }
    style+=padding;
    style+=margin;
    if(styleData.backgroundImage){
        style+=`${tabSpace(tab+1)}background: url("../assets/${styleData.backgroundImage}") no-repeat center;\n`;
    }else{
        if(styleData.strokeEnabled) style+=`${tabSpace(tab+1)}border:${styleData.strokeStyleLineWidth}rpx solid ${getColor(styleData.strokeColor)};\n`;
        if(styleData.radii) style+=`${tabSpace(tab+1)}border-radius:${typeof styleData.radii==='string'?styleData.radii:(styleData.radii.join('rpx ')+'rpx')};\n`;
        if(styleData.fillEnabled) style+=`${tabSpace(tab+1)}background:${getColor(styleData.fillColor)};\n`;
    }
    if(vNode.type==='layerSection'&&vNode.backgroundStyle&&vNode.backgroundStyle.type==="shapeLayer"||vNode.type==="shapeLayer"){
        const shape = vNode.backgroundStyle ||vNode;
        if(shape.layerEffects){
            Object.keys(shape.layerEffects).forEach(effect=>{
                const effectData = shape.layerEffects[effect];
                if(effectData.enabled){
                    switch (effect) {
                        case 'dropShadow':
                            effectData.color = effectData.color||{red:0,green:0,blue:0,alpha:0};
                            effectData.color.red = Math.round(effectData.color.red||0);
                            effectData.color.green = Math.round(effectData.color.green||0);
                            effectData.color.blue = Math.round(effectData.color.blue||0);
                            effectData.color.alpha = ((effectData.opacity.value||0)/100).toFixed(2);
                            if(!effectData.color.alpha) break;
                            if(effectData.mode !== "normal"){
                                effectData.color.red = Math.round(effectData.color.red*.15);
                                effectData.color.green = Math.round(effectData.color.green*.15);
                                effectData.color.blue = Math.round(effectData.color.blue*.15);
                            }
                            if(!effectData.distance&&effectData.distance!==0)effectData.distance = 3;
                            effectData.blur = effectData.blur ||0;
                            if((!effectData.distance)&&(!effectData.blur)) break;
                            if(effectData.useGlobalAngle!==false) effectData.useGlobalAngle = true;
                            const light = (effectData.useGlobalAngle?vNodeCache.globalLight.angle:effectData.localLightingAngle.value)/180*Math.PI;
                            const spread = Math.round(effectData.blur*effectData.chokeMatte/100);
                            const blur = Math.round(effectData.blur*(100-effectData.chokeMatte)/100);
                            const h_shadow = -1*Math.round(Math.cos(light)*effectData.distance);
                            const v_shadow = Math.round(Math.sin(light)*effectData.distance);
                            style +=`${tabSpace(tab+1)}box-shadow: ${h_shadow}rpx ${v_shadow}rpx ${blur}rpx ${spread?(spread+'rpx '):''}${getColor(effectData.color)};\n`;
                            break;
                    }
                }
            });
        }
    }
    style+=childStyle;
    style+=`${tabSpace(tab)}}`;
    return style;
}

