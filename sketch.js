var isMobile = false;

var pixelShaderToggle = false;
var instruction_toggle = false;
var didactic_toggle = false;


let hideicon = false;

let ps, img;
let touchtime;

var reset = false;
var eraser_size = 20;

let uuid;

let webcam = false;

let array_limit = 30;

function centerCanvas() {
  var cnv_x = (windowWidth - width) / 2;
  var cnv_y = (windowHeight - height) / 2;
  cnv.position(cnv_x, cnv_y);
}

p5.disableFriendlyErrors = true; // disables FES

function preload() {


  // device detection
  if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
    isMobile = true;
  }

  if (/android/i.test(navigator.userAgent)) {
    isAndroid = true;
  }
  uuid = guid();
  shaderPreload();


}

function detectWebcam(callback) {  //check if webcam device exists and/or permission granted by device label
  let md = navigator.mediaDevices;
  if (!md || !md.enumerateDevices) return callback(false);
  md.enumerateDevices().then(devices => {
    callback(devices.some(device => '' != device.label));
  })
}

function setup() {

  if (isMobile == false) {
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.id('mycanvas');
    cnv.style('display', 'block');
    FScreen.style.display = "block";

  } else {

    if (windowWidth < windowHeight) {
      inner = iosInnerHeight();
      cnv = createCanvas(windowWidth, inner);
      cnv.id('mycanvas');
      cnv.style('display', 'block');
      console.log("portrait")
    } else {
      cnv = createCanvas(windowWidth, windowHeight);
      cnv.id('mycanvas');
      cnv.style('display', 'block');
      console.log("landscape")
    }
  }

  pixelDensity(1);
  firebasesetup();
  shaderSetup();

  ps = new ParticleSystem(createVector(width / 2, height / 2), img);


}

function draw() {

  particle_draw();

}

function shaderToggle() {

  pixelShaderToggle = !pixelShaderToggle;

}

function guid() {
  //someone else's function
  //https://slavik.meltser.info/the-efficient-way-to-create-guid-uuid-in-javascript-with-explanation/
  function _p8(s) {
    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
  }
  return _p8() + _p8(true) + _p8(true) + _p8();
}

function particle_draw() {

  touchtime = frameCount % 600; //10 second loop approx

  blendMode(BLEND);
  background(0);
  blendMode(ADD);


  noCursor();

  if (!isMobile) {
  push();
  fill(255, 100);
  noStroke();
  ellipseMode(CENTER);
  ellipse(mouseX, mouseY, 40);
  pop();
}


  ps.run();
  ps.intersection();
  ps.resize_window();

  shaderDraw();


}


function mousePressed() {

  //sample and upload pixel to firebase
  shaderMousePressed();
}


function keyPressed() {

  //Hide hamburger

  if (key == 'H' || key == 'h') {

    hideicon = !hideicon;

    if (hideicon) {
      icons.style.display = "none";
    } else {
      icons.style.display = "block";
    }

  }
}


function windowResized() {

  if (!isMobile) {
    resizeCanvas(windowWidth, windowHeight);
  } else {
    let innerh = iosInnerHeight();
    resizeCanvas(windowWidth, innerh);
  }

  shaderWindowResized();


}

function infoInstructions() {

  instruction_toggle = !instruction_toggle;

  menuicon.classList.toggle("fa-window-close");
  myLinks.style.display = "block";


  if (instruction_toggle) {
    FScreen.style.display = "block";
    myLinks.style.background= "rgba(0, 0, 0, 0.6)";

  } else {
    myInfo.style.display = "none";
    myInfo.style.background = "none";
    myLinks.style.display = "none";
    myLinks.style.background= "none";
    myInfo.style.overflowY = "hidden";
    didactic_toggle = false;
  }

}

function didactic() {

  didactic_toggle = !didactic_toggle;
  myInfo.style.display = "block";
  myInfo.style.overflowY = "scroll";
  myInfo.style.background = "rgba(0, 0, 0, 0.4)";

  if (didactic_toggle) {
    myInfo.style.display = "block";
    myInfo.style.background = "rgba(0, 0, 0, 0.4)";
    //  myInfo.style.overflowY = "scroll";

  } else {
    myInfo.style.display = "none";
    myInfo.style.background = "none";
    myInfo.style.overflowY = "hidden";

  }
}

function volumemute() {
  volicons.classList.toggle("fa-volume-mute");
}

function cameratoggle() {
  pixelShaderToggle = !pixelShaderToggle;

  if (pixelShaderToggle){
    document.getElementById("top").style.backgroundColor='rgba(0, 0, 0, 0.4)';
}else{
    document.getElementById("top").style.backgroundColor='rgba(0, 0, 0, 0.0)';
}
  }

function fullScreenMenu() {
  let fs = fullscreen();
  fullscreen(!fs);
  fullicons.classList.toggle("fa-expand");
  document.body.scrollTop = 0; // <-- pull the page back up to the top
  document.body.style.overflow = 'hidden';
}
