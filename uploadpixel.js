let pixelShader;
let backgroundShader;
let pipShader;
let cam;
let pixelpg;
let pippg;
let colour, oldcolour;
let lerp_amount = 0;
let menu_loc = false;
let coltoggle = false;
let color_lerp = 0;
let backgroundcol;
let webcam_permission = false;

let amt, startColor, newColor;
let rect;

//load shader for camera module

function shaderPreload() {
	// load the shader
	pixelShader = loadShader('shader/vertex.vert', 'shader/aspect.frag');
	pipShader = loadShader('shader/vertex.vert', 'shader/pip.frag');
}

function shaderSetup() {
	// initialize the webcam at the window size

	cam = createCapture(VIDEO, hasGetUserMedia());

	cam.elt.setAttribute('playsinline', '');

	pixelpg = createGraphics(cnv.width, cnv.height, WEBGL);
	pippg = createGraphics(cnv.width, cnv.height, WEBGL);


	colour = color(0, 0, 0);
	oldcolour = color(0, 0, 0);
	backgroundcol = color(0, 0, 0);

	startColor = color(255, 255, 255);
	newColor = color(255, 255, 255);
	amt = 0;
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
	pixelShader.setUniform('u_lerp', 1); //map(lerp_amount, 0, 50, 0, 1)
	pixelShader.setUniform('u_safari', isSafari ? 1 : 0);
	// lets just send the cam to our shader as a uniform
	if (!isMobile) {
		//check camera and device orientation on mobile
		pixelShader.setUniform('u_devicecamres', [cam.width, cam.height]);
	} else {
		if (height > width) {
			pixelShader.setUniform('u_devicecamres', [cam.width, cam.height]);
		} else {
			pixelShader.setUniform('u_devicecamres', [cam.height, cam.width]);
		}
	}
	pixelpg.rect(0, 0, width, height);
}

function pipShaderDraw() {
//	backgroundpg.shader(backgroundShader);
	pippg.shader(pipShader);

	let mx = map(mouseX, 0, width, 0, 1);
	let my = map(mouseY, 0, height, 0, 1);

	let pipx = width - 30;
	let pipy = isMobile && width < height ? document.documentElement.clientHeight - 30 : height - 30;

	let pip_x = map(pipx, 0, width, 1, 0);
	let pip_y = map(pipy, 0, height, 0, 1);

	let pip_mx = norm(map(mouseX, 0, width, pipx - width / 5, pipx), 0, width);
	let pip_my = norm(map(mouseY, 0, height, pipy - height / 5, pipy), 0, height);

	pipShader.setUniform('u_resolution', [width, height]);
	pipShader.setUniform('u_mouse', [mx, my]);
	pipShader.setUniform('u_pip', [pip_x, pip_y]);
	pipShader.setUniform('u_pip_mouse', [pip_mx, pip_my]);
	pipShader.setUniform('tex1', pixelpg);
	pipShader.setUniform('u_color', [backgroundcol.levels[0], backgroundcol.levels[1], backgroundcol.levels[2]]);

	// rect gives us some geometry on the screen

	pippg.rect(0, 0, width, height);

}

function removeData() {
	var testremove = database.ref('test3');
	testremove
		.remove()
		.then(function() {
			console.log('Remove succeeded.');
		})
		.catch(function(error) {
			console.log('Remove failed: ' + error.message);
		});

	//color_lerp = 0;
}

function hasGetUserMedia() {
	//permission check
	let constraints = {
		video: true
		// audio: true
	};

	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(function(stream) {
			webcam_permission = true;
			webcam = true;
			console.log('webcam connected');
			window.stream = stream;
		})
		.catch(function(err) {
			webcam = false;
			webcam_permission = false;
			console.log('No Webcam', err);
		});
}

function webcamCheck() {
	//check if still connected
	navigator.mediaDevices
		.enumerateDevices()
		.then((devices) => {
			const cameras = devices.filter((d) => d.kind === 'videoinput');
			if (cameras.length > 0) {
				webcam = true;
			} else {
				webcam = false;
			}
		})
		.catch(function(err) {
			console.log(err.name + ': ' + err.message);
			webcam = false;
		});
}

function shaderMousePressed() {
	if (webcam_permission) {
		webcamCheck();
	}

	colour = pixelpg.get(width - mouseX, isSafari ? mouseY : height - mouseY);
	let rand_gen = floor(random(0, 3));

	// texture upside down?
	var data = {
		uuid: uuid,
		mouseX_loc: mouseX,
		mouseY_loc: mouseY,
		rand: rand_gen,
		colour_loc: colour,
		deviceWidth: width,
		deviceHeight: height,
		touchTime: touchtime
	};

	var test = database.ref('test3');

	//do not upload pixel if location under menu element check

	rect = document.getElementById('top').getBoundingClientRect();


	if (mouseY <= rect.height) {
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
	pippg.resizeCanvas(w, h);
}
