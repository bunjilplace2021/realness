import { FMSynth, Frequency, PolySynth, Gain, now, AMSynth } from "tone";

// PRECOMPUTE RANDOM VALUES FOR PERFORMANCE
class UISynth {
  constructor(ctx) {
    this.randomValues = [...Array(20)].map(() => {
      return Math.floor(Math.random() * 6);
    });
    this.ctx = ctx;

    this.uiSynth = new PolySynth({
      polyphony: 3,
      voice: AMSynth,
      maxPolyphony: 3,
    });
    this.uiSynth.set({
      envelope: {
        attack: 0,
        decay: 0.1,
        release: 0.5,
      },
      harmonicity: 2,
      volume: 1,
    });
    this.idx = 0;
    this.master = new Gain(0.1);
    this.uiSynth.connect(this.master);
  }
  play(notes) {
    this.notes = notes.slice(0, this.uiSynth.maxPolyphony);
    this.idx++;
    this.uiSynth.set({
      harmonicity: this.randomValues[this.idx % this.randomValues.length],
    });
    try {
      this.uiSynth.triggerAttackRelease(this.notes, now());
      this.uiSynth.releaseAll();
    } catch (error) {
      this.uiSynth.releaseAll();
    }
  }
}

export default UISynth;
