import { Marked, type Tokens } from "marked";

export interface Secao {
  id: string;
  texto: string;
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
 * HTML cru dentro do markdown passa direto (sem sanitização) — decisão de
 * ARQUITETURA.md: o autor é único e confiável, então é assim que embeds
 * (YouTube, etc.) funcionam sem precisar de sintaxe própria.
 */
export function renderizarCorpo(markdown: string): { html: string; secoes: Secao[] } {
  const secoes: Secao[] = [];

  const marked = new Marked({
    renderer: {
      heading(this: { parser: { parseInline(tokens: Tokens.Heading["tokens"]): string } }, { tokens, depth }: Tokens.Heading) {
        const html = this.parser.parseInline(tokens);
        const textoPuro = html.replace(/<[^>]+>/g, "");

        if (depth === 2) {
          const id = slugify(textoPuro);
          secoes.push({ id, texto: textoPuro });
          return `<h2 id="${id}">${html}</h2>`;
        }
        return `<h${depth}>${html}</h${depth}>`;
      },
    },
  });

  const html = marked.parse(markdown, { async: false }) as string;
  return { html, secoes };
}
