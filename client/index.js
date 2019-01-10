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
                csInterface.evalScript(`exportDocument("${path.resolve(save_path,'assets').replace(/\\/g,'\\\\')}")`,(result)=>{
                    fs.mkdir(path.resolve(save_path,'js'),function(err) {
                        if (err) {
                            return console.error(err);
                        }
                        pullCode();
                        const vNode = JSON.parse(result);
                        console.log(vNode);
                        // documentBounds = vNode.bounds;
                        // createVUE(vNode);
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


