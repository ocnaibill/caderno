// Controles do leitor (Serif/Mono, Aa/Aa+, tom claro/sépia/escuro).
//
// Fonte e tamanho são escopados só à PARTE DE LEITURA da Folha
// (.folha__leitura + .folha__sidebar) e persistem no localStorage — seguem
// o leitor de folha em folha. Um script síncrono logo depois desses
// elementos (ver src/pages/folha.ts) já aplica o valor salvo cedo, pra não
// ter flash.
//
// Tema é escopado à Folha INTEIRA (<article class="folha">, inclui o
// comentário) mas, de propósito, NÃO é persistido — ao trocar de página
// volta pro padrão. Por isso não precisa de script síncrono nenhum: toda
// página carrega já no padrão.
(() => {
  const GRUPOS = [
    {
      nome: "fonte",
      chave: "caderno:fonte",
      classeAtiva: "controle-btn--ativo",
      padrao: "serif",
      alvos: [".folha__leitura", ".folha__sidebar"],
      persistir: true,
    },
    {
      nome: "tamanho",
      chave: "caderno:tamanho",
      classeAtiva: "controle-btn--ativo",
      padrao: "normal",
      alvos: [".folha__leitura", ".folha__sidebar"],
      persistir: true,
    },
    {
      nome: "tema",
      chave: "caderno:tema",
      classeAtiva: "controle-tom--ativo",
      padrao: "eggshell",
      alvos: [".folha"],
      persistir: false,
    },
  ];

  GRUPOS.forEach(({ nome, chave, classeAtiva, padrao, alvos, persistir }) => {
    // "button[data-X]", não só "[data-X]": o próprio .folha também carrega
    // data-tema (é o alvo do tom, não um botão) e entraria na lista errado.
    const botoes = document.querySelectorAll(`button[data-${nome}]`);
    if (!botoes.length) return;

    const elementosAlvo = alvos.map((seletor) => document.querySelector(seletor)).filter(Boolean);
    if (!elementosAlvo.length) return;

    function aplicar(valor) {
      elementosAlvo.forEach((el) => el.setAttribute(`data-${nome}`, valor));
    }

    function sincronizar(valor) {
      botoes.forEach((botao) => {
        botao.classList.toggle(classeAtiva, botao.dataset[nome] === valor);
      });
    }

    sincronizar(elementosAlvo[0].getAttribute(`data-${nome}`) || padrao);

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const valor = botao.dataset[nome];
        if (persistir) {
          try {
            localStorage.setItem(chave, valor);
          } catch {
            // localStorage indisponível — a preferência só vale pra essa visita.
          }
        }
        aplicar(valor);
        sincronizar(valor);
      });
    });
  });
})();
