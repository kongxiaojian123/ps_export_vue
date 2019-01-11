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
let documentBounds= null;
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
                        const vNode = JSON.parse(result);
                        createVUE(vNode);
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
        let _childHtml = '';
        html +=`${tabSpace(tab)}<div class="${getClass(vNode).join(' ')}">`;
        vNode.layers.forEach(child=>{
            _childHtml +=`${createHTML(child,tab+1)}\n`
        });
        if(_childHtml) html +=`\n${_childHtml}`;
        html +=`${tabSpace(tab)}</div>`;
    }else{
        if(vNode.type==='textLayer'){
            html +=`${tabSpace(tab)}<p class="${getClass(vNode).join(' ')}">${vNode.text}</p>`
        }else{
            html +=`${tabSpace(tab)}<span class="${getClass(vNode).join(' ')}"></span>`
        }
    }
    return html;
}
function getColor(color) {
    if(color.alpha>=1){
        return `rgb(${Math.round(color.red)},${Math.round(color.green)},${Math.round(color.blue)})`;
    }
    return `rgba(${Math.round(color.red)},${Math.round(color.green)},${Math.round(color.blue)},${color.alpha})`;
}
function createStyle(vNode,tab=0,parent) {
    let styleData = vNode.style;
    if(vNode.backgroundStyle){
        styleData = Object.assign(vNode.backgroundStyle.style,styleData);
    }
    const classList = getClass(vNode);
    let style = `${tabSpace(tab)}${tab&&classList[0]==='ps_asset'?'>':''}.${classList[0]}{\n`;
    let childStyle = '';
    if(vNode.layers){
        style+=`${tabSpace(tab+1)}position: relative;\n`;
        if(vNode.visible) style+=`${tabSpace(tab+1)}display: flex;\n`;
        else style+=`${tabSpace(tab+1)}display: none;\n`;
        if(vNode.optimizeData){
            style+=`${tabSpace(tab+1)}width: ${vNode.optimizeData.width}rpx;\n`;
            style+=`${tabSpace(tab+1)}height: ${vNode.optimizeData.height}rpx;\n`;
            if(parent&&parent.layers.length===1){
                const margin = [
                    vNode.optimizeData.boundsWithParent.top,
                    vNode.optimizeData.boundsWithParent.right,
                    vNode.optimizeData.boundsWithParent.bottom,
                    vNode.optimizeData.boundsWithParent.left,
                ];
                if(margin[1]===margin[3]) {
                    margin.pop();
                    if(margin[0]===margin[2]) {
                        margin.pop();
                        if(margin[0]===margin[1]) {
                            margin.pop();
                        }
                    }
                }
                if(margin[0]){
                    style+=`${tabSpace(tab+1)}margin: ${margin.join('rpx ')}rpx;\n`;
                }
            }
        }
        if(styleData.flexDirection!=='row') style+=`${tabSpace(tab+1)}flex-direction: ${styleData.flexDirection};\n`;
        const sameItem = [];
        vNode.layers.forEach(child=>{
            if(!sameItem.includes(getClass(child)[0])){
                sameItem.push(getClass(child)[0]);
                childStyle +=`${createStyle(child,tab+1,vNode)}\n`;
            }
        });
    }else{
        if(!vNode.visible) style+=`${tabSpace(tab+1)}display: none;\n`;
    }
    if(styleData.backgroundImage){
        style+=`${tabSpace(tab+1)}background: url("../assets/${styleData.backgroundImage}") no-repeat center;\n`;
    }else{
        if(styleData.strokeEnabled) style+=`${tabSpace(tab+1)}border:${styleData.strokeStyleLineWidth}rpx solid ${getColor(styleData.strokeColor)};\n`;
        if(styleData.radii) style+=`${tabSpace(tab+1)}border-radius:${typeof styleData.radii==='string'?styleData.radii:(styleData.radii.join('rpx ')+'rpx')};\n`;
        if(styleData.fillEnabled) style+=`${tabSpace(tab+1)}background:${getColor(styleData.fillColor)};\n`;
    }
    style+=childStyle;
    style+=`${tabSpace(tab)}}`;
    return style;
}

