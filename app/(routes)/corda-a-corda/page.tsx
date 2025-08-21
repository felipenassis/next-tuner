'use client'

import React, { useState, useEffect } from 'react';
import { useTonePlayer } from '@/hooks/useTonePlayer';
import String, { StringColor } from '@/app/components/String';
import { calculateFrequency } from '@/lib/utils';

type Instrument = 'guitar' | 'violin' | 'cello' | 'bass' | 'ukulele' | 'cavaco';

interface StringConfig {
  name: string;
  frequency: number;
}

const INSTRUMENT_TUNINGS: Record<Instrument, Record<string, string[]>> = {
  guitar: {
    standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dropD: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    openG: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    halfStepDown: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
  },
  violin: {
    standard: ['G3', 'D4', 'A4', 'E5'],
  },
  cello: {
    standard: ['C2', 'G2', 'D3', 'A3'],
  },
  bass: {
    standard: ['E1', 'A1', 'D2', 'G2'],
    dropD: ['D1', 'A1', 'D2', 'G2'],
    fiveString: ['B0', 'E1', 'A1', 'D2', 'G2'],
    sixString: ['B0', 'E1', 'A1', 'D2', 'G2', 'B2']
  },
  ukulele: {
    standard: ['G4', 'C4', 'E4', 'A4'],
    baritone: ['D3', 'G3', 'B3', 'E4'],
  },
  cavaco: {
    standard: ['D4', 'G4', 'B4', 'D5']
  }
};

const STRING_COLORS: StringColor[] = ['yellow', 'red', 'black', 'green', 'purple', 'gray']

const getTuningFromLocalStorage = (): number => {
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return Number(settings.tuning) || 440;
    }
    return 440;
  } catch {
    return 440;
  }
};

const InstrumentTuner = () => {
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [tuningType, setTuningType] = useState('standard');
  const [tuningA4, setTuningA4] = useState(440);
  const [strings, setStrings] = useState<StringConfig[]>([]);
  const { playTone, stopTone } = useTonePlayer();

  // Carrega a afinação e atualiza quando instrumento ou afinação muda
  useEffect(() => {
    const savedTuning = getTuningFromLocalStorage();
    setTuningA4(savedTuning);
    
    const instrumentTunings = INSTRUMENT_TUNINGS[instrument];
    if (!instrumentTunings || !instrumentTunings[tuningType]) return;
    
    const stringNotes = instrumentTunings[tuningType];
    const newStrings = stringNotes.map(note => ({
      name: note,
      frequency: calculateFrequency(note, savedTuning)
    }));
    
    setStrings(newStrings);
  }, [instrument, tuningType]);

  const playString = (frequency: number) => {
    stopTone();
    playTone(frequency, 4, 0.7);
  };

  const getInstrumentName = (instrument: Instrument): string => {
    const names = {
      guitar: 'Violão/Guitarra',
      violin: 'Violino',
      cello: 'Violoncelo',
      bass: 'Baixo',
      ukulele: 'Ukulele',
      cavaco: 'Cavaquinho'
    };
    return names[instrument];
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Afinador de Instrumentos
          <span className="block text-sm font-normal mt-1 text-gray-600 dark:text-gray-300">
            Afinação padrão: A4 = {tuningA4}Hz
          </span>
        </h1>
        
        <div className="space-y-6">
          {/* Seletor de Instrumento */}
          <div>
            <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instrumento
            </label>
            <select
              id="instrument"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as Instrument)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="guitar">Violão/Guitarra</option>
              <option value="violin">Violino</option>
              <option value="cello">Violoncelo</option>
              <option value="bass">Baixo</option>
              <option value="ukulele">Ukulele</option>
              <option value="cavaco">Cavaquinho</option>
            </select>
          </div>
          
          {/* Seletor de Afinação do Instrumento */}
          <div>
            <label htmlFor="tuningType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Afinação
            </label>
            <select
              id="tuningType"
              value={tuningType}
              onChange={(e) => setTuningType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {Object.keys(INSTRUMENT_TUNINGS[instrument]).map(tuning => (
                <option key={tuning} value={tuning}>
                  {tuning === 'standard' ? 'Padrão' : 
                   tuning === 'dropD' ? 'Drop D' :
                   tuning === 'openG' ? 'Open G' :
                   tuning === 'halfStepDown' ? 'Meio tom abaixo' :
                   tuning === 'fiveString' ? '5 cordas' :
                   tuning === 'sixString' ? '6 cordas' :
                   tuning === 'baritone' ? 'Barítono' : tuning}
                </option>
              ))}
            </select>
          </div>
          
          {/* Lista de Cordas para Afinar */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Cordas do {getInstrumentName(instrument)}
            </h2>
            
            <div className="flex gap-x-4 justify-around">
              {strings.map((string, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <String
                    color={STRING_COLORS[index]}
                    onClick={() => playString(string.frequency)}
                  />
                  <span>{ string.name }</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dicas de Afinação */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">Dicas de Afinação:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Toque a corda e ajuste até o som coincidir com a referência</li>
              <li>Comece pelas cordas mais graves e vá para as agudas</li>
              <li>Verifique a afinação em diferentes posições do braço</li>
              <li>Ambientes muito frios ou quentes podem alterar a afinação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstrumentTuner;
