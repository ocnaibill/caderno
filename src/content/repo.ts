// Consultas de leitura sobre o índice no SQLite. O corpo/frontmatter de cada
// folha é sempre relido do arquivo markdown na hora — o banco só diz qual
// arquivo abrir (ver docs/ARQUITETURA.md: SQLite é índice, não fonte).

import { resolve } from "node:path";
import { getDb } from "../db/client.ts";
import { parseFolha } from "./parse.ts";
import type { Folha } from "./types.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");

export interface PostRow {
  id: number;
  numero: number;
  slug: string;
  titulo: string;
  caminho_arquivo: string;
  rascunho: number;
  data_publicacao: string;
}

export interface PensamentoRow {
  numero: number;
  corpo: string;
  data: string;
}

export function buscarFolhaPorSlug(slug: string): { post: PostRow; folha: Folha } | undefined {
  const db = getDb();
  const post = db
    .query<PostRow, [string]>(
      "SELECT id, numero, slug, titulo, caminho_arquivo, rascunho, data_publicacao FROM posts WHERE slug = ?",
    )
    .get(slug);

  // RN-02: rascunho nunca é servido publicamente.
  if (!post || post.rascunho) return undefined;

  const folha = parseFolha(resolve(RAIZ_CONTEUDO, post.caminho_arquivo));
  return { post, folha };
}

export function buscarUltimaFolhaPublicada(): PostRow | undefined {
  const db = getDb();
  return db
    .query<PostRow, []>(
      `SELECT id, numero, slug, titulo, caminho_arquivo, rascunho, data_publicacao
       FROM posts WHERE rascunho = 0
       ORDER BY data_publicacao DESC, numero DESC LIMIT 1`,
    )
    .get() ?? undefined;
}

export function buscarPensamentosDaFolha(postId: number): PensamentoRow[] {
  const db = getDb();
  return db
    .query<PensamentoRow, [number]>(
      "SELECT numero, corpo, data FROM pensamentos WHERE post_id = ? ORDER BY numero ASC",
    )
    .all(postId);
}

export interface FolhaAdjacente {
  slug: string;
  titulo: string;
  numero: number;
}

export function buscarAdjacentes(numero: number): {
  anterior?: FolhaAdjacente;
  proxima?: FolhaAdjacente;
} {
  const db = getDb();
  const anterior = db
    .query<FolhaAdjacente, [number]>(
      "SELECT slug, titulo, numero FROM posts WHERE rascunho = 0 AND numero < ? ORDER BY numero DESC LIMIT 1",
    )
    .get(numero);
  const proxima = db
    .query<FolhaAdjacente, [number]>(
      "SELECT slug, titulo, numero FROM posts WHERE rascunho = 0 AND numero > ? ORDER BY numero ASC LIMIT 1",
    )
    .get(numero);

  return { anterior: anterior ?? undefined, proxima: proxima ?? undefined };
}

export interface ArquivoItem {
  numero: number;
  slug: string;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  data_publicacao: string;
  caminho_arquivo: string;
}

export interface FiltrosArquivo {
  categoria?: string;
  tag?: string;
  q?: string;
  ano?: string;
}

/** Lista folhas publicadas respeitando os filtros do Arquivo (RF-07 a RF-09). */
export function buscarFolhasPublicadas(filtros: FiltrosArquivo = {}): ArquivoItem[] {
  const db = getDb();
  const condicoes = ["p.rascunho = 0"];
  const params: Record<string, string> = {};

  if (filtros.categoria) {
    condicoes.push("p.categoria = $categoria");
    params.$categoria = filtros.categoria;
  }
  if (filtros.ano) {
    condicoes.push("strftime('%Y', p.data_publicacao) = $ano");
    params.$ano = filtros.ano;
  }
  if (filtros.tag) {
    condicoes.push(
      "p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.nome = $tag)",
    );
    params.$tag = filtros.tag;
  }
  if (filtros.q) {
    // FTS5 MATCH como frase entre aspas: evita que sintaxe especial do
    // usuário (-, *, "...) quebre a query.
    condicoes.push("p.id IN (SELECT post_id FROM posts_fts WHERE posts_fts MATCH $q)");
    params.$q = `"${filtros.q.replaceAll('"', '""')}"`;
  }

  return db
    .query<ArquivoItem, Record<string, string>>(
      `SELECT p.numero, p.slug, p.titulo, p.resumo, p.categoria, p.data_publicacao, p.caminho_arquivo
       FROM posts p
       WHERE ${condicoes.join(" AND ")}
       ORDER BY p.data_publicacao DESC, p.numero DESC`,
    )
    .all(params);
}

export interface CategoriaContagem {
  categoria: string;
  total: number;
}

export function buscarCategorias(): CategoriaContagem[] {
  const db = getDb();
  return db
    .query<CategoriaContagem, []>(
      `SELECT categoria, COUNT(*) AS total
       FROM posts
       WHERE rascunho = 0 AND categoria IS NOT NULL
       GROUP BY categoria
       ORDER BY categoria ASC`,
    )
    .all();
}

export interface TagContagem {
  nome: string;
  total: number;
}

export function buscarTagsComContagem(): TagContagem[] {
  const db = getDb();
  return db
    .query<TagContagem, []>(
      `SELECT t.nome AS nome, COUNT(*) AS total
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       JOIN posts p ON p.id = pt.post_id
       WHERE p.rascunho = 0
       GROUP BY t.nome
       ORDER BY total DESC, t.nome ASC`,
    )
    .all();
}

/** Destaques editoriais (RF-11) — folhas marcadas com `destaque: true` no frontmatter. */
export function buscarDestaques(limite = 3): ArquivoItem[] {
  const db = getDb();
  return db
    .query<ArquivoItem, [number]>(
      `SELECT numero, slug, titulo, resumo, categoria, data_publicacao, caminho_arquivo
       FROM posts
       WHERE rascunho = 0 AND destaque = 1
       ORDER BY data_publicacao DESC, numero DESC
       LIMIT ?`,
    )
    .all(limite);
}
