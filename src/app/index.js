import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

// !TODO: Homegenize buffer loading process to "loadbuffers" function
// GLOBAL VARIABLES
import {
  getContext,
  Context,
  Filter,
  Noise,
  setContext,
  start,
  AMOscillator,
} from "tone";

import {
  changeMuteButton,
  changeTooltipText,
  changetoUnmute,
} from "./UIFunctions";
// UTILITIES
import {
  checkMP3,
  debounce,
  aacDecode,
  fetchSample,
  mapValue,
  soundLog,
  randomChoice,
  getIdealVolume,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";
import { result } from "lodash";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();
window.debounce = debounce;

// CHECK USER DEVICE/BROWSER
const isMobile = window.innerWidth < 600;
let isMp3Supported = navigator.mediaCapabilities
  .decodingInfo({
    type: "file",
    audio: { contentType: "audio/mp3" },
  })
  .then((result) => {
    return result.supported;
  });

// RECORDINGS
let recordingAllowed = false;
let recordLimit = isMobile ? 1 : 3;

let recordings = 0;
let recordedBuffer = null;
window.recordingLimitReached = false;
window.recording = false;
window.isMuted = true;

// switch logging
process.env.NODE_ENV === "development"
  ? (window.logging = true)
  : (window.logging = false);

// create own audio context
const audioOpts = {
  latencyHint: "playback",
  updateInterval: 1,
  lookAhead: 0.5,
  bufferSize: 1024,
  state: "suspended",
};

let soundtrackAudioCtx = new Context(audioOpts);
soundtrackAudioCtx.clockSource = "worker";
let muteClicked = 0;

soundtrackAudioCtx.name = "Playback Context";

const initSound = async () => {
  soundLog("attempting to start audio");
  await soundtrackAudioCtx.rawContext.resume();
  await start();
  window.isSoundStarted = true;
  soundLog("Audio context is: " + soundtrackAudioCtx.rawContext.state);
  soundLog("Asking for microphone permissions");
  await r.getPermissions();
};

/* GLOBAL VARIABLES */
setContext(soundtrackAudioCtx);
let masterBus;
let synths = [];
window.synthsLoaded = false;
const u = new UISynth(soundtrackAudioCtx);
let f = new FireBaseAudio(soundtrackAudioCtx);
const recordLength = 500;
let r = new Recorder(recordLength, soundtrackAudioCtx);

// number of different sources to use
let numSources = isMobile ? 1 : 3;

// number of voices per synth
let numVoices = isMobile ? 3 : 3;

// DOM ELEMENTS
const muteButton = document.querySelector("#mute");
const playButton = document.querySelector("#play");
// AUDIO TOOLTIP
const audioTooltip = document.querySelector("#audiotooltip");

// SUBOSCILLATOR
let subOsc;

/* EVENT LISTENERS */
playButton.addEventListener("click", () => {
  initSound();
  playButton.style.display = "none";
  muteButton.style.display = "inline-block";
});
// allow unmuting once synths loaded from firebase
muteButton.onclick = async () => {
  muteClicked++;
  window.isMuted = !window.isMuted;
  changeMuteButton(window.isMuted, muteButton);
  //  if synths are loaded, start audio and change DOM element
  if (window.synthsLoaded) {
    if (!window.isMuted) {
      if (muteClicked === 1) {
        startAudio();
      } else {
        restartAudio();
      }
    } else {
      stopAudio();
    }
  }
};

// RADIUS LIMIT LISTENER
let radiuses = 0;
window.addEventListener("radius_reached", () => {
  radiuses++;
  if (radiuses & (20 == 0)) {
    setTimeout(() => {
      reloadBuffers();
    }, 1000);
  }
});

// method to play UI sounds
const UISound = () => {
  window.addEventListener("pixel_added", (e) => {
    e.preventDefault();
    const { pixelX, pixelY } = e.data;
    soundLog("pixel added");
    setTimeout(() => {
      !window.isMuted && u.play([~~pixelX, window.height - ~~pixelY]);
    }, 33);
  });
};

//  MAIN FUNCTIONS

const reloadBuffers = async (customBuffer = null) => {
  // fetch new samples from database and load them into existing buffers
  if (!customBuffer) {
    let returnedBuffers = await getBuffers(window.isMp3);
    synths.forEach(async (synth, i) => {
      synth.grainOutput.gain.value = returnedBuffers[i].idealGain / numSources;
      synth.buffer.copyToChannel(returnedBuffers[i].getChannelData(0), 0, 0);
      synth.randomInterpolate();
      returnedBuffers = [];
    });
  } else {
    soundLog("CUSTOM BUFFER!");
    soundLog(customBuffer);
    customBuffer.idealGain = getIdealVolume(customBuffer);
    synths.forEach((synth) => {
      try {
        synth.grainOutput.gain.value = customBuffer.idealGain / numSources;
        synth.buffer.copyToChannel(customBuffer.getChannelData(0), 0, 0);
      } catch (error) {
        soundLog("error loading user buffer, continuing");
      }
      synth.play();
      synth.setLoopStart(0);
      synth.randomInterpolate();
    });
  }
};

const startRecording = async () => {
  return new Promise(async (resolve, reject) => {
    if (window.MediaRecorder && recordingAllowed && !window.isMuted) {
      try {
        soundLog("started user recording #" + recordings);
        window.recording = true;
        await r.recordChunks();
        resolve(true);
      } catch (error) {
        soundLog(error);
        reject(false);
      }
    } else {
      window.recording = false;
      reject(false);
      soundLog("media recording is not supported in this browser");
    }
  });
};
const stopRecording = async () => {
  if (r.recording && recordingAllowed) {
    const recordedBlob = await r.stopRecording();
    try {
      recordedBuffer = await r.loadToBuffer(recordedBlob);
    } catch (error) {
      soundLog(error);
    }
    reloadBuffers(recordedBuffer);
    f.uploadSample(r.audioBlob);
    soundLog("stopped user recording #" + recordings);
    window.recording = false;
  } else {
    window.recording = false;
  }
};

window.addEventListener("down", async () => {
  if (!recordingAllowed) {
    recordingAllowed = await r.getPermissions();
    soundLog(`user has ${recordingAllowed ? "" : "not"} allowed recording.`);
  }
  if (!window.isMuted && recordingAllowed) {
    recordings++;
    if (recordings > recordLimit) {
      window.recordingLimitReached = true;
    }
    if (!window.recordingLimitReached) {
      startRecording();
    } else {
      soundLog("user recording limit reached");
    }
  }
});
window.addEventListener("released", () => {
  if (!window.isMuted) {
    if (!window.recordingLimitReached) {
      // make recording at least 100ms
      setTimeout(() => {
        stopRecording();
      }, 100);
    }
    soundLog("mouse is released");
  }
});
// SETUP subOscillator
const subOscillator = () => {
  subOsc = new AMOscillator({
    frequency: 40,
    harmonicity: 0.5,
  });
  subOsc.filter = new Filter({
    frequency: 80,
  });
  subOsc.connect(subOsc.filter);
  const noise = new Noise({
    type: "pink",
    volume: -14,
  });
  noise.connect(subOsc.filter);
  masterBus.connectSource(subOsc.filter);
  subOsc.volume.value = -64;
  subOsc.volume.targetRampTo(-28, 10);
  subOsc.filter.gain.value = 10;
  noise.start("+2");
  subOsc.start("+2");
};

const getBuffers = async (mp3Supported) => {
  soundLog(`mp3 is ${mp3Supported ? "" : "not "}supported in this browser`);
  if (f.files == undefined) {
    await f.listAll();
  }
  return new Promise(async (resolve, reject) => {
    let bufPromises = [];
    let urls = [];
    if (mp3Supported) {
      urls = await Promise.all(
        Array.from({ length: numSources }, () =>
          randomChoice(f.files.items).getDownloadURL()
        )
      );
      urls.forEach((url) => {
        bufPromises.push(fetchSample(url, soundtrackAudioCtx));
      });
    } else {
      if (f.fileNames === undefined) {
        await f.getAacFiles();
      }
      let urlPromises = Array.from({ length: numSources }, () => {
        let url = randomChoice(f.fileNames);
        return f.storageRef.child(url).getDownloadURL();
      });
      urls = await Promise.all(urlPromises);
      urls.forEach((url) =>
        bufPromises.push(aacDecode(url, soundtrackAudioCtx))
      );
    }
    let buffers = await Promise.all(bufPromises);
    buffers.forEach((buffer) => (buffer.idealGain = getIdealVolume(buffer)));
    resolve(buffers);
  });
};

//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  return new Promise(async (resolve, _) => {
    let returnedBuffers = await getBuffers(window.isMp3);
    for (let i = 0; i < numSources; i++) {
      synths.push(
        new GrainSynth(returnedBuffers[i], soundtrackAudioCtx, numVoices)
      );
      synths.forEach((synth) => {
        synth.filter.frequency.value = 220;
        synth.filter.gain.value = 10;
        returnedBuffers[i].idealGain
          ? (synth.grainOutput.gain.value =
              returnedBuffers[i].idealGain / numSources)
          : null;
      });
      soundLog("Loaded GrainSynth " + (i + 1));
    }
    setupMasterBus();
    subOscillator();
    resolve(true);
  });
};

const setupMasterBus = () => {
  masterBus = new MasterBus(soundtrackAudioCtx);
  masterBus.connectSource(u.master);
  masterBus.lowpassFilter(5000, 1);
  window.isMp3 && masterBus.chorus(0.01, 300, 0.9);
  !window.isMp3 && masterBus.delay(300, 0.9);
  !isMobile && window.isMp3 ? masterBus.reverb(true, 0.3, 4, 0.7) : null;
  window.synthsLoaded = true;
  muteButton.classList = [];
  changeTooltipText(audioTooltip);
  changetoUnmute(muteButton);
  soundLog("Voices loaded");
};

// method to start audio
const startAudio = async () => {
  changeTooltipText(audioTooltip);
  if (!window.isMuted) {
    await start();
    await soundtrackAudioCtx.resume();
    synths.forEach(async (synth, i) => {
      // wait for all of the individual grains to load
      await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
      // if the synth isn't already playing...
      window.logging && soundLog(synth);
      if (!synth.isStopped) {
        // setup synth parameters
        // !isMobile && synth.grains.forEach((grain) => (grain.volume.value = 1));
        // start the synths
        synth.randomInterpolate();
        synth.play(soundtrackAudioCtx.currentTime + i * 0.05);
        synth.output.disconnect(synth.dest);
        masterBus.connectSource(synth.output);
      }
    });
    runLoops();
    subOscLoop();
  }
  if (soundtrackAudioCtx.state === "closed") {
    soundLog("audio context is closed by user gesture, restarting");
    await soundtrackAudioCtx.rawContext.resume();
  }
};

// Loops to synchronize with cisual content
const runLoops = () => {
  try {
    synths[0].transport.scheduleRepeat((time) => {
      pollValues();
    }, 10);
  } catch (e) {
    soundLog(e);
  }
};

const subOscLoop = () => {
  if (synths[0].transport) {
    synths[0].transport.scheduleRepeat((time) => {
      subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -100, 100), 30);
      subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 2), 30);
    }, 30);
  }
};

const pollValues = () => {
  try {
    if (ps && ps.particles) {
      let { radius, maxradius } = ps.particles[ps.particles.length - 1];
      synths.forEach((synth, i) => {
        synth.setDetune(mapValue(radius, 0, maxradius, -1000, 0.05));
        let filterFreq = (i + 1) * mapValue(radius, 0, maxradius, 440, 880);
        !isMobile && synth.filter.frequency.rampTo(filterFreq, 5);
      });
      subOsc.filter.frequency.rampTo(
        mapValue(~~radius, 0, ~~maxradius, 50, 200),
        10
      );
    }
  } catch (error) {
    console.warn("particle system not defined, threw error" + error);
  }
};

// STOP AUDIO
const stopAudio = () => {
  if (soundtrackAudioCtx.state === "running") {
    soundtrackAudioCtx.rawContext.suspend();
  }
};
// RESTART AUDIO
const restartAudio = () => {
  soundtrackAudioCtx.rawContext.resume();
};

//  MAIN ///
// load synths!

const main = async () => {
  window.isMp3 = await isMp3Supported;
  if (!window.isMp3) {
    f.suffix = "aac";
    numSources = 1;
    numVoices = 3;
  }
  await soundtrackAudioCtx.rawContext.resume();
  await loadSynths();
  UISound();
};

// run main loop
main();
