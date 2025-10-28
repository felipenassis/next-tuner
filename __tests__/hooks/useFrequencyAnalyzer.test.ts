import { renderHook, act } from '@testing-library/react';
import useFrequencyAnalyzer, { __testUtils } from '@/hooks/useFrequencyAnalyzer';

describe('useFrequencyAnalyzer', () => {
  let mockAudioContext: any;
  let mockWorkletNode: any;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    mockAudioContext = (global as any).__mocks.mockAudioContext;
    mockWorkletNode = (global as any).__mocks.mockWorkletNode;
    jest.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useFrequencyAnalyzer());
    expect(result.current.frequency).toBe(0);
    expect(result.current.isListening).toBe(false);
    expect(result.current.note).toBeNull();
    expect(result.current.cents).toBeNull();
    expect(result.current.octave).toBeNull();
  });

  it('deve calcular nota corretamente para frequência conhecida (A4 = 440Hz)', () => {
    const { note, octave, cents } = __testUtils.getNoteInfo(440);
    expect(note).toBe('A');
    expect(octave).toBe(4);
    expect(cents).toBe(0);
  });

  it('deve iniciar e parar escuta corretamente (mockado)', async () => {
    const { result } = renderHook(() => useFrequencyAnalyzer());

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalled();
    expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({ algorithm: 'YIN' });

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
    expect(mockWorkletNode.disconnect).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('deve atualizar algoritmo quando setAlgorithm for chamado', async () => {
    const { result } = renderHook(() => useFrequencyAnalyzer());

    await act(async () => {
      await result.current.startListening();
    });

    act(() => {
      result.current.setAlgorithm('MPM');
    });

    expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({ algorithm: 'MPM' });
  });

  it('deve tratar erro ao acessar microfone', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(new Error('Permissão negada'));
    const { result } = renderHook(() => useFrequencyAnalyzer());

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.isListening).toBe(false);
  });
});
