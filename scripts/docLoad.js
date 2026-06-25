// <script src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>

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
            projectJSONToDOM(result.Projects, document.querySelector('#project-container'));
            projectJSONToDOM(result.Posts, document.querySelector('#post-container'));
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
            projectJSONToDOM(json, document.querySelector('#project-container'));
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
            if (line.startsWith("[")){
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
function projectJSONToDOM(json, domElement){
    const projectTemplate = document.querySelector('#project-template');
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
        
        // each '\n' in description signifies a new 'p' element
        if (Object.hasOwn(json[key], "description")){
            const detailsElement = clone.querySelector('details').querySelector('.project-body');
            const desc = json[key].description.trim().split("\n");
            for (const line of desc){
                if (line !== ""){
                    //const lineHTML = document.createElement("p");
                    //lineHTML.textContent = line;
                    detailsElement.appendChild(MDToHTML(line));
                } else {
                    detailsElement.appendChild(document.createElement("br"));
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

        domElement.appendChild(clone);
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
