const fs = require('fs');
const { spawn,spawnSync } = require('child_process');
const path = require('path');
const desktop_path = getDesktop();
const save_path = path.resolve(desktop_path,'ps_f2e');
const csInterface = new CSInterface();
const exportButton = document.querySelector(".export-btn");
const units = document.querySelectorAll('.unit');
let unit = 'rpx';
let documentBounds= null;
fs.removeSync = function removeSync(dir) {
    let arr = [dir];
    let current = null;
    let index = 0;

    while(current = arr[index++]) {
        let stat = fs.statSync(current);
        if (stat.isDirectory()) {
            let files = fs.readdirSync(current);
            arr = [...arr, ...files.map(file => path.join(current, file))];
        }
    }
    for (var i = arr.length - 1; i >= 0; i--) {
        let stat = fs.statSync(arr[i]);
        if (stat.isDirectory()) {
            fs.rmdirSync(arr[i]);
        } else {
            fs.unlinkSync(arr[i]);
        }
    }
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
                        documentBounds = vNode.bounds;
                        createVUE(vNode);
                    });
                });
            });
        });
    });
});
function pullCode() {
    const gitDate = localStorage.getItem('gitDate')||0;
    const today = new Date();
    today.setHours(0,0,0,0);
    if(gitDate<=today.getTime()){
        spawn('git', ['pull'],{cwd:__dirname}).on('close',()=>{
            localStorage.setItem('gitDate',today.getTime());
        });
    }
}
function createVUE(vNode,fNode) {
    let childHtml = '';
    let modules = [];
    const lastNodeIsBackground = checkLastChild(vNode);
    vNode.child.forEach((item,index)=>{
        if(!(
            index===vNode.child.length-1&&
            lastNodeIsBackground
        )){
            childHtml = createHTML(item,vNode,index===vNode.child.length-1,1) + childHtml;
        }
        getModule(item,modules);
    });
    let importStr = '';
    modules.forEach(item=>{
        importStr +=`
    import ${item} from './${item}.vue';`;
    });


    const html = `<template>
    <div class="${vNode.className.join(' ')}">
        ${childHtml}${vNode.root ? `<Loading :assets="loadAssets" @complete="loadComplete"/>
    ` : ""}</div>
</template>
<script >${importStr}
    ${vNode.root?`import Loading from 'Components/loading/App';
    `:""}export default {
        data(){
            return{
                ${vNode.root?'loadAssets:require.context("../assets", true, /\\.(png|jpg)$/i)':""}
            }
        },
        computed:{
        },
        methods:{
            ${vNode.root?`loadComplete(){
                console.log(111);
            }`:""}
        },
        components:{
            ${vNode.root?"Loading, ":""}${modules.toString()}
        }
    };
</script>
<style lang="postcss" scoped>${setStyle(vNode,fNode,1,0)}
</style>`;
    fs.writeFile(path.resolve(save_path,'js',`${vNode.vueName}.vue`), html,  function(err) {
        if (err) {
            return console.error(err);
        }
    });
}
function checkLastChild(vNode) {
    if(vNode.child){
        const lastNode = vNode.child[vNode.child.length-1];
        if(
            !lastNode.child&&
            lastNode.assets&&
            lastNode.bounds.x===0&&
            lastNode.bounds.y===0&&
            lastNode.bounds.w===vNode.bounds.w&&
            lastNode.bounds.h===vNode.bounds.h
        ){
            return true;
        }
    }
    return false;
}
function setStyle(vNode,fNode,index,tabNum) {
    fNode = fNode || vNode;
    const style = {
        position:'absolute',
        left:'0',
        top:'0',
    };
    const lastNodeIsBackground = checkLastChild(vNode);
    if(
        vNode.bounds.x===0&&
        vNode.bounds.y===0&&
        vNode.bounds.w===fNode.bounds.w&&
        vNode.bounds.h===fNode.bounds.h
    ){
        style.width = '100%';
        style.height = '100%';
        if(lastNodeIsBackground){
            style.background = `url("../assets/${vNode.child[vNode.child.length-1].assets}") no-repeat center`;
            style['background-size'] = 'cover';
        }else if(vNode.assets){
            style.background = `url("../assets/${vNode.assets}") no-repeat center`;
            style['background-size'] = 'cover';
        }
    }else{
        style.left = ((vNode.bounds.x+vNode.bounds.w/2)/fNode.bounds.w*100).toFixed(6)*1+'%';
        style.top = ((vNode.bounds.y+vNode.bounds.h/2)/fNode.bounds.h*100).toFixed(6)*1+'%';
        if(vNode.assets){
            style.background = `url("../assets/${vNode.assets}") no-repeat center`;
        }else{
            if(lastNodeIsBackground){
                style.background = `url("../assets/${vNode.child[vNode.child.length-1].assets}") no-repeat center`;
            }else{
                style['margin-left'] = `-${(vNode.bounds.w/2).toFixed(6)*1}${unit}`;
                style['margin-top'] = `-${(vNode.bounds.h/2).toFixed(6)*1}${unit}`;
                style.width = `${(vNode.bounds.w).toFixed(6)*1}${unit}`;
                style.height = `${(vNode.bounds.h).toFixed(6)*1}${unit}`;
            }
        }
    }
    let className = vNode.psName;
    if(vNode.className.length ===1) className = vNode.className[0];
    else if(vNode.className.length ===2){
        if(vNode.className[0].search(/^ps-\d+$/)>=0){
            className = vNode.className[1];
        }else{
            className = vNode.className[0];
        }
    }
    let styleStr = `${index?tabSpace(tabNum):''}.${className}{`;
    Object.keys(style).forEach(item=>{
        styleStr += `${tabSpace(tabNum+1)}${item}:${style[item]};`;
    });
    if(vNode.child){
        vNode.child.forEach((item,index)=>{
            if(
                item.name.indexOf('.vue')<0&&
                !(lastNodeIsBackground&&index===vNode.child.length-1)
            ){
                styleStr +=setStyle(item,vNode,index+1,tabNum+1);
            }
        });
    }
    styleStr += `${index?tabSpace(tabNum):''}}`;
    return styleStr;
}
function tabSpace(num,noWrap) {
    num = num||0;
    let tab = '\n';
    if(noWrap)tab = '';
    for(let i=0;i<num+1;i++){
        tab += '    ';
    }
    return tab;
}
function createHTML(vNode,fNode,isLast,tabNum){
    if(vNode.name.indexOf('.vue')>=0){
        createVUE(vNode,fNode);
        return `<${vNode.vueName}/>${tabSpace(tabNum)}`
    }
    const lastNodeIsBackground = checkLastChild(vNode);
    if(vNode.child){
        let child = '';
        vNode.child.forEach((item,index)=>{
            if(!(
                index===vNode.child.length-1&&
                lastNodeIsBackground
            )){
                child = createHTML(item,vNode,index===vNode.child.length-1,tabNum+1) + child;
            }
        });
        return `<div class="${vNode.className.join(' ')}">${child?tabSpace(tabNum+1):''}${child.replace(/    $/,'')}</div>${tabSpace(tabNum)}`
    }else{
        return `<div class="${vNode.className.join(' ')}"></div>${tabSpace(tabNum)}`
    }
}
function getModule(vNode,list){
    if(vNode.name.indexOf('.vue')>=0){
        list.push(vNode.vueName);
    }else if(vNode.child){
        vNode.child.forEach(item=>{
            getModule(item,list);
        });
    }
}
function getDesktop() {
    let HOMEDRIVE = '';
    if(process.env.OS.search(/windows/i)>=0){
        if(process.env.USERPATH) return path.resolve(process.env.USERPATH,'Desktop');
        HOMEDRIVE = process.env.HOMEDRIVE;
    }
    return path.resolve(HOMEDRIVE + process.env.HOMEPATH,'Desktop');
}
