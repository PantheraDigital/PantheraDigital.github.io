export function RegisterSpecificMouseAndTouchEvent(elmnt, mouseEvent, touchEvent, fnctn) {
  if (elmnt !== null) {
    elmnt.addEventListener(mouseEvent, fnctn);
    elmnt.addEventListener(touchEvent, fnctn, {passive: true});
  }
}

export function RegisterMouseAndTouchEvent(elmnt, fnctn) {
  if (elmnt !== null) {
    elmnt.addEventListener("mouseup", fnctn);
    elmnt.addEventListener("touchend", fnctn);
  }
}