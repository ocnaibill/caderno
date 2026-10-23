#!/usr/bin/env bun
// Varre content/folhas/** e content/pensamentos/*.md e sincroniza o índice no SQLite.
// O banco é só um cache derivado dos arquivos — rodar isso de novo sempre deve
// deixar o índice coerente com o que está em content/, mesmo depois de editar,
// apagar ou renomear arquivos (ver docs/ARQUITETURA.md).

import { Glob } from "bun";
import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { getDb } from "../db/client.ts";
import { derivarResumo, parseFolha, parsePensamento } from "./parse.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");
const DIR_FOLHAS = resolve(RAIZ_CONTEUDO, "folhas");
const DIR_PENSAMENTOS = resolve(RAIZ_CONTEUDO, "pensamentos");

function reindexarFolhas(): Set<string> {
  const db = getDb();
  const slugsEncontrados = new Set<string>();

  const upsertPost = db.prepare(`
    INSERT INTO posts (numero, slug, titulo, subtitulo, resumo, categoria, data_publicacao, caminho_arquivo, rascunho, permite_comentarios, destaque, atualizado_em)
    VALUES ($numero, $slug, $titulo, $subtitulo, $resumo, $categoria, $data_publicacao, $caminho_arquivo, $rascunho, $permite_comentarios, $destaque, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      numero = excluded.numero,
      titulo = excluded.titulo,
      subtitulo = excluded.subtitulo,
      resumo = excluded.resumo,
      categoria = excluded.categoria,
      data_publicacao = excluded.data_publicacao,
      caminho_arquivo = excluded.caminho_arquivo,
      rascunho = excluded.rascunho,
      permite_comentarios = excluded.permite_comentarios,
      destaque = excluded.destaque,
      atualizado_em = datetime('now')
  `);

  const buscarPostIdPorSlug = db.prepare<{ id: number }, [string]>(
    "SELECT id FROM posts WHERE slug = ?",
  );
  const upsertTag = db.prepare<{ id: number }, [string]>(
    "INSERT INTO tags (nome) VALUES (?) ON CONFLICT(nome) DO UPDATE SET nome = excluded.nome RETURNING id",
  );
  const limparTagsDoPost = db.prepare("DELETE FROM post_tags WHERE post_id = ?");
  const vincularTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  const limparFtsDoPost = db.prepare("DELETE FROM posts_fts WHERE post_id = ?");
  const inserirFts = db.prepare(
    "INSERT INTO posts_fts (titulo, resumo, corpo, post_id) VALUES (?, ?, ?, ?)",
  );

  const glob = new Glob("*/index.md");
  const arquivosFolhas = existsSync(DIR_FOLHAS) ? glob.scanSync({ cwd: DIR_FOLHAS }) : [];
  for (const caminhoRelativo of arquivosFolhas) {
    const caminhoArquivo = resolve(DIR_FOLHAS, caminhoRelativo);
    const folha = parseFolha(caminhoArquivo);
    const resumo = folha.frontmatter.resumo ?? derivarResumo(folha.corpo);

    upsertPost.run({
      $numero: folha.frontmatter.numero,
      $slug: folha.slug,
      $titulo: folha.frontmatter.titulo,
      $subtitulo: folha.frontmatter.subtitulo ?? null,
      $resumo: resumo,
      $categoria: folha.frontmatter.categoria ?? null,
      $data_publicacao: folha.frontmatter.data,
      $caminho_arquivo: relative(RAIZ_CONTEUDO, caminhoArquivo),
      $rascunho: folha.frontmatter.rascunho ? 1 : 0,
      $permite_comentarios: folha.frontmatter.permite_comentarios === false ? 0 : 1,
      $destaque: folha.frontmatter.destaque ? 1 : 0,
    });

    const post = buscarPostIdPorSlug.get(folha.slug);
    if (!post) throw new Error(`Falha ao indexar a folha: ${folha.slug}`);

    limparTagsDoPost.run(post.id);
    for (const nomeTag of folha.frontmatter.tags ?? []) {
      const tag = upsertTag.get(nomeTag);
      if (tag) vincularTag.run(post.id, tag.id);
    }

    limparFtsDoPost.run(post.id);
    inserirFts.run(folha.frontmatter.titulo, resumo, folha.corpo, post.id);

    slugsEncontrados.add(folha.slug);
    console.log(`  folha  Nº${folha.frontmatter.numero}  ${folha.slug}`);
  }

  return slugsEncontrados;
}

function reindexarPensamentos(): Set<number> {
  const db = getDb();
  const numerosEncontrados = new Set<number>();

  const buscarPostIdPorSlug = db.prepare<{ id: number }, [string]>(
    "SELECT id FROM posts WHERE slug = ?",
  );
  const upsertPensamento = db.prepare(`
    INSERT INTO pensamentos (numero, post_id, corpo, data, caminho_arquivo)
    VALUES ($numero, $post_id, $corpo, $data, $caminho_arquivo)
    ON CONFLICT(numero) DO UPDATE SET
      post_id = excluded.post_id,
      corpo = excluded.corpo,
      data = excluded.data,
      caminho_arquivo = excluded.caminho_arquivo
  `);

  const glob = new Glob("*.md");
  const arquivosPensamentos = existsSync(DIR_PENSAMENTOS) ? glob.scanSync({ cwd: DIR_PENSAMENTOS }) : [];
  for (const caminhoRelativo of arquivosPensamentos) {
    const caminhoArquivo = resolve(DIR_PENSAMENTOS, caminhoRelativo);
    const pensamento = parsePensamento(caminhoArquivo);

    const post = pensamento.frontmatter.folha
      ? buscarPostIdPorSlug.get(pensamento.frontmatter.folha)
      : undefined;

    if (pensamento.frontmatter.folha && !post) {
      console.warn(
        `  aviso: pensamento #${pensamento.frontmatter.numero} referencia a folha "${pensamento.frontmatter.folha}", que não foi encontrada`,
      );
    }

    upsertPensamento.run({
      $numero: pensamento.frontmatter.numero,
      $post_id: post?.id ?? null,
      $corpo: pensamento.corpo,
      $data: pensamento.frontmatter.data,
      $caminho_arquivo: relative(RAIZ_CONTEUDO, caminhoArquivo),
    });

    numerosEncontrados.add(pensamento.frontmatter.numero);
    console.log(`  pensamento  #${pensamento.frontmatter.numero}`);
  }

  return numerosEncontrados;
}

function removerOrfaos(slugsValidos: Set<string>, numerosValidos: Set<number>): void {
  const db = getDb();

  const slugsExistentes = db.query<{ slug: string }, []>("SELECT slug FROM posts").all();
  const removerPost = db.prepare("DELETE FROM posts WHERE slug = ?");
  for (const { slug } of slugsExistentes) {
    if (!slugsValidos.has(slug)) {
      removerPost.run(slug);
      console.log(`  removido (não existe mais em content/): folha ${slug}`);
    }
  }

  const numerosExistentes = db
    .query<{ numero: number }, []>("SELECT numero FROM pensamentos")
    .all();
  const removerPensamento = db.prepare("DELETE FROM pensamentos WHERE numero = ?");
  for (const { numero } of numerosExistentes) {
    if (!numerosValidos.has(numero)) {
      removerPensamento.run(numero);
      console.log(`  removido (não existe mais em content/): pensamento #${numero}`);
    }
  }
}

function main(): void {
  const db = getDb();
  console.log("Reindexando content/...");

  const resultado = db.transaction(() => {
    const slugs = reindexarFolhas();
    const numeros = reindexarPensamentos();
    removerOrfaos(slugs, numeros);
    return { folhas: slugs.size, pensamentos: numeros.size };
  })();

  console.log(`Pronto: ${resultado.folhas} folha(s), ${resultado.pensamentos} pensamento(s) indexados.`);
}

main();
