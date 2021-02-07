import { PolySynth, Gain, now, AMSynth } from "tone";

// PRECOMPUTE RANDOM VALUES FOR PERFORMANCE
class UISynth {
  constructor(ctx, polyphony = 3) {
    this.randomValues = [...Array(20)].map(() => {
      return Math.floor(Math.random() * 6);
    });
    this.ctx = ctx;
    this.isPlaying = false;
    this.uiSynth = new PolySynth({
      polyphony,
      voice: AMSynth,
      maxPolyphony: polyphony,
    });
    this.uiSynth.set({
      envelope: {
        attack: 0,
        decay: 0.5,
        sustain: 0,
        release: 0.7,
      },
      harmonicity: 2,
      volume: 2,
    });
    this.idx = 0;
    this.master = new Gain(1);
    this.uiSynth.connect(this.master);
  }
  play(notes) {
    this.isPlaying = true;
    this.notes = notes.slice(0, this.uiSynth.maxPolyphony);
    this.idx++;
    this.uiSynth.set({
      harmonicity: this.randomValues[this.idx % this.randomValues.length],
    });
    try {
      this.uiSynth.triggerAttackRelease(this.notes, now());
      this.uiSynth.releaseAll();
      this.isPlaying = false;
    } catch (error) {
      this.uiSynth.releaseAll();
      this.isPlaying = false;
    }
  }
}

export default UISynth;
