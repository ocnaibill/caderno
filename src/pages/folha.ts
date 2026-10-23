import { site } from "../config.ts";
import { buscarAdjacentes, buscarFolhaPorSlug, buscarPensamentosDaFolha } from "../content/repo.ts";
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

  const htmlCardsFinais = frontmatter.cards_finais?.length
    ? `<section class="cards-finais" aria-label="Recomendações">
        ${frontmatter.cards_finais
          .map(
            (c) => `<article class="card-final">
              <h3 class="label-md">${escapeHtml(c.titulo)}</h3>
              <p class="body-sm">${escapeHtml(c.corpo)}</p>
            </article>`,
          )
          .join("\n")}
      </section>`
    : "";

  const htmlNavegacao = `<nav class="navegacao-edicoes">
    ${
      anterior
        ? `<a class="navegacao-edicoes__link" href="/folha/${anterior.slug}">← Edição anterior<br /><strong>Caderno Nº ${anterior.numero} — ${escapeHtml(anterior.titulo)}</strong></a>`
        : "<span></span>"
    }
    ${
      proxima
        ? `<a class="navegacao-edicoes__link" href="/folha/${proxima.slug}">Próxima edição →<br /><strong>Caderno Nº ${proxima.numero} — ${escapeHtml(proxima.titulo)}</strong></a>`
        : `<a class="navegacao-edicoes__link" href="/arquivo">Todas as outras folhas no Arquivo →</a>`
    }
  </nav>`;

  const corpoPagina = `<article class="folha">
    <div class="folha__meta label-sm">
      <span>Folha Nº ${post.numero} — ${formatarData(frontmatter.data)}${frontmatter.categoria ? ` — ${escapeHtml(frontmatter.categoria)}` : ""}</span>
      <div class="controles-leitor" aria-label="Preferências de leitura">
        <button type="button" data-acao="fonte-serif">Serif</button>
        <button type="button" data-acao="fonte-mono">Mono</button>
        <button type="button" data-acao="texto-menor">Aa</button>
        <button type="button" data-acao="texto-maior">Aa+</button>
        <button type="button" data-acao="imprimir" onclick="window.print()">Imprimir</button>
      </div>
    </div>

    <div class="folha__layout">
      <aside class="folha__sidebar">
        ${htmlPensamentos}
        ${htmlSecoes}
      </aside>

      <div class="folha__coluna">
        <h1 class="display-lg">${escapeHtml(frontmatter.titulo)}</h1>
        ${frontmatter.subtitulo ? `<p class="folha__subtitulo quote-lg">${escapeHtml(frontmatter.subtitulo)}</p>` : ""}

        <div class="autoria">
          <div class="autoria__pessoa">
            <strong>${escapeHtml(site.autor.handle)} · ${escapeHtml(site.autor.nome)}</strong>
            <span class="label-sm">${escapeHtml(site.autor.localizacao)} · ${tempoLeitura} min de leitura</span>
          </div>
          <div class="autoria__acoes">
            <button type="button" data-acao="curtir" aria-label="Curtir">♡</button>
            <button type="button" data-acao="compartilhar" aria-label="Compartilhar">⇗</button>
            <button type="button" data-acao="baixar" aria-label="Baixar">⇩</button>
          </div>
        </div>

        <div class="prose body-lg">
          ${corpoHtml}
        </div>

        ${htmlCardsFinais}
        ${htmlNavegacao}
      </div>
    </div>
  </article>`;

  const paginaHtml = layout({
    titulo: frontmatter.titulo,
    descricao: frontmatter.resumo,
    corpo: corpoPagina,
    ativo: "folha",
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
