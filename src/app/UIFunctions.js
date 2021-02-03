export function changetoUnmute(elt) {
  elt.classList.add("fa", "fa-volume-off");
  elt.disabled = false;
}

export function changeTooltipText(elt) {
  if (window.isMuted) {
    elt.innerHTML = "unmute sound";
  } else {
    elt.innerHTML = "mute sound";
  }
}
export function changeMuteButton(muted, elt) {
  if (!muted) {
    elt.classList.remove("fa-volume-off");
    elt.classList.add("fa-volume-up");
  } else {
    elt.classList.add("fa-volume-off");
    elt.classList.remove("fa-volume-up");
  }
}
