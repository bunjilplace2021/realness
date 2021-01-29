import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

import debounce from "lodash/debounce";

// !TODO: Homegenize buffer loading process to "loadbuffers" function
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
} from "tone";

debug.setLogger(console);
// UTILITIES
import {
  aacDecode,
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
  randomChoice,
  checkFileVolume,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();

const isMobile = window.innerWidth < 600;
let fallBack;

window.safari =
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome");
let isIphone = navigator.userAgent.includes("iPhone");
let isMp3Supported = navigator.mediaCapabilities
  .decodingInfo({
    type: "file",
    audio: { contentType: "audio/mp3" },
  })
  .then(function (result) {
    return result.supported;
  });

// window.safari = false;
let safariAudioTrack;
let isMuted = true;
let muteClicked = 0;
let sampleRate = 11025;
let recordingAllowed = false;
let recordLimit = isMobile ? 1 : 3;
let recordings = 0;

window.recordingLimitReached = false;
window.recording = false;

let recordedBuffer = null;
// Turn on logging
let logging = true;
// create own audio context

const audioOpts = {
  latencyHint: "playback",
  updateInterval: 1,
  lookAhead: 1,
  bufferSize: 4096,
  state: "suspended",
};
let soundtrackAudioCtx = new Context(audioOpts);

soundtrackAudioCtx.name = "Playback Context";

/*
SAFARI FALLBACK
 */

window.soundtrackAudioCtx = soundtrackAudioCtx;
if (window.safari) {
  safariAudioTrack = new Audio();
  // set to safari specific audio context
  console.log(soundtrackAudioCtx);
  if (window.webkitAudioContext) {
    setContext(new webkitAudioContext(audioOpts));
  }

  window.OfflineAudioContext = window.webkitOfflineAudioContext;
  // add polyfill for Media Recorder
  import("audio-recorder-polyfill").then((audioRecorder) => {
    window.MediaRecorder = audioRecorder.default;
  });
  window.addEventListener("touchstart", () => {
    safariAudioTrack.autoplay = true;
    safariAudioTrack.muted = false;
  });
  soundLog("loaded MediaRecorder polyfill for safari");
}

const initSound = async () => {
  if (soundtrackAudioCtx.rawContext.state === "suspended") {
    soundLog("attempting to start audio");
    await soundtrackAudioCtx.rawContext.resume();
    await start();
    window.isSoundStarted = true;
    soundLog("Audio context is: " + soundtrackAudioCtx.rawContext.state);
  }
};

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
          UISound();
        });
        safariAudioTrack.addEventListener("onended", () => {
          safariAudioTrack.currentTime = 0;
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
let numSources = isMobile ? 1 : 3;

// number of voices per synth
let numVoices = isMobile ? 2 : 3;
const muteButton = document.querySelector("#mute");
const playButton = document.querySelector("#play");
// const recordButton = document.querySelector("#recordButton");

/* EVENT LISTENERS */
playButton.addEventListener("click", () => {
  initSound();
  playButton.style.display = "none";
  muteButton.style.display = "inline-block";
});
// allow unmuting once synths loaded from firebase
muteButton.onclick = async () => {
  //  if safari - load synths on unmute
  // keep track of number of clicks
  muteClicked++;
  isMuted = !isMuted;
  if (window.safari || isIphone) {
    safariAudioTrack.muted = isMuted;
    soundtrackAudioCtx.muted = isMuted;
    if (muteClicked === 1) {
      u.master.toDestination();
      soundtrackAudioCtx.resume();
      safariAudioTrack.play();
    }
  }
  changeMuteButton(isMuted);
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

// const recordSnippet = async () => {
//   if (window.MediaRecorder) {
//     safariAudioTrack && safariAudioTrack.pause();
//     recordButton.classList.toggle("red");
//     try {
//       soundtrackAudioCtx.destination.volume = 0;

//       logging && soundLog("got permissions");
//       await r.recordChunks();
//       const decodedBuffer = await r.loadToBuffer();
//       setTimeout(() => {
//         decodedBuffer && recordButton.classList.remove("red");
//         reloadBuffers(decodedBuffer);
//         f.uploadSample(r.audioBlob);
//         safariAudioTrack && safariAudioTrack.play();
//         soundtrackAudioCtx.destination.volume = 1;
//       }, recordLength);
//     } catch (error) {
//       soundLog(error);
//       recordButton.classList.remove("red");
//     }
//   } else {
//     soundLog("media recording is not supported in this browser");
//   }
// };
// recordButton.onclick = async () => {
//   recordSnippet();
// };

// list all samples in database

const subOsc = new FMOscillator({
  frequency: 40,
  harmonicity: 0.5,
  detune: 0,
});

const reloadBuffers = async (customBuffer = null) => {
  const mp3Supported = await isMp3Supported;
  // fetch new samples from database and load them into existing buffers
  if (!customBuffer) {
    synths.forEach(async (synth) => {
      await f.getRandomSample();
      let buf;
      let newBuf;
      if (mp3Supported) {
        let playBuf;
        buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
        console.log(buf);
        if (checkFileVolume(buf) > 0) {
          playBuf = buf;
          soundLog("clip is not silent, continuing");
        } else {
          await f.getRandomSample();
          buf = await fetchSample(f.audioFile, soundtrackAudioCtx);
          playBuf = buf;
        }
        try {
          const resampled = await resampleBuffer(playBuf, sampleRate);
          //  REMOVE SILENCE FROM SAMPLES BEFORE LOADING TO BUFFER -- ISSUE #9
          newBuf = removeZeroValues(resampled.getChannelData(0));
          // newBuf = resampled.getChannelData(0);
        } catch (e) {
          console.log("reverting to original buffer");
          newBuf = buf.getChannelData(0);
        }
        synth.buffer.copyToChannel(newBuf, 0, 0);
      } else {
        soundLog("can't reload buffers on this browser");
      }

      // purge buffer
      // floatBuf = null;

      synth.randomInterpolate();
      logging && soundLog("reloaded buffers");
    });
  } else {
    if (customBuffer && checkFileVolume(customBuffer) > 0) {
      const resampled = await resampleBuffer(customBuffer, sampleRate);

      synths.forEach((synth) => {
        synth.buffer.copyToChannel(resampled.getChannelData(0), 0, 0);
        synth.setLoopStart(0);
        // synth.setLoopEnd(resampled.duration);
        // synth.randomStarts();
        synth.randomInterpolate();
        logging && soundLog("loaded user buffers");
        // subOsc.start();
        // null the buffer so that doesn't try to reload the user buffer on next loop
        customBuffer = null;
      });
    }
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

  window.addEventListener("pixel_added", (e) => {
    const { pixelX, pixelY } = e.data;
    console.log("pixel added");
    !isMuted && u.play([pixelX, window.height - pixelY]);
  });
};

const startRecording = async () => {
  return new Promise(async (resolve, reject) => {
    if (window.MediaRecorder && recordingAllowed) {
      safariAudioTrack && safariAudioTrack.pause();
      // recordButton.classList.toggle("red");
      try {
        soundLog("started user recording #" + recordings);
        // User is recording, send recording indicator to window object
        window.recording = true;
        await r.recordChunks();
        resolve(true);
      } catch (error) {
        soundLog(error);
        // recordButton.classList.remove("red");
        reject(false);
      }
    } else {
      window.recording = false;
      safariAudioTrack.play();
      soundLog("media recording is not supported in this browser");
    }
  });
};
const stopRecording = async () => {
  if (r.recording && recordingAllowed) {
    const recordedBlob = await r.stopRecording();
    try {
      recordedBuffer = await r.loadToBuffer(recordedBlob);
    } catch (error) {
      console.log(error);
    }

    // recordedBuffer && recordButton.classList.remove("red");
    reloadBuffers(recordedBuffer);
    f.uploadSample(r.audioBlob);
    safariAudioTrack && safariAudioTrack.play();
    soundLog("stopped user recording #" + recordings);
    window.recording = false;
    safariAudioTrack ? (safariAudioTrack.muted = false) : null;
  } else {
    window.recording = false;
  }
};

window.addEventListener("down", async () => {
  if (!recordingAllowed) {
    recordingAllowed = await r.getPermissions();
    soundLog(`user has ${recordingAllowed ? "" : "not"} allowed recording.`);
  }
  if (!isMuted && recordingAllowed) {
    recordings++;
    soundLog(recordings > recordLimit);
    if (recordings > recordLimit) {
      window.recordingLimitReached = true;
    }
    if (!window.recordingLimitReached) {
      startRecording();
    } else {
      soundLog("user recording limit reached");
    }
  }
});
window.addEventListener("released", () => {
  if (!isMuted) {
    if (!window.recordingLimitReached) {
      // make recording at least 100ms
      setTimeout(() => {
        stopRecording();
      }, 100);
    }
    soundLog("mouse is released");
  }
});
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
  subOsc.filter.frequency.value = 60;
  subOsc.filter.gain.value = 10;
  noise.start("+1");
  subOsc.start("+1");
  // subOsc.disconnect();
};
//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  return new Promise(async (resolve, reject) => {
    await f.listAll();
    const mp3Supported = await isMp3Supported;

    if (!mp3Supported) {
      numSources = 1;
      numVoices = 1;
    }
    soundLog(`mp3 is ${mp3Supported ? "" : "not "}supported in this browser`);
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

        if (buf && checkFileVolume(buf) > 0) {
          playBuf = buf;
          soundLog("clip is not silent, continuing");
        } else {
          soundLog("clip is silent: reloading");

          buf = await fetchSample(
            await randomChoice(f.files.items).getDownloadURL(),
            soundtrackAudioCtx
          );
          soundLog(buf);
          playBuf = buf;
        }
      } else {
        buf = await aacDecode(f.audioFile, soundtrackAudioCtx);
        playBuf = buf;
      }
      if (playBuf) {
        if (window.OfflineAudioContext) {
          try {
            resampled = await resampleBuffer(playBuf, sampleRate);
            resampled = removeZeroValues(resampled);
          } catch (e) {
            resampled = playBuf;
          }
        } else {
          resampled = playBuf;
        }
        synths.push(new GrainSynth(resampled, soundtrackAudioCtx, numVoices));
        window.synths = synths;
        logging && soundLog("Loaded GrainSynth " + (i + 1));
      }
    }
    synthsLoaded = true;
    muteButton.classList = [];
    muteButton.classList.add("fa", "fa-volume-off");
    muteButton.disabled = false;
    logging && soundLog("Voices loaded");
    resolve(true);
  });
};

// method to start audio
// window.meter = new Meter();
const startAudio = async () => {
  if (!isMuted) {
    await start();
    await soundtrackAudioCtx.resume();
    masterBus = new MasterBus(soundtrackAudioCtx);
    masterBus.connectSource(u.master);
    synths.forEach(async (synth, i) => {
      // wait for all of the individual grains to load
      await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
      // if the synth isn't already playing...
      console.log(synth);
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
    window.isMp3 && masterBus.chorus(0.01, 300, 0.9);
    !isMobile && window.isMp3 ? masterBus.reverb(true, 0.3, 4, 0.7) : null;
    // masterBus.dest.volume.value = 6;
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
    soundLog("audio context is closed by user gesture, restarting");
    await soundtrackAudioCtx.rawContext.resume();
  }
  // main synth setup loop
};

// Loops to synchronize with cisual content
const runLoops = () => {
  // // loop to poll paprticle system values
  try {
    synths[0].transport.scheduleRepeat((time) => {
      pollValues();
    }, 10);
  } catch (e) {
    console.log(e);
  }
};

const subOscLoop = () => {
  if (synths[0].transport) {
    synths[0].transport.scheduleRepeat((time) => {
      subOsc.detune.rampTo(mapValue(Math.random(), 0, 1, -100, 100), 30);
      subOsc.harmonicity.rampTo(mapValue(Math.random(), 0, 1, 0.5, 2), 30);
    }, 30);
  }
};

const pollValues = () => {
  try {
    if (ps && ps.particles) {
      let { radius, maxradius } = ps.particles[ps.particles.length - 1];
      synths.forEach((synth, i) => {
        synth.setDetune(mapValue(radius, 0, maxradius, -1000, 0.05));
        let filterFreq = (i + 1) * mapValue(radius, 0, maxradius, 440, 880);
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
const changeMuteButton = (muted) => {
  if (!muted) {
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
  isMp3Supported = await isMp3Supported;
  if (!isMp3Supported) {
    f.suffix = "aac";
    numSources = 1;
    numVoices = 1;
  }

  if (!isIphone)
    try {
      window.isMp3 = isMp3Supported;
      await soundtrackAudioCtx.rawContext.resume();
      await loadSynths();
      UISound();
    } catch (error) {
      loadFallback();
    }
  else {
    loadFallback();
  }
};

// run main loop
main();

// ! allow hot reloading of the files in project (webpack)
// if (module.hot) {
// 	module.hot.accept();
// }
