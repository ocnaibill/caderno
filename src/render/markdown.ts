import { Marked, type Tokens } from "marked";
import { escapeHtml } from "./html.ts";

export interface Secao {
  id: string;
  texto: string;
}

const MARCADOR_SECAO_OCULTA = /\{oculto\}\s*$/;

// parseInline() do marked já devolve HTML com entidades escapadas — desfaz
// isso pra guardar texto puro em `secoes`, já que quem usa `texto` (o índice
// da folha) escapa de novo na hora de montar o HTML (ver folha.ts).
function desescaparEntidades(texto: string): string {
  return texto
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Renderiza o corpo de uma folha (markdown -> HTML) e, de brinde, extrai os H2
 * como "Seções desta folha" (RF-02), já com o mesmo id usado nos anchors dos H2.
 *
 * Convenções próprias além do markdown padrão:
 * - `## Título {oculto}`: o H2 entra no índice/TOC normalmente, mas o título
 *   não aparece visualmente no corpo (fica só visível a leitores de tela) —
 *   para quem quer estruturar com seções sem forçar um heading visível.
 * - `![legenda](img.jpg "Texto da legenda")`: o atributo title vira uma
 *   <figcaption> centralizada abaixo da imagem.
 * - HTML cru dentro do markdown passa direto (sem sanitização) — decisão de
 *   ARQUITETURA.md: o autor é único e confiável. É assim que embeds e boxes
 *   especiais (`<aside class="nota">`) funcionam sem sintaxe própria.
 */
export function renderizarCorpo(markdown: string): { html: string; secoes: Secao[] } {
  const secoes: Secao[] = [];

  const marked = new Marked({
    renderer: {
      heading(this: { parser: { parseInline(tokens: Tokens.Heading["tokens"]): string } }, { tokens, depth }: Tokens.Heading) {
        const htmlBruto = this.parser.parseInline(tokens);
        const textoPuro = desescaparEntidades(htmlBruto.replace(/<[^>]+>/g, ""));
        const oculto = MARCADOR_SECAO_OCULTA.test(textoPuro.trim());
        const textoLimpo = oculto ? textoPuro.replace(MARCADOR_SECAO_OCULTA, "").trim() : textoPuro;
        const htmlLimpo = oculto
          ? htmlBruto.replace(MARCADOR_SECAO_OCULTA, "").trim()
          : htmlBruto;

        if (depth === 2) {
          const id = slugify(textoLimpo);
          secoes.push({ id, texto: textoLimpo });
          const classe = oculto ? ' class="sr-only"' : "";
          return `<h2 id="${id}"${classe}>${htmlLimpo}</h2>`;
        }
        return `<h${depth}>${htmlLimpo}</h${depth}>`;
      },

      image({ href, title, text }: Tokens.Image) {
        const src = escapeHtml(href ?? "");
        const alt = escapeHtml(text ?? "");
        if (title) {
          return `<figure><img src="${src}" alt="${alt}" /><figcaption>${escapeHtml(title)}</figcaption></figure>`;
        }
        return `<img src="${src}" alt="${alt}" />`;
      },
    },
  });

  const html = marked.parse(markdown, { async: false }) as string;
  return { html, secoes };
}
