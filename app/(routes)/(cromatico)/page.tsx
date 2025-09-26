'use client'

import { Diamond } from "lucide-react"
import { useState, useEffect } from "react"
import useFrequencyAnalyzer from "@/hooks/useFrequencyAnalyzer"
import useSettings from "@/hooks/useSettings"

export default function Cromatico() {
  const [scale, setScale] = useState<number>(0)
  const { settings } = useSettings()

  const {
    frequency,
    cents,
    note,
    octave,
    startListening,
    stopListening
  } = useFrequencyAnalyzer(settings.tuning, settings.algorithm)

  const mapearParaEscala = (cents: number): number => {
    // Mapeia o número de [-50, 50] para [1, 9]
    const valorMapeado = Math.round(((cents + 50) / 100) * 8 + 1);
    
    // Garante que o resultado esteja entre 1 e 9
    return Math.max(1, Math.min(9, valorMapeado));
  }

  useEffect(() => {
    setScale(cents ? mapearParaEscala(cents) : 0)
  }, [cents, frequency])

  useEffect(() => {
    startListening()

    return () => {
      stopListening()
    }
  }, [])

  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="flex flex-col items-center">
        { !!frequency &&
          <div className="flex items-center gap-2 mb-8">
            <Diamond size={20} fill={scale == 1 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 1 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 2 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 3 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 4 ? '#e7000b' : 'none'} />
            <Diamond size={30} fill={scale == 5 ? '#00c951' : 'none'} />
            <Diamond size={20} fill={scale == 6 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 7 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 8 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 9 ? '#e7000b' : 'none'} />
            <Diamond size={20} fill={scale == 1 ? '#e7000b' : 'none'} />
          </div>
        }
        { !frequency &&
          <div className="flex items-center gap-2 mb-8 text-gray-700">
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={30} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
          </div>
        }
        <div>
          { note && <span className="text-9xl">{ note }</span> }
          {!note && <span className="text-9xl text-gray-700">A</span> }
          { octave && <span className="text-xl">{ octave }</span> }
          { !octave && <span className="text-xl text-gray-700">0</span> }
        </div>
        <div>
          { !!frequency && <span className="text-sm">{ Math.round(frequency) }hz</span> }
          { !frequency && <span className="text-sm text-gray-700">Toque uma nota</span> }
        </div>
      </div>
    </div>
  );
}
