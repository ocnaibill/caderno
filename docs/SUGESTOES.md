# Sugestões — coisas que o design ainda não cobre

Ideias que combinam com a proposta ("diário contemplativo, sem ruído, sem algoritmo") e com o que você já tem no resto do seu setup. Nenhuma delas é requisito — são só coisas pra considerar, mais ou menos em ordem de esforço.

## Baratas de fazer, alto valor

- **Página de Colofão**: o rodapé já menciona "Colofão & Navegação" — vale uma página dedicada contando a stack (Bun, Markdown, SQLite...), bem a cara de projeto pessoal de dev. Reaproveita o que vamos documentar aqui.
- ~~CSS de impressão caprichado~~ ✅ feito (RF-05).
- ~~`sitemap.xml` e `robots.txt`~~ ✅ feito.
- **Exportar tudo em `.md`**: um endpoint/rota que empacota `content/` num `.zip` — já que o conteúdo é markdown, exportar é quase de graça, e dá uma garantia de "meus dados nunca ficam presos aqui".

## Médio esforço

- **"Nesse dia, X anos atrás"**: resgatar folhas antigas publicadas no mesmo dia/mês em anos anteriores — combina com o tom de diário e de "arquivo vivo", e fica natural assim que o projeto tiver alguns anos de folhas.
- ~~Marcador local (bookmark) sem conta~~ ✅ feito, e melhor do que a ideia original: virou contador real (tabela `interacoes`) em vez de só local.
- **"Copiar como citação"**: selecionar um trecho do corpo e ter uma ação rápida de copiar formatado como pull quote com atribuição (número da folha, link) — barato de implementar e reforça a identidade "citável" que os pull quotes já sugerem no design.
- **Publicar automaticamente em redes na hora do push**: você já usa Mastodon/Bluesky/etc. em outros projetos — um webhook simples no deploy que posta "nova folha no ar" com o link, sem precisar fazer isso manualmente toda vez.

## Mais esforço / avançado

- **Webmentions**: já que você tende pro lado IndieWeb (RSS, domínio próprio), webmentions deixariam respostas de outros blogs aparecerem junto dos comentários — mas é bem mais trabalho de implementar e provavelmente overkill pro escopo "bem mais simples" que você quer agora. Vale só se um dia o projeto crescer.
- **Modo leitura offline (PWA leve)**: cachear as últimas N folhas pra leitura sem internet. Interessante, mas não combina com "projeto simples pra brincar" — eu deixaria pra depois, se é que algum dia.

## Explicitamente fora de escopo (a menos que você peça)

- Analytics real de leitores/países (RN-13 já marcou isso como decorativo).
- Qualquer sistema de conta/login para leitores — tudo (comentário, assinatura, cancelamento) é feito sem autenticação, por design.
- Multi-idioma.
