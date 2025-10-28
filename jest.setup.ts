beforeAll(() => {
  const mockAnalyser = { fftSize: 0, connect: jest.fn() };
  const mockMicrophone = {
    connect: jest.fn(),
    mediaStream: { getTracks: jest.fn(() => [{ stop: jest.fn() }]) },
  };
  const mockWorkletNode = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    port: { onmessage: null, postMessage: jest.fn() },
  };
  const mockStream = {};

  const mockAudioContext = {
    createAnalyser: jest.fn(() => mockAnalyser),
    createMediaStreamSource: jest.fn(() => mockMicrophone),
    audioWorklet: { addModule: jest.fn(() => Promise.resolve()) },
    createOscillator: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  };

  (window as any).AudioContext = jest.fn(() => mockAudioContext);
  (window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
  (window as any).AudioWorkletNode = jest.fn(() => mockWorkletNode);

  (navigator.mediaDevices as any) = {
    getUserMedia: jest.fn(() => Promise.resolve(mockStream)),
  };

  // expõe para reuso nos testes
  (global as any).__mocks = {
    mockAudioContext,
    mockAnalyser,
    mockMicrophone,
    mockWorkletNode,
    mockStream,
  };
});
