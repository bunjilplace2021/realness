import {
  now,
  Gain,
  GrainPlayer,
  PitchShift,
  Compressor,
  BiquadFilter,
  Meter,
} from "tone";

import regeneratorRuntime from "regenerator-runtime";

class GrainSynth {
  constructor(buffer, ctx, voices = 2) {
    // workaround to suspend audiocontext without warnings
    // getContext().rawContext.suspend();

    this.grains = [];
    this.isStopped = false;
    this.numVoices = voices;
    this.buffer = buffer;
    this.toneContext = ctx;
    this.dest = this.toneContext.destination;
    this.dest.name = "Grainsynth Destination";

    this.grainOutput = new Gain(1);
    this.grainOutput.name = "Grain Output";
    this.filter = new BiquadFilter({
      frequency: 220,
      type: "lowpass",
      Q: 8,
    });
    this.compressor = new Compressor({
      threshold: -12,
      knee: 0,
      ratio: 20,
      attack: 0.001,
      release: 0.1,
    });
    this.pitchShifter = new PitchShift({
      pitch: -12,
    });
    for (let i = 0; i < this.numVoices; i++) {
      this.grains[i] = new GrainPlayer(this.buffer);
      this.grains[i].unsync();
    }

    this.setupMaster();
    // evenly ditribute volumes to master
  }
  reloadBuffers() {
    this.grains.forEach((grain) => {
      grain.buffer._buffer.copyToChannel(this.buffer.getChannelData(0), 0, 0);
    });
  }
  getNodes() {
    Object.entries(this).forEach((entry) => {
      const node = entry[1];
      if (typeof node === "object" && node.connect) {
        console.log(node);
      }
    });
  }
  debug() {
    this.grains.forEach((grain) => {
      grain.debug = true;
      grain.playbackRate = 1;
      grain.grainSize = 0.5;
    });
    this.setClockFrequency(1);
  }
  setupMaster() {
    this.grains.forEach(async (grain) => {
      grain.loop = true;
      grain.connect(this.grainOutput);
    });
    this.grainOutput.connect(this.compressor);
    this.output = new Gain(1);
    this.output.name = "Output";
    this.output.gain.setValueAtTime(0.7 / this.numVoices, now());
    this.pitchShifter.windowSize = 1;
    this.compressor.connect(this.filter);
    if (window.isMp3) {
      this.filter.connect(this.pitchShifter);
      this.pitchShifter.connect(this.output);
    } else {
      this.pitchShifter.dispose();
      // this.compressor.dispose();
      this.filter.connect(this.output);
    }

    this.output.connect(this.dest);

    // higher windowsize sounds better!
  }
  isGrainLoaded(grain) {
    return new Promise((resolve, reject) => {
      grain.onerror && reject("couldn't load grains");
      grain.loaded && resolve(grain.loaded);
    });
  }
  //  triggers
  async play(startTime = 1) {
    // this.transport.start();
    this.output.gain.setValueAtTime(1 / this.numVoices, now());
    //  wait for grains to load before starting
    const grainPromises = this.grains.map((grain) => this.isGrainLoaded(grain));
    await Promise.all(grainPromises);
    this.grains.forEach(async (grain, i) => {
      grain.start(`+${i}`, i + startTime);
    });
    this.isStopped = false;
  }
  stop() {
    this.grains.forEach((grain) => {
      grain.stop();
    });
    this.isStopped = true;
  }
  kill() {
    this.grains.forEach((grain) => grain.dispose());
  }
  restart() {
    this.grains.forEach((grain) => grain.restart());
  }
  setClockFrequency(val) {
    this.grains.forEach((grain) =>
      grain._clock.frequency.targetRampTo(val / grain.grainSize, "+0.1")
    );
  }

  // RANDOMIZATION
  randomStarts() {
    this.grains.forEach((grain) => {
      grain.stop();
      grain.start(now(), Math.random() * grain.buffer.duration);
    });
  }
  randRange(min, max) {
    // Math.sign(min) === -1 ? (min = Math.abs(min)) : null;
    return Math.random() * (max - min) + min;
  }

  getCurrentValues() {
    const currentValues = [];
    const grainParams = [
      "detune",
      "overlap",
      "grainSize",
      "loopStart",
      "loopEnd",
      "playbackRate",
    ];
    grainParams.forEach((grainParam) => {
      currentValues.push(
        (currentValues[grainParam] = this.getGrainValues(grainParam))
      );
    });
    return currentValues;
  }

  setCurrentValues(valuesObject) {
    this.grains.forEach((grain, i) => {
      grain.detune = valuesObject.detune[i];
      grain.overlap = valuesObject.overlap[i];
      grain.grainSize = valuesObject.grainSize[i];

      grain.loopEnd = valuesObject.loopEnd[i];
      grain.loopStart = valuesObject.loopStart[i];
      grain.playbackRate = valuesObject.playbackRate[i];
      grain.reverse = Math.random() < 0.5;
    });
  }
  randArrayFromRange(length, min, max) {
    return Array.from({ length }, () => this.randRange(min, max));
  }

  randomInterpolate() {
    const numGrains = this.grains.length;
    const randomValues = {
      detune: this.randArrayFromRange(numGrains, -5000, 100),
      overlap: this.randArrayFromRange(numGrains, 0.01, 0.05),
      grainSize: this.randArrayFromRange(numGrains, 0.001, 0.5),
      playbackRate: this.randArrayFromRange(numGrains, 0.01, 0.1),
      loopEnd: this.randArrayFromRange(
        numGrains,
        this.buffer.duration / 2,
        this.buffer.duration
      ),
    };
    randomValues.loopStart = this.randArrayFromRange(
      numGrains,
      0,
      ...randomValues.loopEnd
    );
    // this.setClockFrequency(Math.random());
    //set values to random values
    this.setCurrentValues(randomValues);
  }
  outputMeter() {
    this.outputMeter = new Meter();
    this.output.connect(this.outputMeter);
  }
  getMeterValue() {
    return this.outputMeter.getValue();
  }
  //  SETTERS & Getters
  setPitchShift(val) {
    this.pitchShifter.pitch = Number(val);
  }
  getPitchShift() {
    return this.pitchShifter.pitch;
  }
  setDetune(val) {
    this.grains.forEach((grain) => (grain.detune = val));
  }
  getGrainValues(key) {
    const values = [];
    this.grains.forEach((grain) => {
      if (key in grain) {
        values.push(grain[key]);
      }
    });
    return values;
  }
  setRate(val) {
    this.grains.forEach((grain) => (grain.playbackRate = val));
  }
  setOverlap(val) {
    this.grains.forEach((grain) => (grain.overlap = val));
  }
  setGrainSize(val) {
    this.grains.forEach((grain) => (grain.grainSize = val));
  }
  setLoopStart(val) {
    this.grains.forEach((grain) => (grain.loopStart = val));
  }
  setLoopEnd(val) {
    this.grains.forEach((grain) => (grain.loopEnd = val));
  }
  setVolume(val) {
    this.output.gain.setValueAtTime(val, this.toneContext.currentTime);
  }
  rampVolume(val, time) {
    this.output.gain.rampTo(val, time);
  }
}

export default GrainSynth;
