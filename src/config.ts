// Metadados do site que ainda não têm um lugar natural no modelo de conteúdo
// (não é por folha, nem por pensamento) — fica centralizado aqui por enquanto.
export const site = {
  nome: "O Caderno.",
  // CADERNO_URL no .env sobrescreve isso em produção — o placeholder abaixo
  // (domínio do seu homelab) só vale pra desenvolvimento local.
  url: process.env.CADERNO_URL ?? "https://ocnaibill.dev",
  autor: {
    nome: "Bianco Da Costa Oliveira",
    handle: "@ocnaibill",
    localizacao: "Brasília",
    // Avatar do GitHub — github.com/<usuário>.png redireciona pro arquivo
    // real em avatars.githubusercontent.com. Sem API, sem token, sem cache
    // pra gerenciar: troque o usuário aqui se mudar de conta.
    foto: "https://github.com/ocnaibill.png" as string | undefined,
  },
};

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}
