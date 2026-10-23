// Disparo manual de uma edição pros assinantes ativos (RN-11: sem
// frequência fixa, então o envio é uma ação explícita, nunca automática ao
// publicar). Rota escondida, sem autenticação — ver docs/REGRAS_DE_NEGOCIO.md
// pra limitação conhecida disso.

import { resolve } from "node:path";
import {
  type FormatoEmail,
  buscarAssinantesAtivos,
  buscarFolhaPorSlug,
  registrarEnvio,
} from "../content/repo.ts";
import { parseFolha } from "../content/parse.ts";
import { renderizarEmailHtml, renderizarEmailTextoPuro } from "../email/render.ts";
import { ConfiguracaoEmailAusente, enviarEmail } from "../email/provider.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");

async function dispararParaFormato(
  slug: string,
  numero: number,
  formato: FormatoEmail,
): Promise<{ enviados: number; falhas: number }> {
  const assinantes = buscarAssinantesAtivos(formato);
  if (!assinantes.length) return { enviados: 0, falhas: 0 };

  const folha = parseFolha(resolve(RAIZ_CONTEUDO, buscarFolhaPorSlug(slug)!.post.caminho_arquivo));

  let enviados = 0;
  let falhas = 0;

  for (const assinante of assinantes) {
    const destinatario = { email: assinante.email, tokenGerenciamento: assinante.token_gerenciamento };
    try {
      if (formato === "editorial") {
        await enviarEmail({
          para: assinante.email,
          assunto: `Edição Nº ${numero} — ${folha.frontmatter.titulo}`,
          textoPuro: renderizarEmailTextoPuro(folha, numero, destinatario),
          html: renderizarEmailHtml(folha, numero, destinatario),
        });
      } else {
        await enviarEmail({
          para: assinante.email,
          assunto: `Edição Nº ${numero} — ${folha.frontmatter.titulo}`,
          textoPuro: renderizarEmailTextoPuro(folha, numero, destinatario),
        });
      }
      enviados++;
    } catch (erro) {
      if (erro instanceof ConfiguracaoEmailAusente) throw erro; // não adianta tentar os próximos
      falhas++;
      console.error(`Falha ao enviar pra ${assinante.email}:`, erro);
    }
  }

  registrarEnvio(slug, formato, enviados);
  return { enviados, falhas };
}

export async function responderDisparo(slug: string): Promise<Response> {
  const resultado = buscarFolhaPorSlug(slug);
  if (!resultado) {
    return Response.json({ erro: "Folha não encontrada (ou é rascunho)." }, { status: 404 });
  }

  try {
    const [textoPuro, editorial] = await Promise.all([
      dispararParaFormato(slug, resultado.post.numero, "texto_puro"),
      dispararParaFormato(slug, resultado.post.numero, "editorial"),
    ]);

    return Response.json({
      folha: slug,
      texto_puro: textoPuro,
      editorial,
    });
  } catch (erro) {
    if (erro instanceof ConfiguracaoEmailAusente) {
      return Response.json({ erro: erro.message }, { status: 503 });
    }
    throw erro;
  }
}
