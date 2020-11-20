import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import FMSynth from "./modules/UISynth";
import { Context } from "tone";
import regeneratorRuntime from "regenerator-runtime";
// UTILITIES
import { fetchSample, mapValue, isBetween } from "./utilityFunctions";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

let globalAudioCtx = new Context({
  latencyHint: "playback",
});
let masterBus;
let synths = [];
let synthsLoaded = false;
const u = new UISynth();
let f = new FireBaseAudio();
const uiNotes = ["C4", "E4", "G4"];
const numSources = 4;
// list all samples in database
f.listAll();

const reloadBuffers = () => {
  // fetch new samples from databse and load them into existing buffers
  synths.forEach(async (synth) => {
    console.log("reloading buffers");
    await f.getSample();
    const buf = await fetchSample(f.audioFile, globalAudioCtx);
    const floatBuf = new Float32Array(buf.length);
    buf.copyFromChannel(floatBuf, 0, 0);
    synth.buffer.copyToChannel(floatBuf, 0, 0);
  });
};

//  method to download samples from Firebase and load them into buffers
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

document.querySelectorAll("a").forEach((elt) => {
  elt.onclick = () => {
    u.play(uiNotes[~~Math.random * uiNotes.length]);
  };
});

const startAudio = async () => {
  if (globalAudioCtx.state !== "running") {
    await globalAudioCtx.resume();
  }

  masterBus = new MasterBus(globalAudioCtx);
  masterBus.connectSource(u.master);
  synths.forEach(async (synth, i) => {
    await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
    if (!synth.isPlaying) {
      synth.masterBus.gain.value = 1 / synths.length / 2;
      synth.rampVolume(1, globalAudioCtx.currentTime + 10);
      // synth.lowpassFilter(100, 1);
      synth.play(globalAudioCtx.currentTime + i * 0.05);
      await masterBus.connectSource(synth.grainOutput);
      synth.masterBus.disconnect();
    }
  });

  masterBus.reverb(true, 0.1, 1, 0.7);
  u.play();
  console.log(masterBus);
  document.querySelector("body").onclick = () => {
    synths.forEach((synth) => {
      synth.randomInterpolate();
    });
  };
  // synths[0].transport.scheduleRepeat((time) => {
  //   pollValues();
  // }, 0.5);

  synths[0].transport.scheduleRepeat((time) => {
    reloadBuffers();
  }, 30);
};
loadSynths();

let pollValues = () => {
  if (ps && ps.particles) {
    let { radius, maxradius } = ps.particles[ps.particles.length - 1];
    console.log(radius, maxradius);
    synths.forEach((synth) => {
      synth.setGrainSize(mapValue(radius, 0, maxradius, 0.01, 0.1));
      if (isBetween(radius, maxradius - 50, maxradius)) {
        console.log("reached max radius");
        synth.randomInterpolate();
      }
    });
  }
};

const muteButton = document.querySelector("#mute");
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

// ! allow hot reloading of the files in project
if (module.hot) {
  module.hot.accept();
}
