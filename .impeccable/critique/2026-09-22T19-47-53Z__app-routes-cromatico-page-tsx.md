---
target: a página do afinador cromático
total_score: 14
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:/home/felipe/Projetos/misc/next-tuner/app/(routes)/(cromatico)/page.tsx"
target_fingerprint: "sha256:5c7ed45cf0dee05e2e16b6db55d87b914b423a3c25872d6271f5d2b71b206e78"
target_path: /home/felipe/Projetos/misc/next-tuner/app/(routes)/(cromatico)/page.tsx
timestamp: 2026-09-22T19-47-53Z
slug: app-routes-cromatico-page-tsx
closed: true
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector/browser evidence)

## Correção editorial antes do relatório

Ambas as avaliações incluíram uma alegação factual específica que verifiquei e é **falsa** — registro isso porque afeta quanto confiar em detalhes não verificados abaixo, não só esses dois pontos:

- **Assessment A** afirmou que existe um `components/TuningMeter.tsx` (um gauge analógico) no codebase, citando CLAUDE.md. **Não existe** — confirmei via grep, esse componente foi criado e depois revertido numa sessão anterior. A pergunta provocativa da Assessment A sobre "por que a página não usa esse componente" não se aplica.
- **Assessment B** afirmou que CLAUDE.md documenta uma paleta âmbar/latão + teal, contradizendo o `DESIGN.md` recém-escrito (azul/indigo). **Não existe** essa menção em CLAUDE.md — confirmei via grep e `git diff`, o arquivo está idêntico ao commit atual. Não há contradição real: `DESIGN.md` (azul/indigo, "Azul Padrão"/"Indigo Padrão") está correto e reflete o código real.

Os demais achados abaixo com números de linha específicos (o bug do `cents ? ... : 0`, os literais `text-gray-700`/`#e7000b`/`#00c951`) foram verificados por mim diretamente no código antes de entrarem neste relatório.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | `isListening` existe no hook mas nunca é lido pela página — nenhuma diferença visual entre "iniciando mic", "ouvindo em silêncio" e "não ouvindo ainda". |
| 2 | Match System / Real World | 3/4 | Vocabulário musical padrão (nota, Hz, oitava) é apropriado para o público. |
| 3 | User Control and Freedom | 0/4 | Sem botão de mute/parar, sem retry após erro, sem trocar algoritmo/afinação nesta tela. |
| 4 | Consistency and Standards | 1/4 | Única página do app sem `bg-surface`/cartão (quebra a própria "Regra do Cartão Único" do DESIGN.md); usa `text-gray-700` e hex cru em vez dos tokens `danger`/`success`. |
| 5 | Error Prevention | 2/4 | Tela somente-leitura, pouco a prevenir. |
| 6 | Recognition Rather Than Recall | 2/4 | Padrão de afinação/algoritmo ativos não aparecem nesta tela — usuário precisa lembrar o que configurou em Preferências. |
| 7 | Flexibility and Efficiency of Use | n/a | Display de uso único, sem atalhos de especialista aplicáveis. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Genuinamente minimalista, mas lê como ausência de design, não como restrição deliberada. |
| 9 | Error Recovery | 2/4 | Mensagem de erro correta e diferenciada por tipo (verificado: `NotAllowedError`/`NotFoundError`/genérico), mas zero affordance de recuperação (sem botão "tentar de novo"). |
| 10 | Help and Documentation | n/a | Razoável excluir para uma tela de uso único e auto-evidente. |
| **Total** | | **14/32** | **Poor (44%)** |

## Design Specificity Verdict

**Avaliação qualitativa (Assessment A):** Não é uma composição específica deste produto — é o layout genérico de qualquer widget de "um número grande no centro" (cronômetro, contador de BPM, pontuação). O medidor de diamantes lê como um rating/progress widget, não como um instrumento analógico. Esta é também a única página do app sem o cartão centralizado (`bg-surface`) que toda outra rota usa — quebra o próprio padrão que o DESIGN.md documenta.

**Varredura determinística (Assessment B, verificado por mim):** `impeccable detect --json` no arquivo-fonte retornou `[]` (zero achados, exit 0) — confirmei rodando de novo eu mesmo. Isso é uma lacuna real do scanner, não uma limpeza real do código: o arquivo contém `text-gray-700` (4x, linhas 59/73/75/79) e cores hex cruas `#e7000b`/`#00c951` (linhas 47–55) fora do sistema de tokens — exatamente o tipo de violação que a regra de "raw Tailwind color scale" deveria pegar. O modo regex do detector para `.tsx` aparentemente não cobre esse padrão de prop JSX (`fill={... ? '#e7000b' : 'none'}`).

**Overlay visual:** não disponível nesta sessão — a varredura de URL renderizada falhou (`exit 1`, "No Chrome/Chromium/Edge/Brave installation found"; o binário Puppeteer embutido não achou navegador no sistema, e o cache do Puppeteer está com um download incompleto/vazio). Isso não é um achado de design, é uma limitação ambiental desta máquina — sinalizando aqui em vez de fingir que a checagem visual em navegador ocorreu.

## Overall Impression

A funcionalidade central (detecção de pitch, tratamento de erro) está bem construída — mas a interface não decidiu ser nada específico ainda, e tem um bug real que atinge o momento mais importante da tela: o instante em que o usuário afina corretamente.

## What's Working

- **Tratamento de erro do hook é sólido**: `NotAllowedError`/`NotFoundError`/genérico são diferenciados corretamente, em português claro, com limpeza adequada do stream/contexto de áudio em caso de falha (verificado em `hooks/useFrequencyAnalyzer.ts`).
- **Throttle de 200ms** nas mensagens do worklet evita que o display pisque/trema com ruído — uma decisão de engenharia específica e correta para uma tela que precisa ser lida em tempo real, sem distração.
- **Clamping do `mapearParaEscala`** (`Math.max(1, Math.min(9, ...))`) evita que o medidor quebre em desafinações extremas.

## Priority Issues

- **[P0] O medidor zera exatamente quando a nota está afinada.** `setScale(cents ? mapearParaEscala(cents) : 0)` (linha 31) — quando `cents === 0` (afinação perfeita), a expressão ternária avalia o ramo falsy porque `0` é falsy em JS, resetando o medidor para a posição "muito grave" em vez de "afinado" (posição 5). Verifiquei essa linha diretamente no arquivo. **Por que importa:** é o único bug funcional da lista, e atinge o momento exato que a tela existe para comunicar. **Fix:** trocar para `setScale(cents !== null ? mapearParaEscala(cents) : 0)`. **Comando sugerido:** `/impeccable harden` (é um defeito funcional, não estético).

- **[P0] Sem caminho de recuperação após erro de microfone.** Uma vez que `error` é setado, não existe botão de retry — a única saída é recarregar a página inteira. **Por que importa:** em qualquer negação acidental de permissão (comum em primeiro uso), o app fica permanentemente morto até um F5. **Fix:** renderizar um botão "Tentar novamente" que chama `startListening()` quando `error` é truthy. **Comando sugerido:** `/impeccable harden`.

- **[P1] Momento de sucesso é visualmente inerte.** O estado "afinado" (scale===5) só aumenta um diamante em ~10px e muda sua cor — sem mudança na letra da nota, sem movimento, sem nada mais na tela reconhecendo o sucesso. **Por que importa:** por PRODUCT.md, o uso real é com as mãos ocupadas segurando o instrumento — o momento que mais precisa ser óbvio de relance é o menos enfatizado da tela. **Fix:** a letra da nota poderia virar `text-success` com uma transição sutil quando dentro do threshold. **Comando sugerido:** `/impeccable delight` ou `/impeccable colorize`.

- **[P1] Cores fora do sistema de tokens.** `text-gray-700` (4 ocorrências) e hex cru `#e7000b`/`#00c951` em vez de `text-muted-foreground`/tokens `danger`/`success` — o próprio DESIGN.md lista isso como Don't explícito, e o scanner automático não pegou (ver Design Specificity acima). **Fix:** trocar pelos tokens semânticos equivalentes. **Comando sugerido:** `/impeccable polish`.

- **[P2] Medidor de diamantes não é reconhecível como indicador de afinação.** Nove diamantes idênticos em contorno leem como um rating/progress genérico, sem rótulo textual nem indicação de "centro = afinado" além do tamanho e cor. **Fix mínimo:** um tick central ou rótulo textual; alternativa mais ambiciosa seria um gauge analógico dedicado. **Comando sugerido:** `/impeccable layout` ou `/impeccable colorize`, dependendo de quanto redesenho o usuário quer.

## Persona Red Flags

**Jordan (primeira vez, confuso):** Sem onboarding — no primeiro carregamento, antes da permissão de mic ser concedida, Jordan só vê um "A/0" cinza e diamantes cinzas sem nenhuma explicação do que fazer. O texto "Toque uma nota" só aparece depois que a permissão já foi concedida e o app está ouvindo — antes disso, silêncio total.

**Sam (dependente de acessibilidade):** Falha quase completa. Não há `aria-live` na nota/frequência/cents — um usuário de leitor de tela não recebe nenhuma atualização enquanto o pitch muda, o que é a função central da página. Não há nenhum elemento focável/interativo na tela (zero `<button>`), então não há nada para navegar via teclado — mas também nada é anunciado. A mensagem de erro (texto vermelho) não tem `role="alert"`, então também não é anunciada.

## Minor Observations

- O aviso "1 Issue" do overlay de dev do Next provavelmente é o warning já conhecido de `exhaustive-deps` no `useEffect` de `startListening`/`stopListening` — não uma regressão nova.
- Frequência exatamente `0` (abaixo do detectável) é indistinguível de "não está ouvindo", já que ambos usam a checagem `!!frequency`.
- Vermelho/verde são os únicos diferenciadores do medidor — problemático para daltonismo, já que não há rótulo textual de apoio.
- Em telas grandes (desktop), o conteúdo nunca cresce além de algumas centenas de pixels — ao contrário das páginas irmãs, esta não usa nenhum contêiner com largura máxima consistente (`max-w-md`), deixando um vazio ainda maior ao redor.

## Questions to Consider

- Se o uso real é com as mãos ocupadas tocando o instrumento, o que essa tela pareceria se o estado "afinado" — não o estado ocioso — fosse o ponto de partida do design?
- Dado que o PRODUCT.md deliberadamente não busca diferenciação visual de mercado, o maior ganho agora seria acessibilidade (anúncios de pitch via `aria-live`, botão de retry visível) em vez de mais polimento visual?
