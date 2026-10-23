import { site } from "../config.ts";
import { escapeHtml } from "./html.ts";

type PaginaAtiva = "folha" | "arquivo" | "eu" | "assinar" | undefined;

interface LayoutOpts {
  titulo: string;
  descricao?: string;
  corpo: string;
  ativo?: PaginaAtiva;
}

function linkNav(href: string, label: string, ativo: boolean): string {
  const classe = ativo ? ' class="nav-link nav-link--ativo"' : ' class="nav-link"';
  return `<a${classe} href="${href}">${label}</a>`;
}

function formatarDataHoraAtual(): string {
  const agora = new Date();
  const fusoHorario = "America/Sao_Paulo";
  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: fusoHorario,
  }).format(agora);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: fusoHorario,
  }).format(agora);
  return `${data} — ${hora.replace(":", "h")} BRT`;
}

export function layout({ titulo, descricao, corpo, ativo }: LayoutOpts): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(titulo)} — ${site.nome}</title>
  ${descricao ? `<meta name="description" content="${escapeHtml(descricao)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <link rel="stylesheet" href="/public/estilo.css" />
</head>
<body>
  <header class="masthead">
    <div class="masthead__identidade">
      <a class="masthead__titulo" href="/">${site.nome}</a>
      <span class="masthead__datahora label-sm">${formatarDataHoraAtual()}</span>
    </div>
    <nav class="masthead__nav">
      ${linkNav("/", "Folha de Hoje", ativo === "folha")}
      ${linkNav("/arquivo", "Arquivo", ativo === "arquivo")}
      ${linkNav("/eu", "Eu", ativo === "eu")}
      ${linkNav("/assinar", "Assinar", ativo === "assinar")}
    </nav>
  </header>
  <main>
${corpo}
  </main>
  <footer class="rodape-site">
    <div class="rodape-site__coluna">
      <h3>${site.nome}</h3>
      <p>Parte do meu laboratório que acabei tomando na intenção de escrever sobre cada loucura que acaba passando pela minha mente.</p>
    </div>
    <div class="rodape-site__coluna">
      <h4>Dias de um futuro passado</h4>
      <p>Receba atualizações quando a próxima folha tiver sido escrita.</p>
      <form class="form-assinatura" method="post" action="/assinar">
        <input type="email" name="email" placeholder="seu@email.com" required />
        <button type="submit">Assinar</button>
      </form>
    </div>
    <div class="rodape-site__coluna">
      <h4>Colofão &amp; Navegação</h4>
      <ul>
        <li><a href="/rss.xml">Distribuição via RSS</a></li>
        <li><a href="/eu">Meus outros trabalhos</a></li>
        <li><a href="#">Acessibilidade &amp; Contraste</a></li>
      </ul>
    </div>
  </footer>
  <script src="/public/interacoes.js" defer></script>
</body>
</html>`;
}
