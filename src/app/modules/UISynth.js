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
      volume: 2,
    });
    this.idx = 0;
    this.master = new Gain(0.1);
    this.uiSynth.connect(this.master);
  }
  play(notes) {
    this.idx++;
    this.uiSynth.set({
      harmonicity: this.randomValues[this.idx % this.randomValues.length],
    });
    // this.uiSynth.set({
    //   modulationIndex: this.randomValues[this.idx % this.randomValues.length],
    // });
    try {
      notes.forEach((note) => {
        this.uiSynth.triggerAttackRelease(
          Frequency(note).harmonize([0, 3, 7, 11, 13, 15, 17, 19, 21, 23]),
          0,
          now()
        );
      });
    } catch (error) {
      this.uiSynth.releaseAll();
    }
  }
}

export default UISynth;
