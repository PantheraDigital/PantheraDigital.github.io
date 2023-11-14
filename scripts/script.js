const hiddenWindowArray = [document.getElementById("links-window"), document.getElementById("projects-window"), document.getElementById("about-window")];
var qrOverlay = document.getElementById("qr-overlay");
var qrOverlayButton = document.getElementById("qr-button");

document.getElementById("qr-button").addEventListener("click", function(){
    if(this.style.backgroundImage == "none"){
        this.style.backgroundImage = "url('./Pics/QR.png')";
        this.style.color = "rgba(255, 255, 255, 0)";
        this.style.zIndex = 0;
        qrOverlay.style.display = "none";
    }
    else{
        this.style.backgroundImage = "none";
        this.style.color = "black";
        this.style.zIndex = 1001;
        qrOverlay.style.display = "block";
    }
});