const docID = "1QdR-rhAUXKioBX6O_77ADhYKNA6EaSEQB0xiHqOHGf4";
const link = `https://docs.google.com/document/d/${docID}/edit?usp=sharing`;
const apiKey = "AIzaSyBHhqGZRJIo90yIk1K-J86C9PU3whMe8CA";

let urlSearch = window.location.search;
let urlParams = new URLSearchParams(urlSearch);

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#safely_detecting_option_support
let passiveSupported = false;
try {
  const options = {
    get passive() {
      // This function will be called when the browser
      // attempts to access the passive property.
      passiveSupported = true;
      return false;
    },
  };

  window.addEventListener("test", null, options);
  window.removeEventListener("test", null, options);
} catch (err) {
  passiveSupported = false;
}

////////////////////////////////
//Load Google Doc contents/////
//////////////////////////////
LoadGoogleDoc();
async function LoadGoogleDoc(){
    await fetch(`https://www.googleapis.com/drive/v3/files/${docID}/export?mimeType=text/plain&key=${apiKey}`)
    .then(function(res) {
        return res.text();
    }).then(function(text) {
      let cards = ParseDoc(text);
      let cardList = document.getElementById("projects-window").querySelector(".project-grid");
      cards.forEach(element => {
        let item = document.createElement("li");
        item.appendChild(element);
        item.id = "project_" + element.querySelector(".title").textContent.replaceAll(' ', '-');
        cardList.appendChild(item);
      });
    }).catch(function(e) {
        let card = CreateCard("none", "Error", e.toString());
        document.getElementById("projects-window").querySelector(".project-grid").appendChild(card);
        console.log(e);
    });
}
//take in doc as text and return array of cards
function ParseDoc(text) {
  let startIndex = text.indexOf("<projects>");
  let endIndex = text.length;
  if (text.indexOf("<blogs>") != -1) {
    if (text.indexOf("<blogs>") < endIndex)
      endIndex = text.indexOf("<blogs>");
  }

  let textArray = text.substring(startIndex, endIndex).split("\r\n");
  let cardsArray = [];
  let index = 1;
  //console.log(textArray);
  while (index < textArray.length) {
    if (textArray[index] === "" || textArray[index] === "</>") {
      index++;
    }
    else {
      //get optional tag, img, title, short desc, desc
      let hasCategoryTag = false;
      let hasLongDesc = false;
      let shortDescIndex = 3;
      let longDescIndex = shortDescIndex + 1;

      let category = "";
      let img = "";
      let title = "";
      let shortDesc = "";
      let longDesc = "";

      if (textArray[index].indexOf('<') == 0 && textArray[index].indexOf('>') > -1) {
        //has a category tag
        hasCategoryTag = true;
        category = textArray[index];
        img = textArray[index + 1];
        title = textArray[index + 2];
        shortDesc = textArray[index + 3] + '\r\n';
        shortDescIndex = 4;
      }
      else {
        img = textArray[index];
        title = textArray[index + 1];
        shortDesc = textArray[index + 2] + '\r\n';
      }

      //fill short description
      while ((textArray[index + shortDescIndex] != "</>" && textArray[index + shortDescIndex] != "<//>") && (index + shortDescIndex) < textArray.length) {
        if (textArray[index + shortDescIndex] === "" && textArray[index + shortDescIndex + 1] === "") {
          shortDesc += '\r\n';
          shortDescIndex += 2;
        }
        else {
          shortDesc += textArray[index + shortDescIndex] + '\r\n';
          shortDescIndex++;
        }
      }
      shortDesc = (shortDesc.lastIndexOf("\r\n") != -1) ? shortDesc.substring(0, shortDesc.lastIndexOf("\r\n")) : shortDesc;


      if (textArray[index + shortDescIndex] === "</>") {
        index += shortDescIndex;
      }
      else {
        hasLongDesc = true;
        longDescIndex = shortDescIndex + 1;
        while (textArray[index + longDescIndex] != "</>" && (index + longDescIndex) < textArray.length) {
          if (textArray[index + longDescIndex] === "" && textArray[index + longDescIndex + 1] === "") {
            longDesc += '\r\n';
            longDescIndex += 2;
          }
          else {
            longDesc += textArray[index + longDescIndex] + '\r\n';
            longDescIndex++;
          }
        }
        longDesc = (longDesc.lastIndexOf("\r\n") != -1) ? longDesc.substring(0, longDesc.lastIndexOf("\r\n")) : longDesc;
        index += longDescIndex;
      }

      //make card
      //add to array
      if (hasLongDesc) {
        if (hasCategoryTag) {
          cardsArray.push(CreateCard(img, title, shortDesc, longDesc, category));
          //console.log("category: " + category + "\nimg: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc + "\nlong desc: " + longDesc);
        }
        else {
          cardsArray.push(CreateCard(img, title, shortDesc, longDesc));
          //console.log("img: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc + "\nlong desc: " + longDesc);
        }
      }
      else {
        if (hasCategoryTag) {
          cardsArray.push(CreateCard(img, title, shortDesc, category));
          //console.log("category: " + category + "\nimg: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc);
        }
        else {
          cardsArray.push(CreateCard(img, title, shortDesc));
          //console.log("img: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc);
        }
      }

    }
  }

  return cardsArray;
}


////////////////////////////////
//add frame functionality//////
//////////////////////////////
const frameArray = Array.from(document.getElementsByClassName("frame"));
for (let i = 0; i < frameArray.length; i++) {
  RegisterSpecificMouseAndTouchEvent(frameArray[i], "mousedown", "touchstart", function(e){ 
    UpdateFrameZOrder(e.currentTarget); 
  });

  if (frameArray[i].classList.contains("fixed") || frameArray[i].classList.contains("absolute")){
    let frameHeader = frameArray[i].getElementsByClassName("frame-header")[0];
    DragElement(frameArray[i], frameHeader, frameHeader.getElementsByClassName("frame-header-title")[0]);
  }

  let closeBtn = frameArray[i].querySelector("[name='close-frame-button']");
  if(closeBtn){
    RegisterMouseAndTouchEvent(closeBtn, function(e){
      e.preventDefault();
      if(e.type == "mouseup" && e.button != 0){
        return;
      }
      HideFrame(e.target.closest(".frame"));
    });
  }

  let fullscreenBtn = frameArray[i].querySelector("[name='fullscreen-frame-button']");
  if(fullscreenBtn){
    RegisterMouseAndTouchEvent(fullscreenBtn, function(e){
      e.preventDefault();
      if(e.type == "mouseup" && e.button != 0){
        return;
      }
      let frame = e.target.closest(".frame");
      ToggleFrameFullscreen(frame);
      UpdateFrameZOrder(frame);
    });
  }
}

let qrOverlay = document.getElementById("qr-overlay");
let qrOverlayButton = document.getElementById("qr-button");
RegisterMouseAndTouchEvent(qrOverlayButton, function(e){
    e.preventDefault();
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

////////////////////////////////
//register menu button events//
//////////////////////////////
let aboutBFirstPush = projectsBFirstPush = linkBFirstPush = window.matchMedia("(pointer: coarse)").matches;
RegisterMouseAndTouchEvent(document.getElementById("link-button"), function(event){
  let frame = document.getElementById("links-window");
  
  event.preventDefault();
  if(event.type == "mouseup" && event.button != 0){
    return;
  }
  if(linkBFirstPush == true){
    linkBFirstPush = false;
    SetFrameFullscreen(frame, true);
  }
  
  UpdateFrameZOrder(frame);
  ShowFrame(frame);
});
RegisterMouseAndTouchEvent(document.getElementById("projects-button"), function(event){
  let frame = document.getElementById("projects-window");
  
  event.preventDefault();
  if(event.type == "mouseup" && event.button != 0){
    return;
  }
  if(projectsBFirstPush == true){
    projectsBFirstPush = false;
    SetFrameFullscreen(frame, true);
  }

  FoldAllDropdownsInContainer(frame);
  UpdateFrameZOrder(frame);
  ShowFrame(frame);
});
RegisterMouseAndTouchEvent(document.getElementById("about-button"), function(event){
  let frame = document.getElementById("about-window");
  event.preventDefault();

  if(event.type == "mouseup" && event.button != 0){
    return;
  }
  if(aboutBFirstPush == true){
    aboutBFirstPush = false;
    SetFrameFullscreen(frame, true);
  }
  UpdateFrameZOrder(frame);
  ShowFrame(frame);
});

//open windows based on url search values
PreOpenWindow();
function PreOpenWindow(){
  let frame = null;

  if(urlParams.has("projects")){
    frame = document.getElementById("projects-window");
    SetFrameFullscreen(frame, projectsBFirstPush);
    UpdateFrameZOrder(frame);
    ShowFrame(frame);
    projectsBFirstPush = false;
  }
  if(urlParams.has("about")){
    frame = document.getElementById("about-window");
    SetFrameFullscreen(frame, aboutBFirstPush);
    UpdateFrameZOrder(frame);
    ShowFrame(frame);
    aboutBFirstPush = false;
  }
  if(urlParams.has("links")){
    frame = document.getElementById("links-window");
    SetFrameFullscreen(frame, linkBFirstPush);
    UpdateFrameZOrder(frame);
    ShowFrame(frame);
    linkBFirstPush = false;
  }
}



////////////////////////////////
//Frame button functions //////
//////////////////////////////
function HideFrame(frame) {
  frame.style.display = "none";
  
  //update url to remove frame
  urlParams.delete(frame.id.split('-')[0]);
  if(urlParams.size == 0){
    history.pushState(null, "", window.location.origin);
  }
  else{
    history.pushState(null, "", ("?" + urlParams.toString()));
  }
}
function ShowFrame(frame) {
  frame.style.display = "block";

  //update url to add frame
  urlParams.set(frame.id.split('-')[0],"");
  history.pushState(null, "", ("?" + urlParams.toString()));
}
function ToggleFrameFullscreen(frame) {
  if (!frame.classList.contains("fullscreen")) {
    SetFrameFullscreen(frame, true);
  }
  else {
    SetFrameFullscreen(frame, false);
  }
}
function SetFrameFullscreen(frame, fullscreen){
  let btn = frame.querySelector("[name='fullscreen-frame-button']");
  if(fullscreen == true && !frame.classList.contains("fullscreen")){
    frame.classList.add("fullscreen");
    if (frame.classList.contains("moveable")) {
      frame.classList.remove("moveable");
    }
    btn.children[0].classList.remove("fa-plus");
    btn.children[0].classList.add("fa-minus");
  }
  else if(fullscreen == false && frame.classList.contains("fullscreen")){
    frame.classList.remove("fullscreen");
    if (!frame.classList.contains("moveable")) {
      frame.classList.add("moveable");
    }
    btn.children[0].classList.add("fa-plus");
    btn.children[0].classList.remove("fa-minus");
  }
}

function UpdateFrameZOrder(frame) {
  let focused = frame;
  if (focused.style.zIndex != frameArray.length.toString()) {
    for (let i = 0; i < frameArray.length; i++) {
      if (frameArray[i] == focused) {
        focused.style.zIndex = frameArray.length.toString();
      }
      else {
        frameArray[i].style.zIndex--;
        if (frameArray[i].style.zIndex < "0") {
          frameArray[i].style.zIndex = "0";
        }
      }
    }
  }

}
function ShownFramesCount() {
  let count = 0;
  for (let i = 0; i < frameArray.length; i++) {
    if (getComputedStyle(frameArray[i]).display != "none") {
      count++;
    }
  }
  return count;
}


//////////////////////////////////////////
//Moveable elements//////////////////////

//an element can be moved by clicking and dragging the element if no handles are passed
// if handles are passed then the element can be moved by dragging those handles
//
//bubbling may cause issues in some cases. (when the element has children that you want to block the movement action)
// because of this The FilterDrag function is used defaultly. To not filter pass handles or the element alone as an object with a property "transparent" set true
// EX: DragElement(element, {handle: element2, transparent: true}); or DragElement({handle: element, transparent: true});
function DragElement(elmnt, ...handles) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  //assign the corrent drag function based on passed in object and possible properties
  if (handles.length == 0) {
    if (elmnt.hasOwnProperty("handle") && elmnt.hasOwnProperty("transparent")) {
      elmnt.handle.addEventListener("mousedown", (elmnt.transparent ? Drag : FilterDrag));
      elmnt.handle.addEventListener("touchstart", (elmnt.transparent ? Drag : FilterDrag), passiveSupported ? { passive: false } : false);
    }
    else {
      elmnt.addEventListener("mousedown", FilterDrag);
      elmnt.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
    }
  }
  else {
    //loop through handles and add drag event to them so they move elmnt
    handles.forEach(hndl => {
      if (hndl.hasOwnProperty("handle")) {
        if (hndl.hasOwnProperty("transparent")) {
          hndl.handle.addEventListener("mousedown", (hndl.transparent ? Drag : FilterDrag));
          hndl.handle.addEventListener("touchstart", (hndl.transparent ? Drag : FilterDrag), passiveSupported ? { passive: false } : false);
        }
        else {
          hndl.handle.addEventListener("mousedown", FilterDrag);
          hndl.handle.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
        }
      }
      else {
        hndl.addEventListener("mousedown", FilterDrag);
        hndl.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
      }
    });
  }

  if (elmnt.hasOwnProperty("handle")) {
    //properties no longer used so we set elmnt to the element to prevent more checks to determin syntax
    elmnt = elmnt.handle;
  }
  elmnt.classList.add("moveable");

  //only move elmnt if clicking on a handle
  function FilterDrag(e) {
    //compare target and current target to fight bubbling
    if (e.target.classList === e.currentTarget.classList) {
      Drag(e);
    }
  }

  //move the elmnt from anywhere inside the elmnt
  function Drag(e) {
    e.preventDefault();
    if (!elmnt.classList.contains("moveable")) {
      return;
    }

    if (e.type == "mousedown") {
      //get the mouse cursor position on down
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener("mouseup", closeDragElement);
      document.addEventListener("mousemove", elementDrag);
    }
    else if (e.type == "touchstart") {
      //get touch position on start
      pos3 = e.changedTouches[0].clientX;
      pos4 = e.changedTouches[0].clientY;
      document.addEventListener("touchend", closeDragElement, passiveSupported ? { passive: false } : false);
      document.addEventListener("touchmove", elementDrag, passiveSupported ? { passive: false } : false);
    }
  }

  function elementDrag(e) {
    e.preventDefault();
    if (!elmnt.classList.contains("moveable")) {
      return;
    }
    //calculate the cursor position
    pos1 = pos3 - (e.clientX || e.changedTouches[0].clientX);
    pos2 = pos4 - (e.clientY || e.changedTouches[0].clientY);
    pos3 = (e.clientX || e.changedTouches[0].clientX);
    pos4 = (e.clientY || e.changedTouches[0].clientY);

    //set the element's new position
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    //stop moving when released
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
    document.removeEventListener("touchend", closeDragElement, passiveSupported ? { passive: false } : false);
    document.removeEventListener("touchmove", elementDrag, passiveSupported ? { passive: false } : false);
  }
}


////////////////////////////////
//Project Cards////////////////
//////////////////////////////
function FoldDropdownText(dropdownWrapper) {
  let header = dropdownWrapper.getElementsByClassName("dropdown-header")[0];
  let body = header.parentElement.querySelector(".dropdown-body");
  let subBody = header.parentElement.querySelector(".dropdown-subBody");
  let toggle = header.getElementsByClassName("toggle")[0];

  if (toggle !== null) {
    if (subBody !== null) {
      if (subBody.classList.contains("folded")) {
        subBody.classList.remove("folded");
        subBody.ariaHidden = "false";
        toggle.innerHTML = "-";
        return false;
      } else {
        subBody.classList.add("folded");
        subBody.ariaHidden = "true";
        toggle.innerHTML = "+";
        return true;
      }
    }
    else if (body !== null) {
      if (body.classList.contains("folded")) {
        body.classList.remove("folded");
        body.ariaHidden = "false";
        toggle.innerHTML = "-";
        return false;
      } else {
        body.classList.add("folded");
        body.ariaHidden = "true";
        toggle.innerHTML = "+";
        return true;
      }
    }
  }
  return false;
}
function FoldAllDropdownsInContainer(container) {
  let dropdowns = container.getElementsByClassName("dropdown-wrapper");
  if (dropdowns && dropdowns.length > 0) {
    for (let i = 0; i < dropdowns.length; i++) {
      let body = dropdowns[i].querySelector(".dropdown-body");
      let subBody = dropdowns[i].querySelector(".dropdown-subBody");
      if (subBody != null) {
        if (!subBody.classList.contains("folded")) {
          subBody.classList.add("folded");
          subBody.ariaHidden = "true";
          dropdowns[i].getElementsByClassName("toggle")[0].innerHTML = "+";
        }
      }
      else if (body !== null) {
        if (!body.classList.contains("folded")) {
          body.classList.add("folded");
          body.ariaHidden = "true";
          dropdowns[i].getElementsByClassName("toggle")[0].innerHTML = "+";
        }
      }
    }
  }
}
function CreateCard(imagePath, title, body, subBody = "", category = "") {
  const template = document.querySelector("template");
  const clone = template.content.querySelector(".dropdown-wrapper").cloneNode(true);

  RegisterMouseAndTouchEvent(clone.querySelector(".dropdown-header"), function (e) {
    if (e.type == "mouseup" && e.button != 0) {
      return;
    }
    if(!FoldDropdownText(e.target.closest(".dropdown-wrapper"))){
      e.target.closest(".dropdown-wrapper").scrollIntoView();
    }
    e.preventDefault();
  });

  if (imagePath.toLowerCase() !== "none") {
    clone.querySelector("img").src = imagePath;
  }
  else {
    clone.removeChild(clone.querySelector(".img-wrapper"));
  }

  AddStringHTMLToElement(clone.querySelector(".title"), title);
  clone.querySelector(".dropdown-header").href = "#project_" + title.replaceAll(' ', '-');

  MultiLineStringToHTML(clone.querySelector(".dropdown-body"), body);

  if (subBody !== "") {
    let sub = clone.querySelector(".dropdown-subBody");
    sub.classList.add("folded");
    sub.ariaHidden = "true";
    MultiLineStringToHTML(sub, subBody);
  }
  else {
    let dorpBody = clone.querySelector(".dropdown-body");
    dorpBody.classList.add("folded");
    dorpBody.ariaHidden = "true";
    clone.removeChild(clone.querySelector(".dropdown-subBody"));
  }

  if(category !== ""){
    clone.dataset.category = category;
  }

  return clone;
}

////////////////////////////////
//tools ///////////////////////
//////////////////////////////
function MultiLineStringToHTML(elmnt, text) {
  let textArray = text.split("<br>").join('\r\n').split('\r\n').join('\n').split('\n');
  if (textArray.length == 1) {
    AddStringHTMLToElement(elmnt, textArray[0]);
  }
  else {
    for (let index = 0; index < textArray.length; index++) {
      if (index > 0) {
        elmnt.appendChild(document.createElement("br"));
      }

      AddStringHTMLToElement(elmnt, textArray[index]);
    }
  }
}

//create and add nodes directly as strings to inner html
function AddStringHTMLToElement(elmnt, text) {
  const tags = ["https://", "<unity>", "<itch>", "<github>"];
  let html = "";

  while (text.length > 0) {
    let tagIndex = text.indexOf("<");
    let linkIndex = text.indexOf(tags[0]);

    if (tagIndex == -1 && linkIndex == -1) {
      html += text;
      break;
    }

    if (tagIndex > -1 && (tagIndex < linkIndex || linkIndex == -1)) {
      let tagEndIndex = text.indexOf(">", tagIndex) + 1;
      let substring = text.substring(tagIndex, tagEndIndex);
      let validTag = false;

      for (let i = 1; i < tags.length; i++) {
        if (substring.indexOf(tags[i]) == 0) {
          validTag = true;
          if (tagIndex != 0) {
            html += text.substring(0, tagIndex);
          }

          let tag = document.createElement("i");
          switch (i) {
            case 1: {
              tag.classList.add("fa-brands");
              tag.classList.add("fa-unity");
              break;
            }
            case 2: {
              tag.classList.add("fa-brands");
              tag.classList.add("fa-itch-io");
              break;
            }
            case 3: {
              tag.classList.add("fa-brands");
              tag.classList.add("fa-github");
              break;
            }
          }
          html += tag.outerHTML;
          text = text.replace(text.substring(0, tagEndIndex), '');
          break;
        }
      }
      if (validTag == false) {
        html += text.substring(0, tagEndIndex);
        text = text.replace(text.substring(0, tagEndIndex), '');
      }

    }
    else if (linkIndex > -1 && (linkIndex < tagIndex || tagIndex == -1)) {
      let endIndex = text.indexOf(" ", linkIndex);
      if (endIndex == -1)
        endIndex = text.length;

      if (text[endIndex - 1] == '.')
        endIndex--;

      html += text.substring(0, linkIndex);
      let link = document.createElement("a");
      link.href = text.substring(linkIndex, endIndex);
      link.innerHTML = link.href;
      html += link.outerHTML;
      text = text.replace(text.substring(0, endIndex), '');
    }
    else {
      console.log(`undefined: linkIndex=${linkIndex} tagIndex=${tagIndex} text='${text}'`);
    }
  }

  elmnt.insertAdjacentHTML("beforeend", html);
}


function RegisterSpecificMouseAndTouchEvent(elmnt, mouseEvent, touchEvent, fnctn) {
  if (elmnt !== null) {
    elmnt.addEventListener(mouseEvent, fnctn);
    elmnt.addEventListener(touchEvent, fnctn);
  }
}
function RegisterMouseAndTouchEvent(elmnt, fnctn) {
  if (elmnt !== null) {
    elmnt.addEventListener("mouseup", fnctn);
    elmnt.addEventListener("touchend", fnctn);
  }
}