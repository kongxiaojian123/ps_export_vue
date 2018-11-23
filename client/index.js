const csInterface = new CSInterface();
const exportButton = document.querySelector(".export-btn");
exportButton.addEventListener("click", ()=>{
    csInterface.evalScript("exportDocument()");
});
