import { getDb } from "./db/client.ts";
import { buscarUltimaFolhaPublicada } from "./content/repo.ts";
import { renderizarPaginaFolha } from "./pages/folha.ts";

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
    "/folha/:slug": (req) => renderizarPaginaFolha(req.params.slug),
    "/public/estilo.css": new Response(Bun.file("src/public/estilo.css"), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    }),
  },
  fetch() {
    return new Response("Não encontrado", { status: 404 });
  },
});

console.log(`O Caderno rodando em ${server.url}`);
