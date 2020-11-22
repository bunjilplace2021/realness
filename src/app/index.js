import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

// GLOBAL VARIABLES
import { Context, Distortion } from "tone";

// UTILITIES
import { fetchSample, mapValue, isBetween } from "./utilityFunctions";
import regeneratorRuntime from "regenerator-runtime";

let globalAudioCtx = new Context({
  latencyHint: "playback",
  sampleRate: 48000,
});
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth();
let f = new FireBaseAudio(globalAudioCtx);
const uiNotes = ["C4", "E4", "G4"];
const numSources = 2;
const muteButton = document.querySelector("#mute");
// list all samples in database
f.listAll();

const reloadBuffers = () => {
  // fetch new samples from database and load them into existing buffers
  synths.forEach(async (synth) => {
    console.log("reloading buffers");
    await f.getSample();
    const buf = await fetchSample(f.audioFile, globalAudioCtx);
    const floatBuf = new Float32Array(buf.length);
    buf.copyFromChannel(floatBuf, 0, 0);
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
    if (f.audioFile) {
      console.log("Loaded GrainSynth " + (i + 1));
      synths.push(new GrainSynth(buf, globalAudioCtx, numSources));
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
      synth.rampVolume(1, globalAudioCtx.currentTime + 10);
      synth.filter.type = "lowpass";
      // synth.filter.frequency.value = (i + 1) * 1000;
      // if lower frequency value, higher resonance for low-end drones
      if (synth.filter.frequency.value < 500) {
        synth.filter.Q.value = 4;
      } else {
        synth.filter.Q.value = 1.5;
      }
      // start the synths
      synth.play(globalAudioCtx.currentTime + i * 0.05);
      // connect the synth output to the master processing bus
      synth.output.disconnect(synth.dest);
      masterBus.connectSource(synth.output);
    }
  });

  masterBus.chorus(0.01, 50, 0.5);
  masterBus.reverb(true, 0.1, 2, 0.7);

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
  }, 1);
  // loop to reload samples every 30 seconds approx
  synths[0].transport.scheduleRepeat((time) => {
    reloadBuffers();
  }, 30);
};

const pollValues = () => {
  if (ps && ps.particles) {
    let { radius, maxradius } = ps.particles[ps.particles.length - 1];
    synths.forEach((synth, i) => {
      synth.setGrainSize(mapValue(radius, 0, maxradius, 0.01, 0.1));
      synth.filter.frequency.rampTo(
        (i + 1) * mapValue(radius, 0, maxradius, 100, 20000),
        20
      );
      if (isBetween(radius, maxradius - 50, maxradius)) {
        console.log("reached max radius");
        synth.randomInterpolate();
      }
    });
  }
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
