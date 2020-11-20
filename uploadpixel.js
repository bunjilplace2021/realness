let pixelShader;
let cam;
let pixelpg;
let radius, colour;

//load shader for camera module

function shaderPreload() {
  // load the shader
  pixelShader = loadShader("shader/effect.vert", "shader/pixelfrag.frag");
}

function shaderSetup() {
  // initialize the webcam at the window size
  try {
    cam = createCapture(VIDEO);
  } catch (error) {
    console.log(error);
  }

  cam.size(windowWidth, windowHeight);
  cam.elt.setAttribute("playsinline", "");

  pixelpg = createGraphics(width, height, WEBGL);
}

function shaderDraw() {
  radius = 5;
  let mx = map(mouseX, 0, width, 0, 1);
  let my = map(mouseY, 0, height, 0, 1);

  // shader() sets the active shader with our shader
  pixelpg.shader(pixelShader);

  // lets just send the cam to our shader as a uniform
  pixelShader.setUniform("tex0", cam);
  pixelShader.setUniform("resolution", [width, height]);
  pixelShader.setUniform("radius", radius);
  pixelShader.setUniform("u_time", frameCount * 0.05);
  pixelShader.setUniform("u_mouse", [mx, my]);

  // rect gives us some geometry on the screen
  pixelpg.rect(0, 0, width, height);

  if (pixelShaderToggle) {
    image(pixelpg, 0, 0);
  }
}

function shaderMousePressed() {
  //push to firebase

  if (mouseX > 0 && mouseX < width - 100 && mouseY > 100 && mouseY < height) {
    colour = pixelpg.get(mouseX, mouseY);
    var data = {
      uuid: uuid,
      mouseX_loc: mouseX,
      mouseY_loc: mouseY,
      colour_loc: colour,
      deviceWidth: width,
      deviceHeight: height,
      touchTime: touchtime,
    };

    var test = database.ref("test3");

    if (webcam) {
      test.push(data);
      console.log(data);
    }
  }
}

function shaderWindowResized() {
  pixelpg.resizeCanvas(windowWidth, windowHeight);
}
