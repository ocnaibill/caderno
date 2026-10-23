// Monta e grava uma folha nova no lugar certo (content/folhas/NNN-slug/) a
// partir dos dados vindos da página de redigir (src/pages/editor.ts).
// Fonte da verdade continua sendo o arquivo — isso só escreve ele.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../db/client.ts";
import type { CardFinal } from "./types.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");

export interface RascunhoFolha {
  titulo: string;
  subtitulo?: string;
  data: string;
  hora?: string;
  categoria?: string;
  tags?: string[];
  resumo?: string;
  rascunho: boolean;
  permiteComentarios: boolean;
  destaque: boolean;
  cardsFinais?: CardFinal[];
  corpo: string;
}

export function buscarProximoNumero(): number {
  const db = getDb();
  const linha = db.query<{ max: number | null }, []>("SELECT MAX(numero) as max FROM posts").get();
  return (linha?.max ?? 0) + 1;
}

export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function yamlString(valor: string): string {
  return `"${valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function construirFrontmatter(numero: number, f: RascunhoFolha): string {
  const linhas: string[] = [`numero: ${numero}`, `titulo: ${yamlString(f.titulo)}`];

  if (f.subtitulo) linhas.push(`subtitulo: ${yamlString(f.subtitulo)}`);
  linhas.push(`data: ${f.data}`);
  if (f.hora) linhas.push(`hora: ${yamlString(f.hora)}`);
  if (f.categoria) linhas.push(`categoria: ${f.categoria}`);
  if (f.tags?.length) linhas.push(`tags: [${f.tags.map(yamlString).join(", ")}]`);
  if (f.resumo) linhas.push(`resumo: ${yamlString(f.resumo)}`);
  linhas.push(`rascunho: ${f.rascunho}`);
  linhas.push(`permite_comentarios: ${f.permiteComentarios}`);
  linhas.push(`destaque: ${f.destaque}`);

  if (f.cardsFinais?.length) {
    linhas.push("cards_finais:");
    for (const c of f.cardsFinais) {
      linhas.push(`  - tipo: ${yamlString(c.tipo)}`);
      linhas.push(`    nome: ${yamlString(c.nome)}`);
      linhas.push(`    corpo: ${yamlString(c.corpo)}`);
    }
  }

  return linhas.join("\n");
}

export interface FolhaPublicada {
  numero: number;
  slug: string;
  caminho: string;
}

/** Escreve content/folhas/NNN-slug/index.md. Reindexar é responsabilidade de quem chama. */
export function gravarFolha(dados: RascunhoFolha): FolhaPublicada {
  const numero = buscarProximoNumero();
  const slugBase = gerarSlug(dados.titulo) || `folha-${numero}`;
  const pasta = `${String(numero).padStart(3, "0")}-${slugBase}`;
  const caminhoPasta = resolve(RAIZ_CONTEUDO, "folhas", pasta);
  const caminhoArquivo = resolve(caminhoPasta, "index.md");

  const conteudo = `---\n${construirFrontmatter(numero, dados)}\n---\n\n${dados.corpo.trim()}\n`;

  mkdirSync(caminhoPasta, { recursive: true });
  writeFileSync(caminhoArquivo, conteudo, "utf-8");

  return { numero, slug: pasta, caminho: caminhoArquivo };
}

/** Roda o reindex como subprocesso, pra não precisar refatorar o script existente. */
export async function reindexar(): Promise<void> {
  const processo = Bun.spawn({
    cmd: ["bun", "run", "src/content/reindex.ts"],
    cwd: resolve(import.meta.dir, "../.."),
    stdout: "pipe",
    stderr: "pipe",
  });
  const codigo = await processo.exited;
  if (codigo !== 0) {
    const erro = await new Response(processo.stderr).text();
    throw new Error(`Reindex falhou (código ${codigo}): ${erro}`);
  }
}
