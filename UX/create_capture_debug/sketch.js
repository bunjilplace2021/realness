let cam;

function setup() {
  createCanvas(windowWidth, windowHeight);

  //create a video capture object
  cam = createCapture(VIDEO);

  //the createCapture() function creates an HTML video tag
  //as well as pulls up image to be used in p5 canvas
  //hide() function hides the HTML video element
  cam.hide();
  cam.elt.setAttribute('playsinline', '');
}

function draw() {
  background(220);

  //draw video capture feed as image inside p5 canvas
  image(cam, 0, 0);
}
