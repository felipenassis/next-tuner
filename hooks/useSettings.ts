'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark'
export type Algorithm = 'YIN' | 'MPM'
export type Tuning = '440' | '432' | '415' | '392' | '466'

export interface Settings {
  theme: Theme
  algorithm: Algorithm
  tuning: Tuning
}

const STORAGE_KEY = 'appSettings'

export default function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    algorithm: 'YIN',
    tuning: '440',
  })

  // Carrega configurações do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed: Settings = JSON.parse(saved)
      setSettings(parsed)
    }
  }, [])

  // Salva configurações no localStorage ao mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Alternar tema
  const toggleTheme = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  // Escolher tema explícito
  const chooseTheme = useCallback((theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }))
  }, [])

  // Atualizar qualquer configuração
  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  return { settings, toggleTheme, chooseTheme, updateSetting }
}
