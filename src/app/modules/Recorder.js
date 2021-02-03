class Recorder {
  constructor(length = 800, ctx) {
    this.length = length;
    //instantiate audiocontext
    this.audioCtx = ctx;
  }

  async getPermissions() {
    // get permission to record
    return new Promise(async (resolve, reject) => {
      try {
        const mp3 = navigator.mediaCapabilities
          .decodingInfo({
            type: "file",
            audio: {
              contentType: "audio/mp3",
            },
          })
          .then((result) => {
            return result.supported;
          });

        if ((await mp3) === true) {
          this.type = "audio/mpeg-3";
        } else {
          this.type = "audio/aac";
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.stream = stream;
        resolve(stream);
      } catch (error) {
        console.log(error);
        return false;
      }
    });
  }
  async recordChunks() {
    return new Promise((resolve, reject) => {
      this.recording = true;

      this.mediaRecorder = new MediaRecorder(this.stream);
      console.log(this.mediaRecorder);
      this.mediaRecorder.start();
      this.audioChunks = [];
      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        this.audioChunks.push(event.data);
        resolve(true);
      });
    });
  }

  async stopRecording() {
    return new Promise((resolve, reject) => {
      this.mediaRecorder.stop();
      this.recording = false;

      this.mediaRecorder.addEventListener("stop", () => {
        this.audioBlob = new Blob(this.audioChunks, { type: this.type });
        console.log(this.audioBlob);
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
  async loadToBuffer(blob) {
    if (!this.recording) {
      const buf = await this.readBlobAsArrayBuffer(blob);
      this.arrayBuffer = buf;

      let decodedBuffer;

      try {
        decodedBuffer = await this.audioCtx.decodeAudioData(this.arrayBuffer);
      } catch (e) {
        decodedBuffer = this.audioContext.decodeAudioData((buffer) => {
          return buffer;
        });
      }

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
