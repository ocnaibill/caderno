// Alterna a "Amostra da Caixa de Entrada" conforme o formato escolhido no
// formulário de assinatura — sem recarregar a página.
(() => {
  const radios = document.querySelectorAll('input[name="formato"]');
  const amostras = document.querySelectorAll("[data-amostra]");
  const rotulo = document.querySelector("[data-amostra-rotulo]");

  function atualizar(valor) {
    amostras.forEach((el) => {
      el.hidden = el.dataset.amostra !== valor;
    });
    if (rotulo) rotulo.textContent = valor === "editorial" ? "Edição Editorial" : "Texto Puro";
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) atualizar(radio.value);
    });
  });

  const selecionado = [...radios].find((r) => r.checked);
  if (selecionado) atualizar(selecionado.value);
})();
