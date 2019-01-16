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
                        console.log(vNodeCache);
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
${createHTML(vNode.structure)}
</template>`;
    const script = `
<script>
export default {
    components:{},
    props: [],
    data(){
        return{}
    },
    computed:{},
    watch:{},
    methods:{},
    mounted(){},
};
</script>`;
    const style = `
<style scoped>
${createStyle(vNode.structure)}</style>`;
    console.log(html+script+style);
    fs.writeFile(path.resolve(save_path,'js',`${getClass(vNode.vnode[vNode.structure.vnodeID])[0]}.vue`), html+script+style,  function(err) {
        if (err) {
            return console.error(err);
        }
    });
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
    const nodeObj = vNodeCache.vnode[vNode.vnodeID];
    if(vNode.children){
        if(nodeObj.text){
            html +=`${tabSpace(tab)}<p class="${getClass(nodeObj).join(' ')}">${ vNodeCache.vnode[nodeObj.text].text.text}</p>`
        }else{
            let _childHtml = '';
            html +=`${tabSpace(tab)}<div class="${getClass(nodeObj).join(' ')}">`;
            vNode.children.forEach(child=>{
                _childHtml +=`${createHTML(child,tab+1)}\n`
            });
            if(_childHtml) html +=`\n${_childHtml}`;
            html +=`${tabSpace(tab)}</div>`;
        }
    }else{
        if(nodeObj.text){
            html +=`${tabSpace(tab)}<p class="${getClass(nodeObj).join(' ')}">${nodeObj.text.text}</p>`
        }else{
            html +=`${tabSpace(tab)}<span class="${getClass(nodeObj).join(' ')}"></span>`
        }
    }
    return html;
}
function getStyleValue(values){
    if(!values)return '';
    values = values.concat([]);
    if(values[1]===values[3]) {
        values.pop();
        if(values[0]===values[2]) {
            values.pop();
            if(values[0]===values[1]) {
                values.pop();
            }
        }
    }
    if(values.length>1||(values.length===1&&values[0])){
        if(typeof values[0]==='string'){
            return `${values.join(' ')}`;
        }else{
            return `${values.join('rpx ')}rpx`;
        }
    }else{
        return '';
    }
}
function getColor(color) {
    if(color[3]<1){
        return `rgba(${color.toString()})`;
    }
    return `#${color[0].toString(16)}${color[1].toString(16)}${color[2].toString(16)}`;
}
function getBackgroundStyle(nodeObj,tab=0) {
    const background = nodeObj.background!==null?vNodeCache.vnode[nodeObj.background]:nodeObj;
    let style = '';
    if(background.style.borderWidth) style += `${tabSpace(tab + 1)}border: ${background.style.borderWidth}rpx solid rgba(${background.style.borderColor.toString()});\n`;
    const borderRadius = getStyleValue(background.style.borderRadius);
    if(borderRadius) style += `${tabSpace(tab + 1)}border-radius: ${borderRadius};\n`;
    if(background.style.backgroundColor) style += `${tabSpace(tab + 1)}background: ${getColor(background.style.backgroundColor)};\n`;
    if(background.style.backgroundImage) style += `${tabSpace(tab + 1)}background-image: url("../assets/${nodeObj.style.backgroundImage}");\n`;
    if(background.style.boxShadow) style += `${tabSpace(tab + 1)}box-shadow: ${background.style.boxShadow[0]}rpx ${background.style.boxShadow[1]}rpx ${background.style.boxShadow[2]}rpx ${background.style.boxShadow[3]?(background.style.boxShadow[3]+'rpx '):''}${getColor(background.style.boxShadow[4])};\n`;
    return style;
}
function getTextStyle(nodeObj,tab=0) {
    const text = typeof nodeObj.text === 'number'?vNodeCache.vnode[nodeObj.text]:nodeObj;
    let style = '';
    if(text.style.fontSize) style += `${tabSpace(tab + 1)}font-size: ${text.style.fontSize}rpx;\n`;
    if(text.style.lineHeight) style += `${tabSpace(tab + 1)}line-height: ${text.style.lineHeight}rpx;\n`;
    if(text.style.textAlign) style += `${tabSpace(tab + 1)}text-align: ${text.style.textAlign};\n`;
    if(text.style.fontWeight) style += `${tabSpace(tab + 1)}font-weight: ${text.style.fontWeight};\n`;
    if(text.style.fontStyle) style += `${tabSpace(tab + 1)}font-style: ${text.style.fontStyle};\n`;
    if(text.style.textDecoration) style += `${tabSpace(tab + 1)}text-decoration: ${text.style.textDecoration};\n`;
    if(text.style.color) style += `${tabSpace(tab + 1)}color: ${getColor(text.style.color)};\n`;
    return style;
}
function createStyle(vNode,tab=0) {
    const nodeObj = vNodeCache.vnode[vNode.vnodeID];
    const classList = getClass(nodeObj);
    let style = `${tabSpace(tab)}${tab&&classList[0].search(/^ps_/)>=0?'>':''}.${classList[0]}{\n`;
    let childStyle = '';
    if(vNode.children) {
        style += `${tabSpace(tab + 1)}position: relative;\n`;
        if (nodeObj.style.display) style += `${tabSpace(tab + 1)}display: ${nodeObj.style.display};\n`;
        else if (!nodeObj.text) style += `${tabSpace(tab + 1)}display: flex;\n`;
        if(nodeObj.style.flexDirection) style += `${tabSpace(tab + 1)}flex-direction: ${nodeObj.style.flexDirection};\n`;
        if(nodeObj.style.alignItems) style += `${tabSpace(tab + 1)}align-items: ${nodeObj.style.alignItems};\n`;
        else style += `${tabSpace(tab + 1)}align-items: center;\n`;
        if(nodeObj.style.justifyContent) style += `${tabSpace(tab + 1)}justify-content: ${nodeObj.style.justifyContent};\n`;
        vNode.children.forEach(item=>{
            childStyle += createStyle(item,tab+1);
        });
    }
    if(nodeObj.style.flex) style += `${tabSpace(tab + 1)}flex: ${nodeObj.style.flex};\n`;
    if(nodeObj.style.alignSelf) style += `${tabSpace(tab + 1)}align-self: ${nodeObj.style.alignSelf};\n`;
    if(vNode.children&&nodeObj.background&&nodeObj.text){
        const text = vNodeCache.vnode[nodeObj.text];
        text.style.textAlign = 'center';
        const background = vNodeCache.vnode[nodeObj.background];
        let padding = [0,0,0,0];
        if(text.bounds.offset[0]<20){
            padding[1] = padding[3] = text.bounds.offset[0];
        }else {
            style += `${tabSpace(tab + 1)}width: ${background.bounds.width}rpx;\n`;
        }
        padding[0] = padding[2] = text.bounds.offset[1];
        padding = getStyleValue(padding);
        if(padding) style += `${tabSpace(tab + 1)}padding: ${padding};\n`;
    }else{
        if(nodeObj.style.width) style += `${tabSpace(tab + 1)}width: ${nodeObj.style.width}rpx;\n`;
        if(nodeObj.style.height) style += `${tabSpace(tab + 1)}height: ${nodeObj.style.height}rpx;\n`;
        const padding = getStyleValue(nodeObj.style.padding);
        if(padding) style += `${tabSpace(tab + 1)}padding: ${padding};\n`;
    }
    const margin = getStyleValue(nodeObj.style.margin);
    if(margin) style += `${tabSpace(tab + 1)}margin: ${margin};\n`;
    style+=getBackgroundStyle(nodeObj,tab);
    style+=getTextStyle(nodeObj,tab);
    style+=childStyle;
    style+=`${tabSpace(tab)}}\n`;
    return style;
}

