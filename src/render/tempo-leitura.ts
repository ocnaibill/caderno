const PALAVRAS_POR_MINUTO = 200;

/** Tempo de leitura estimado a partir do corpo em markdown — nunca persistido (RF-03). */
export function calcularTempoLeitura(markdown: string): number {
  const textoPuro = markdown.replace(/<[^>]+>/g, " ").trim();
  const palavras = textoPuro.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}
