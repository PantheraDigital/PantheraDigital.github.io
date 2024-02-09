const projectDocID = "1QdR-rhAUXKioBX6O_77ADhYKNA6EaSEQB0xiHqOHGf4";
const blogDocID = "1AqB-qUFwaGI5-mfEfUVkTaEIPRo5DlVwvnI2wsWmRDI";
const link = `https://docs.google.com/document/d/${projectDocID}/edit?usp=sharing`;
const apiKey = "AIzaSyBHhqGZRJIo90yIk1K-J86C9PU3whMe8CA";

const frameArray = Array.from(document.getElementsByClassName("frame"));

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

(function () {
  //pre existing frame events
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
        if(e.type == "mouseup" && e.button != 0) {return;}
        HideFrame(e.target.closest(".frame"));
      });
    }

    let fullscreenBtn = frameArray[i].querySelector("[name='fullscreen-frame-button']");
    if(fullscreenBtn){
      RegisterMouseAndTouchEvent(fullscreenBtn, function(e){
        e.preventDefault();
        if(e.type == "mouseup" && e.button != 0) {return;}
        let frame = e.target.closest(".frame");
        ToggleFrameFullscreen(frame);
        UpdateFrameZOrder(frame);
      });
    }
  }

  //add in extra frames
  let frame = CreateFrame("<b>BlogBrowser</b>", "", {frameType: "fixed", buttons: "close fullscreen", extra: "hidden"});
  frame.id = "blog-browser-window";
  frame.querySelector(".frame-body").classList.add("blog-browser-body");
  
  let heading = document.createElement("h3");
  heading.innerHTML = "Blog Browser";
  frame.querySelector(".frame-body").appendChild(heading);

  let blogList = document.createElement("ul");
  blogList.classList.add("project-grid");
  blogList.style.borderTop = "solid grey 1px";
  blogList.style.paddingTop = "20px";
  blogList.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>';
  frame.querySelector(".frame-body").appendChild(blogList);
  
  if(window.matchMedia("(pointer: coarse)").matches) {SetFrameFullscreen(frame, true);}
  document.body.appendChild(frame);

  //open windows based on url search values
  if(urlParams.has("projects")){
    OpenWindow("projects-window");
    LoadProjectsToDOM();
  }
  if(urlParams.has("about")){
    OpenWindow("about-window");
  }
  if(urlParams.has("blog")){
    OpenWindow("blog-browser-window");
    LoadBlogsToDOM();
  }
})();
(function(){
  //register menu button events//
  RegisterMouseAndTouchEvent(document.getElementById("projects-button"), function(event){ OpenWindow("projects-window", event, FoldProjectCardsInContainer); LoadProjectsToDOM(); });
  RegisterMouseAndTouchEvent(document.getElementById("about-button"), function(event){ OpenWindow("about-window", event); });
  RegisterMouseAndTouchEvent(document.getElementById("blogs-button"), function(event){ OpenWindow("blog-browser-window", event); LoadBlogsToDOM(); });
  //BG ripple effect
  RegisterSpecificMouseAndTouchEvent(document.getElementById("background"), "mousedown", "touchstart", createRipple);
})();
(function(){
  //QR functionality////////////
  let qrOverlay = document.getElementById("qr-overlay");
  let qrOverlayButton = document.getElementById("qr-button");
  RegisterMouseAndTouchEvent(qrOverlayButton, function(e){
    e.preventDefault();
    if(e.type == "mouseup" && e.button != 0) {return;}
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
  //About Window Setup///////////
  if(window.matchMedia("(pointer:coarse)").matches){document.getElementById("about-window").querySelector(".tab-body-wrapper").classList.add("right-align");}
  let btns = document.getElementById("about-window").querySelector(".tab-list").children;
  let active = "";
  Array.from(btns).forEach(button => {
    let group = button.id.split("_")[1];
    document.getElementById(`about-tab-body_${group}`).style.display = "none";

    if(active === ""){
      active = group;
      button.classList.add("selected");
      document.getElementById(`about-tab-body_${active}`).style.display = "block";
    }

    RegisterMouseAndTouchEvent(button, function(e){
      e.preventDefault();
      if(e.type == "mouseup" && e.button != 0) {return;}
      document.getElementById(`about-tab-button_${active}`).classList.remove("selected");
      document.getElementById(`about-tab-body_${active}`).style.display = "none";

      active = group;
      document.getElementById(`about-tab-button_${active}`).classList.add("selected");
      document.getElementById(`about-tab-body_${active}`).style.display = "block";
    });
  });
})();

async function ParseDoc(docID, textParser, errorCall){
  await fetch(`https://www.googleapis.com/drive/v3/files/${docID}/export?mimeType=text/plain&key=${apiKey}`)
  .then(function(res) {
      return res.text();
  }).then(textParser
  ).catch(errorCall);
}

function LoadBlogsToDOM(){
  if(document.getElementById("blog-browser-window").querySelector(".project-grid").querySelector(".card-wrapper")){return;}
  const blogText = localStorage.getItem("blogs");
  const time = localStorage.getItem("blogtime");
  if(blogText && time && Date.now() < time){
    RemoveLoadingElement(document.getElementById("blog-browser-window").querySelector(".project-grid"));
    AddBlogsToDOM(ParseDocBlogs(blogText));
  }
  else{
    ParseDoc(blogDocID, 
      function(text){
        RemoveLoadingElement(document.getElementById("blog-browser-window").querySelector(".project-grid"));
        text = text.substring(text.indexOf("<blogs>"), text.length);
        AddBlogsToDOM(ParseDocBlogs(text));
        localStorage.setItem("blogs", text);
        localStorage.setItem("blogtime", Date.now() + (60000 * 60 * 48));
      },
      function(e){
        console.log(e.toString());
      });
  }

  function AddBlogsToDOM(blogDataArray){
    let blogWindow = document.getElementById("blog-browser-window").querySelector(".project-grid");
    blogDataArray.forEach(element => {
      let item = document.createElement("li");
      item.appendChild(CreateBlogCard(element), false, false);
      blogWindow.appendChild(item);
    });
  }
  function ParseDocBlogs(text){
    const blogDataArray = [];
    let textArray = text.split("\r\n");
    let index = 1; //skip <blogs> tag
  
    while(index < textArray.length){
      if(textArray[index] === ""){
        index++;
        continue;
      }
      
      let blog = {
        "title": CustomTagReplacer(textArray[index++]),
        "desc": "",
        "body": "",
        "data": ""
      };
  
      let blogText = "";
      for( ;index < textArray.length; index++){
        if(textArray[index] === "</>") { 
          index++;
          blog.body = CustomTagReplacer(blogText);
          break;
        }
        else if(textArray[index] === "<//>"){ 
          blog.desc = CustomTagReplacer(blogText);
          blogText = "";
          continue;
        }
  
        blogText += textArray[index] + "\r\n";
        if(textArray[index] === "" && textArray[index + 1] === ""){
          index++;  
        }
      }
      
      if(index < textArray.length && textArray[index].includes("{")){
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
      if(!blog.data.includes("DNR")){blogDataArray.push(blog);}
    }
    return blogDataArray;
  };
}
function LoadProjectsToDOM(){
  if(document.getElementById("projects-window").querySelector(".project-grid").querySelector(".card-wrapper")){return;}
  const projectText = localStorage.getItem("projects");
  const time = localStorage.getItem("projecttime");
  if(projectText && time && Date.now() < time){//no api call if data is stored and current
    RemoveLoadingElement(document.getElementById("projects-window").querySelector(".project-grid"));
    AddProjectsToDOM(ParseDocProjects(projectText));
  }
  else{//call api to get text and parse
    ParseDoc(projectDocID, 
      function(text) {
        RemoveLoadingElement(document.getElementById("projects-window").querySelector(".project-grid"));
        text = text.substring(text.indexOf("<projects>"), text.length);
        AddProjectsToDOM(ParseDocProjects(text));
        localStorage.setItem("projects", text);
        localStorage.setItem("projecttime", Date.now() + (60000 * 60 * 48));
      },
      function(e) {
        let card = CreateProjectCard("none", "Error", e.toString());
        document.getElementById("projects-window").querySelector(".project-grid").appendChild(card);
      });
  }
  function AddProjectsToDOM(dataObj){
    const projectGrid = document.getElementById("projects-window").querySelector(".project-grid");
    dataObj.categoryArray.forEach(cat => {
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

    dataObj.projectDataArray.forEach(object =>{
      let card = CreateProjectCard(object.img, object.title, object.shortDesc, object.longDesc, object.category, (object.category === "Certifications"));
      let item = document.createElement("li");
      item.appendChild(card);
      item.id = "project_" + object.title.replaceAll(' ', '-');
      if(object.category){
        projectGrid.querySelector("#category_" + object.category).querySelector(".project-list").appendChild(item);
      }
      else{
        projectGrid.insertBefore(item, projectGrid.querySelector("#category_" + dataObj.categoryArray[0]));
      }
    });
  };
  function ParseDocProjects(text){
    let result = {
      "categoryArray":[],
      "projectDataArray":[]
    };
    let textArray = text.split("\r\n");
    let index = 1;
  
    while (index < textArray.length){
      if (textArray[index] === "" || textArray[index] === "</>") {
        index++;
        continue;
      }
  
      let projectObj = {
        "title": CustomTagReplacer(textArray[index++]),
        "category": "",
        "img": "",
        "shortDesc": "",
        "longDesc": ""
      };
  
      if (textArray[index].indexOf('<') == 0 && textArray[index].indexOf('>') > -1){
        projectObj.category = textArray[index].substring(1, textArray[index].length - 1);
        if(projectObj.category !== "none" && projectObj.category !== "" && !result.categoryArray.includes(projectObj.category)){
          result.categoryArray.push(projectObj.category);
        }
        index++;
      }
      projectObj.img = textArray[index++];
  
      let projectText = "";
      for( ;index < textArray.length; index++){
        if(textArray[index] === "</>") { //end of project
          index++;
          if(projectObj.shortDesc === ""){
            projectObj.shortDesc = CustomTagReplacer(projectText);
          }
          else{
            projectObj.longDesc = CustomTagReplacer(projectText);
          }
          break;
        }
        else if(textArray[index] === "<//>"){ //end of short desc
          projectObj.shortDesc = CustomTagReplacer(projectText);
          projectText = "";
          continue;
        }
        projectText += textArray[index] + "\r\n";
        if(textArray[index] === "" && textArray[index + 1] === ""){
          index++;  
        }
      }
      result.projectDataArray.push(projectObj);
    }
    return result;
  };
}

function OpenWindow(id, event = undefined, func = null){
  if(event){
    event.preventDefault();
    if(event.type == "mouseup" && event.button != 0) {return;}
  }
  
  let frame = document.getElementById(id);
  if(window.matchMedia("(pointer: coarse)").matches) {SetFrameFullscreen(frame, true);}
  if(func) { func(frame); }
  UpdateFrameZOrder(frame);
  ShowFrame(frame);
}


////////////////////////////////
//Frame functions /////////////
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

// options = {frameType: "fixed/absolute fullscreen", position: {top: val, right: val, bottom: val, left: val},
//     width: val, height: val, buttons: "fullscreen close", extra: "hidden bodyAsString closeButtonRemoves"}
function CreateFrame(title, body = "", options = {}){
  const clone = document.querySelector("template").content.querySelector(".frame").cloneNode(true);
  frameArray.push(clone);

  if(options.hasOwnProperty("extra") && options.extra.includes("hidden")) {
    clone.style.display = "none";
  } else {
    UpdateFrameZOrder(clone);
  }
  if(options.hasOwnProperty("frameType")){
    let canMove = false;
    if(options.frameType.includes("fixed")){
      clone.classList.add("fixed");
      canMove = true;
    } else if(options.frameType.includes("absolute")){
      clone.classList.add("absolute");
      canMove = true;
    }
    if(canMove){
      DragElement(clone, clone.querySelector(".frame-header"), clone.querySelector(".frame-header-title"));
    }
  }
  if(options.hasOwnProperty("position")){
    let pos = options.position;
    if(pos.hasOwnProperty("top")) { clone.style.top = pos.top; }
    if(pos.hasOwnProperty("right")) { clone.style.right = pos.right; }
    if(pos.hasOwnProperty("bottom")) { clone.style.bottom = pos.bottom; }
    if(pos.hasOwnProperty("left")) { clone.style.left = pos.left; }
  }
  if(options.hasOwnProperty("width")){ clone.style.width = options.width; }
  if(options.hasOwnProperty("height")){ clone.style.height = options.height; }

  clone.querySelector(".frame-header-title").insertAdjacentHTML("beforeend", CustomTagReplacer(title));

  if(options.hasOwnProperty("buttons")){
    let buttonNames = options.buttons.split(" ");
    buttonNames.forEach(name => {
      let btn = CreateButton(name);
      if(btn) { clone.querySelector(".frame-header-button-container").appendChild(btn); }
    });

    if(options.hasOwnProperty("frameType") && options.frameType.includes("fullscreen") && options.buttons.includes("fullscreen")){
      SetFrameFullscreen(clone, true);
    }
  }

  if(body !== ""){
    if(options.hasOwnProperty("extra") && options.extra.includes("bodyAsString")){
      clone.querySelector(".frame-body").classList.add("frame-text");
      clone.querySelector(".frame-body").insertAdjacentHTML("beforeend", CustomTagReplacer(body))
    } else{
      clone.querySelector(".frame-body").appendChild(body);
    }
  }
  
  RegisterSpecificMouseAndTouchEvent(clone, "mousedown", "touchstart", function(){ 
    UpdateFrameZOrder(clone); 
  });

  function CreateButton(name){
    let button = null;
    switch(name){
      case "close": {
        button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("name", "close-frame-button");
        button.classList.add("frame-header-button", "red-hover");
        button.innerText = "X";
        RegisterMouseAndTouchEvent(button, function(e){
          e.preventDefault();
          if(e.type == "mouseup" && e.button != 0) {return;}
          if(options.hasOwnProperty("extra") && options.extra.includes("closeButtonRemoves")) {e.target.closest(".frame").remove();}
          else {HideFrame(e.target.closest(".frame"));}
        });
        break;
      }
      case "fullscreen":{
        button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("name", "fullscreen-frame-button");
        button.classList.add("frame-header-button", "cyan-hover", "icon-button");
        button.innerHTML = "<i class=\"fa-solid fa-xs fa-plus\"></i>";
        RegisterMouseAndTouchEvent(button, function(e){
          e.preventDefault();
          if(e.type == "mouseup" && e.button != 0) {return;}
          let frame = e.target.closest(".frame");
          ToggleFrameFullscreen(frame);
          UpdateFrameZOrder(frame);
        });
        break;
      }
    }
    return button;
  }

  return clone;
}
function OpenBlogFrame(blog){
  const titleHTML = document.createElement("h3");
  titleHTML.insertAdjacentHTML("beforeend", blog.title);
  const id = "blog_" + titleHTML.innerText.replaceAll(" ", "-");
  let frame = CreateFrame(`Blog Viewer - <i>${titleHTML.innerText}</i>`, "", 
  {frameType: "fixed fullscreen", buttons: "close fullscreen", position: {top: "50%", left: "50%"}, extra: "closeButtonRemoves"});
  frame.id = id;

  let wrapper = document.createElement("div");
  wrapper.classList.add("blog-wrapper");

  if(blog.data !== ""){
    const dataObj = ParseBlogTags(blog.data);
    if(dataObj.hasOwnProperty("text") && dataObj.text === "preformatted") {wrapper.classList.add("preformatted");}

    let imagePath = dataObj.hasOwnProperty("large-img") ? dataObj["large-img"] : (dataObj.hasOwnProperty("img") ? dataObj["img"] : "");
    if(imagePath !== ""){
      const template = document.querySelector("template");
      const clone = template.content.querySelector(".card-wrapper").querySelector(".card-img").cloneNode(true);
      clone.classList.remove("card-img");
      clone.classList.add("blog-img");
      clone.src = imagePath;
      clone.removeAttribute("loading");
      wrapper.appendChild(clone);
    }
  }  
  wrapper.appendChild(titleHTML);
  wrapper.insertAdjacentHTML("beforeend", blog.body);
  frame.querySelector(".frame-body").appendChild(wrapper);

  document.body.appendChild(frame);
}

/////////////////////////
// Card functions //////
function FoldProjectCardsInContainer(container){
  let projects = container.getElementsByClassName("card-wrapper");
  if (projects && projects.length > 0){
    for (let i = 0; i < projects.length; i++){
      if(!projects[i].querySelector(".two-step-button")) {continue;}
      let subBody = projects[i].querySelector(".subBody");
      let targetBody = subBody ? subBody : projects[i].querySelector(".body");
      
      if (targetBody != null) {
        if (!targetBody.classList.contains("folded")) {    
          const btn = projects[i].querySelector(".two-step-button");
          if(btn){
            btn.innerHTML = btn.getAttribute("data-prime");
          }
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
  clone.querySelector(".card-heading").insertAdjacentHTML("beforeend", title);
  clone.querySelector(".card-body").insertAdjacentHTML("beforeend", body);

  if(subBody !== ""){
    let sub = document.createElement("div");
    sub.classList.add("subBody", "folded");
    sub.ariaHidden = "true";
    sub.insertAdjacentHTML("beforeend", subBody);
    clone.appendChild(sub);
  }
  else{
    clone.querySelector(".card-body").ariaHidden = true;
    clone.querySelector(".card-body").classList.add("folded");
  }

  if (category !== ""){ clone.setAttribute('data-category', category); }

  if (removeButton){
    clone.removeChild(clone.querySelector(".two-step-button"));
    if(imagePath.toLowerCase() !== "none"){
      clone.querySelector(".card-img").classList.add("btn-ignore");
    }
    clone.querySelector(".card-body")?.setAttribute('aria-hidden', 'false');
    clone.querySelector(".card-body")?.classList.remove("folded");
    clone.querySelector(".subbody")?.setAttribute('aria-hidden', 'false');
    clone.querySelector(".subbody")?.classList.remove("folded");
  } else { 
    const btn = clone.querySelector(".two-step-button");
    btn.classList.remove("right");
    btn.innerHTML = btn.dataset.prime;
    RegisterMouseAndTouchEvent(btn, function(e){
      e.preventDefault();
      if (e.type == "mouseup" && e.button != 0) 
      { return; }
      let subBody = clone.querySelector(".subBody");
      let targetBody = subBody ? subBody : clone.querySelector(".card-body");
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
function CreateBlogCard(blogData){
  const template = document.querySelector("template");
  const clone = template.content.querySelector(".card-wrapper").cloneNode(true);

  const btn = clone.querySelector(".two-step-button");
  btn.innerHTML = "<i class=\"fa-solid fa-up-right-from-square\"></i>";
  btn.removeAttribute("data-alt");
  btn.removeAttribute("data-prime");
  RegisterMouseAndTouchEvent(btn, function(e){
    e.preventDefault();
    if(e.type == "mouseup" && e.button != 0) {return;}
    OpenBlogFrame(blogData);
  });

  clone.style.setProperty("--border-color", "deepskyblue");
  clone.querySelector(".card-heading").style.setProperty("--underline-color", "mediumpurple");
  clone.querySelector(".card-heading").insertAdjacentHTML("beforeend", blogData.title);

  if(blogData.desc !== "") {
    clone.querySelector(".card-body").insertAdjacentHTML("beforeend", blogData.desc);
  }

  if(blogData.data !== ""){
    const dataObj = ParseBlogTags(blogData.data);
  
    if(dataObj.hasOwnProperty("img") && dataObj.img.toLowerCase() !== "none"){
      clone.querySelector(".card-img").src = dataObj.img;
    } else {
      clone.querySelector(".flex").removeChild(clone.querySelector(".card-img"));
    }
  
    if(dataObj.hasOwnProperty("tags") && dataObj.tags !== ""){
      clone.querySelector(".card-body").insertAdjacentHTML("beforeend", 
      `<br><br><i>${dataObj.tags}<br>${dataObj.date}</i>`);
    }
  }
  
  return clone;
}
function ParseBlogTags(text){
  const dataObj = {};
  if(!text) {return dataObj;}
  text.replaceAll(/[{}\n]|\r\n/g, "").split(";").forEach(element => {
    let tag = element.substring(0, element.indexOf(":")).trim();
    dataObj[tag] = element.substring(element.indexOf(":") + 1).trim();
  });
  return dataObj;
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

function RemoveLoadingElement(element){
  element.querySelector(".lds-ring").remove();
}
//searches through a string. replaces custom tags with html form as a string <Unity> becomes <i class="fa-brands fa-unity"></i>
// non specified tags are ignored
// tags between <$> are put in as text. replace all '<' and '>' symbols with '&lt;' and '&gt;' until </$>
function CustomTagReplacer(text){
  text = text.replaceAll(/\r\n|\n/g, "<br>");
  var mapObj = {
    "<unity>": '<i class="fa-brands fa-unity"></i>',
    "<itch>":  '<i class="fa-brands fa-itch-io"></i>',
    "<github>":'<i class="fa-brands fa-github"></i>'
  };

  var reg = new RegExp(Object.keys(mapObj).join("|"),"gi");
  text = text.replace(reg, function(matched){
    return mapObj[matched];
  });

  //keep specific html
  while(text.includes("<$>")){
    let start = text.indexOf("<$>");
    let end = text.indexOf("</$>", start);
    if(end == -1) {break;}

    let sub = text.substring(start, end + 4);
    sub = sub.replace(/<\$>|<\/\$>/g, "");
    let result = sub.replace(/<|>/g, function(matched){
      if(matched === "<") {return "&lt;";}
      else if(matched === ">") {return "&gt;";}
    });
    
    text = text.replace(text.substring(start, end + 4), result);
  }

  let index = 0;
  while(text.indexOf("https://", index) !== -1){
    let linkIndex = text.indexOf("https://", index);
    if(text.substring(linkIndex - 6, linkIndex) === "href=\"" || text.substring(linkIndex - 5, linkIndex) === "src=\""){
      index = text.indexOf(">", linkIndex) + 1;//ignore
    } else {
      let endIndex = text.indexOf(" ", linkIndex);
      if(endIndex > text.indexOf("<br>", linkIndex) || endIndex === -1) {endIndex = text.indexOf("<br>", linkIndex);}

      if (endIndex === -1) {endIndex = text.length;}
      if (text[endIndex - 1] === '.') {endIndex--;}

      let link = text.substring(linkIndex, endIndex);
      text = text.slice(0, linkIndex) + `<a href=\"${link}\">${link}</a>` + text.slice(linkIndex + link.length);
      index += (link.length * 2) + 15;
    }
  }
  return text;
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

//ripple effect
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