import { FMSynth, Gain, now } from "tone";
class UISynth {
  constructor(ctx) {
    this.ctx = ctx;
    this.uiSynth = new FMSynth({
      envelope: {
        attack: 0,
        decay: 0.1,
        sustain: 1.0,
        release: 0.3,
      },
      harmonicity: 2,
      volume: -6,
    });

    this.master = new Gain(0.1);
    this.uiSynth.connect(this.master);
  }
  play(note) {
    this.uiSynth.harmonicity.value = Math.random() * 12;
    this.uiSynth.modulationIndex.value = Math.random() * 24;
    try {
      this.uiSynth.triggerAttackRelease(note, 0.1, "+0.01");
    } catch (error) {
      console.warn(error);
    }
  }
}

export default UISynth;
