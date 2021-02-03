import { decodeAudioData } from "standardized-audio-context";

export async function fetchSample(url, ctx, contentType = "audio/mpeg-3") {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
    .catch((error) => console.log(error));
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

    window.logging && console.log(audioBuffer);
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
  var decodedBuffer = buffer.getChannelData(0);
  var sliceLen = Math.floor(buffer.sampleRate * 0.05);
  var averages = [];
  var sum = 0.0;
  for (var i = 0; i < decodedBuffer.length; i++) {
    sum += decodedBuffer[i] ** 2;
    if (i % sliceLen === 0) {
      sum = Math.sqrt(sum / sliceLen);
      averages.push(sum);
      sum = 0;
    }
  }
  // Ascending sort of the averages array
  averages.sort(function (a, b) {
    return a - b;
  });
  // Take the average at the 95th percentile
  var a = averages[Math.floor(averages.length * 0.95)];

  var gain = 1.0 / a;
  // Perform some clamping
  //   gain = Math.max(gain, 0.02);

  //   gain = Math.min(gain, 2000.0);

  return gain / 10.0;
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
    window.logging && console.log(buf.getChannelData(0).length);
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
