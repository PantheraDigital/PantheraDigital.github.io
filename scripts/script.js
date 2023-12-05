const hiddenWindowArray = [document.getElementById("links-window"), document.getElementById("projects-window"), document.getElementById("about-window")];
var qrOverlay = document.getElementById("qr-overlay");
var qrOverlayButton = document.getElementById("qr-button");

RegisterMouseAndTouchEvent(qrOverlayButton, function(e){
    e.preventDefault();
    if(e.target.classList !== e.currentTarget.classList){
        return;
    }
    if(qrOverlayButton.style.backgroundImage == "none"){
        qrOverlayButton.style.backgroundImage = "url('./Pics/QR.png')";
        qrOverlayButton.style.color = "rgba(255, 255, 255, 0)";
        qrOverlayButton.style.zIndex = 0;
        qrOverlay.style.display = "none";
    }
    else{
        qrOverlayButton.style.backgroundImage = "none";
        qrOverlayButton.style.color = "black";
        qrOverlayButton.style.zIndex = 1001;
        qrOverlay.style.display = "block";
    }
});

function RegisterMouseAndTouchEvent(elmnt, fnctn){
    if(elmnt !== null){
      elmnt.addEventListener("mouseup", fnctn);
      elmnt.addEventListener("touchend", fnctn);
    }
  }