// Amostras (preview na tela Assinar, truncadas) e e-mails completos (envio
// de verdade, ver src/email/provider.ts) — ambos a partir do mesmo
// markdown fonte, como ARQUITETURA.md descreve.

import { site } from "../config.ts";
import { escapeHtml } from "../render/html.ts";
import { renderizarCorpo } from "../render/markdown.ts";
import type { Folha } from "../content/types.ts";

function paraTextoPuro(corpo: string): string {
  return corpo
    .replace(/\s*\{oculto\}\s*$/gm, "") // marcador de seção sem título visível (RF-02)
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

export interface AssinanteParaEmail {
  email: string;
  tokenGerenciamento: string;
}

function rodapeTextoPuro(folha: Folha, assinante: AssinanteParaEmail): string {
  const linkGerenciar = `${site.url}/assinar/gerenciar?token=${assinante.tokenGerenciamento}`;
  const linkCancelar = `${site.url}/assinar/cancelar?token=${assinante.tokenGerenciamento}`;
  return [
    "---",
    "",
    `Para ler esta reflexão no navegador: ${site.url}/folha/${folha.slug}`,
    `Trocar formato ou preferências: ${linkGerenciar}`,
    `Cancelar a qualquer momento: ${linkCancelar}`,
  ].join("\n");
}

/** E-mail completo, formato Texto Puro — usado no disparo de verdade (RF-18/RF-20). */
export function renderizarEmailTextoPuro(
  folha: Folha,
  numero: number,
  assinante: AssinanteParaEmail,
): string {
  const { frontmatter, corpo } = folha;
  const divisoria = "=".repeat(52);
  const corpoCompleto = paraTextoPuro(corpo);

  return [
    divisoria,
    `CADERNO PESSOAL // EDIÇÃO Nº ${numero}`,
    divisoria,
    "",
    frontmatter.subtitulo ?? "",
    "",
    corpoCompleto,
    "",
    rodapeTextoPuro(folha, assinante),
  ]
    .filter((linha) => linha !== "")
    .join("\n");
}

/** E-mail completo, formato Edição Editorial — usado no disparo de verdade (RF-18/RF-20). */
export function renderizarEmailHtml(folha: Folha, numero: number, assinante: AssinanteParaEmail): string {
  const { frontmatter, corpo } = folha;
  const { html } = renderizarCorpo(corpo);
  const linkGerenciar = `${site.url}/assinar/gerenciar?token=${assinante.tokenGerenciamento}`;
  const linkCancelar = `${site.url}/assinar/cancelar?token=${assinante.tokenGerenciamento}`;

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="background:#fcf9f3;color:#1c1c18;font-family:Georgia,serif;padding:24px;">
  <p style="font-family:monospace;font-size:12px;color:#755940;">EDIÇÃO Nº ${numero}</p>
  <h1 style="font-weight:400;">${escapeHtml(frontmatter.titulo)}</h1>
  ${frontmatter.subtitulo ? `<p style="font-style:italic;color:#4d4540;">${escapeHtml(frontmatter.subtitulo)}</p>` : ""}
  <div>${html}</div>
  <hr style="border:none;border-top:1px solid #ebe8e2;margin:32px 0;" />
  <p style="font-size:12px;color:#7e756f;">
    <a href="${escapeHtml(`${site.url}/folha/${folha.slug}`)}">Ler no navegador</a> ·
    <a href="${escapeHtml(linkGerenciar)}">Trocar preferências</a> ·
    <a href="${escapeHtml(linkCancelar)}">Cancelar assinatura</a>
  </p>
</body>
</html>`;
}
