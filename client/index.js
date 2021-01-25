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
                csInterface.evalScript("getDocumentName()",(name)=>{
                    console.log(name);
                    return;
                    csInterface.evalScript(`exportDocument("${path.resolve(save_path,'assets').replace(/\\/g,'\\\\')}","0${crc16(name).toLowerCase()}")`,(result)=>{
                        fs.mkdir(path.resolve(save_path,'js'),function(err) {
                            if (err) {
                                return console.error(err);
                            }
                            pullCode();
                            const vNode = JSON.parse(result);
                            documentBounds = vNode.bounds;
                            // console.log(vNode);
                            createVUE(vNode);
                        });
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
    <div data-${vNode.psName} class="${vNode.className.join(' ')}">
        ${childHtml}${vNode.root?`<transition-group name="fadeout">
            <Loading v-if="pageIndex===-1" key="loading" :assets="loadAssets" @complete="loadComplete"/>
        </transition-group>
    `:""}</div>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Emit, Prop, } from 'vue-property-decorator';
    ${vNode.root?`import Loading from 'loading/App.vue';`:""}${importStr}
    @Component({components:{ 
        ${vNode.root?"Loading, ":""}${modules.toString()}
    }})
    export default class ${vNode.vueName} extends Vue {
        ${vNode.root?`private pageIndex:number=-1;
        private loadAssets:RequireContext=require.context("../assets", true, /\.(png|jpg)$/i);
        private loadComplete(){
            this.setPage(0);
        }
        private setPage(index:number){
            this.pageIndex = index;
        }`:""}
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
        if(lastNodeIsBackground&&vNode.child[vNode.child.length-1].name.indexOf('.box')<0){
            style.background = `url("../assets/${vNode.child[vNode.child.length-1].assets}") no-repeat center`;
            style['background-size'] = 'cover';
        }else if(vNode.assets&&vNode.name.indexOf('.box')<0){
            style.background = `url("../assets/${vNode.assets}") no-repeat center`;
            style['background-size'] = 'cover';
        }
    }else{
        style.left = ((vNode.bounds.x+vNode.bounds.w/2)/fNode.bounds.w*100).toFixed(6)*1+'%';
        style.top = ((vNode.bounds.y+vNode.bounds.h/2)/fNode.bounds.h*100).toFixed(6)*1+'%';
        if(vNode.assets && vNode.name.indexOf('.box')<0){
            style.background = `url("../assets/${vNode.assets}") no-repeat center`;
        }else if(lastNodeIsBackground&&vNode.child[vNode.child.length-1].name.indexOf('.box')<0){
            style.background = `url("../assets/${vNode.child[vNode.child.length-1].assets}") no-repeat center`;
        }else{
            style['margin-left'] = `-${(vNode.bounds.w/2).toFixed(6)*1}${unit}`;
            style['margin-top'] = `-${(vNode.bounds.h/2).toFixed(6)*1}${unit}`;
            style.width = `${(vNode.bounds.w).toFixed(6)*1}${unit}`;
            style.height = `${(vNode.bounds.h).toFixed(6)*1}${unit}`;
        }
    }
    let className = '';
    if(vNode.name.search(/\.vue/)<0){
        if(vNode.className.length) className = `.${vNode.className[0]}`;
        className += `[data-${vNode.psName}]`;
    }else{
        className = `.${vNode.className[0]}`;
    }
    let styleStr = `${index?tabSpace(tabNum):''}${className}{`;
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
        return `<div data-${vNode.psName} class="${vNode.className.join(' ')}">${child?tabSpace(tabNum+1):''}${child.replace(/    $/,'')}</div>${tabSpace(tabNum)}`
    }else{
        return `<div data-${vNode.psName} class="${vNode.className.join(' ')}"></div>${tabSpace(tabNum)}`
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
    if(process.env.OS&&process.env.OS.search(/windows/i)>=0){
        if(process.env.USERPATH) return path.resolve(process.env.USERPATH,'Desktop');
        HOMEDRIVE = process.env.HOMEDRIVE;
    }
    return path.resolve(HOMEDRIVE + process.env.HOMEPATH,'Desktop');
}
