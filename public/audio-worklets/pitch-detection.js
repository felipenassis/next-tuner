// Algoritmos puros de detecção de pitch, sem dependência de AudioWorkletProcessor.
// Extraídos para cá para que possam ser importados tanto pelo worklet
// (pitch-processor.js, via import de módulo ES, suportado por audioWorklet.addModule)
// quanto por testes automatizados, sem duplicar a lógica.

export function detectPitchYIN(buffer, sampleRate) {
  const yinThreshold = 0.1;
  const yinBuffer = new Array(Math.floor(buffer.length / 2)).fill(0);

  // yinBuffer.length é sempre metade de buffer.length, então "i + tau"
  // nunca alcança buffer.length aqui (o teste condicional original era
  // sempre verdadeiro e só custava um branch extra por iteração).
  for (let tau = 0; tau < yinBuffer.length; tau++) {
    for (let i = 0; i < yinBuffer.length; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
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

export function detectPitchMPM(buffer, sampleRate) {
  // Limita a busca a frequências plausíveis para os instrumentos deste app
  // (a nota mais grave usada, o B0 do baixo de 5 cordas, fica perto de
  // 27.5Hz mesmo no padrão de afinação mais baixo oferecido, 392Hz).
  // Buscar periodicidade abaixo de 20Hz só desperdiça tempo do audio thread.
  const MIN_FREQUENCY = 20;
  const maxShift = Math.min(buffer.length, Math.ceil(sampleRate / MIN_FREQUENCY));
  const NSDF = new Array(maxShift).fill(0);

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

  // O método MPM (McLeod Pitch Method) original não escolhe o pico global
  // mais alto do NSDF: picos espúrios podem superar o pico real por causa
  // da janela de amostras cada vez menor conforme tau cresce. O correto é
  // pegar o primeiro pico (menor tau, ou seja, a frequência mais aguda
  // plausível) cujo valor esteja a pelo menos k% do maior pico encontrado.
  const K = 0.9;
  const highestPeakValue = Math.max(...peakPositions.map(pos => NSDF[pos]));
  const highestPeakPos = peakPositions.find(pos => NSDF[pos] >= highestPeakValue * K) ?? peakPositions[0];

  if (highestPeakPos > 0 && highestPeakPos < NSDF.length - 1) {
    const s0 = NSDF[highestPeakPos - 1];
    const s1 = NSDF[highestPeakPos];
    const s2 = NSDF[highestPeakPos + 1];
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    return sampleRate / (highestPeakPos + adjustment);
  }

  return sampleRate / highestPeakPos;
}
