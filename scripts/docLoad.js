// <script src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>
let globalTags = {};

async function loadGithubData(){ // github data
    let owner = "PantheraDigital";
    let repo = "InfoDump";
    let branch = "main";
    let file = "README.md";
    await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`)
    .then(
        (response) => {
            if (!response.ok) throw new Error(`Response status: ${response.status}`);
            return response.text();
        }
    ).then(
        (text) => {
            const result = githubTextToJSON(text);
            JSONToDOM(result.Projects, document.querySelector('#projects-container'), "projects");
            JSONToDOM(result.Posts, document.querySelector('#posts-container'), "posts");
        }
    ).catch(
        (error) => {
            console.error("Failed to load github data:", error.message);
        }
    );
}

async function loadLocalData() { // local data
    await fetch('projectText.json').then(
        (response) => {
            if (!response.ok) throw new Error(`Response status: ${response.status}`);
            return response.json();
        }
    ).then(
        (json) => {
            JSONToDOM(json, document.querySelector('#projects-container'), "projects");
        }
    ).catch(
        (error) => {
            console.error("Failed to load local data:", error.message);
        }
    );
}

async function loadPage() {
    await loadLocalData();
    document.getElementById("project-loading").remove();
    await loadGithubData();
    document.getElementById("post-loading").remove();
    addSortBars();
};
loadPage();



function githubTextToJSON(text){
    const result = {};
    let section = "";
    let entry = "";

    // parse text to JSON
    text.split("\n").forEach(line => {
        if (line.trim() === ""){ // empty line
            if (entry !== "" && result[section][entry].description){
                result[section][entry].description += "\n";
            }
        } else if (line.startsWith("##")){ // title of new entry
            line = line.substring(2).trim();
            if (line.startsWith("[")){ // title is link
                entry = line.substring(1, line.indexOf("]"));
                result[section][entry] = {};
                result[section][entry].link = line.substring(line.indexOf("(") + 1, line.length - 1);
            }else{
                entry = line;
                result[section][entry] = {};
            }
        } 
        else if (line.startsWith("#")) { // title of new section
            section = line.substring(1).trim();
            result[section] = {};
            entry = "";
        } else if (line.startsWith("!")) { // img
            result[section][entry].imgDescription = line.substring(2, line.indexOf("]"));
            result[section][entry].imgSrc = line.substring(line.indexOf("(") + 1, line.length - 1);
        } else if (line.startsWith("[tags:")){ // tags
            let tags = line.substring(6, line.indexOf("]")).split(",");
            tags = tags.map(s => s.trim());
            result[section][entry].tags = tags;
        } else { // description
            if (result[section][entry].description){
                result[section][entry].description += "\n" + line;
            } else {
                result[section][entry].description = line;
            }
        }

    });
    return result;
}

// parse JSON to DOM elements
// {"entry 1 title": {}, "entry 2 title": {}}
function JSONToDOM(json, domElement, tagGroup){
    const projectTemplate = document.querySelector('#project-template');
    const entries = domElement.querySelectorAll(".project-details");
    let elementIndex = entries.length;
    
    for (const key in json){
        const clone = document.importNode(projectTemplate.content, true);

        clone.querySelector('summary').textContent = " " + key;

        if (Object.hasOwn(json[key], "imgSrc")){
            const img = clone.querySelector('img');
            img.src = json[key].imgSrc;
            img.alt = json[key].imgDescription;
        } else {
            clone.querySelector('img').remove();
            clone.querySelector('br').remove();
        }

        if (Object.hasOwn(json[key], "tags")){
            json[key].tags = json[key].tags.filter(Boolean);
            let newSet = (Object.hasOwn(globalTags, tagGroup)) ? [...globalTags[tagGroup], ...json[key].tags] : json[key].tags;
            globalTags[tagGroup] = new Set(newSet);
            clone.querySelector('[name="tags"]').insertAdjacentText("beforeend", json[key].tags.join(", "));
            clone.querySelector('details').setAttribute("data-tags", json[key].tags.toString());
        } else {
            clone.querySelector('[name="tags"]').remove();
        }
        
        // each '\n' in description signifies a new 'p' element
        if (Object.hasOwn(json[key], "description")){
            const tagElement = clone.querySelector('[name="tags"]');
            const detailsElement = clone.querySelector('details').querySelector('.project-body');
            const desc = json[key].description.trim().split("\n");
            for (const line of desc){
                let toAdd = (line !== "") ? MDToHTML(line) : document.createElement("br");
                if (tagElement){
                    detailsElement.insertBefore(toAdd, tagElement);
                } else {
                    detailsElement.appendChild(toAdd);
                }
            }
        }

        if (Object.hasOwn(json[key], "link")){
            const link = clone.querySelector('a');
            link.href = json[key].link;
            link.textContent = json[key].link;
        } else {
            clone.querySelector('a').remove();
        }

        clone.querySelector('details').setAttribute("data-original-index", elementIndex);
        clone.querySelector('details').setAttribute("name", tagGroup + "-details");
        domElement.appendChild(clone);
        elementIndex += 1;
    }
}

// returns a single p element with inline elements [img, a, br]
function MDToHTML(mdText){
    const result = document.createElement("p");
    let start = 0;

    while (start < mdText.length - 1){
        let index1 = mdText.indexOf("[", start);
        let index2 = (index1 > -1 && index1 < mdText.length - 1) ? mdText.indexOf("]", index1 + 1) : -1;
        let indexi = (index2 > -1 && index2 < mdText.length - 1) ? mdText.indexOf("(", index2 + 1) : -1;
        let indexii = (indexi > -1 && indexi < mdText.length - 1) ? mdText.indexOf(")", indexi + 1) : -1;
        
        if (index2 === -1){ // no MD
            result.insertAdjacentText("beforeend", mdText.substring(start));
            break;
        }

        let elementText = mdText.substring(index1 + 1, index2);
        let elementSText = (indexi > -1 && indexi === index2 + 1 && indexii > -1) ? mdText.substring(indexi + 1, indexii) : "";

        if (index1 > start){ // leading text
            if (mdText[index1 - 1] === "!"){
                if (index1 - 1 > start){
                    result.insertAdjacentText("beforeend", mdText.substring(start, index1 - 1));
                }
            } else {
                result.insertAdjacentText("beforeend", mdText.substring(start, index1));
            }
        }
        
        if (elementSText){
            if (index1 > start && mdText[index1 - 1] === "!"){
                let img = document.createElement("img");
                img.src = elementSText;
                img.alt = elementText;
                result.appendChild(img);
            } else {
                let link = document.createElement("a");
                link.href = elementSText;
                link.textContent = (elementText === "") ? elementSText : elementText;
                result.appendChild(link);
            }
            start = indexii + 1;
        }else{
            if (elementText === "br"){
                let br = document.createElement("br");
                result.appendChild(br);
            } else { // not md element
                result.insertAdjacentText("beforeend", mdText.substring(start, index2 + 1));
            }
            start = index2 + 1;
        }
    }

    return result;
}

function addSortBars(){
    const tagSelectorTemplate = document.querySelector('#tag-selector-template');
    for (const tagGroup in globalTags){
        const page = document.getElementById(tagGroup);
        const pageContent = (page) ? page.querySelector('section.main-content') : null;
        if (!pageContent) { continue; }

        const tagSelector = document.importNode(tagSelectorTemplate.content, true);
        const label = tagSelector.querySelector("label");
        const labelContainer = tagSelector.querySelector("span");
        const container = page.querySelector("#" + tagGroup.toLowerCase() + "-container");
        
        const input = label.querySelector("input");
        label.setAttribute("for", tagGroup + "None");
        input.setAttribute("id", tagGroup + "None");
        input.setAttribute("name", tagGroup + "-sort");
        input.setAttribute("value", "None");
        input.setAttribute("checked", "");
        input.addEventListener("change", ()=>{
                sortPageEntries(container, sortEntriesByIndex);
            });
        
        for (const tag of globalTags[tagGroup]){
            const labelClone = document.importNode(label, true);
            const input = labelClone.querySelector("input");

            labelClone.querySelector("span").textContent = tag + " ";

            labelClone.setAttribute("for", tagGroup + tag);
            input.setAttribute("id", tagGroup + tag);
            input.setAttribute("name", tagGroup + "-sort");
            input.setAttribute("value", tag);
            input.removeAttribute("checked");

            input.addEventListener("change", ()=>{
                sortPageEntries(container, (a,b)=>{return sortEntriesByTag(a,b,tag);});
            });

            labelContainer.appendChild(labelClone);
        }

        pageContent.appendChild(tagSelector);
    }
}

function sortPageEntries(page, sortFunc){
    const entries = Array.from(page.querySelectorAll(".project-details"));
    entries.sort(sortFunc);
    for (const entry of entries){
        page.insertAdjacentElement("beforeend", entry);
    }
}
function sortEntriesByTag(a, b, tag){
    const aTags = a.getAttribute("data-tags");
    const bTags = b.getAttribute("data-tags");
    if (!aTags) { return 1; }
    if (!bTags) { return -1; }

    const aHasTag = aTags.includes(tag);
    const bHasTag = bTags.includes(tag);

    if ((aHasTag && bHasTag) || (!aHasTag && !bHasTag)){
        return sortEntriesByIndex(a,b);
    } else if (aHasTag && !bHasTag){
        return -1;
    } else if (!aHasTag && bHasTag) {
        return 1;
    } else {
        return 0;
    }
}
function sortEntriesByIndex(a,b){
    const aOIndex = parseInt(a.getAttribute("data-original-index"));
    const bOIndex = parseInt(b.getAttribute("data-original-index"));
    return aOIndex - bOIndex;
}