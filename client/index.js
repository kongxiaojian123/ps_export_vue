const fs = require('fs-extra');
const path = require('path');
const desktop_path = getDesktop();
const save_path = path.resolve(desktop_path,'ps_f2e');
const csInterface = new CSInterface();
const exportButton = document.querySelector(".export-btn");
const units = document.querySelectorAll('.unit');
const regRule = new RegExp('^(!%|vue|jpg)$');
exportButton.addEventListener("click", ()=>{
    let unit = 'rpx';
    for(let item of units){
        if(item.checked){
            unit = item.value;
            break;
        }
    }
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
                csInterface.evalScript(`exportDocument("${unit}","${path.resolve(save_path,'assets').replace(/\\/g,'\\\\')}")`,(result)=>{
                    fs.mkdir(path.resolve(save_path,'js'),function(err) {
                        if (err) {
                            return console.error(err);
                        }
                        createVUE(JSON.parse(result));
                    });
                });
            });
        });
    });
});
function createVUE(vNode) {
    let childHtml = '';
    let modules = [];
    vNode.child.forEach(item=>{
        childHtml += createHTML(item,0);
        getModule(item,modules);
    });
    let importStr = '';
    modules.forEach(item=>{
        importStr +=`
    import ${item} from './${item}.vue';`;
    });
    const html = `<template>
    <div class="${vNode.className.join(' ')}">${childHtml}
    </div>
</template>
<script >${importStr}
    export default {
        data(){
            return{
            }
        },
        computed:{
        },
        methods:{
        },
        components:{
            ${modules.toString()}
        }
    };
</script>`;
    fs.writeFile(path.resolve(save_path,'js',`${vNode.vueName}.vue`), html,  function(err) {
        if (err) {
            return console.error(err);
        }
    });
}
function tabSpace(num) {
    let tab = '';
    for(let i=0;i<num;i++){
        tab += '    ';
    }
    return tab;
}
function createHTML(vNode,tab){
    if(vNode.name.indexOf('.vue')>=0){
        createVUE(vNode);
        return `
        <${vNode.vueName}/>`
    }
    if(vNode.child){
        let child = '';
        vNode.child.forEach(item=>{child+=createHTML(item,tab+1)});
        return `
        <div class="${vNode.className.join(' ')}">
            ${child}
        </div>`
    }else{
        return `
        <div class="${vNode.className.join(' ')}"></div>`
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
