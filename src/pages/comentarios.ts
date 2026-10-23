import type { Server } from "bun";
import {
  buscarComentariosPendentes,
  criarComentario,
  moderarComentario,
} from "../content/repo.ts";
import { escapeHtml } from "../render/html.ts";
import { layout } from "../render/layout.ts";

/** RF-14: recebe o formulário de comentário da Folha ("Vem, dê pitaco."). */
export async function responderComentario(
  req: Request,
  server: Server<undefined>,
  slug: string,
): Promise<Response> {
  const dados = await req.formData();

  // Honeypot: campo escondido via CSS que só um bot preencheria. Se vier
  // preenchido, finge sucesso (não entrega sinal pro bot) mas não grava nada.
  const honeypot = String(dados.get("site") ?? "").trim();
  if (honeypot) {
    return Response.redirect(`/folha/${slug}?comentario=enviado`, 303);
  }

  const corpo = String(dados.get("corpo") ?? "").trim();
  if (!corpo) {
    return Response.redirect(`/folha/${slug}?comentario=erro`, 303);
  }

  const nome = String(dados.get("nome") ?? "").trim() || null;
  const endereco = server.requestIP(req);
  const ipHash = endereco ? String(Bun.hash(endereco.address)) : null;

  criarComentario({ slug, nome, email: null, corpo, ipHash });
  return Response.redirect(`/folha/${slug}?comentario=enviado`, 303);
}

/** Painel de moderação (RN-05) — escondido, sem autenticação ainda (RNF-10). */
export function renderizarModeracao(): Response {
  const pendentes = buscarComentariosPendentes();

  const corpoPagina = `<div class="moderacao">
    <h1 class="headline-lg">Moderação de comentários</h1>
    <p class="body-md">${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}.</p>
    <ul class="moderacao__lista">
      ${
        pendentes.length
          ? pendentes
              .map(
                (c) => `<li class="moderacao__item">
                  <div class="moderacao__meta label-sm">
                    <a href="/folha/${c.post_slug}">Caderno Nº ${c.post_numero} — ${escapeHtml(c.post_titulo)}</a>
                    <span>${escapeHtml(c.nome ?? "Anônimo")} · ${escapeHtml(c.criado_em)}</span>
                  </div>
                  <p class="moderacao__corpo">${escapeHtml(c.corpo)}</p>
                  <div class="moderacao__acoes">
                    <form method="post" action="/comentarios/${c.id}/aprovar"><button type="submit">Aprovar</button></form>
                    <form method="post" action="/comentarios/${c.id}/rejeitar"><button type="submit" class="moderacao__rejeitar">Rejeitar</button></form>
                  </div>
                </li>`,
              )
              .join("\n")
          : `<li class="body-sm">Nada pendente — tudo moderado.</li>`
      }
    </ul>
  </div>`;

  const paginaHtml = layout({ titulo: "Moderação", corpo: corpoPagina });
  return new Response(paginaHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export function responderModeracao(id: number, status: "aprovado" | "rejeitado"): Response {
  moderarComentario(id, status);
  return Response.redirect("/comentarios/moderar", 303);
}
