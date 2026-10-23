-- Índice de conteúdo (derivado dos arquivos em content/ — reconstruível a qualquer momento).
-- Ver docs/BANCO_DE_DADOS.md para a intenção de cada tabela.

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  resumo TEXT,
  categoria TEXT,
  data_publicacao TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  rascunho INTEGER NOT NULL DEFAULT 0,
  permite_comentarios INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Tabela virtual FTS5 standalone (não "external content"): guarda sua própria cópia do
-- texto, repopulada a cada reindex. post_id é só pra religar o resultado da busca ao post.
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  titulo,
  resumo,
  corpo,
  post_id UNINDEXED
);

CREATE TABLE IF NOT EXISTS pensamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL UNIQUE,
  post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  corpo TEXT NOT NULL,
  data TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL
);

-- Dados de runtime (não derivados de arquivo — ver docs/ARQUITETURA.md).

-- Comentário é sempre tratado como anônimo publicamente (não indexado, sem
-- exigir conta) — "nome" é só um campo livre opcional que o leitor pode
-- preencher; em branco, aparece como "Anônimo" (RN-04).
CREATE TABLE IF NOT EXISTS comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  corpo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  ip_hash TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assinantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  formato_preferido TEXT NOT NULL DEFAULT 'texto_puro' CHECK (formato_preferido IN ('texto_puro', 'editorial')),
  status TEXT NOT NULL DEFAULT 'pendente_confirmacao' CHECK (status IN ('pendente_confirmacao', 'ativo', 'cancelado')),
  token_gerenciamento TEXT NOT NULL UNIQUE,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  confirmado_em TEXT,
  cancelado_em TEXT
);

CREATE TABLE IF NOT EXISTS envios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  formato TEXT NOT NULL CHECK (formato IN ('texto_puro', 'editorial')),
  total_destinatarios INTEGER NOT NULL,
  enviado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
