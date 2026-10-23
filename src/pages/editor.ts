// Página de redigir — escondida, só por link (sem autenticação ainda, ver
// RNF-10 em docs/REQUISITOS.md). Form com blocos de ajuda, preview ao vivo
// (reaproveita o mesmo pipeline de markdown da Folha de verdade) e
// autosave em localStorage — ver src/public/editor.js pro lado cliente.

import type { CardFinal } from "../content/types.ts";
import { buscarProximoNumero, gravarFolha, reindexar, type RascunhoFolha } from "../content/escritor.ts";
import { layout } from "../render/layout.ts";
import { renderizarCorpo } from "../render/markdown.ts";

export function renderizarPaginaEditor(): Response {
  const proximoNumero = buscarProximoNumero();
  const hoje = new Date().toISOString().slice(0, 10);

  const corpoPagina = `<div class="editor">
    <header class="editor__cabecalho">
      <h1 class="headline-lg">Redigir nova folha</h1>
      <p class="label-md">Será a Folha Nº ${proximoNumero}</p>
    </header>

    <p class="editor__aviso-rascunho label-sm" id="editor-aviso-rascunho" hidden>
      Rascunho restaurado do seu navegador. <button type="button" id="editor-descartar">Descartar e começar do zero</button>
    </p>

    <div class="editor__layout">
      <div class="editor__coluna-form">
        <section class="editor__bloco">
          <label class="editor__campo">
            <span class="label-md">Título</span>
            <input type="text" id="campo-titulo" placeholder="Título da folha" required />
          </label>
          <label class="editor__campo">
            <span class="label-md">Subtítulo</span>
            <input type="text" id="campo-subtitulo" placeholder="Lede em itálico (opcional)" />
          </label>
          <div class="editor__linha">
            <label class="editor__campo">
              <span class="label-md">Data</span>
              <input type="date" id="campo-data" value="${hoje}" />
            </label>
            <label class="editor__campo">
              <span class="label-md">Hora</span>
              <input type="text" id="campo-hora" placeholder="14:30" />
            </label>
          </div>
          <div class="editor__linha">
            <label class="editor__campo">
              <span class="label-md">Categoria</span>
              <input type="text" id="campo-categoria" placeholder="reflexoes" />
            </label>
            <label class="editor__campo">
              <span class="label-md">Tags</span>
              <input type="text" id="campo-tags" placeholder="vida, rotina" />
            </label>
          </div>
          <label class="editor__campo">
            <span class="label-md">Resumo</span>
            <textarea id="campo-resumo" rows="2" placeholder="Excerpt do Arquivo/RSS — se deixar em branco, deriva do corpo"></textarea>
          </label>
          <div class="editor__checkboxes">
            <label><input type="checkbox" id="campo-rascunho" /> Salvar como rascunho (não publica)</label>
            <label><input type="checkbox" id="campo-permite-comentarios" checked /> Permite comentários</label>
            <label><input type="checkbox" id="campo-destaque" /> Destaque (Edições Marcantes)</label>
          </div>
        </section>

        <section class="editor__bloco">
          <div class="editor__bloco-cabecalho">
            <span class="label-md">Cards finais</span>
            <button type="button" id="editor-add-card" class="editor__botao-secundario">+ Adicionar card</button>
          </div>
          <div id="editor-cards-lista"></div>
        </section>

        <section class="editor__bloco">
          <span class="label-md">Corpo (markdown)</span>
          <div class="editor__blocos" aria-label="Inserir bloco">
            <button type="button" data-bloco="secao">+ Seção</button>
            <button type="button" data-bloco="secao-oculta">+ Seção oculta</button>
            <button type="button" data-bloco="citacao">+ Citação</button>
            <button type="button" data-bloco="nota">+ Nota</button>
            <button type="button" data-bloco="nota-italico">+ Nota (itálico)</button>
            <button type="button" data-bloco="lista">+ Lista com título</button>
            <button type="button" data-bloco="imagem">+ Imagem com legenda</button>
          </div>
          <textarea id="campo-corpo" class="editor__textarea-corpo" rows="20" placeholder="## Primeira seção

Escreva aqui..."></textarea>
        </section>

        <div class="editor__publicar">
          <span class="label-sm" id="editor-status-publicar"></span>
          <button type="button" id="editor-publicar" class="editor__botao-principal">Salvar e Publicar</button>
        </div>
      </div>

      <aside class="editor__preview">
        <span class="label-md">Preview</span>
        <div class="editor__preview-folha">
          <h1 class="display-lg" id="preview-titulo"></h1>
          <p class="folha__subtitulo quote-lg" id="preview-subtitulo" hidden></p>
          <div class="prose body-lg" id="preview-corpo"></div>
        </div>
      </aside>
    </div>
  </div>`;

  const paginaHtml = layout({ titulo: "Redigir", corpo: corpoPagina, scripts: ["/public/editor.js"] });
  return new Response(paginaHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function responderPreview(req: Request): Promise<Response> {
  const dados = (await req.json()) as { corpo?: string };
  const corpo = dados.corpo ?? "";
  const { html } = renderizarCorpo(corpo);
  return Response.json({ html });
}

interface PayloadPublicar {
  titulo?: string;
  subtitulo?: string;
  data?: string;
  hora?: string;
  categoria?: string;
  tags?: string;
  resumo?: string;
  rascunho?: boolean;
  permiteComentarios?: boolean;
  destaque?: boolean;
  cardsFinais?: CardFinal[];
  corpo?: string;
}

export async function responderPublicar(req: Request): Promise<Response> {
  const payload = (await req.json()) as PayloadPublicar;

  if (!payload.titulo?.trim()) {
    return Response.json({ erro: "Título é obrigatório." }, { status: 400 });
  }
  if (!payload.corpo?.trim()) {
    return Response.json({ erro: "O corpo da folha está vazio." }, { status: 400 });
  }

  const rascunho: RascunhoFolha = {
    titulo: payload.titulo.trim(),
    subtitulo: payload.subtitulo?.trim() || undefined,
    data: payload.data?.trim() || new Date().toISOString().slice(0, 10),
    hora: payload.hora?.trim() || undefined,
    categoria: payload.categoria?.trim() || undefined,
    tags: payload.tags
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    resumo: payload.resumo?.trim() || undefined,
    rascunho: Boolean(payload.rascunho),
    permiteComentarios: payload.permiteComentarios !== false,
    destaque: Boolean(payload.destaque),
    cardsFinais: payload.cardsFinais?.filter((c) => c.tipo?.trim() && c.nome?.trim()),
    corpo: payload.corpo,
  };

  try {
    const resultado = gravarFolha(rascunho);
    await reindexar();
    return Response.json({ slug: resultado.slug, numero: resultado.numero });
  } catch (erro) {
    console.error("Falha ao publicar folha:", erro);
    return Response.json({ erro: "Falha ao gravar/reindexar — ver logs do servidor." }, { status: 500 });
  }
}
