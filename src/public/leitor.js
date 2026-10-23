// Controles do leitor (Serif/Mono, Aa/Aa+, tom claro/sépia/escuro). O
// <html> já chega com os atributos certos (script síncrono no <head>,
// pra não ter flash de tema errado) — aqui só liga os cliques e sincroniza
// qual botão de cada grupo aparece "ativo".
(() => {
  const GRUPOS = [
    { nome: "fonte", chave: "caderno:fonte", classeAtiva: "controle-btn--ativo", padrao: "serif" },
    { nome: "tamanho", chave: "caderno:tamanho", classeAtiva: "controle-btn--ativo", padrao: "normal" },
    { nome: "tema", chave: "caderno:tema", classeAtiva: "controle-tom--ativo", padrao: "eggshell" },
  ];

  GRUPOS.forEach(({ nome, chave, classeAtiva, padrao }) => {
    const botoes = document.querySelectorAll(`[data-${nome}]`);
    if (!botoes.length) return;

    function sincronizar(valor) {
      botoes.forEach((botao) => {
        botao.classList.toggle(classeAtiva, botao.dataset[nome] === valor);
      });
    }

    sincronizar(document.documentElement.getAttribute(`data-${nome}`) || padrao);

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const valor = botao.dataset[nome];
        try {
          localStorage.setItem(chave, valor);
        } catch {
          // localStorage indisponível — a preferência só vale pra essa visita.
        }
        document.documentElement.setAttribute(`data-${nome}`, valor);
        sincronizar(valor);
      });
    });
  });
})();
