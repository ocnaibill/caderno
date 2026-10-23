// Compartilhar (Web Share API com fallback pra copiar o link) e o menu de
// baixar (.md / imprimir como PDF) da Folha.
(() => {
  document.querySelectorAll('[data-acao="compartilhar"]').forEach((botao) => {
    botao.addEventListener("click", async () => {
      const url = botao.dataset.url || location.href;
      const titulo = botao.dataset.titulo || document.title;

      if (navigator.share) {
        try {
          await navigator.share({ title: titulo, url });
        } catch {
          // Usuário cancelou o share nativo — sem problema.
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        botao.classList.add("acao--copiado");
        setTimeout(() => botao.classList.remove("acao--copiado"), 1500);
      } catch {
        // Sem clipboard disponível (contexto não-seguro, por ex.) — sem fallback por enquanto.
      }
    });
  });

  document.querySelectorAll("[data-menu]").forEach((botao) => {
    const lista = botao.nextElementSibling;
    if (!lista) return;
    botao.addEventListener("click", (evento) => {
      evento.stopPropagation();
      const estavaAberto = !lista.hidden;
      lista.hidden = estavaAberto;
      botao.setAttribute("aria-expanded", String(!estavaAberto));
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll("[data-menu]").forEach((botao) => {
      botao.nextElementSibling?.setAttribute("hidden", "");
      botao.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll('[data-acao="imprimir-pdf"]').forEach((botao) => {
    botao.addEventListener("click", () => window.print());
  });
})();
