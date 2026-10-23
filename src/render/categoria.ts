/** "desenvolvimento-ideias-hobby" -> "DESENVOLVIMENTO/IDEIAS/HOBBY" */
export function formatarCategoria(categoria: string): string {
  return categoria.split("-").join("/").toUpperCase();
}
