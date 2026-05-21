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
let slides = document.getElementById("slide-list").children;
let activeSlideIndex = 0;

for (let i = 0; i < slides.length; i++) {
	if (i != activeSlideIndex) {
		slides[i].classList.add("slide-right");
	}
}

function navigateToSlide(index) {
	if (index == activeSlideIndex || index > slides.length) {
		return;
	}

	let active = slides[activeSlideIndex];
	let newActive = slides[index];

	if (index > activeSlideIndex) {
		active.classList.add("slide-left");
		if (Math.abs(index - activeSlideIndex) > 1) {
			for (let i = activeSlideIndex + 1; i < index; i++) {
				slides[i].classList.replace("slide-right", "slide-left");
			}
		}
	} else {
		active.classList.add("slide-right");
		if (Math.abs(index - activeSlideIndex) > 1) {
			for (let i = activeSlideIndex - 1; i > index; i--) {
				slides[i].classList.replace("slide-left", "slide-right");
			}
		}
	}

	newActive.classList.remove("slide-left");
	newActive.classList.remove("slide-right");
	activeSlideIndex = index;
}