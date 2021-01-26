import {
	debug,
	now,
	Gain,
	GrainPlayer,
	Reverb,
	PitchShift,
	Loop,
	LFO,
	LowpassCombFilter,
	Filter,
	Compressor,
	getContext
} from 'tone';

import regeneratorRuntime from 'regenerator-runtime';
// TODO: ADD PROBABILITY TO WHICH GRAIN PLAYS ON EACH LOOP
// TODO: ADD PRESETS LOADED FROM JSON
class GrainSynth {
	constructor(buffer, ctx, voices = 2) {
		// workaround to suspend audiocontext without warnings
		getContext().rawContext.suspend();

		this.grains = [];
		this.presets = [];
		this.isStopped = false;
		this.numVoices = voices;
		this.buffer = buffer;
		this.nodes = [];
		this.toneContext = ctx;

		this.transport = this.toneContext.transport;
		this.dest = this.toneContext.destination;
		this.dest.name = 'Grainsynth Destination';
		this.effectsChain = [];
		//  make nodes
		this.grainOutput = new Gain(1);
		this.grainOutput.name = 'Grain Output';
		this.filter = new Filter(10000, 'lowpass', -24, 4);
		this.compressor = new Compressor({
			ratio: 20,
			threshold: -24,
			release: 1,
			attack: 0.003
		});

		this.pitchShifter = new PitchShift({
			pitch: -12
			// channelCount: 1,
		});
		for (let i = 0; i < this.numVoices; i++) {
			if (window.safari) {
				this.grains[i] = new GrainPlayer({
					url: this.buffer
				});
			} else {
				this.grains[i] = new GrainPlayer(this.buffer);
			}

			// this.grains[i].buffer.toMono();
			// this.grains[i].channelCount = 1;
		}

		this.setupMaster();
		// evenly ditribute volumes to master
		this.grains.forEach(async (grain) => {
			grain.loop = true;
			grain.connect(this.grainOutput);
		});
		this.grainOutput.connect(this.filter);
	}
	setLength() {}
	getNodes() {
		Object.entries(this).forEach((entry) => {
			const node = entry[1];
			if (typeof node === 'object' && node.connect) {
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
		this.output = new Gain(1);
		this.output.name = 'Output';
		this.output.gain.setValueAtTime(0.7 / this.numVoices, now());
		// this.pitchShifter.windowSize = 1;
		this.filter.connect(this.compressor);
		this.compressor.connect(this.pitchShifter);
		this.pitchShifter.connect(this.output);

		if (!window.isMp3) {
			this.compressor.disconnect(this.pitchShifter);
			this.pitchShifter.disconnect(this.output);
			this.compressor.connect(this.output);
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
		this.transport.start();
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
	//  effects
	chainEffect(effect) {
		// push new effect to chain
		this.effectsChain.push(effect);

		//   define inputs & outputs

		if (this.effectsChain.length > 1) {
			const effectsInput = this.effectsChain[0];
			const effectsOutput = this.effectsChain[this.effectsChain.length - 1];
			//  disconnect from existing input
			this.input.disconnect();
			effectsOutput && effectsOutput.disconnect();

			this.input.connect(effectsInput);
			for (let i = 0; i < this.effectsChain.length - 1; i++) {
				this.effectsChain[i].connect(this.effectsChain[i + 1]);
			}
			effectsOutput.connect(this.dest);
		}
	}
	setClockFrequency(val, time) {
		this.grains.forEach((grain) => grain._clock.frequency.targetRampTo(val, time));
	}

	detuneLFO() {
		this.grains.forEach((grain) => {
			const detuneLFO = new LFO({
				frequency: Math.random().toFixed(2),
				max: 10,
				min: -10
			});
			detuneLFO.connect(grain.detune);
			detuneLFO.start();
		});
	}
	swellLFO() {
		// console.log(this.output);
		this.volumeLFO = new LFO({
			frequency: Math.random().toFixed(2) / 4,
			max: 0.5
		});
		// console.log(this.volumeLFO);
		this.volumeLFO.connect(this.output.gain);
		this.volumeLFO.start();
	}
	async reverb(reverbSwitch) {
		if (reverbSwitch) {
			this.masterReverb = new Reverb({
				preDelay: 0.1,
				decay: 4,
				wet: 1
			});
			//   console.log(this.masterEffect);
			await this.masterReverb.generate();
			this.output.chain(this.masterReverb, this.dest);
		} else {
			this.masterReverb && this.masterReverb.disconnect();
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
			grain.start(now(), Math.random() * grain.buffer.duration);
		});
	}
	randRange(min, max) {
		// Math.sign(min) === -1 ? (min = Math.abs(min)) : null;
		return Math.random() * (max - min) + min;
	}
	randomizeParameters() {
		const {randRange} = this;
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
		const grainParams = ['detune', 'overlap', 'grainSize', 'loopStart', 'loopEnd', 'playbackRate'];

		grainParams.forEach((grainParam) => {
			currentValues.push((currentValues[grainParam] = this.getGrainValues(grainParam)));
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
			grain.loopEnd = valuesObject.loopEnd[i];
			grain.playbackRate = valuesObject.playbackRate[i];
			grain.reverse = Math.random() < 0.2;
		});
	}
	randArrayFromRange(length, min, max) {
		return Array.from({length}, () => this.randRange(min, max));
	}

	lowpassFilter(frequency, resonance) {
		this.chainEffect(this.filter);
	}

	feedbackCombFilter() {
		this.combFilter = new LowpassCombFilter(0.5, 0.9, 1000);
		this.chainEffect(this.combFilter);
	}
	randomInterpolate() {
		// find out how many grains are playing
		const numGrains = this.grains.length;

		// get all the current values for params
		const currentValues = this.getCurrentValues();
		// console.log(currentValues);
		// generate random values
		const randomValues = {
			detune: this.randArrayFromRange(numGrains, -1000, 100),
			overlap: this.randArrayFromRange(numGrains, 0.01, 0.5),
			grainSize: this.randArrayFromRange(numGrains, 0.001, 0.05),
			playbackRate: this.randArrayFromRange(numGrains, 0.01, 0.05),

			loopEnd: this.randArrayFromRange(numGrains, 0, this.grains[0].buffer.duration)
		};
		console.log(randomValues);
		this.setClockFrequency(0.01, 1);

		//set values to random values
		// TODO: Interpolate between current and random values
		this.setCurrentValues(randomValues);
		// console.log(this.grains);
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
		this.grains.forEach((grain) => (grain.detune = Math.random() * val - offset));
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
		this.output.gain.setValueAtTime(val, this.toneContext.currentTime);
	}
	rampVolume(val, time) {
		this.output.gain.rampTo(val, time);
	}
}

export default GrainSynth;
