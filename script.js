const hiddenWindowArray = [document.getElementById("links-window"), document.getElementById("projects-window"), document.getElementById("about-window")];
var qrOverlay = document.getElementById("qr-overlay");
var qrOverlayButton = document.getElementById("qr-button");

document.getElementById("link-button").addEventListener("click", function(){
    UpdateWindowZOrder("links-window");
    ShowHiddenWindow("links-window")
});
document.getElementById("projects-button").addEventListener("click", function(){
    UpdateWindowZOrder("projects-window");
    HideAllDropdownsInElement("projects-window");
    ShowHiddenWindow("projects-window");
});
document.getElementById("about-button").addEventListener("click", function(){
    UpdateWindowZOrder("about-window");
    ShowHiddenWindow("about-window")
});

var closeWindowButtons = document.getElementsByClassName("close-hidden-window-button");
for(let i = 0; i < closeWindowButtons.length; i++){
    closeWindowButtons[i].addEventListener("click", HideHiddenWindows);
}

var dropdownButtons= document.getElementsByClassName("project-dropdown-button");
for(let i = 0; i < dropdownButtons.length; i++){
    dropdownButtons[i].addEventListener("click", ToggleDropdown);
}

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


function SetWindowDisplayNone(event){
    event.target.style.display = "none";
}
function HideHiddenWindows(event){
    let target = event.target;
    //toggle animation by swapping out classes
    if(target.parentElement.classList.contains("hidden-window-animation")){
        target.parentElement.classList.remove("hidden-window-animation");

        void target.parentElement.offsetWidth;

        target.parentElement.classList.add("hidden-window-animation-reverse");
    }

    target.parentElement.addEventListener("animationend", SetWindowDisplayNone);

    if(OpenWindows() <= 1){
        qrOverlayButton.style.display = "block";
    }
}
function ShowHiddenWindow(windowID){
    let window = document.getElementById(windowID);
    window.style.top = "50%";
    window.style.left = "50%";
    window.style.display = "block";

    window.removeEventListener("animationend", SetWindowDisplayNone);
    if(!window.classList.contains("hidden-window-animation") && !window.classList.contains("hidden-window-animation-reverse")){
        window.classList.add("hidden-window-animation");
    }
    else if(window.classList.contains("hidden-window-animation-reverse")){
        window.classList.remove("hidden-window-animation-reverse");

        void window.offsetWidth;

        window.classList.add("hidden-window-animation");
    }

    qrOverlayButton.style.display = "none";
}

function ToggleDropdown(event){
    let target = event.target.nextElementSibling;

    if(target.style.display == "block"){
        target.style.display = "none";
    }
    else{
        target.style.display = "block";
    }    
}

function HideAllDropdownsInElement(elementID){
    let dropdowns = document.getElementById(elementID).getElementsByClassName("project-dropdown");
    if(dropdowns && dropdowns.length > 0){
        for(let i = 0; i < dropdowns.length; i++){
            dropdowns[i].style.display = "none";
        }
    }
}

for(let i = 0; i < hiddenWindowArray.length; i++){
    dragElement(hiddenWindowArray[i].getElementsByClassName("hidden-window-title-bar")[0], true);
}
function dragElement(elmnt, moveParent = false) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
    // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }  
    
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();

      UpdateWindowZOrder(elmnt.parentElement.id);

      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      if(moveParent){
        elmnt.parentElement.style.top = (elmnt.parentElement.offsetTop - pos2) + "px";
        elmnt.parentElement.style.left = (elmnt.parentElement.offsetLeft - pos1) + "px";
      }
      else{
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }
    }
  
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
}

function UpdateWindowZOrder(focusedWindowID){
    let focused = document.getElementById(focusedWindowID);
    for(let i = 0; i < hiddenWindowArray.length; i++){
        if(hiddenWindowArray[i].id == focusedWindowID){
            focused.style.zIndex = "3";
        }
        else{
            hiddenWindowArray[i].style.zIndex--;
            if(hiddenWindowArray[i].style.zIndex < "0"){
                hiddenWindowArray[i].style.zIndex = "0";
            }
        }
    }
}

function OpenWindows(){
    let count = 0;
    for(let i = 0; i < hiddenWindowArray.length; i++){
        if(getComputedStyle(hiddenWindowArray[i]).display != "none"){
            count++;
        }
    }
    return count;
}