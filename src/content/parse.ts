import matter from "gray-matter";
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import type { Folha, FolhaFrontmatter, Pensamento, PensamentoFrontmatter } from "./types.ts";

// O YAML sem aspas em volta de uma data (ex. `data: 2026-10-22`) é interpretado
// pelo parser como um objeto Date — normalizamos de volta pra "AAAA-MM-DD".
function normalizarData(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor);
}

/** Lê e interpreta a `index.md` de uma folha (page bundle: pasta + index.md + anexos). */
export function parseFolha(caminhoArquivo: string): Folha {
  const bruto = readFileSync(caminhoArquivo, "utf-8");
  const { data, content } = matter(bruto);
  const frontmatter = data as FolhaFrontmatter;

  if (frontmatter.numero == null) {
    throw new Error(`Folha sem "numero" no frontmatter: ${caminhoArquivo}`);
  }
  if (!frontmatter.titulo) {
    throw new Error(`Folha sem "titulo" no frontmatter: ${caminhoArquivo}`);
  }
  if (!frontmatter.data) {
    throw new Error(`Folha sem "data" no frontmatter: ${caminhoArquivo}`);
  }

  // O slug é o nome da pasta que contém o index.md (ex.: "042-vozes-da-cabeca").
  const slug = basename(dirname(caminhoArquivo));
  frontmatter.data = normalizarData(frontmatter.data);

  return { frontmatter, corpo: content.trim(), slug, caminhoArquivo };
}

/** Lê e interpreta um arquivo de pensamento (anotação à margem). */
export function parsePensamento(caminhoArquivo: string): Pensamento {
  const bruto = readFileSync(caminhoArquivo, "utf-8");
  const { data, content } = matter(bruto);
  const frontmatter = data as PensamentoFrontmatter;

  if (frontmatter.numero == null) {
    throw new Error(`Pensamento sem "numero" no frontmatter: ${caminhoArquivo}`);
  }
  if (!frontmatter.data) {
    throw new Error(`Pensamento sem "data" no frontmatter: ${caminhoArquivo}`);
  }
  frontmatter.data = normalizarData(frontmatter.data);

  return { frontmatter, corpo: content.trim(), caminhoArquivo };
}

/** Deriva um resumo a partir do corpo quando o frontmatter não traz um (RN-03). */
export function derivarResumo(corpo: string, tamanho = 160): string {
  const textoLimpo = corpo
    .replace(/^#+\s.*$/gm, "") // remove linhas de heading
    .replace(/[*_`>#]/g, "") // remove marcação markdown simples
    .replace(/\s+/g, " ")
    .trim();

  if (textoLimpo.length <= tamanho) return textoLimpo;
  return `${textoLimpo.slice(0, tamanho).trimEnd()}…`;
}
