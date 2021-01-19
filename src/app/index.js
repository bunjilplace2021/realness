import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

import debounce from "lodash/debounce";

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
  aacDecode,
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
  removeZeroValues,
  randomChoice,
  getNodes,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();

const isMobile = window.innerWidth < 600;
let fallBack;

window.safari =
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome");

let isMp3Supported = navigator.mediaCapabilities
  .decodingInfo({
    type: "file",
    audio: {
      contentType: "audio/mp3",
    },
  })
  .then(function (result) {
    return result.supported;
  });

// window.safari = false;
let safariAudioTrack;
let isMuted = true;
let muteClicked = 0;
let sampleRate = 44100;
// Turn on logging
let logging = true;
// create own audio context
let soundtrackAudioCtx = new Context({
  latencyHint: "playback",
  updateInterval: 1,
  lookAhead: 0.1,
  bufferSize: 1024,
  state: "suspended",
});

soundtrackAudioCtx.name = "Playback Context";

/*
SAFARI FALLBACK
 */

window.soundtrackAudioCtx = soundtrackAudioCtx;
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

const recordLength = 1000;
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
  if (window.MediaRecorder) {
    safariAudioTrack && safariAudioTrack.pause();
    recordButton.classList.toggle("red");
    try {
      soundtrackAudioCtx.destination.volume = 0;
      await r.getPermissions();
      logging && soundLog("got permissions");
      await r.recordChunks();
      const decodedBuffer = await r.loadToBuffer();
      setTimeout(() => {
        decodedBuffer && recordButton.classList.remove("red");
        reloadBuffers(decodedBuffer);
        f.uploadSample(r.audioBlob);
        safariAudioTrack && safariAudioTrack.play();
        soundtrackAudioCtx.destination.volume = 1;
      }, recordLength);
    } catch (error) {
      console.log(error);
      recordButton.classList.remove("red");
    }
  } else {
    console.log("media recording is not supported in this browser");
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

const checkFileVolume = (buf) => {
  return Math.max(...buf.getChannelData(0));
};
const reloadBuffers = async (customBuffer = null) => {
  const mp3Supported = await isMp3Supported;
  // fetch new samples from database and load them into existing buffers
  if (!customBuffer) {
    synths.forEach(async (synth) => {
      await f.getRandomSample();
      let buf;
      if (mp3Supported) {
        let playBuf;
        buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
        if (checkFileVolume(buf) > 0) {
          playBuf = buf;
          console.log("clip is not silent, continuing");
        } else {
          await f.getRandomSample();
          buf = await fetchSample(f.audioFile);
          playBuf = buf;
        }
        const resampled = await resampleBuffer(playBuf, sampleRate);
        let floatBuf = new Float32Array(resampled.length);
        //  REMOVE SILENCE FROM SAMPLES BEFORE LOADING TO BUFFER -- ISSUE #9
        resampled.copyFromChannel(floatBuf, 0, 0);
        const newBuf = removeZeroValues(floatBuf);
        synth.buffer.copyToChannel(newBuf, 0, 0);
      } else {
        console.log("can't reload buffers on this browser");
      }

      // purge buffer
      // floatBuf = null;
      synth.randomStarts();
      // synth.rampVolume(1, soundtrackAudioCtx.currentTime + 10);
      synth.randomInterpolate();
      logging && soundLog("reloaded buffers");
    });
  } else {
    let floatBuf = new Float32Array(customBuffer.length);
    floatBuf = customBuffer.getChannelData(0);
    const resampled = await resampleBuffer(customBuffer, sampleRate);

    synths.forEach((synth) => {
      synth.buffer.copyToChannel(resampled.getChannelData(0), 0, 0);
      // synth.randomStarts();
      // synth.randomInterpolate();
      logging && soundLog("loaded user buffers");
      // subOsc.start();
      // null the buffer so that doesn't try to reload the user buffer on next loop
      customBuffer = null;
    });
  }
};

// RADIUS LIMIT LISTENER
let radiuses = 0;
window.addEventListener("radius_reached", () => {
  radiuses++;
  const debounced = debounce(reloadBuffers, 1000);
  if (radiuses % 20 === 0) {
    debounced();
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

// SETUP subOscillator
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
  const mp3Supported = await isMp3Supported;
  console.log(`mp3 is ${mp3Supported ? "" : "not"} supported in this browser`);
  for (let i = 0; i < numSources; i++) {
    await f.getRandomSample();
    let buf;
    let playBuf;
    let resampled;
    if (mp3Supported) {
      buf = await fetchSample(
        await randomChoice(f.files.items).getDownloadURL(),
        soundtrackAudioCtx
      );

      if (checkFileVolume(buf) > 0) {
        playBuf = buf;
        console.log("clip is not silent, continuing");
      } else {
        console.log("clip is silent: reloading");

        buf = await fetchSample(
          await randomChoice(f.files.items).getDownloadURL()
        );
        console.log(buf);
        playBuf = buf;
      }
    } else {
      buf = await aacDecode(f.audioFile, soundtrackAudioCtx);
    }
    if (playBuf) {
      resampled = await resampleBuffer(playBuf, sampleRate);
      logging && soundLog("Loaded GrainSynth " + (i + 1));
      if (!window.safari) {
        synths.push(new GrainSynth(resampled, soundtrackAudioCtx, numVoices));
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
// window.meter = new Meter();
const startAudio = async () => {
  // if the audioCtx is suspended - it must be the first time it is run
  if (!isMuted) {
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
    // masterBus.input.connect(window.meter);
    document.querySelector("body").addEventListener("click", () => {
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

// Loops to synchronize with cisual content
const runLoops = () => {
  // // loop to poll paprticle system values
  synths[0].transport.scheduleRepeat((time) => {
    pollValues();
  }, 10);
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

// Change UI
const changeMuteButton = () => {
  if (muteButton.classList.contains("fa-volume-off")) {
    muteButton.classList.remove("fa-volume-off");
    muteButton.classList.add("fa-volume-up");
  } else {
    muteButton.classList.add("fa-volume-off");
    muteButton.classList.remove("fa-volume-up");
  }
};

//  MAIN ///
// load synths!
const main = async () => {
  if (window.safari) {
    loadFallback();
  } else {
    document.querySelector("#menuicon").addEventListener("click", async () => {
      if (soundtrackAudioCtx.rawContext.state === "suspended") {
        console.log("attempting to start audio");
        await soundtrackAudioCtx.rawContext.resume();
        await start();
        window.isSoundStarted = true;
        console.log(soundtrackAudioCtx.rawContext.state);
      }
    });
    isMp3Supported = await isMp3Supported;
    await soundtrackAudioCtx.rawContext.resume();
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
