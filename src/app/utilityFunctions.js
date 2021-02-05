import {
  decodeAudioData,
  OfflineAudioContext,
} from "standardized-audio-context";

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
export async function safariFallback(url, ctx) {
  return new Promise(async (resolve, reject) => {
    resolve(url);

    //   ctx.decodeAudioData = new webkitAudioContext().decodeAudioData;

    //   ctx.rawContext._nativeContext.decodeAudioData(
    //     arrayBuf,
    //     function (buffer) {
    //       resolve(buffer);
    //     },
    //     function (e) {
    //       reject(e);
    //     }
    //   );
    // });
  });
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

export function resampleBuffer(input, target_rate) {
  return new Promise(async (resolve, reject) => {
    if (typeof target_rate != "number" && target_rate <= 0) {
      reject("Samplerate is not a number");
    }
    if (!input) {
      reject("Input buffer is undefined");
    }
    // if can set samplerate (eg.not on safari)
    let resampling_ratio;

    if (typeof input.sampleRate === Number) {
      resampling_ratio = input.sampleRate / target_rate;
    } else {
      resampling_ratio = 44100 / target_rate;
    }
    let final_length = input.length * resampling_ratio;
    let off = new OfflineAudioContext(
      input.numberOfChannels,
      final_length,
      target_rate
    );
    // NORMALIZE AND FILTER BUFFERS
    let source = off.createBufferSource();
    const gainNode = off.createGain();
    gainNode.gain.value = getIdealVolume(input);
    window.logging && console.log(gainNode.gain.value);
    source.buffer = input;
    source.connect(gainNode);
    gainNode.connect(off.destination);
    source.start(0);
    try {
      resolve(await off.startRendering());
    } catch (error) {
      reject(error);
    }
  });
}

export function getNodes(obj) {
  Object.entries(obj).forEach((entry) => {
    if (entry[1] !== null) {
      const node = entry[1];
      console.log(typeof node);
      if (typeof node === "object") {
      }
    }
  });
}

export function getIdealVolume(buffer) {
  if (!typeof buffer === Object) {
    soundLog("buffer is invalid. Skipping");
    reject(false);
  }
  if (buffer) {
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
  if (buf) {
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
