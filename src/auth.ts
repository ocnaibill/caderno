// Autenticação simples (HTTP Basic) pras rotas administrativas antes do
// deploy no homelab — RNF-10. Falha fechado: sem ADMIN_USER/ADMIN_PASSWORD
// configurados, o painel fica desligado (503) em vez de aberto pra
// qualquer um que souber a URL.

export function verificarAutenticacaoAdmin(req: Request): Response | null {
  const usuario = process.env.ADMIN_USER;
  const senha = process.env.ADMIN_PASSWORD;

  if (!usuario || !senha) {
    return new Response(
      "Painel administrativo desligado — configure ADMIN_USER e ADMIN_PASSWORD no .env.",
      { status: 503 },
    );
  }

  const cabecalho = req.headers.get("authorization");
  if (cabecalho?.startsWith("Basic ")) {
    try {
      const decodificado = atob(cabecalho.slice(6));
      const separador = decodificado.indexOf(":");
      const u = decodificado.slice(0, separador);
      const p = decodificado.slice(separador + 1);
      if (u === usuario && p === senha) return null; // autenticado, segue
    } catch {
      // cabeçalho mal formado — trata como não autenticado abaixo.
    }
  }

  return new Response("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Caderno Admin"' },
  });
}
