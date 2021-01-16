import { FMSynth, PolySynth, Gain } from "tone";
class UISynth {
  constructor(ctx) {
    this.ctx = ctx;
    this.uiSynth = new PolySynth({
      polyphony: 1,
      voice: FMSynth,
      maxPolyphony: 3,
    });

    this.uiSynth.set({
      envelope: {
        attack: 0,
        decay: 0.1,
        sustain: 1.0,
        release: 0.5,
      },
      harmonicity: 2,
      volume: 2,
    });

    this.master = new Gain(0.1);
    this.uiSynth.connect(this.master);
  }
  play(note) {
    this.uiSynth.set({ harmonicity: Math.random() * 12 });
    this.uiSynth.set({ modulationIndex: Math.random() * 24 });
    try {
      this.uiSynth.triggerAttackRelease(note, 0.1, "+0.01");
    } catch (error) {}
    // console.log(this.uiSynth);
  }
}

export default UISynth;
