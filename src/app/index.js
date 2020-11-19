import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import regeneratorRuntime from "regenerator-runtime";
// UTILITIES
import { fetchSample, mapValue } from "./utilityFunctions";
import { Transport } from "tone";
import { Tone } from "tone/build/esm/core/Tone";

const AudioContext = window.AudioContext || window.webkitAudioContext;
let globalAudioCtx = new AudioContext();
let synths = [];
let f = new FireBaseAudio();
const numSources = 2;
// list all samples in database
f.listAll();

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
  console.log("Voices loaded");
};

const startAudio = async () => {
  if (globalAudioCtx.state !== "running") {
    await globalAudioCtx.resume();
  }
  synths.forEach(async (synth, i) => {
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);

    if (!synth.isPlaying) {
      synth.masterBus.gain.value = 1 / synths.length / 2;
      synth.masterPan.pan.value = 2 / synths.length - 1;
      // synth.randomLoop(30);
      synth.lowpassFilter(i * 400, 2);
      synth.rampVolume(0.3, globalAudioCtx.currentTime + 10);
      synth.reverb(true);
      synth.play(globalAudioCtx.currentTime + 0.05);
    }
  });
  document.querySelector("#mycanvas").onclick = () => {
    synths.forEach((synth) => {
      synth.randomInterpolate();
    });
  };
  synths[0].transport.scheduleRepeat((time) => {
    pollValues();
  }, "8n");
};
loadSynths();

setTimeout(() => {
  // pollValues();
}, 10000);

let pollValues = () => {
  if (ps && ps.particles) {
    let { radius, maxradius } = ps.particles[ps.particles.length - 1];
    synths.forEach((synth) => {
      synth.setPitchShift(mapValue(radius, 0, maxradius, -2, 2));
      synth.setRate(mapValue(radius, 0, maxradius, 0.001, 1));
      if (synth.filter) {
        synth.filter.frequency.value = mapValue(radius, 0, maxradius, 0, 20000);
      }
      synth.setVolume(mapValue(radius, 0, maxradius, 0.5, 0.7));
      if (radius === maxradius) {
        console.log("reached max radius");
        synth.randomInterpolate();
      }
    });
  }
};

const muteButton = document.querySelector("#mute");
muteButton.onclick = () => {
  if (muteButton.classList.contains("fa-volume-off")) {
    muteButton.classList.remove("fa-volume-off");
    muteButton.classList.add("fa-volume-up");
  } else {
    muteButton.classList.add("fa-volume-off");
    muteButton.classList.remove("fa-volume-up");
  }

  synths.forEach((synth) => {
    if (!synth.isPlaying) {
      startAudio();
    } else {
      synth.stop();
    }
  });
};

// ! allow hot reloading of the files in project
if (module.hot) {
  module.hot.accept();
}
