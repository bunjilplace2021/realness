class Recorder {
  constructor(length = 800, sources = 1, ctx) {
    this.length = length;
    this.getPermissions();
    //instantiate audiocontext
    this.audioCtx = ctx;

    this.numSources = sources;
  }

  async getPermissions() {
    // get permission to record
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      this.stream && this.recordChunks();
    } catch (error) {
      console.log(error);
    }
  }

  async recordChunks() {
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.start();
    this.audioChunks = [];
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      this.audioChunks.push(event.data);
    });
    this.now = this.audioCtx.currentTime;
    setTimeout(() => {
      this.mediaRecorder.stop();
      console.log("stopped recorder");
    }, this.length);

    this.mediaRecorder.addEventListener("stop", () => {
      this.audioBlob = new Blob(this.audioChunks, { type: "audio/mpeg-3" });
      this.audioUrl = URL.createObjectURL(this.audioBlob);
      this.loadToBuffer();
    });
  }

  readBlobAsArrayBuffer(blob) {
    const temporaryFileReader = new FileReader();
    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsArrayBuffer(blob);
    });
  }
  normalizeBuffer(buffer) {}
  async loadToBuffer() {
    this.source && this.clearBuffer();
    const buf = await this.readBlobAsArrayBuffer(this.audioBlob);
    this.arrayBuffer = buf;
    //  here is where we'd make multiple sources
    const decodedBuffer = await this.audioCtx.decodeAudioData(this.arrayBuffer);
    this.decodedBuffer = decodedBuffer;
    this.normalizeBuffer(decodedBuffer);
  }
  createSource(decodedBuffer) {
    let source = this.audioCtx.createBufferSource();
    source.buffer = decodedBuffer;
    return source;
  }
}

export default Recorder;
