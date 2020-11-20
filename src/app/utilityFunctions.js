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
