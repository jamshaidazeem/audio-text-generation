const TARGET_SAMPLE_RATE = 16_000;

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0).slice();
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const mono = new Float32Array(left.length);

  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }

  return mono;
}

async function resampleTo16kHz(
  audio: Float32Array,
  sourceSampleRate: number,
): Promise<Float32Array> {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return audio;
  }

  const duration = audio.length / sourceSampleRate;
  const frameCount = Math.ceil(duration * TARGET_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const buffer = offline.createBuffer(1, audio.length, sourceSampleRate);

  buffer.copyToChannel(new Float32Array(audio), 0);

  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();

  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

export async function decodeAudioFile(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const mono = downmixToMono(decoded);
    return resampleTo16kHz(mono, decoded.sampleRate);
  } finally {
    await audioContext.close();
  }
}
