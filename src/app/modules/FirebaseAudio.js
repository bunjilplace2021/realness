import firebase from "firebase/app";
import "firebase/storage";
import { v4 as uuidv4 } from "uuid";
class FireBaseAudio {
  // needed methods
  // async fetch
  // async upload
  // Authenticate
  // get total number of database entries
  // loadrandom
  // read into Blob/AudioUrl
  constructor(ctx, fileType = "audio/mpeg-3") {
    this.firebaseConfig = {
      // Your web app's Firebase configuration
      // For Firebase JS SDK v7.20.0 and later, measurementId is optional
      apiKey: "AIzaSyAbb8-7skMg99nzAlvUaqR6vfQvD7q_7Vs",
      authDomain: "test-a201f.firebaseapp.com",
      databaseURL: "https://test-a201f.firebaseio.com",
      projectId: "test-a201f",
      storageBucket: "test-a201f.appspot.com",
      messagingSenderId: "120555329679",
      appId: "1:120555329679:web:a8734f69a5da95480df8fa",
      measurementId: "G-QLSEEEE02P",
    };
    // Initialize Firebase
    if (fileType === "audio/mpeg-3") {
      this.suffix = "mp3";
    } else {
      this.suffix = "aac";
    }
    firebase.initializeApp(this.firebaseConfig);
    this.audioCtx = ctx;
    this.storage = firebase.storage();
    this.storageRef = this.storage.ref();
    this.audioRef = this.storageRef.child(`audio-${uuidv4()}.${this.suffix}`);
  }

  async listAll() {
    this.files = await this.storageRef.list();
  }
  async getAacFiles() {
    return new Promise(async (resolve, reject) => {
      this.filePromises = [];
      this.fileNames = [];
      this.files.items.forEach(async (file) => {
        this.filePromises.push(file.getMetadata());
      });

      this.filesMetadata = await Promise.all(this.filePromises);

      this.filesMetadata.filter((metaObject) => {
        if (metaObject.contentType === "audio/aac") {
          this.fileNames.push(metaObject.fullPath);
        }
      });
      console.log(`Found ${this.fileNames.length} files`);
      this.fileNames.slice(0, 10);
      console.log(this.fileNames);
      resolve(this.fileNames);
    });
  }
  async getRandomSample() {
    if (!this.suffix === "aac") {
      const ChosenFile = this.files.items[
        ~~(Math.random() * this.files.items.length)
      ];
      this.audioFile = await ChosenFile.getDownloadURL();
    }
  }
  async downloadSample(url) {
    return fetch(url, { cors: "opaque" })
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => this.audioCtx.decodeAudioData(arrayBuffer))
      .catch((err) => console.log(err));
  }

  async uploadSample(blob) {
    // upload audio to firebase storage

    this.uploadTask = this.audioRef.put(blob, { contentType: blob.type });
    this.uploadTask.on(
      "state_changed",
      (snapshot) => {
        this.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (firebase.storage.TaskState.RUNNING) {
          // console.log(this.progress);
        }
      },
      (err) => {
        // console.log(err);
      },
      () => {
        this.uploadTask.snapshot.ref
          .getDownloadURL()
          .then(function (downloadURL) {
            window.logging && console.log("File available at", downloadURL);
          });
      }
    );
  }
}

export default FireBaseAudio;
