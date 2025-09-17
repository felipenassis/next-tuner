'use client'

import useSettings, { Theme, Algorithm, Tuning } from '@/hooks/useSettings'

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()

  const handleThemeChange = (value: Theme) => {
    document.documentElement.classList.toggle('dark', value === 'dark')
    updateSetting('theme', value as Theme)
  }

  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="max-w-md mx-auto bg-surface rounded-xl shadow-md overflow-hidden p-6 space-y-6">
        
        {/* Tema */}
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-foreground mb-1">
            Tema
          </label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => handleThemeChange(e.target.value as Theme)}
            className="w-full px-3 py-2 border border-border-strong rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-muted text-foreground"
          >
            <option value="system">Mesmo do sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </div>

        {/* Algoritmo */}
        <div>
          <label htmlFor="algorithm" className="block text-sm font-medium text-foreground mb-1">
            Algoritmo de Detecção
          </label>
          <select
            id="algorithm"
            value={settings.algorithm}
            onChange={(e) => updateSetting('algorithm', e.target.value as Algorithm)}
            className="w-full px-3 py-2 border border-border-strong rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-muted text-foreground"
          >
            <option value="YIN">YIN</option>
            <option value="MPM">MPM (McLeod Pitch Method)</option>
          </select>
        </div>

        {/* Afinação */}
        <div>
          <label htmlFor="tuning" className="block text-sm font-medium text-foreground mb-1">
            Afinação (Hz)
          </label>
          <select
            id="tuning"
            value={settings.tuning}
            onChange={(e) => updateSetting('tuning', e.target.value as Tuning)}
            className="w-full px-3 py-2 border border-border-strong rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-muted text-foreground"
          >
            <option value="440">A = 440 Hz (Padrão moderno)</option>
            <option value="432">A = 432 Hz (Afinação científica)</option>
            <option value="415">A = 415 Hz (Barroco)</option>
            <option value="392">A = 392 Hz (Renascença)</option>
            <option value="466">A = 466 Hz (Classicismo)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
