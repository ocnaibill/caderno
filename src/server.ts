import { verificarAutenticacaoAdmin } from "./auth.ts";
import { getDb } from "./db/client.ts";
import { buscarUltimaFolhaPublicada } from "./content/repo.ts";
import { responderInteracao } from "./pages/api.ts";
import { renderizarPaginaArquivo } from "./pages/arquivo.ts";
import {
  renderizarPaginaAssinar,
  renderizarPaginaGerenciar,
  responderAssinatura,
  responderCancelamento,
  responderGerenciar,
} from "./pages/assinar.ts";
import {
  renderizarModeracao,
  responderComentario,
  responderModeracao,
} from "./pages/comentarios.ts";
import { responderDisparo } from "./pages/disparo.ts";
import { renderizarPaginaEditor, responderPreview, responderPublicar } from "./pages/editor.ts";
import { renderizarPaginaEu } from "./pages/eu.ts";
import { renderizarPaginaPrivacidade } from "./pages/privacidade.ts";
import { renderizarPaginaFolha, responderBaixarMarkdown } from "./pages/folha.ts";
import { responderRobots, responderRss, responderSitemap } from "./pages/seo.ts";

getDb(); // garante que o banco/schema existem antes de servir qualquer rota

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/": () => {
      const ultima = buscarUltimaFolhaPublicada();
      if (!ultima) {
        return new Response(
          'Nenhuma folha publicada ainda. Rode "bun run reindex" depois de criar uma em content/folhas/.',
        );
      }
      return Response.redirect(`/folha/${ultima.slug}`, 302);
    },
    "/folha/:slug": (req) => renderizarPaginaFolha(req.params.slug, new URL(req.url)),
    "/folha/:slug/baixar.md": (req) => responderBaixarMarkdown(req.params.slug),
    "/folha/:slug/interacao": {
      POST: (req) => responderInteracao(req, req.params.slug),
    },
    "/folha/:slug/disparar": {
      POST: (req) => verificarAutenticacaoAdmin(req) ?? responderDisparo(req.params.slug),
    },
    "/folha/:slug/comentarios": {
      POST: (req, server) => responderComentario(req, server, req.params.slug),
    },
    "/comentarios/moderar": (req) => verificarAutenticacaoAdmin(req) ?? renderizarModeracao(),
    "/comentarios/:id/aprovar": {
      POST: (req) =>
        verificarAutenticacaoAdmin(req) ?? responderModeracao(Number(req.params.id), "aprovado"),
    },
    "/comentarios/:id/rejeitar": {
      POST: (req) =>
        verificarAutenticacaoAdmin(req) ?? responderModeracao(Number(req.params.id), "rejeitado"),
    },
    "/arquivo": (req) => renderizarPaginaArquivo(new URL(req.url)),
    "/assinar": {
      GET: (req) => renderizarPaginaAssinar(new URL(req.url)),
      POST: (req) => responderAssinatura(req),
    },
    "/assinar/cancelar": (req) => responderCancelamento(new URL(req.url)),
    "/assinar/gerenciar": {
      GET: (req) => renderizarPaginaGerenciar(new URL(req.url)),
      POST: (req) => responderGerenciar(req),
    },
    "/eu": () => renderizarPaginaEu(),
    "/privacidade": () => renderizarPaginaPrivacidade(),
    "/escrever": {
      GET: (req) => verificarAutenticacaoAdmin(req) ?? renderizarPaginaEditor(),
      POST: (req) => verificarAutenticacaoAdmin(req) ?? responderPublicar(req),
    },
    "/escrever/preview": {
      POST: (req) => verificarAutenticacaoAdmin(req) ?? responderPreview(req),
    },
    "/saude": () => new Response("ok"),
    "/robots.txt": () => responderRobots(),
    "/sitemap.xml": () => responderSitemap(),
    "/rss.xml": () => responderRss(),
    // ?v=<hash> (ver src/render/layout.ts) muda sozinho quando o conteúdo
    // muda, então dá pra cachear "pra sempre" sem risco de servir algo
    // desatualizado — o oposto do que causou o bug do CSS preso em cache
    // na CDN depois de um deploy.
    "/public/estilo.css": new Response(Bun.file("src/public/estilo.css"), {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/interacoes.js": new Response(Bun.file("src/public/interacoes.js"), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/formato-preview.js": new Response(Bun.file("src/public/formato-preview.js"), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/acoes.js": new Response(Bun.file("src/public/acoes.js"), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/leitor.js": new Response(Bun.file("src/public/leitor.js"), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/editor.js": new Response(Bun.file("src/public/editor.js"), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/github.svg": new Response(Bun.file("src/public/github.svg"), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
    "/public/favicon.svg": new Response(Bun.file("src/public/favicon.svg"), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }),
  },
  fetch() {
    return new Response("Não encontrado", { status: 404 });
  },
});

console.log(`O Caderno rodando em ${server.url}`);
