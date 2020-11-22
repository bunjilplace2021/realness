import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

// GLOBAL VARIABLES
import { Context, FMOscillator, Filter, Noise } from "tone";

// UTILITIES
import {
  fetchSample,
  mapValue,
  isBetween,
  resampleBuffer,
} from "./utilityFunctions";
import regeneratorRuntime from "regenerator-runtime";
import { Tone } from "tone/build/esm/core/Tone";

let globalAudioCtx = new Context({
  latencyHint: "playback",
  lookAhead: 2,
});
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth(globalAudioCtx);
let f = new FireBaseAudio(globalAudioCtx);
const uiNotes = ["C4", "E4", "G4"];

// number of different sources to use
const numSources = 3;
const subOsc = new FMOscillator({
  frequency: 40,
  harmonicity: 0.5,
  detune: 0,
});
// number of voices per synth
const numVoices = 1;
const muteButton = document.querySelector("#mute");
// list all samples in database
f.listAll();

const reloadBuffers = () => {
  // fetch new samples from database and load them into existing buffers
  synths.forEach(async (synth) => {
    await f.getSample();
    const buf = await fetchSample(f.audioFile, globalAudioCtx);
    const resampled = await resampleBuffer(buf, 22050);
    const floatBuf = new Float32Array(resampled.length);
    resampled.copyFromChannel(floatBuf, 0, 0);
    synth.buffer.copyToChannel(floatBuf, 0, 0);
    synth.randomStarts();
    synth.rampVolume(1, globalAudioCtx.currentTime + 10);
  });
};
// method to play UI sounds
const UISound = () => {
  document.querySelectorAll("a").forEach((elt) => {
    elt.addEventListener("click", () => {
      u.play(uiNotes[~~Math.random * uiNotes.length]);
    });
  });
};

//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  for (let i = 0; i < numSources; i++) {
    await f.getSample();
    // fetch random samples from database
    const buf = await fetchSample(f.audioFile, globalAudioCtx);
    const resampledBuf = await resampleBuffer(buf, 22050);
    if (f.audioFile) {
      console.log("Loaded GrainSynth " + (i + 1));
      synths.push(new GrainSynth(resampledBuf, globalAudioCtx, numVoices));
    }
  }
  synthsLoaded = true;
  muteButton.disabled = false;
  muteButton.classList.remove("disabled");
  console.log("Voices loaded");
};

// method to start audio
const startAudio = async () => {
  // don't start audio unless the context is running -- requires user gesture
  if (globalAudioCtx.state !== "running") {
    await globalAudioCtx.resume();
  }
  // setup master effects bus
  masterBus = new MasterBus(globalAudioCtx);
  masterBus.connectSource(u.master);
  // main synth setup loop
  synths.forEach(async (synth, i) => {
    // wait for all of the individual grains to load
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
    // if the synth isn't already playing...
    if (!synth.isPlaying) {
      // setup synth parameters
      // synth.output.gain.value = 1 / synths.length;
      synth.grains.forEach((grain) => (grain.volume.value = 4));
      synth.rampVolume(1, globalAudioCtx.currentTime + 10);
      synth.filter.type = "lowpass";
      synth.filter.gain.value = 40;
      synth.filter.frequency.value = 440 * (i + 1);
      synth.setDetune((i + 1) * 220 - numSources * 220);
      synth.setPitchShift(-12 / (i + 1));
      // if lower frequency value, higher resonance for low-end drones
      if (synth.filter.frequency.value < 500) {
        synth.filter.Q.value = 2;
      } else {
        synth.filter.Q.value = 0.5;
      }
      console.log(synth.filter.frequency.value);
      // start the synths
      synth.play(globalAudioCtx.currentTime + i * 0.05);
      // connect the synth output to the master processing bus
      synth.output.disconnect(synth.dest);
      masterBus.connectSource(synth.output);
    }
  });
  subOsc.filter = new Filter();
  subOsc.connect(subOsc.filter);
  const noise = new Noise("pink");
  noise.connect(subOsc.filter);
  noise.start();
  masterBus.connectSource(subOsc.filter);
  subOsc.volume.value = -64;
  subOsc.volume.targetRampTo(-40, 10);
  subOsc.filter.frequency.value = 80;
  subOsc.start();
  masterBus.lowpassFilter(2000, 1);
  masterBus.filter.gain.value = 40;
  masterBus.chorus(0.01, 300, 0.9);
  // masterBus.reverb(true, 0.1, 4, 0.7);

  u.play();
  //  if user clicks, randomize synth parameters
  document.querySelector("body").onclick = () => {
    synths.forEach((synth) => {
      synth.randomInterpolate();
    });
  };
  // // loop to poll paprticle system values
  synths[0].transport.scheduleRepeat((time) => {
    pollValues();
  }, 10);
  // loop to reload samples every 30 seconds approx
  synths[0].transport.scheduleRepeat((time) => {
    reloadBuffers();
  }, 30);
  subOscLoop();
};

const pollValues = () => {
  if (ps && ps.particles) {
    let { radius, maxradius } = ps.particles[ps.particles.length - 1];
    synths.forEach((synth, i) => {
      synth.setGrainSize(mapValue(radius, 0, maxradius, 0.01, 0.05));
      synth.filter.frequency.rampTo(
        (i + 1) * mapValue(radius, 0, maxradius, 100, 1000),
        20
      );
      if (isBetween(radius, maxradius - 50, maxradius)) {
        console.log("reached max radius");
        synth.randomInterpolate();
      }
    });
  }
};

const subOscLoop = () => {
  synths[0].transport.scheduleRepeat((time) => {
    subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -40, 40), 30);
    subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 0.8), 30);
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
