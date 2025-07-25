'use client'

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Algorithm = 'YIN' | 'MPM';
type Tuning = '440' | '432' | '415' | '392' | '466';

interface Settings {
  theme: Theme;
  algorithm: Algorithm;
  tuning: Tuning;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    algorithm: 'YIN',
    tuning: '440',
  });

  // Carrega as configurações do localStorage quando o componente monta
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Salva as configurações no localStorage sempre que elas mudam
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as Theme;
    setSettings({ ...settings, theme });
    // Aplica o tema imediatamente
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, algorithm: e.target.value as Algorithm });
  };

  const handleTuningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, tuning: e.target.value as Tuning });
  };

  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
        
        <div className="space-y-6">
          {/* Seletor de Tema */}
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tema
            </label>
            <select
              id="theme"
              value={settings.theme}
              onChange={handleThemeChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>

          {/* Seletor de Algoritmo */}
          <div>
            <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Algoritmo de Detecção
            </label>
            <select
              id="algorithm"
              value={settings.algorithm}
              onChange={handleAlgorithmChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="YIN">YIN</option>
              <option value="MPM">MPM (McLeod Pitch Method)</option>
            </select>
          </div>

          {/* Seletor de Afinação */}
          <div>
            <label htmlFor="tuning" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Afinação (Hz)
            </label>
            <select
              id="tuning"
              value={settings.tuning}
              onChange={handleTuningChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
    </div>
  );
}
