import { resolve } from "node:path";
import {
  type FormatoEmail,
  buscarRecentes,
  buscarUltimaFolhaPublicada,
  cancelarAssinante,
  criarAssinante,
} from "../content/repo.ts";
import { parseFolha } from "../content/parse.ts";
import { renderizarAmostraEditorial, renderizarAmostraTextoPuro } from "../email/render.ts";
import { escapeHtml } from "../render/html.ts";
import { layout } from "../render/layout.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");

function renderizarAmostra(): string {
  const ultima = buscarUltimaFolhaPublicada();
  if (!ultima) {
    return `<section class="amostra-caixa">
      <h2 class="label-md">Amostra da Caixa de Entrada</h2>
      <p class="body-sm">Ainda não há nenhuma folha publicada pra mostrar aqui.</p>
    </section>`;
  }

  const folha = parseFolha(resolve(RAIZ_CONTEUDO, ultima.caminho_arquivo));
  const textoPuro = renderizarAmostraTextoPuro(folha, ultima.numero);
  const editorial = renderizarAmostraEditorial(folha, ultima.numero);

  return `<section class="amostra-caixa">
    <div class="amostra-caixa__cabecalho">
      <h2 class="label-md">Amostra da Caixa de Entrada</h2>
      <span class="label-sm">Modo: <span data-amostra-rotulo>Texto Puro</span></span>
    </div>
    <pre class="amostra-texto-puro" data-amostra="texto_puro">${escapeHtml(textoPuro)}</pre>
    <div class="amostra-editorial-wrap" data-amostra="editorial" hidden>${editorial}</div>
  </section>`;
}

function renderizarMensagem(url: URL): string {
  if (url.searchParams.get("sucesso") === "1") {
    return `<p class="assinar-mensagem assinar-mensagem--sucesso">Pronto — você está na lista. Até a próxima folha.</p>`;
  }
  if (url.searchParams.get("sucesso") === "ja") {
    return `<p class="assinar-mensagem">Esse e-mail já está inscrito — nada pra fazer aqui.</p>`;
  }
  if (url.searchParams.get("erro") === "email") {
    return `<p class="assinar-mensagem assinar-mensagem--erro">Esse e-mail não parece válido — confere e tenta de novo.</p>`;
  }
  return "";
}

export function renderizarPaginaAssinar(url: URL): Response {
  const recentes = buscarRecentes(3);

  const corpoPagina = `<div class="assinar">
    <aside class="assinar-sidebar">
      <section class="assinar-bloco">
        <h2 class="label-md">Compromisso Editorial</h2>
        <p class="body-sm">Eu simplesmente não possuo compromisso, muito menos pontualidade com a postagem e frequência deste meu mequifo. Vai sair quando eu pensar em algo que queira registrar :D</p>
      </section>
      <section class="assinar-bloco">
        <h2 class="label-md"><span class="material-symbols-outlined">block</span> Sem Algoritmo</h2>
        <p class="body-sm">Zero publicidade segmentada, sem banners invasivos e sem patrocinadores ocultos. Apenas a correspondência direta entre autor e leitor.</p>
      </section>
      ${
        recentes.length
          ? `<section class="assinar-bloco">
              <h2 class="label-md">Arquivo Recente</h2>
              <ul class="assinar-recentes">
                ${recentes
                  .map(
                    (r) =>
                      `<li><span class="label-sm">#${String(r.numero).padStart(3, "0")}</span><a href="/folha/${r.slug}">${escapeHtml(r.titulo)}</a></li>`,
                  )
                  .join("\n")}
              </ul>
            </section>`
          : ""
      }
    </aside>

    <div class="assinar-principal">
      <div class="assinar-card">
        <span class="label-md"><span class="material-symbols-outlined">mail</span> Correspondência Semanal</span>
        <h1 class="headline-lg">Receba as próximas folhas!!</h1>
        <p class="body-md">A gente te manda um e-mail avisando quando sair a próxima besteira que eu redigir por aqui.</p>
        <blockquote class="assinar-piada quote-lg">"Poderia ter mandado uma carta eletrônica, se chama e-mail"<cite class="label-sm">— Thor, Odinson</cite></blockquote>

        ${renderizarMensagem(url)}

        <form class="assinar-form" method="post" action="/assinar">
          <label class="assinar-email">
            <span class="material-symbols-outlined">alternate_email</span>
            <input type="email" name="email" placeholder="seu@email.com" required />
          </label>

          <fieldset class="assinar-formato">
            <legend class="label-md">Preferência de Formato</legend>
            <label class="assinar-formato__opcao">
              <input type="radio" name="formato" value="texto_puro" checked />
              <span>
                <strong>Texto Puro</strong>
                <small>Ideal para leitura minimalista, leitores e-ink ou clientes de texto simples.</small>
              </span>
            </label>
            <label class="assinar-formato__opcao">
              <input type="radio" name="formato" value="editorial" />
              <span>
                <strong>Edição Editorial</strong>
                <small>Tipografia Newsreader, notas marginais diagramadas e detalhes em sépia.</small>
              </span>
            </label>
          </fieldset>

          <button type="submit">Receber próxima edição <span class="material-symbols-outlined">arrow_forward</span></button>
          <p class="label-sm assinar-aviso"><span class="material-symbols-outlined">lock</span> 100% gratuito. Cancele com um clique a qualquer momento.</p>
        </form>

        <p class="label-sm assinar-frequencia">Frequência nada estrita: sei lá quando sai o próximo.</p>
      </div>

      ${renderizarAmostra()}
    </div>
  </div>`;

  const paginaHtml = layout({
    titulo: "Assinar",
    descricao: "Assine O Caderno e receba as próximas folhas por e-mail.",
    corpo: corpoPagina,
    ativo: "assinar",
    scripts: ["/public/formato-preview.js"],
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function responderAssinatura(req: Request): Promise<Response> {
  const dados = await req.formData();
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const formatoBruto = String(dados.get("formato") ?? "texto_puro");
  const formato: FormatoEmail = formatoBruto === "editorial" ? "editorial" : "texto_puro";

  if (!EMAIL_REGEX.test(email)) {
    return Response.redirect("/assinar?erro=email", 303);
  }

  const resultado = criarAssinante(email, formato);
  const sucesso = resultado.status === "nova" ? "1" : "ja";
  return Response.redirect(`/assinar?sucesso=${sucesso}`, 303);
}

export function responderCancelamento(url: URL): Response {
  const token = url.searchParams.get("token") ?? "";
  const cancelado = token ? cancelarAssinante(token) : false;

  const corpoPagina = `<div class="assinar">
    <div class="assinar-principal">
      <div class="assinar-card">
        <h1 class="headline-lg">${cancelado ? "Assinatura cancelada" : "Link inválido"}</h1>
        <p class="body-md">${
          cancelado
            ? "Pronto — você não vai mais receber as próximas folhas. Sem ressentimentos."
            : "Esse link de cancelamento não é válido, ou já foi usado antes."
        }</p>
      </div>
    </div>
  </div>`;

  const paginaHtml = layout({
    titulo: "Cancelar assinatura",
    corpo: corpoPagina,
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
