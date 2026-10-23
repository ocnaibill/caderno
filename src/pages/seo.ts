// robots.txt, sitemap.xml e o feed RSS — todos derivados do índice de
// posts publicados, sem nada hardcoded além das páginas estáticas do site.

import { site } from "../config.ts";
import { buscarFolhasPublicadas } from "../content/repo.ts";
import { escapeHtml } from "../render/html.ts";

export function responderRobots(): Response {
  const corpo = ["User-agent: *", "Allow: /", "", `Sitemap: ${site.url}/sitemap.xml`].join("\n");
  return new Response(corpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

const PAGINAS_ESTATICAS = ["/", "/arquivo", "/assinar", "/eu", "/privacidade"];

export function responderSitemap(): Response {
  const itens = buscarFolhasPublicadas();

  const urlsFolhas = itens
    .map(
      (item) => `  <url>
    <loc>${escapeHtml(site.url)}/folha/${item.slug}</loc>
    <lastmod>${item.data_publicacao}</lastmod>
  </url>`,
    )
    .join("\n");

  const urlsEstaticas = PAGINAS_ESTATICAS.map(
    (caminho) => `  <url>\n    <loc>${escapeHtml(site.url)}${caminho}</loc>\n  </url>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsEstaticas}
${urlsFolhas}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function dataRfc822(dataIso: string): string {
  return new Date(`${dataIso}T12:00:00Z`).toUTCString();
}

export function responderRss(): Response {
  const itens = buscarFolhasPublicadas().slice(0, 20); // RN-10: só publicadas, mais recentes primeiro

  const itensXml = itens
    .map((item) => {
      const link = `${site.url}/folha/${item.slug}`;
      return `  <item>
    <title>${escapeHtml(`Caderno Nº ${item.numero} — ${item.titulo}`)}</title>
    <link>${escapeHtml(link)}</link>
    <guid isPermaLink="true">${escapeHtml(link)}</guid>
    <pubDate>${dataRfc822(item.data_publicacao)}</pubDate>
    ${item.resumo ? `<description>${escapeHtml(item.resumo)}</description>` : ""}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeHtml(site.nome)}</title>
  <link>${escapeHtml(site.url)}</link>
  <description>Folhas d'${escapeHtml(site.nome)}, assim que saem.</description>
  <language>pt-BR</language>
${itensXml}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
