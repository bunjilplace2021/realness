import {decodeAudioData, OfflineAudioContext} from 'standardized-audio-context';

export async function fetchSample(url, ctx) {
	return fetch(url)
		.then((response) => response.arrayBuffer())
		.then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
		.catch((error) => console.log(error));
}

export async function aacDecode(url, ctx) {
	return new Promise(async (resolve, reject) => {
		try {
			import('./samples/fallback.aac').then(async (file) => {
				const response = await fetch(file.default, {mimeType: 'audio/mpeg'});
				const arrBuffer = await response.arrayBuffer();
				// console.log(response.type);
				// console.log(ctx._context._nativeContext);
				const audioBuffer = await decodeAudioData(ctx._context._nativeContext, arrBuffer);
				console.log(audioBuffer);
				resolve(audioBuffer);
			});
		} catch (error) {
			reject(error);
		}
	});
}

export function removeZeroValues(arr) {
	return arr.filter((val) => val !== 0);
}

export function debounce(fn, delay) {
	let timeOutId;
	return function(...args) {
		if (timeOutId) {
			clearTimeout(timeOutId);
		}
		timeOutId = setTimeout(() => {
			fn(...args);
		}, delay);
	};
}

export function once(func) {
	let calls = 1;
	return function() {
		if (calls > 0) {
			func.apply(null, arguments);
			calls--;
		}
	};
}

export function throttle(fn, delay) {
	let scheduledId;
	return function throttled() {
		const context = this;
		const args = arguments;
		const throttledCall = fn.apply(context, args);
		if (scheduledId) return;
		scheduledId = setTimeout(() => {
			throttledCall();
			clearTimeout(scheduledId);
		}, delay);
	};
}
export async function safariFallback(url, ctx) {
	return new Promise(async (resolve, reject) => {
		resolve(url);

		//   ctx.decodeAudioData = new webkitAudioContext().decodeAudioData;

		//   ctx.rawContext._nativeContext.decodeAudioData(
		//     arrayBuf,
		//     function (buffer) {
		//       resolve(buffer);
		//     },
		//     function (e) {
		//       reject(e);
		//     }
		//   );
		// });
	});
}

//  map one range of values to another
export function mapValue(input, inMin, inMax, outMin, outMax) {
	return (input - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export function normalizeArray(arr, min, max) {
	return arr.map((val) => {
		return mapValue(val, Math.min(...arr), Math.max(...arr), min, max).toFixed(2);
	});
}

export function isBetween(x, min, max) {
	return x >= min && x <= max;
}

export function resampleBuffer(input, target_rate) {
	return new Promise(async (resolve, reject) => {
		if (typeof target_rate != 'number' && target_rate <= 0) {
			reject('Samplerate is not a number');
		}

		// if can set samplerate (eg.not on safari)
		let resampling_ratio;

		if (typeof input.sampleRate === Number) {
			resampling_ratio = input.sampleRate / target_rate;
		} else {
			resampling_ratio = 44100 / target_rate;
		}

		let final_length = input.length * resampling_ratio;

		let off = new OfflineAudioContext(input.numberOfChannels, final_length, target_rate);
		// NORMALIZE AND FILTER BUFFERS
		let source = off.createBufferSource();
		const bufferMax = Math.max(...input.getChannelData(0));

		//  calculate difference from 1
		// subtract max volume value from 1, set gain to that value
		// console.log("MAX: " + bufferMax);
		const gainNode = off.createGain();
		const diff = Math.abs(0.5 - bufferMax);
		if (bufferMax === 0) {
			reject('silent audio file');
		}
		// VOLUME TEST
		if (bufferMax < 0.02) {
			// QUIET SOUND, need to bring it up in level
			gainNode.gain.value = 4 + diff;
		}
		if (bufferMax < 0.2 && bufferMax > 0.02) {
			// QUIET SOUND, need to bring it up in level
			gainNode.gain.value = 2 + diff;
		}
		if (bufferMax > 0.2 && bufferMax < 0.5) {
			// MEDIUM LEVEL SOUND, need to bump volume slightly
			gainNode.gain.value = 1.7 + diff;
		}
		if (bufferMax > 0.5 && bufferMax < 0.7) {
			gainNode.gain.value = 0.7 - diff;
			// LOUD SOUND, need to bring it down in level
		}
		if (bufferMax > 0.7) {
			gainNode.gain.value = 0.5 - diff;
			// VERY LOUD SOUND, need to bring it down in level
		}

		// console.log("DIFF: " + diff);
		// console.log("setting to volume" + gainNode.gain.value);
		source.buffer = input;
		source.connect(gainNode);
		// filter.connect(gainNode);
		gainNode.connect(off.destination);
		source.start(0);
		try {
			resolve(await off.startRendering());
		} catch (error) {
			reject(error);
		}
	});
}

export function getNodes(obj) {
	Object.entries(obj).forEach((entry) => {
		if (entry[1] !== null) {
			const node = entry[1];
			console.log(typeof node);
			if (typeof node === 'object') {
			}
		}
	});
}
export function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
export function soundLog(str) {
	console.log(
		`%cSound: ${str}`,
		"color:#233E82; font-family:'Arial';color:white; font-weight: 500; background:black;"
	);
}
