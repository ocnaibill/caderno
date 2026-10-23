// Envio de verdade via Resend (decisão em ARQUITETURA.md — Resend ou
// Postmark, escolhi Resend pela API HTTP simples, sem precisar de SDK).
// Chamada direta por fetch, sem dependência nova — RNF-02.
//
// Precisa de RESEND_API_KEY e RESEND_FROM no .env (Bun carrega sozinho,
// sem dotenv). Sem isso, enviarEmail lança um erro claro em vez de falhar
// silenciosamente. NUNCA testado de verdade — não tenho uma chave de API
// pra isso. Ver docs/REGRAS_DE_NEGOCIO.md.

export interface EmailParaEnviar {
  para: string;
  assunto: string;
  textoPuro: string;
  html?: string;
}

export class ConfiguracaoEmailAusente extends Error {
  constructor() {
    super(
      "RESEND_API_KEY e/ou RESEND_FROM não configurados no .env — envio de e-mail está desligado.",
    );
    this.name = "ConfiguracaoEmailAusente";
  }
}

export async function enviarEmail(email: EmailParaEnviar): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.RESEND_FROM;

  if (!apiKey || !remetente) {
    throw new ConfiguracaoEmailAusente();
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: email.para,
      subject: email.assunto,
      text: email.textoPuro,
      html: email.html,
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new Error(`Resend recusou o envio (${resposta.status}): ${corpo}`);
  }
}
