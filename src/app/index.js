import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";
import fallback from "./samples/fallback.mp3";
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
} from "tone";

// UTILITIES
import {
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
  safariFallback,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();
const isMobile = window.innerWidth < 600;
let isMuted = true;
let muteClicked = 0;
let sampleRate = 44100;

// create own audio context
let soundtrackAudioCtx = new Context({
  sampleRate: 44100,
  latencyHint: "playback",
  updateInterval: 1,
  bufferSize: 1024,
});

soundtrackAudioCtx.name = "Playback Context";

// set that context as the global tone.js context

if (window.safari) {
  setContext(new webkitAudioContext());
}

let safariAudioTrack = null;

const loadFallback = () => {
  safariAudioTrack = new Audio();
  safariAudioTrack.load();
  safariAudioTrack.src = fallback;
  safariAudioTrack.loop = true;
  console.log(safariAudioTrack);
};

setContext(soundtrackAudioCtx);
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth(soundtrackAudioCtx);
let f = new FireBaseAudio(soundtrackAudioCtx);

const recordLength = 2000;
let r = new Recorder(recordLength, soundtrackAudioCtx);

const uiNotes = ["C4", "E4", "G4", "C5", "A5"];

// number of different sources to use
const numSources = isMobile ? 1 : 3;

// number of voices per synth
const numVoices = isMobile ? 2 : 3;
const muteButton = document.querySelector("#mute");
const recordButton = document.querySelector("#recordButton");

recordButton.onclick = async () => {
  recordButton.classList.toggle("red");

  try {
    await r.getPermissions();
    soundLog("got permissions");
    const blob = await r.recordChunks();
    soundLog(blob);
    const decodedBuffer = await r.loadToBuffer();
    setTimeout(() => {
      decodedBuffer && recordButton.classList.remove("red");
      reloadBuffers(decodedBuffer);
      f.uploadSample(r.audioBlob);
    }, recordLength);
  } catch (error) {
    console.log(error);
    recordButton.classList.remove("red");
  }
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
      const resampled = await resampleBuffer(buf, sampleRate);
      let floatBuf = new Float32Array(resampled.length);
      resampled.copyFromChannel(floatBuf, 0, 0);
      synth.buffer.copyToChannel(floatBuf, 0, 0);

      // purge buffer
      // floatBuf = null;
      synth.randomStarts();

      synth.rampVolume(1, soundtrackAudioCtx.currentTime + 10);
      synth.randomInterpolate();
      soundLog("reloaded buffers");
    });
  } else {
    let floatBuf = new Float32Array(customBuffer.length);
    customBuffer.copyFromChannel(floatBuf, 0, 0);
    synths.forEach((synth) => {
      synth.buffer.copyToChannel(floatBuf, 0, 0);
      // purge buffer
      synth.randomStarts();
      synth.randomInterpolate();
      soundLog("loaded user buffers");
    });
  }
};

// method to play UI sounds
const UISound = () => {
  document.querySelectorAll("a").forEach((elt) => {
    elt.addEventListener("click", () => {
      u.play(uiNotes[~~Math.random * uiNotes.length]);
    });
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

    const isSafari = window.safari !== undefined;

    isSafari &&
      console.log("User is on safari! Changing decode to user gesture");
    // fetch random samples from database
    // console.log(f.audioFile);
    // TODO: if it is safari, wait for user gesture before downlaoding file
    let buf;
    if (!isSafari) {
      buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
    } else {
      buf = await safariFallback(f.audioFile, soundtrackAudioCtx);
    }

    // let resampledBuf;
    // try {
    //   resampledBuf = await resampleBuffer(buf, sampleRate);
    // } catch (error) {
    //   resampledBuf = buf;
    // }

    if (f.audioFile) {
      soundLog("Loaded GrainSynth " + (i + 1));
      synths.push(new GrainSynth(buf, soundtrackAudioCtx, numVoices));
    }
  }
  synthsLoaded = true;
  muteButton.classList = [];
  muteButton.classList.add("fa", "fa-volume-off");
  muteButton.disabled = false;
  soundLog("Voices loaded");
};

// method to start audio
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
        !isMobile && synth.grains.forEach((grain) => (grain.volume.value = -6));
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
    document.querySelector("body").onclick = () => {
      u.play(uiNotes[~~Math.random * uiNotes.length]);
      synths.forEach((synth) => {
        synth.randomInterpolate();
      });
    };
    // // loop to poll paprticle system values
    synths[0].transport.scheduleRepeat((time) => {
      pollValues();
    }, 10);
    // loop to reload samples every 30 seconds approx
    if (!r.decodedBuffer) {
      synths[0].transport.scheduleRepeat((time) => {
        reloadBuffers();
      }, 30);
    }
    subOscLoop();
  }

  // don't start audio unless the context is running -- requires user gesture
  if (soundtrackAudioCtx.state === "closed") {
    console.log("audio context is closed by user gesture, restarting");
    await soundtrackAudioCtx.rawContext.resume();
  }

  // main synth setup loop
};

const pollValues = () => {
  try {
    if (ps && ps.particles) {
      let { radius, maxradius } = ps.particles[ps.particles.length - 1];
      synths.forEach((synth, i) => {
        synth.setDetune(mapValue(radius, 0, maxradius, -1000, 0.05));
        let filterFreq = (i + 1) * mapValue(radius, 0, maxradius, 220, 1100);
        !isMobile && synth.filter.frequency.rampTo(filterFreq, 1);
      });
      subOsc.filter.frequency.rampTo(
        mapValue(~~radius, 0, ~~maxradius, 50, 120),
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
const subOscLoop = () => {
  synths[0].transport.scheduleRepeat((time) => {
    subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -100, 100), 30);
    subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 2), 30);
  }, 30);
};
if (window.safari) {
  muteButton.classList = "";
  muteButton.classList.add("fa", "fa-volume-off");
}
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
// allow unmuting once synths loaded from firebase
muteButton.onclick = async () => {
  //  if safari - load synths on unmute

  // keep track of number of clicks
  muteClicked++;
  isMuted = !isMuted;

  if (window.safari) {
    safariAudioTrack.volume = !isMuted;
    u.master.gain.value = !isMuted;
    if (muteClicked === 1) {
      u.master.toDestination();
      document.querySelector("body").addEventListener("click", () => {
        u.play(uiNotes[~~Math.random * uiNotes.length]);
      });
      UISound();
      soundtrackAudioCtx.resume();
      await soundtrackAudioCtx.rawContext._nativeAudioContext.resume();
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

//  MAIN ///
// load synths!
if (window.safari) {
  loadFallback();
}
!window.safari && loadSynths();

UISound();

// ! allow hot reloading of the files in project (webpack)
if (module.hot) {
  module.hot.accept();
}
