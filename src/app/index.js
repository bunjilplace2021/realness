import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import regeneratorRuntime from "regenerator-runtime";

// UTILITIES
import { fetchSample, mapValue } from "./utilityFunctions";
const AudioContext = window.AudioContext || window.webkitAudioContext;

let globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
let synths = [];
let f = new FireBaseAudio();
const numSources = 5;
f.listAll();

const loadSynths = async () => {
  for (let i = 0; i < numSources; i++) {
    await f.getSample();
    const buf = await fetchSample(f.audioFile, globalAudioCtx);
    if (f.audioFile) {
      console.log("loaded synth");
      synths.push(new GrainSynth(buf, globalAudioCtx, numSources));
    }
  }
};
loadSynths();
// ! allow hot reloading of the files in project
if (module.hot) {
  module.hot.accept();
}

setTimeout(() => {
  synths.forEach(async (synth, i) => {
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
    synth.masterBus.gain.value = 1 / synths.length / 2;
    synth.masterPan.pan.value = 2 / synths.length - 1;

    synth.randomLoop(30);
    synth.lowpassFilter(1, 1);
    synth.setVolume(0);
    synth.reverb(true);
    // synth.play();
    // synth.randomStarts();
  });
  document.querySelector("body").onclick = () => {
    synths.forEach((synth) => {
      synth.stop();
      synth.setVolume(
        mapValue(ps.particles[ps.particles.length - 1].size_v2, 0, 400, 0, 0.3)
      );
      synth.randomInterpolate();
      synth.play();
    });
  };
}, 5000);

let pollValues = setInterval(() => {
  console.log(ps);
  if (ps && ps.particles) {
    synths.forEach((synth) => {
      synth.setDetune(
        mapValue(
          ps.particles[~~Math.random() * ps.particles.length].size_v2,
          0,
          400,
          0,
          100
        )
      );

      synth.setOverlap(
        mapValue(
          ps.particles[~~Math.random() * ps.particles.length].size_v2,
          0,
          400,
          0.001,
          1
        )
      );
      if (synth.filter) {
        synth.filter.frequency.value = mapValue(
          ps.particles[~~Math.random() * ps.particles.length].size_v2,
          0,
          400,
          0,
          1000
        );
      }

      synth.setVolume(
        mapValue(
          ps.particles[~~Math.random() * ps.particles.length].size_v2,
          0,
          400,
          0.1,
          0.3
        )
      );
    });
  }
}, 200);

setTimeout(() => {
  console.log("clearing Timer");
  clearInterval(pollValues);
}, 50000);
