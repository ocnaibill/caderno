// Controles do leitor (Serif/Mono, Aa/Aa+, tom claro/sépia/escuro).
// Escopado só à Folha: os atributos vão em .folha__leitura e
// .folha__sidebar (nunca no <html>), pra não vazar pro resto do site nem
// pras partes de interação da própria folha (ex. o comentário). Um script
// síncrono já embutido logo depois desses elementos (ver src/pages/folha.ts)
// aplica o valor salvo cedo, pra não ter flash — aqui só liga os cliques e
// sincroniza qual botão de cada grupo aparece "ativo".
(() => {
  const ALVOS = [".folha__leitura", ".folha__sidebar"];
  const GRUPOS = [
    { nome: "fonte", chave: "caderno:fonte", classeAtiva: "controle-btn--ativo", padrao: "serif" },
    { nome: "tamanho", chave: "caderno:tamanho", classeAtiva: "controle-btn--ativo", padrao: "normal" },
    { nome: "tema", chave: "caderno:tema", classeAtiva: "controle-tom--ativo", padrao: "eggshell" },
  ];

  const elementosAlvo = ALVOS.map((seletor) => document.querySelector(seletor)).filter(Boolean);
  if (!elementosAlvo.length) return;

  function aplicar(grupo, valor) {
    elementosAlvo.forEach((el) => el.setAttribute(`data-${grupo}`, valor));
  }

  GRUPOS.forEach(({ nome, chave, classeAtiva, padrao }) => {
    const botoes = document.querySelectorAll(`[data-${nome}]`);
    if (!botoes.length) return;

    function sincronizar(valor) {
      botoes.forEach((botao) => {
        botao.classList.toggle(classeAtiva, botao.dataset[nome] === valor);
      });
    }

    sincronizar(elementosAlvo[0].getAttribute(`data-${nome}`) || padrao);

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const valor = botao.dataset[nome];
        try {
          localStorage.setItem(chave, valor);
        } catch {
          // localStorage indisponível — a preferência só vale pra essa visita.
        }
        aplicar(nome, valor);
        sincronizar(valor);
      });
    });
  });
})();
