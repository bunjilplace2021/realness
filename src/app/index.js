import GrainSynth from "./modules/GrainSynth";
import FireBaseAudio from "./modules/FirebaseAudio";
import Recorder from "./modules/Recorder";
import MasterBus from "./modules/MasterBus";
import UISynth from "./modules/UISynth";

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
} from "tone";

// UTILITIES
import {
  debounce,
  aacDecode,
  fetchSample,
  mapValue,
  resampleBuffer,
  soundLog,
  randomChoice,
  checkFileVolume,
  getIdealVolume,
} from "./utilityFunctions";

import regeneratorRuntime from "regenerator-runtime";
import { attempt } from "lodash";

// suspend auto generated audio context from tone import

getContext().rawContext.suspend();
window.debounce = debounce;

// CHECK USER DEVICE/BROWSER
const isMobile = window.innerWidth < 600;
let fallBack;
window.safari =
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome");

let isIphone =
  navigator.userAgent.includes("iPhone") &&
  navigator.userAgent.includes("Safari");

isIphone = false;
let isMp3Supported = navigator.mediaCapabilities
  .decodingInfo({
    type: "file",
    audio: { contentType: "audio/mp3" },
  })
  .then(function (result) {
    return result.supported;
  });

// RECORDINGS
let recordingAllowed = false;
let recordLimit = isMobile ? 1 : 3;

isIphone ? (recordLimit = 0) : null;
let recordings = 0;
let recordedBuffer = null;
window.recordingLimitReached = false;
window.recording = false;
window.isMuted = true;

// switch logging
process.env.NODE_ENV === "development"
  ? (window.logging = true)
  : (window.logging = false);

// create own audio context

const audioOpts = {
  latencyHint: "playback",
  updateInterval: 1,
  // lookAhead: 1,
  bufferSize: 256,
  state: "suspended",
};
let soundtrackAudioCtx = new Context(audioOpts);
let muteClicked = 0;
let sampleRate = 44100;
soundtrackAudioCtx.name = "Playback Context";

/*
SAFARI FALLBACK
 */

const safariPolyFill = () => {
  safariAudioTrack = new Audio();
  // set to safari specific audio context

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
};

let safariAudioTrack;
window.safari && safariPolyFill();

const initSound = async () => {
  soundLog("attempting to start audio");
  await soundtrackAudioCtx.rawContext.resume();
  await start();
  window.isSoundStarted = true;
  soundLog("Audio context is: " + soundtrackAudioCtx.rawContext.state);
  soundLog("Asking for microphone permissions");
  await r.getPermissions();
};

const loadFallback = async () => {
  if (typeof fallBack == "undefined") {
    import(/* webpackChunkName:"fallback" */ "./samples/fallback.mp3").then(
      (file) => {
        fallBack = file.default;
        safariAudioTrack.src = fallBack;
        safariAudioTrack.load();

        safariAudioTrack.loop = true;
        safariAudioTrack.addEventListener("loadedmetadata", () => {
          muteButton.classList = "";
          muteButton.classList.add("fa-volume-off");
          safariAudioTrack.muted = false;
          muteButton.classList.add("fa", "fa-volume-off");
          UISound();
          window.synthsLoaded = true;
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
window.synthsLoaded = false;
const u = new UISynth(soundtrackAudioCtx);
let f = new FireBaseAudio(soundtrackAudioCtx);

const recordLength = 500;
let r = new Recorder(recordLength, soundtrackAudioCtx);

// number of different sources to use
let numSources = isMobile ? 1 : 3;

// number of voices per synth
let numVoices = isMobile ? 3 : 3;

// DOM ELEMENTS
const muteButton = document.querySelector("#mute");
const playButton = document.querySelector("#play");

// AUDIO TOOLTIP
const audioTooltip = document.querySelector("#audiotooltip");

// const recordButton = document.querySelector("#recordButton");

// SUBOSCILLATOR
let subOsc;

/* EVENT LISTENERS */
playButton.addEventListener("click", () => {
  initSound();
  playButton.style.display = "none";
  muteButton.style.display = "inline-block";
  // attempt to autostart audio, otherwise show unmute button
});
// allow unmuting once synths loaded from firebase
muteButton.onclick = async () => {
  //  if safari - load synths on unmute
  // keep track of number of clicks
  muteClicked++;
  window.isMuted = !window.isMuted;
  if (window.safari || isIphone) {
    safariAudioTrack.muted = window.isMuted;
    soundtrackAudioCtx.muted = window.isMuted;
    if (muteClicked === 1) {
      u.master.toDestination();
      soundtrackAudioCtx.resume();
      safariAudioTrack.play();
    }
  }
  changeMuteButton(window.isMuted);
  //  if synths are loaded, start audio and change DOM element
  if (window.synthsLoaded) {
    if (!window.isMuted) {
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
        soundLog(buf);
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
          soundLog("reverting to original buffer");
          newBuf = buf.getChannelData(0);
        }
        synth.buffer.copyToChannel(newBuf, 0, 0);
      } else {
        // MP3 is not supported, load aac files
        const randomurl = await f.storageRef
          .child(randomChoice(f.fileNames))
          .getDownloadURL();

        console.log("trying to load aac file from " + randomurl);

        buf = await aacDecode(randomurl, soundtrackAudioCtx);
        buf.idealGain = console.log("new buffer: " + buf);
        synth.buffer = buf;
        synth.grainOutput.gain.value = getIdealVolume(buf) / numVoices;
      }
      synth.randomInterpolate();
      soundLog("reloaded buffers");
    });
  } else {
    if (customBuffer) {
      const resampled = await resampleBuffer(customBuffer, sampleRate);

      synths.forEach((synth) => {
        try {
          synth.buffer.copyToChannel(resampled.getChannelData(0), 0, 0);
        } catch (error) {
          synth.buffer = resampled;
        }

        synth.setLoopStart(0);
        synth.randomInterpolate();
        // null the buffer so that doesn't try to reload the user buffer on next loop
        // customBuffer = null;
      });
    }
  }
};

// RADIUS LIMIT LISTENER
let radiuses = 0;
window.addEventListener("radius_reached", () => {
  radiuses++;

  if (radiuses % 20 === 0) {
    console.log("radius reached");
    reloadBuffers();
  }
});

// method to play UI sounds
const UISound = () => {
  window.addEventListener("pixel_added", (e) => {
    const { pixelX, pixelY } = e.data;
    soundLog("pixel added");

    let timeout;
    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      !window.isMuted && u.play([pixelX, window.height - pixelY]);
    }, 33);
  });
};

const startRecording = async () => {
  return new Promise(async (resolve, reject) => {
    if (window.MediaRecorder && recordingAllowed) {
      //   safariAudioTrack && safariAudioTrack.pause();
      try {
        soundLog("started user recording #" + recordings);
        // User is recording, send recording indicator to window object
        window.recording = true;
        if (!isIphone) {
          await r.recordChunks();
        }

        resolve(true);
      } catch (error) {
        soundLog(error);
        reject(false);
      }
    } else {
      window.recording = false;
      //   safariAudioTrack.play();
      reject(false);
      soundLog("media recording is not supported in this browser");
    }
  });
};
const stopRecording = async () => {
  if (r.recording && recordingAllowed && !isIphone) {
    const recordedBlob = await r.stopRecording();
    try {
      recordedBuffer = await r.loadToBuffer(recordedBlob);
    } catch (error) {
      soundLog(error);
    }
    reloadBuffers(recordedBuffer);
    f.uploadSample(r.audioBlob);
    safariAudioTrack && safariAudioTrack.play();
    soundLog("stopped user recording #" + recordings);
    window.recording = false;
    // safariAudioTrack ? (safariAudioTrack.muted = false) : null;
  } else {
    window.recording = false;
  }
};

window.addEventListener("down", async () => {
  if (!recordingAllowed) {
    recordingAllowed = await r.getPermissions();
    soundLog(`user has ${recordingAllowed ? "" : "not"} allowed recording.`);
  }
  if (!window.isMuted && recordingAllowed) {
    recordings++;
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
  if (!window.isMuted) {
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
  subOsc = new FMOscillator({
    frequency: 40,
    harmonicity: 0.5,
    detune: 0,
  });
  subOsc.filter = new Filter();
  subOsc.connect(subOsc.filter);
  const noise = new Noise({
    type: "pink",
    volume: -14,
  });
  noise.connect(subOsc.filter);
  masterBus.connectSource(subOsc.filter);
  subOsc.volume.value = -64;
  subOsc.volume.targetRampTo(-28, 10);
  subOsc.filter.frequency.value = 60;
  subOsc.filter.gain.value = 10;
  noise.start("+1");
  subOsc.start("+1");
};
//  method to download samples from Firebase and load them into buffers - run on page load
const loadSynths = async () => {
  return new Promise(async (resolve, reject) => {
    await f.listAll();
    const mp3Supported = await isMp3Supported;
    if (!mp3Supported) {
      const aacFiles = await f.getAacFiles();

      numVoices = 8;
    }
    soundLog(`mp3 is ${mp3Supported ? "" : "not "}supported in this browser`);
    for (let i = 0; i < numSources; i++) {
      //   await f.getRandomSample();
      let buf;
      let playBuf;
      let resampled;
      let bufGain;
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
        const randomurl = await f.storageRef
          .child(randomChoice(f.fileNames))
          .getDownloadURL();

        console.log("trying to load aac file from " + randomurl);
        buf = await aacDecode(randomurl, soundtrackAudioCtx);

        buf.idealGain = getIdealVolume(buf) / numVoices;

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

        synths.forEach((synth) => {
          synth.filter.frequency.value = 220;
          synth.filter.gain.value = 10;
          playBuf.idealGain
            ? (synth.grainOutput.gain.value = playBuf.idealGain)
            : null; // synth.grainOutput.gain.value = 1 / numSources;
        });
        window.synths = synths;
        soundLog("Loaded GrainSynth " + (i + 1));
      }
    }

    // debug
    window.soundtrackAudioCtx = soundtrackAudioCtx;
    masterBus = new MasterBus(soundtrackAudioCtx);
    masterBus.connectSource(u.master);
    subOscillator();
    masterBus.lowpassFilter(5000, 1);
    window.isMp3 && masterBus.chorus(0.01, 300, 0.9);
    !isMobile && window.isMp3 ? masterBus.reverb(true, 0.3, 4, 0.7) : null;

    window.synthsLoaded = true;
    muteButton.classList = [];
    changeTooltipText();

    muteButton.classList.add("fa", "fa-volume-off");
    muteButton.disabled = false;
    soundLog("Voices loaded");
    resolve(true);
  });
};

const changeTooltipText = () => {
  if (window.isMuted) {
    audioTooltip.innerHTML = "unmute sound";
  } else {
    audioTooltip.innerHTML = "mute sound";
  }
};

// method to start audio
const startAudio = async () => {
  changeTooltipText();
  if (!window.isMuted) {
    await start();
    await soundtrackAudioCtx.resume();
    if (!isIphone) {
      synths.forEach(async (synth, i) => {
        // wait for all of the individual grains to load
        await synth.isGrainLoaded(synth.grains[synth.grains.length - 1]);
        // if the synth isn't already playing...
        window.logging && soundLog(synth);
        if (!synth.isStopped) {
          // setup synth parameters
          // !isMobile && synth.grains.forEach((grain) => (grain.volume.value = 1));

          // start the synths
          synth.randomInterpolate();
          synth.play(soundtrackAudioCtx.currentTime + i * 0.05);
          synth.output.disconnect(synth.dest);
          masterBus.connectSource(synth.output);
        }
      });

      runLoops();
      subOscLoop();
    }
  }
  if (soundtrackAudioCtx.state === "closed") {
    soundLog("audio context is closed by user gesture, restarting");
    await soundtrackAudioCtx.rawContext.resume();
  }
};

// Loops to synchronize with cisual content
const runLoops = () => {
  try {
    synths[0].transport.scheduleRepeat((time) => {
      pollValues();
    }, 10);
  } catch (e) {
    soundLog(e);
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
        // console.log("setting to filter frequency" + filterFreq);
        !isMobile && synth.filter.frequency.rampTo(filterFreq, 5);
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
    numVoices = 3;
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
