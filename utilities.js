function guid() {
  //someone else's function
  //https://slavik.meltser.info/the-efficient-way-to-create-guid-uuid-in-javascript-with-explanation/
  function _p8(s) {
    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
  }
  return _p8() + _p8(true) + _p8(true) + _p8();
}

function centerCanvas() {
  var cnv_x = (windowWidth - width) / 2;
  var cnv_y = (windowHeight - height) / 2;
  cnv.position(cnv_x, cnv_y);
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

function quickGet(p, x, y) {
  p.loadPixels();

  let d = pixelDensity();
  //   convert to INT
  let off = Math.floor((y * width + x) * d * 4);
  let components = [
    p.pixels[off],
    p.pixels[off + 1],
    p.pixels[off + 2],
    p.pixels[off + 3],
  ];

  return components;
}


function averageBrightness(p,w,h) {  //use cam width & height
  p.loadPixels();
      if (p.pixels.length > 0) { // don't forget this!
          var total = 0;
          var i = 0;
          for (var y = 0; y < h; y++) {
              for (var x = 0; x < w; x++) {
                  var redValue = p.pixels[i];
                  total += redValue;
                  i += 4;
              }
          }
          var n = w * h;
          var avg = int(total / n);
          //select('#average-value').elt.innerText = avg;
          //select('#average-color').elt.style.backgroundColor = 'rgb(' + avg + ',' + avg + ',' + avg + ')';
      }
  return constrain(map(avg,0,127,0,1),0,1);
}

//browser checks

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

//webcam detections

function hasGetUserMedia() {
  //permission check
  let constraints = {
    video: true,
    // audio: true
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      webcam_permission = true;
      webcam = true;
      console.log("webcam connected");
      window.stream = stream;
    })
    .catch(function (err) {
      webcam = false;
      webcam_permission = false;
      console.log("No Webcam", err);
    });
}

function webcamCheck() {
  //check if still connected
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      const cameras = devices.filter((d) => d.kind === "videoinput");
      if (cameras.length > 0) {
        webcam = true;
      } else {
        webcam = false;
      }
    })
    .catch(function (err) {
      console.log(err.name + ": " + err.message);
      webcam = false;
    });
}

//menu functions

function infoInstructions() {
  instruction_toggle = !instruction_toggle;

  if (instload_toggle) {
    document.getElementById("menu_txt").style.display = "block";
    document.getElementById("myLinks").style.display = "none";
    document.getElementById("top").style.backgroundColor =
      "rgba(0, 0, 0, 0.)";
    document.getElementById("instructions").style.webkitBackdropFilter = "blur(0px)";
    document.getElementById("instructions").style.backdropFilter = "blur(0px)";
  } else {
    myLinks.style.display = "block";
  }


  if(detecttouch && instload_toggle){
menuicon.classList.toggle("fa-angle-double-right");
}else{
  menuicon.classList.toggle("fa-window-close");
}

  myLinks.style.display = "block";

  document.getElementById("top").style.backgroundColor =
    "rgba(127, 127, 127, 0.2)";
  document.getElementById("top").style.webkitBackdropFilter = "blur(30px)";
  document.getElementById("top").style.backdropFilter = "blur(30px)";
  document.getElementById("top").style.paddingLeft = "none";

  // }

  if (instruction_toggle) {
    document.getElementById("menu_txt").style.display = "none";

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
    }, text_interval_time);
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
      }, text_interval_time);
    } else {
      document.getElementById("mouse_inst").style.display = "none";
    }
  } else {
    if (initinst) {
      document.getElementById("tap_inst").style.display = "block";
      setTimeout(function time() {
        document.getElementById("tap_inst").style.display = "none";
        initinst = false;
      }, text_interval_time);
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
  instructions.style.overflowY = "hidden";

  if (didactic_toggle) {
    myInfo.style.display = "block";
    myInfo.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    myInfo.style.webkitBackdropFilter = "blur(30px)";
    myInfo.style.backdropFilter = "blur(30px)";

  } else {
    myInfo.style.display = "none";
    myInfo.style.overflowY = "hidden";
    myInfo.style.backgroundColor = "rgba(0, 0, 0, 0)";
    myInfo.style.webkitBackdropFilter = "blur(0px)";
    myInfo.style.backdropFilter = "blur(0px)";
  }
}

function init_instructions() {
  infoInstructions();

  instructions.style.display = "block";
  instructions.style.overflowY = "scroll";

  document.getElementById("menu_txt").style.display = "block";
  document.getElementById("myLinks").style.display = "none";
  document.getElementById("top").style.backgroundColor =
    "rgba(0, 0, 0, 0.)";
  document.getElementById("instructions").style.webkitBackdropFilter = "blur(0px)";
  document.getElementById("instructions").style.backdropFilter = "blur(0px)";


  if (instload_toggle) {
    instructions.style.display = "block";
  } else {
    instructions.style.display = "none";
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
      }, text_interval_time);
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
      }, text_interval_time);
    }
  }
}
