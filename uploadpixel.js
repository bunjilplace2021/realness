let pixelShader;
let cam;
let pixelpg;
let radius, colour;

//load shader for camera module

function shaderPreload() {
  // load the shader
  pixelShader = loadShader('shader/effect.vert', 'shader/pixelfrag.frag');
}

function shaderSetup() {
  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.size(windowWidth, windowHeight);

  // hide the html element that createCapture adds to the screen
  cam.hide();
  pixelpg = createGraphics(width, height, WEBGL);
}

function shaderDraw() {

  //blendMode(SCREEN);

  radius = 50;


  let mx = map(mouseX, 0, width, 0, 1);
  let my = map(mouseY, 0, height, 0, 1);

  // shader() sets the active shader with our shader
  pixelpg.shader(pixelShader);

  // lets just send the cam to our shader as a uniform
  pixelShader.setUniform('tex0', cam);
  pixelShader.setUniform('resolution', [width, height]);
  pixelShader.setUniform('radius', radius);
  pixelShader.setUniform('u_time', frameCount * 0.05);
  pixelShader.setUniform('u_mouse', [mx, my]);


  // rect gives us some geometry on the screen
  pixelpg.rect(0, 0, width, height);

  //imageMode(CENTER);
  image(pixelpg, 0, 0);
}

function shaderMousePressed() {

if (mouseX > 0&& mouseX < width-77 && mouseY > 50 && mouseY < height) {

  colour = cam.get(width - mouseX, mouseY);
  var data = {
    uuid: uuid,
    mouseX_loc: mouseX,
    mouseY_loc: mouseY,
    colour_loc: colour,
    deviceWidth: width,
    deviceHeight: height,
    touchTime: touchtime
  }

  var test = database.ref('test3');

  test.push(data);
  console.log(data);
}
}

function shaderWindowResized() {
  //resizeCanvas(windowWidth, windowHeight);
  pixelpg.resizeCanvas(windowWidth, windowHeight);
}
