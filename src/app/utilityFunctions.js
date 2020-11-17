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
