var root = window.getComputedStyle(document.documentElement);
var shapeSize = parseInt(root.getPropertyValue('--shape-size'), 10);
var shapeXPad = parseInt(root.getPropertyValue('--shape-x-padding'), 10);
var shapeYPad = parseInt(root.getPropertyValue('--shape-y-padding'), 10);

window.onload = loadShapes;
window.onresize = loadShapes;


//
//shapes
//

//---design variables
//edit shapeStyleList string to set the shape or shapes
// seperate each shape class with a space
var shapeStyleList = "arrow-up arrow-down".trim().split(" ");
//the offset of every even row
// us to add padding to the begining of the row to offset the alignment of shapes vertically
var rowOffset = 0
//---

var prevRowBeginingStyleIndex = 0;
function loadShapes(){
    addShapeRows("shape-list");
    let listChildCount = Number(document.getElementById("shape-list").childElementCount);
    for(let i = 0; i < listChildCount; i++){
        //---this function populates rows with shapes. the ending argument determins if the first shape in the row will match the first shape in the row before it
        fillRowWithShape(("shape-row_" + i.toString()), shapeStyleList, true);
    }
    if(rowOffset > 0){
        offsetRows(rowOffset, "shape-list");
    }
}

function fillRowWithShape(rowID, shapeStyleList, cycleFirstShape){
    let row = document.getElementById(rowID);
    let rowChildCount = row.childElementCount;
    let elementMax = Math.ceil(document.getElementById("repeatingShapeBackground").getBoundingClientRect().width / (shapeSize + shapeXPad));
    let shapeListIndex = cycleFirstShape ? prevRowBeginingStyleIndex : 0;

    if(rowChildCount >= elementMax){
        return;
    }
    //if the row has shapes already find the index of the last shape's class in shapeStyleList so that we may continue the pattern
    if(!isNaN(rowChildCount) && rowChildCount > 0){
        let prevShapeClass = row.childNodes[row.childNodes.length-1].childNodes[0].className;
        if(prevShapeClass){
            let prevShapeClassIndex = shapeStyleList.indexOf(prevShapeClass);
            if(prevShapeClassIndex > -1){
                shapeListIndex = prevShapeClassIndex + 1;
                if(shapeListIndex >= shapeStyleList.length){
                    shapeListIndex = 0;
                }
            }
        }
    }
    for(let i = rowChildCount; i < elementMax; i++){
        let shape = document.createElement("div");
        let shapeWrapper = document.createElement("div");
        shapeWrapper.className = "shape-wrapper";
        shape.className = shapeStyleList[shapeListIndex];

        shapeWrapper.appendChild(shape);
        row.appendChild(shapeWrapper);

        if(shapeStyleList.length > 1){
            shapeListIndex++;
            if(shapeListIndex >= shapeStyleList.length){
                shapeListIndex = 0;
            }
        }
    }

    prevRowBeginingStyleIndex++;
    if(prevRowBeginingStyleIndex >= shapeStyleList.length){
        prevRowBeginingStyleIndex = 0;
    }
}

function addShapeRows(listID){
    let list = document.getElementById(listID);
    let listRows = list.childElementCount;
    let rowMax = Math.ceil(document.getElementById("repeatingShapeBackground").getBoundingClientRect().height / (shapeSize + shapeYPad));

    if(listRows >= rowMax){
        return;
    }
    for(let i = listRows; i < rowMax; i++){
        let row = document.createElement("li");
        row.id = "shape-row_" + list.childElementCount.toString();
        row.className = "shape-row";
        list.appendChild(row);
    }
}

function offsetRows(pxValue, listID){
    let list = document.getElementById(listID);
    let listRows = list.childElementCount;
    if(listRows <= 0)
        return;

    for(let i = 0; i < listRows; i++){
        if(i % 2 == 0){
            list.children[i].style.paddingLeft = pxValue.toString() + "px";
        }
    }
}

//
//mouse
//

//---attach mouse-tracker element to mouse
var mouseGradient = document.getElementById("mouse-tracker");
const onMouseMove = (event) =>{
    if(mouseGradient){
        mouseGradient.style.left = event.pageX + 'px';
        mouseGradient.style.top = event.pageY + 'px';
    }
}
//document.addEventListener('mousemove', onMouseMove);

//---assign ripple effect on click
//document.getElementById("repeatingShapeBackground").addEventListener("click", createRipple);
function createRipple(event) {
    let element = event.currentTarget;
    let circle = document.createElement("span");
    let width = mouseGradient ? mouseGradient.clientWidth : element.clientWidth;
    let height = mouseGradient ? mouseGradient.clientHeight : element.clientHeight;
    let diameter = Math.max(width, height);
    let radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.pageX - radius}px`;
    circle.style.top = `${event.pageY - radius}px`;
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