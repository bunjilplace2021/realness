let pixelShader;
let backgroundShader;
let cam;
let pixelpg;
let backgroundpg;
let colour, oldcolour;
let lerp_amount = 0;
let menu_loc = false;
let coltoggle = false;
let color_lerp = 0;
let backgroundcol;

let amt, startColor, newColor;

//load shader for camera module

function shaderPreload() {
  // load the shader
  pixelShader = loadShader("shader/effect.vert", "shader/effect.frag");
  backgroundShader = loadShader("shader/effect.vert", "shader/background.frag");
}

function shaderSetup() {
  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.elt.setAttribute("playsinline", "");

  pixelpg = createGraphics(cnv.width, cnv.height, WEBGL);
  backgroundpg = createGraphics(cnv.width, cnv.height, WEBGL);
  colour = color(0, 0, 0);
  oldcolour = color(0, 0, 0);
  backgroundcol = color(0, 0, 0);

  startColor = color(255, 255, 255);
  newColor = color(255, 255, 255);
  amt = 0;
}

function colorDraw(c) {
  let col = lerpColor(startColor, newColor, smoothstep(0.1, 0.9, amt));
  amt += 0.005;
  if (amt >= 1) {
    amt = 0.0;
    startColor = newColor;
    newColor = color(c);
  }
  return col;
}

function smoothstep(edge0, edge1, x) {
  x = constrain((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * (3 - 2 * x);
}

function shaderDraw() {
  // shader() sets the active shader with our shader
  pixelpg.shader(pixelShader);
  backgroundpg.shader(backgroundShader);

  if (pixelShaderToggle) {
    if (lerp_amount < 50) {
      lerp_amount = lerp_amount + 1;
    }
  } else {
    if (lerp_amount >= 0) {
      lerp_amount = lerp_amount - 1;
    }
  }

  pixelShader.setUniform("tex0", cam);
  pixelShader.setUniform("u_resolution", [width, height]);
  pixelShader.setUniform("u_lerp", map(lerp_amount, 0, 50, 0, 1));
  // lets just send the cam to our shader as a uniform
  if (!isMobile) {
    //check camera and device orientation on mobile
    pixelShader.setUniform("u_devicecamres", [cam.width, cam.height]);
  } else {
    if (height > width) {
      pixelShader.setUniform("u_devicecamres", [cam.width, cam.height]);
    } else {
      pixelShader.setUniform("u_devicecamres", [cam.height, cam.width]);
    }
  }

  if (coltoggle) {
    if (color_lerp <= 200) {
      color_lerp = color_lerp + 1;
    }
  }

  if (!coltoggle) {
    if (color_lerp >= 0) {
      color_lerp = color_lerp - 1;
    }
  }

  //if (pixelShaderToggle){
  backgroundcol = colorDraw(colour);
  //  }

  backgroundShader.setUniform("u_resolution", [width, height]);
  backgroundShader.setUniform("u_color_old", [
    oldcolour[0],
    oldcolour[1],
    oldcolour[2],
  ]);
  backgroundShader.setUniform("u_color", [
    backgroundcol.levels[0],
    backgroundcol.levels[1],
    backgroundcol.levels[2],
  ]);
  backgroundShader.setUniform("u_lerp", map(color_lerp, 0, 200, 0, 1));
  backgroundShader.setUniform("u_lerp2", map(lerp_amount, 0, 200, 0, 1));
  // let tileno = 1;
  // let radius = 20;
  //
  // backgroundShader.setUniform('tex0', pixelpg);
  // backgroundShader.setUniform('resolution', [width, height]);
  // backgroundShader.setUniform('tileno', tileno);
  // backgroundShader.setUniform('radius', radius);
  // backgroundShader.setUniform('u_time', frameCount * 0.05);
  // backgroundShader.setUniform('isMobile', isMobile);

  // rect gives us some geometry on the screen
  pixelpg.rect(0, 0, width, height);
  backgroundpg.rect(0, 0, width, height);

  if (pixelShaderToggle) {
    image(backgroundpg, 0, 0);
  }
}

function removeData() {
  var testremove = database.ref("test3");
  testremove
    .remove()
    .then(function () {
      console.log("Remove succeeded.");
    })
    .catch(function (error) {
      console.log("Remove failed: " + error.message);
    });
}

function shaderMousePressed() {
  detectWebcam(function (hasWebcam) {
    webcam = hasWebcam;
    //console.log(webcam);
    console.log("Webcam: " + (hasWebcam ? "yes" : "no"));
  });

  colour = pixelpg.get(mouseX, height - mouseY);
  // texture upside down?
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

function shaderWindowResized(w, h) {
  pixelpg.resizeCanvas(w, h);
  backgroundpg.resizeCanvas(w, h);
}
