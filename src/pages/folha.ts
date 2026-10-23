import { readFileSync } from "node:fs";
import { iniciais, site } from "../config.ts";
import { buscarAdjacentes, buscarFolhaPorSlug, buscarPensamentosDaFolha } from "../content/repo.ts";
import { formatarCategoria } from "../render/categoria.ts";
import { escapeHtml } from "../render/html.ts";
import { layout } from "../render/layout.ts";
import { renderizarCorpo } from "../render/markdown.ts";
import { calcularTempoLeitura } from "../render/tempo-leitura.ts";

function formatarData(dataIso: string): string {
  const data = new Date(`${dataIso}T00:00:00`);
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function renderizarControlesLeitor(): string {
  return `<div class="controles-leitor" aria-label="Preferências de leitura">
    <div class="controle-grupo">
      <button type="button" class="controle-btn" data-fonte="serif">Serif</button>
      <button type="button" class="controle-btn" data-fonte="mono">Mono</button>
    </div>
    <div class="controle-grupo">
      <button type="button" class="controle-btn" data-tamanho="normal">Aa</button>
      <button type="button" class="controle-btn" data-tamanho="grande">Aa+</button>
    </div>
    <div class="controle-grupo controle-grupo--tons">
      <button type="button" class="controle-tom" style="background:#FCF9F3" data-tema="eggshell" aria-label="Tom papel"><span class="controle-tom__ponto"></span></button>
      <button type="button" class="controle-tom" style="background:#F3ECE1" data-tema="sepia" aria-label="Tom sépia"><span class="controle-tom__ponto"></span></button>
      <button type="button" class="controle-tom" style="background:#201D1A" data-tema="escuro" aria-label="Tom noturno"><span class="controle-tom__ponto"></span></button>
    </div>
    <button type="button" class="controle-icone" onclick="window.print()" aria-label="Imprimir">
      <span class="material-symbols-outlined">print</span>
    </button>
  </div>`;
}

export function renderizarPaginaFolha(slug: string): Response {
  const resultado = buscarFolhaPorSlug(slug);
  if (!resultado) {
    return new Response("Folha não encontrada.", { status: 404 });
  }

  const { post, folha } = resultado;
  const { frontmatter, corpo } = folha;
  const { html: corpoHtml, secoes } = renderizarCorpo(corpo);
  const tempoLeitura = calcularTempoLeitura(corpo);
  const pensamentos = buscarPensamentosDaFolha(post.id);
  const { anterior, proxima } = buscarAdjacentes(post.numero);

  const htmlSecoes = secoes.length
    ? `<nav class="indice-secoes" aria-label="Seções desta folha">
        <h2 class="label-md">Seções desta folha</h2>
        <ol>
          ${secoes
            .map(
              (s, i) =>
                `<li><a href="#${s.id}"><span class="indice-secoes__numero">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(s.texto)}</a></li>`,
            )
            .join("\n")}
        </ol>
      </nav>`
    : "";

  const htmlPensamentos = pensamentos
    .map(
      (p) => `<aside class="anotacao-margem">
        <h2 class="label-md">Anotações à margem</h2>
        <p class="quote-corpo">"${escapeHtml(p.corpo)}"</p>
        <span class="label-sm">✎ Pensamentos #${p.numero}</span>
      </aside>`,
    )
    .join("\n");

  const htmlRecomendacoes = frontmatter.cards_finais?.length
    ? `<section class="recomendacoes" aria-label="Recomendações">
        <h2 class="recomendacoes__titulo label-md">
          <span class="material-symbols-outlined">menu_book</span>
          Glosas Marginais &amp; Livros Citados
        </h2>
        <div class="recomendacoes__grade">
          ${frontmatter.cards_finais
            .map(
              (c, i) => `<article class="recomendacao">
                <span class="recomendacao__ref">Ref. ${String(i + 1).padStart(2, "0")} — ${escapeHtml(c.tipo)}</span>
                <h3 class="recomendacao__nome">${escapeHtml(c.nome)}</h3>
                <p class="recomendacao__corpo">${escapeHtml(c.corpo)}</p>
              </article>`,
            )
            .join("\n")}
        </div>
      </section>`
    : "";

  const cardAnterior = anterior
    ? `<a class="navegacao-edicoes__card" href="/folha/${anterior.slug}">
        <span class="material-symbols-outlined">arrow_back</span>
        <span class="navegacao-edicoes__texto">
          <span class="label-sm">Edição anterior</span>
          <span class="navegacao-edicoes__titulo">Caderno Nº ${anterior.numero} — ${escapeHtml(anterior.titulo)}</span>
        </span>
      </a>`
    : "";

  const cardProxima = proxima
    ? `<a class="navegacao-edicoes__card navegacao-edicoes__card--direita" href="/folha/${proxima.slug}">
        <span class="material-symbols-outlined">arrow_forward</span>
        <span class="navegacao-edicoes__texto">
          <span class="label-sm">Próxima edição</span>
          <span class="navegacao-edicoes__titulo">Caderno Nº ${proxima.numero} — ${escapeHtml(proxima.titulo)}</span>
        </span>
      </a>`
    : `<a class="navegacao-edicoes__card navegacao-edicoes__card--direita" href="/arquivo">
        <span class="material-symbols-outlined">arrow_forward</span>
        <span class="navegacao-edicoes__texto">
          <span class="label-sm">Explorar arquivo</span>
          <span class="navegacao-edicoes__titulo">Todas as outras folhas desse caderno</span>
        </span>
      </a>`;

  const htmlNavegacao = `<nav class="navegacao-edicoes">${cardAnterior}${cardProxima}</nav>`;

  const htmlComentario = `<section class="comentario" aria-label="Comentar">
    <span class="label-md">Las Cartas</span>
    <h2 class="comentario__titulo headline-sm">Vem, dê pitaco.</h2>
    <p class="comentario__descricao body-sm">
      O caderno pode até ser meu, e conter as minhas loucuras. Mas isso não significa que você não possa fazer algo além de dar palco pra maluco. Me diz o que tem pra dizer, e aí podemos deixar aqui junto das mil anotações.
    </p>
    <form class="comentario__form" method="post" action="/folha/${folha.slug}/comentarios">
      <input type="text" name="nome" placeholder="Seu nome (opcional)" />
      <textarea name="corpo" placeholder="Escreva aqui sua observação sem pressa..." rows="3" required></textarea>
      <div class="comentario__rodape">
        <span class="comentario__aviso"><span class="material-symbols-outlined">lock</span> Envio anônimo e sem indexadores públicos</span>
        <button type="submit">Enviar ao Diário <span class="material-symbols-outlined">send</span></button>
      </div>
    </form>
  </section>`;

  const corpoPagina = `<article class="folha" data-tema="eggshell">
    <div class="folha__layout">
      <aside class="folha__sidebar" data-fonte="serif" data-tamanho="normal">
        ${htmlPensamentos}
        ${htmlSecoes}
      </aside>

      <div class="folha__coluna">
        <div class="folha__meta">
          <div class="folha__meta-info">
            <span class="folha__meta-texto">FOLHA Nº ${post.numero} — ${formatarData(frontmatter.data).toUpperCase()}</span>
            ${
              frontmatter.categoria
                ? `<a class="tag-categoria" href="/arquivo?categoria=${encodeURIComponent(frontmatter.categoria)}">${escapeHtml(formatarCategoria(frontmatter.categoria))}</a>`
                : ""
            }
          </div>
          ${renderizarControlesLeitor()}
        </div>

        <div class="folha__leitura" data-fonte="serif" data-tamanho="normal">
        <h1 class="display-lg">${escapeHtml(frontmatter.titulo)}</h1>
        ${frontmatter.subtitulo ? `<p class="folha__subtitulo quote-lg">${escapeHtml(frontmatter.subtitulo)}</p>` : ""}

        <div class="autoria">
          <div class="autoria__pessoa">
            <div class="autoria__avatar" aria-hidden="true">${
              site.autor.foto
                ? `<img src="${escapeHtml(site.autor.foto)}" alt="" />`
                : iniciais(site.autor.nome)
            }</div>
            <div class="autoria__texto">
              <strong class="autoria__nome">${escapeHtml(site.autor.handle)} · ${escapeHtml(site.autor.nome)}</strong>
              <span class="autoria__meta">${escapeHtml(site.autor.localizacao)}${frontmatter.hora ? ` · Escrito às ${escapeHtml(frontmatter.hora)}` : ""} · ${tempoLeitura} min de leitura</span>
            </div>
          </div>
          <div class="autoria__acoes">
            <button type="button" data-acao="curtir" data-slug="${folha.slug}" aria-label="Curtir"><span class="material-symbols-outlined">favorite</span></button>
            <button type="button" data-acao="compartilhar" data-url="${escapeHtml(`${site.url}/folha/${folha.slug}`)}" data-titulo="${escapeHtml(frontmatter.titulo)}" aria-label="Compartilhar"><span class="material-symbols-outlined">ios_share</span></button>
            <div class="acao-menu">
              <button type="button" class="acao-menu__btn" data-menu="baixar" aria-label="Baixar" aria-haspopup="true" aria-expanded="false"><span class="material-symbols-outlined">download</span></button>
              <div class="acao-menu__lista" hidden>
                <a href="/folha/${folha.slug}/baixar.md" download>Baixar .md</a>
                <button type="button" data-acao="imprimir-pdf">Salvar como PDF</button>
              </div>
            </div>
          </div>
        </div>

        <div class="prose body-lg">
          ${corpoHtml}
        </div>

        ${htmlRecomendacoes}
        ${htmlNavegacao}
        </div>
        <script>
          (function () {
            // Só fonte/tamanho são persistidos (seguem o leitor de folha em
            // folha); tema é de propósito só desta visita, sem localStorage.
            try {
              var alvos = [".folha__leitura", ".folha__sidebar"]
                .map(function (s) { return document.querySelector(s); })
                .filter(Boolean);
              ["fonte", "tamanho"].forEach(function (grupo) {
                var valor = localStorage.getItem("caderno:" + grupo);
                if (!valor) return;
                alvos.forEach(function (el) { el.setAttribute("data-" + grupo, valor); });
              });
            } catch (e) {
              /* localStorage indisponível — fica na preferência padrão. */
            }
          })();
        </script>

        ${htmlComentario}
      </div>
    </div>
  </article>`;

  const paginaHtml = layout({
    titulo: frontmatter.titulo,
    descricao: frontmatter.resumo,
    corpo: corpoPagina,
    ativo: "folha",
    caminho: `/folha/${folha.slug}`,
    tipoOg: "article",
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export function responderBaixarMarkdown(slug: string): Response {
  const resultado = buscarFolhaPorSlug(slug);
  if (!resultado) {
    return new Response("Folha não encontrada.", { status: 404 });
  }

  const { folha } = resultado;
  const bruto = readFileSync(folha.caminhoArquivo, "utf-8");

  return new Response(bruto, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${folha.slug}.md"`,
    },
  });
}
