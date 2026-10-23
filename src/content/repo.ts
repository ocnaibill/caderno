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
