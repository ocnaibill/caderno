// Amostras de como uma edição chegaria no e-mail do assinante — usadas só
// como preview na tela Assinar por enquanto. O envio de verdade (RF-16 a
// RF-20) depende de um provedor (Resend/Postmark) ainda não configurado.

import { escapeHtml } from "../render/html.ts";
import { renderizarCorpo } from "../render/markdown.ts";
import type { Folha } from "../content/types.ts";

function paraTextoPuro(corpo: string): string {
  return corpo
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[.*?\]\(.*?(?:".*?")?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

export function renderizarAmostraTextoPuro(folha: Folha, numero: number): string {
  const { frontmatter, corpo } = folha;
  const divisoria = "=".repeat(52);
  const paragrafos = paraTextoPuro(corpo).split(/\n{2,}/).filter(Boolean);
  const corpoResumido = paragrafos.slice(0, 2).join("\n\n");

  return [
    "De: Diário · Caderno Pessoal <caderno@ocnaibill.dev>",
    `Assunto: Edição Nº ${numero} — ${frontmatter.titulo}`,
    "",
    divisoria,
    `CADERNO PESSOAL // EDIÇÃO Nº ${numero}`,
    divisoria,
    "",
    corpoResumido,
    paragrafos.length > 2 ? "\n(...)" : "",
    "",
    "---",
    "",
    `Para ler esta reflexão no navegador: https://ocnaibill.dev/folha/${folha.slug}`,
    'Para suspender o envio a qualquer hora: basta responder "pausa" a este e-mail.',
  ]
    .filter((linha) => linha !== "")
    .join("\n");
}

export function renderizarAmostraEditorial(folha: Folha, numero: number): string {
  const { frontmatter, corpo } = folha;
  const { html } = renderizarCorpo(corpo);
  // Mostra só o começo do corpo na amostra — o e-mail de verdade manda a folha inteira.
  const trecho = html.split("</p>").slice(0, 2).join("</p>") + (html.split("</p>").length > 2 ? "</p>…" : "");

  return `<div class="amostra-editorial">
    <p class="amostra-editorial__rotulo">EDIÇÃO Nº ${numero}</p>
    <h3 class="amostra-editorial__titulo">${escapeHtml(frontmatter.titulo)}</h3>
    ${frontmatter.subtitulo ? `<p class="amostra-editorial__subtitulo">${escapeHtml(frontmatter.subtitulo)}</p>` : ""}
    <div class="amostra-editorial__corpo">${trecho}</div>
  </div>`;
}
