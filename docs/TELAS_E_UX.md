# Telas — O Caderno

Leitura das 3 telas desenhadas no Figma ([link](https://www.figma.com/design/PqIYoRq0vhXO6RHb87Bmft/Caderno)), em 22/10/2026. Serve de referência entre o design e os [requisitos](REQUISITOS.md)/[regras de negócio](REGRAS_DE_NEGOCIO.md).

Navegação comum ao topo em todas as telas: `Folha de Hoje` · `Arquivo` · `Eu` · `Assinar`, com a data/hora atual (ex. "24 de novembro de 2026 — 16h45 BRT") logo abaixo do nome do site no masthead.

## 1. Folha (leitura de uma edição)

A tela principal — onde se lê uma folha publicada.

- **Barra de metadados** (ao lado da sidebar, não acima dela): `FOLHA Nº 42 — DOMINGO, 12 DE OUTUBRO` em mono maiúsculo, mais a categoria como uma tag clicável (ex. `DESENVOLVIMENTO/IDEIAS/HOBBY`, formatada como caminho de diretório) que leva ao Arquivo filtrado por aquela categoria.
- **Controles do leitor** (topo direito): alternância Serif/Mono (tipografia), Aa/Aa+ (tamanho de texto), claro/escuro (atmosfera de cor), imprimir.
- **Sidebar esquerda** (sticky):
  - *Anotações à margem*: zero, uma ou várias por folha — cada uma com numeração própria e **global** (o contador de "Pensamentos #N" não é o mesmo do número da folha).
  - *Seções desta folha*: índice ancorado nos H2 do corpo (ex. "01 Porque eu fiz isso", "02 A construção no Figma"...).
- **Título + subtítulo**: H1 grande seguido de uma linha de subtítulo (itálico, mais leve) — ex. "Gostei da ideia de ter algum lugar para anotar tudo que penso, e assim, acabar registrando o que faço. Vamos ver até aonde isso vai." Depois vem a autoria (avatar, nome, localização, horário de escrita) e 3 ações: curtir (coração), compartilhar e baixar.
- **Corpo**: parágrafos, imagem com legenda, *pull quote* (citação em destaque saindo da coluna), caixa de "nota textual" destacada, listas numeradas estilo inventário (`01`, `02`...), fecho em itálico.
- **Rodapé da folha**:
  - Cards de recomendação com título e conteúdo **totalmente livres**, em quantidade variável (0 a N por folha) — layout responsivo à quantidade.
  - Caixa de comentário ("Vem, dê pitaco."): nome opcional + texto livre + botão "Enviar ao Diário" — sempre tratado como anônimo publicamente, sem checkbox de identidade.
  - Navegação entre edições: link para a folha anterior e para o Arquivo completo.
- **Rodapé do site** (comum a todas as telas): bio curta, formulário de assinatura por e-mail, links de colofão (RSS, outros trabalhos, acessibilidade), handle social.

## 2. Arquivo (índice de todas as folhas)

- Cabeçalho com descrição ("Todos os ensaios... desde 2023") e 3 cartões de estatística: total publicado, cadência, tempo total de leitura — **marcados como decorativos por enquanto** (ver [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md)).
- Filtros por categoria (abas) + busca por termo.
- Listagem agrupada por **ano → mês**, cada grupo com contagem de publicações; cada item mostra número, data, categoria (tag), tempo de leitura, título, excerpt (`resumo`) e link "Ler caderno completo".
- Anos anteriores colapsam num bloco de "Tomo" (ex. "Cadernos de 2023 → Acessar Tomo 2023").
- Sidebar direita: "Edições Marcantes" (destaques manuais do autor via `destaque: true`, com contagem real de "leituras salvas" — ver [ARQUITETURA.md](ARQUITETURA.md#curtir-e-salvar-primeiro-exemplo-real-de-interatividade-pontual)) e "Índice Temático" (tags com contagem, link filtra o Arquivo).

## 3. Assinar Newsletter

- Sidebar esquerda: "Compromisso Editorial" (texto sobre a falta de compromisso de frequência), "Sem Algoritmo" (sem publicidade/patrocínio), "Arquivo Recente" (3 links rápidos, dados reais).
- Card central: escolha de **formato de e-mail** (Texto Puro vs Edição Editorial) + campo de e-mail + botão de assinatura + aviso "100% gratuito, cancele com um clique".
- **"Amostra da Caixa de Entrada"**: preview fiel de como o e-mail chega, alternando sem reload conforme o formato escolhido — reusa a folha publicada mais recente de verdade (`src/email/render.ts`), nada de lorem ipsum.
- FAQ curto + link para Política de Privacidade — ainda não implementado.

> Estatísticas de "leitores" e "países" aparecem no design (Arquivo e Assinar), mas foram marcadas pelo Bianco como **puramente decorativas nesta fase** — não viram requisito de analytics agora. Ver [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md#rn-sobre-métricas). Os depoimentos de assinantes ("Comentários de quem já recebe") também ficaram de fora por enquanto — eram pessoas inventadas no protótipo, e o Bianco preferiu não fabricar depoimentos falsos; a seção volta quando houver depoimentos reais.
