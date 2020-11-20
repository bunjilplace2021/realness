import {
  Reverb,
  Delay,
  Gain,
  Context,
  Destination,
  Filter,
  Chorus,
} from "tone";

class MasterBus {
  constructor(ctx) {
    this.effectsChain = [];
    this.ctx = new Context(ctx);
    this.masterBus = new Gain(1);
    this.dest = Destination;
    this.masterBus.connect(this.dest);
  }
  test() {
    var oscillator = this.ctx.createOscillator();
    oscillator.frequency.setValueAtTime(440, this.ctx.currentTime);
    oscillator.connect(this.masterBus);
    oscillator.start();
  }
  setVolume(val) {
    this.masterBus.gain.setValueAtTime(val, this.ctx.getCurrentTime);
  }
  connectSource(source) {
    try {
      this.source = source;
      source.connect(this.masterBus);
      return true;
    } catch (error) {
      return false;
    }
  }
  chorus(freq = 0.1, delay = 9, depth = 0.9) {
    this.chorus = new Chorus(freq, delay, depth);
  }
  chainEffect(effect) {
    this.masterBus.disconnect(this.dest);
    this.effectsChain.push(effect);
    this.masterBus.chain(...this.effectsChain, this.dest);
  }
  removeEffect(effect) {
    this.masterBus.disconnect(effect);
    this.masterBus.chain(this.dest);
  }

  lowpassFilter(frequency, resonance) {
    this.filter = new Filter(frequency, "lowpass", -24, resonance);
    this.chainEffect(this.filter);
  }
  delay(time = 100, fbk = 0.5) {
    this.masterDelay = new Delay(time, fbk);
    this.chainEffect(this.masterDelay);
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
}

export default MasterBus;
