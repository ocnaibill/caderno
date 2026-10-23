import { getDb } from "./db/client.ts";

const db = getDb();

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/": () => {
      const total = db.query<{ total: number }, []>(
        "SELECT COUNT(*) AS total FROM posts WHERE rascunho = 0",
      ).get();
      return new Response(
        `O Caderno — ${total?.total ?? 0} folha(s) publicada(s). Rode "bun run reindex" depois de editar content/.`,
      );
    },
  },
  fetch() {
    return new Response("Não encontrado", { status: 404 });
  },
});

console.log(`O Caderno rodando em ${server.url}`);
