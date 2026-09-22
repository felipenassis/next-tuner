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
    error,
    startListening,
    stopListening
  } = useFrequencyAnalyzer(settings.tuning, settings.algorithm)

  const mapearParaEscala = (cents: number): number => {
    // Mapeia o número de [-50, 50] para [1, 9]
    const valorMapeado = Math.round(((cents + 50) / 100) * 8 + 1);

    // Garante que o resultado esteja entre 1 e 9
    return Math.max(1, Math.min(9, valorMapeado));
  }

  // Afinação é uma ação rotineira, repetida a cada corda — a confirmação
  // precisa parecer certa e imediata, não uma celebração que compete pela
  // atenção de quem está com as mãos ocupadas no instrumento.
  const isInTune = cents !== null && Math.abs(cents) <= 5

  useEffect(() => {
    // cents pode ser exatamente 0 quando a nota está perfeitamente afinada —
    // usar `cents !== null` em vez de truthiness evita zerar o medidor nesse momento.
    setScale(cents !== null ? mapearParaEscala(cents) : 0)
  }, [cents, frequency])

  useEffect(() => {
    startListening()

    return () => {
      stopListening()
    }
  }, [])

  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="max-w-md mx-auto bg-surface rounded-xl shadow-md overflow-hidden p-6 flex flex-col items-center">
        { !!frequency &&
          <div className="flex items-center gap-2 mb-8">
            <Diamond size={20} fill={scale == 1 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 2 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 3 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 4 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={30} fill={scale == 5 ? 'var(--color-success)' : 'none'} />
            <Diamond size={20} fill={scale == 6 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 7 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 8 ? 'var(--color-danger)' : 'none'} />
            <Diamond size={20} fill={scale == 9 ? 'var(--color-danger)' : 'none'} />
          </div>
        }
        { !frequency &&
          <div className="flex items-center gap-2 mb-8 text-muted-foreground">
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={30} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
            <Diamond size={20} />
          </div>
        }
        { !!frequency &&
          // A cor sozinha (vermelho/verde) não distingue os diamantes para quem
          // tem daltonismo — o rótulo de texto nomeia o estado que a cor só reforça.
          <span
            className={`text-sm font-medium -mt-6 mb-6 ${isInTune ? 'text-success' : 'text-warning'}`}
            aria-live="polite"
          >
            { isInTune ? 'Afinado' : cents !== null && cents < 0 ? 'Grave — suba a afinação' : 'Agudo — abaixe a afinação' }
          </span>
        }
        <div>
          { note &&
            <span
              className={`text-9xl inline-block transition-[color,transform] duration-300 ease-out ${
                isInTune ? 'text-success scale-105' : ''
              }`}
            >
              { note }
            </span>
          }
          {!note && <span className="text-9xl text-muted-foreground">A</span> }
          { octave !== null && <span className="text-xl">{ octave }</span> }
          { octave === null && <span className="text-xl text-muted-foreground">0</span> }
        </div>
        <div className="flex flex-col items-center gap-2">
          { !!frequency && <span className="text-sm">{ Math.round(frequency) }hz</span> }
          { !frequency && !error && <span className="text-sm text-muted-foreground">Toque uma nota</span> }
          { error &&
            <>
              <span className="text-sm text-danger" role="alert">{ error }</span>
              <button
                type="button"
                onClick={startListening}
                className="text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
              >
                Tentar novamente
              </button>
            </>
          }
        </div>
      </div>
    </div>
  );
}
