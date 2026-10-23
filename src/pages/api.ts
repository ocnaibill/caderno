import { ajustarInteracao, type TipoInteracao } from "../content/repo.ts";

const TIPOS_VALIDOS: TipoInteracao[] = ["curtida", "salvo"];

function ehTipoValido(valor: unknown): valor is TipoInteracao {
  return typeof valor === "string" && (TIPOS_VALIDOS as string[]).includes(valor);
}

/** POST /folha/:slug/interacao — incrementa/decrementa curtida ou salvo. */
export async function responderInteracao(req: Request, slug: string): Promise<Response> {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { tipo, delta } = (corpo ?? {}) as { tipo?: unknown; delta?: unknown };

  if (!ehTipoValido(tipo)) {
    return Response.json({ erro: "tipo precisa ser 'curtida' ou 'salvo'." }, { status: 400 });
  }
  if (delta !== 1 && delta !== -1) {
    return Response.json({ erro: "delta precisa ser 1 ou -1." }, { status: 400 });
  }

  const resultado = ajustarInteracao(slug, tipo, delta);
  if (!resultado) {
    return Response.json({ erro: "Folha não encontrada." }, { status: 404 });
  }

  return Response.json(resultado);
}
