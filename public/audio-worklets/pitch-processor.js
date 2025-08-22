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

  detectPitchYIN(buffer, sampleRate) {
    const yinThreshold = 0.1;
    const yinBuffer = new Array(Math.floor(buffer.length / 2)).fill(0);

    for (let tau = 0; tau < yinBuffer.length; tau++) {
      for (let i = 0; i < yinBuffer.length; i++) {
        if (i + tau < buffer.length) {
          const delta = buffer[i] - buffer[i + tau];
          yinBuffer[tau] += delta * delta;
        }
      }
    }

    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
    }

    let tau = 2;
    while (tau < yinBuffer.length) {
      if (yinBuffer[tau] < yinThreshold) {
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        break;
      }
      tau++;
    }

    if (tau === yinBuffer.length || yinBuffer[tau] >= yinThreshold) {
      return 0;
    }

    if (tau > 0 && tau < yinBuffer.length - 1) {
      const s0 = yinBuffer[tau - 1];
      const s1 = yinBuffer[tau];
      const s2 = yinBuffer[tau + 1];
      const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      return sampleRate / (tau + adjustment);
    }

    return sampleRate / tau;
  }

  detectPitchMPM(buffer, sampleRate) {
    const NSDF = new Array(buffer.length).fill(0);
    const maxShift = buffer.length;

    for (let tau = 0; tau < maxShift; tau++) {
      let acf = 0;
      let divisorM = 0;
      for (let i = 0; i < maxShift - tau; i++) {
        acf += buffer[i] * buffer[i + tau];
        divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
      }
      NSDF[tau] = divisorM !== 0 ? 2 * acf / divisorM : 0;
    }

    const peakPositions = [];
    for (let i = 1; i < NSDF.length - 1; i++) {
      if (NSDF[i] > 0 && NSDF[i] > NSDF[i - 1] && NSDF[i] > NSDF[i + 1]) {
        peakPositions.push(i);
      }
    }

    if (peakPositions.length === 0) return 0;

    let highestPeakPos = peakPositions[0];
    let highestPeakValue = NSDF[highestPeakPos];
    
    for (const pos of peakPositions) {
      if (NSDF[pos] > highestPeakValue) {
        highestPeakValue = NSDF[pos];
        highestPeakPos = pos;
      }
    }

    if (highestPeakPos > 0 && highestPeakPos < NSDF.length - 1) {
      const s0 = NSDF[highestPeakPos - 1];
      const s1 = NSDF[highestPeakPos];
      const s2 = NSDF[highestPeakPos + 1];
      const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      return sampleRate / (highestPeakPos + adjustment);
    }

    return sampleRate / highestPeakPos;
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
              frequency = this.detectPitchYIN(this.buffer, sampleRate);
              break;
            case 'MPM':
              frequency = this.detectPitchMPM(this.buffer, sampleRate);
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
