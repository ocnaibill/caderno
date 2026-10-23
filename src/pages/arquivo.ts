import { resolve } from "node:path";
import {
  type ArquivoItem,
  type FiltrosArquivo,
  buscarCategorias,
  buscarDestaques,
  buscarFolhasPublicadas,
  buscarTagsComContagem,
} from "../content/repo.ts";
import { parseFolha } from "../content/parse.ts";
import { formatarCategoria } from "../render/categoria.ts";
import { escapeHtml } from "../render/html.ts";
import { layout } from "../render/layout.ts";
import { calcularTempoLeitura } from "../render/tempo-leitura.ts";

const RAIZ_CONTEUDO = resolve(import.meta.dir, "../../content");
const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

function nomeMes(mesNum: string): string {
  return MESES[Number.parseInt(mesNum, 10) - 1] ?? mesNum;
}

function formatarDataCurta(dataIso: string): string {
  const data = new Date(`${dataIso}T00:00:00`);
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(data);
  return `${data.getDate()} ${mes.charAt(0).toUpperCase() + mes.slice(1)} ${data.getFullYear()}`;
}

function tempoLeituraDoItem(item: ArquivoItem): number {
  const folha = parseFolha(resolve(RAIZ_CONTEUDO, item.caminho_arquivo));
  return calcularTempoLeitura(folha.corpo);
}

function construirLink(filtros: FiltrosArquivo): string {
  const params = new URLSearchParams();
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.tag) params.set("tag", filtros.tag);
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.ano) params.set("ano", filtros.ano);
  const qs = params.toString();
  return qs ? `/arquivo?${qs}` : "/arquivo";
}

function renderizarItem(item: ArquivoItem): string {
  const tempo = tempoLeituraDoItem(item);
  return `<article class="arquivo-item">
    <div class="arquivo-item__meta label-sm">
      <span>Nº ${item.numero} · ${formatarDataCurta(item.data_publicacao)}</span>
      ${item.categoria ? `<a class="tag-categoria" href="${construirLink({ categoria: item.categoria })}">${escapeHtml(formatarCategoria(item.categoria))}</a>` : ""}
      <span>${tempo} min</span>
    </div>
    <h3 class="arquivo-item__titulo"><a href="/folha/${item.slug}">Caderno Nº ${item.numero} — ${escapeHtml(item.titulo)}</a></h3>
    ${item.resumo ? `<p class="arquivo-item__resumo body-sm">${escapeHtml(item.resumo)}</p>` : ""}
    <div class="arquivo-item__rodape">
      <a class="arquivo-item__link" href="/folha/${item.slug}">Ler caderno completo →</a>
      <button type="button" class="arquivo-item__salvar" aria-label="Salvar"><span class="material-symbols-outlined">bookmark</span></button>
    </div>
  </article>`;
}

export function renderizarPaginaArquivo(url: URL): Response {
  const filtros: FiltrosArquivo = {
    categoria: url.searchParams.get("categoria") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    ano: url.searchParams.get("ano") ?? undefined,
  };

  const todosOsItens = buscarFolhasPublicadas({
    categoria: filtros.categoria,
    tag: filtros.tag,
    q: filtros.q,
  });

  const anosDisponiveis = [...new Set(todosOsItens.map((i) => i.data_publicacao.slice(0, 4)))].sort(
    (a, b) => Number(b) - Number(a),
  );
  const anoAtivo = filtros.ano ?? anosDisponiveis[0];
  const itensDoAno = todosOsItens.filter((i) => i.data_publicacao.slice(0, 4) === anoAtivo);
  const outrosAnos = anosDisponiveis.filter((a) => a !== anoAtivo);

  const porMes = new Map<string, ArquivoItem[]>();
  for (const item of itensDoAno) {
    const mes = item.data_publicacao.slice(5, 7);
    if (!porMes.has(mes)) porMes.set(mes, []);
    porMes.get(mes)!.push(item);
  }

  const numeros = itensDoAno.map((i) => i.numero);
  const faixaFolhas = numeros.length ? `FOLHAS ${Math.min(...numeros)}–${Math.max(...numeros)}` : "";

  const htmlMeses = [...porMes.entries()]
    .map(
      ([mes, itens]) => `<section class="arquivo-mes">
        <div class="arquivo-mes__cabecalho">
          <h3 class="label-md">${nomeMes(mes)}</h3>
          <span class="label-sm">${itens.length} ${itens.length === 1 ? "publicação" : "publicações"}</span>
        </div>
        ${itens.map(renderizarItem).join("\n")}
      </section>`,
    )
    .join("\n");

  const htmlTomos = outrosAnos
    .map(
      (ano) => `<a class="arquivo-tomo" href="${construirLink({ ...filtros, ano })}">
        <div>
          <span class="label-sm">Cadernos de ${ano}</span>
          <p class="arquivo-tomo__titulo">Acessar Tomo ${ano}</p>
        </div>
        <span class="material-symbols-outlined">north_east</span>
      </a>`,
    )
    .join("\n");

  const categorias = buscarCategorias();
  const htmlFiltros = `<nav class="arquivo-filtros" aria-label="Filtrar por categoria">
    <a class="arquivo-filtro${!filtros.categoria ? " arquivo-filtro--ativo" : ""}" href="/arquivo">Todos</a>
    ${categorias
      .map(
        (c) =>
          `<a class="arquivo-filtro${filtros.categoria === c.categoria ? " arquivo-filtro--ativo" : ""}" href="${construirLink({ categoria: c.categoria })}">${escapeHtml(formatarCategoria(c.categoria))}</a>`,
      )
      .join("\n")}
  </nav>`;

  const tags = buscarTagsComContagem();
  const htmlIndiceTematico = tags.length
    ? `<section class="arquivo-indice-tematico">
        <h2 class="label-md">Índice Temático</h2>
        <ul>
          ${tags
            .map(
              (t) =>
                `<li><a href="${construirLink({ tag: t.nome })}">${escapeHtml(t.nome)}</a><span class="label-sm">${t.total}</span></li>`,
            )
            .join("\n")}
        </ul>
      </section>`
    : "";

  const destaques = buscarDestaques();
  const htmlDestaques = destaques.length
    ? `<section class="arquivo-destaques">
        <h2 class="label-md">Edições Favoritas</h2>
        <ul>
          ${destaques
            .map(
              (d) =>
                `<li><span class="label-sm">Caderno Nº ${d.numero}</span><a href="/folha/${d.slug}">${escapeHtml(d.titulo)}</a></li>`,
            )
            .join("\n")}
        </ul>
      </section>`
    : "";

  const corpoPagina = `<div class="arquivo">
    <header class="arquivo-header">
      <h1 class="headline-lg">Arquivo</h1>
      <p class="body-md">Todos os ensaios, anotações de campo e cartas publicadas. Organizado para leitura sem pressa, livre de algoritmos e ruído efêmero.</p>
    </header>

    ${htmlFiltros}

    <form class="arquivo-busca" method="get" action="/arquivo">
      ${filtros.categoria ? `<input type="hidden" name="categoria" value="${escapeHtml(filtros.categoria)}" />` : ""}
      <input type="search" name="q" placeholder="Buscar por termo ou ideia..." value="${filtros.q ? escapeHtml(filtros.q) : ""}" />
      <button type="submit" aria-label="Buscar"><span class="material-symbols-outlined">search</span></button>
    </form>

    <div class="arquivo-layout">
      <div class="arquivo-principal">
        ${
          anoAtivo
            ? `<div class="arquivo-ano">
                <h2 class="headline-md">${anoAtivo}</h2>
                ${faixaFolhas ? `<span class="label-sm">${faixaFolhas}</span>` : ""}
              </div>
              ${htmlMeses}`
            : `<p class="body-sm">Nenhuma folha encontrada${filtros.q ? ` para "${escapeHtml(filtros.q)}"` : ""}.</p>`
        }
        ${htmlTomos}
      </div>

      <aside class="arquivo-sidebar">
        ${htmlDestaques}
        ${htmlIndiceTematico}
      </aside>
    </div>
  </div>`;

  const paginaHtml = layout({
    titulo: "Arquivo",
    descricao: "Todas as folhas publicadas d'O Caderno.",
    corpo: corpoPagina,
    ativo: "arquivo",
  });

  return new Response(paginaHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
