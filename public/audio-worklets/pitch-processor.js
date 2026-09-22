import { detectPitchYIN, detectPitchMPM } from './pitch-detection.js';

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
    this.algorithm = 'YIN';
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  handleMessage(event) {
    if (event.data.algorithm) {
      this.algorithm = event.data.algorithm;
    }
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputData = input[0];

      // Preenche o buffer
      for (let i = 0; i < inputData.length; i++) {
        this.buffer[this.bufferIndex++] = inputData[i];
        if (this.bufferIndex >= this.bufferSize) {
          // Processa quando o buffer está cheio
          let frequency = 0;
          switch (this.algorithm) {
            case 'YIN':
              frequency = detectPitchYIN(this.buffer, sampleRate);
              break;
            case 'MPM':
              frequency = detectPitchMPM(this.buffer, sampleRate);
              break;
          }

          if (frequency > 0) {
            this.port.postMessage({ frequency });
          }

          this.bufferIndex = 0;
          this.buffer.fill(0);
        }
      }
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
