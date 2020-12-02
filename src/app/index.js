import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

// !TODO: GRAPH GAIN STAGING!!!
// GLOBAL VARIABLES
import {
  getContext,
  Context,
  FMOscillator,
  Filter,
  Noise,
  setContext,
} from "tone";

// UTILITIES
import {
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
} from "./utilityFunctions";
import regeneratorRuntime from "regenerator-runtime";

// suspend auto generated audio context from tone import
getContext().rawContext.suspend();

const isMobile = window.innerWidth < 600;
let sampleRate = isMobile ? 11025 : 44100;

soundLog(sampleRate);
// create own audio context
let soundtrackAudioCtx = new Context({
  latencyHint: "playback",
  lookAhead: 1,
  updateInterval: 1,
  bufferSize: 1024,
});

soundtrackAudioCtx.name = "Playback Context";
// set that context as the global tone.js context
setContext(soundtrackAudioCtx);
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth(soundtrackAudioCtx);
let f = new FireBaseAudio(soundtrackAudioCtx);

const recordLength = 2000;
let r = new Recorder(recordLength, soundtrackAudioCtx);

const uiNotes = ["C4", "E4", "G4"];

// number of different sources to use
const numSources = isMobile ? 1 : 3;

// number of voices per synth
const numVoices = isMobile ? 1 : 2;
const muteButton = document.querySelector("#mute");
const recordButton = document.querySelector("#recordButton");

recordButton.onclick = async () => {
  recordButton.classList.toggle("red");
  await r.getPermissions();
  soundLog("got permissions");
  const blob = await r.recordChunks();
  soundLog(blob);
  await r.loadToBuffer();
  setTimeout(() => {
    r.decodedBuffer && recordButton.classList.remove("red");
    reloadBuffers(r.decodedBuffer);
    f.uploadSample(r.audioBlob);
  }, recordLength);
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
      floatBuf = null;
      synth.randomStarts();
      synth.rampVolume(1, soundtrackAudioCtx.currentTime + 10);
      synth.randomInterpolate();
      soundLog("reloaded buffers");
    });
  } else {
    synths.forEach((synth) => {
      let floatBuf = new Float32Array(customBuffer.length);
      customBuffer.copyFromChannel(floatBuf, 0, 0);
      synth.buffer.copyToChannel(floatBuf, 0, 0);
      // purge buffer
      floatBuf = null;
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
  subOsc.volume.targetRampTo(-34, 10);
  subOsc.filter.frequency.value = 80;
  noise.start("+1");
  subOsc.start("+1");
};
//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  await f.listAll();
  for (let i = 0; i < numSources; i++) {
    await f.getSample();
    // fetch random samples from database
    const buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
    const resampledBuf = await resampleBuffer(buf, sampleRate);
    if (f.audioFile) {
      soundLog("Loaded GrainSynth " + (i + 1));
      synths.push(new GrainSynth(resampledBuf, soundtrackAudioCtx, numVoices));
    }
  }
  synthsLoaded = true;

  muteButton.className = "";
  muteButton.classList.add("fa", "fa-volume-off");
  muteButton.disabled = false;
  // muteButton.classList.remove("disabled");
  soundLog("Voices loaded");
};

// method to start audio
const startAudio = async () => {
  // don't start audio unless the context is running -- requires user gesture
  if (soundtrackAudioCtx.state !== "running") {
    await soundtrackAudioCtx.resume();
  }
  // setup master effects bus

  masterBus = new MasterBus(soundtrackAudioCtx);
  masterBus.connectSource(u.master);
  // main synth setup loop
  synths.forEach(async (synth, i) => {
    // wait for all of the individual grains to load
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
    // if the synth isn't already playing...
    if (!synth.isPlaying) {
      // setup synth parameters
      // synth.output.gain.value = 1 / synths.length;
      synth.grains.forEach((grain) => (grain.volume.value = 1));
      synth.output.gain.value = 0.8;
      synth.filter.type = "lowpass";
      synth.filter.gain.value = 10;
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
    }
  });
  subOscillator();
  masterBus.lowpassFilter(5000, 1);
  masterBus.filter.gain.value = 10;
  !isMobile && masterBus.chorus(0.01, 300, 0.9);
  !isMobile && masterBus.reverb(true, 0.3, 4, 0.7);
  //  if user clicks, randomize synth parameters and play a UI sound
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
  // getNodes(soundtrackAudioCtx);
};

const pollValues = () => {
  if (ps && ps.particles) {
    let { radius, maxradius } = ps.particles[ps.particles.length - 1];
    synths.forEach((synth, i) => {
      synth.setGrainSize(mapValue(radius, 0, maxradius, 0.01, 0.05));
      synth.setDetune(mapValue(radius, 0, maxradius, -1000, 0.05));
      let filterFreq = (i + 1) * mapValue(radius, 0, maxradius, 220, 1100);
      synth.filter.frequency.rampTo(filterFreq, 10);
    });
    subOsc.filter.frequency.rampTo(
      mapValue(~~radius, 0, ~~maxradius, 50, 120),
      10
    );
  }
};

const subOscLoop = () => {
  synths[0].transport.scheduleRepeat((time) => {
    subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -100, 100), 30);
    subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 2), 30);
  }, 30);
};

// allow unmuting once synths loaded from firebase
muteButton.onclick = () => {
  if (synthsLoaded) {
    //  if synths are loaded, start audio and change DOM element
    if (muteButton.classList.contains("fa-volume-off")) {
      muteButton.classList.remove("fa-volume-off");
      muteButton.classList.add("fa-volume-up");
    } else {
      muteButton.classList.add("fa-volume-off");
      muteButton.classList.remove("fa-volume-up");
    }
    if (!synths[synths.length - 1].isPlaying) {
      startAudio();
    } else {
      // or stop the synths
      synths.forEach((synth) => {
        synth.stop();
        synth.isPlaying = false;
      });
    }
  }
};

//  MAIN ///
// load synths!
loadSynths();
UISound();

// ! allow hot reloading of the files in project (webpack)
if (module.hot) {
  module.hot.accept();
}
