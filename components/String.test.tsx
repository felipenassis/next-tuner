import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import String, { type StringColor } from './String'

describe('String — regressão de bug de cores trocadas', () => {
  it('aplica a classe de fundo correspondente a cada StringColor', () => {
    // Bug histórico: o mapa colorToClass estava embaralhado (ex.: color="red"
    // renderizava bg-blue-900), então a cor visível não batia com o nome da prop.
    const expectedClasses: Record<StringColor, string> = {
      yellow: 'bg-yellow-900',
      red: 'bg-red-900',
      black: 'bg-black',
      green: 'bg-green-900',
      purple: 'bg-purple-900',
      gray: 'bg-gray-900',
    }

    for (const [color, expectedClass] of Object.entries(expectedClasses) as [StringColor, string][]) {
      const { container, unmount } = render(<String color={color} />)
      expect(container.innerHTML).toContain(expectedClass)
      unmount()
    }
  })
})
