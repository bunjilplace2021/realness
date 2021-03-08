var isMobile = false;
var isAndroid = false;

var pixelShaderToggle = false;
var instruction_toggle = false;
var didactic_toggle = false;
var instload_toggle = true;

let hideicon = false;

let ps, img;
let touchtime;

var reset = false;
var eraser_size = 20;

let uuid;

let webcam = false;

let array_limit = window.safari ? 15 : 20;
let globalFrameRate = 60;
let frameLimit = ~~globalFrameRate * 10;
let particlepg;

let isSafari = false;
let isiPhone = false;

let mousecount = 0;
let mouseIsReleased = false;

let initload = true;
let initinst = true;

let webcam_init_inst = true;

var isWKWebView = false;

let detecttouch = false;

// ADD EVENT LISTENER TO WINDOW -- TRIGGERS UI SOUND
window.pixelAddEvent = new CustomEvent("pixel_added", {
  detail: {},
  bubbles: false,
  cancelable: true,
  composed: false,
});
window.radiusLimit = new Event("radius_reached");
window.down = new Event("down");
window.released = new Event("released");
// set minimum record length for users
window.minimumRecordLength = 200;

function centerCanvas() {
  var cnv_x = (windowWidth - width) / 2;
  var cnv_y = (windowHeight - height) / 2;
  cnv.position(cnv_x, cnv_y);
}

p5.disableFriendlyErrors = true; // disables FES

function preload() {
  // device detection
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      navigator.userAgent.substr(0, 4)
    )
  ) {
    isMobile = true;
  }

  if (/android/i.test(navigator.userAgent)) {
    isAndroid = true;
  }

  isSafari = checkIfWebKit();
  detecttouch = matchMedia("(hover: none)").matches;

  uuid = guid();
  shaderPreload();
}

function checkIfWebKit() {
  var ua = navigator.userAgent.toLowerCase();
  var isWebKit = false;

  if (
    ua.indexOf("chrome") === ua.indexOf("android") &&
    ua.indexOf("safari") !== -1
  ) {
    // accessed via a WebKit-based browser
    isWebKit = true;
  } else {
    // check if accessed via a WebKit-based webview
    if (
      ua.indexOf("ipad") !== -1 ||
      ua.indexOf("iphone") !== -1 ||
      ua.indexOf("ipod") !== -1
    ) {
      isWebKit = true;
    } else {
      isWebKit = false;
    }
  }

  return isWebKit;
}

function checkIfiPhone() {
  isiPhone = !!navigator.platform.match(/iPhone/);
  console.log(isiPhone);
  return isiPhone;
}

function setup() {

  pixelDensity(1);

  if (isMobile == false) {
    // frameRate(globalFrameRate);
    cnv = createCanvas(windowWidth, windowHeight);

    particlepg = createGraphics(windowWidth, windowHeight);
    cnv.id("mycanvas");
    cnv.style("display", "block");
    // If it's desktop safari, limit the framerate

    //icons_toolbar.style.display = "block";
  } else {
    if (windowWidth < windowHeight) {
      inner = iosInnerHeight();
      cnv = createCanvas(windowWidth, inner);
      particlepg = createGraphics(windowWidth, inner);
      cnv.style("display", "block");
      console.log("portrait");
    } else {
      cnv = createCanvas(windowWidth, windowHeight);
      particlepg = createGraphics(windowWidth, windowHeight);
      cnv.id("mycanvas");
      cnv.style("display", "block");

      console.log("landscape");
    }

    //     if (!isAndroid){
    //     fullicons.style.display = "none";
    // console.log('test')
    //     }
  }

  firebasesetup();
  shaderSetup();

  ps = new ParticleSystem(createVector(width / 2, height / 2), img);
  init_instructions();
}

function draw() {
  if (!instload_toggle) {
    particle_draw(particlepg);
  }
}

function shaderToggle() {
  pixelShaderToggle = !pixelShaderToggle;
}

function showDebugText(str) {
  push();
  noStroke();
  fill(255);
  textSize(20);
  text(str, 100, 100);
  pop();
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

function particle_draw(p) {
  touchtime = frameCount % frameLimit; //10 second loop approx

  if (!pixelShaderToggle) {
    p.blendMode(BLEND);
    p.background(0);
    p.blendMode(ADD);
  } else {
    p.blendMode(BLEND);
    p.background(0);
    p.blendMode(BLEND);
    //  p.clear();
  }

  ps.run(p);
  ps.intersection();
  ps.resize_window();

  shaderDraw();

  if (pixelShaderToggle) {
    pipShaderDraw();
  }

  image(particlepg, 0, 0);

  if (pixelShaderToggle) {
    image(pippg, 0, 0);
  }

  if (mouseIsPressed) {
    mousecount = mousecount + 1;
    if (mousecount === 30 && mousePressed) {
      window.dispatchEvent(window.down);
      if (window.recordingLimitReached) {
        document.getElementById("record_limit").style.display = "block";
        setTimeout(function time() {
          document.getElementById("record_limit").style.display = "none";
          initinst = false;
        }, 2000);
      }
    }
  }
}

function mousePressed() {
  // dispatchevent to sound sketch

  //sample and upload pixel to firebase

  shaderMousePressed();
  mouseIsReleased = false;
  initload = false;
}

function mouseReleased() {
  // dispatch event to sound sketch

  if (!window.isMuted && !window.recordingLimitReached && window.recording) {
    window.dispatchEvent(window.released);
  }

  mousecount = 0;
  mouseIsReleased = true;
}

function keyPressed() {
  //Hide hamburger

  if (key == "H" || key == "h") {
    hideicon = !hideicon;

    if (hideicon) {
      menuicon.style.display = "none";
      menu_txt.style.display = "none";
    } else {
      menuicon.style.display = "block";
      menu_txt.style.display = "block";
    }
  }

  if (key == "R" || key == "r") {
    removeData();
  }

  if (key == "S" || key == "s") {
    saveCanvas(particlepg, "realness", "jpg");
  }
}

function checkIfWKWebView() {
  //Detect WKWebKit for Chrome on iOS and PWA apps

  if (navigator.platform.substr(0, 2) === "iP") {
    //iOS (iPhone, iPod or iPad)
    var lte9 = /constructor/i.test(window.HTMLElement);
    var nav = window.navigator,
      ua = nav.userAgent,
      idb = !!window.indexedDB;
    if (
      ua.indexOf("Safari") !== -1 &&
      ua.indexOf("Version") !== -1 &&
      !nav.standalone
    ) {
      //Safari (WKWebView/Nitro since 6+)
    } else if ((!idb && lte9) || !window.statusbar.visible) {
      isWKWebView = true;
    } else if (
      (window.webkit && window.webkit.messageHandlers) ||
      !lte9 ||
      idb
    ) {
      isWKWebView = true;
    }
  }
}

function windowResized() {
  if (!isMobile) {
    resizeCanvas(windowWidth, windowHeight);
    particlepg.resizeCanvas(windowWidth, windowHeight);
    shaderWindowResized(windowWidth, windowHeight);
  } else {
    checkIfWKWebView();

    //Fix for slow update of window.width on resize (WKWebKit)

    if (isWKWebView) {
      let w = document.documentElement.clientWidth;
      let h = document.documentElement.clientHeight;
      resizeCanvas(w, h);
      particlepg.resizeCanvas(w, h);
      shaderWindowResized(w, h);
    } else {
      let innerh = iosInnerHeight();
      resizeCanvas(windowWidth, innerh);
      particlepg.resizeCanvas(windowWidth, innerh);
      shaderWindowResized(windowWidth, innerh);
    }
  }
}

function infoInstructions() {
  instruction_toggle = !instruction_toggle;

  if (instload_toggle) {
    document.getElementById("menu_txt").style.display = "block";
    myLinks.style.display = "none";
  } else {
    myLinks.style.display = "block";
  }

  menuicon.classList.toggle("fa-window-close");
  myLinks.style.display = "block";

  document.getElementById("top").style.backgroundColor =
    "rgba(127, 127, 127, 0.2)";
  document.getElementById("top").style.webkitBackdropFilter = "blur(30px)";
  document.getElementById("top").style.backdropFilter = "blur(30px)";
  document.getElementById("top").style.paddingLeft = "none";

  // }

  if (instruction_toggle) {
    document.getElementById("menu_txt").style.display = "none";

    //    icons_toolbar.style.display = "block";
  } else {
    myInfo.style.display = "none";
    myInfo.style.background = "none";
    myLinks.style.display = "none";
    myLinks.style.background = "none";
    myInfo.style.overflowY = "hidden";
    didactic_toggle = false;
    instload_toggle = false;
    instructions.style.display = "none";
    document.getElementById("top").style.height = "auto";
    instructions.style.overflowY = "hidden";
    document.getElementById("top").style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    document.getElementById("top").style.webkitBackdropFilter = "blur(0px)";
    document.getElementById("top").style.backdropFilter = "blur(0px)";
    document.getElementById("top").style.height = "auto";
    document.getElementById("top").style.paddingLeft = "1em";
    document.getElementById("menu_txt").style.display = "block";
    mouseinst();
  }
}

function webcamInst() {
  if (webcam_init_inst) {
    document.getElementById("webcam_inst").style.display = "block";
    setTimeout(function time() {
      document.getElementById("webcam_inst").style.display = "none";
      webcam_init_inst = false;
    }, 2000);
  } else {
    document.getElementById("webcam_inst").style.display = "none";
  }
}

function mouseinst() {
  if (!detecttouch) {
    if (initinst) {
      document.getElementById("mouse_inst").style.display = "block";
      setTimeout(function time() {
        document.getElementById("mouse_inst").style.display = "none";
        initinst = false;
      }, 2000);
    } else {
      document.getElementById("mouse_inst").style.display = "none";
    }
  } else {
    if (initinst) {
      document.getElementById("tap_inst").style.display = "block";
      setTimeout(function time() {
        document.getElementById("tap_inst").style.display = "none";
        initinst = false;
      }, 2000);
    } else {
      document.getElementById("tap_inst").style.display = "none";
    }
  }
}

function didactic() {
  didactic_toggle = !didactic_toggle;
  instload_toggle = false;

  myInfo.style.display = "block";
  myInfo.style.overflowY = "scroll";

  instructions.style.display = "none";
  document.getElementById("top").style.height = "auto";
  instructions.style.overflowY = "hidden";

  if (didactic_toggle) {
    myInfo.style.display = "block";
    document.getElementById("top").style.height = "100%";
  } else {
    myInfo.style.display = "none";
    document.getElementById("top").style.height = "auto";
    myInfo.style.overflowY = "hidden";
  }
}

function init_instructions() {
  infoInstructions();

  instructions.style.display = "block";
  instructions.style.overflowY = "scroll";

  if (instload_toggle) {
    instructions.style.display = "block";
    document.getElementById("top").style.height = "100%";
  } else {
    instructions.style.display = "none";
    document.getElementById("top").style.height = "auto";
    instructions.style.overflowY = "hidden";
  }
}

function volumemute() {
  volicons.classList.toggle("fa-volume-mute");
}

function cameratoggle() {
  if (!instload_toggle) {
    webc.classList.toggle("fa-circle-o");

    var x = document.getElementById("spantxt");

    if (x.innerHTML === "view webcam") {
      x.innerHTML = "view artwork";
    } else {
      x.innerHTML = "view webcam";
    }

    if (webcam) {
      pixelShaderToggle = !pixelShaderToggle;
      webcamInst();
    } else {
      document.getElementById("camera_inst").style.display = "block";
      setTimeout(function time() {
        document.getElementById("camera_inst").style.display = "none";
      }, 2000);
    }
  }
  //icons.classList.toggle("select");
}

function fullScreenMenu() {
  checkIfiPhone();

  if (!isiPhone) {
    let fs = fullscreen();
    fullscreen(!fs);
    fullicons.classList.toggle("fa-compress");
    var x = document.getElementById("fullspantxt");

    if (x.innerHTML === "fullscreen mode") {
      x.innerHTML = "exit fullscreen";
    } else {
      x.innerHTML = "fullscreen mode";
    }
    document.body.scrollTop = 0; // <-- pull the page back up to the top
    document.body.style.overflow = "hidden";
  } else {
    if (width < height) {
      document.getElementById("iPhone").style.display = "block";
      setTimeout(function time() {
        document.getElementById("iPhone").style.display = "none";
      }, 2000);
    }
  }
}
