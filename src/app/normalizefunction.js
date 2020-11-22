const array = [0.3, 0.8, 0.25, 0.1, 0.01, 0.27];
const mapValue = (input, inMin, inMax, outMin, outMax) => {
  return ((input - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};


normalizeArray(array, 0, 1);
console.log(array);
