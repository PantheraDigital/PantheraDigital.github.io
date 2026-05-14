/*
  auto scrolling text
*/
function enableScroll(scrollContainer, step = -0.1, updateFrequency = 0){
	let scrollContent = scrollContainer.querySelector(".auto-scroll-content");
	
	function scroll(){
		if(step < 0){
			scrollContent.style.left = (parseFloat(window.getComputedStyle(scrollContent).left) + step).toString() + "px";
			if(scrollContent.firstElementChild.getBoundingClientRect().right < scrollContainer.getBoundingClientRect().left){
				scrollContent.appendChild(scrollContent.firstElementChild);
				scrollContent.style.left = "";// resets pos to start
			}
		}else{
			scrollContent.style.right = (parseFloat(window.getComputedStyle(scrollContent).right) - step).toString() + "px";
			if(scrollContent.lastElementChild.getBoundingClientRect().left > scrollContainer.getBoundingClientRect().right){
				scrollContent.prepend(scrollContent.lastElementChild);
				scrollContent.style.right = (scrollContent.offsetWidth - scrollContainer.offsetWidth).toString() + "px";
			}
		}
	}

	if(scrollContent && scrollContainer){
		let stepOverride = scrollContainer.getAttribute("data-scroll-step");
		if(stepOverride){ step = parseFloat(stepOverride); }
		let updateOverride = scrollContainer.getAttribute("data-scroll-update");
		if(updateOverride){ updateFrequency = parseFloat(updateOverride); }

		if(step > 0){
			scrollContent.style.right = (scrollContent.offsetWidth - scrollContainer.offsetWidth).toString() + "px";
		}
		setInterval(scroll, updateFrequency);
	}
}

let scrolls = document.querySelectorAll(".auto-scroll-container");
for(const scroll of scrolls){
	enableScroll(scroll);
}



/*
  slide list
*/
const slideList = document.getElementById("slide-list");
function formatSlideList(element){
	element.dataset.activeId = element.children[0].id;
	for (let i = 0; i < element.children.length; i++){
		if (i == 0){continue}
		element.children[i].classList.add("animate-slide-right-out");
	}
}
formatSlideList(slideList);


function slideListNavTo(childID){
	if (childID == slideList.dataset.activeId){
		return;
	}

	let children = Array.from(slideList.children);
	let active = children.findIndex((element) => element.id == slideList.dataset.activeId);
	let target = children.findIndex((element) => element.id == childID);
	const activeElement = slideList.children[active];
	const targetElement = slideList.children[target];

	if (target - active > 0){
		// pos direction, going right
		// transition active out, then target in

		if (activeElement.classList.contains("animate-slide-right-in")){
			activeElement.classList.replace("animate-slide-right-in", "animate-slide-left-out");
		}else{
			activeElement.classList.add("animate-slide-left-out");
		}

		if (targetElement.classList.contains("animate-slide-left-out")){
			targetElement.classList.replace("animate-slide-left-out", "animate-slide-right-in");
		}else{
			targetElement.classList.replace("animate-slide-right-out", "animate-slide-right-in");
		}

	}else{
		// neg direction, going left
		// transition active out, then target in

		if (activeElement.classList.contains("animate-slide-left-in")){
			activeElement.classList.replace("animate-slide-left-in", "animate-slide-right-out");
		}else{
			activeElement.classList.replace("animate-slide-right-in", "animate-slide-right-out");
		}

		if (targetElement.classList.contains("animate-slide-right-out")){
			targetElement.classList.replace("animate-slide-right-out", "animate-slide-left-in");
		}else{
			targetElement.classList.replace("animate-slide-left-out", "animate-slide-left-in");
		}
	}

	slideList.dataset.activeId = targetElement.id;
}
