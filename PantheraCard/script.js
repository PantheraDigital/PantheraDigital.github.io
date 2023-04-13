var linkWindow = document.getElementById("links-window");
var projectWindow = document.getElementById("projects-window");
var aboutWindow = document.getElementById("about-window");

document.getElementById("link-button").addEventListener("click", function(){ShowHiddenWindow("links-window")});
document.getElementById("projects-button").addEventListener("click", function(){ShowHiddenWindow("projects-window")});
document.getElementById("about-button").addEventListener("click", function(){ShowHiddenWindow("about-window")});

var closeWindowButtons = document.getElementsByClassName("close-hidden-window-button");
for(let i = 0; i < closeWindowButtons.length; i++){
    closeWindowButtons[i].addEventListener("click", HideHiddenWindows);
}

function HideHiddenWindows(event){
    let target = event.target;
    target.parentElement.style.display = "none";
}

function ShowLinkWindow(){
    if(linkWindow){
        linkWindow.style.display = "block";
    }
}
function ShowProjectWindow(){
    if(projectWindow){
        projectWindow.style.display = "block";
    }
}
function ShowAboutWindow(){
    if(aboutWindow){
        aboutWindow.style.display = "block";
    }
}

function ShowHiddenWindow(windowID){
    let window = document.getElementById(windowID);
    window.style.display = "block";
}

