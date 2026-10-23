# Regras de Negócio — O Caderno

Numeração `RN-nn`, decisões não se reabrem sem necessidade real de mudar. Regras marcadas como **(proposta)** são meu palpite de default sensato, não decisão sua ainda — sinalize se quiser outra coisa.

## Conteúdo

- **RN-01**: O `numero` de uma folha é sequencial e imutável — nunca muda, mesmo que o conteúdo seja editado depois da publicação.
- **RN-02**: Folha com `rascunho: true` não aparece no Arquivo, no RSS, nem é servida por URL pública. **(proposta)** Preview acontece localmente, no próprio ambiente do autor, antes do commit — não existe link de preview público.
- **RN-03**: `titulo` + `subtitulo` são exibidos juntos na página da folha (H1 + lede em itálico); `resumo` é um campo separado, usado só como excerpt no Arquivo, meta description e RSS — nunca aparece na página da folha. **(proposta)** Se `resumo` vier vazio no frontmatter, é derivado automaticamente do início do corpo.
- **RN-08**: Uma folha pode ter várias `tags`, mas só uma `categoria` primária (a que aparece no badge do topo e nos filtros do Arquivo).
- **RN-09**: Anos anteriores ao corrente se agrupam automaticamente num "Tomo" colapsado no Arquivo, por ano civil da `data_publicacao` — sem curadoria manual.

## Comentários

- **RN-04**: Comentário é sempre tratado como anônimo publicamente (sem indexação, sem exigir conta) — não existe toggle de "esconder identidade". `nome` é um campo livre opcional só pra assinar o recado; em branco, aparece como "Anônimo". `email` nunca é exibido, só retido internamente para eventual contato.
- **RN-05**: Comentário entra como `pendente` e só fica público após aprovação manual do autor. Sem CAPTCHA (não é algo que eu consiga implementar) — a defesa contra spam é moderação manual + campo honeypot invisível no formulário.

## Assinatura e e-mail

- **RN-06**: Assinante escolhe o formato (Texto Puro / Edição Editorial) na inscrição e pode trocar depois, via `token_gerenciamento` — sem precisar de login.
- **RN-07**: Cancelamento é self-service: link no rodapé do e-mail, ou respondendo "pausa" ao e-mail (como o próprio mockup da caixa de entrada sugere) — sem precisar de login.
- **RN-10**: O RSS contém só folhas publicadas (`rascunho: false`), ordenadas por `data_publicacao` decrescente.
- **RN-11** **(em aberto)**: O disparo do e-mail de uma nova edição é automático ao publicar, ou uma ação manual separada? Dado que o compromisso editorial do design é "frequência nada estrita, sei lá quando sai o próximo", eu sugiro **disparo manual** (uma ação explícita depois de revisar a folha publicada) para evitar envio acidental de rascunho ainda em polimento.
- **RN-12** **(simplificação temporária)**: Hoje `criarAssinante` já coloca `status = 'ativo'` direto, sem double opt-in — não tem provedor de e-mail configurado ainda pra mandar o link de confirmação. Quando o Resend/Postmark entrar, troca pra `pendente_confirmacao` + e-mail de confirmação, como a proposta original previa.
- **RN-14** **(simplificação temporária)**: Sem e-mail de verdade saindo, o link de "Gerenciar assinatura" (`/assinar/gerenciar?token=`) aparece direto na página de sucesso depois de assinar — é assim que a pessoa descobre o link hoje. Quando o envio de e-mail existir, esse link deve ir embutido no rodapé de toda edição (RF-19), e dá pra parar de expor ele na tela.

## Métricas (RN sobre métricas)

- **RN-13**: Números de leitores e países exibidos no design são **decorativos nesta fase** — não exigem rastreamento real nem dashboard de analytics, ficam ocultos até (se algum dia) virar requisito de verdade. **Atualizado 22/10**: "leituras salvas" saiu dessa lista — virou contador real (tabela `interacoes`), já que o Bianco decidiu que valia a pena dado que o botão de curtir/salvar já existia no design sem função.
