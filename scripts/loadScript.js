const docID = "1QdR-rhAUXKioBX6O_77ADhYKNA6EaSEQB0xiHqOHGf4";
const link = `https://docs.google.com/document/d/${docID}/edit?usp=sharing`;
const apiKey = "AIzaSyBHhqGZRJIo90yIk1K-J86C9PU3whMe8CA";

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

LoadGoogleDoc();
async function LoadGoogleDoc(){
    await fetch(`https://www.googleapis.com/drive/v3/files/${docID}/export?mimeType=text/plain&key=${apiKey}`)
    .then(function(res) {
        return res.text();
    }).then(function(text) {
      let cards = ParseDoc(text);
      cards.forEach(element => {
        document.getElementById("projects-window").querySelector(".project-grid").appendChild(element);
      });
    }).catch(function(e) {
        let card = CreateCard("none", "Error", e.toString());
        document.getElementById("projects-window").querySelector(".project-grid").appendChild(card);
        console.log(e);
    });
}

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
      if(e.type == "mouseup" && e.button != 0){
        return;
      }
      HideFrame(e.target.closest(".frame"));
    });
  }

  let fullscreenBtn = frameArray[i].querySelector("[name='fullscreen-frame-button']");
  if(fullscreenBtn){
    RegisterMouseAndTouchEvent(fullscreenBtn, function(e){
      if(e.type == "mouseup" && e.button != 0){
        return;
      }
      let frame = e.target.closest(".frame");
      FullscreenFrame(frame);
      UpdateFrameZOrder(frame);
    });
  }
}

RegisterMouseAndTouchEvent(document.getElementById("link-button"), function(event){
  UpdateFrameZOrder(document.getElementById("links-window"));
  ShowFrame(document.getElementById("links-window"));
  event.preventDefault();
});
RegisterMouseAndTouchEvent(document.getElementById("projects-button"), function(event){
  FoldAllDropdownsInContainer(document.getElementById("projects-window"));
  UpdateFrameZOrder(document.getElementById("projects-window"));
  ShowFrame(document.getElementById("projects-window"));
  event.preventDefault();
});
RegisterMouseAndTouchEvent(document.getElementById("about-button"), function(event){
  UpdateFrameZOrder(document.getElementById("about-window"));
  ShowFrame(document.getElementById("about-window"));
  event.preventDefault();
});


////////////////////////////////
//Frames //////////////////////
//////////////////////////////
function HideFrame(frame) {
  frame.style.display = "none";
}
function ShowFrame(frame) {
  frame.style.display = "block";
}
function FullscreenFrame(frame) {
  let btn = frame.querySelector("[name='fullscreen-frame-button']");
  if (!frame.classList.contains("fullscreen")) {
    frame.classList.add("fullscreen");

    btn.children[0].classList.remove("fa-light", "fa-square");
    btn.children[0].classList.add("fa-regular", "fa-window-restore", "fa-xs");

    if (frame.classList.contains("moveable")) {
      frame.classList.remove("moveable");
    }
  }
  else {
    frame.classList.remove("fullscreen");

    btn.children[0].classList.add("fa-light", "fa-square");
    btn.children[0].classList.remove("fa-regular", "fa-window-restore", "fa-xs");

    if (!frame.classList.contains("moveable")) {
      frame.classList.add("moveable");
    }
  }
}
function ShownFramesCount(){
  let count = 0;
  for(let i = 0; i < frameArray.length; i++){
      if(getComputedStyle(frameArray[i]).display != "none"){
          count++;
      }
  }
  return count;
}

//////////////////////////////////////////
//Moveable frames/////////////////////////

//an element can be moved by clicking and dragging the element if no handles are passed
// if handles are passed then the element can be moved by dragging those handles
//
//bubbling may cause issues in some cases. (when the element has children that you want to block the movement action)
// because of this The FilterDrag function is used defaultly. To not filter pass handles or the element alone as an object with a property "transparent" set true
// EX: DragElement(element, {handle: element2, transparent: true}); or DragElement({handle: element, transparent: true});
function DragElement(elmnt, ...handles){
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  //assign the corrent drag function based on passed in object and possible properties
  if(handles.length == 0){
    if(elmnt.hasOwnProperty("handle") && elmnt.hasOwnProperty("transparent")){
      elmnt.handle.addEventListener("mousedown", (elmnt.transparent ? Drag : FilterDrag));
      elmnt.handle.addEventListener("touchstart", (elmnt.transparent ? Drag : FilterDrag), passiveSupported ? { passive: false } : false);
    }
    else{
      elmnt.addEventListener("mousedown", FilterDrag);
      elmnt.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
    }
  }
  else{
    //loop through handles and add drag event to them so they move elmnt
    handles.forEach(hndl => {
      if(hndl.hasOwnProperty("handle")){
        if(hndl.hasOwnProperty("transparent")){
          hndl.handle.addEventListener("mousedown", (hndl.transparent ? Drag : FilterDrag));
          hndl.handle.addEventListener("touchstart", (hndl.transparent ? Drag : FilterDrag), passiveSupported ? { passive: false } : false);
        }
        else{
          hndl.handle.addEventListener("mousedown", FilterDrag);
          hndl.handle.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
        }
      }
      else{
        hndl.addEventListener("mousedown", FilterDrag);
        hndl.addEventListener("touchstart", FilterDrag, passiveSupported ? { passive: false } : false);
      }
    });
  }

  if(elmnt.hasOwnProperty("handle")){
    //properties no longer used so we set elmnt to the element to prevent more checks to determin syntax
    elmnt = elmnt.handle;
  }
  elmnt.classList.add("moveable");

  //only move elmnt if clicking on a handle
  function FilterDrag(e){
    //compare target and current target to fight bubbling
    if(e.target.classList === e.currentTarget.classList){
      Drag(e);
    }
  }
  
  //move the elmnt from anywhere inside the elmnt
  function Drag(e){
    e.preventDefault();
    if(!elmnt.classList.contains("moveable")){
      return;
    }
    
    if(e.type == "mousedown"){
      //get the mouse cursor position on down
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener("mouseup", closeDragElement);
      document.addEventListener("mousemove", elementDrag);
    }
    else if(e.type == "touchstart"){
      //get touch position on start
      pos3 = e.changedTouches[0].clientX;
      pos4 = e.changedTouches[0].clientY;
      document.addEventListener("touchend", closeDragElement, passiveSupported ? { passive: false } : false);
      document.addEventListener("touchmove", elementDrag, passiveSupported ? { passive: false } : false);
    }
  }

  function elementDrag(e) {
    e.preventDefault();
    if(!elmnt.classList.contains("moveable")){
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

//////////////////////////////////////////
//Dynamic frames//////////////////////////
function CreateFixedFrame(header, body, buttons = "") {
  let frame = CreateFrame(header, body, buttons);
  frame.classList.add("fixed");
  DragElement(frame, frame.getElementsByClassName("frame-header")[0], frame.getElementsByClassName("frame-header-title")[0]);
  return frame;
}
function CreateAbsoluteFrame(header, body, buttons = "") {
  let frame = CreateFrame(header, body, buttons);
  frame.querySelector(".frame").classList.add("absolute");
  DragElement(frame, frame.getElementsByClassName("frame-header")[0], frame.getElementsByClassName("frame-header-title")[0]);
  return frame;
}
function CreateFrame(header, body, buttons = "") {
  const template = document.querySelector("template");

  const clone = template.content.querySelector(".frame").cloneNode(true);

  clone.querySelector(".frame-header-title").append(header);
  clone.querySelector(".frame-body").append(body);
  clone.style.setProperty("z-index", frameArray.length);
  RegisterSpecificMouseAndTouchEvent(clone, "mousedown", "touchstart", function(e){ UpdateFrameZOrder(e.currentTarget); });
  AddFrameButton(clone, "close");

  let btnList = buttons.split(" ");
  if (btnList.length > 0) {
    btnList.forEach(btnName => {
      if (btnName !== "close") {
        AddFrameButton(clone, btnName);
      }
    });
  }

  return clone;
}
function AddFrameButton(frame, button) {
  let buttonContainer = frame.querySelector(".frame-header-button-container");
  let btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("frame-header-button");

  switch (button) {
    case "close": {
      btn.name = "close-frame-button";
      btn.classList.add("red-hover");
      btn.innerHTML = "X";
      RegisterMouseAndTouchEvent(btn, function(e){
        if(e.type == "mouseup" && e.button != 0){
          return;
        }
        HideFrame(e.target.closest(".frame"));
        e.preventDefault();
      });
      break;
    }
    case "fullscreen": {
      btn.name = "fullscreen-frame-button";
      btn.classList.add("cyan-hover", "icon-button");
      let icon = document.createElement("i");
      icon.classList.add("fa-sharp", "fa-light", "fa-square");
      btn.appendChild(icon);
      RegisterMouseAndTouchEvent(btn, function(e){
        if(e.type == "mouseup" && e.button != 0){
          return;
        }
        FullscreenFrame(e.target.closest(".frame"));
        e.preventDefault();
      });
      break;
    }
    default: return;
  }
  buttonContainer.appendChild(btn);
}


////////////////////////////////
//Project Cards////////////////
//////////////////////////////
function FoldDropdownText(dropdownWrapper) {
  let header = dropdownWrapper.getElementsByClassName("dropdown-header")[0];
  let body = header.parentElement.querySelector(".dropdown-body");
  let subBody = header.parentElement.querySelector(".dropdown-subBody");
  let toggle = header.getElementsByClassName("toggle")[0];

  if (toggle !== null){
    if(subBody !== null){
      if (subBody.classList.contains("folded")) {
        subBody.classList.remove("folded");
        subBody.ariaHidden = "false";
        toggle.innerHTML = "-";
      } else {
        subBody.classList.add("folded");
        subBody.ariaHidden = "true";
        toggle.innerHTML = "+";
      }
    }
    else if(body !== null){
      if (body.classList.contains("folded")) {
        body.classList.remove("folded");
        body.ariaHidden = "false";
        toggle.innerHTML = "-";
      } else {
        body.classList.add("folded");
        body.ariaHidden = "true";
        toggle.innerHTML = "+";
      }
    }
  }
}
function FoldAllDropdownsInContainer(container){
    let dropdowns = container.getElementsByClassName("dropdown-wrapper");
    if(dropdowns && dropdowns.length > 0){
        for(let i = 0; i < dropdowns.length; i++){
          let body = dropdowns[i].querySelector(".dropdown-body");
          let subBody = dropdowns[i].querySelector(".dropdown-subBody");
          if(subBody != null){
            if(!subBody.classList.contains("folded")){
              subBody.classList.add("folded");
              subBody.ariaHidden = "true";
              dropdowns[i].getElementsByClassName("toggle")[0].innerHTML = "+";
            }
          }
          else if(body !== null){
            if(!body.classList.contains("folded")){
              body.classList.add("folded");
              body.ariaHidden = "true";
              dropdowns[i].getElementsByClassName("toggle")[0].innerHTML = "+";
            }
          }
        }
    }
}
function CreateCard(imagePath, title, body, subBody = "") {
  const template = document.querySelector("template");
  const clone = template.content.querySelector(".dropdown-wrapper").cloneNode(true);

  RegisterMouseAndTouchEvent(clone.querySelector(".toggle"), function(e){
    if(e.type == "mouseup" && e.button != 0){
      return;
    }
    FoldDropdownText(e.target.closest(".dropdown-wrapper"));
    e.preventDefault();
  });

  if(imagePath.toLowerCase() !== "none"){
    clone.querySelector("img").src = imagePath;
  }
  else{
    clone.removeChild(clone.querySelector(".img-wrapper"));
  }
    
  AddStringHTMLToElement(clone.querySelector(".title"), title);
  MultiLineStringToHTML(clone.querySelector(".dropdown-body"), body);

  if(subBody !== ""){
    let sub = document.createElement("div");
    sub.classList.add("dropdown-subBody", "folded");
    sub.ariaHidden = "true";
    MultiLineStringToHTML(sub, subBody);
    clone.appendChild(sub);
  }
  else{
    let dorpBody = clone.querySelector(".dropdown-body");
    dorpBody.classList.add("folded");
    dorpBody.ariaHidden = "true";
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
  else{
    for (let index = 0; index < textArray.length; index++) {
      if (index > 0){
        elmnt.appendChild(document.createElement("br"));
      }
      
      AddStringHTMLToElement(elmnt, textArray[index]);
    }
  }
}

//create and add nodes directly as strings to inner html
function AddStringHTMLToElement(elmnt, text){
  const tags = ["https://", "<unity>", "<itch>", "<github>"];
  let html = "";

  while(text.length > 0){
    let tagIndex  = text.indexOf("<");
    let linkIndex = text.indexOf(tags[0]);
  
    if(tagIndex == -1 && linkIndex == -1){
      html += text;
      break;
    }

    if(tagIndex > -1 && (tagIndex < linkIndex || linkIndex == -1)){
      let tagEndIndex = text.indexOf(">", tagIndex) + 1;
      let substring = text.substring(tagIndex, tagEndIndex);
      let validTag = false;

      for (let i = 1; i < tags.length; i++) {
        if(substring.indexOf(tags[i]) == 0){
          validTag = true;
          if(tagIndex != 0){
            html += text.substring(0, tagIndex);
          }
          
          let tag = document.createElement("i");
          switch(i){
            case 1:{
              tag.classList.add("fa-brands");
              tag.classList.add("fa-unity");
              break;
            }
            case 2:{
              tag.classList.add("fa-brands");
              tag.classList.add("fa-itch-io");
              break;
            }
            case 3:{
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
      if(validTag == false){
        html += text.substring(0, tagEndIndex);
        text = text.replace(text.substring(0, tagEndIndex), '');
      }

    }
    else if(linkIndex > -1 && (linkIndex < tagIndex || tagIndex == -1)){
      let endIndex = text.indexOf(" ", linkIndex);
      if(endIndex == -1)
        endIndex = text.length;

      if(text[endIndex - 1] == '.')
        endIndex--;

      html += text.substring(0, linkIndex);
      let link = document.createElement("a");
      link.href = text.substring(linkIndex, endIndex);
      link.innerHTML = link.href;
      html += link.outerHTML;
      text = text.replace(text.substring(0, endIndex), '');
    }
    else{
      console.log(`undefined: linkIndex=${linkIndex} tagIndex=${tagIndex} text='${text}'`);
    }
  }  
  
  elmnt.insertAdjacentHTML("beforeend", html);
}

//take in doc as text and return array of cards
function ParseDoc(text){
  let startIndex = text.search("<projects>");
  let endIndex = text.length;
  if(text.search("<blogs>") != -1){
    if(text.search("<blogs>") < endIndex)
      endIndex = text.search("<blogs>");
  }

  let textArray = text.substring(startIndex, endIndex).split("\r\n");
  let cardsArray = [];
  let index = 1;
  //console.log(textArray);
  while(index < textArray.length){
    if(textArray[index] === "" || textArray[index] === "</>"){
      index++;
    }
    else{
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

      if(textArray[index].search('<') == 0 && textArray[index].search('>') > -1){
        //has a category tag
        hasCategoryTag = true;
        category = textArray[index];
        img = textArray[index + 1];
        title = textArray[index + 2];
        shortDesc = textArray[index + 3] + '\r\n';
        shortDescIndex = 4;
      }
      else{
        img = textArray[index];
        title = textArray[index + 1];
        shortDesc = textArray[index + 2] + '\r\n';
      }
      
      //fill short description
      while((textArray[index + shortDescIndex] != "</>" && textArray[index + shortDescIndex] != "<//>") && (index + shortDescIndex) < textArray.length){
        if(textArray[index + shortDescIndex] === "" && textArray[index + shortDescIndex + 1] === ""){
          shortDesc += '\r\n';
          shortDescIndex += 2;
        }
        else{
          shortDesc += textArray[index + shortDescIndex] + '\r\n';
          shortDescIndex++;
        }
      }
      shortDesc = (shortDesc.lastIndexOf("\r\n") != -1) ? shortDesc.substring(0, shortDesc.lastIndexOf("\r\n")) : shortDesc;


      if(textArray[index + shortDescIndex] === "</>"){
        index += shortDescIndex;
      }
      else{
        hasLongDesc = true;
        longDescIndex = shortDescIndex + 1;
        while(textArray[index + longDescIndex] != "</>" && (index + longDescIndex) < textArray.length){
          if(textArray[index + longDescIndex] === "" && textArray[index + longDescIndex + 1] === ""){
            longDesc += '\r\n';
            longDescIndex += 2;
          }
          else{
            longDesc += textArray[index + longDescIndex] + '\r\n';
            longDescIndex++;
          }
        }
        longDesc = (longDesc.lastIndexOf("\r\n") != -1) ? longDesc.substring(0, longDesc.lastIndexOf("\r\n")) : longDesc;
        index += longDescIndex;
      }
      
      //make card
      //add to array
      if(hasLongDesc){
        if(hasCategoryTag){
          //console.log("category: " + category + "\nimg: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc + "\nlong desc: " + longDesc);
        }
        else{
          cardsArray.push(CreateCard(img, title, shortDesc, longDesc));
          //console.log("img: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc + "\nlong desc: " + longDesc);
        }
      }
      else{
        if(hasCategoryTag){
          //console.log("category: " + category + "\nimg: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc);
        }
        else{
          cardsArray.push(CreateCard(img, title, shortDesc));
          //console.log("img: " + img + "\ntitle: " + title + "\ndesc: " + shortDesc);
        }
      }
      
    }
  }

  return cardsArray;
}


function RegisterSpecificMouseAndTouchEvent(elmnt, mouseEvent, touchEvent, fnctn){
  if(elmnt !== null){
    elmnt.addEventListener(mouseEvent, fnctn);
    elmnt.addEventListener(touchEvent, fnctn);
  }
}
function RegisterMouseAndTouchEvent(elmnt, fnctn){
  if(elmnt !== null){
    elmnt.addEventListener("mouseup", fnctn);
    elmnt.addEventListener("touchend", fnctn);
  }
}