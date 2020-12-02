let pixelShader;
let cam;
let pixelpg;
let colour;
let lerp_amount = 0;
let menu_loc = false;


//load shader for camera module

function shaderPreload() {
  // load the shader
  pixelShader = loadShader('shader/effect.vert', 'shader/effect.frag');
}

function shaderSetup() {
  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.elt.setAttribute('playsinline', '');

  pixelpg = createGraphics(cnv.width, cnv.height, WEBGL);

}

function shaderDraw() {

  // shader() sets the active shader with our shader
  pixelpg.shader(pixelShader);

  if (pixelShaderToggle) {
    if (lerp_amount < 50) {
      lerp_amount = lerp_amount + 1;
    }
  } else {
    if (lerp_amount >= 0) {
      lerp_amount = lerp_amount - 1;
    }

  }


  pixelShader.setUniform('tex0', cam);
  pixelShader.setUniform('u_resolution', [width, height]);
  pixelShader.setUniform('u_lerp', map(lerp_amount, 0, 50, 0, 1));
  // lets just send the cam to our shader as a uniform
  if (!isMobile) { //check camera and device orientation on mobile
    pixelShader.setUniform('u_devicecamres', [cam.width, cam.height]);
  } else {
    if (height > width) {
      pixelShader.setUniform('u_devicecamres', [cam.width, cam.height]);
    } else {
      pixelShader.setUniform('u_devicecamres', [cam.height, cam.width]);
    }
  }


  // rect gives us some geometry on the screen
  pixelpg.rect(0, 0, width, height);

  if (pixelShaderToggle) {
    image(pixelpg, 0, 0);
  }

}

function shaderMousePressed() {

  //push to firebase




  detectWebcam(function(hasWebcam) {
    webcam = hasWebcam;
    //console.log(webcam);
    console.log('Webcam: ' + (hasWebcam ? 'yes' : 'no'));
  })

  colour = pixelpg.get(mouseX, mouseY);
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

  //do not upload pixel if location under menu element check

  let rect = document.getElementById("top").getBoundingClientRect();


  if (mouseY >= rect.top && mouseY <= rect.bottom) {
    menu_loc = true;
  } else {
    menu_loc = false;
  }


  if (webcam && !menu_loc) {
    test.push(data);
    console.log(data);
  }
}


function shaderWindowResized() {
  pixelpg.resizeCanvas(windowWidth, windowHeight);
}
