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

export interface DestaqueItem extends ArquivoItem {
  salvos: number;
}

/** Destaques editoriais (RF-11) — folhas marcadas com `destaque: true` no frontmatter. */
export function buscarDestaques(limite = 3): DestaqueItem[] {
  const db = getDb();
  return db
    .query<DestaqueItem, [number]>(
      `SELECT p.numero, p.slug, p.titulo, p.resumo, p.categoria, p.data_publicacao, p.caminho_arquivo,
              COALESCE(i.salvos, 0) AS salvos
       FROM posts p
       LEFT JOIN interacoes i ON i.post_id = p.id
       WHERE p.rascunho = 0 AND p.destaque = 1
       ORDER BY p.data_publicacao DESC, p.numero DESC
       LIMIT ?`,
    )
    .all(limite);
}

export interface Interacoes {
  curtidas: number;
  salvos: number;
}

export function buscarInteracoes(slug: string): Interacoes {
  const db = getDb();
  const linha = db
    .query<Interacoes, [string]>(
      `SELECT COALESCE(i.curtidas, 0) AS curtidas, COALESCE(i.salvos, 0) AS salvos
       FROM posts p
       LEFT JOIN interacoes i ON i.post_id = p.id
       WHERE p.slug = ?`,
    )
    .get(slug);
  return linha ?? { curtidas: 0, salvos: 0 };
}

export type TipoInteracao = "curtida" | "salvo";

/** Ajusta curtidas/salvos em +1 ou -1 (toggle fica a cargo do cliente). Nunca deixa ir abaixo de 0. */
export function ajustarInteracao(slug: string, tipo: TipoInteracao, delta: 1 | -1): Interacoes | undefined {
  const db = getDb();
  const post = db.query<{ id: number }, [string]>("SELECT id FROM posts WHERE slug = ?").get(slug);
  if (!post) return undefined;

  const coluna = tipo === "curtida" ? "curtidas" : "salvos";
  db.query("INSERT OR IGNORE INTO interacoes (post_id) VALUES (?)").run(post.id);
  db.query(`UPDATE interacoes SET ${coluna} = MAX(0, ${coluna} + ?) WHERE post_id = ?`).run(delta, post.id);

  return db
    .query<Interacoes, [number]>(
      "SELECT curtidas, salvos FROM interacoes WHERE post_id = ?",
    )
    .get(post.id) ?? undefined;
}

/** Últimas N folhas publicadas, pra listas rápidas (ex. "Arquivo Recente" na tela Assinar). */
export function buscarRecentes(limite = 3): ArquivoItem[] {
  const db = getDb();
  return db
    .query<ArquivoItem, [number]>(
      `SELECT numero, slug, titulo, resumo, categoria, data_publicacao, caminho_arquivo
       FROM posts
       WHERE rascunho = 0
       ORDER BY data_publicacao DESC, numero DESC
       LIMIT ?`,
    )
    .all(limite);
}

export type FormatoEmail = "texto_puro" | "editorial";
export type StatusAssinante = "pendente_confirmacao" | "ativo" | "cancelado";

export interface ResultadoAssinatura {
  status: "nova" | "ja_existia";
  statusAssinante: StatusAssinante;
  token?: string;
}

/**
 * Cria um assinante novo com status `ativo` direto — double opt-in (RN-12)
 * fica pendente de ter um provedor de e-mail configurado (Resend/Postmark)
 * pra realmente mandar o e-mail de confirmação; por ora seria um link que
 * não vai pra lugar nenhum. Ver docs/REGRAS_DE_NEGOCIO.md.
 */
export function criarAssinante(email: string, formato: FormatoEmail): ResultadoAssinatura {
  const db = getDb();
  const existente = db
    .query<{ status: StatusAssinante; token_gerenciamento: string }, [string]>(
      "SELECT status, token_gerenciamento FROM assinantes WHERE email = ?",
    )
    .get(email);

  if (existente) {
    if (existente.status === "cancelado") {
      db.query(
        "UPDATE assinantes SET status = 'ativo', formato_preferido = ?, cancelado_em = NULL WHERE email = ?",
      ).run(formato, email);
      return { status: "nova", statusAssinante: "ativo", token: existente.token_gerenciamento };
    }
    return { status: "ja_existia", statusAssinante: existente.status, token: existente.token_gerenciamento };
  }

  const token = crypto.randomUUID();
  db.query(
    `INSERT INTO assinantes (email, formato_preferido, status, token_gerenciamento)
     VALUES (?, ?, 'ativo', ?)`,
  ).run(email, formato, token);

  return { status: "nova", statusAssinante: "ativo", token };
}

export interface AssinanteGerenciavel {
  email: string;
  formato_preferido: FormatoEmail;
  status: StatusAssinante;
}

export function buscarAssinantePorToken(token: string): AssinanteGerenciavel | undefined {
  const db = getDb();
  return (
    db
      .query<AssinanteGerenciavel, [string]>(
        "SELECT email, formato_preferido, status FROM assinantes WHERE token_gerenciamento = ?",
      )
      .get(token) ?? undefined
  );
}

/** RF-19: trocar o formato preferido sem precisar de login, só com o token. */
export function atualizarFormatoAssinante(token: string, formato: FormatoEmail): boolean {
  const db = getDb();
  const linha = db
    .query("UPDATE assinantes SET formato_preferido = ? WHERE token_gerenciamento = ? AND status = 'ativo'")
    .run(formato, token);
  return linha.changes > 0;
}

/** RF-19/RN-07: cancelamento self-service, sem login, só com o token do e-mail. */
export function cancelarAssinante(token: string): boolean {
  const db = getDb();
  const linha = db.query("UPDATE assinantes SET status = 'cancelado', cancelado_em = datetime('now') WHERE token_gerenciamento = ? AND status != 'cancelado'").run(token);
  return linha.changes > 0;
}

export interface AssinanteAtivo {
  email: string;
  token_gerenciamento: string;
}

export function buscarAssinantesAtivos(formato: FormatoEmail): AssinanteAtivo[] {
  const db = getDb();
  return db
    .query<AssinanteAtivo, [string]>(
      "SELECT email, token_gerenciamento FROM assinantes WHERE status = 'ativo' AND formato_preferido = ?",
    )
    .all(formato);
}

/** RF-20: histórico de envios por edição, pra auditoria própria. */
export function registrarEnvio(slug: string, formato: FormatoEmail, totalDestinatarios: number): void {
  const db = getDb();
  const post = db.query<{ id: number }, [string]>("SELECT id FROM posts WHERE slug = ?").get(slug);
  if (!post) return;
  db.query(
    "INSERT INTO envios (post_id, formato, total_destinatarios) VALUES (?, ?, ?)",
  ).run(post.id, formato, totalDestinatarios);
}

export interface EnvioRegistrado {
  formato: FormatoEmail;
  total_destinatarios: number;
  enviado_em: string;
}

export function buscarEnviosDaFolha(slug: string): EnvioRegistrado[] {
  const db = getDb();
  return db
    .query<EnvioRegistrado, [string]>(
      `SELECT e.formato, e.total_destinatarios, e.enviado_em
       FROM envios e
       JOIN posts p ON p.id = e.post_id
       WHERE p.slug = ?
       ORDER BY e.enviado_em DESC`,
    )
    .all(slug);
}
