import { soundLog } from "../utilityFunctions";

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
        let streamTimeout = setTimeout(() => {
          reject("permissions timed out");
        }, 5000);
        console.log("getting permssions");

        if (window.mp3 === true) {
          this.type = "audio/mpeg-3";
        } else {
          this.type = "audio/aac";
        }

        const stream = await navigator.mediaDevices
          .getUserMedia({
            audio: true,
          })
          .catch((err) => {
            return err;
          });

        this.stream = stream;
        clearTimeout(streamTimeout);
        resolve(stream);
      } catch (error) {
        soundLog(error);
        return false;
      }
    });
  }
  stopStream() {
    this.stream.getTracks().forEach((track) => {
      if (track.readyState == "live" && track.kind === "audio") {
        track.stop();
      }
    });
  }
  startStream() {
    this.stream.getTracks().forEach((track) => {
      if (track.readyState == "live" && track.kind === "audio") {
        track.start();
      }
    });
  }
  async recordChunks() {
    return new Promise((resolve, reject) => {
      this.recording = true;
      this.mediaRecorder = new MediaRecorder(this.stream);
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
        soundLog(this.audioBlob);
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
}

export default Recorder;
