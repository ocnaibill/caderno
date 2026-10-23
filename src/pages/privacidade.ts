import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { layout } from "../render/layout.ts";
import { renderizarCorpo } from "../render/markdown.ts";

const CAMINHO = resolve(import.meta.dir, "../../content/paginas/privacidade.md");

export function renderizarPaginaPrivacidade(): Response {
  const markdown = readFileSync(CAMINHO, "utf-8");
  const { html } = renderizarCorpo(markdown);

  const corpoPagina = `<article class="pagina">
    <div class="pagina__leitura prose body-lg">
      ${html}
    </div>
  </article>`;

  const paginaHtml = layout({
    titulo: "Política de Privacidade",
    descricao: "O que O Caderno guarda, por que, e o que não faz.",
    corpo: corpoPagina,
    caminho: "/privacidade",
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
