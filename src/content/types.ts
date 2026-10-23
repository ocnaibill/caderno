export interface CardFinal {
  tipo: string;
  nome: string;
  corpo: string;
}

export interface FolhaFrontmatter {
  numero: number;
  titulo: string;
  subtitulo?: string;
  data: string;
  hora?: string;
  categoria?: string;
  tags?: string[];
  resumo?: string;
  capa?: string;
  rascunho?: boolean;
  permite_comentarios?: boolean;
  cards_finais?: CardFinal[];
}

export interface Folha {
  frontmatter: FolhaFrontmatter;
  corpo: string;
  slug: string;
  caminhoArquivo: string;
}

export interface PensamentoFrontmatter {
  numero: number;
  data: string;
  folha?: string;
}

export interface Pensamento {
  frontmatter: PensamentoFrontmatter;
  corpo: string;
  caminhoArquivo: string;
}
