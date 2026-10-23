// Metadados do site que ainda não têm um lugar natural no modelo de conteúdo
// (não é por folha, nem por pensamento) — fica centralizado aqui por enquanto.
export const site = {
  nome: "O Caderno.",
  // Assumi o domínio do seu homelab (ocnaibill.dev) como placeholder — troque
  // aqui quando tiver o domínio final do Caderno definido.
  url: "https://ocnaibill.dev",
  autor: {
    nome: "Bianco Da Costa Oliveira",
    handle: "@ocnaibill",
    localizacao: "Brasília",
    // Placeholder até existir uma foto de verdade — troque por site.autor.foto
    // (caminho da imagem) quando tiver uma.
    foto: undefined as string | undefined,
  },
};

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}
