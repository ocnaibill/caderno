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
 * - `---` (linha horizontal padrão do markdown) vira o ornamento de
 *   separador de seção (linha—ícone—linha), em vez de um <hr> genérico.
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

      hr() {
        return `<div class="separador-secao" role="separator">
          <span class="separador-secao__linha"></span>
          <svg class="separador-secao__icone" aria-hidden="true" width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.25 14.625C7.65 14.15 7 13.7812 6.3 13.5188C5.6 13.2563 4.875 13.125 4.125 13.125C3.6 13.125 3.08437 13.1938 2.57812 13.3313C2.07188 13.4688 1.5875 13.6625 1.125 13.9125C0.8625 14.05 0.609375 14.0437 0.365625 13.8938C0.121875 13.7438 0 13.525 0 13.2375V4.2C0 4.0625 0.034375 3.93125 0.103125 3.80625C0.171875 3.68125 0.275 3.5875 0.4125 3.525C0.9875 3.225 1.5875 3 2.2125 2.85C2.8375 2.7 3.475 2.625 4.125 2.625C4.85 2.625 5.55938 2.71875 6.25313 2.90625C6.94688 3.09375 7.6125 3.375 8.25 3.75V12.825C8.8875 12.425 9.55625 12.125 10.2563 11.925C10.9563 11.725 11.6625 11.625 12.375 11.625C12.825 11.625 13.2656 11.6625 13.6969 11.7375C14.1281 11.8125 14.5625 11.925 15 12.075V12.075V12.075V3.075C15.1875 3.1375 15.3719 3.20312 15.5531 3.27187C15.7344 3.34062 15.9125 3.425 16.0875 3.525C16.225 3.5875 16.3281 3.68125 16.3969 3.80625C16.4656 3.93125 16.5 4.0625 16.5 4.2V13.2375C16.5 13.525 16.3781 13.7438 16.1344 13.8938C15.8906 14.0437 15.6375 14.05 15.375 13.9125C14.9125 13.6625 14.4281 13.4688 13.9219 13.3313C13.4156 13.1938 12.9 13.125 12.375 13.125C11.625 13.125 10.9 13.2563 10.2 13.5188C9.5 13.7812 8.85 14.15 8.25 14.625V14.625M9.75 10.875V3.75L13.5 0V7.5L9.75 10.875V10.875M6.75 12.0938V4.66875C6.3375 4.49375 5.90937 4.35938 5.46562 4.26562C5.02187 4.17188 4.575 4.125 4.125 4.125C3.6625 4.125 3.2125 4.16875 2.775 4.25625C2.3375 4.34375 1.9125 4.475 1.5 4.65V4.65V4.65V12.0938V12.0938V12.0938C1.9375 11.9312 2.37187 11.8125 2.80312 11.7375C3.23438 11.6625 3.675 11.625 4.125 11.625C4.575 11.625 5.01562 11.6625 5.44688 11.7375C5.87813 11.8125 6.3125 11.9312 6.75 12.0938V12.0938M6.75 12.0938V12.0938V12.0938V12.0938V12.0938V12.0938V12.0938V4.66875V4.66875V4.66875V4.66875V4.66875V4.66875V4.66875V12.0938V12.0938" fill="currentColor"/></svg>
          <span class="separador-secao__linha"></span>
        </div>`;
      },
    },
  });

  const html = marked.parse(markdown, { async: false }) as string;
  return { html, secoes };
}
