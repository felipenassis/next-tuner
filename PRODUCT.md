# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Público real principal: o próprio desenvolvedor (Felipe Assis), estudando e praticando desenvolvimento web moderno (Next.js, TypeScript, Web Audio API). Uso secundário: recrutadores, comunidade e outros desenvolvedores avaliando o projeto como peça de portfólio. Não há intenção ativa de atrair uma base de usuários músicos externos, embora o app seja funcional para afinação e prática musical real.

## Product Purpose

Um afinador de instrumentos (principalmente de cordas) com recursos extras de prática musical: referência de afinação por corda, treino de afinação de ouvido, e treino de percepção harmônica (progressões de acordes). Existe para servir como projeto de estudo e demonstração de habilidades técnicas (Next.js, TypeScript, Web Audio API/AudioWorklet, detecção de pitch), não como produto comercial. Sucesso = um projeto tecnicamente sólido, funcional e apresentável — não métricas de usuários/engajamento.

## Positioning

Nenhum diferencial de mercado pretendido — não busca competir ou se diferenciar de afinadores/apps de treino musical já existentes. O valor prático (não uma proposta de posicionamento) está em reunir afinação, treino auditivo e treino de progressão de acordes num só app, evitando trocar de ferramenta durante a prática.

## Operating Context

Uso no navegador (desktop ou mobile), tipicamente enquanto o usuário segura/toca um instrumento de cordas (violão, baixo, violino etc.) e precisa ler a tela com as mãos ocupadas — leitura rápida, pouca interação por toque durante a afinação em si. Requer acesso ao microfone (`getUserMedia`) para o afinador cromático e o corda-a-corda funcionarem.

## Capabilities and Constraints

- 100% client-side: sem backend, sem contas de usuário, sem banco de dados. Todo estado (tema, algoritmo de detecção, padrão de afinação) persiste em `localStorage`.
- Interface e todos os textos em português do Brasil (pt-BR).
- Hospedado na Vercel.
- Detecção de pitch via Web Audio API (AudioWorklet), algoritmos YIN e MPM rodando no navegador do usuário — sem custo de servidor, mas dependente do suporte do navegador a AudioWorklet e da permissão de microfone.
- Sem testes de usuário reais nem dados de analytics — decisões de produto/design são inferidas pelo desenvolvedor, não validadas com usuários externos.

## Evidence on Hand

Nenhuma evidência de usuários reais, depoimentos, dados de uso ou testes de mercado. Screenshots do app existem em `public/screenshots/` (home, tuner, ear-training, harmony-training) e são usados no README. Nenhum outro material (estudos de caso, imprensa, benchmarks) deve ser inventado.

## Product Principles

1. Projeto de estudo em primeiro lugar: prioriza aprendizado e qualidade técnica sobre crescimento de usuários ou métricas de produto.
2. Ferramenta real e funcional: mesmo sem ambição comercial, precisa funcionar corretamente para afinar um instrumento de verdade.
3. Sem intenção de diferenciação de mercado: não desenhar como se estivesse competindo com apps de afinação estabelecidos.
4. 100% client-side por escolha: nenhuma decisão de design deve introduzir dependência de backend/contas.
5. pt-BR sempre: toda copy, rótulos e mensagens de erro em português do Brasil.

## Accessibility & Inclusion

Nenhum requisito de acessibilidade específico foi estabelecido pelo usuário até agora.
