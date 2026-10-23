# Banco de Dados — O Caderno

SQLite via `bun:sqlite`. Ver [ARQUITETURA.md](ARQUITETURA.md) para o porquê da divisão entre tabelas-índice (derivadas de markdown) e tabelas "de verdade" (dados de runtime).

## Índice de conteúdo (derivado — reconstruível a qualquer momento)

### `posts`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `numero` | INTEGER, único | Número sequencial da folha (RN-01) |
| `slug` | TEXT, único | Derivado do nome da pasta |
| `titulo` | TEXT | |
| `subtitulo` | TEXT | Lede exibida abaixo do H1 na própria folha |
| `resumo` | TEXT | Excerpt/meta description/RSS (RN-03) |
| `categoria` | TEXT | Categoria primária (RN-08) |
| `data_publicacao` | DATE | |
| `caminho_arquivo` | TEXT | Caminho relativo ao `index.md`, para reabrir o arquivo fonte |
| `rascunho` | BOOLEAN | Default `false` (RN-02) |
| `permite_comentarios` | BOOLEAN | Default `true` |
| `destaque` | BOOLEAN | Default `false` — aparece em "Edições Favoritas" no Arquivo (RF-11) |
| `criado_em` / `atualizado_em` | DATETIME | Timestamps do próprio processo de reindex, não do conteúdo |

### `tags`

| Coluna | Tipo |
|---|---|
| `id` | INTEGER PK |
| `nome` | TEXT, único |

### `post_tags`

| Coluna | Tipo |
|---|---|
| `post_id` | FK → `posts.id` |
| `tag_id` | FK → `tags.id` |

### `posts_fts` (virtual table FTS5)

Indexa `titulo`, `resumo` e corpo extraído do markdown. Repopulada a cada reindex. Alimenta a busca do Arquivo.

### `pensamentos`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `numero` | INTEGER, único | Contador global, independente do número da folha |
| `post_id` | FK → `posts.id`, nullable | Nulo se o pensamento não está associado a nenhuma folha |
| `corpo` | TEXT | |
| `data` | DATE | |
| `caminho_arquivo` | TEXT | |

## Dados de runtime (não derivados de arquivo)

### `interacoes`

Contador de curtir (Folha) e salvar (Arquivo). Sem conta de leitor — quem já curtiu/salvou fica registrado no `localStorage` do navegador do leitor, que decide se o próximo clique manda `+1` ou `-1`. Tabela separada de `posts` (que é derivada/reconstruível) pra não perder os números só por rodar reindex.

| Coluna | Tipo | Notas |
|---|---|---|
| `post_id` | INTEGER PK, FK → `posts.id` | |
| `curtidas` | INTEGER | Default `0`, nunca negativo |
| `salvos` | INTEGER | Default `0`, nunca negativo — exibido em "Edições Marcantes" no Arquivo |

### `comentarios`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `post_id` | FK → `posts.id` | |
| `nome` | TEXT, nullable | Campo livre opcional; em branco, exibido como "Anônimo" |
| `email` | TEXT, nullable | Nunca exibido publicamente; só para notificação opcional de resposta |
| `corpo` | TEXT | |
| `status` | TEXT | `pendente` \| `aprovado` \| `rejeitado` (RN-05) |
| `ip_hash` | TEXT, nullable | Hash, não o IP cru — só para rate limiting/anti-spam |
| `criado_em` | DATETIME | |

### `assinantes`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `email` | TEXT, único | |
| `formato_preferido` | TEXT | `texto_puro` \| `editorial` |
| `status` | TEXT | `pendente_confirmacao` \| `ativo` \| `cancelado` (RN-06) |
| `token_gerenciamento` | TEXT, único | Usado no link de cancelar/trocar formato sem login |
| `criado_em` / `confirmado_em` / `cancelado_em` | DATETIME | |

### `envios`

Histórico de disparo por edição — útil mesmo sem dashboard de métricas, para auditoria própria ("já mandei essa edição?").

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `post_id` | FK → `posts.id` | |
| `formato` | TEXT | `texto_puro` \| `editorial` |
| `total_destinatarios` | INTEGER | |
| `enviado_em` | DATETIME | |

## Diagrama (visão geral)

```
posts ──┬── post_tags ── tags
        ├── comentarios
        ├── envios
        ├── pensamentos (post_id opcional)
        ├── interacoes (1:1)
        └── posts_fts (espelha posts)

assinantes (independente — não referencia posts)
```
