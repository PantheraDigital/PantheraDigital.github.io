var projectsArray = [];
FormatContent();

function FormatContent() {
    if ('content' in document.createElement('template')){
        const unformattedContent = document.getElementById("unformatted-content");
        const unformattedProjects = unformattedContent.getElementsByClassName("unformatted-project");
        const template = document.getElementById("project-profile-template");

        for(let i = 0; i < unformattedProjects.length; i++){
            let tempClone = template.content.cloneNode(true);
            let valid = true;

            let img = tempClone.getElementById("project-img");
            if(img){
                img.removeAttribute("id");
                img.src = unformattedProjects[i].getElementsByTagName("img")[0].getAttribute("src");
                img.alt = unformattedProjects[i].getElementsByTagName("img")[0].alt;

                if(img.src == ""){valid = false;}
            }

            let title = tempClone.getElementById("project-name");
            if(valid && title){
                title.removeAttribute("id");

                let unformattedTitle = unformattedProjects[i].getElementsByTagName("h2")[0];
                title.getElementsByTagName("a")[0].innerHTML = unformattedTitle.getElementsByTagName("a")[0].innerHTML;
                title.getElementsByTagName("a")[0].href = unformattedTitle.getElementsByTagName("a")[0].href;  
                
                if(title.innerHTML.trim() == ""){valid = false;}
            }

            let shortText = tempClone.getElementById("project-text-short");
            if(valid && shortText){
                shortText.removeAttribute("id");
                shortText.innerHTML = unformattedProjects[i].getElementsByTagName("p")[0].innerHTML;

                if(shortText.innerHTML.trim() == ""){valid = false;}
            }

            let longText = tempClone.getElementById("project-text-long");
            if(valid && longText){
                longText.removeAttribute("id");
                longText.innerHTML = unformattedProjects[i].getElementsByTagName("p")[1].innerHTML;

                if(longText.innerHTML.trim() == ""){
                    longText.remove();
                    tempClone.getElementById("dropdown-button").remove();
                }
                else
                {
                    tempClone.getElementById("dropdown-button").removeAttribute("id");
                }
            }

            if(valid){
                projectsArray.push(tempClone);
            }
        }

        document.getElementById("unformatted-content").remove();
        AddFormattedProjectsToHTML();
    }
}


function AddFormattedProjectsToHTML(){
    const projectGrid = document.getElementById("project-grid");
    for(let i = 0; i < projectsArray.length; i++){
        projectGrid.appendChild(projectsArray[i]);
    }
}