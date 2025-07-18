// components/TabPanel.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Palette,
  Guitar,
  Dumbbell,
  Settings,
} from 'lucide-react'

export default function TabPanel() {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Cromático',
      path: '/',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      name: 'Corda a corda',
      path: '/corda-a-corda',
      icon: <Guitar className="w-5 h-5" />,
    },
    {
      name: 'Treinar',
      path: '/treinar',
      icon: <Dumbbell className="w-5 h-5" />,
    },
    {
      name: 'Preferências',
      path: '/preferencias',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  // Função para verificar se a aba está ativa
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`mr-2 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                {tab.icon}
              </span>
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
