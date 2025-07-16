// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TabPanel from './components/TabPanel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Seu Aplicativo',
  description: 'Descrição do seu aplicativo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <main className="min-h-screen flex flex-col flex-grow">
          {/* Componente TabPanel */}
          <div className="mb-6">
            <TabPanel />
          </div>
          
          {/* Conteúdo da página */}
          {children}
        </main>
      </body>
    </html>
  )
}
