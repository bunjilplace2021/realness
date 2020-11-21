let w,h;

function preload() {
  canvDim();
  
}

function setup() {
  createCanvas(w, h);
  
}


function draw() {
  background(220);
  fill(255,0,255);
  rect(0,0,w,h);
 // console.log(w,h);
}

function windowResized() {
  canvDim();
  resizeCanvas(w,h);
}

function canvDim() {
  w = document.documentElement.clientWidth;
  h = document.documentElement.clientHeight;
  
}

