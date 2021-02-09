import {
  PolySynth,
  Gain,
  now,
  AMSynth,
  Volume,
  getTransport,
  AMOscillator,
} from "tone";

// PRECOMPUTE RANDOM VALUES FOR PERFORMANCE
class UISynth {
  constructor(ctx, polyphony = 3) {
    this.randomValues = [...Array(20)].map(() => {
      return Math.floor(Math.random() * 6);
    });
    this.ctx = ctx;
    this.isPlaying = false;
    const envOpts = {
      attack: 0,
      decay: 0.5,
      sustain: 0,
      release: 0.7,
    };
    if (window.isMp3) {
      this.uiSynth = new PolySynth({
        polyphony,
        voice: AMSynth,
        maxPolyphony: polyphony,
      });

      this.uiSynth.set({
        envelope: envOpts,
        harmonicity: 2,
        volume: 1,
      });
    } else {
      this.uiSynth = new AMSynth({
        envelope: envOpts,
      });
    }

    this.idx = 0;
    this.master = new Volume(-8);
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
      this.uiSynth.triggerAttackRelease(...this.notes);
      // this.uiSynth.releaseAll();
      this.isPlaying = false;
    } catch (error) {
      console.log(error);
      // this.uiSynth.releaseAll();
      this.isPlaying = false;
    }
  }
}

export default UISynth;
