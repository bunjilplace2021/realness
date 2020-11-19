import {
  Context,
  Destination,
  now,
  Gain,
  GrainPlayer,
  Reverb,
  PitchShift,
  Loop,
  Panner,
  LFO,
  LowpassCombFilter,
  Filter,
  start,
} from "tone";

import regeneratorRuntime from "regenerator-runtime";

// TODO: ADD PROBABILITY TO WHICH GRAIN PLAYS ON EACH LOOP
// TODO: ADD FILTER: FREQUENCY CAN BE CONTROLLED BY PARTICLE BLOOM
// TODO: ADD PRESETS LOADED FROM JSON
class GrainSynth {
  constructor(buffer, ctx, voices = 2) {
    this.grains = [];
    this.numVoices = voices;
    this.buffer = buffer;
    this.toneContext = new Context(ctx);

    this.transport = this.toneContext.transport;
    for (let i = 0; i < this.numVoices; i++) {
      this.grains[i] = new GrainPlayer(this.buffer);
    }
    this.master = Destination;
    this.presets = [];
    this.setupMaster();
    // evenly ditribute volumes to master
    for (const grain of this.grains) {
      const gain = new Gain();
      gain.gain.rampTo(1 / this.numVoices, 0.01);
      grain.loop = true;
      grain.connect(gain).connect(this.masterBus);
    }
    this.isPlaying = false;
  }
  setupMaster() {
    this.masterBus = new Gain({ units: "gain" });
    this.masterBus.gain.setValueAtTime(0.8 / this.numVoices, now());
    this.masterBus.toDestination();
    this.pitchShift();
  }
  async startContext() {
    await start();
  }
  isGrainLoaded(grain) {
    return new Promise((resolve, reject) => {
      grain.onerror && reject("coudln't load grains");
      grain.loaded && resolve(grain.loaded);
    });
  }
  //  triggers
  async play(startTime = 1) {
    this.transport.start();
    this.masterBus.gain.setValueAtTime(0.8 / this.numVoices, now());
    //  wait for grains to load before starting
    const grainPromises = this.grains.map((grain) => this.isGrainLoaded(grain));
    await Promise.all(grainPromises);
    this.grains.forEach(async (grain, i) =>
      grain.start(`+${i}`, i + startTime)
    );
    this.isPlaying = true;
  }
  stop() {
    this.transport.stop();
    this.grains.forEach((grain) => {
      grain.stop();
    });
    this.masterBus.gain.setValueAtTime(0, this.toneContext.currentTime);
    this.isPlaying = false;
  }
  kill() {
    this.grains.forEach((grain) => grain.dispose());
  }
  //  effects
  pitchShift() {
    this.masterBus.disconnect(Destination);
    this.pitchShifter = new PitchShift(0);
    this.masterPan = new Panner();
    // higher windowsize sounds better!
    this.pitchShifter.windowSize = 1;
    this.masterBus.chain(this.masterPan, this.pitchShifter);
    this.pitchShifter.toDestination();
  }
  detuneLFO() {
    this.grains.forEach((grain) => {
      const detuneLFO = new LFO({
        frequency: Math.random().toFixed(2),
        max: 10,
        min: -10,
      });
      detuneLFO.connect(grain.detune);
      detuneLFO.start();
    });
  }
  swellLFO() {
    // console.log(this.masterBus);

    this.volumeLFO = new LFO({
      frequency: Math.random().toFixed(2) / 4,
      max: 0.5,
    });
    // console.log(this.volumeLFO);
    this.volumeLFO.connect(this.masterBus.gain);
    this.volumeLFO.start();
  }
  async reverb(reverbSwitch) {
    if (reverbSwitch) {
      this.masterEffect = new Reverb({
        preDelay: 0.1,
        decay: 4,
        wet: 1,
      });
      //   console.log(this.masterEffect);

      await this.masterEffect.generate();
      this.pitchShifter.chain(this.masterEffect, Destination);
    } else {
      this.masterEffect.disconnect(Destination);
    }
  }
  interpolateBetween(from, to, step) {
    //  check if from is greater than to and create array to ramp down to that value by step
    // from = 1, to = 3
    // from < to
    const interpolationArray = [];
    console.log(from, to);
    if (from < to) {
      const interpolationArray = [];
      for (let i = from; i < to; i += step) {
        interpolationArray.push(i);
      }
    } else {
      for (let i = from; i > to; i = i - step) {
        interpolationArray.push(i);
      }
    }
  }
  // RANDOMIZATION
  randomStarts() {
    this.grains.forEach((grain) => {
      grain.stop();
      grain.loopStart = Math.random() * grain.buffer.duration;
      grain.start(now(), Math.random() * grain.buffer.duration);
    });
  }
  randRange(min, max) {
    // Math.sign(min) === -1 ? (min = Math.abs(min)) : null;
    return Math.random() * (max - min) + min;
  }
  randomizeParameters() {
    const { randRange } = this;
    this.stop();
    this.setDetune(randRange(-100, 100));
    this.setPitchShift(-12, 12);
    this.setGrainSize(randRange(0.1, 1));
    this.setOverlap(randRange(0.1, 1));
    // this.setLoopStart(0, this.buffer.duration);
    // this.setLoopEnd(0, this.grains[0].buffer.duration);
    this.setRate(randRange(-1, 2));
    this.setVolume(0.5);
    this.play();
    this.randomStarts();
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
    // console.log(this.grains[0]);
    this.grains.forEach((grain, i) => {
      grain.detune = valuesObject.detune[i];
      grain.overlap = valuesObject.overlap[i];
      grain.grainSize = valuesObject.grainSize[i];
      // grain.loopStart = valuesObject.loopStart[i];
      // grain.loopEnd = valuesObject.loopEnd[i];
      grain.playbackRate = valuesObject.playbackRate[i];
      grain.reverse = Math.random() < 0.5;
    });
  }
  randArrayFromRange(length, min, max) {
    return Array.from({ length }, () => this.randRange(min, max));
  }
  lowpassFilter(frequency, resonance) {
    // this.pitchShifter.disconnect(Destination);
    this.filter = new Filter({
      type: "lowpass",
      frequency: frequency,
      rolloff: -24,
      Q: resonance,
      gain: 0.5,
    });
    this.masterBus.chain(this.masterPan, this.filter, this.pitchShifter);
  }

  feedbackCombFilter() {
    this.pitchShifter.disconnect(Destination);
    this.combFilter = new LowpassCombFilter(0.5, 0.9, 1000);
    this.masterBus.chain(this.combFilter, this.pitchShifter);
    this.pitchShifter.connect(Destination);
  }
  randomInterpolate() {
    // find out how many grains are playing
    const numGrains = this.grains.length;

    // get all the current values for params
    const currentValues = this.getCurrentValues();

    // generate random values
    const randomValues = {
      detune: this.randArrayFromRange(numGrains, -1000, 100),
      overlap: this.randArrayFromRange(numGrains, 0.5, 1),
      grainSize: this.randArrayFromRange(numGrains, 0.8, 1),
      // loopStart: this.randArrayFromRange(
      //   numGrains,
      //   0,
      //   this.grains[0].buffer.duration
      // ),
      // loopEnd: this.randArrayFromRange(
      //   numGrains,
      //   0,
      //   this.grains[0].buffer.duration
      // ),
      playbackRate: this.randArrayFromRange(numGrains, 0.1, 0.5),
    };
    this.setPitchShift(this.randRange(-12, 12));
    //set values to random values
    // TODO: Interpolate between current and random values
    this.setCurrentValues(randomValues);
  }

  // Setup random loop
  randomLoop(time) {
    this.loop = new Loop(() => {
      this.randomInterpolate();
      this.grains.forEach((grain) => {
        if (Math.random() < 0.2) {
          grain.stop();
        } else {
          grain.start(now());
        }
      });
    }, time).start();
  }
  //  SETTERS & Getters
  setPitchShift(val) {
    this.pitchShifter.pitch = Number(val);
  }
  getPitchShift() {
    return this.pitchShifter.pitch;
  }
  setDetune(val) {
    const offset = val / 2;
    this.grains.forEach(
      (grain) => (grain.detune = Math.random() * val - offset)
    );
  }
  getDetune() {}
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
    this.masterBus.gain.setValueAtTime(val, this.toneContext.currentTime);
  }
  rampVolume(val, time) {
    this.masterBus.gain.rampTo(val, time);
  }
}

export default GrainSynth;
