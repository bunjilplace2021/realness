class Recorder {
  constructor(length = 800, ctx) {
    this.length = length;
    //instantiate audiocontext
    this.audioCtx = ctx;
  }

  async getPermissions() {
    // get permission to record
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  async recordChunks() {
    return new Promise((resolve, reject) => {
      this.recording = true;
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.start();
      this.audioChunks = [];
      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        this.audioChunks.push(event.data);
      });
      setTimeout(() => {
        this.mediaRecorder.stop();
        this.recording = false;
        // console.log("stopped recorder");
      }, this.length);
      this.mediaRecorder.addEventListener("stop", () => {
        this.audioBlob = new Blob(this.audioChunks, { type: "audio/mpeg-3" });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        resolve(this.audioBlob);
      });
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
  async loadToBuffer() {
    if (!this.recording) {
      const buf = await this.readBlobAsArrayBuffer(this.audioBlob);
      this.arrayBuffer = buf;
      //  here is where we'd make multiple sources
      const decodedBuffer = await this.audioCtx.decodeAudioData(
        this.arrayBuffer
      );
      return new Promise((resolve, reject) => {
        try {
          resolve(decodedBuffer);
          this.decodedBuffer = decodedBuffer;
        } catch (error) {
          reject(error);
        }
      });
    }
  }
  createSource(decodedBuffer) {
    let source = this.audioCtx.createBufferSource();
    source.buffer = decodedBuffer;
    return source;
  }
}

export default Recorder;
