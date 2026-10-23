// Liga os botões de curtir (Folha) e salvar (Arquivo) a um contador de
// verdade no servidor. Sem conta de leitor: quem já curtiu/salvou fica
// guardado no localStorage do próprio navegador, que é quem decide se o
// próximo clique manda +1 ou -1.
(() => {
  const CHAVE_CURTIDAS = "caderno:curtidas";
  const CHAVE_SALVOS = "caderno:salvos";
  const CLASSE_ATIVA = "acao--ativa";

  function lerConjunto(chave) {
    try {
      const bruto = localStorage.getItem(chave);
      return new Set(bruto ? JSON.parse(bruto) : []);
    } catch {
      return new Set();
    }
  }

  function salvarConjunto(chave, conjunto) {
    try {
      localStorage.setItem(chave, JSON.stringify([...conjunto]));
    } catch {
      // localStorage indisponível (modo privado, por ex.) — segue sem persistir.
    }
  }

  function configurarBotao(botao, chave, tipo) {
    const slug = botao.dataset.slug;
    if (!slug) return;

    const conjunto = lerConjunto(chave);
    const atualizarEstado = () => {
      const ativo = conjunto.has(slug);
      botao.classList.toggle(CLASSE_ATIVA, ativo);
      botao.setAttribute("aria-pressed", String(ativo));
    };
    atualizarEstado();

    botao.addEventListener("click", async () => {
      const estavaAtivo = conjunto.has(slug);
      const delta = estavaAtivo ? -1 : 1;

      estavaAtivo ? conjunto.delete(slug) : conjunto.add(slug);
      salvarConjunto(chave, conjunto);
      atualizarEstado();

      try {
        await fetch(`/folha/${encodeURIComponent(slug)}/interacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, delta }),
        });
      } catch {
        // Offline ou servidor fora — o estado local já foi aplicado; sem retry por enquanto.
      }
    });
  }

  document.querySelectorAll('[data-acao="curtir"]').forEach((botao) => {
    configurarBotao(botao, CHAVE_CURTIDAS, "curtida");
  });
  document.querySelectorAll('[data-acao="salvar"]').forEach((botao) => {
    configurarBotao(botao, CHAVE_SALVOS, "salvo");
  });
})();
