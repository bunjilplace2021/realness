import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";
import throttle from "lodash/throttle";
// import debounce from "lodash/debounce";

// !TODO: GRAPH GAIN STAGING!!!
// GLOBAL VARIABLES
import {
  getContext,
  Context,
  FMOscillator,
  Filter,
  Noise,
  setContext,
  start,
  debug,
  Meter,
} from "tone";

debug.setLogger(console);
// UTILITIES
import {
  once,
  debounce,
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
  removeZeroValues,
  randomChoice,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();

const isMobile = window.innerWidth < 600;
let fallBack;

window.safari =
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome");
let safariAudioTrack;
let isMuted = true;
let muteClicked = 0;
let sampleRate = 44100;
// Turn on logging
let logging = true;
// create own audio context
let soundtrackAudioCtx = new Context({
  // sampleRate: 44100,
  latencyHint: "playback",
  updateInterval: 1,
  bufferSize: 1024,
  state: "suspended",
});

soundtrackAudioCtx.name = "Playback Context";

/*
SAFARI FALLBACK
 */
if (window.safari) {
  safariAudioTrack = new Audio();
  // set to safari specific audio context
  setContext(new webkitAudioContext());
  // add polyfill for Media Recorder
  import("audio-recorder-polyfill").then((audioRecorder) => {
    window.MediaRecorder = audioRecorder.default;
  });
  window.addEventListener("touchstart", () => {
    safariAudioTrack.autoplay = true;
    safariAudioTrack.muted = false;
    // safariAudioTrack.play();
    // safariAudioTrack.pause();
    // safariAudioTrack.currentTime = 0;
  });
  console.log("loaded MediaRecorder polyfill for safari");
}
const loadFallback = async () => {
  if (typeof fallBack == "undefined") {
    import(/* webpackChunkName:"fallback" */ "./samples/fallback.mp3").then(
      (file) => {
        fallBack = file.default;
        safariAudioTrack.load();
        safariAudioTrack.src = fallBack;
        safariAudioTrack.loop = true;
        safariAudioTrack.addEventListener("loadedmetadata", () => {
          muteButton.classList = "";
          muteButton.classList.add("fa-volume-off");
          safariAudioTrack.muted = false;
          muteButton.classList.add("fa", "fa-volume-off");
        });
      }
    );
  }
};

/* GLOBAL VARIABLES */
setContext(soundtrackAudioCtx);
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth(soundtrackAudioCtx);
let f = new FireBaseAudio(soundtrackAudioCtx);

const recordLength = 200;
let r = new Recorder(recordLength, soundtrackAudioCtx);

const uiNotes = ["C3", "F3", "A3", "E3", "G3", "C4", "A4"];

// number of different sources to use
const numSources = isMobile ? 1 : 3;

// number of voices per synth
const numVoices = isMobile ? 2 : 3;
const muteButton = document.querySelector("#mute");
const recordButton = document.querySelector("#recordButton");

/* EVENT LISTENERS */

// allow unmuting once synths loaded from firebase
muteButton.onclick = async () => {
  //  if safari - load synths on unmute
  // keep track of number of clicks
  muteClicked++;
  isMuted = !isMuted;
  if (window.safari) {
    safariAudioTrack.volume = !isMuted * 0.8;
    u.master.gain.value = !isMuted;
    if (muteClicked === 1) {
      u.master.toDestination();
      // document.querySelector("body").addEventListener("click", () => {
      //   u.play(uiNotes[~~Math.random * uiNotes.length]);
      // });
      UISound();
      soundtrackAudioCtx.resume();
      safariAudioTrack.play();
    }
  }
  changeMuteButton();
  //  if synths are loaded, start audio and change DOM element
  if (synthsLoaded) {
    if (!isMuted) {
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

const recordSnippet = async () => {
  safariAudioTrack && safariAudioTrack.pause();
  recordButton.classList.toggle("red");
  try {
    soundtrackAudioCtx.destination.volume = 0;
    await r.getPermissions();
    logging && soundLog("got permissions");

    if (window.MediaRecorder) {
      await r.recordChunks();
      const decodedBuffer = await r.loadToBuffer();
      setTimeout(() => {
        decodedBuffer && recordButton.classList.remove("red");
        reloadBuffers(decodedBuffer);
        f.uploadSample(r.audioBlob);
        safariAudioTrack && safariAudioTrack.play();
        soundtrackAudioCtx.destination.volume = 1;
      }, recordLength);
    } else {
      soundLog("MediaRecorder not available in this browser. Trying polyfill.");
    }
  } catch (error) {
    console.log(error);
    recordButton.classList.remove("red");
  }
};
recordButton.onclick = async () => {
  recordSnippet();
};

// list all samples in database

const subOsc = new FMOscillator({
  frequency: 40,
  harmonicity: 0.5,
  detune: 0,
});

const reloadBuffers = (customBuffer = null) => {
  // fetch new samples from database and load them into existing buffers
  if (!customBuffer) {
    synths.forEach(async (synth) => {
      await f.getSample();
      const buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
      console.log(f.audioFile);
      const resampled = await resampleBuffer(buf, sampleRate);
      let floatBuf = new Float32Array(resampled.length);
      //  REMOVE SILENCE FROM SAMPLES BEFORE LOADING TO BUFFER -- ISSUE #9
      resampled.copyFromChannel(floatBuf, 0, 0);
      const newBuf = removeZeroValues(floatBuf);
      synth.buffer.copyToChannel(newBuf, 0, 0);
      // purge buffer
      // floatBuf = null;
      synth.randomStarts();
      synth.rampVolume(1, soundtrackAudioCtx.currentTime + 10);
      synth.randomInterpolate();
      logging && soundLog("reloaded buffers");
    });
  } else {
    let floatBuf = new Float32Array(customBuffer.length);
    floatBuf = customBuffer.getChannelData(0);
    const newBuf = removeZeroValues(floatBuf);

    synths.forEach((synth) => {
      synth.buffer.copyToChannel(newBuf, 0, 0);
      synth.randomStarts();
      synth.randomInterpolate();
      logging && soundLog("loaded user buffers");
      // subOsc.start();
      // null the buffer so that doesn't try to reload the user buffer on next loop
      customBuffer = null;
    });
  }
};
let radiuses = 0;
window.addEventListener("radius_reached", () => {
  console.log();
  radiuses++;
  const timedAction = setTimeout(reloadBuffers, 100);

  if (radiuses % 20 !== 0) {
    clearTimeout(timedAction);
  }
});

// method to play UI sounds
const UISound = () => {
  let count = 0;
  let recordings = 0;
  let recordLimit = isMobile ? 1 : 3;
  window.addEventListener("pixel_added", () => {
    count++;

    // restrict upload to counter
    if (count > 20 && count % 5 === 0) {
      recordings++;

      if (recordings < recordLimit) {
        recordSnippet();
      } else {
        console.log("user recording limit reached");
      }
    }

    !isMuted && u.play(randomChoice(uiNotes));
  });
};

const subOscillator = () => {
  subOsc.filter = new Filter();
  subOsc.connect(subOsc.filter);
  const noise = new Noise({
    type: "pink",
    volume: -14,
  });
  noise.connect(subOsc.filter);
  masterBus.connectSource(subOsc.filter);
  subOsc.volume.value = -48;
  subOsc.volume.targetRampTo(-24, 10);
  subOsc.filter.frequency.value = 80;
  subOsc.filter.gain.value = 10;
  noise.start("+1");
  subOsc.start("+1");
};
//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  await f.listAll();
  for (let i = 0; i < numSources; i++) {
    await f.getSample();
    const buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
    if (f.audioFile) {
      logging && soundLog("Loaded GrainSynth " + (i + 1));
      if (!window.safari) {
        synths.push(new GrainSynth(buf, soundtrackAudioCtx, numVoices));
      } else {
        synths.push(new GrainSynth(f.audioFile, soundtrackAudioCtx, numVoices));
      }
    }
  }
  synthsLoaded = true;
  muteButton.classList = [];
  muteButton.classList.add("fa", "fa-volume-off");
  muteButton.disabled = false;
  logging && soundLog("Voices loaded");
};

// method to start audio
window.meter = new Meter();
const startAudio = async () => {
  // if the audioCtx is suspended - it must be the first time it is run
  if (soundtrackAudioCtx.state === "suspended" && !isMuted) {
    await start();
    await soundtrackAudioCtx.resume();
    masterBus = new MasterBus(soundtrackAudioCtx);
    masterBus.connectSource(u.master);
    synths.forEach(async (synth, i) => {
      // wait for all of the individual grains to load
      await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
      // if the synth isn't already playing...
      if (!synth.isStopped) {
        // setup synth parameters
        !isMobile &&
          synth.grains.forEach((grain) => (grain.volume.value = 0.6));
        synth.grainOutput.gain.value = 1 / numSources;
        synth.filter.type = "lowpass";
        synth.filter.frequency.value = 880 * (i + 1);
        synth.setDetune((i + 1) * 220 - numSources * 440);
        synth.setPitchShift(-12 / (i + 1));
        // if lower frequency value, higher resonance for low-end drones
        if (synth.filter.frequency.value < 500) {
          synth.filter.Q.value = 2;
        } else {
          synth.filter.Q.value = 0.5;
        }
        // start the synths
        synth.randomInterpolate();
        synth.play(soundtrackAudioCtx.currentTime + i * 0.05);
        // connect the synth output to the master processing bus
        synth.output.disconnect(synth.dest);
        masterBus.connectSource(synth.output);

        //  if user clicks, randomize synth parameters and play a UI sound
      }
    });
    subOscillator();
    masterBus.lowpassFilter(5000, 1);
    !isMobile && masterBus.chorus(0.01, 300, 0.9);
    !isMobile && masterBus.reverb(true, 0.3, 4, 0.7);
    masterBus.dest.volume.value = 6;
    masterBus.dest.connect(window.meter);
    document.querySelector("body").addEventListener("click", () => {
      // const note = randomChoice(uiNotes);
      // u.play(note);
      synths.forEach((synth) => {
        synth.randomInterpolate();
      });
    });
    runLoops();
    subOscLoop();
  }
  // don't start audio unless the context is running -- requires user gesture
  if (soundtrackAudioCtx.state === "closed") {
    console.log("audio context is closed by user gesture, restarting");
    await soundtrackAudioCtx.rawContext.resume();
  }

  // main synth setup loop
};

const runLoops = () => {
  // // loop to poll paprticle system values
  synths[0].transport.scheduleRepeat((time) => {
    pollValues();
  }, 10);
  // loop to reload samples every 30 seconds approx
  if (!r.decodedBuffer) {
    // synths[0].transport.scheduleRepeat((time) => {
    //   reloadBuffers();
    // }, 30);
  }
};

const subOscLoop = () => {
  synths[0].transport.scheduleRepeat((time) => {
    subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -100, 100), 30);
    subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 2), 30);
  }, 30);
};

const pollValues = () => {
  try {
    if (ps && ps.particles) {
      let { radius, maxradius } = ps.particles[ps.particles.length - 1];
      synths.forEach((synth, i) => {
        synth.setDetune(mapValue(radius, 0, maxradius, -1000, 0.05));
        let filterFreq = (i + 1) * mapValue(radius, 0, maxradius, 220, 440);
        !isMobile && synth.filter.frequency.rampTo(filterFreq, 10);
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
const stopAudio = () => {
  if (soundtrackAudioCtx.state === "running") {
    soundtrackAudioCtx.rawContext.suspend();
  }
};

const changeMuteButton = () => {
  if (muteButton.classList.contains("fa-volume-off")) {
    muteButton.classList.remove("fa-volume-off");
    muteButton.classList.add("fa-volume-up");
  } else {
    muteButton.classList.add("fa-volume-off");
    muteButton.classList.remove("fa-volume-up");
  }
};

const restartAudio = () => {
  soundtrackAudioCtx.rawContext.resume();
};

//  MAIN ///
// load synths!

const main = async () => {
  if (window.safari) {
    loadFallback();
  } else {
    loadSynths();
    UISound();
  }
};

// run main loop
main();

// ! allow hot reloading of the files in project (webpack)
if (module.hot) {
  module.hot.accept();
}
