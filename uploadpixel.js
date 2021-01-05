let pixelShader;
let backgroundShader;
let pipShader;
let cam;
let pixelpg;
let backgroundpg;
let pippg;
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
  pixelShader = loadShader('shader/effect.vert', 'shader/effect.frag');
  backgroundShader = loadShader('shader/effect.vert', 'shader/background.frag');
  pipShader = loadShader('shader/effect.vert', 'shader/pip.frag');
}

function shaderSetup() {
  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.elt.setAttribute('playsinline', '');

  pixelpg = createGraphics(cnv.width, cnv.height, WEBGL);
  backgroundpg = createGraphics(cnv.width, cnv.height, WEBGL);
  pippg = createGraphics(cnv.width, cnv.height, WEBGL);

  colour = color(0,0,0);
  oldcolour = color(0,0,0);
  backgroundcol= color(0,0,0);

  startColor = color(255,255,255);
  newColor = color(255,255,255);
  amt = 0;

}

function colorDraw(c) {

  let col = lerpColor(startColor, newColor, smoothstep(0.1,0.9,amt));
  amt += 0.005;
  if(amt >= 1){
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
  pippg.shader(pipShader);


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
  pixelShader.setUniform('u_lerp', 1); //map(lerp_amount, 0, 50, 0, 1)
  pixelShader.setUniform('u_safari', isSafari ? 1 : 0);
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


if (coltoggle){
  if (color_lerp <= 200) {
    color_lerp = color_lerp + 1;
  }
}

if (!coltoggle){
  if (color_lerp >= 0) {
    color_lerp = color_lerp - 1;
  }
}

//if (pixelShaderToggle){
  backgroundcol = colorDraw(colour);
//  }
let mx = map(mouseX,0,width,0.,1.);
let my = map(mouseY,0,height,0.,1.);

let pipx = width-30;
let pipy = height-30;//width < 900 ? height-(height/6) : height-30;


let pip_x = map(pipx,0,width,1.,0.);
let pip_y = map(pipy,0,height,0.,1.);

let pip_mx = norm(map(mouseX, 0, width, pipx - (width/5), pipx), 0, width);
let pip_my = norm(map(mouseY, 0, height,pipy - (height/5), pipy), 0, height);





  backgroundShader.setUniform('u_resolution', [width, height]);
  backgroundShader.setUniform('u_mouse', [mx, my]);
  backgroundShader.setUniform('u_pip', [pip_x, pip_y]);
  backgroundShader.setUniform('u_pip_mouse', [pip_mx, pip_my]);
  backgroundShader.setUniform('tex1', pixelpg);
  backgroundShader.setUniform('u_color', [backgroundcol.levels[0], backgroundcol.levels[1], backgroundcol.levels[2]]);
  backgroundShader.setUniform('u_lerp', map(color_lerp, 0, 200, 0, 1));
  backgroundShader.setUniform('u_lerp2', map(lerp_amount, 0, 200, 0, 1));


  pipShader.setUniform('u_resolution', [width, height]);
  pipShader.setUniform('u_mouse', [mx, my]);
  pipShader.setUniform('u_pip', [pip_x, pip_y]);
  pipShader.setUniform('u_pip_mouse', [pip_mx, pip_my]);
  pipShader.setUniform('tex1', pixelpg);
  pipShader.setUniform('u_color', [backgroundcol.levels[0], backgroundcol.levels[1], backgroundcol.levels[2]]);
  pipShader.setUniform('u_lerp', map(color_lerp, 0, 200, 0, 1));
  pipShader.setUniform('u_lerp2', map(lerp_amount, 0, 200, 0, 1));

  // rect gives us some geometry on the screen
  pixelpg.rect(0, 0, width, height);
  backgroundpg.rect(0, 0, width, height);
  pippg.rect(0, 0, width, height);

  if (pixelShaderToggle) {
    image(backgroundpg, 0, 0);
    image(pippg, 0, 0);
  }

}


function removeData() {
  var testremove = database.ref('test3');
testremove.remove()
.then(function() {
  console.log("Remove succeeded.")
})
.catch(function(error){
  console.log("Remove failed: "+ error.message)
});

//color_lerp = 0;
}


function shaderMousePressed() {

  detectWebcam(function(hasWebcam) {
    webcam = hasWebcam;
    //console.log(webcam);
    console.log('Webcam: ' + (hasWebcam ? 'yes' : 'no'));
  })

  colour = pixelpg.get(mouseX, height - mouseY);

   // texture upside down?
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


function shaderWindowResized(w,h) {
  pixelpg.resizeCanvas(w, h);
  backgroundpg.resizeCanvas(w, h);
  pippg.resizeCanvas(w, h);

}
