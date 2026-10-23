# Requisitos — O Caderno

Ver [TELAS_E_UX.md](TELAS_E_UX.md) para o mapeamento de cada tela e [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md) para as regras que sustentam estes requisitos.

## Requisitos Funcionais

### Leitura de folhas
- **RF-01**: Exibir uma folha publicada a partir do seu `slug`, renderizando o markdown (incluindo HTML embutido para embeds).
- **RF-02**: Gerar automaticamente o índice "Seções desta folha" a partir dos H2 do corpo, com âncoras de navegação.
- **RF-03**: Exibir tempo de leitura estimado, calculado a partir da contagem de palavras.
- **RF-04**: Alternar fonte (Serif/Mono), tamanho de texto (Aa/Aa+) e esquema de cor (claro/escuro), persistindo a preferência no navegador (sem precisar de conta).
- **RF-05**: Oferecer impressão com folha de estilo dedicada (`@media print`), coerente com a estética "papel" do design. ✅
- **RF-06**: Exibir navegação para a folha anterior/próxima (quando existirem).
- **RF-06b**: Exibir `subtitulo` (lede em itálico) logo abaixo do título, e três ações rápidas: curtir, compartilhar e baixar a folha. Baixar abre um menuzinho com a escolha de formato: `.md` puro ou PDF. ✅ — `.md` é download de verdade do arquivo fonte; "PDF" abre o diálogo de impressão do navegador (RF-05) em vez de gerar PDF no servidor, pra não precisar de uma lib de PDF só pra isso.
- **RF-06c**: Exibir de zero a N cards de "Anotações à margem" (pensamentos) associados à folha, cada um com numeração global própria.
- **RF-06d**: Exibir de zero a N cards de recomendação no rodapé da folha, com título e corpo livres definidos pelo autor, em layout que se adapta à quantidade.

### Arquivo
- **RF-07**: Listar folhas publicadas agrupadas por ano e mês, em ordem decrescente de data.
- **RF-08**: Filtrar a listagem por categoria.
- **RF-09**: Buscar folhas por termo livre (título, resumo e corpo) via FTS5.
- **RF-10**: Colapsar anos anteriores ao corrente num bloco de "Tomo" por ano.
- **RF-11**: Exibir lista de "Edições Favoritas" curada manualmente pelo autor (campo de destaque no frontmatter ou lista separada — a definir na implementação).
- **RF-12**: Exibir índice de tags com contagem de ocorrências.

### Página "Eu"
- **RF-13**: Renderizar `content/paginas/eu.md` como página estática, na mesma estética do restante do site. ✅

### Comentários
- **RF-14**: Permitir que um leitor envie comentário em uma folha com `permite_comentarios: true`, com nome opcional, e-mail opcional e opção de identidade oculta.
- **RF-15**: Comentário só aparece publicamente após aprovação manual (RN-05).

### Assinatura e e-mail
- **RF-16**: Permitir inscrição por e-mail, com escolha de formato (Texto Puro / Edição Editorial). ✅ `POST /assinar`.
- **RF-17**: Enviar e-mail de confirmação de inscrição (double opt-in, RN-12). ⏸ Pendente de provedor de e-mail configurado — ver RN-12.
- **RF-18**: Gerar, para cada edição, as duas versões de e-mail (texto puro e HTML editorial) a partir do mesmo markdown fonte. 🔶 A função de render existe (`src/email/render.ts`, usada na amostra da tela Assinar); falta o template final pronto pra envio de verdade.
- **RF-19**: Permitir que o assinante cancele a inscrição ou troque de formato sem login, via link único. ✅ `GET/POST /assinar/gerenciar?token=` (trocar formato) e `GET /assinar/cancelar?token=` (cancelar).
- **RF-20**: Registrar histórico de envios por edição (tabela `envios`), para auditoria própria.

### RSS e integração
- **RF-21**: Expor feed RSS/Atom com as folhas publicadas (RN-10). ✅ `GET /rss.xml` (RSS 2.0, últimas 20).
- **RF-22**: Expor meta tags (OpenGraph, description) usando `resumo` e `capa` de cada folha, para preview em redes/mensageiros. 🔶 og:title/description/url + canonical feitos; falta og:image (depende de `capa` virar um caminho de arquivo de verdade em alguma folha).
- **RF-23** (novo): `robots.txt` e `sitemap.xml` derivados do índice de posts. ✅

## Requisitos Não-Funcionais

- **RNF-01 — Privacidade**: sem analytics de terceiros nem cookies de rastreamento. Qualquer preferência de leitura (fonte, tamanho, tema) fica só no navegador do leitor.
- **RNF-02 — Simplicidade de stack**: minimizar dependências externas — priorizar o que o Bun já oferece nativamente (`bun:sqlite`, servidor HTTP) antes de adicionar framework/biblioteca.
- **RNF-03 — Portabilidade do conteúdo**: todo o conteúdo autoral vive em markdown versionado em git — nenhuma informação editorial fica presa só no banco (o banco é descartável/reconstruível).
- **RNF-04 — Acessibilidade**: respeitar o "Accessibility Switch" do `DESIGN.md` (fonte humanista Atkinson Hyperlegible Next e modo mono como alternativas ao serifado), com contraste adequado nas duas opções de tema.
- **RNF-05 — Performance de leitura**: tempo até o texto ficar legível (sem esperar JS pesado) deve ser baixo — a experiência de leitura não pode depender de hidratação de UI pesada.
- **RNF-06 — Resiliência a spam**: formulários de comentário e assinatura usam defesas simples (honeypot, moderação manual) já que CAPTCHA está fora de cogitação.
- **RNF-07 — Disponibilidade**: aceitável rodar em infraestrutura pessoal (homelab) com disponibilidade "best effort" — não é um serviço com SLA, é um projeto pessoal.
- **RNF-08 — Idioma único**: PT-BR, fuso de Brasília (BRT) — sem requisito de internacionalização.
- **RNF-09 — Deliverability de e-mail**: uso de provedor terceirizado (Resend/Postmark) com SPF/DKIM configurados corretamente, para não cair em spam.
