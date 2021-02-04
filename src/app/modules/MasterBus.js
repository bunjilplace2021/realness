import {
  Reverb,
  Delay,
  Gain,
  BiquadFilter,
  Chorus,
  Limiter,
  Meter,
} from "tone";
import { soundLog } from "../utilityFunctions";

class MasterBus {
  constructor(ctx) {
    this.input = new Gain(1);
    this.limiter = new Limiter(-6);

    this.effectsChain = [];
    this.ctx = ctx;

    this.output = new Gain(1);
    this.dest = this.ctx.destination;
    this.dest.volume.value = 6;

    if (window.isMp3) {
      this.chainEffect(this.limiter);
    }
  }
  test() {
    var oscillator = this.ctx.createOscillator();
    oscillator.frequency.setValueAtTime(440, this.ctx.currentTime);
    oscillator.connect(this.output);
    oscillator.start();
  }
  setVolume(val) {
    this.output.gain.setValueAtTime(val, this.ctx.getCurrentTime);
  }
  connectSource(source) {
    try {
      this.source = source;
      source.connect(this.input);
      return true;
    } catch (error) {
      return false;
    }
  }
  chorus(freq = 0.1, delay = 20, depth = 0.9) {
    this.chorus = new Chorus(freq, delay, depth).start();
    this.chainEffect(this.chorus);
  }
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
      effectsOutput.toDestination();
    } else {
      // there's just one effect. Just connect it
      this.input.connect(this.effectsChain[0]).connect(this.dest);
    }
  }
  removeEffect(effect) {
    this.output.disconnect(effect);
    this.output.connect(this.dest);
  }

  lowpassFilter(frequency, resonance) {
    this.filter = new BiquadFilter(frequency, "lowpass", resonance);
    this.chainEffect(this.filter);
  }
  delay(time = 100, fbk = 0.5) {
    this.masterDelay = new Delay(time, fbk);
    this.chainEffect(this.masterDelay);
  }
  meter(node) {
    this.meter = new Meter({ smoothing: 0.8 });
    node.connect(this.meter);
    window.meterLoop = setInterval(() => {
      window.masterLevel = this.meter.getValue();
    }, 300);
  }
  async reverb(reverbSwitch, preDelay = 0.3, decay = 4, wet = 1) {
    if (reverbSwitch) {
      this.masterReverb = new Reverb({
        preDelay,
        decay,
        wet,
      });
      await this.masterReverb.generate();
      this.chainEffect(this.masterReverb);
    } else {
      this.masterReverb && this.removeEffect(this.masterReverb);
    }
  }
  disconnect() {
    this.dest.disconnect();
  }
}

export default MasterBus;
