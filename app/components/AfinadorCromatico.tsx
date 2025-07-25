'use client'

import { Diamond, CircleSmall } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import useFrequencyAnalyzer from "@/hooks/useFrequencyAnalyzer"

export default function AfinadorCromatico() {
  const [scale, setScale] = useState<number>(0)

  const {
    frequency,
    cents,
    note,
    octave,
    startListening,
    stopListening
  } = useFrequencyAnalyzer()

  const mapearParaEscala = (cents: number): number => {
    // Mapeia o número de [-50, 50] para [1, 9]
    const valorMapeado = Math.round(((cents + 50) / 100) * 8 + 1);
    
    // Garante que o resultado esteja entre 1 e 9
    return Math.max(1, Math.min(9, valorMapeado));
}

  useMemo(() => {
    if (cents) {
      setScale(mapearParaEscala(cents))
    } else {
      setScale(0)
    }
  }, [frequency])

  useEffect(() => {
    startListening()

    return () => {
      stopListening()
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      { !!frequency &&
        <div className="flex items-center gap-2 mb-8">
          <CircleSmall fill={scale == 1 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 1 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 2 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 3 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 4 ? '#e7000b' : 'none'} />
          <Diamond size={30} fill={scale == 5 ? '#00c951' : 'none'} />
          <CircleSmall fill={scale == 6 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 7 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 8 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 9 ? '#e7000b' : 'none'} />
          <CircleSmall fill={scale == 1 ? '#e7000b' : 'none'} />
        </div>
      }
      { !frequency &&
        <div className="flex items-center gap-2 mb-8">
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <Diamond size={30} className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
          <CircleSmall className="text-gray-700" />
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
  )
}
