var linkWindow = document.getElementById("links-window");
var projectWindow = document.getElementById("projects-window");
var aboutWindow = document.getElementById("about-window");
var qrOverlay = document.getElementById("qr-overlay");
var qrOverlayButton = document.getElementById("qr-button");

document.getElementById("link-button").addEventListener("click", function(){ShowHiddenWindow("links-window")});
document.getElementById("projects-button").addEventListener("click", function(){ShowHiddenWindow("projects-window")});
document.getElementById("about-button").addEventListener("click", function(){ShowHiddenWindow("about-window")});

document.getElementById("qr-button").addEventListener("click", function(){
    if(this.style.backgroundImage == "none"){
        this.style.backgroundImage = "url('././ProjectPics/QR.png')";
        this.style.color = "rgba(255, 255, 255, 0)";
        qrOverlay.style.display = "none";
    }
    else{
        this.style.backgroundImage = "none";
        this.style.color = "black";
        qrOverlay.style.display = "block";
    }
});

var closeWindowButtons = document.getElementsByClassName("close-hidden-window-button");
for(let i = 0; i < closeWindowButtons.length; i++){
    closeWindowButtons[i].addEventListener("click", HideHiddenWindows);
}

function HideHiddenWindows(event){
    let target = event.target;
    target.parentElement.style.display = "none";

    qrOverlayButton.style.display = "block";
}

function ShowHiddenWindow(windowID){
    let window = document.getElementById(windowID);
    window.style.display = "block";

    qrOverlayButton.style.display = "none";
}

