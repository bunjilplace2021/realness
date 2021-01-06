export async function fetchSample(url, ctx) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
    .catch((error) => console.log(error));
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
    const bufferMax = Math.max(...input.getChannelData(0));
    let filter = off.createBiquadFilter();
    filter.frequency.value = ~~(Math.random() * 10 + 1) * 110;
    filter.type = "bandpass";
    //  calculate difference from 1
    // subtract max volume value from 1, set gain to that value
    const diff = Math.abs(1 - bufferMax);
    const gainNode = off.createGain();
    gainNode.gain.value = diff;
    source.buffer = input;
    source.connect(gainNode);
    // filter.connect(gainNode);
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

export function soundLog(str) {
  console.log(
    `%cSound: ${str}`,
    "color:#233E82; font-family:'Arial';color:white; font-weight: 500; background:black;"
  );
}
