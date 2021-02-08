import { decodeAudioData } from "standardized-audio-context";
import { Meter } from "tone";

export async function fetchSample(url, ctx, contentType = "audio/mpeg-3") {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
    .catch((error) => soundLog(error));
}

export async function aacDecode(url, ctx) {
  let response;
  let arrBuffer;
  return new Promise(async (resolve, reject) => {
    try {
      response = await fetch(url, { mimeType: "audio/aac" });
      arrBuffer = await response.arrayBuffer();
    } catch (error) {
      import(`./samples/fallback.aac`).then(async (file) => {
        response = await fetch(file.default, { mimeType: "audio/aac" });
        arrBuffer = await response.arrayBuffer();
      });
    }
    let audioBuffer;
    try {
      audioBuffer = await decodeAudioData(
        ctx._context._nativeContext,
        arrBuffer
      );
    } catch (error) {
      import(`./samples/fallback.aac`).then(async (file) => {
        response = await fetch(file.default, { mimeType: "audio/aac" });
        arrBuffer = await response.arrayBuffer();
        audioBuffer = await decodeAudioData(
          ctx._context._nativeContext,
          arrBuffer
        );
      });
    }

    soundLog(audioBuffer);
    resolve(audioBuffer);
  });
}

export function removeZeroValues(arr) {
  return arr.filter((val) => val !== 0);
}

export function debounce(fn, delay) {
  let timeOutId;
  return function (...args) {
    if (timeOutId) {
      clearTimeout(timeOutId);
    }
    timeOutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function once(func) {
  let calls = 1;
  return function () {
    if (calls > 0) {
      func.apply(null, arguments);
      calls--;
    }
  };
}

export function probeLevel(node, time = 10) {
  console.log(node);
  let seconds = 0;
  const meter = new Meter();
  node.connect(meter);
  const metering = setInterval(() => {
    console.log(meter.getValue());
    seconds++;
    if (seconds >= time) {
      node.disconnect(meter);
      clearInterval(metering);
      seconds = 0;
    }
  }, 100);
}

export function throttle(fn, delay) {
  let scheduledId;
  return function throttled() {
    const context = this;
    const args = arguments;
    const throttledCall = fn.apply(context, args);
    if (scheduledId) return;
    scheduledId = setTimeout(() => {
      throttledCall();
      clearTimeout(scheduledId);
    }, delay);
  };
}

//  map one range of values to another
export function mapValue(input, inMin, inMax, outMin, outMax) {
  return ((input - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function normalizeArray(arr, min, max) {
  return arr.map((val) => {
    return mapValue(val, Math.min(...arr), Math.max(...arr), min, max).toFixed(
      2
    );
  });
}

export function isBetween(x, min, max) {
  return x >= min && x <= max;
}

export function getIdealVolume(buffer) {
  return new Promise((resolve, reject) => {
    // TODO: ADD GETCHANNELDATA CHECK

    if (!typeof buffer === Object) {
      soundLog("buffer is invalid. Skipping");
      reject(false);
    }
    if (buffer) {
      const decodedBuffer = buffer.getChannelData(0);
      const sliceLen = Math.floor(buffer.sampleRate * 0.05);
      let averages = [];
      let sum = 0.0;
      for (var i = 0; i < decodedBuffer.length; i++) {
        sum += decodedBuffer[i] ** 2;
        if (i % sliceLen === 0) {
          sum = Math.sqrt(sum / sliceLen);
          averages.push(sum);
          sum = 0;
        }
      }
      // Ascending sort of the averages array
      averages.sort((a, b) => a - b);
      // Take the average at the 95th percentile
      let a = averages[Math.floor(averages.length * 0.95)];
      let gain = 1.0 / a;
      let diff = 1.0 - a;
      soundLog("INITIAL GAIN:" + gain / 10);
      soundLog("DIFF:" + diff);
      let safeVal;
      if (diff > 0.99) {
        soundLog("possible error. being safe");
        safeVal = 2000;
        gain = gain / 0.3;
      } else {
        safeVal = 7000;
        // soundLog("Difference:" + diff);
        // if (gain <= 1.0) {
        //   gain = gain / 20;
        // }
        // if (gain <= 5.0) {
        //   gain = gain / 10;
        // }
        // if (gain <= 15.0) {
        //   gain = gain / 4;
        // }
        // if (gain <= 30.0 && gain >= 15.0) {
        //   gain = gain / 1.5;
        // }
        // if (gain < 100 && gain > 30) {
        //   gain = gain / 2;
        // }
      }
      gain = Math.min(gain, safeVal);
      gain = Math.max(gain, 3);
      soundLog(`Adjusted gain x ${gain / 10}`);
      resolve((gain / 10.0).toFixed(2));
    }
  });
}
export function safariPolyFill(safariAudioTrack) {
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
}
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function soundLog(str) {
  window.logging &&
    console.log(
      `%cSound: ${str}`,
      "color:#233E82; font-family:'Arial';color:white; font-weight: 500; background:black;"
    );
}

export function checkFileVolume(buf) {
  if (buf.getChannelData) {
    window.logging && soundLog(buf.getChannelData(0).length);
    if (buf.getChannelData(0).length < 65536) {
      if (Math.max(...buf.getChannelData(0)) > 0) {
        return true;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}
