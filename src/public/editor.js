// Página de redigir: blocos de inserção, cards finais dinâmicos, preview
// ao vivo, autosave em localStorage e publicar via fetch.
(() => {
  const CHAVE_RASCUNHO = "caderno:editor:rascunho";

  const campos = {
    titulo: document.getElementById("campo-titulo"),
    subtitulo: document.getElementById("campo-subtitulo"),
    data: document.getElementById("campo-data"),
    hora: document.getElementById("campo-hora"),
    categoria: document.getElementById("campo-categoria"),
    tags: document.getElementById("campo-tags"),
    resumo: document.getElementById("campo-resumo"),
    rascunho: document.getElementById("campo-rascunho"),
    permiteComentarios: document.getElementById("campo-permite-comentarios"),
    destaque: document.getElementById("campo-destaque"),
    corpo: document.getElementById("campo-corpo"),
  };

  if (!campos.titulo) return; // não é a página de redigir

  const listaCards = document.getElementById("editor-cards-lista");
  const previewTitulo = document.getElementById("preview-titulo");
  const previewSubtitulo = document.getElementById("preview-subtitulo");
  const previewCorpo = document.getElementById("preview-corpo");
  const statusPublicar = document.getElementById("editor-status-publicar");

  // --- Cards finais (linhas dinâmicas) ---------------------------------
  function criarLinhaCard(valores) {
    const linha = document.createElement("div");
    linha.className = "editor__card-linha";
    linha.innerHTML = `
      <input type="text" data-campo="tipo" placeholder="Tipo (ex. Leitura Recomendada)" value="${valores?.tipo ?? ""}" />
      <input type="text" data-campo="nome" placeholder="Nome" value="${valores?.nome ?? ""}" />
      <input type="text" data-campo="corpo" placeholder="Descrição" value="${valores?.corpo ?? ""}" />
      <button type="button" class="editor__card-remover" aria-label="Remover">×</button>
    `;
    linha.querySelector(".editor__card-remover").addEventListener("click", () => {
      linha.remove();
      agendarAutosave();
    });
    linha.querySelectorAll("input").forEach((input) => input.addEventListener("input", agendarAutosave));
    return linha;
  }

  document.getElementById("editor-add-card").addEventListener("click", () => {
    listaCards.appendChild(criarLinhaCard());
  });

  function lerCardsFinais() {
    return [...listaCards.querySelectorAll(".editor__card-linha")].map((linha) => ({
      tipo: linha.querySelector('[data-campo="tipo"]').value.trim(),
      nome: linha.querySelector('[data-campo="nome"]').value.trim(),
      corpo: linha.querySelector('[data-campo="corpo"]').value.trim(),
    }));
  }

  // --- Blocos de inserção no corpo -------------------------------------
  const BLOCOS = {
    secao: "\n\n## Título da seção\n\n",
    "secao-oculta": "\n\n## Título da seção {oculto}\n\n",
    citacao: '\n\n> Texto da citação.\n> — Atribuição\n\n',
    nota: '\n\n<aside class="nota">Texto da nota.</aside>\n\n',
    "nota-italico": '\n\n<aside class="nota nota--italico">Texto da nota em itálico.</aside>\n\n',
    lista: "\n\n1. **Título do item**\n\n   Corpo do item.\n\n2. **Título do item**\n\n   Corpo do item.\n\n",
    imagem: '\n\n![Descrição da imagem](caminho.jpg "Legenda da imagem")\n\n',
    separador: "\n\n---\n\n",
  };

  document.querySelectorAll("[data-bloco]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const snippet = BLOCOS[botao.dataset.bloco];
      if (!snippet) return;
      const area = campos.corpo;
      const inicio = area.selectionStart ?? area.value.length;
      const fim = area.selectionEnd ?? area.value.length;
      area.value = area.value.slice(0, inicio) + snippet + area.value.slice(fim);
      area.focus();
      area.selectionStart = area.selectionEnd = inicio + snippet.length;
      agendarAutosave();
      agendarPreview();
    });
  });

  // --- Serialização / autosave ------------------------------------------
  function montarPayload() {
    return {
      titulo: campos.titulo.value,
      subtitulo: campos.subtitulo.value,
      data: campos.data.value,
      hora: campos.hora.value,
      categoria: campos.categoria.value,
      tags: campos.tags.value,
      resumo: campos.resumo.value,
      rascunho: campos.rascunho.checked,
      permiteComentarios: campos.permiteComentarios.checked,
      destaque: campos.destaque.checked,
      cardsFinais: lerCardsFinais(),
      corpo: campos.corpo.value,
    };
  }

  let timerAutosave = null;
  function agendarAutosave() {
    clearTimeout(timerAutosave);
    timerAutosave = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(montarPayload()));
      } catch {
        // localStorage indisponível — sem autosave nesse caso, sem crash.
      }
    }, 400);
  }

  function restaurarRascunho() {
    let salvo;
    try {
      salvo = localStorage.getItem(CHAVE_RASCUNHO);
    } catch {
      return;
    }
    if (!salvo) return;

    let dados;
    try {
      dados = JSON.parse(salvo);
    } catch {
      return;
    }

    campos.titulo.value = dados.titulo ?? "";
    campos.subtitulo.value = dados.subtitulo ?? "";
    if (dados.data) campos.data.value = dados.data;
    campos.hora.value = dados.hora ?? "";
    campos.categoria.value = dados.categoria ?? "";
    campos.tags.value = dados.tags ?? "";
    campos.resumo.value = dados.resumo ?? "";
    campos.rascunho.checked = Boolean(dados.rascunho);
    campos.permiteComentarios.checked = dados.permiteComentarios !== false;
    campos.destaque.checked = Boolean(dados.destaque);
    campos.corpo.value = dados.corpo ?? "";

    (dados.cardsFinais ?? []).forEach((c) => listaCards.appendChild(criarLinhaCard(c)));

    document.getElementById("editor-aviso-rascunho").hidden = false;
    atualizarPreview();
  }

  document.getElementById("editor-descartar").addEventListener("click", () => {
    try {
      localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // sem problema — só não vai ter o que descartar na próxima visita.
    }
    location.reload();
  });

  Object.values(campos).forEach((el) => {
    el.addEventListener("input", () => {
      agendarAutosave();
      agendarPreview();
    });
  });

  // --- Preview ao vivo ----------------------------------------------------
  function atualizarPreviewTextual() {
    previewTitulo.textContent = campos.titulo.value || "Título da folha";
    if (campos.subtitulo.value) {
      previewSubtitulo.hidden = false;
      previewSubtitulo.textContent = campos.subtitulo.value;
    } else {
      previewSubtitulo.hidden = true;
    }
  }

  let timerPreview = null;
  function agendarPreview() {
    clearTimeout(timerPreview);
    timerPreview = setTimeout(atualizarPreview, 400);
  }

  async function atualizarPreview() {
    atualizarPreviewTextual();
    try {
      const resposta = await fetch("/escrever/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpo: campos.corpo.value }),
      });
      const dados = await resposta.json();
      previewCorpo.innerHTML = dados.html ?? "";
    } catch {
      // preview é só conveniência — se falhar, não bloqueia o resto do editor.
    }
  }

  // --- Publicar -------------------------------------------------------
  document.getElementById("editor-publicar").addEventListener("click", async () => {
    statusPublicar.textContent = "Publicando...";
    try {
      const resposta = await fetch("/escrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(montarPayload()),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        statusPublicar.textContent = dados.erro || "Erro ao publicar.";
        return;
      }
      try {
        localStorage.removeItem(CHAVE_RASCUNHO);
      } catch {
        // sem problema.
      }
      location.href = `/folha/${dados.slug}`;
    } catch {
      statusPublicar.textContent = "Falha de rede — tente de novo.";
    }
  });

  restaurarRascunho();
  atualizarPreviewTextual();
})();
