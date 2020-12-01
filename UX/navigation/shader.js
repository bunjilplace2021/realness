// in this sketch we're going to send the webcam to the shader, and then invert it's colors

// the shader variable
let camShader;

// the camera variable
let cam;

let campg

function shaderPreload() {
  // load the shader
  camShader = loadShader('shader/effect.vert', 'shader/effect.frag');
}

function shaderSetup() {
  // shaders require WEBGL mode to work
  campg = createGraphics(cnv.width, cnv.height, WEBGL);
  noStroke();

  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.elt.setAttribute('playsinline', '');


  //cam.size(windowWidth, windowHeight);

  // hide the html element that createCapture adds to the screen
  //cam.hide();

}


function shaderDraw() {
  // shader() sets the active shader with our shader

  campg.shader(camShader);


  // lets just send the cam to our shader as a uniform
  camShader.setUniform('tex0', cam);
  camShader.setUniform('u_resolution', [width, height]);

  if (!isMobile) {
    camShader.setUniform('u_devicecamres', [cam.width, cam.height]);
  } else {
    if (height > width) {
      camShader.setUniform('u_devicecamres', [cam.width, cam.height]);
    } else {
      camShader.setUniform('u_devicecamres', [cam.height, cam.width]);
    }
  }




  // rect gives us some geometry on the screen
  campg.rect(0, 0, width, height);

  //  var img = campg.get(mouseX,mouseY);
  //  console.log(img);

}

//image(campg,0,0);

// function windowResized(){
//   resizeCanvas(windowWidth, windowHeight);
// }
