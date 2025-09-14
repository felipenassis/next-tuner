import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import TabPanel from '@/components/TabPanel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next tuner',
  description: 'Projeto de afinador de instrumentos de corda usando Next.js',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script para aplicar o tema antes da renderização */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settings = localStorage.getItem('appSettings');
                if (settings) {
                  const { theme } = JSON.parse(settings);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <main className="min-h-screen flex flex-col flex-grow">
          <TabPanel />
          {children}
        </main>
      </body>
    </html>
  )
}
