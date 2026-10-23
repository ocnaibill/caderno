import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { layout } from "../render/layout.ts";
import { renderizarCorpo } from "../render/markdown.ts";

const CAMINHO = resolve(import.meta.dir, "../../content/paginas/eu.md");

export function renderizarPaginaEu(): Response {
  const markdown = readFileSync(CAMINHO, "utf-8");
  const { html } = renderizarCorpo(markdown);

  const corpoPagina = `<article class="pagina">
    <div class="pagina__leitura prose body-lg">
      ${html}
    </div>
  </article>`;

  const paginaHtml = layout({
    titulo: "Eu",
    descricao: "Sobre quem escreve O Caderno.",
    corpo: corpoPagina,
    ativo: "eu",
    caminho: "/eu",
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
