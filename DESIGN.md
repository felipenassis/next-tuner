---
name: next-tuner
description: Afinador de instrumentos de cordas com treino auditivo, em Next.js
colors:
  primary: "oklch(54.6% 0.245 262.881)"
  primary-hover: "oklch(48.8% 0.243 264.376)"
  primary-active: "oklch(42.4% 0.199 265.638)"
  accent: "oklch(58.5% 0.233 277.117)"
  accent-hover: "oklch(51.1% 0.262 276.966)"
  surface: "oklch(98.4% 0.003 247.858)"
  surface-muted: "oklch(96.8% 0.007 247.896)"
  neutral-bg: "oklch(100% 0 0)"
  neutral-text: "oklch(21% 0.034 264.665)"
  neutral-border: "oklch(92.8% 0.006 264.531)"
  neutral-border-strong: "oklch(87.2% 0.01 258.338)"
  success: "oklch(62.7% 0.194 149.214)"
  danger: "oklch(57.7% 0.245 27.325)"
  warning: "oklch(76.9% 0.188 70.08)"
  info: "oklch(68.5% 0.169 237.323)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "8rem"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "6px"
  card: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-border}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: next-tuner

## Overview

**Creative North Star: "A Bancada do Afinador"**

next-tuner ainda não tem um sistema visual desenhado com intenção — este documento registra honestamente o que existe hoje, para que trabalho futuro reconheça isso como ponto de partida, não como uma decisão de marca a ser preservada a qualquer custo. A sensação atual é utilitária e minimalista: uma tela escura, um cartão único centralizado, cores padrão do Tailwind (azul e indigo, sem paleta customizada), sem ornamento. Isso combina com o que o PRODUCT.md registra — um projeto de estudo, sem ambição de diferenciação de mercado — mas é importante não confundir "ainda não decidido" com "decidido a ser genérico".

Nenhuma referência visual foi rejeitada explicitamente até agora; não há histórico de decisões estéticas a documentar, só o que o código acabou tendo.

**Key Characteristics:**
- Um cartão único, centralizado, por tela — nunca um layout de múltiplas colunas ou grid.
- Paleta padrão do Tailwind (azul/indigo), sem tokens de marca customizados.
- Tipografia: uma única família (Inter), sem hierarquia formal de tamanhos.
- Modo escuro e claro via classe `.dark`, com tokens semânticos definidos mas nem sempre usados de forma consistente.
- Sem elevação/sombra deliberada — o que existe é resultado de copiar/colar, não de um sistema.

## Colors

Paleta inteiramente extraída de escalas padrão do Tailwind (`blue`, `indigo`, `gray`/`slate`) — nenhuma cor foi customizada ou escolhida com intenção de marca até agora.

### Primary
- **Azul Padrão** (`oklch(54.6% 0.245 262.881)` / Tailwind `blue-600`, `blue-500` no dark mode): ação principal — botões primários (ex.: "Novo Exercício"), aba ativa na navegação, anel de foco em campos.

### Secondary (accent)
- **Indigo Padrão** (`oklch(58.5% 0.233 277.117)` / Tailwind `indigo-500`, `indigo-400` no dark mode): ação secundária — ex. botão "Tocar Progressão" ao lado de um botão primário.

### Neutral
- **Fundo da página**: branco (`#ffffff`) no claro, `gray-900` (`oklch(21% 0.034 264.665)`) no escuro — aplicado direto no `<body>`, fora do sistema de tokens semânticos.
- **Cartão/superfície** (`--color-surface`): `slate-50` no claro, `gray-800` no escuro.
- **Superfície alternativa** (`--color-surface-muted`): `slate-100` no claro, `gray-700` no escuro — usada em selects/inputs.
- **Texto** (`--color-foreground` / `text-foreground`): `gray-900` no claro, `gray-50` no escuro — usado em rótulos dentro dos cartões. Note que o `<body>` usa um texto ligeiramente diferente (`gray-100` no escuro) por estar fora do sistema de tokens; **essa divergência não é intencional**, é uma inconsistência a corrigir, não um padrão a seguir.
- **Bordas** (`--color-border` / `--color-border-strong`): `gray-200`/`gray-300` no claro, `gray-700`/`gray-600` no escuro.

### Named Rules (optional, powerful)
**A Regra do Cartão Único.** Cada tela é um único cartão centralizado (`bg-surface`, cantos arredondados, sombra leve) sobre um fundo vazio — não duas colunas, não um grid de cards menores.

## Typography

**Body Font:** Inter (com fallback `ui-sans-serif, system-ui, sans-serif`)

**Character:** Uma família só, carregada via `next/font/google`, usada para tudo — títulos, rótulos, corpo e dados numéricos (Hz, cents). Não há uma segunda família para dados/mono; números de frequência usam a mesma Inter proporcional.

### Hierarchy

Não existe uma escala formal de tipos — os tamanhos abaixo são os que o código de fato usa, não uma hierarquia desenhada:

- **Display** (`text-9xl`, ~128px, peso padrão): a letra da nota no afinador cromático (ex. "A", "E") — o único momento verdadeiramente grande da interface.
- **Title** (`text-lg`/`text-xl`, peso `font-semibold`): títulos de seção dentro de um cartão (ex. "Cordas do Violão/Guitarra").
- **Label** (`text-sm`, peso `font-medium`): rótulos de campo (ex. "Instrumento", "Tipo de Afinação").
- **Body** (`text-sm`/tamanho base, peso normal): texto corrido, mensagens de estado ("Toque uma nota").

### Named Rules (optional)
**A Regra do Salto.** Não há passos intermediários entre o `text-9xl` da nota e o resto da interface (majoritariamente `text-sm`/`text-lg`) — é um salto de escala, não uma progressão gradual. Isso é o que existe, não necessariamente o que deveria existir.

## Layout

Toda página segue o mesmo modelo: `<main>` ocupa a tela inteira (`min-h-screen flex flex-col`), com a navegação (`TabPanel`) fixa no topo e o conteúdo da rota centralizado vertical e horizontalmente (`flex flex-grow justify-center items-center`) dentro do espaço restante. O conteúdo em si é quase sempre um único cartão (`max-w-md`, ou seja, ~28rem/448px de largura máxima) — nunca ocupa a largura toda, mesmo em telas grandes, deixando bastante espaço vazio nas laterais e verticalmente.

Responsividade é mínima: o único breakpoint usado no projeto é `sm:` no `TabPanel`, que troca o ícone+rótulo de empilhado (mobile) para lado a lado (≥640px). Nenhuma outra página tem tratamento responsivo — o cartão de largura fixa simplesmente encolhe/cresce com `max-w-md` e padding fixo.

## Elevation & Depth

Não há uma filosofia de elevação deliberada — nenhuma decisão foi tomada, é resultado de copiar/colar entre páginas sem revisão. O que existe hoje: `shadow-sm` em inputs/selects, e `shadow-md` ou `shadow-lg` no cartão principal de cada página (inconsistente — algumas páginas usam um, outras o outro, sem razão aparente). Não há resposta de elevação a hover, foco ou interação em nenhum componente.

### Shadow Vocabulary (if applicable)
- **Sombra de campo** (`shadow-sm`): inputs e selects.
- **Sombra de cartão** (`shadow-md` ou `shadow-lg`, inconsistente): o cartão único de cada página — precisa de escolha única daqui pra frente.

## Shapes

`rounded-md` (6px) domina em botões, selects e inputs. Os cartões usam `rounded-xl` (12px) ou `rounded-lg` (8px) de forma inconsistente entre páginas. Elementos circulares pequenos (a "cravelha" do componente `String`) usam `rounded-full`. Bordas são sempre 1px, usando os tokens `border`/`border-strong`.

## Components

### Buttons
- **Shape:** `rounded-md` (6px), padding `px-4 py-2`.
- **Primary:** `bg-primary text-primary-foreground` — ação principal de cada tela (ex. "Novo Exercício", "Verificar Resposta").
- **Secondary/Accent:** `bg-accent text-accent-foreground` — ação secundária ao lado de uma primária (ex. "Tocar Progressão").
- **Hover / Focus:** inconsistente — a maioria dos botões só muda o cursor (`hover:cursor-pointer`) sem nenhuma resposta visual de cor no hover; o anel de foco do navegador não é tematizado em nenhum botão.

### Cards / Containers
- **Corner Style:** `rounded-xl` ou `rounded-lg` (inconsistente, ver Shapes).
- **Background:** `bg-surface`.
- **Shadow Strategy:** ver Elevation & Depth — `shadow-md` ou `shadow-lg`, inconsistente.
- **Internal Padding:** `p-6` (24px).

### Inputs / Fields (selects)
- **Style:** `bg-surface-muted`, borda `border border-border-strong`, `rounded-md`, `shadow-sm` — este é o padrão mais consistente do projeto, repetido de forma idêntica em Preferências, Corda a Corda e nas telas de Treinar.
- **Focus:** `focus:ring-primary focus:border-primary`.
- **Error / Disabled:** não implementado em nenhum campo do projeto ainda.

### Navigation (TabPanel)
- **Estilo:** aba ativa usa `text-primary bg-surface-muted font-semibold`; abas inativas usam `text-foreground-muted`, com `hover:text-foreground hover:bg-surface-muted`.
- **Mobile:** ícone empilhado acima do rótulo (`flex-col`); a partir de `sm:`, ícone e rótulo ficam lado a lado (`sm:flex-row`).

### Custom Slider
- Trilho: `bg-disabled`. Manípulo (thumb): `bg-primary`, escala 1.25x no hover, com transição.
- **Gap conhecido:** o estilo do manípulo só cobre `::-webkit-slider-thumb` — não há equivalente `::-moz-range-thumb`, então o controle aparece sem estilo no Firefox.

### String (corda-a-corda, componente assinatura)
- Uma barra vertical fina + um círculo ("cravelha") na base, colorido conforme a corda.
- **Gap conhecido:** as cores (`bg-yellow-900`, `bg-red-900` etc.) são valores Tailwind literais, fora do sistema de tokens semânticos — não reagem a mudanças de tema/marca como o resto do app.

### Diamond Meter (afinador cromático, componente assinatura)
- Fileira de ícones de diamante (`lucide-react`), preenchidos em vermelho quando desafinado e em verde quando no centro (afinado) — o único indicador visual analógico do app.

## Do's and Don'ts

Diretrizes concretas baseadas no que existe hoje — não invenções de um sistema aspiracional.

### Do:
- **Do** usar os tokens semânticos (`bg-surface`, `text-foreground`, `bg-primary`, etc.) para qualquer cor nova — nunca uma classe Tailwind crua (`bg-gray-700`, `bg-blue-600`).
- **Do** seguir o padrão de select já estabelecido (`bg-surface-muted border border-border-strong rounded-md shadow-sm focus:ring-primary focus:border-primary`) para qualquer novo campo — é o único padrão realmente consistente no projeto hoje.
- **Do** manter o modelo de "um cartão centralizado por tela" (`max-w-md`, `bg-surface`, `p-6`) a menos que o conteúdo da tela genuinamente exija outra estrutura.

### Don't:
- **Don't** misturar `rounded-xl`/`rounded-lg` ou `shadow-md`/`shadow-lg` para o mesmo papel de "cartão principal" — escolha um valor único e use-o em todas as páginas.
- **Don't** estilizar cores fora do sistema de tokens (como o componente `String` faz hoje) — isso quebra o tema escuro/claro e qualquer mudança futura de paleta.
- **Don't** tratar a paleta azul/indigo atual como uma escolha de marca definitiva ao decidir sobre novo trabalho visual — ela é o default do Tailwind, não uma decisão registrada.
