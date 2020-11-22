// load an audiourl to a buffer
export async function fetchSample(url, ctx) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer));
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

export function waitForVariable(variable) {
  const checkforVariable = (variable) => {
    return new Promise((resolve, reject) => {
      if (variable === "undefined" || variable === null || variable === 0) {
        reject(false);
      } else {
        resolve(variable);
      }
    });
  };
  const pollingTimer = setInterval(checkforVariable, 100);
  {
  }
}

export function isBetween(x, min, max) {
  return x >= min && x <= max;
}

export function resampleBuffer(input, target_rate) {
  return new Promise(async (resolve, reject) => {
    // if (typeof input !== "AudioBuffer") {
    //   reject("not AudioBuffer");
    // }
    if (typeof target_rate != "number" && target_rate <= 0) {
      reject("Samplerate is not a number");
    }
    var resampling_ratio = input.sampleRate / target_rate;
    var final_length = input.length * resampling_ratio;
    var off = new OfflineAudioContext(
      input.numberOfChannels,
      final_length,
      target_rate
    );

    var source = off.createBufferSource();
    source.buffer = input;
    source.connect(off.destination);
    source.start(0);
    try {
      const newBuf = await off.startRendering();
      resolve(newBuf);
    } catch (error) {
      reject(error);
    }
  });
}
