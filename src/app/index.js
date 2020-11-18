import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import regeneratorRuntime from "regenerator-runtime";
// UTILITIES
import { fetchSample, mapValue } from "./utilityFunctions";

const AudioContext = window.AudioContext || window.webkitAudioContext;
let globalAudioCtx = new AudioContext();
let synths = [];
let f = new FireBaseAudio();
const numSources = 5;
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

const startAudio = () => {
  synths.forEach(async (synth, i) => {
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
    synth.masterBus.gain.value = 1 / synths.length / 2;
    synth.masterPan.pan.value = 2 / synths.length - 1;
    synth.randomLoop(30);
    synth.lowpassFilter(i * 400, 2);
    synth.rampVolume(0.3, globalAudioCtx.currentTime + 10);
    synth.reverb(true);
    synth.play(globalAudioCtx.currentTime + 0.05);
  });
  document.querySelector("canvas").onclick = () => {
    synths.forEach((synth) => {
      synth.randomInterpolate();
    });
  };
};
loadSynths();

const interval = 2;
let initTime = globalAudioCtx.currentTime;

while (initTime < globalAudioCtx.currentTime - interval)
  console.log(`Initial Time = ${initTime}`);
setTimeout(() => {
  // pollValues();
}, 10000);

let pollValues = () => {
  setInterval(() => {
    if (ps && ps.particles) {
      synths.forEach((synth) => {
        let { radius, maxradius } = ps.particles[ps.particles.length - 1];

        synth.setDetune(mapValue(radius, 0, maxradius, 0, 100));
        synth.setOverlap(mapValue(radius, 0, maxradius, 0.001, 1));
        if (synth.filter) {
          synth.filter.frequency.value = mapValue(
            radius,
            0,
            maxradius,
            0,
            1000
          );
        }
        synth.setVolume(mapValue(radius, 0, maxradius, 0.1, 0.3));
      });
    }
  }, 200);
};

document.querySelector("body").onclick = () => {
  startAudio();
};

// setTimeout(() => {
//   console.log("clearing Timer");
//   clearInterval(pollValues);
// }, 50000);

// ! allow hot reloading of the files in project
if (module.hot) {
  module.hot.accept();
}
