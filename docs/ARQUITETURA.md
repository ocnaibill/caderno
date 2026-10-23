# Arquitetura — O Caderno

Decisões de stack e de pipeline de conteúdo, fechadas em conversa com o Bianco em 22/10/2026.

## Stack

- **Runtime/servidor**: Bun (HTTP server nativo, renderiza HTML no servidor — sem React).
- **Persistência**: `bun:sqlite` — zero dependência externa, já vem com o Bun.
- **Conteúdo (as "folhas")**: Markdown em arquivos no próprio repo, versionado no git.
- **Envio de e-mail**: provedor terceirizado (Resend ou Postmark — a decidir qual na implementação; ambos têm free tier que cobre bem um público pequeno).
- **Parser Markdown**: `marked`, com HTML cru habilitado (comportamento padrão da lib) — permite embeds (YouTube, tweets, etc.) direto no `.md`, sem inventar sintaxe própria, porque o autor é único e confiável.
- **Cores/tipografia/espaçamento**: variáveis CSS com os **mesmos nomes dos tokens do `DESIGN.md`** (`--color-surface-container-low`, `--color-on-surface-variant` etc.), valor idêntico ao hex do frontmatter de lá. Nunca aproximar visualmente "de cabeça" — o nome do token já diz qual cor literal usar.

### Por que não React (decisão debatida e fechada em 22/10/2026)

O próprio `DESIGN.md` rejeita explicitamente "high-frequency motion" e clutter visual — a estética é deliberadamente contida, não SPA-like. Um app React implicaria build step e hidratação, o que vai contra a RNF-05 (texto legível rápido, sem depender de JS pesado) e contra o espírito de "projeto mais simples". Em vez disso:

- **Estilização**: Tailwind é opcional e pode ser usado só como compilador utilitário (sem runtime React), com o tema configurado a partir das variáveis do `DESIGN.md` — ou CSS direto, a decidir na implementação.
- **Interatividade pontual** (toggle de fonte/tamanho/tema, formulário de comentário, filtro+busca do Arquivo, assinatura, menu de baixar): JS vanilla ou Alpine.js (poucos KB, sem bundler), com progressive enhancement — formulários funcionam via POST normal mesmo sem JS.
- **Motion sutil**: `View Transitions API` nativa do browser + CSS, ou uma lib leve tipo `motion` (~4kb, sem framework), se algum dia fizer sentido — nada de animação estilo SPA.
- **Válvula de escape**: se uma folha específica pedir um embed bem interativo (gráfico, mini-demo), isso vira uma "ilha" isolada — um `<script type="module">` só naquela página, podendo usar o que for preciso ali dentro — sem isso virar a arquitetura do site inteiro.

## Modelo de conteúdo: "misto"

O Markdown é a **fonte da verdade**. O SQLite é só um **índice derivado**, reconstruível a qualquer momento a partir dos arquivos — nunca o contrário. Apagar o banco e reindexar do zero sempre tem que funcionar.

### Estrutura de arquivos

```
content/
  folhas/
    042-vozes-da-cabeca/
      index.md          # frontmatter + corpo da folha
      capa.jpg
      cafeteira-itinerante.jpg
    041-peso-dos-livros/
      index.md
  pensamentos/
    001.md
    002.md
  paginas/
    eu.md                # página "Eu" (sobre o autor), sem frontmatter de índice
```

Cada folha é uma **pasta** (page bundle), não um arquivo solto — isso permite guardar imagens e outros anexos junto do texto, referenciados por caminho relativo no markdown.

### Anotações à margem (pensamentos)

São o conteúdo do card "Anotações à Margem" da sidebar da Folha. Regras, conforme o Bianco:
- Uma folha pode ter **zero, uma ou várias** anotações.
- A numeração (o "Pensamentos #42" do rótulo) é **global** — um contador próprio, independente do número da folha. Não existe garantia de que o `#N` do pensamento bata com o `Nº` da folha onde ele aparece (no exemplo do Figma coincidiu, mas é coincidência).

Frontmatter de um pensamento:

```yaml
---
numero: 7
data: 2024-10-12
folha: 042-vozes-da-cabeca   # opcional — slug da folha a que se associa
---
Acabei escrevendo essa bosta aqui porque simplesmente não sabia mais o
que fazer com tanta coisa na caixola, e bem... Aqui estamos!
```

`folha` é opcional no modelo — assumi que é possível registrar um pensamento sem vínculo com nenhuma folha específica (fica de fora da sidebar de qualquer folha, mas ainda existe como registro). Sinaliza se não é esse o caso.

### Frontmatter de uma folha

```yaml
---
numero: 42
titulo: "As vozes da minha cabeça precisavam de um local..."
subtitulo: "Gostei da ideia de ter algum lugar para anotar tudo que penso..."
data: 2024-10-12
hora: "06:14"            # opcional — vira "Escrito às 06:14" na autoria
categoria: desenvolvimento-ideias-hobby
tags: [bun, figma, newsletter]
resumo: "Sobre decidir construir isso do zero..."
capa: capa.jpg
rascunho: false
permite_comentarios: true
destaque: false          # true = aparece em "Edições Favoritas" no Arquivo
---
```

- `subtitulo` é a linha em itálico exibida logo abaixo do H1, na própria página da folha (confirmado no Figma — havia um nó de texto dedicado para isso, que eu tinha deixado passar na primeira leitura).
- `resumo` é usado só como excerpt no Arquivo, meta description (og:description) e corpo do item no RSS — não aparece na página da folha.
- `hora` é opcional; sem ela, a autoria só mostra localização e tempo de leitura, sem "Escrito às...".
- Páginas estáticas (`content/paginas/*.md`) não entram no índice/Arquivo — são renderizadas direto, sem frontmatter de catalogação.

### Convenções dentro do corpo (markdown)

Além do markdown padrão, o corpo de uma folha aceita:

- **Seção sem título visível**: `## Texto da seção {oculto}` — entra no índice "Seções desta folha" normalmente, mas o `<h2>` não aparece no corpo (fica só como âncora, visível a leitores de tela). Útil pra estruturar sem forçar um heading toda vez.
- **Legenda de imagem**: `![alt](caminho.jpg "Texto da legenda")` — o `title` da imagem (sintaxe markdown padrão) vira uma `<figcaption>` centralizada abaixo dela.
- **Caixa de nota**: HTML cru — `<aside class="nota">texto</aside>` ou, em itálico, `<aside class="nota nota--italico">texto</aside>`.
- **Lista com título + corpo**: item com um parágrafo em negrito (vira o "título", cor `primary`) seguido de um parágrafo em branco (vira o "corpo", cor `on-surface-variant`):
  ```markdown
  1. **Título do item**

     Corpo do item, pode ter mais de uma frase.
  ```
  Precisa da linha em branco entre título e corpo pra virarem parágrafos separados — sem ela, o markdown funde tudo numa linha só.

### Reindexação

Um script (`reindex` ou equivalente) varre `content/folhas/**/index.md` e faz upsert nas tabelas `posts`, `tags`, `post_tags` (ver [BANCO_DE_DADOS.md](BANCO_DE_DADOS.md)). Roda:
- Em desenvolvimento, sob demanda ou com watch do filesystem.
- No deploy, como passo antes de subir o servidor.

Tempo de leitura é **calculado on-the-fly** a partir da contagem de palavras do corpo — não é persistido, é derivado.

### Busca

Tabela virtual **FTS5** (`bun:sqlite` já suporta nativamente) sobre `titulo`, `resumo` e corpo, populada/atualizada no mesmo passo de reindex. Cobre a caixa "Buscar por termo ou ideia" do Arquivo sem precisar de serviço externo. Repare que `subtitulo` **não** entra na busca — só `titulo`, `resumo` e o corpo.

### Cards finais ("Glosas Marginais & Livros Citados")

A seção de recomendação no rodapé de uma folha tem um título de seção fixo ("Glosas Marginais & Livros Citados"), mas cada card dentro dela é **totalmente livre** e em quantidade variável (0, 1, 2, 3+ por folha). Cada card tem 3 campos — `tipo` (o que aparece em "Ref. 01 — {tipo}"), `nome` (o item recomendado em si) e `corpo` (a descrição):

```yaml
cards_finais:
  - tipo: "Leitura Recomendada"
    nome: "Elogio da Sombra"
    corpo: "Jun'ichirō Tanizaki. Ensaio sobre a estética japonesa da penumbra."
  - tipo: "Instrumento Usual"
    nome: "Tinta Ferrogálica"
    corpo: "Composto tradicional de sais de ferro, escurece na folha com o tempo."
```

O número do "Ref. NN" é gerado pela posição no array, não guardado no frontmatter. O layout é responsivo à quantidade (CSS Grid com `auto-fit`/`minmax`): 1 card ocupa a largura toda, 2 ficam lado a lado, 3+ quebram linha — sem precisar de lógica condicional no template, só CSS.

### Dois formatos de e-mail

A partir do **mesmo markdown fonte**, geramos duas versões por edição:
- **Texto Puro**: plain text, formatado para leitores de e-mail simples / e-ink (ver mockup "Amostra da Caixa de Entrada" na tela Assinar).
- **Edição Editorial**: HTML usando os tokens do `DESIGN.md` (Newsreader, notas marginais, sépia).

### O que é banco "de verdade" (não derivado de markdown)

`comentários`, `assinantes` e `envios` são dados gerados em runtime por terceiros (leitores) — não são conteúdo autoral, então vivem só no SQLite, sem contrapartida em arquivo.
