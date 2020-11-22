const array = [0.3, 0.8, 0.25, 0.1, 0.01, 0.27];
const mapValue = (input, inMin, inMax, outMin, outMax) => {
  return ((input - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
const normalizeArray = (arr, min, max) => {
  console.log(arr);
  const minArrayVal = Math.min(...arr);
  const maxArrayVal = Math.max(...arr);
  const normalizedArray = arr.map((val) => {
    return mapValue(val, minArrayVal, maxArrayVal, min, max).toFixed(2);
  });

  console.log(normalizedArray);
  //   arr.map((value) => {});
};

normalizeArray(array, 0, 1);
console.log(array);
