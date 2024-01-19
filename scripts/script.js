const projectDocID = "1QdR-rhAUXKioBX6O_77ADhYKNA6EaSEQB0xiHqOHGf4";
const blogDocID = "1AqB-qUFwaGI5-mfEfUVkTaEIPRo5DlVwvnI2wsWmRDI";
const link = `https://docs.google.com/document/d/${projectDocID}/edit?usp=sharing`;
const apiKey = "AIzaSyBHhqGZRJIo90yIk1K-J86C9PU3whMe8CA";

const projectDataArray = [];
const blogDataArray = [];

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
(function () {
  const projectText = localStorage.getItem("projects");
  const time = localStorage.getItem("projecttime");
  if(projectText && time && Date.now() < time){//no api call if data is stored and current
    AddProjectsToDOM(projectText);
  }
  else{//call api to get text and parse
    ParseDoc(projectDocID, 
      function(text) {
        AddProjectsToDOM(text);
        localStorage.setItem("projects", text.substring(text.indexOf("<projects>"), text.length));
        localStorage.setItem("projecttime", Date.now() + (60000 * 60 * 48));
      },
      function(e) {
        let card = CreateProjectCard("none", "Error", e.toString());
        document.getElementById("projects-window").querySelector(".project-grid").appendChild(card);
      });
  }
  function AddProjectsToDOM(text){
    let categoriesArray = ParseDocProjects(text);
    let projectGrid = document.getElementById("projects-window").querySelector(".project-grid");
    categoriesArray.forEach(cat => {
      const template = document.querySelector("template");
      const clone = template.content.querySelector(".category-dropdown").cloneNode(true);
      let item = document.createElement("li");

      clone.querySelector(".title").textContent = cat;
      item.appendChild(clone);
      item.id = "category_" + cat;
      clone.querySelector(".toggle").innerHTML = clone.querySelector(".toggle").getAttribute("data-prime");
      projectGrid.appendChild(item);

      RegisterMouseAndTouchEvent(clone.querySelector(".header"), function (e) {
        if (e.type == "mouseup" && e.button != 0) 
        { return; }
        let body = clone.querySelector(".body");
        let button = clone.querySelector(".toggle");

        if(body.classList.contains("folded")){
          body.classList.remove("folded");
          clone.scrollIntoView();
          if(button){ button.innerHTML = button.getAttribute("data-prime"); }
        }
        else{
          body.classList.add("folded");
          FoldProjectCardsInContainer(body);
          if(button){ button.innerHTML = button.getAttribute("data-alt"); }
        }
        e.preventDefault();
      });
    });

    projectDataArray.forEach(object =>{
      let card = CreateProjectCard(object.img, object.title, object.shortDesc, object.longDesc, object.category, (object.category === "Certifications"));
      let item = document.createElement("li");
      item.appendChild(card);
      item.id = "project_" + object.title.replaceAll(' ', '-');
      if(object.category){
        projectGrid.querySelector("#category_" + object.category).querySelector(".project-list").appendChild(item);
      }
      else{
        projectGrid.insertBefore(item, projectGrid.querySelector("#category_" + categoriesArray[0]));
      }
    });
  };
})();
(function () {
  const blogText = localStorage.getItem("blogs");
  const time = localStorage.getItem("blogtime");
  if(blogText && time && Date.now() < time){
    ParseDocBlogs(blogText);
  }
  else{
    ParseDoc(blogDocID, 
      function(text){
        ParseDocBlogs(text);
        localStorage.setItem("blogs", text.substring(text.indexOf("<blogs>"), text.length));
        localStorage.setItem("blogtime", Date.now() + (60000 * 60 * 48));
      },
      function(e){
        console.log(e.toString());
      });
  }
})();


async function ParseDoc(docID, textParser, errorCall){
  await fetch(`https://www.googleapis.com/drive/v3/files/${docID}/export?mimeType=text/plain&key=${apiKey}`)
  .then(function(res) {
      return res.text();
  }).then(textParser
  ).catch(errorCall);
}

//take in doc as text and return array of cards
function ParseDocProjects(text){
  let textArray = text.substring(text.indexOf("<projects>"), text.length).split("\r\n");
  let categoryArray = [];
  let index = 1;

  while (index < textArray.length){
    if (textArray[index] === "" || textArray[index] === "</>") {
      index++;
      continue;
    }

    let projectObj = {
      "title": "",
      "category": "",
      "img": "",
      "shortDesc": "",
      "longDesc": ""
    };

    projectObj.title = textArray[index++];
    if (textArray[index].indexOf('<') == 0 && textArray[index].indexOf('>') > -1){
      projectObj.category = textArray[index].substring(1, textArray[index].length - 1);
      if(projectObj.category !== "none" && projectObj.category !== "" && !categoryArray.includes(projectObj.category)){
        categoryArray.push(projectObj.category);
      }
      index++;
    }
    projectObj.img = textArray[index++];

    let projectText = "";
    for( ;index < textArray.length; index++){
      if(textArray[index] === "</>") { //end of project
        index++;
        if(projectObj.shortDesc === ""){
          projectObj.shortDesc = projectText;
        }
        else{
          projectObj.longDesc = projectText;
        }
        break;
      }
      else if(textArray[index] === "<//>"){ //end of short desc
        projectObj.shortDesc = projectText;
        projectText = "";
        continue;
      }

      projectText += textArray[index] + "\r\n";
      if(textArray[index] === "" && textArray[index + 1] === ""){
        index++;  
      }
    }
    projectDataArray.push(projectObj);
  }

  return categoryArray;
}
function ParseDocBlogs(text){
  let textArray = text.substring(text.indexOf("<blogs>"), text.length).split("\r\n");
  let index = 1; //skip <blogs> tag

  while(index < textArray.length){
    if(textArray[index] === ""){
      index++;
      continue;
    }
    
    let blog = {
      "title": textArray[index++],
      "desc": "",
      "body": "",
      "data": ""
    };

    let blogText = "";
    for( ;index < textArray.length; index++){
      if(textArray[index] === "</>") { 
        index++;
        blog.body = blogText;
        break;
      }
      else if(textArray[index] === "<//>"){ 
        blog.desc = blogText;
        blogText = "";
        continue;
      }

      blogText += textArray[index] + "\r\n";
      if(textArray[index] === "" && textArray[index + 1] === ""){
        index++;  
      }
    }
    
    if(textArray[index].includes("{")){
      if(textArray[index].includes("}")){
        blog.data = textArray[index].substring(textArray[index].indexOf("{") + 1, textArray[index].indexOf("}"));
        index++;
      }
      else{
        for( ;index < textArray.length; index++){
          if(textArray[index].includes("{")){
            blog.data = textArray[index].substring(textArray[index].indexOf("{") + 1, textArray[index].length) + " ";
          }
          else if(textArray[index].includes("}")){
            blog.data += textArray[index].substring(0, textArray[index].indexOf("}"));
            index++;
            break;
          }
          else{
            blog.data += textArray[index].substring(0, textArray[index].length) + " ";
          }
        }
      }
    }
    
    blogDataArray.push(blog);
  }
  console.log(blogDataArray);
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

  FoldProjectCardsInContainer(frame);
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
//tools ///////////////////////
//////////////////////////////
function MultiLineStringToHTML(elmnt, text) {
  let textArray = text.split(/<br>|\r\n|\n/g);
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

    if (tagIndex === -1 && linkIndex === -1) {
      html += text;
      break;
    }

    if (tagIndex > -1 && (tagIndex < linkIndex || linkIndex === -1)) {
      let tagEndIndex = text.indexOf(">", tagIndex) + 1;
      let substring = text.substring(tagIndex, tagEndIndex);
      let validTag = false;

      for (let i = 1; i < tags.length; i++) {
        if (substring.indexOf(tags[i]) === 0) {
          validTag = true;
          if (tagIndex != 0) {
            html += text.substring(0, tagIndex);
          }

          let tag = document.createElement("i");
          tag.classList.add("fa-brands");
          switch (i) {
            case 1: {
              tag.classList.add("fa-unity");
              break;
            }
            case 2: {
              tag.classList.add("fa-itch-io");
              break;
            }
            case 3: {
              tag.classList.add("fa-github");
              break;
            }
          }
          html += tag.outerHTML;
          text = text.replace(text.substring(0, tagEndIndex), '');
          break;
        }
      }
      if (validTag === false) {
        html += text.substring(0, tagEndIndex);
        text = text.replace(text.substring(0, tagEndIndex), '');
      }
    }
    else if (linkIndex > -1 && (linkIndex < tagIndex || tagIndex === -1)) {
      let endIndex = text.indexOf(" ", linkIndex);
      if (endIndex == -1)
        endIndex = text.length;

      if (text[endIndex - 1] === '.')
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

function RegisterSpecificMouseAndTouchEvent(elmnt, mouseEvent, touchEvent, fnc) {
  if (elmnt !== null) {
    elmnt.addEventListener(mouseEvent, fnc);
    elmnt.addEventListener(touchEvent, fnc, {passive: true});
  }
}
function RegisterMouseAndTouchEvent(elmnt, fnc) {
  if (elmnt !== null) {
    elmnt.addEventListener("mouseup", fnc);
    elmnt.addEventListener("touchend", fnc);
  }
}



//---assign ripple effect on click
RegisterSpecificMouseAndTouchEvent(document.getElementById("background"), "mousedown", "touchstart", createRipple);
function createRipple(event) {
    event.preventDefault();
    let element = event.currentTarget;
    let circle = document.createElement("span");
    let diameter = document.documentElement.clientWidth * 0.40;//40% view width
    let radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    if (event.type == "mousedown"){
      circle.style.left = `${event.clientX - radius}px`;
      circle.style.top = `${event.clientY - radius}px`;
    }
    else if (event.type == "touchstart"){
      circle.style.left = `${event.changedTouches[0].clientX - radius}px`;
      circle.style.top = `${event.changedTouches[0].clientY - radius}px`;
    }
    circle.classList.add("ripple");

    let ripple = element.getElementsByClassName("ripple")[0];

    if (ripple) {
        ripple.remove();
    }

    //---this will place wave above all shapes
    //element.appendChild(circle);

    //---this will place the wave bellow all elements
    element.insertBefore(circle, element.firstChild);
}


function FoldProjectCardsInContainer(container){
  let projects = container.getElementsByClassName("card-wrapper");
  if (projects && projects.length > 0){
    for (let i = 0; i < projects.length; i++){
      let subBody = projects[i].querySelector(".subBody");
      let targetBody = subBody ? subBody : projects[i].querySelector(".body");
      
      if (targetBody != null) {
        if (!targetBody.classList.contains("folded")) {    
          const btn = projects[i].querySelector(".two-step-button");
          btn.innerHTML = btn.getAttribute("data-prime");

          targetBody.classList.add("folded");
          targetBody.ariaHidden = true; 
        }
      }
    }
  }
}
function CreateProjectCard(imagePath, title, body, subBody = "", category = "", removeButton = false){
  const template = document.querySelector("template");
  const clone = template.content.querySelector(".card-wrapper").cloneNode(true);

  clone.querySelector(".flex").classList.add("reverse");
  clone.style.setProperty("--border-color", "slateblue");
  clone.querySelector(".card-heading").style.setProperty("--underline-color", "lightskyblue");

  if(imagePath.toLowerCase() === "none"){
    clone.querySelector(".flex").removeChild(clone.querySelector(".card-img"));
  } else {
    clone.querySelector(".card-img").src = imagePath;
    clone.querySelector(".card-img").classList.add("right")
  }

  //fill card with text and add to grid
  AddStringHTMLToElement(clone.querySelector(".card-heading"), title);
  MultiLineStringToHTML(clone.querySelector(".body"), body);

  if(subBody !== ""){
    let sub = document.createElement("div");
    sub.classList.add("subBody", "folded");
    sub.ariaHidden = "true";
    MultiLineStringToHTML(sub, subBody);
    clone.appendChild(sub);
  }
  else{
    clone.querySelector(".body").ariaHidden = true;
    clone.querySelector(".body").classList.add("folded");
  }

  if (category !== ""){ clone.setAttribute('data-category', category); }

  if (removeButton){
    clone.removeChild(clone.querySelector(".two-step-button"));
    if(imagePath.toLowerCase() !== "none"){
      clone.querySelector(".card-img").classList.add("btn-ignore");
    }
  } else { 
    const btn = clone.querySelector(".two-step-button");
    btn.classList.remove("right");
    btn.innerHTML = btn.dataset.prime;
    RegisterMouseAndTouchEvent(btn, function(e){
      e.preventDefault();
      if (e.type == "mouseup" && e.button != 0) 
      { return; }
      let subBody = clone.querySelector(".subBody");
      let targetBody = subBody ? subBody : clone.querySelector(".body");
      if(e.currentTarget.innerHTML.toString() === e.currentTarget.getAttribute("data-alt")){
        e.currentTarget.innerHTML = e.currentTarget.getAttribute("data-prime");
        if(targetBody){ 
          targetBody.classList.add("folded");
          targetBody.ariaHidden = true; 
        }
      } else {
        e.currentTarget.innerHTML = e.currentTarget.getAttribute("data-alt");
        clone.scrollIntoView();
        if(targetBody){ 
          targetBody.classList.remove("folded");
          targetBody.ariaHidden = false; 
        }
      }
    });
  }
  return clone;
}