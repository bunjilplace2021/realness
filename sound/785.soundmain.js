(self.webpackChunkrealness=self.webpackChunkrealness||[]).push([[785],{785:(t,e,s)=>{"use strict";s.r(e),s.d(e,{default:()=>o});let n,i=window.AudioContext||window.webkitAudioContext,a=t=>{let e=new Event("error");return e.data=new Error("Wrong state for "+t),e};class r{constructor(t,e=null){this.stream=t,this.config=e,this.state="inactive",this.em=document.createDocumentFragment(),this.encoder=(t=>{let e=t.toString().replace(/^(\(\)\s*=>|function\s*\(\))\s*{/,"").replace(/}$/,""),s=new Blob([e]);return new Worker(URL.createObjectURL(s))})(r.encoder);let s=this;this.encoder.addEventListener("message",(t=>{let e=new Event("dataavailable");e.data=new Blob([t.data],{type:s.mimeType}),s.em.dispatchEvent(e),"inactive"===s.state&&s.em.dispatchEvent(new Event("stop"))}))}start(t){if("inactive"!==this.state)return this.em.dispatchEvent(a("start"));this.state="recording",n||(n=new i(this.config)),this.clone=this.stream.clone(),this.input=n.createMediaStreamSource(this.clone),this.processor=n.createScriptProcessor(2048,1,1),this.encoder.postMessage(["init",n.sampleRate]),this.processor.onaudioprocess=t=>{"recording"===this.state&&this.encoder.postMessage(["encode",t.inputBuffer.getChannelData(0)])},this.input.connect(this.processor),this.processor.connect(n.destination),this.em.dispatchEvent(new Event("start")),t&&(this.slicing=setInterval((()=>{"recording"===this.state&&this.requestData()}),t))}stop(){return"inactive"===this.state?this.em.dispatchEvent(a("stop")):(this.requestData(),this.state="inactive",this.clone.getTracks().forEach((t=>{t.stop()})),this.processor.disconnect(),this.input.disconnect(),clearInterval(this.slicing))}pause(){return"recording"!==this.state?this.em.dispatchEvent(a("pause")):(this.state="paused",this.em.dispatchEvent(new Event("pause")))}resume(){return"paused"!==this.state?this.em.dispatchEvent(a("resume")):(this.state="recording",this.em.dispatchEvent(new Event("resume")))}requestData(){return"inactive"===this.state?this.em.dispatchEvent(a("requestData")):this.encoder.postMessage(["dump",n.sampleRate])}addEventListener(...t){this.em.addEventListener(...t)}removeEventListener(...t){this.em.removeEventListener(...t)}dispatchEvent(...t){this.em.dispatchEvent(...t)}}r.prototype.mimeType="audio/wav",r.isTypeSupported=t=>r.prototype.mimeType===t,r.notSupported=!navigator.mediaDevices||!i,r.encoder=()=>{let t=[];onmessage=e=>{"encode"===e.data[0]?function(e){let s=e.length,n=new Uint8Array(2*s);for(let t=0;t<s;t++){let s=2*t,i=e[t];i>1?i=1:i<-1&&(i=-1),i*=32768,n[s]=i,n[s+1]=i>>8}t.push(n)}(e.data[1]):"dump"===e.data[0]&&function(e){let s=t.length?t[0].length:0,n=t.length*s,i=new Uint8Array(44+n),a=new DataView(i.buffer);a.setUint32(0,1380533830,!1),a.setUint32(4,36+n,!0),a.setUint32(8,1463899717,!1),a.setUint32(12,1718449184,!1),a.setUint32(16,16,!0),a.setUint16(20,1,!0),a.setUint16(22,1,!0),a.setUint32(24,e,!0),a.setUint32(28,2*e,!0),a.setUint16(32,2,!0),a.setUint16(34,16,!0),a.setUint32(36,1684108385,!1),a.setUint32(40,n,!0);for(let e=0;e<t.length;e++)i.set(t[e],e*s+44);t=[],postMessage(i.buffer,[i.buffer])}(e.data[1])}};const o=r}}]);